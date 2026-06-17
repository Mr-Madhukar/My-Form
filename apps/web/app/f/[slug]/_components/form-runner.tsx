"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Star,
  Sparkles,
  Mail,
  Lock,
  Plus,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  Calendar,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Link2,
  Upload,
} from "lucide-react";
import { buildResponseSchema, zodForField, evaluateFieldVisibility, type FieldType, type FormTheme, type FieldCondition } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { themeToCSSVars, hexToRgba } from "~/lib/theme";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Field = {
  id: string;
  order: number;
  type: string;
  label: string;
  required: boolean;
  config: Record<string, unknown>;
};

type AiFollowup = {
  fieldId: string;
  fieldLabel: string;
  userAnswer: string;
  aiQuestion: string;
  streaming: boolean;
};

type DebriefState =
  | { tag: "idle" }
  | { tag: "active"; index: number }
  | { tag: "saving" }
  | { tag: "done" };

type Props = {
  slug: string;
  title: string;
  description: string | null;
  theme: FormTheme | null | undefined;
  fields: Field[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRIENDLY_ERRORS: Record<string, string> = {
  rate_limited: "Too many submissions. Please wait a moment and try again.",
  not_accepting_responses: "This form is no longer accepting responses.",
  not_published: "This form is no longer accepting responses.",
  form_expired: "This form has expired and is no longer accepting responses.",
  response_limit_reached: "This form has reached its maximum number of responses.",
};

const TYPING_MS = 600;

type ChoiceOption = { id: string; label: string };
function optionsOf(f: Field): ChoiceOption[] {
  return (f.config.options as ChoiceOption[] | undefined) ?? [];
}

function formatAnswer(field: Field, value: unknown): string {
  if (field.type === "single_choice")
    return optionsOf(field).find((o) => o.id === value)?.label ?? "";
  if (field.type === "multiple_choice") {
    const ids = (value as string[] | undefined) ?? [];
    return ids.map((id) => optionsOf(field).find((o) => o.id === id)?.label ?? id).join(", ");
  }
  if (field.type === "rating") {
    const n = Number(value) || 0;
    return (field.config.style as string) === "number" ? `${n}` : "★".repeat(n);
  }
  return value == null ? "" : String(value);
}

function isFollowupEligible(f: Field): boolean {
  return (
    (f.type === "short_text" || f.type === "long_text") && f.config.aiFollowupEnabled !== false
  );
}

function coerceAndValidate(
  field: Field,
  rawValue: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const validator = zodForField({
    id: field.id,
    type: field.type as FieldType,
    required: field.required,
    config: field.config,
  });

  let value = rawValue;
  if (typeof value === "string" && value.trim() === "") value = undefined;
  if (field.type === "number" && typeof value === "string") {
    value = value === "" ? undefined : Number(value);
  }

  const result = validator.safeParse(value);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid answer" };
  }
  return { ok: true, value };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type SavedProgress = { step: number; values: Record<string, unknown>; fieldIds: string[] };

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-(--form-accent) text-[13px] font-semibold text-(--form-text-on-accent)">
      {initial}
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full border border-white/8 bg-[color-mix(in_srgb,var(--form-ai-accent)_18%,var(--form-avatar-bg))]">
      <Sparkles className="size-3.5 text-(--form-ai-accent)" />
    </div>
  );
}

function TypingDots({ color = "var(--form-text-muted)" }: { color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="size-1.5 rounded-full animate-typing-bounce"
          style={{ background: color, animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

function QuestionBubble({
  field,
  initial,
  faded,
}: {
  field: Field;
  initial: string;
  faded: boolean;
}) {
  return (
    <div className={cn("flex items-end gap-2.5 animate-bubble-in-left", faded && "opacity-60")}>
      <Avatar initial={initial} />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        {field.label}
        {field.required && <span className="ml-1 text-(--form-accent)">*</span>}
      </div>
    </div>
  );
}

function AnswerBubble({
  text,
  faded,
  onEdit,
}: {
  text: string;
  faded: boolean;
  onEdit?: () => void;
}) {
  if (!onEdit) {
    return (
      <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
        <div className="max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-on-accent)">
          {text || "—"}
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "group flex items-center justify-end gap-2 animate-bubble-in-right",
        faded && "opacity-60",
      )}
    >
      <Pencil className="size-3 shrink-0 text-(--form-text-muted) opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
      <button
        type="button"
        onClick={onEdit}
        title="Edit answer"
        aria-label="Edit this answer"
        className="max-w-[80%] cursor-pointer whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-left text-[15px] leading-relaxed text-(--form-text-on-accent) transition-opacity hover:opacity-85"
      >
        {text || "—"}
      </button>
    </div>
  );
}

function AiFollowUpBubble({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-[color-mix(in_srgb,var(--form-ai-accent)_25%,transparent)] bg-(--form-surface) px-4 py-3">
        <span className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-3 text-(--form-ai-accent)" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--form-ai-accent)">AI</span>
        </span>
        <p aria-live="polite" className="text-[15px] leading-relaxed text-(--form-text-primary)">
          {text}
          {streaming && (
            <span className="ml-0.5 inline-block size-0.75 animate-pulse rounded-full bg-(--form-ai-accent) align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}

function AiFollowUpAnswer({
  text,
  skipped,
  faded,
}: {
  text: string | null;
  skipped?: boolean;
  faded?: boolean;
}) {
  if (skipped) {
    return (
      <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
        <span className="rounded-full border border-white/7 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#3A3A3A]">
          Skipped
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
      <div className="max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-on-accent)">
        {text}
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--form-accent)">
        <Check className="size-4 text-(--form-text-on-accent)" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        Thanks — we got it.
      </div>
    </div>
  );
}

function AllDoneState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        That&apos;s all — thank you for sharing!
      </div>
    </div>
  );
}

function DoneActions({ slug, onReset }: { slug: string; onReset: () => void }) {
  return (
    <div className="mt-2 flex animate-fade-up flex-col items-center gap-5 rounded-2xl border border-white/7 bg-(--form-surface) px-6 py-8 text-center">
      <p className="text-sm leading-relaxed text-(--form-text-muted)">
        Your response has been recorded.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="cursor-pointer rounded-full px-4 py-2 text-sm"
        >
          Submit another response
        </Button>
        <Link
          href={`/signup?utm_source=public_form&utm_medium=referral&utm_content=${encodeURIComponent(slug)}`}
          className="rounded-full bg-(--form-accent) px-4 py-2 text-sm font-medium text-(--form-text-on-accent) transition-opacity hover:opacity-90"
        >
          Create your own form
        </Link>
      </div>
      <Link
        href="/"
        className="font-mono text-[10px] uppercase tracking-widest text-(--form-text-muted) transition-colors hover:text-(--form-text-primary)"
      >
        Powered by My Form
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FormRunner({ slug, title, description, theme, fields }: Props) {
  const cssVars = useMemo(() => themeToCSSVars(theme), [theme]);
  const accent = cssVars["--form-accent"] ?? "#E8854A";
  const ordered = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);
  const initial = (title.trim()[0] ?? "F").toUpperCase();

  // Form state
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [channel, setChannel] = useState<"welcome" | "submit-response">("welcome");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Bumped on "Submit another response" so the typing-indicator effect refires even at step 0
  const [runKey, setRunKey] = useState(0);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const storageKey = `myform:f:${slug}`;

  // Background-prefetched AI follow-ups (keyed by fieldId)
  const [aiFollowups, setAiFollowups] = useState<Map<string, AiFollowup>>(new Map());
  const aiFollowupsRef = useRef<Map<string, AiFollowup>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Debrief state (shown after form submit)
  const [debrief, setDebrief] = useState<DebriefState>({ tag: "idle" });
  // Answers collected during debrief: fieldId → answer | null
  const [debriefAnswers, setDebriefAnswers] = useState<Map<string, string | null>>(new Map());

  const threadEndRef = useRef<HTMLDivElement>(null);
  // True while the user is at (or near) the bottom of the thread — auto-scroll only then,
  // so someone scrolling back up to reread isn't yanked down.
  const stickToBottomRef = useRef(true);

  const schema = useMemo(
    () =>
      buildResponseSchema(
        ordered.map((f) => ({
          id: f.id,
          type: f.type as FieldType,
          required: f.required,
          config: f.config,
        })),
      ),
    [ordered],
  );
  const defaultValues = useMemo(
    () => Object.fromEntries(ordered.map((f) => [f.id, f.type === "multiple_choice" ? [] : ""])),
    [ordered],
  );
  const form = useForm<Record<string, unknown>>({ resolver: zodResolver(schema), defaultValues });

  const submitMutation = trpc.forms.public.submit.useMutation();
  const saveFollowupsMutation = trpc.forms.public.saveFollowups.useMutation();

  const total = ordered.length;
  const current = ordered[step];

  // Conditional logic: evaluate which fields are visible based on current answers
  const fieldVisibility = useMemo(() => {
    const currentValues = form.getValues();
    return evaluateFieldVisibility(
      ordered.map((f) => ({
        id: f.id,
        required: f.required,
        conditions: (f.config.conditions as FieldCondition[] | undefined),
      })),
      currentValues,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, step]);

  // Helper to find the next visible step from a given index
  function findNextVisibleStep(fromStep: number): number {
    for (let i = fromStep; i < total; i++) {
      const vis = fieldVisibility.get(ordered[i]!.id);
      if (!vis || vis.visible) return i;
    }
    return total; // All remaining fields are hidden → submit
  }

  // Typing indicator on each new question
  useEffect(() => {
    if (step >= total) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), TYPING_MS);
    return () => clearTimeout(t);
  }, [step, total, runKey]);

  // Confetti from both bottom corners when done
  useEffect(() => {
    if (debrief.tag !== "done" || prefersReducedMotion()) return;
    const shared = {
      particleCount: 80,
      spread: 70,
      startVelocity: 55,
      ticks: 200,
      colors: [accent, cssVars["--form-text-primary"]!, "#FFD580", "#FF9F6B", "#FFFFFF"],
    };
    confetti({ ...shared, origin: { x: 0, y: 1 }, angle: 60 });
    confetti({ ...shared, origin: { x: 1, y: 1 }, angle: 120 });
  }, [debrief.tag, accent, cssVars]);

  // Keep ref in sync so finalize() reads fresh aiFollowups without stale closure
  useEffect(() => {
    aiFollowupsRef.current = aiFollowups;
  }, [aiFollowups]);

  // Track whether the user is near the bottom of the page
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      stickToBottomRef.current = window.innerHeight + window.scrollY >= doc.scrollHeight - 120;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll on discrete state transitions
  useEffect(() => {
    const t = setTimeout(() => {
      if (stickToBottomRef.current) {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [step, typing, submitted, debrief, debriefAnswers]);

  // Auto-scroll during AI streaming. Instant, not smooth: each smooth scroll cancels the
  // previous one, so with rapid chunks the animation restarts forever and never reaches bottom.
  useEffect(() => {
    requestAnimationFrame(() => {
      if (stickToBottomRef.current) {
        threadEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
      }
    });
  }, [aiFollowups]);

  // ---------------------------------------------------------------------------
  // Background AI prefetch — fires as soon as user answers a text field
  // ---------------------------------------------------------------------------
  const prefetchFollowup = useCallback((field: Field, answer: string) => {
    if (!isFollowupEligible(field)) return;

    // Cancel any previous fetch for this field
    abortControllers.current.get(field.id)?.abort();
    const ctrl = new AbortController();
    abortControllers.current.set(field.id, ctrl);

    // Optimistically mark as streaming
    setAiFollowups((prev) =>
      new Map(prev).set(field.id, {
        fieldId: field.id,
        fieldLabel: field.label,
        userAnswer: answer,
        aiQuestion: "",
        streaming: true,
      }),
    );

    void (async () => {
      try {
        const res = await fetch("/api/ai/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: field.label, answer }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
          return;
        }

        let fullText = "";
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          if (ctrl.signal.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          const trimmed = fullText.trim();
          setAiFollowups((prev) =>
            new Map(prev).set(field.id, {
              fieldId: field.id,
              fieldLabel: field.label,
              userAnswer: answer,
              aiQuestion: trimmed,
              streaming: true,
            }),
          );
        }

        const finalText = fullText.trim();
        if (finalText) {
          setAiFollowups((prev) =>
            new Map(prev).set(field.id, {
              fieldId: field.id,
              fieldLabel: field.label,
              userAnswer: answer,
              aiQuestion: finalText,
              streaming: false,
            }),
          );
        } else {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
        }
      } catch {
        if (!ctrl.signal.aborted) {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
        }
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Progress persistence — survive accidental refresh / tab close mid-form
  // ---------------------------------------------------------------------------
  const persistProgress = useCallback(
    (nextStep: number) => {
      try {
        const snapshot: SavedProgress = {
          step: nextStep,
          values: form.getValues(),
          fieldIds: ordered.map((f) => f.id),
        };
        sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
      } catch {
        // Storage unavailable (private mode, quota) — non-fatal
      }
    },
    [storageKey, form, ordered],
  );

  // Restore saved progress on mount; refire AI prefetch for restored text answers
  // since in-memory follow-ups were lost on reload.
  useEffect(() => {
    let saved: SavedProgress;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      saved = JSON.parse(raw) as SavedProgress;
    } catch {
      return;
    }

    const ids = ordered.map((f) => f.id);
    const valid =
      Array.isArray(saved.fieldIds) &&
      saved.fieldIds.length === ids.length &&
      saved.fieldIds.every((id, i) => id === ids[i]) &&
      typeof saved.step === "number" &&
      saved.step > 0 &&
      saved.values !== null &&
      typeof saved.values === "object";
    if (!valid) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      return;
    }

    // step === total means a submit was in flight when the page closed — re-ask the last question
    const restoredStep = Math.min(saved.step, ids.length - 1);
    form.reset({ ...defaultValues, ...saved.values });
    setStep(restoredStep);
    for (const f of ordered.slice(0, restoredStep)) {
      const v = saved.values[f.id];
      if (typeof v === "string" && v.trim()) prefetchFollowup(f, v.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Form answer validation + advance
  // ---------------------------------------------------------------------------
  function validateAndAdvance(rawValue: unknown) {
    if (typing || !current) return;
    setFieldError(null);

    // Check if this field is visible and whether it's conditionally required
    const vis = fieldVisibility.get(current.id);
    const effectiveField = vis ? { ...current, required: vis.required } : current;

    const checked = coerceAndValidate(effectiveField, rawValue);
    if (!checked.ok) {
      setFieldError(checked.error);
      return;
    }

    form.setValue(current.id, checked.value === undefined ? "" : checked.value);
    persistProgress(step + 1);

    // Kick off background AI fetch immediately (non-blocking)
    if (typeof rawValue === "string" && rawValue.trim()) {
      prefetchFollowup(current, rawValue.trim());
    }

    // Skip hidden fields when advancing
    const nextStep = findNextVisibleStep(step + 1);
    if (nextStep >= total) {
      void finalize();
    } else {
      setStep(nextStep);
    }
  }

  // Edit a previously answered question (pre-submit only)
  const editingField = editingFieldId
    ? (ordered.find((f) => f.id === editingFieldId) ?? null)
    : null;

  function handleEditSubmit(rawValue: unknown) {
    if (!editingField) return;
    setFieldError(null);

    const checked = coerceAndValidate(editingField, rawValue);
    if (!checked.ok) {
      setFieldError(checked.error);
      return;
    }

    form.setValue(editingField.id, checked.value === undefined ? "" : checked.value);
    persistProgress(step);

    if (typeof rawValue === "string" && rawValue.trim()) {
      // Re-run the follow-up against the new answer
      prefetchFollowup(editingField, rawValue.trim());
    } else if (isFollowupEligible(editingField)) {
      // Answer cleared — drop any stale follow-up for it
      abortControllers.current.get(editingField.id)?.abort();
      setAiFollowups((prev) => {
        const m = new Map(prev);
        m.delete(editingField.id);
        return m;
      });
    }

    setEditingFieldId(null);
  }

  // ---------------------------------------------------------------------------
  // Submit form
  // ---------------------------------------------------------------------------
  async function finalize() {
    setBannerError(null);
    const values = form.getValues();
    try {
      const { id } = await submitMutation.mutateAsync({
        slug,
        answers: values,
        _gotcha: honeypotRef.current?.value ?? "",
      });
      setResponseId(id);
      setSubmitted(true);
      setEditingFieldId(null);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }

      // Determine if there are eligible follow-ups to show (use ref to avoid stale closure)
      const eligible = ordered.filter(
        (f) => isFollowupEligible(f) && aiFollowupsRef.current.has(f.id),
      );
      if (eligible.length > 0) {
        setDebrief({ tag: "active", index: 0 });
      } else {
        // No AI follow-ups — go straight to done so SuccessState renders
        setDebrief({ tag: "done" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setBannerError(FRIENDLY_ERRORS[msg] ?? "Something went wrong. Please try again.");
    }
  }

  // ---------------------------------------------------------------------------
  // Debrief: user answers (or skips) each AI follow-up
  // ---------------------------------------------------------------------------
  const eligibleFollowupFields = useMemo(
    () => ordered.filter((f) => isFollowupEligible(f) && aiFollowups.has(f.id)),
    [ordered, aiFollowups],
  );

  // Persist follow-ups with one retry; non-fatal on failure (shouldn't block UX)
  async function saveFollowupBatch(
    followups: { fieldId: string; aiQuestion: string; userAnswer: string | null }[],
  ) {
    if (!responseId || followups.length === 0) return;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await saveFollowupsMutation.mutateAsync({ responseId, followups });
        return;
      } catch {
        // retry once, then give up silently
      }
    }
  }

  async function handleDebriefAnswer(fieldId: string, answer: string | null) {
    setDebriefAnswers((prev) => new Map(prev).set(fieldId, answer));

    const fu = aiFollowups.get(fieldId);
    const toSave = fu?.aiQuestion
      ? [{ fieldId, aiQuestion: fu.aiQuestion, userAnswer: answer }]
      : [];

    const currentIdx = debrief.tag === "active" ? debrief.index : 0;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= eligibleFollowupFields.length) {
      setDebrief({ tag: "saving" });
      await saveFollowupBatch(toSave);
      setDebrief({ tag: "done" });
    } else {
      setDebrief({ tag: "active", index: nextIdx });
      // Save each answer as it lands so closing the tab mid-debrief loses nothing
      void saveFollowupBatch(toSave);
    }
  }

  async function handleSkipAll() {
    const currentIdx = debrief.tag === "active" ? debrief.index : 0;
    const remaining = eligibleFollowupFields.slice(currentIdx);

    // Stop any in-flight streams for skipped questions
    for (const f of remaining) abortControllers.current.get(f.id)?.abort();

    setDebriefAnswers((prev) => {
      const m = new Map(prev);
      for (const f of remaining) m.set(f.id, null);
      return m;
    });

    setDebrief({ tag: "saving" });
    const toSave = remaining
      .map((f) => {
        const fu = aiFollowups.get(f.id);
        if (!fu?.aiQuestion) return null;
        return { fieldId: f.id, aiQuestion: fu.aiQuestion, userAnswer: null };
      })
      .filter(Boolean) as { fieldId: string; aiQuestion: string; userAnswer: string | null }[];
    await saveFollowupBatch(toSave);
    setDebrief({ tag: "done" });
  }

  // Full reset for "Submit another response"
  const resetAll = useCallback(() => {
    for (const c of abortControllers.current.values()) c.abort();
    abortControllers.current.clear();
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    form.reset(defaultValues);
    setStep(0);
    setRunKey((k) => k + 1);
    setFieldError(null);
    setBannerError(null);
    setSubmitted(false);
    setResponseId(null);
    setEditingFieldId(null);
    setAiFollowups(new Map());
    setDebrief({ tag: "idle" });
    setDebriefAnswers(new Map());
    setChannel("welcome");
    window.scrollTo({ top: 0 });
  }, [form, defaultValues, storageKey]);

  // ---------------------------------------------------------------------------
  // Computed UI flags
  // ---------------------------------------------------------------------------
  const progressPct = submitted ? 100 : total === 0 ? 100 : (step / total) * 100;
  const counter = `${String(submitted ? total : step + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const currentDebriefField =
    debrief.tag === "active" ? (eligibleFollowupFields[debrief.index] ?? null) : null;
  const currentDebriefFollowup = currentDebriefField
    ? aiFollowups.get(currentDebriefField.id)
    : null;
  const waitingOnAi = currentDebriefFollowup?.streaming ?? false;

  const showFormFooter = !submitted && (!!current || !!editingField);
  const showDebriefFooter = debrief.tag === "active" && !!currentDebriefField && !waitingOnAi;
  const remainingFollowups =
    debrief.tag === "active" ? eligibleFollowupFields.length - debrief.index : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#313338] text-[#dbdee1] font-sans" style={cssVars}>
      {/* 1. Leftmost icon rail (Discord style) */}
      <div className="hidden sm:flex flex-col items-center py-3 w-[72px] bg-[#1e1f22] shrink-0 gap-2">
        {/* Guild icon (Form Icon) */}
        <div className="relative group flex items-center justify-center size-12 rounded-3xl hover:rounded-2xl bg-[#313338] text-[var(--form-accent)] hover:bg-[var(--form-accent)] hover:text-black transition-all duration-300 cursor-pointer font-bold text-lg shadow-lg">
          {initial}
          {/* Active indicator pill */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-5 bg-white rounded-r-md scale-y-0 group-hover:scale-y-100 transition-all duration-300" />
        </div>
        
        {/* Separator line */}
        <div className="w-8 h-[2px] bg-zinc-800 rounded my-1" />
        
        {/* Help icon */}
        <Link href="/help" className="flex items-center justify-center size-12 rounded-3xl hover:rounded-2xl bg-[#313338] text-zinc-400 hover:bg-[#23a55a] hover:text-white transition-all duration-300 cursor-pointer">
          <HelpCircle className="size-5" />
        </Link>
      </div>

      {/* 2. Channels list sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col w-[240px] bg-[#2b2d31] border-r border-[#1e1f22] shrink-0 transition-transform duration-300 sm:relative sm:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      )}>
        {/* Channel Header (Server Name) */}
        <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 font-bold text-white shadow-sm truncate">
          {title}
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          <div>
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#949ba4] font-mono">Channels</p>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => {
                  if (submitted) return; // disable if form is completed
                  setChannel("welcome");
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors font-medium cursor-pointer",
                  channel === "welcome"
                    ? "bg-[#35373c] text-white"
                    : "text-[#949ba4] hover:bg-[#35373c]/40 hover:text-[#dbdee1]"
                )}
              >
                <span className="text-zinc-500 font-semibold text-base">#</span>
                welcome
              </button>

              <button
                onClick={() => {
                  setChannel("submit-response");
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors font-medium cursor-pointer",
                  channel === "submit-response"
                    ? "bg-[#35373c] text-white"
                    : "text-[#949ba4] hover:bg-[#35373c]/40 hover:text-[#dbdee1]"
                )}
              >
                <span className="text-zinc-500 font-semibold text-base">#</span>
                submit-response
              </button>
            </div>
          </div>
        </div>

        {/* User profile section at bottom of sidebar */}
        <div className="h-[52px] bg-[#232428] flex items-center px-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[var(--form-accent)] flex items-center justify-center font-bold text-black text-xs">
              U
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate leading-none">Respondent</span>
              <span className="text-[10px] text-zinc-400 leading-none mt-1">Anonymous User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/60 sm:hidden"
        />
      )}

      {/* 3. Main chat panel */}
      <div className="flex-1 flex flex-col bg-[#313338] min-w-0 h-full">
        {/* Main top header */}
        <header className="h-12 border-b border-[#1e1f22] shrink-0 flex items-center px-4 justify-between bg-[#313338] shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger button on mobile */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-850"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-zinc-500 font-semibold text-lg shrink-0">#</span>
            <span className="font-bold text-white text-sm shrink-0">{channel}</span>
            <div className="hidden sm:block w-[1px] h-4 bg-[#232428] mx-2" />
            <span className="hidden sm:inline text-xs text-[#949ba4] truncate">{description || "Fill out the form below."}</span>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {channel === "welcome" ? (
            /* Welcome view */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6">
              <div className="size-20 rounded-full bg-[#1e1f22] flex items-center justify-center shadow-lg border border-zinc-800">
                <span className="text-3xl font-extrabold text-[var(--form-accent)]">{initial}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{title}</h2>
                {description && <p className="text-sm text-[#949ba4] leading-relaxed">{description}</p>}
              </div>
              <Button
                onClick={() => setChannel("submit-response")}
                className="px-6 py-2.5 rounded-xl font-semibold bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_95%,#000)] text-[#0a0a0a] transition-all cursor-pointer shadow-md"
              >
                Get Started
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            /* submit-response view */
            <div className="flex-1 flex flex-col">
              {!submitted ? (
                /* Question slider */
                <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto w-full">
                  <div className="w-full bg-[#2b2d31]/40 border border-white/[0.03] rounded-2xl p-8 shadow-xl space-y-6 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-4">
                      {/* Form title watermark */}
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#949ba4] block leading-none">
                        {title}
                      </span>
                      
                      {/* Active Question */}
                      {current ? (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                            {current.label}
                            {current.required && <span className="text-[var(--form-accent)] ml-1">*</span>}
                          </h3>

                          {/* Error banner */}
                          {fieldError && (
                            <p role="alert" className="text-xs font-semibold text-red-400">
                              {fieldError}
                            </p>
                          )}

                          {/* Question Input ReplyArea */}
                          <div className="mt-2">
                            <ReplyArea
                              key={current.id}
                              field={current}
                              disabled={typing || submitMutation.isPending}
                              pending={submitMutation.isPending}
                              onSubmit={validateAndAdvance}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center py-12">
                          <Loader2 className="size-6 animate-spin text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Footer / navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-auto">
                      <div className="flex items-center gap-1.5">
                        {step > 0 && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setFieldError(null);
                              setStep(step - 1);
                            }}
                            className="h-8 rounded-lg px-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
                          >
                            <ArrowLeft className="size-3.5 mr-1" />
                            Back
                          </Button>
                        )}
                      </div>
                      <span className="font-mono text-xs text-zinc-500 font-bold">
                        {step + 1} / {total}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat view for AI debrief or finished success */
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Message stream */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Bot initial success message */}
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-full bg-[#1e1f22] flex items-center justify-center shrink-0 border border-zinc-800">
                        <span className="text-sm font-extrabold text-[var(--form-accent)]">{initial}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">MyForm Bot</span>
                          <span className="bg-[#5865f2] text-white text-[9px] px-1 rounded font-bold tracking-wider leading-none py-0.5">BOT</span>
                          <span className="text-[10px] text-zinc-500 font-medium">Just now</span>
                        </div>
                        <div className="text-zinc-200 text-sm leading-relaxed">
                          Your response has been successfully submitted! Thank you.
                        </div>
                      </div>
                    </div>

                    {/* AI debrief chat bubbles */}
                    {eligibleFollowupFields.map((field, i) => {
                      const fu = aiFollowups.get(field.id);
                      if (!fu) return null;

                      const isCurrentDebrief = debrief.tag === "active" && debrief.index === i;
                      const isPastDebrief = debriefAnswers.has(field.id);
                      if (!isCurrentDebrief && !isPastDebrief) return null;

                      const userAnswer = debriefAnswers.get(field.id);

                      return (
                        <div key={`fu-${field.id}`} className="space-y-6">
                          {/* AI question message */}
                          <div className="flex items-start gap-4">
                            <div className="size-10 rounded-full border border-[color-mix(in_srgb,var(--form-ai-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--form-ai-accent)_15%,transparent)] flex items-center justify-center shrink-0">
                              <Sparkles className="size-4 text-(--form-ai-accent)" />
                            </div>
                            <div className="space-y-1 w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">AI Follow-up Assistant</span>
                                <span className="bg-purple-600 text-white text-[9px] px-1 rounded font-bold tracking-wider leading-none py-0.5">AI</span>
                                <span className="text-[10px] text-zinc-500 font-medium">Just now</span>
                              </div>
                              <div className="text-zinc-200 text-sm leading-relaxed">
                                {fu.aiQuestion ? (
                                  fu.aiQuestion
                                ) : (
                                  <div className="flex items-center gap-1.5 py-1">
                                    <Loader2 className="size-3 animate-spin text-zinc-500" />
                                    <span className="text-xs text-zinc-500">AI is thinking...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* User reply message */}
                          {isPastDebrief && (
                            <div className="flex items-start gap-4">
                              <div className="size-10 rounded-full bg-[var(--form-accent)] flex items-center justify-center shrink-0 font-bold text-black text-xs">
                                U
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">Respondent</span>
                                  <span className="text-[10px] text-zinc-500 font-medium">Just now</span>
                                </div>
                                <div className="text-zinc-200 text-sm leading-relaxed italic bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl">
                                  {userAnswer === null ? "Skipped follow-up." : userAnswer}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Finished state & Done actions */}
                    {debrief.tag === "done" && (
                      <div className="pt-6 border-t border-white/[0.04] max-w-md mx-auto">
                        <DoneActions slug={slug} onReset={resetAll} />
                      </div>
                    )}

                    <div ref={threadEndRef} />
                  </div>

                  {/* Debrief reply chat bar at bottom */}
                  {showDebriefFooter && currentDebriefField && (
                    <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22]">
                      <div className="max-w-2xl mx-auto space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#949ba4] flex items-center justify-between">
                          <span>AI Follow-up · Question {debrief.index + 1} of {eligibleFollowupFields.length}</span>
                          {remainingFollowups > 1 && (
                            <button onClick={() => void handleSkipAll()} className="text-zinc-500 hover:text-white underline cursor-pointer">
                              Skip all
                            </button>
                          )}
                        </p>
                        <FollowupReplyArea
                          key={currentDebriefField.id}
                          onSubmit={(a) => void handleDebriefAnswer(currentDebriefField.id, a)}
                          onSkip={() => void handleDebriefAnswer(currentDebriefField.id, null)}
                          pending={saveFollowupsMutation.isPending}
                        />
                      </div>
                    </div>
                  )}

                  {/* Loading/Streaming indicator */}
                  {debrief.tag === "active" && waitingOnAi && (
                    <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22] flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-[var(--form-accent)]" />
                        AI is typing...
                      </div>
                      <Button onClick={() => void handleDebriefAnswer(currentDebriefField!.id, null)} className="h-8 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 cursor-pointer">
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Input
        unstyled
        ref={honeypotRef}
        type="text"
        name="_gotcha"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reply areas (form fields)
// ---------------------------------------------------------------------------

type ReplyAreaProps = {
  field: Field;
  disabled: boolean;
  pending: boolean;
  initialValue?: unknown;
  onSubmit: (value: unknown) => void;
};

function ReplyArea({ field, disabled, pending, initialValue, onSubmit }: ReplyAreaProps) {
  const initialText =
    initialValue == null || initialValue === "" ? "" : String(initialValue);
  switch (field.type) {
    case "long_text":
      return (
        <LongTextReply
          field={field}
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "single_choice":
      return <SingleChoiceReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "multiple_choice":
      return (
        <MultipleChoiceReply
          field={field}
          disabled={disabled}
          pending={pending}
          initialValue={Array.isArray(initialValue) ? (initialValue as string[]) : []}
          onSubmit={onSubmit}
        />
      );
    case "rating":
      return <RatingReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "date":
      return (
        <TextReply
          field={field}
          inputType="date"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "email":
      return (
        <TextReply
          field={field}
          inputType="email"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "number":
      return (
        <TextReply
          field={field}
          inputType="number"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "file_upload":
      return <FileUploadReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "time":
      return (
        <TextReply
          field={field}
          inputType="time"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "url":
      return (
        <TextReply
          field={field}
          inputType="url"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    default:
      return (
        <TextReply
          field={field}
          inputType="text"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
  }
}

function FollowupReplyArea({
  onSubmit,
  onSkip,
  pending,
}: {
  onSubmit: (a: string) => void;
  onSkip: () => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <Textarea
        unstyled
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }
        }}
        placeholder="Share more…"
        rows={1}
        autoFocus
        disabled={pending}
        className="max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/8 bg-(--form-surface) px-4 py-2.5 text-[15px] leading-relaxed text-(--form-text-primary) outline-none transition-colors field-sizing-content placeholder:text-(--form-text-muted) focus:border-[color-mix(in_srgb,var(--form-accent)_50%,transparent)] disabled:opacity-50"
      />
      <Button
        type="button"
        onClick={onSkip}
        disabled={pending}
        className="cursor-pointer shrink-0 rounded-full px-3 py-2 text-xs transition-all disabled:opacity-40"
      >
        Skip
      </Button>
      <Button
        type="submit"
        disabled={pending || !value.trim()}
        aria-label="Send reply"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--form-accent) text-(--form-text-on-accent) transition-all hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
      </Button>
    </form>
  );
}

function SendButton({
  disabled,
  pending,
  label = "Send",
}: {
  disabled: boolean;
  pending?: boolean;
  label?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={disabled}
      aria-label={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--form-accent) text-(--form-text-on-accent) transition-all hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
    </Button>
  );
}

function TextReply({
  field,
  inputType,
  disabled,
  initialValue = "",
  onSubmit,
}: {
  field: Field;
  inputType: string;
  disabled: boolean;
  initialValue?: string;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const ph = (field.config.placeholder as string | undefined) ?? "";

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  let Icon = FileText;
  if (inputType === "email") Icon = Mail;
  else if (inputType === "number") Icon = Hash;
  else if (inputType === "date") Icon = Calendar;
  else if (inputType === "time") Icon = Clock;
  else if (inputType === "url") Icon = Link2;

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor={field.id} className="sr-only">
        {field.label}
      </label>
      <div className="relative flex items-center w-full">
        <Input
          unstyled
          ref={inputRef}
          id={field.id}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ph || "Type your answer here..."}
          maxLength={field.config.maxLength as number | undefined}
          min={field.config.min as number | undefined}
          max={field.config.max as number | undefined}
          disabled={disabled}
          autoComplete="off"
          aria-required={field.required}
          className="w-full bg-[#1e1f22] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--form-accent)] focus:ring-1 focus:ring-[var(--form-accent)]/20 transition-all scheme-dark"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <Icon className="size-4 text-zinc-500" />
        </div>
      </div>
      <div className="flex items-center justify-start">
        <Button
          type="submit"
          disabled={disabled || (field.required && !value.trim())}
          className="px-5 py-2 h-9 rounded-lg bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,#000)] text-[#0a0a0a] font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </form>
  );
}

function FileUploadReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (v: unknown) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeMb = (field.config?.maxSizeMb as number) ?? 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > maxSizeMb * 1024 * 1024) {
        alert(`File size exceeds the maximum limit of ${maxSizeMb}MB`);
        return;
      }
      setFile(selected);
      setUploading(true);
      setProgress(0);
      setFileUrl(null);

      const formData = new FormData();
      formData.append("file", selected);

      try {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const res = JSON.parse(xhr.responseText) as { url: string };
              setFileUrl(res.url);
            } catch {
              alert("Failed to parse server response");
              setFile(null);
            }
          } else {
            alert("Upload failed. Please try again.");
            setFile(null);
          }
          setUploading(false);
        });

        xhr.addEventListener("error", () => {
          alert("Upload failed. Please try again.");
          setFile(null);
          setUploading(false);
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed. Please try again.");
        setFile(null);
        setUploading(false);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setFileUrl(null);
    setProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
        id={`file-input-${field.id}`}
      />
      
      {!file ? (
        <label
          htmlFor={`file-input-${field.id}`}
          className={cn(
            "flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-8 bg-[#1e1f22] cursor-pointer hover:border-[var(--form-accent)]/40 hover:bg-white/[0.01] transition-all",
            (disabled || uploading) && "pointer-events-none opacity-40"
          )}
        >
          <Upload className="size-8 text-zinc-500 mb-3" />
          <span className="text-sm font-medium text-white">Click to upload or drag &amp; drop</span>
          <span className="text-xs text-zinc-500 mt-1">Maximum file size: {maxSizeMb}MB</span>
        </label>
      ) : (
        <div className="border border-white/10 rounded-xl p-4 bg-[#1e1f22] flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            {(uploading || progress > 0) && (
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[var(--form-accent)] h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {fileUrl && (
              <p className="text-[10px] text-emerald-400 mt-1.5 font-mono truncate">
                Saved! URL: {fileUrl}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2.5 rounded-lg border-0"
          >
            Remove
          </Button>
        </div>
      )}

      <div className="flex items-center justify-start">
        <Button
          type="button"
          onClick={() => {
            if (fileUrl) {
              onSubmit(fileUrl);
            }
          }}
          disabled={disabled || uploading || !fileUrl || (field.required && !fileUrl)}
          className="px-5 py-2 h-9 rounded-lg bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,#000)] text-[#0a0a0a] font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function LongTextReply({
  field,
  disabled,
  initialValue = "",
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  initialValue?: string;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ph = (field.config.placeholder as string | undefined) ?? "";

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  return (
    <form
      className="space-y-4 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor={field.id} className="sr-only">
        {field.label}
      </label>
      <Textarea
        unstyled
        ref={textareaRef}
        id={field.id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(value);
          }
        }}
        placeholder={ph || "Type your answer here..."}
        maxLength={field.config.maxLength as number | undefined}
        rows={3}
        disabled={disabled}
        aria-required={field.required}
        className="w-full bg-[#1e1f22] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--form-accent)] focus:ring-1 focus:ring-[var(--form-accent)]/20 transition-all resize-none overflow-y-auto"
      />
      <div className="flex items-center justify-start">
        <Button
          type="submit"
          disabled={disabled || (field.required && !value.trim())}
          className="px-5 py-2 h-9 rounded-lg bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,#000)] text-[#0a0a0a] font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </form>
  );
}

function SingleChoiceReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (v: unknown) => void;
}) {
  return (
    <div role="group" aria-label={field.label} className="flex flex-col gap-2 w-full">
      {optionsOf(field).map((opt) => (
        <button
          type="button"
          key={opt.id}
          disabled={disabled}
          onClick={() => onSubmit(opt.id)}
          className="w-full text-left p-3 rounded-xl border border-white/5 bg-[#1e1f22] text-zinc-355 hover:border-[var(--form-accent)] hover:bg-white/5 transition-all text-xs font-medium cursor-pointer disabled:opacity-40"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultipleChoiceReply({
  field,
  disabled,
  pending,
  initialValue,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  pending: boolean;
  initialValue?: string[];
  onSubmit: (v: unknown) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialValue ?? []);
  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  return (
    <form
      className="flex flex-col gap-4 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(selected);
      }}
    >
      <div role="group" aria-label={field.label} className="flex flex-col gap-2 w-full">
        {optionsOf(field).map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <button
              type="button"
              key={opt.id}
              disabled={disabled}
              onClick={() => toggle(opt.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer disabled:opacity-40 flex items-center justify-between",
                on
                  ? "border-[var(--form-accent)] bg-[var(--form-accent)]/10 text-white"
                  : "border-white/5 bg-[#1e1f22] text-[#dbdee1] hover:border-[var(--form-accent)] hover:bg-white/5"
              )}
            >
              <span>{opt.label}</span>
              {on && <Check className="size-3.5 text-[var(--form-accent)]" />}
            </button>
          );
        })}
      </div>
      <div>
        <Button
          type="submit"
          disabled={disabled || (field.required && selected.length === 0)}
          className="px-5 py-2 h-9 rounded-lg bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,#000)] text-[#0a0a0a] font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Next"}
        </Button>
      </div>
    </form>
  );
}

function RatingReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (v: unknown) => void;
}) {
  const scale = (field.config.scale as number) ?? 5;
  const style = (field.config.style as "star" | "number") ?? "star";
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-4 w-full">
      <div role="group" aria-label={`Rating out of ${scale}`} className="flex flex-wrap gap-2">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => {
          const active = n <= (hover || selectedRating || 0);
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setSelectedRating(n)}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-40",
                active
                  ? "border-[var(--form-accent)] bg-[var(--form-accent)]/10 text-[var(--form-accent)] shadow-sm"
                  : "border-white/5 bg-[#1e1f22] text-zinc-400 hover:border-[var(--form-accent)]/50"
              )}
            >
              {style === "star" ? (
                <Star className={cn("size-5", active && "fill-[var(--form-accent)]")} />
              ) : (
                <span className="text-sm font-semibold">{n}</span>
              )}
            </button>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          onClick={() => selectedRating && onSubmit(selectedRating)}
          disabled={disabled || (field.required && selectedRating === null)}
          className="px-5 py-2 h-9 rounded-lg bg-[var(--form-accent)] hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,#000)] text-[#0a0a0a] font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Re-export for page-level use if needed
export { AiFollowUpBubble };
