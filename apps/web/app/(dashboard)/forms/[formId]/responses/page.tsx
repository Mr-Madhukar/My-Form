"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Inbox, ArrowLeft, Sparkles, Clock, Hash, Loader2, Download, ChevronLeft, ChevronRight, FileText, ExternalLink } from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const q = trpc.forms.responses.list.useInfiniteQuery(
    { formId },
    { getNextPageParam: (last) => last.nextCursor },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const exportCsv = trpc.forms.responses.exportCsv.useQuery(
    { formId },
    { enabled: false },
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await exportCsv.refetch();
      if (result.data?.csv) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }, [exportCsv]);

  const responses = q.data?.pages.flatMap((p) => p.items) ?? [];
  const count = q.data?.pages[0]?.total ?? 0;

  const filteredResponses = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const query = searchQuery.toLowerCase();
    return responses.filter((r) => {
      const matchTime = r.completedAt ? format(new Date(r.completedAt), "MMM d, yyyy").toLowerCase().includes(query) : false;
      const matchAnswers = r.answers.some((ans) => {
        const valStr = renderValue(ans.value).toLowerCase();
        const labelStr = ans.label.toLowerCase();
        return valStr.includes(query) || labelStr.includes(query);
      });
      return matchTime || matchAnswers;
    });
  }, [responses, searchQuery]);

  const columns: { fieldId: string; label: string }[] = [];
  const seenFieldIds = new Set<string>();
  for (const response of responses) {
    for (const answer of response.answers) {
      if (!seenFieldIds.has(answer.fieldId)) {
        seenFieldIds.add(answer.fieldId);
        columns.push({ fieldId: answer.fieldId, label: answer.label });
      }
    }
  }

  const selected = filteredResponses.find((r) => r.id === selectedId) ?? filteredResponses[0] ?? null;

  const currentIdx = responses.findIndex((r) => r.id === (selected?.id ?? ""));
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < responses.length - 1 && currentIdx !== -1;

  const handlePrev = () => {
    if (hasPrev) {
      setSelectedId(responses[currentIdx - 1]!.id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedId(responses[currentIdx + 1]!.id);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className="flex items-center gap-1.5 text-xs text-[#6B6B6B] transition-colors duration-200 hover:text-[#F2F2F2]"
          >
            <ArrowLeft className="size-3.5" />
            Back to editor
          </Link>
          <span className="text-[#3A3A3A] text-xs">·</span>
          <FormTabs formId={formId} active="responses" />
          {!q.isPending && (
            <span className="rounded-full border border-[#E8854A]/20 bg-[#E8854A]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E8854A]">
              {count}
            </span>
          )}
        </div>
        {responses.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              "bg-[#E8854A]/10 text-[#E8854A] ring-1 ring-[#E8854A]/20",
              "transition-all duration-200 hover:bg-[#E8854A]/20",
              "disabled:opacity-50 disabled:pointer-events-none",
            )}
          >
            {exporting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            Export CSV
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {q.isPending ? (
          <div className="flex w-full">
            <div className="w-full shrink-0 border-r border-white/7 p-3 lg:w-75">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-2 rounded-xl p-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-5 animate-shimmer rounded-md bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
                    <div className="h-2.5 w-16 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
                  </div>
                  <div className="h-3 w-3/4 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
                </div>
              ))}
            </div>
            <div className="flex-1 p-8">
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/6 p-5 space-y-3">
                    <div className="h-2.5 w-32 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
                    <div className="h-4 w-2/3 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-[#E8854A]/30">
              <Inbox className="size-6 text-[#3A3A3A]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                No responses yet
              </p>
              <p className="text-xs text-[#6B6B6B]">
                Responses will appear here once people submit your form
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT — master list */}
            <div
              className={cn(
                "shrink-0 overflow-y-auto border-white/7 p-3 flex flex-col gap-3",
                "lg:w-75 lg:border-r",
                selectedId ? "hidden lg:flex" : "flex w-full",
              )}
            >
              {/* Search bar */}
              <div className="relative w-full shrink-0">
                <input
                  type="text"
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3 py-1.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-[#E8854A]/30 focus:ring-1 focus:ring-[#E8854A]/10 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
                {filteredResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-xs text-zinc-500">No matching responses found.</p>
                  </div>
                ) : (
                  filteredResponses.map((response, i) => {
                    const isSelected = selected?.id === response.id;
                    const firstAnswer = response.answers[0];
                    const preview = firstAnswer ? renderValue(firstAnswer.value) : null;
                    const idx = responses.length - responses.findIndex((r) => r.id === response.id);

                    return (
                      <button
                        type="button"
                        key={response.id}
                        onClick={() => setSelectedId(response.id)}
                        style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                        className={cn(
                          "animate-fade-up group relative w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 block",
                          isSelected ? "bg-white/6 ring-1 ring-white/10" : "hover:bg-white/3",
                        )}
                      >
                        {/* Index + timestamp row */}
                        <div className="mb-2 flex items-center justify-between">
                          <div
                            className={cn(
                              "flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors duration-200",
                              isSelected
                                ? "bg-[#E8854A]/20 text-[#E8854A]"
                                : "bg-white/5 text-[#4A4A4A] group-hover:text-[#6B6B6B]",
                            )}
                          >
                            #{idx}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-2.5 text-[#4A4A4A]" />
                            <span className="font-mono text-[10px] text-[#4A4A4A]">
                              {response.completedAt
                                ? formatDistanceToNow(new Date(response.completedAt), {
                                    addSuffix: true,
                                  })
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Preview */}
                        {preview ? (
                          <p
                            className={cn(
                              "truncate text-xs leading-relaxed transition-colors duration-200",
                              isSelected
                                ? "text-[#D4D4D4]"
                                : "text-[#6B6B6B] group-hover:text-[#9B9B9B]",
                            )}
                          >
                            {preview}
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#3A3A3A] italic">No answers</p>
                        )}

                        {/* Selected accent bar */}
                        {isSelected && (
                          <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#E8854A]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {q.hasNextPage && (
                <button
                  type="button"
                  onClick={() => q.fetchNextPage()}
                  disabled={q.isFetchingNextPage}
                  className="w-full rounded-xl p-3 font-mono text-[11px] text-[#6B6B6B] ring-1 ring-white/6 transition-colors hover:text-[#F2F2F2] cursor-pointer"
                >
                  {q.isFetchingNextPage ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-3 animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
            </div>

            {/* RIGHT — detail */}
            <div
              className={cn(
                "overflow-y-auto",
                "lg:flex-1",
                selectedId ? "block w-full" : "hidden lg:block lg:flex-1",
              )}
            >
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1.5 px-6 pt-5 text-xs text-[#6B6B6B] transition-colors duration-200 hover:text-[#F2F2F2] lg:hidden"
                >
                  <ArrowLeft className="size-3.5" />
                  All responses
                </button>
              )}

              {selected && (
                <div key={selected.id} className="animate-fade-up px-7 py-6">
                  {/* Response meta header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="size-3 text-[#4A4A4A]" />
                        <span className="font-mono text-xs font-semibold text-[#6B6B6B]">
                          {responses.length - responses.findIndex((r) => r.id === selected.id)}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-white/10" />
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-[#4A4A4A]" />
                        <span className="font-mono text-xs text-[#6B6B6B]">
                          {selected.completedAt
                            ? format(new Date(selected.completedAt), "MMM d, yyyy · h:mm a")
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Prev / Next controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Newer Response"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Older Response"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Answer cards */}
                  <div className="space-y-3">
                    {columns.map((col, idx) => {
                      const answer = selected.answers.find((a) => a.fieldId === col.fieldId);
                      const value = answer ? renderValue(answer.value) : null;

                      return (
                        <div
                          key={col.fieldId}
                          className="group rounded-2xl border border-white/6 bg-white/2 p-5 transition-colors duration-200 hover:border-white/10 hover:bg-white/3"
                        >
                          {/* Question label */}
                          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4A4A4A]">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/5 font-mono text-[9px] text-[#3A3A3A]">
                              {idx + 1}
                            </span>
                            {col.label}
                          </p>

                          {/* Answer value */}
                          {value ? (
                            answer?.type === "file_upload" ? (
                              /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(value) ? (
                                <div className="mt-2 group/img relative inline-block overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1.5 transition-all duration-300 hover:border-white/20">
                                  <img
                                    src={value}
                                    alt="Uploaded image"
                                    className="max-h-48 max-w-full rounded-lg object-contain transition-all duration-300 group-hover/img:scale-[1.01]"
                                  />
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100 rounded-lg cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs ring-1 ring-white/20 hover:bg-white/20 transition-all">
                                      <ExternalLink className="size-3" />
                                      View Original
                                    </span>
                                  </a>
                                </div>
                              ) : (
                                <div className="mt-1">
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/3 px-4 py-3 text-xs font-medium text-[#E8E8E8] transition-all duration-200 hover:bg-white/6 hover:border-white/10"
                                  >
                                    <FileText className="size-4 text-[#E8854A]" />
                                    <span className="truncate max-w-[200px] text-zinc-300 font-mono">
                                      {value.split("/").pop()}
                                    </span>
                                    <Download className="size-3.5 text-[#6B6B6B] ml-1" />
                                  </a>
                                </div>
                              )
                            ) : (
                              <p className="wrap-break-word text-sm leading-relaxed text-[#E8E8E8]">
                                {value}
                              </p>
                            )
                          ) : (
                            <p className="font-mono text-xs text-[#3A3A3A] italic">No answer</p>
                          )}

                          {/* AI followup */}
                          {answer?.followup && (
                            <div className="mt-4 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
                              <div className="mb-2 flex items-center gap-1.5">
                                <Sparkles className="size-3 text-[#9B6DFF]" aria-hidden="true" />
                                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#7C5CBF]">
                                  AI follow-up
                                </span>
                              </div>
                              <p className="mb-3 text-xs leading-relaxed text-[#8B8B8B]">
                                {answer.followup.aiQuestion}
                              </p>
                              {answer.followup.userAnswer ? (
                                <p className="wrap-break-word text-sm leading-relaxed text-[#E8E8E8]">
                                  {answer.followup.userAnswer}
                                </p>
                              ) : (
                                <span className="font-mono text-[10px] italic text-[#3A3A3A]">
                                  Skipped
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
