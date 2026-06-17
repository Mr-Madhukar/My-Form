"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  FileText,
  Inbox,
  Link2,
  Sparkles,
  BarChart3,
  Copy,
  Power,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { FieldType } from "@repo/forms";
import { ShareFormPopover } from "~/components/share-form-popover";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";

const ACCENT = "#E8854A";
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

// Asymmetric bento spans cycled by index. Mobile collapses to full width.
const SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-4",
];

type FormListItem = {
  id: string;
  publicSlug: string;
  isAcceptingResponses: boolean;
  createdAt: Date;
  title: string;
  status: string;
};

function StatusPill({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
        published ? "bg-[#E8854A]/12 text-[#E8854A]" : "bg-white/[0.06] text-[#6B6B6B]",
      )}
    >
      {published ? <Globe className="size-2.5" /> : <FileText className="size-2.5" />}
      {status}
    </span>
  );
}

function DeleteDialog({
  form,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  form: FormListItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete form?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{form?.title || "Untitled form"}</span>{" "}
            will be soft-deleted. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  delay,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  delay: number;
  danger?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{ animationDelay: `${delay}ms` }}
          className={cn(
            "size-8 rounded-full bg-white/4 text-[#8A8A8A] ring-1 ring-white/6",
            "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "hover:scale-105 hover:bg-white/8 hover:text-white",
            danger && "hover:bg-red-500/15 hover:text-red-400",
            "group-hover:animate-fade-up",
          )}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface DuplicateDialogProps {
  form: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (options: { title: string; copyFields: boolean; copyTheme: boolean; selectedPreset: string | null }) => void;
  isPending: boolean;
}

function DuplicateDialog({
  form,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DuplicateDialogProps) {
  const [title, setTitle] = useState("");
  const [copyFields, setCopyFields] = useState(true);
  const [copyTheme, setCopyTheme] = useState(true);
  const [themePreset, setThemePreset] = useState<string>("original");

  useEffect(() => {
    if (form) {
      setTitle(`${form.title || "Untitled form"} (Copy)`);
      setCopyFields(true);
      setCopyTheme(true);
      setThemePreset("original");
    }
  }, [form]);

  const presets = [
    { value: "original", label: "Original" },
    { value: "sunset", label: "Sunset" },
    { value: "ocean", label: "Ocean" },
    { value: "forest", label: "Forest" },
    { value: "midnight", label: "Midnight" },
    { value: "rose", label: "Rose" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800/60 text-zinc-100 p-0 overflow-hidden gap-0">
        <div className="relative flex items-center gap-4 px-6 pt-6 pb-5 border-b border-zinc-800/60">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8854A]/6 to-transparent pointer-events-none" />
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <Copy className="size-5 text-zinc-300" />
          </div>
          <div className="relative min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold tracking-tight text-zinc-100">
              Duplicate Form
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-0.5">
              Customize title and choices for the duplicated form.
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Title input */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">New Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none focus:border-[#E8854A]/50 focus:ring-1 focus:ring-[#E8854A]/20 transition-all duration-200"
            />
          </div>

          {/* Theme Preset Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Theme Preset</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setThemePreset(p.value)}
                  disabled={isPending}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer",
                    themePreset === p.value
                      ? "border-[#E8854A] bg-[#E8854A]/5 text-[#E8854A]"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Toggles */}
          <div className="space-y-3 pt-2">
            {/* Toggle Copy Fields */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Copy Questions &amp; Fields</span>
              <button
                type="button"
                onClick={() => setCopyFields(!copyFields)}
                disabled={isPending}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none",
                  copyFields ? "bg-[#E8854A]" : "bg-zinc-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-black shadow-sm transition duration-200",
                    copyFields ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Toggle Copy Theme */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Copy Theme &amp; Accent</span>
              <button
                type="button"
                onClick={() => setCopyTheme(!copyTheme)}
                disabled={isPending || themePreset !== "original"}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40",
                  copyTheme && themePreset === "original" ? "bg-[#E8854A]" : "bg-zinc-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-black shadow-sm transition duration-200",
                    copyTheme && themePreset === "original" ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/30 gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending} className="border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 text-xs rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => onConfirm({ title, copyFields, copyTheme, selectedPreset: themePreset === "original" ? null : themePreset })}
            disabled={isPending || !title.trim()}
            className="bg-[#E8854A] hover:bg-[#E8854A]/90 text-xs font-semibold text-[#0a0a0a] rounded-xl cursor-pointer min-w-24"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormCard({
  form,
  index,
  onDelete,
  onDuplicate,
  onToggleAccepting,
}: {
  form: FormListItem;
  index: number;
  onDelete: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onToggleAccepting: (formId: string, isAccepting: boolean) => void;
}) {
  const router = useRouter();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const isAccepting = form.isAcceptingResponses;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          style={{ animationDelay: `${index * 70}ms` }}
          className={cn(
            SPANS[index % SPANS.length],
            "animate-fade-up col-span-1",
            "group relative cursor-pointer rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "hover:ring-white/[0.12]",
          )}
          onClick={() => router.push(`/forms/${form.id}/edit`)}
          onMouseMove={handleMouseMove}
        >
          {/* Spotlight border overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx) var(--my), rgba(232,133,74,0.18), transparent 45%)",
            }}
          />

          {/* Inner core */}
          <div className="relative flex h-full min-h-[8.5rem] flex-col gap-4 overflow-hidden rounded-[1.4rem] bg-[#111] p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-white">
                {form.title || "Untitled form"}
              </h3>
              <StatusPill status={form.status} />
            </div>

            {/* Meta */}
            <div className="mt-auto flex flex-col gap-1.5">
              <p className="font-mono text-[11px] text-[#6B6B6B]">/f/{form.publicSlug}</p>
              <p className="font-mono text-[11px] text-[#5A5A5A]">
                created {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Quick actions */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 p-5",
                "bg-gradient-to-t from-[#111] via-[#111]/90 to-transparent pt-10",
                "translate-y-2 opacity-0",
                "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
                "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <QuickAction
                icon={Pencil}
                label="Edit"
                delay={0}
                onClick={() => router.push(`/forms/${form.id}/edit`)}
              />
              <QuickAction
                icon={Inbox}
                label="Responses"
                delay={50}
                onClick={() => router.push(`/forms/${form.id}/responses`)}
              />
              <ShareFormPopover
                publicSlug={form.publicSlug}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Share"
                    onClick={(e) => e.stopPropagation()}
                    style={{ animationDelay: "100ms" }}
                    className={cn(
                      "size-8 rounded-full bg-white/4 text-[#8A8A8A] ring-1 ring-white/6",
                      "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      "hover:scale-105 hover:bg-white/8 hover:text-white",
                      "group-hover:animate-fade-up",
                    )}
                  >
                    <Link2 className="size-3.5" />
                  </Button>
                }
              />
              <QuickAction
                icon={Trash2}
                label="Delete"
                delay={150}
                danger
                onClick={() => onDelete(form)}
              />
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-[#0F0F0F] border-white/6 text-zinc-300 rounded-xl p-1 shadow-2xl">
        <ContextMenuItem
          onClick={() => router.push(`/forms/${form.id}/edit`)}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Pencil className="size-3.5 mr-2 text-zinc-400" />
            <span>Edit Form</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘E</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => router.push(`/forms/${form.id}/responses`)}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Inbox className="size-3.5 mr-2 text-zinc-400" />
            <span>View Responses</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘R</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => router.push(`/forms/${form.id}/analytics`)}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <BarChart3 className="size-3.5 mr-2 text-zinc-400" />
            <span>Analytics Dashboard</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘A</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => window.open(`/f/${form.publicSlug}`, "_blank")}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <ExternalLink className="size-3.5 mr-2 text-zinc-400" />
            <span>Preview Live Form</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘P</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            const url = `${window.location.origin}/f/${form.publicSlug}`;
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
          }}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Link2 className="size-3.5 mr-2 text-zinc-400" />
            <span>Copy Public Link</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘C</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onToggleAccepting(form.id, !isAccepting)}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Power className={cn("size-3.5 mr-2", isAccepting ? "text-amber-500" : "text-zinc-500")} />
            <span>{isAccepting ? "Pause Responses" : "Resume Responses"}</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘T</kbd>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onDuplicate(form)}
          className="hover:bg-white/5 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Copy className="size-3.5 mr-2 text-zinc-400" />
            <span>Duplicate Form</span>
          </div>
          <kbd className="text-[9px] font-mono text-zinc-500 uppercase ml-auto">⌘D</kbd>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-white/6 my-1" />

        <ContextMenuItem
          onClick={() => onDelete(form)}
          variant="destructive"
          className="focus:bg-red-500/10 focus:text-red-400 cursor-pointer text-xs rounded-lg py-2 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Trash2 className="size-3.5 mr-2 text-red-500" />
            <span>Delete Form</span>
          </div>
          <kbd className="text-[9px] font-mono text-red-400/80 uppercase ml-auto">Del</kbd>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const EXAMPLE_PROMPTS = [
  "Customer feedback for a coffee shop",
  "Job application form",
  "Weekly team standup survey",
  "Event RSVP form",
];

function GenerateModal({
  open,
  onOpenChange,
  onGenerate,
  isPending,
  hasError,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerate: (prompt: string) => void;
  isPending: boolean;
  hasError: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    if (!prompt.trim()) return;
    onGenerate(prompt.trim());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) {
          onOpenChange(v);
          if (!v) setPrompt("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800/60 text-zinc-100 p-0 overflow-hidden gap-0">
        {/* Header band */}
        <div className="relative flex items-center gap-4 px-6 pt-6 pb-5 border-b border-zinc-800/60">
          <div className="absolute inset-0 bg-linear-to-br from-[#E8854A]/6 to-transparent pointer-events-none" />
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8854A]/15 ring-1 ring-[#E8854A]/30">
            <Sparkles className="size-5 text-[#E8854A]" />
          </div>
          <div className="relative min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold tracking-tight text-zinc-100">
              Generate with AI
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-0.5">
              Describe your form and AI builds it instantly.
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="e.g. a customer feedback form for a coffee shop…"
            disabled={isPending}
            rows={3}
            className={cn(
              "w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900 px-4 py-3",
              "text-sm text-zinc-100 placeholder:text-zinc-600",
              "outline-none focus:border-[#E8854A]/50 focus:ring-1 focus:ring-[#E8854A]/20",
              "transition-all duration-200 disabled:opacity-50",
            )}
          />

          {/* Example chips */}
          {!isPending && (
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className={cn(
                    "rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-500",
                    "transition-all duration-200 hover:border-[#E8854A]/40 hover:bg-[#E8854A]/8 hover:text-[#E8854A]",
                    prompt === ex && "border-[#E8854A]/40 bg-[#E8854A]/8 text-[#E8854A]",
                  )}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {/* Generating state */}
          {isPending && (
            <div className="flex items-center gap-3 rounded-xl border border-[#E8854A]/20 bg-[#E8854A]/5 px-4 py-3">
              <Loader2 className="size-4 shrink-0 animate-spin text-[#E8854A]" />
              <div>
                <p className="text-sm font-medium text-[#E8854A]">Building your form…</p>
                <p className="text-xs text-zinc-500 mt-0.5">This usually takes a few seconds.</p>
              </div>
            </div>
          )}

          {hasError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">
              Couldn&apos;t generate the form. Try rephrasing your prompt.
            </p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/30 gap-2">
          <p className="mr-auto text-[11px] text-zinc-600 hidden sm:block">⌘↵ to generate</p>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 text-xs"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !prompt.trim()}
            className="gap-2 bg-[#E8854A] hover:bg-[#E8854A]/90 text-[#0a0a0a] text-xs font-semibold disabled:opacity-40 transition-all duration-300 min-w-25"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {isPending ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onNew, isPending }: { onNew: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="select-none text-6xl font-semibold tracking-tighter text-white/[0.06] sm:text-7xl">
        No forms yet
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={onNew}
        disabled={isPending}
        className={cn(
          "group mt-8 flex h-auto flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-[#E8854A]/30 px-12 py-8",
          "bg-[#E8854A]/3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "hover:border-[#E8854A]/60 hover:bg-[#E8854A]/6",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        </span>
        <span className="text-sm font-medium text-white">Create your first form</span>
        <span className="font-mono text-[11px] text-[#6B6B6B]">start collecting responses</span>
      </Button>
    </div>
  );
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        SPANS[index % SPANS.length],
        "col-span-1 rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]",
      )}
    >
      <div className="h-[8.5rem] animate-pulse overflow-hidden rounded-[1.4rem] bg-[#111]">
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

export default function FormsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<FormListItem | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspaceId = workspacesQuery.data?.[0]?.id;

  const formsQuery = trpc.forms.list.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId },
  );

  const createMutation = trpc.forms.create.useMutation({
    onSuccess: (form) => router.push(`/forms/${form.id}/edit`),
    onError: () => toast.error("Failed to create form"),
  });

  const updateDraftMutation = trpc.forms.versions.updateDraft.useMutation();

  const deleteMutation = trpc.forms.softDelete.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      setDeleteTarget(null);
      toast.success("Form deleted");
    },
    onError: () => toast.error("Failed to delete form"),
  });

  const restoreMutation = trpc.forms.restore.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      toast.success("Form restored");
    },
    onError: () => toast.error("Failed to restore form"),
  });

  const toggleAcceptingMutation = trpc.forms.toggleAccepting.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      toast.success("Form response preference updated");
    },
    onError: () => toast.error("Failed to update response preference"),
  });

  function handleToggleAccepting(formId: string, isAccepting: boolean) {
    toggleAcceptingMutation.mutate({ formId, isAcceptingResponses: isAccepting });
  }

  function handleNew() {
    if (!workspaceId) return;
    createMutation.mutate({ workspaceId, title: "Untitled form" });
  }

  async function handleDuplicateConfirm(options: {
    title: string;
    copyFields: boolean;
    copyTheme: boolean;
    selectedPreset: string | null;
  }) {
    if (!workspaceId || !duplicateTarget) return;
    const formId = duplicateTarget.id;
    const originalTitle = duplicateTarget.title;
    const dupToastId = toast.loading(`Duplicating "${originalTitle || "Untitled form"}"...`);
    setDuplicating(true);
    setDuplicateTarget(null);
    try {
      const draft = await utils.forms.versions.getDraft.fetch({ formId });
      const newForm = await createMutation.mutateAsync({
        workspaceId,
        title: options.title,
      });

      const presetColors: Record<string, string> = {
        sunset: "#E8854A",
        ocean: "#3B82F6",
        forest: "#10B981",
        midnight: "#8B5CF6",
        rose: "#EC4899",
      };

      let finalTheme = undefined;
      if (options.selectedPreset && options.selectedPreset in presetColors) {
        finalTheme = {
          preset: options.selectedPreset as any,
          accentColor: presetColors[options.selectedPreset]!,
        };
      } else if (options.copyTheme) {
        finalTheme = draft.theme || undefined;
      }

      await updateDraftMutation.mutateAsync({
        formId: newForm.id,
        title: options.title,
        description: draft.description || undefined,
        theme: finalTheme,
        fields: options.copyFields
          ? draft.fields.map((f, i) => ({
              id: nanoid(10),
              order: i,
              type: f.type,
              label: f.label,
              required: f.required,
              config: f.config as Record<string, any>,
            }))
          : [],
      });
      toast.success("Form duplicated successfully!", { id: dupToastId });
      formsQuery.refetch();
    } catch (err) {
      console.error("Duplication error:", err);
      toast.error("Failed to duplicate form", { id: dupToastId });
    } finally {
      setDuplicating(false);
    }
  }

  async function handleGenerate(prompt: string) {
    if (!workspaceId) return;
    setGenerating(true);
    setGenerateError(false);
    try {
      // 1. Generate fields from AI
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("generation_failed");
      const { title, fields: generatedFields } = (await res.json()) as {
        title: string;
        fields: {
          type: string;
          label: string;
          required: boolean;
          config: Record<string, unknown>;
        }[];
      };

      // 2. Create form
      const form = await createMutation.mutateAsync({
        workspaceId,
        title: title || "Untitled form",
      });

      // 3. Populate draft with generated fields
      await updateDraftMutation.mutateAsync({
        formId: form.id,
        title: title || "Untitled form",
        fields: generatedFields.map((f, i) => ({
          id: nanoid(),
          order: i,
          type: f.type as FieldType,
          label: f.label,
          required: f.required,
          config: f.config,
        })),
      });

      setGenerateOpen(false);
      router.push(`/forms/${form.id}/edit`);
    } catch {
      setGenerateError(true);
      setGenerating(false);
    }
  }

  // restoreMutation preserved for soft-delete restore flow.
  void restoreMutation;

  const forms = formsQuery.data ?? [];
  const isLoading = workspacesQuery.isPending || formsQuery.isPending;

  const dashboardStats = trpc.dashboard.getStats.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId },
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Page header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-white">Forms</h1>
          {dashboardStats.data && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#10B981]">
                {dashboardStats.data.totalResponses} responses
              </span>
              <span className="rounded-full bg-[#3B82F6]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#3B82F6]">
                {dashboardStats.data.publishedForms} published
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setGenerateOpen(true)}
            disabled={!workspaceId}
            className="gap-2 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium bg-[#E8854A]/10 text-[#E8854A] ring-1 ring-[#E8854A]/20 hover:bg-[#E8854A]/20 hover:ring-[#E8854A]/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <Sparkles className="size-3.5" />
            Generate with AI
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleNew}
            disabled={createMutation.isPending || !workspaceId}
            className="group gap-2.5 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-medium bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20 hover:bg-[#E8854A]/20 hover:ring-[#E8854A]/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] h-auto"
          >
            New form
            <span className="flex size-7 items-center justify-center rounded-full bg-[#E8854A] text-[#111] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-90">
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState onNew={handleNew} isPending={createMutation.isPending} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {forms.map((form, i) => (
              <FormCard
                key={form.id}
                index={i}
                form={{ ...form, createdAt: new Date(form.createdAt) }}
                onDelete={setDeleteTarget}
                onDuplicate={setDuplicateTarget}
                onToggleAccepting={handleToggleAccepting}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteDialog
        form={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ formId: deleteTarget.id })}
        isPending={deleteMutation.isPending}
      />

      <DuplicateDialog
        form={duplicateTarget}
        open={!!duplicateTarget}
        onOpenChange={(v) => !v && setDuplicateTarget(null)}
        onConfirm={handleDuplicateConfirm}
        isPending={duplicating}
      />

      <GenerateModal
        open={generateOpen}
        onOpenChange={(v) => {
          if (!generating) {
            setGenerateOpen(v);
            if (!v) {
              setGenerating(false);
              setGenerateError(false);
            }
          }
        }}
        onGenerate={handleGenerate}
        isPending={generating}
        hasError={generateError}
      />
    </div>
  );
}
