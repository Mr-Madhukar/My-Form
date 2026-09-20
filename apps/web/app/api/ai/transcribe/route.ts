import { generateText } from "ai";
import { aiModel } from "~/lib/ai";
import { clientIp, rateLimit } from "~/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed } = await rateLimit(`ai:transcribe:${ip}`, 30, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return new Response(JSON.stringify({ error: "Groq API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const incomingFormData = await req.formData();
    const file = incomingFormData.get("file") as Blob | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build Groq Whisper multipart payload
    const groqFormData = new FormData();
    groqFormData.append("file", file, "audio.webm");
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0.2");
    // Context prompt to help Whisper accurately transcribe Indian English, Hindi, and mixed Hinglish
    groqFormData.append(
      "prompt",
      "Transcribe respondent voice answer accurately in natural spoken language, code-mixed Hinglish, Hindi, or English."
    );

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Transcribe] Groq Whisper error:", errText);
      return new Response(JSON.stringify({ error: "Transcription service failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = (await groqRes.json()) as { text?: string };
    const rawText = data.text?.trim() ?? "";

    if (!rawText) {
      return new Response(JSON.stringify({ text: "", raw: "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Smart cleanup using lightweight LLM: removes fillers ("uh", "um", "matlab") without altering language or slang
    let cleanedText = rawText;
    try {
      const polished = await generateText({
        model: aiModel,
        system:
          "You are a speech-to-text transcript polisher. Remove accidental stuttering, repeated words, and vocal filler sounds (like 'uh', 'um', 'ah', 'matlab', 'actually', 'like', 'you know') while strictly preserving the speaker's original language, script, slang, phrasing, and intended meaning. Do NOT translate or rephrase. Output ONLY the polished text with proper capitalization and punctuation.",
        prompt: `Raw speech transcription:\n"${rawText}"\n\nCleaned text:`,
        maxOutputTokens: 250,
      });

      const candidate = polished.text.trim().replace(/^["']|["']$/g, "");
      if (candidate.length > 0) {
        cleanedText = candidate;
      }
    } catch {
      // If polisher fails or times out, fallback seamlessly to raw Whisper output
      cleanedText = rawText;
    }

    return new Response(JSON.stringify({ text: cleanedText, raw: rawText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Transcribe] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
