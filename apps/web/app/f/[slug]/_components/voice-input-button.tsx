"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type VoiceInputButtonProps = {
  readonly onTranscript: (text: string) => void;
  readonly onInterim?: (interim: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly size?: "sm" | "md";
};

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

function initSpeechRecognition(
  onInterim: (text: string) => void,
): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SpeechRecognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i]?.[0]?.transcript ?? "";
      }
      if (interimTranscript) {
        onInterim(interimTranscript);
      }
    };
    recognition.onerror = () => {
      // Fallback quietly; Whisper is the primary engine
    };
    recognition.start();
    return recognition;
  } catch {
    return null;
  }
}

// Clean up streams & timers
function stopStreamsAndTimer(
  timerRef: React.RefObject<NodeJS.Timeout | null>,
  recognitionRef: React.RefObject<SpeechRecognitionLike | null>,
  mediaRecorderRef: React.RefObject<MediaRecorder | null>,
  streamRef: React.RefObject<MediaStream | null>,
) {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  if (recognitionRef.current) {
    try {
      recognitionRef.current.abort();
    } catch {
      // Ignore abort errors
    }
    recognitionRef.current = null;
  }
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    try {
      mediaRecorderRef.current.stop();
    } catch {
      // Ignore stop errors
    }
  }
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
}

export function VoiceInputButton({
  onTranscript,
  onInterim,
  disabled = false,
  className,
  size = "md",
}: VoiceInputButtonProps) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Clean up streams & timers on unmount
  const stopAll = useCallback(() => {
    stopStreamsAndTimer(timerRef, recognitionRef, mediaRecorderRef, streamRef);
  }, []);

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // Start recording
  const startRecording = async () => {
    if (disabled || state !== "idle") return;

    audioChunksRef.current = [];
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      if (onInterim) {
        recognitionRef.current = initSpeechRecognition(onInterim);
      }
    } catch (err: unknown) {
      console.error("[VoiceInput] Microphone permission denied or failed:", err);
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        toast.error("Microphone access was denied. Please allow mic permissions in your browser.");
      } else {
        toast.error("Could not access microphone.");
      }
      stopAll();
      setState("idle");
    }
  };

  // Stop recording and send audio to /api/ai/transcribe
  const stopAndTranscribe = async () => {
    if (state !== "recording" || !mediaRecorderRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    setState("transcribing");

    const recorder = mediaRecorderRef.current;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const audioBlob = new Blob(audioChunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    });

    if (audioBlob.size === 0) {
      toast.error("No audio recorded.");
      setState("idle");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription request failed");
      }

      const result = (await response.json()) as { text?: string };
      const transcribedText = result.text?.trim() ?? "";

      if (transcribedText) {
        onTranscript(transcribedText);
        toast.success("Voice transcribed!", { duration: 2000 });
      } else {
        toast.info("No speech detected. Please try again.");
      }
    } catch (err) {
      console.error("[VoiceInput] Transcription error:", err);
      toast.error("Failed to transcribe audio. Please try again.");
    } finally {
      setState("idle");
      audioChunksRef.current = [];
    }
  };

  // Cancel recording without transcribing
  const cancelRecording = () => {
    stopAll();
    audioChunksRef.current = [];
    setState("idle");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (state === "recording") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[#E8854A]/30 bg-[#161311] px-2.5 py-1 shadow-lg shadow-[#E8854A]/10 animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Pulsing indicator & live timer */}
        <div className="flex items-center gap-1.5 pl-1 font-mono text-xs text-[#E8854A]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8854A] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#E8854A]" />
          </span>
          <span className="tabular-nums font-semibold">{formatTime(elapsed)}</span>
        </div>

        {/* Equalizer animation bars */}
        <div className="flex items-center gap-0.5 px-1 h-3">
          <span className="w-0.5 h-3 bg-[#E8854A] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-0.5 h-2 bg-[#E8854A] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-0.5 h-3.5 bg-[#E8854A] rounded-full animate-bounce" />
          <span className="w-0.5 h-2 bg-[#E8854A] rounded-full animate-bounce [animation-delay:-0.2s]" />
        </div>

        {/* Action: Stop & Transcribe */}
        <button
          type="button"
          onClick={stopAndTranscribe}
          title="Finish recording and transcribe"
          className="flex size-7 items-center justify-center rounded-full bg-[#E8854A] text-black font-semibold hover:bg-[#ff9557] transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Check className="size-3.5 stroke-[2.5]" />
        </button>

        {/* Action: Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          title="Cancel recording"
          className="flex size-6 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  if (state === "transcribing") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-3 py-1 font-mono text-xs text-zinc-300 animate-pulse",
          className
        )}
      >
        <Loader2 className="size-3.5 animate-spin text-[#E8854A]" />
        <span>Transcribing...</span>
      </div>
    );
  }

  // Idle state button
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      title="Answer using voice (Hindi, English, Hinglish)"
      className={cn(
        "group relative flex items-center justify-center rounded-full border border-white/10 bg-[#18181b] text-zinc-400 transition-all duration-200 hover:border-[#E8854A]/40 hover:bg-[#E8854A]/10 hover:text-[#E8854A] focus:outline-none focus:ring-1 focus:ring-[#E8854A]/30 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        size === "sm" ? "size-8" : "size-9",
        className
      )}
    >
      <Mic className={cn(size === "sm" ? "size-3.5" : "size-4", "transition-transform group-hover:scale-110")} />
    </button>
  );
}
