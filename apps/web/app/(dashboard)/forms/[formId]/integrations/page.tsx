"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Link2,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "~/components/ui/dialog";

export default function IntegrationsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const utils = trpc.useUtils();

  const formQuery = trpc.forms.get.useQuery({ formId }, { staleTime: 0, refetchOnMount: "always" });
  const connectMutation = trpc.forms.connectGoogleSheets.useMutation();
  const disconnectMutation = trpc.forms.disconnectGoogleSheets.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const form = formQuery.data;
  const isConnected = form?.googleSheetsConnected ?? false;
  const sheetUrl = form?.googleSheetsSpreadsheetUrl;
  const sheetId = form?.googleSheetsSpreadsheetId;

  async function handleConnect() {
    setConnecting(true);
    try {
      let spreadsheetId = "";
      if (spreadsheetUrlInput.trim()) {
        const matches = spreadsheetUrlInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
        spreadsheetId = matches ? matches[1]! : spreadsheetUrlInput.trim();
      }
      await connectMutation.mutateAsync({
        formId,
        spreadsheetId: spreadsheetId || undefined,
        spreadsheetUrl: spreadsheetUrlInput.trim() || undefined,
      });
      await utils.forms.get.invalidate({ formId });
      toast.success("Google Sheets live sync connected successfully!");
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to connect Google Sheets");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectMutation.mutateAsync({ formId });
      await utils.forms.get.invalidate({ formId });
      toast.success("Google Sheets integration disconnected.");
    } catch {
      toast.error("Failed to disconnect Google Sheets");
    }
  }

  if (formQuery.isPending) {
    return (
      <div className="flex h-full flex-col bg-[#080808]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
          <div className="h-4 w-40 animate-shimmer rounded-full bg-linear-to-r from-white/4 via-white/10 to-white/4 bg-size-[200%_100%]" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-[#6B6B6B]" />
        </div>
      </div>
    );
  }

  if (formQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#080808]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/2 ring-1 ring-white/6">
          <AlertCircle className="size-5 text-[#E8854A]" />
        </div>
        <p className="text-sm text-[#6B6B6B]">Failed to load form details</p>
      </div>
    );
  }

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
          <FormTabs formId={formId} active="integrations" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F2F2F2] flex items-center gap-2">
            <Database className="size-6 text-[#10B981]" />
            Integrations
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1.5">
            Manage live synchronization and third-party data connections for this form.
          </p>
        </div>

        {/* Integration list */}
        <div className="grid gap-6">
          <div className="rounded-2xl border border-white/6 bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] ring-1 ring-[#10B981]/20">
                  <FileSpreadsheet className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#F2F2F2]">Google Sheets</h3>
                    {isConnected ? (
                      <span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#10B981]">
                        Connected
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed max-w-xl">
                    Every submission will instantly append a new row to your Google Sheets document. Useful for analysis, downstream automation, and direct spreadsheet access.
                  </p>

                  {isConnected && sheetId && (
                    <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <span>Connected Spreadsheet ID:</span>
                        <code className="font-mono text-[#F2F2F2] bg-white/5 px-1.5 py-0.5 rounded text-[10px] truncate max-w-xs md:max-w-md block">
                          {sheetId}
                        </code>
                      </div>
                      {sheetUrl && (
                        <a
                          href={sheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#10B981] hover:underline"
                        >
                          Open Google Sheets document
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                {isConnected ? (
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs rounded-xl border"
                  >
                    {disconnectMutation.isPending && (
                      <Loader2 className="size-3 animate-spin mr-1.5" />
                    )}
                    Disconnect
                  </Button>
                ) : (
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#10B981] hover:bg-[#10B981]/90 text-xs font-semibold text-[#0a0a0a] rounded-xl cursor-pointer">
                        Connect Google Sheets
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0F0F0F] border-white/6 text-zinc-300 rounded-2xl max-w-md p-6 border">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                          <FileSpreadsheet className="size-5 text-[#10B981]" />
                          Connect to Google Sheets
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs mt-1.5">
                          Configure live submission sync to your Google Account.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                            Spreadsheet URL or ID (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={spreadsheetUrlInput}
                            onChange={(e) => setSpreadsheetUrlInput(e.target.value)}
                            className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-[#10B981]/30 focus:ring-1 focus:ring-[#10B981]/10 transition-all duration-300"
                          />
                          <p className="text-[10px] text-zinc-600 mt-1">
                            Leave blank to automatically create a new spreadsheet for this form.
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsModalOpen(false)}
                          disabled={connecting}
                          className="text-xs rounded-xl hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConnect}
                          disabled={connecting}
                          className="bg-[#10B981] hover:bg-[#10B981]/90 text-xs font-semibold text-[#0a0a0a] rounded-xl min-w-24"
                        >
                          {connecting ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="size-3.5 animate-spin" />
                              Connecting…
                            </span>
                          ) : (
                            "Connect"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
