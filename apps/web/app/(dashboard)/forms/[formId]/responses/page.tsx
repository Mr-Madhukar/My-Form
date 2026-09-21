"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  Inbox,
  ArrowLeft,
  Sparkles,
  Clock,
  Hash,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|svg)($|\?)/i;

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return "₹";
  return CURRENCY_SYMBOLS[currency] ?? "₹";
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(renderValue).join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return "";
}

function ResponsesSkeleton() {
  return (
    <div className="flex w-full">
      <div className="w-full shrink-0 border-r border-white/7 p-3 lg:w-75">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-item-${i}`}
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
            <div key={`skeleton-card-${i}`} className="rounded-2xl border border-white/6 p-5 space-y-3">
              <div className="h-2.5 w-32 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
              <div className="h-4 w-2/3 animate-shimmer rounded bg-linear-to-r from-white/4 via-white/8 to-white/4 bg-size-[200%_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyResponsesState() {
  return (
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
  );
}

function AnswerValueDisplay({
  value,
  isFileUpload,
}: {
  readonly value: string | null;
  readonly isFileUpload: boolean;
}) {
  if (!value) {
    return <p className="font-mono text-xs text-[#3A3A3A] italic">No answer</p>;
  }

  if (isFileUpload) {
    if (IMAGE_EXTENSION_REGEX.test(value)) {
      return (
        <div className="mt-2 group/img relative inline-block overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1.5 transition-all duration-300 hover:border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded attachment preview"
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
      );
    }

    return (
      <div className="mt-1">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/3 px-4 py-3 text-xs font-medium text-[#E8E8E8] transition-all duration-200 hover:bg-white/6 hover:border-white/10"
        >
          <FileText className="size-4 text-[#E8854A]" />
          <span className="truncate max-w-50 text-zinc-300 font-mono">
            {value.split("/").pop()}
          </span>
          <Download className="size-3.5 text-[#6B6B6B] ml-1" />
        </a>
      </div>
    );
  }

  return (
    <p className="wrap-break-word text-sm leading-relaxed text-[#E8E8E8]">
      {value}
    </p>
  );
}

interface ResponseAnswer {
  readonly fieldId: string;
  readonly label: string;
  readonly value?: unknown;
  readonly type?: string;
  readonly followup?: {
    readonly aiQuestion: string;
    readonly userAnswer?: string | null;
  } | null;
}

interface ResponseItem {
  readonly id: string;
  readonly completedAt: string | Date | null;
  readonly leadScore?: number | null;
  readonly leadIntent?: "high" | "warm" | "low" | null;
  readonly leadReason?: string | null;
  readonly leadScoredAt?: string | null;
  readonly paymentStatus?: "paid" | "pending" | "failed" | "free" | null;
  readonly paymentAmount?: number | null;
  readonly paymentCurrency?: string | null;
  readonly paymentProvider?: string | null;
  readonly paymentId?: string | null;
  readonly paymentPaidAt?: string | null;
  readonly answers: readonly ResponseAnswer[];
}

interface ResponseColumn {
  readonly fieldId: string;
  readonly label: string;
}

function extractDistinctColumns(responses: readonly ResponseItem[]): ResponseColumn[] {
  const columns: ResponseColumn[] = [];
  const seenFieldIds = new Set<string>();
  for (const response of responses) {
    for (const answer of response.answers) {
      if (!seenFieldIds.has(answer.fieldId)) {
        seenFieldIds.add(answer.fieldId);
        columns.push({ fieldId: answer.fieldId, label: answer.label });
      }
    }
  }
  return columns;
}

function matchResponseQuery(response: ResponseItem, query: string): boolean {
  const matchTime = response.completedAt
    ? format(new Date(response.completedAt), "MMM d, yyyy").toLowerCase().includes(query)
    : false;
  const matchAnswers = response.answers.some((ans) => {
    const valStr = renderValue(ans.value).toLowerCase();
    const labelStr = ans.label.toLowerCase();
    return valStr.includes(query) || labelStr.includes(query);
  });
  return matchTime || matchAnswers;
}

type IntentFilter = "all" | "high" | "warm" | "low";
type SortBy = "newest" | "score";
type LeadIntent = "high" | "warm" | "low";

function getLeadIntentEmoji(intent?: LeadIntent | null): string {
  if (intent === "high") return "🔥";
  if (intent === "warm") return "⚡";
  return "💤";
}

function getLeadIntentLabel(intent?: LeadIntent | null): string {
  if (intent === "high") return "🔥 High Intent";
  if (intent === "warm") return "⚡ Warm Lead";
  return "💤 Low Intent";
}

function getLeadIntentBadgeClass(intent?: LeadIntent | null): string {
  if (intent === "high") {
    return "bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]";
  }
  if (intent === "warm") {
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
  }
  return "bg-zinc-800 text-zinc-400 border-zinc-700";
}

function getLeadIntentScoreBoxClass(intent?: LeadIntent | null): string {
  if (intent === "high") {
    return "border-orange-500/30 bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]";
  }
  if (intent === "warm") {
    return "border-yellow-500/25 bg-yellow-500/15 text-yellow-400";
  }
  return "border-zinc-700 bg-zinc-800 text-zinc-400";
}

function getLeadIntentPillClass(intent?: LeadIntent | null): string {
  if (intent === "high") {
    return "border border-orange-500/30 bg-orange-500/20 text-orange-400";
  }
  if (intent === "warm") {
    return "border border-yellow-500/30 bg-yellow-500/20 text-yellow-400";
  }
  return "border border-zinc-700 bg-zinc-800 text-zinc-400";
}

type PaymentFilter = "all" | "paid" | "unpaid";

interface ResponsesMasterListProps {
  readonly responses: readonly ResponseItem[];
  readonly filteredResponses: readonly ResponseItem[];
  readonly selectedId: string | null;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onSelectResponse: (id: string) => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onFetchNextPage: () => void;
  readonly intentFilter: IntentFilter;
  readonly onIntentFilterChange: (filter: IntentFilter) => void;
  readonly paymentFilter: PaymentFilter;
  readonly onPaymentFilterChange: (filter: PaymentFilter) => void;
  readonly totalRevenue: number;
  readonly paidCount: number;
  readonly currencySymbol: string;
  readonly sortBy: SortBy;
  readonly onSortByChange: (sort: SortBy) => void;
  readonly highCount: number;
  readonly warmCount: number;
  readonly lowCount: number;
}

function ResponsesMasterList({
  responses,
  filteredResponses,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectResponse,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  intentFilter,
  onIntentFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  totalRevenue,
  paidCount,
  currencySymbol,
  sortBy,
  onSortByChange,
  highCount,
  warmCount,
  lowCount,
}: Readonly<ResponsesMasterListProps>) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-y-auto border-white/7 p-3 flex flex-col gap-3",
        "lg:w-80 lg:border-r",
        selectedId ? "hidden lg:flex" : "flex w-full",
      )}
    >
      {/* Search bar */}
      <div className="relative w-full shrink-0">
        <input
          type="text"
          placeholder="Search responses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3 py-1.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-[#E8854A]/30 focus:ring-1 focus:ring-[#E8854A]/10 transition-all duration-300"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Revenue Counter */}
      {totalRevenue > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-zinc-400 leading-tight">Total Collected</p>
              <p className="font-mono text-sm font-bold text-emerald-400 leading-none mt-0.5">
                {currencySymbol}
                {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {paidCount} Paid
          </span>
        </div>
      )}

      {/* Payment Filter Pills */}
      {paidCount > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
          <button
            type="button"
            onClick={() => onPaymentFilterChange("all")}
            className={cn(
              "rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
              paymentFilter === "all"
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            All ({responses.length})
          </button>
          <button
            type="button"
            onClick={() => onPaymentFilterChange("paid")}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
              paymentFilter === "paid"
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                : "text-emerald-400/70 hover:text-emerald-300",
            )}
          >
            💰 Paid ({paidCount})
          </button>
          <button
            type="button"
            onClick={() => onPaymentFilterChange("unpaid")}
            className={cn(
              "rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
              paymentFilter === "unpaid"
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            Unpaid ({responses.length - paidCount})
          </button>
        </div>
      )}

      {/* Intent Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
        <button
          type="button"
          onClick={() => onIntentFilterChange("all")}
          className={cn(
            "rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
            intentFilter === "all"
              ? "bg-white/10 text-white"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          All Leads
        </button>
        <button
          type="button"
          onClick={() => onIntentFilterChange("high")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
            intentFilter === "high"
              ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40"
              : "text-orange-400/70 hover:text-orange-300",
          )}
        >
          🔥 High ({highCount})
        </button>
        <button
          type="button"
          onClick={() => onIntentFilterChange("warm")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
            intentFilter === "warm"
              ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40"
              : "text-yellow-400/70 hover:text-yellow-300",
          )}
        >
          ⚡ Warm ({warmCount})
        </button>
        <button
          type="button"
          onClick={() => onIntentFilterChange("low")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors shrink-0 cursor-pointer",
            intentFilter === "low"
              ? "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          💤 Low ({lowCount})
        </button>
      </div>

      {/* Sort row */}
      <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
        <span>{filteredResponses.length} lead{filteredResponses.length === 1 ? "" : "s"}</span>
        <button
          type="button"
          onClick={() => onSortByChange(sortBy === "newest" ? "score" : "newest")}
          className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <span>Sort:</span>
          <span className="font-semibold text-zinc-400">
            {sortBy === "newest" ? "Newest" : "🔥 Highest Score"}
          </span>
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
        {filteredResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-zinc-500">No matching responses found.</p>
          </div>
        ) : (
          filteredResponses.map((response, i) => {
            const isSelected = selectedId === response.id;
            const firstAnswer = response.answers[0];
            const preview = firstAnswer ? renderValue(firstAnswer.value) : null;
            const idx = responses.length - responses.findIndex((r) => r.id === response.id);

            return (
              <button
                type="button"
                key={response.id}
                onClick={() => onSelectResponse(response.id)}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className={cn(
                  "animate-fade-up group relative w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 block",
                  isSelected ? "bg-white/6 ring-1 ring-white/10" : "hover:bg-white/3",
                )}
              >
                {/* Index + Lead Score + Payment Badge + Timestamp row */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
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

                    {response.paymentStatus === "paid" && (
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                        {getCurrencySymbol(response.paymentCurrency)}
                        {response.paymentAmount} Paid
                      </span>
                    )}

                    {response.leadScore !== undefined && response.leadScore !== null && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-tight border",
                          getLeadIntentBadgeClass(response.leadIntent),
                        )}
                      >
                        {getLeadIntentEmoji(response.leadIntent)} {response.leadScore}
                      </span>
                    )}
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

      {hasNextPage && (
        <button
          type="button"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          className="w-full rounded-xl p-3 font-mono text-[11px] text-[#6B6B6B] ring-1 ring-white/6 transition-colors hover:text-[#F2F2F2] cursor-pointer"
        >
          {isFetchingNextPage ? (
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
  );
}

interface ResponseDetailViewProps {
  readonly selected: ResponseItem | null;
  readonly selectedId: string | null;
  readonly totalResponsesCount: number;
  readonly responseIndex: number;
  readonly columns: readonly ResponseColumn[];
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly onBackToList: () => void;
  readonly onScoreSingle: (responseId: string) => void;
  readonly scoringId: string | null;
}

function PaymentReceiptCard({ selected }: { readonly selected: ResponseItem }) {
  if (selected.paymentStatus !== "paid") return null;

  const symbol = getCurrencySymbol(selected.paymentCurrency);

  return (
    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
          <CreditCard className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              Payment Completed: {symbol}{selected.paymentAmount}
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 font-mono text-[9px] font-bold">
              VERIFIED
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
            <span>Provider: <span className="text-zinc-200 capitalize">{selected.paymentProvider ?? "Razorpay"}</span></span>
            <span>·</span>
            <span>Transaction ID: <code className="font-mono text-emerald-300 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{selected.paymentId ?? "—"}</code></span>
          </div>
        </div>
      </div>
      {selected.paymentPaidAt && (
        <span className="text-[11px] font-mono text-zinc-500 shrink-0">
          {format(new Date(selected.paymentPaidAt), "MMM d, yyyy · h:mm a")}
        </span>
      )}
    </div>
  );
}

function LeadIntelligenceCard({
  selected,
  onScoreSingle,
  scoringId,
}: {
  readonly selected: ResponseItem;
  readonly onScoreSingle: (responseId: string) => void;
  readonly scoringId: string | null;
}) {
  const isScored = selected.leadScore !== undefined && selected.leadScore !== null;
  if (!isScored) {
    return (
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-dashed border-white/10 bg-white/2 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-300">AI Lead Scoring available</p>
            <p className="text-[11px] text-zinc-500">
              Evaluate buying intent, budget, and priority for this submission.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onScoreSingle(selected.id)}
          disabled={scoringId === selected.id}
          className="flex items-center gap-1.5 rounded-xl bg-[#E8854A] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[#E8854A]/90 disabled:opacity-50 cursor-pointer"
        >
          {scoringId === selected.id ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          <span>Score with AI</span>
        </button>
      </div>
    );
  }

  const isHighIntent = selected.leadIntent === "high";

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-white/2 to-transparent p-5 backdrop-blur-xl">
      {isHighIntent && (
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-mono border shadow-sm",
              getLeadIntentScoreBoxClass(selected.leadIntent),
            )}
          >
            <span className="text-lg font-bold leading-none">{selected.leadScore}</span>
            <span className="text-[9px] font-normal opacity-70 mt-0.5">/ 100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                AI Lead Score
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                  getLeadIntentPillClass(selected.leadIntent),
                )}
              >
                {getLeadIntentLabel(selected.leadIntent)}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">
              {selected.leadReason}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onScoreSingle(selected.id)}
          disabled={scoringId === selected.id}
          className="flex shrink-0 items-center gap-1.5 self-start sm:self-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
          title="Re-run AI evaluation for this response"
        >
          {scoringId === selected.id ? (
            <Loader2 className="size-3 animate-spin text-orange-400" />
          ) : (
            <Sparkles className="size-3 text-orange-400" />
          )}
          <span>Re-evaluate</span>
        </button>
      </div>
    </div>
  );
}

function ResponseDetailView({
  selected,
  selectedId,
  totalResponsesCount,
  responseIndex,
  columns,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onBackToList,
  onScoreSingle,
  scoringId,
}: Readonly<ResponseDetailViewProps>) {
  return (
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
          onClick={onBackToList}
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
                  {totalResponsesCount - responseIndex}
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
                onClick={onPrev}
                disabled={!hasPrev}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Newer Response"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Older Response"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Payment Receipt Card */}
          <PaymentReceiptCard selected={selected} />

          {/* AI Lead Intelligence Card */}
          <LeadIntelligenceCard
            selected={selected}
            onScoreSingle={onScoreSingle}
            scoringId={scoringId}
          />

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
                  <AnswerValueDisplay
                    value={value}
                    isFileUpload={answer?.type === "file_upload"}
                  />

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
  );
}

export default function ResponsesPage({ params }: { readonly params: Promise<{ readonly formId: string }> }) {
  const { formId } = use(params);
  const q = trpc.forms.responses.list.useInfiniteQuery(
    { formId },
    { getNextPageParam: (last) => last.nextCursor },
  );
  const leadScoringQuery = trpc.forms.getLeadScoring.useQuery({ formId });
  const toggleLeadScoringMutation = trpc.forms.toggleLeadScoring.useMutation();
  const scoreSingleMutation = trpc.forms.responses.scoreSingleResponse.useMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [scoringId, setScoringId] = useState<string | null>(null);

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

  const handleToggleLeadScoring = async () => {
    const next = !leadScoringQuery.data?.enabled;
    try {
      await toggleLeadScoringMutation.mutateAsync({ formId, enabled: next });
      await leadScoringQuery.refetch();
      toast.success(
        next
          ? "AI Lead Scoring enabled! New submissions will be scored automatically."
          : "AI Lead Scoring disabled for this form.",
      );
    } catch {
      toast.error("Failed to update AI Lead Scoring setting");
    }
  };

  const handleScoreSingle = async (responseId: string) => {
    setScoringId(responseId);
    try {
      const res = await scoreSingleMutation.mutateAsync({ formId, responseId });
      if (res.success) {
        await q.refetch();
        toast.success(`Scored as ${res.intent?.toUpperCase()} intent (${res.score}/100) 🔥`);
      } else {
        toast.error("Could not score this lead. Please try again.");
      }
    } catch {
      toast.error("Lead scoring failed");
    } finally {
      setScoringId(null);
    }
  };

  const responses = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const count = q.data?.pages[0]?.total ?? 0;

  const { totalRevenue, paidCount, currencySymbol } = useMemo(() => {
    let revenue = 0;
    let paid = 0;
    let curr = "INR";
    for (const r of responses) {
      if (r.paymentStatus === "paid") {
        revenue += r.paymentAmount ?? 0;
        paid++;
        if (r.paymentCurrency) curr = r.paymentCurrency;
      }
    }
    const symbol = getCurrencySymbol(curr);
    return { totalRevenue: revenue, paidCount: paid, currencySymbol: symbol };
  }, [responses]);

  const { highCount, warmCount, lowCount } = useMemo(() => {
    let high = 0;
    let warm = 0;
    let low = 0;
    for (const r of responses) {
      if (r.leadIntent === "high") high++;
      else if (r.leadIntent === "warm") warm++;
      else if (r.leadIntent === "low") low++;
    }
    return { highCount: high, warmCount: warm, lowCount: low };
  }, [responses]);

  const filteredResponses = useMemo(() => {
    let list = responses;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((r) => matchResponseQuery(r, query));
    }
    if (paymentFilter === "paid") {
      list = list.filter((r) => r.paymentStatus === "paid");
    } else if (paymentFilter === "unpaid") {
      list = list.filter((r) => r.paymentStatus !== "paid");
    }
    if (intentFilter !== "all") {
      list = list.filter((r) => r.leadIntent === intentFilter);
    }
    if (sortBy === "score") {
      list = [...list].sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0));
    }
    return list;
  }, [responses, searchQuery, paymentFilter, intentFilter, sortBy]);

  const columns = useMemo(() => extractDistinctColumns(responses), [responses]);

  const selected = filteredResponses.find((r) => r.id === selectedId) ?? filteredResponses[0] ?? null;

  const currentIdx = responses.findIndex((r) => r.id === (selected?.id ?? ""));
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < responses.length - 1 && currentIdx !== -1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setSelectedId(responses[currentIdx - 1]!.id);
    }
  }, [hasPrev, currentIdx, responses]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setSelectedId(responses[currentIdx + 1]!.id);
    }
  }, [hasNext, currentIdx, responses]);

  let responsesContent: React.ReactNode;
  if (q.isPending) {
    responsesContent = <ResponsesSkeleton />;
  } else if (responses.length === 0) {
    responsesContent = <EmptyResponsesState />;
  } else {
    responsesContent = (
      <>
        <ResponsesMasterList
          responses={responses}
          filteredResponses={filteredResponses}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectResponse={setSelectedId}
          hasNextPage={Boolean(q.hasNextPage)}
          isFetchingNextPage={q.isFetchingNextPage}
          onFetchNextPage={() => void q.fetchNextPage()}
          intentFilter={intentFilter}
          onIntentFilterChange={setIntentFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          totalRevenue={totalRevenue}
          paidCount={paidCount}
          currencySymbol={currencySymbol}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          highCount={highCount}
          warmCount={warmCount}
          lowCount={lowCount}
        />
        <ResponseDetailView
          selected={selected}
          selectedId={selectedId}
          totalResponsesCount={responses.length}
          responseIndex={currentIdx}
          columns={columns}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={handlePrev}
          onNext={handleNext}
          onBackToList={() => setSelectedId(null)}
          onScoreSingle={handleScoreSingle}
          scoringId={scoringId}
        />
      </>
    );
  }

  const isScoringEnabled = leadScoringQuery.data?.enabled ?? false;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/7 px-6">
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
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-[#E8854A]/20 bg-[#E8854A]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E8854A]">
                {count}
              </span>
              {totalRevenue > 0 && (
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                  💰 {currencySymbol}{totalRevenue.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* AI Lead Scoring Toggle Button */}
          <button
            type="button"
            onClick={handleToggleLeadScoring}
            disabled={toggleLeadScoringMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
              isScoringEnabled
                ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 hover:bg-orange-500/25"
                : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white",
              toggleLeadScoringMutation.isPending && "opacity-50 pointer-events-none",
            )}
            title="Toggle AI Lead Scoring for this form"
          >
            <Sparkles className={cn("size-3", isScoringEnabled ? "text-orange-400 fill-orange-400/20" : "")} />
            <span>AI Scoring</span>
            <span
              className={cn(
                "ml-0.5 inline-block h-1.5 w-1.5 rounded-full",
                isScoringEnabled ? "bg-orange-400 animate-pulse" : "bg-zinc-600",
              )}
            />
          </button>

          {responses.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                "bg-[#E8854A]/10 text-[#E8854A] ring-1 ring-[#E8854A]/20",
                "transition-all duration-200 hover:bg-[#E8854A]/20",
                "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
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
      </div>

      {/* High-Intent Alert Banner */}
      {highCount > 0 && (
        <div className="shrink-0 border-b border-orange-500/20 bg-linear-to-r from-orange-500/15 via-orange-500/5 to-transparent px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-orange-500/20 text-xs">🔥</span>
            <span className="text-xs text-orange-200">
              <strong className="text-orange-400 font-semibold">{highCount} High-Intent Lead{highCount > 1 ? "s" : ""}</strong> identified by AI requiring priority action
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIntentFilter(intentFilter === "high" ? "all" : "high")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
              intentFilter === "high"
                ? "bg-orange-500 text-black shadow-sm"
                : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30",
            )}
          >
            {intentFilter === "high" ? "Showing High Intent ✓" : "Filter High Intent →"}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {responsesContent}
      </div>
    </div>
  );
}
