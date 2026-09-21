"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Search,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";

type AdminFormItem = {
  id: string;
  publicSlug: string;
  title: string;
  workspaceName: string;
  creatorName: string;
  creatorEmail: string;
  isAcceptingResponses: boolean;
  totalResponses: number;
  createdAt: Date | string;
};

function FormRow({
  form,
  isToggling,
  onToggleStatus,
}: {
  readonly form: AdminFormItem;
  readonly isToggling: boolean;
  readonly onToggleStatus: (formId: string, currentStatus: boolean) => void;
}) {
  return (
    <tr className="hover:bg-zinc-800/30 transition-colors">
      <td className="px-5 py-3.5">
        <div>
          <span className="font-semibold text-zinc-200 block truncate max-w-xs">
            {form.title}
          </span>
          <span className="font-mono text-[11px] text-[#E8854A] block">
            /f/{form.publicSlug}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div>
          <span className="text-zinc-300 font-medium block">
            {form.creatorName}
          </span>
          <span className="text-zinc-500 font-mono text-[11px] block truncate max-w-50">
            {form.creatorEmail}
          </span>
          <span className="text-zinc-600 text-[10px] block mt-0.5">
            {form.workspaceName}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5 font-mono text-zinc-200 font-semibold">
        {form.totalResponses.toLocaleString()}
      </td>

      <td className="px-4 py-3.5 text-zinc-400">
        {format(new Date(form.createdAt), "MMM d, yyyy")}
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isAcceptingResponses}
            disabled={isToggling}
            onCheckedChange={(checked) => onToggleStatus(form.id, checked)}
          />
          <span className="text-[11px] font-mono text-zinc-400">
            {form.isAcceptingResponses ? "Active" : "Paused"}
          </span>
        </div>
      </td>

      <td className="px-5 py-3.5 text-right">
        <a
          href={`/f/${form.publicSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors"
        >
          <span>Open</span>
          <ExternalLink className="size-3" />
        </a>
      </td>
    </tr>
  );
}

export default function AdminFormsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.listAllForms.useQuery(
    {
      page,
      limit: 15,
      search: search.trim() || undefined,
      status: statusFilter,
    },
    { placeholderData: (prev) => prev },
  );

  const toggleStatusMutation = trpc.admin.toggleFormStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.isAcceptingResponses ? "Form is now active" : "Form paused by admin",
      );
      utils.admin.listAllForms.invalidate();
      utils.admin.getPlatformStats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to toggle form status");
    },
  });

  function handleToggleStatus(formId: string, nextStatus: boolean) {
    toggleStatusMutation.mutate({
      formId,
      isAcceptingResponses: nextStatus,
    });
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <Loader2 className="size-6 animate-spin text-[#E8854A]" />
          <span className="text-xs font-mono text-zinc-500">Loading forms directory…</span>
        </div>
      );
    }

    if (!data || data.forms.length === 0) {
      return (
        <div className="p-12 text-center">
          <FileText className="size-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400 font-medium">No forms found</p>
          <p className="text-xs text-zinc-600 mt-1">Try changing your search or filters.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/60 border-b border-zinc-800/60 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Form</th>
              <th className="px-4 py-3">Creator / Workspace</th>
              <th className="px-4 py-3">Responses</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Accepting</th>
              <th className="px-5 py-3 text-right">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data.forms.map((form) => (
              <FormRow
                key={form.id}
                form={form}
                isToggling={toggleStatusMutation.isPending}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="size-6 text-[#E8854A]" />
          Platform Forms Moderation
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Audit forms across all workspaces, review public slugs, and toggle submission acceptance.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/60 backdrop-blur-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by slug…"
            className="pl-9 bg-zinc-950/60 border-zinc-800/80 text-xs h-9 text-zinc-200 placeholder:text-zinc-500 rounded-xl"
          />
        </div>

        <div className="flex items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-0.5 text-xs">
          {(["all", "active", "paused"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-[#E8854A] text-black font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s === "all" ? "All Forms" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table Container */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden backdrop-blur-xs">
        {renderContent()}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/40 text-xs">
            <span className="text-zinc-500">
              Page {data.currentPage} of {data.totalPages} ({data.total} forms)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs border-zinc-800"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs border-zinc-800"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
