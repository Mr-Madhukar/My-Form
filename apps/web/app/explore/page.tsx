"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "~/public/logo.png";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Inbox,
  Layers,
  Loader2,
  Sun,
  Moon,
  Search,
  Compass,
  FileText,
  Sparkles,
  Eye,
  ArrowLeft,
  Star,
  CheckCircle2,
  Calendar,
  Layers2,
  HelpCircle,
  Hash,
  Gamepad2,
  Users,
  Briefcase,
  GraduationCap,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/stores/auth";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "motion/react";
import { STATIC_TEMPLATES, type FormTemplate, type TemplateField } from "./_templates/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";

const ACCENT = "#E8854A";
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-4",
];

type ExploreForm = {
  id: string;
  publicSlug: string;
  title: string;
  description: string | null;
  responseCount: number;
  fieldCount: number;
  publishedAt: Date | string | null;
};

function ExploreCard({ form, index }: { form: ExploreForm; index: number }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        SPANS[index % SPANS.length],
        "animate-fade-up col-span-1",
        "group relative rounded-[1.75rem] bg-white/2 p-1.5 ring-1 ring-white/6",
        `transition-all duration-500 ${EASE}`,
        "hover:ring-white/12",
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ${EASE} group-hover:opacity-100`}
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(232,133,74,0.18), transparent 45%)",
        }}
      />

      {/* Inner core */}
      <div className="relative flex h-full min-h-40 flex-col gap-3 overflow-hidden rounded-[1.4rem] bg-[#111] p-5">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-white">
          {form.title}
        </h3>

        {/* Description */}
        {form.description && (
          <p className="line-clamp-2 text-xs text-[#6B6B6B] leading-relaxed">{form.description}</p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5A5A5A]">
              <Inbox className="size-3" />
              {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5A5A5A]">
              <Layers className="size-3" />
              {form.fieldCount} {form.fieldCount === 1 ? "field" : "fields"}
            </span>
          </div>

          {form.publishedAt && (
            <span className="font-mono text-[10px] text-[#4A4A4A]">
              {formatDistanceToNow(new Date(form.publishedAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* CTA — slides up on hover */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4",
            "bg-linear-to-t from-[#111] via-[#111]/90 to-transparent pt-10",
            "translate-y-2 opacity-0",
            `transition-all duration-500 ${EASE}`,
            "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
            "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          )}
        >
          <Link
            href={`/f/${form.publicSlug}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium",
              "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
              `transition-all duration-300 ${EASE}`,
              "hover:bg-[#E8854A]/20 hover:ring-[#E8854A]/40",
            )}
          >
            Fill out
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TemplateVisualPreview({ template }: { template: FormTemplate }) {
  const accent = template.theme.accentColor;
  const glow = hexToRgba(accent, 0.2);

  // Custom graphics based on category to make them feel highly customized:
  let previewGraphic = null;

  if (template.category === "Gaming") {
    previewGraphic = (
      <div className="absolute inset-0 flex items-center justify-between px-6 opacity-35">
        <div className="h-12 w-12 rounded-full border border-dashed border-violet-500/30 flex items-center justify-center">
          <div className="h-5 w-1 bg-violet-500/30 rounded-full" />
          <div className="h-1 w-5 bg-violet-500/30 rounded-full -ml-3" />
        </div>
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-violet-500/30" />
          <div className="size-2.5 rounded-full bg-violet-500/30 mt-2.5" />
        </div>
      </div>
    );
  } else if (template.category === "Entertainment") {
    previewGraphic = (
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-30">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 text-pink-500/50 fill-pink-500/20" />
        ))}
      </div>
    );
  } else if (template.category === "Product") {
    previewGraphic = (
      <div className="absolute inset-x-8 bottom-3 flex items-end gap-1.5 h-12 opacity-20">
        <div className="flex-1 bg-sky-500 h-[35%] rounded-t-sm" />
        <div className="flex-1 bg-sky-500 h-[70%] rounded-t-sm" />
        <div className="flex-1 bg-sky-500 h-[45%] rounded-t-sm" />
        <div className="flex-1 bg-sky-500 h-[85%] rounded-t-sm" />
      </div>
    );
  } else if (template.category === "Social") {
    previewGraphic = (
      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-20">
        <div className="size-7 rounded-full bg-orange-500/20 border border-orange-500/30" />
        <div className="size-7 rounded-full bg-orange-500/20 border border-orange-500/30 -ml-1.5" />
      </div>
    );
  }

  return (
    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-white/5 bg-[#090909] mb-4 flex flex-col justify-end p-3">
      {/* Decorative grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:10px_10px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Accent glow in corner */}
      <div
        className="absolute -right-6 -top-6 size-20 rounded-full blur-2xl opacity-60 transition-all duration-500 group-hover:scale-110"
        style={{ backgroundColor: accent }}
      />

      {previewGraphic}

      {/* Stylized input skeleton mockup */}
      <div className="relative z-10 space-y-1.5 w-full">
        <div className="flex gap-2">
          <div className="h-1.5 w-1/3 rounded-full bg-zinc-800" />
          <div className="h-1.5 w-1/4 rounded-full bg-zinc-800" />
        </div>
        <div className="h-5 w-full rounded-md border border-white/5 bg-zinc-950/80 px-2 flex items-center justify-between">
          <div className="h-1 w-1/2 rounded-full bg-zinc-800" />
          <div
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: accent }}
          />
        </div>
        <div className="flex justify-between items-center pt-0.5">
          <div className="h-1 w-10 rounded-full bg-zinc-800" />
          <div
            className="h-3.5 w-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: hexToRgba(accent, 0.1), border: `1px solid ${hexToRgba(accent, 0.25)}` }}
          >
            <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Entertainment: Sparkles,
  Gaming: Gamepad2,
  Product: Layers2,
  Social: Users,
  Hiring: Briefcase,
  Education: GraduationCap,
};

function TemplateCard({
  template,
  idx,
  onPreview,
  onUse,
  usingTemplateSlug,
}: {
  template: FormTemplate;
  idx: number;
  onPreview: () => void;
  onUse: () => void;
  usingTemplateSlug: string | null;
}) {
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const glowColor = hexToRgba(template.theme.accentColor, 0.12);
  const borderHoverColor = hexToRgba(template.theme.accentColor, 0.25);
  const textAccentColor = template.theme.accentColor;
  const CatIcon = CATEGORY_ICONS[template.category] ?? Compass;

  return (
    <div
      style={{
        animationDelay: `${idx * 40}ms`,
        borderColor: hovered ? borderHoverColor : "rgba(255,255,255,0.06)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className={cn(
        "animate-fade-up group relative rounded-2xl border bg-white/[0.01] p-4.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col justify-between"
      )}
    >
      {/* Spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
        style={{
          background: `radial-gradient(300px circle at var(--mx) var(--my), ${glowColor}, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* visual graphic preview */}
        <TemplateVisualPreview template={template} />

        {/* Badge row */}
        <div className="flex items-center justify-between mb-3.5">
          <span className={cn("flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.12em] px-2.5 py-0.5 rounded-md border", template.badgeColor)}>
            <CatIcon className="size-3 shrink-0" />
            {template.category}
          </span>
          <span className="font-mono text-[10px] text-[#5A5A5A]">{template.stat}</span>
        </div>

        {/* Header */}
        <h3
          style={{ color: hovered ? textAccentColor : "#ffffff" }}
          className="text-[15px] font-semibold tracking-tight mb-2 transition-colors duration-300"
        >
          {template.title}
        </h3>
        <p className="text-xs text-[#6B6B6B] leading-relaxed mb-5 line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex items-center gap-2 mt-auto pt-2">
        <Button
          variant="ghost"
          onClick={onPreview}
          className="flex-1 text-[11px] font-mono tracking-wider h-9 rounded-xl border border-white/6 text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <Eye className="size-3.5 mr-1" />
          Preview
        </Button>
        <Button
          onClick={onUse}
          disabled={usingTemplateSlug !== null}
          style={{
            background: hovered ? textAccentColor : "rgba(255,255,255,0.04)",
            color: hovered ? "#0a0a0a" : textAccentColor,
            border: hovered ? `1px solid ${textAccentColor}` : `1px solid ${hexToRgba(textAccentColor, 0.2)}`,
          }}
          className="flex-1 text-[11px] font-semibold h-9 rounded-xl cursor-pointer transition-all duration-300"
        >
          {usingTemplateSlug === template.slug ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Use Template"
          )}
        </Button>
      </div>
    </div>
  );
}

function TemplatePreviewDialogContent({
  template,
  usingTemplateSlug,
  onUse,
}: {
  template: FormTemplate;
  usingTemplateSlug: string | null;
  onUse: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const accentColor = template.theme.accentColor;
  const lightAccent = hexToRgba(accentColor, 0.15);
  const borderAccent = hexToRgba(accentColor, 0.3);

  const handleInputChange = (fieldId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <DialogContent className="max-w-3xl bg-[#0F0F0F] border-white/6 text-zinc-200 overflow-hidden p-0 gap-0 rounded-[1.75rem]">
      {/* Header band */}
      <div className="relative border-b border-white/6 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(400px circle at 10% 50%, ${template.theme.accentColor}30, transparent 60%)`,
          }}
        />
        <div className="relative">
          <span className={cn("text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md mb-2 inline-block", template.badgeColor)}>
            {template.category}
          </span>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">{template.title}</DialogTitle>
          <DialogDescription className="text-xs text-[#6B6B6B] mt-1 max-w-xl">
            {template.description}
          </DialogDescription>
        </div>
        <div className="relative shrink-0 flex items-center gap-2">
          <Button
            onClick={onUse}
            disabled={usingTemplateSlug !== null}
            className="bg-[#E8854A] text-[#0A0A0A] hover:bg-[#E8854A]/90 text-xs font-semibold px-4 py-2 h-9 rounded-xl cursor-pointer"
          >
            {usingTemplateSlug === template.slug ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Use Template"
            )}
          </Button>
        </div>
      </div>

      {/* Body - split design */}
      <div className="grid grid-cols-1 md:grid-cols-5 h-[480px]">
        {/* Left column: Template stats & fields list */}
        <div className="md:col-span-2 border-r border-white/6 p-6 overflow-y-auto bg-white/[0.01]">
          <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-4">Structure ({template.fields.length} fields)</h4>
          <div className="space-y-2.5">
            {template.fields.map((field, idx) => (
              <div key={field.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono text-[9px] text-[#4A4A4A] mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-[11px] font-medium text-zinc-300 leading-snug line-clamp-1">{field.label}</p>
                  <span className="text-[9px] font-mono text-[#5A5A5A] uppercase tracking-wider">{field.type.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Form Runner Mockup Preview */}
        <div className="md:col-span-3 p-6 overflow-y-auto flex flex-col bg-[#080808]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]">Interactive Preview</h4>
            {submitted && (
              <button
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="text-[9px] font-mono tracking-wider text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Reset Form
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-0 rounded-2xl bg-[#0f0f0f] border border-white/[0.06] overflow-hidden justify-between min-h-[340px] shadow-2xl">
            {/* Mock Browser Header Bar */}
            <div className="flex items-center justify-between bg-zinc-950 px-4 py-2 border-b border-white/[0.04] shrink-0">
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-red-500/80" />
                <div className="size-2 rounded-full bg-yellow-500/80" />
                <div className="size-2 rounded-full bg-green-500/80" />
              </div>
              <div className="px-3 py-0.5 rounded-md bg-white/5 border border-white/5 font-mono text-[8px] text-[#5A5A5A] truncate max-w-44">
                myform.com/f/{template.slug}
              </div>
              <div className="w-10" />
            </div>

            <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-center">
              {submitted ? (
                <div className="text-center space-y-3 py-6 animate-fade-in">
                  <div
                    className="mx-auto size-12 rounded-full flex items-center justify-center border"
                    style={{ borderColor: borderAccent, backgroundColor: lightAccent }}
                  >
                    <Check className="size-6" style={{ color: accentColor }} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white">Response Submitted!</h5>
                    <p className="text-xs text-[#6B6B6B]">This is an interactive simulation of the public runner.</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5">Summary of answers</p>
                    <div className="space-y-1 text-[10px] font-mono text-zinc-400 max-h-24 overflow-y-auto">
                      {template.fields.slice(0, 3).map((f) => (
                        <div key={f.id} className="truncate">
                          <span className="text-zinc-600">{f.label.slice(0, 20)}...:</span>{" "}
                          <span style={{ color: accentColor }}>
                            {Array.isArray(answers[f.id])
                              ? answers[f.id].join(", ")
                              : String(answers[f.id] ?? "(skipped)")}
                          </span>
                        </div>
                      ))}
                      {template.fields.length > 3 && (
                        <div className="text-zinc-600 text-[9px]">+ {template.fields.length - 3} more fields</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMockSubmit} className="space-y-4">
                  {template.fields.slice(0, 2).map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                        {field.label}
                        {field.required && <span style={{ color: accentColor }}>*</span>}
                      </label>

                      {field.type === "short_text" && (
                        <input
                          type="text"
                          value={answers[field.id] ?? ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.config.placeholder || "Your answer..."}
                          className="w-full bg-[#111] border border-white/6 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 transition-all"
                          style={{
                            borderColor: answers[field.id] ? accentColor : "rgba(255,255,255,0.06)",
                            boxShadow: answers[field.id] ? `0 0 8px ${hexToRgba(accentColor, 0.2)}` : undefined,
                          }}
                        />
                      )}

                      {field.type === "long_text" && (
                        <textarea
                          rows={2}
                          value={answers[field.id] ?? ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.config.placeholder || "Your answer..."}
                          className="w-full bg-[#111] border border-white/6 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 resize-none focus:outline-none focus:ring-1 transition-all"
                          style={{
                            borderColor: answers[field.id] ? accentColor : "rgba(255,255,255,0.06)",
                            boxShadow: answers[field.id] ? `0 0 8px ${hexToRgba(accentColor, 0.2)}` : undefined,
                          }}
                        />
                      )}

                      {field.type === "email" && (
                        <input
                          type="email"
                          value={answers[field.id] ?? ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.config.placeholder || "name@example.com"}
                          className="w-full bg-[#111] border border-white/6 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 transition-all"
                          style={{
                            borderColor: answers[field.id] ? accentColor : "rgba(255,255,255,0.06)",
                            boxShadow: answers[field.id] ? `0 0 8px ${hexToRgba(accentColor, 0.2)}` : undefined,
                          }}
                        />
                      )}

                      {field.type === "number" && (
                        <input
                          type="number"
                          value={answers[field.id] ?? ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.config.placeholder || "0"}
                          className="w-full bg-[#111] border border-white/6 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 transition-all"
                          style={{
                            borderColor: answers[field.id] ? accentColor : "rgba(255,255,255,0.06)",
                            boxShadow: answers[field.id] ? `0 0 8px ${hexToRgba(accentColor, 0.2)}` : undefined,
                          }}
                        />
                      )}

                      {field.type === "single_choice" && (
                        <div className="space-y-1.5">
                          {field.config.options?.slice(0, 3).map((opt: any) => {
                            const isSelected = answers[field.id] === opt.label;
                            return (
                              <div
                                key={opt.id}
                                onClick={() => handleInputChange(field.id, opt.label)}
                                className="flex items-center gap-2 p-2 rounded-lg bg-[#111] border cursor-pointer hover:bg-white/[0.02] transition-colors"
                                style={{ borderColor: isSelected ? borderAccent : "rgba(255,255,255,0.04)" }}
                              >
                                <div
                                  className="size-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                                  style={{ borderColor: isSelected ? accentColor : "rgba(255,255,255,0.2)" }}
                                >
                                  {isSelected && <div className="size-1.5 rounded-full" style={{ backgroundColor: accentColor }} />}
                                </div>
                                <span className="text-[11px]" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.6)" }}>{opt.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "multiple_choice" && (
                        <div className="space-y-1.5">
                          {field.config.options?.slice(0, 3).map((opt: any) => {
                            const selectedList = answers[field.id] || [];
                            const isSelected = selectedList.includes(opt.label);
                            const handleCheck = () => {
                              const next = isSelected
                                ? selectedList.filter((x: string) => x !== opt.label)
                                : [...selectedList, opt.label];
                              handleInputChange(field.id, next);
                            };
                            return (
                              <div
                                key={opt.id}
                                onClick={handleCheck}
                                className="flex items-center gap-2 p-2 rounded-lg bg-[#111] border cursor-pointer hover:bg-white/[0.02] transition-colors"
                                style={{ borderColor: isSelected ? borderAccent : "rgba(255,255,255,0.04)" }}
                              >
                                <div
                                  className="size-3.5 rounded border flex items-center justify-center shrink-0 transition-all"
                                  style={{
                                    borderColor: isSelected ? accentColor : "rgba(255,255,255,0.2)",
                                    backgroundColor: isSelected ? lightAccent : "transparent"
                                  }}
                                >
                                  {isSelected && <Check className="size-2.5" style={{ color: accentColor }} />}
                                </div>
                                <span className="text-[11px]" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.6)" }}>{opt.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "rating" && (
                        <div className="flex gap-1.5">
                          {Array.from({ length: field.config.scale || 5 }).map((_, i) => {
                            const val = i + 1;
                            const isSelected = answers[field.id] === val;
                            return (
                              <div
                                key={i}
                                onClick={() => handleInputChange(field.id, val)}
                                className="size-7 rounded-lg bg-[#111] border flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:bg-white/[0.02] transition-all"
                                style={{
                                  borderColor: isSelected ? accentColor : "rgba(255,255,255,0.04)",
                                  backgroundColor: isSelected ? lightAccent : "transparent",
                                  color: isSelected ? accentColor : "rgba(255,255,255,0.4)"
                                }}
                              >
                                {field.config.style === "star" ? (
                                  <Star
                                    className="size-3.5 transition-all"
                                    style={{
                                      color: isSelected ? accentColor : "rgba(255,255,255,0.2)",
                                      fill: isSelected ? accentColor : "transparent"
                                    }}
                                  />
                                ) : val}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "date" && (
                        <input
                          type="date"
                          value={answers[field.id] ?? ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full bg-[#111] border border-white/6 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 transition-all"
                          style={{
                            borderColor: answers[field.id] ? accentColor : "rgba(255,255,255,0.06)",
                            boxShadow: answers[field.id] ? `0 0 8px ${hexToRgba(accentColor, 0.2)}` : undefined,
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <p className="text-[9px] text-center text-[#5A5A5A] italic">...and {template.fields.length - 2} more fields.</p>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full text-xs font-semibold h-9 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: accentColor,
                        color: "#050505",
                        boxShadow: `0 4px 12px ${hexToRgba(accentColor, 0.3)}`
                      }}
                    >
                      Submit Response
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        SPANS[index % SPANS.length],
        "col-span-1 rounded-[1.75rem] bg-white/2 p-1.5 ring-1 ring-white/6",
      )}
    >
      <div className="min-h-40 animate-pulse overflow-hidden rounded-[1.4rem] bg-[#111]">
        <div
          className="size-full animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Navigation tabs: templates vs community
  const [activeTab, setActiveTab] = useState<"templates" | "community">("templates");

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

  // Template creation states
  const [usingTemplateSlug, setUsingTemplateSlug] = useState<string | null>(null);

  // Fetch workspaces & mutations for logged-in user
  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined, {
    enabled: mounted && !!user,
  });
  const workspaceId = workspacesQuery.data?.[0]?.id;

  const createFormMutation = trpc.forms.create.useMutation();
  const updateDraftMutation = trpc.forms.versions.updateDraft.useMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formsQuery = trpc.forms.public.listPublic.useQuery(undefined);
  const forms = formsQuery.data ?? [];
  const isCommunityLoading = formsQuery.isPending;

  // Filter templates
  const filteredTemplates = STATIC_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter community forms
  const filteredCommunityForms = forms.filter((form) => {
    return (
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  });

  // Handle using a template
  const handleUseTemplate = async (template: FormTemplate) => {
    if (!user) {
      toast.error("Please login to use templates", {
        description: "You need an account to save and edit forms.",
      });
      return;
    }

    if (!workspaceId) {
      toast.error("No workspace found", {
        description: "Please check your account or create a workspace first.",
      });
      return;
    }

    setUsingTemplateSlug(template.slug);
    const useToastId = toast.loading(`Creating "${template.title}" form...`);

    try {
      // 1. Create a blank form in the user's workspace
      const newForm = await createFormMutation.mutateAsync({
        workspaceId,
        title: `${template.title} (Copy)`,
      });

      // 2. Populate the draft with template fields and theme
      await updateDraftMutation.mutateAsync({
        formId: newForm.id,
        title: `${template.title} (Copy)`,
        description: template.description,
        theme: template.theme,
        fields: template.fields.map((f, i) => ({
          id: nanoid(10),
          order: i,
          type: f.type,
          label: f.label,
          required: f.required,
          config: f.config,
        })),
      });

      toast.success("Form created successfully!", {
        id: useToastId,
        description: "Redirecting to your editor...",
      });

      // Redirect user to form editor
      window.location.href = `/forms/${newForm.id}/edit`;
    } catch (error) {
      console.error("Error using template:", error);
      toast.error("Failed to create form from template", {
        id: useToastId,
      });
      setUsingTemplateSlug(null);
    }
  };

  const categories = ["All", "Entertainment", "Gaming", "Product", "Social", "Hiring", "Education"];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2F2F2] selection:bg-[#E8854A]/30 selection:text-[#E8854A]">
      {/* Minimal top nav */}
      <nav className="fixed inset-x-0 top-4 z-40 px-4">
        <div className="mx-auto max-w-4xl rounded-full bg-white/1 p-1 ring-1 ring-white/6 backdrop-blur-md">
          <div className="flex h-12 items-center justify-between rounded-full bg-[#111] px-4 border border-white/1">
            <Link href="/" className="flex items-center">
              <Image
                src={logoImg}
                alt="My Form"
                width={100}
                height={25}
                className="object-contain logo-img"
              />
            </Link>
            <div className="flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle theme"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-full text-[#6B6B6B] hover:bg-white/6 hover:text-[#F2F2F2] size-8 shrink-0 cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                </Button>
              )}
              {authLoading ? (
                <div className="h-7 w-20 animate-pulse rounded-full bg-white/5" />
              ) : user ? (
                <Link
                  href="/forms"
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium",
                    "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
                    `transition-all duration-300 ${EASE}`,
                    "hover:bg-[#E8854A]/20",
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6B6B6B] transition-colors duration-300 hover:text-[#F2F2F2]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium",
                      "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
                      `transition-all duration-300 ${EASE}`,
                      "hover:bg-[#E8854A]/20",
                    )}
                  >
                    Start free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12 animate-fade-up">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8854A]/10 px-3 py-1 ring-1 ring-[#E8854A]/20">
            <Sparkles className="size-3 text-[#E8854A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#E8854A]">
              Curated Hub
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Explore templates &amp; forms
          </h1>
          <p className="mt-3 text-sm text-[#6B6B6B] max-w-lg">
            Start from a verified structure or check out what the community is creating.
          </p>
        </div>

        {/* Tab switchers + search input */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-5">
          <div className="flex gap-2 bg-white/2 p-1 rounded-full border border-white/6 w-fit">
            <button
              onClick={() => {
                setActiveTab("templates");
                setSearchQuery("");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                activeTab === "templates"
                  ? "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20"
                  : "text-[#6B6B6B] hover:text-white"
              )}
            >
              <Compass className="size-3.5" />
              Templates
            </button>
            <button
              onClick={() => {
                setActiveTab("community");
                setSearchQuery("");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                activeTab === "community"
                  ? "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20"
                  : "text-[#6B6B6B] hover:text-white"
              )}
            >
              <FileText className="size-3.5" />
              Community Forms
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#5A5A5A]" />
            <input
              type="text"
              placeholder={activeTab === "templates" ? "Search templates..." : "Search community forms..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full bg-[#111] text-zinc-200 placeholder-zinc-600 pl-10 pr-4 py-2 text-xs rounded-full border border-white/6 focus:outline-none focus:border-[#E8854A]/50 focus:ring-1 focus:ring-[#E8854A]/20 transition-all duration-300"
              )}
            />
          </div>
        </div>

        {/* Templates view */}
        {activeTab === "templates" && (
          <div className="space-y-8 animate-fade-in">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-mono tracking-wider transition-all duration-300 border",
                    selectedCategory === cat
                      ? "bg-[#E8854A]/10 text-[#E8854A] border-[#E8854A]/30 ring-1 ring-[#E8854A]/10"
                      : "bg-white/[0.02] border-white/6 text-[#6B6B6B] hover:text-[#C4C4C4] hover:border-white/12"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Compass className="size-10 text-[#3A3A3A] mb-3" />
                <p className="text-sm text-[#6B6B6B]">No templates match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template, idx) => (
                  <TemplateCard
                    key={template.slug}
                    template={template}
                    idx={idx}
                    onPreview={() => setPreviewTemplate(template)}
                    onUse={() => handleUseTemplate(template)}
                    usingTemplateSlug={usingTemplateSlug}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community forms view */}
        {activeTab === "community" && (
          <div className="animate-fade-in">
            {isCommunityLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : filteredCommunityForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="size-10 text-[#3A3A3A] mb-3" />
                <p className="text-sm text-[#6B6B6B]">
                  {searchQuery ? "No community forms match your search." : "No community forms available yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                {filteredCommunityForms.map((form, i) => (
                  <ExploreCard key={form.id} form={form} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open: boolean) => !open && setPreviewTemplate(null)}>
        {previewTemplate && (
          <TemplatePreviewDialogContent
            template={previewTemplate}
            usingTemplateSlug={usingTemplateSlug}
            onUse={() => handleUseTemplate(previewTemplate)}
          />
        )}
      </Dialog>
    </div>
  );
}
