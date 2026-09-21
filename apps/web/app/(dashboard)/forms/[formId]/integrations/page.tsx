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
  Sparkles,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { FormTabs } from "../_components/form-tabs";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "~/components/ui/dialog";

const SPREADSHEET_ID_REGEX = /\/d\/([\w-]+)/;

function getGatewayLabel(razorpayKeyId?: string, platformConfigured?: boolean): string {
  if (razorpayKeyId) {
    return "Custom Razorpay Key (BYOK)";
  }
  if (platformConfigured) {
    return "Platform Default Razorpay Key";
  }
  return "Test Simulation Gateway";
}

function getPaymentButtonContent(isPending: boolean, isEnabled: boolean): React.ReactNode {
  if (isPending) {
    return <Loader2 className="size-3 animate-spin" />;
  }
  if (isEnabled) {
    return "Disable";
  }
  return "Enable Payments";
}

function PaymentIntegrationSection({ formId }: { readonly formId: string }) {
  const utils = trpc.useUtils();
  const paymentQuery = trpc.forms.getPaymentConfig.useQuery({ formId });
  const updatePaymentMutation = trpc.forms.updatePaymentConfig.useMutation();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    enabled: boolean;
    provider: "razorpay" | "stripe" | "test";
    amount: number;
    currency: "INR" | "USD" | "EUR" | "GBP";
    itemName: string;
    description: string;
    razorpayKeyId: string;
    testMode: boolean;
  }>({
    enabled: false,
    provider: "razorpay",
    amount: 499,
    currency: "INR",
    itemName: "Event Registration / Fee",
    description: "Secure payment via Razorpay",
    razorpayKeyId: "",
    testMode: false,
  });

  const isPaymentEnabled = Boolean(paymentQuery.data?.config.enabled);

  function openPaymentModal() {
    const cfg = paymentQuery.data?.config;
    if (cfg) {
      setPaymentForm({
        enabled: Boolean(cfg.enabled),
        provider: cfg.provider ?? "razorpay",
        amount: cfg.amount || 499,
        currency: cfg.currency || "INR",
        itemName: cfg.itemName || "Event Registration / Fee",
        description: cfg.description || "",
        razorpayKeyId: cfg.razorpayKeyId || "",
        testMode: Boolean(cfg.testMode),
      });
    }
    setIsPaymentModalOpen(true);
  }

  async function handleSavePayment() {
    try {
      await updatePaymentMutation.mutateAsync({
        formId,
        config: {
          enabled: paymentForm.enabled,
          provider: paymentForm.provider,
          amount: Number(paymentForm.amount),
          currency: paymentForm.currency,
          itemName: paymentForm.itemName,
          description: paymentForm.description || undefined,
          razorpayKeyId: paymentForm.razorpayKeyId.trim() || undefined,
          testMode: paymentForm.testMode,
        },
      });
      await paymentQuery.refetch();
      await utils.forms.get.invalidate({ formId });
      toast.success("Payment configuration saved successfully!");
      setIsPaymentModalOpen(false);
    } catch {
      toast.error("Failed to save payment configuration");
    }
  }

  async function handleTogglePayment() {
    const current = paymentQuery.data?.config;
    const nextEnabled = !current?.enabled;
    try {
      await updatePaymentMutation.mutateAsync({
        formId,
        config: {
          enabled: nextEnabled,
          provider: current?.provider ?? "razorpay",
          amount: current?.amount || 499,
          currency: current?.currency || "INR",
          itemName: current?.itemName || "Registration Fee",
          description: current?.description || undefined,
          razorpayKeyId: current?.razorpayKeyId || undefined,
          testMode: Boolean(current?.testMode),
        },
      });
      await paymentQuery.refetch();
      await utils.forms.get.invalidate({ formId });
      toast.success(nextEnabled ? "Payment collection enabled!" : "Payment collection disabled.");
    } catch {
      toast.error("Failed to update payment status");
    }
  }

  const gatewayLabel = getGatewayLabel(
    paymentQuery.data?.config.razorpayKeyId,
    paymentQuery.data?.platformKeyConfigured,
  );
  const paymentButtonContent = getPaymentButtonContent(
    updatePaymentMutation.isPending,
    isPaymentEnabled,
  );

  return (
    <>
      <div className="rounded-2xl border border-white/6 bg-white/1 p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/2">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <CreditCard className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-[#F2F2F2]">
                  Native Payment Collection (Razorpay Checkout)
                </h3>
                {isPaymentEnabled ? (
                  <>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                      Active · {paymentQuery.data?.config.currency} {paymentQuery.data?.config.amount}
                    </span>
                    {paymentQuery.data?.config.testMode && (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                        Test Mode
                      </span>
                    )}
                  </>
                ) : (
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed max-w-xl">
                Collect payments for tickets, digital downloads, consulting bookings, or registration fees directly inside your form. Submissions are finalized only after verified payment.
              </p>

              {isPaymentEnabled && (
                <div className="mt-4 rounded-xl bg-white/3 border border-white/5 p-3.5 space-y-1.5 max-w-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Item:</span>
                    <span className="font-semibold text-zinc-200">
                      {paymentQuery.data?.config.itemName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Gateway:</span>
                    <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      {gatewayLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={openPaymentModal}
              className="text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-200 cursor-pointer"
            >
              Configure
            </Button>
            <Button
              onClick={handleTogglePayment}
              disabled={updatePaymentMutation.isPending}
              className={cn(
                "text-xs font-semibold rounded-xl min-w-28 cursor-pointer transition-all",
                isPaymentEnabled
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  : "bg-emerald-500 hover:bg-emerald-500/90 text-black",
              )}
            >
              {paymentButtonContent}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Configuration Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="bg-[#0F0F0F] border-white/6 text-zinc-300 rounded-2xl max-w-lg p-6 border">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="size-5 text-emerald-400" />
              Configure Native Payment Collection
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs mt-1.5">
              Set the item price, currency, and checkout parameters for this form.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Enable Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-white">Require Payment on Submission</p>
                <p className="text-[11px] text-zinc-500">
                  When enabled, users must pay the checkout card to finish submitting.
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentForm.enabled}
                onChange={(e) => setPaymentForm({ ...paymentForm, enabled: e.target.checked })}
                className="size-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Item Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="payment-item-name"
                className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
              >
                Item or Service Name
              </label>
              <input
                id="payment-item-name"
                type="text"
                placeholder="e.g. Conference Pass / 1:1 Consultation"
                value={paymentForm.itemName}
                onChange={(e) => setPaymentForm({ ...paymentForm, itemName: e.target.value })}
                className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* Amount & Currency Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="payment-amount"
                  className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
                >
                  Amount
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="499"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="payment-currency"
                  className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
                >
                  Currency
                </label>
                <select
                  id="payment-currency"
                  value={paymentForm.currency}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      currency: e.target.value as "INR" | "USD" | "EUR" | "GBP",
                    })
                  }
                  className="w-full bg-[#141414] text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all cursor-pointer"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="payment-description"
                className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
              >
                Short Description (Optional)
              </label>
              <input
                id="payment-description"
                type="text"
                placeholder="e.g. Instant confirmation email with ticket PDF"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* Test Mode Simulation */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div>
                <p className="text-xs font-semibold text-amber-300">Test Simulation Mode</p>
                <p className="text-[11px] text-zinc-400">
                  Allows test submissions with 1-click simulation without charging a real payment card or UPI.
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentForm.testMode}
                onChange={(e) => setPaymentForm({ ...paymentForm, testMode: e.target.checked })}
                className="size-4 rounded accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Custom Razorpay Key ID (BYOK) */}
            <div className="space-y-1.5">
              <label
                htmlFor="payment-key-id"
                className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
              >
                Custom Razorpay Key ID (Optional BYOK)
              </label>
              <input
                id="payment-key-id"
                type="text"
                placeholder="rzp_test_... or rzp_live_..."
                value={paymentForm.razorpayKeyId}
                onChange={(e) => setPaymentForm({ ...paymentForm, razorpayKeyId: e.target.value })}
                className="w-full bg-white/3 text-zinc-200 placeholder-zinc-600 px-3.5 py-2.5 text-xs rounded-xl border border-white/5 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all font-mono"
              />
              <p className="text-[10px] text-zinc-500">
                {paymentQuery.data?.platformKeyConfigured
                  ? "Platform key is active. Leave blank to automatically use the platform default gateway."
                  : "Enter your Razorpay Key ID so payments are routed directly into your Razorpay account."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={updatePaymentMutation.isPending}
              className="text-xs rounded-xl hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={updatePaymentMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-500/90 text-xs font-semibold text-black rounded-xl min-w-28"
            >
              {updatePaymentMutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function IntegrationsPage({ params }: { readonly params: Promise<{ readonly formId: string }> }) {
  const { formId } = use(params);
  const utils = trpc.useUtils();

  const formQuery = trpc.forms.get.useQuery({ formId }, { staleTime: 0, refetchOnMount: "always" });
  const connectMutation = trpc.forms.connectGoogleSheets.useMutation();
  const disconnectMutation = trpc.forms.disconnectGoogleSheets.useMutation();
  const leadScoringQuery = trpc.forms.getLeadScoring.useQuery({ formId });
  const toggleLeadScoringMutation = trpc.forms.toggleLeadScoring.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const form = formQuery.data;
  const isConnected = form?.googleSheetsConnected ?? false;
  const sheetUrl = form?.googleSheetsSpreadsheetUrl;
  const sheetId = form?.googleSheetsSpreadsheetId;
  const isLeadScoringEnabled = Boolean(leadScoringQuery.data?.enabled);

  let scoringButtonContent: React.ReactNode = "Enable Scoring";
  if (toggleLeadScoringMutation.isPending) {
    scoringButtonContent = <Loader2 className="size-3 animate-spin" />;
  } else if (isLeadScoringEnabled) {
    scoringButtonContent = "Disable Scoring";
  }

  async function handleToggleLeadScoring() {
    const next = !leadScoringQuery.data?.enabled;
    try {
      await toggleLeadScoringMutation.mutateAsync({ formId, enabled: next });
      await leadScoringQuery.refetch();
      toast.success(
        next
          ? "AI Lead Scoring enabled! Submissions will be analyzed automatically."
          : "AI Lead Scoring disabled for this form.",
      );
    } catch {
      toast.error("Failed to update AI Lead Scoring setting");
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      let spreadsheetId = "";
      if (spreadsheetUrlInput.trim()) {
        const matches = SPREADSHEET_ID_REGEX.exec(spreadsheetUrlInput);
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
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/7 px-6">
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
          {/* AI Lead Scoring Integration */}
          <div className="rounded-2xl border border-white/6 bg-white/1 p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/2">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#F2F2F2]">
                      AI Lead Scoring & Intent Detection
                    </h3>
                    {leadScoringQuery.data?.enabled ? (
                      <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-orange-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed max-w-xl">
                    Automatically evaluate every response with AI to calculate lead quality from 1–100, classify intent (High / Warm / Low), and highlight hot prospects directly in your responses dashboard.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <Button
                  onClick={handleToggleLeadScoring}
                  disabled={toggleLeadScoringMutation.isPending}
                  className={cn(
                    "text-xs font-semibold rounded-xl min-w-32 cursor-pointer transition-all",
                    isLeadScoringEnabled
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                      : "bg-[#E8854A] hover:bg-[#E8854A]/90 text-black",
                  )}
                >
                  {scoringButtonContent}
                </Button>
              </div>
            </div>
          </div>

          {/* Native Payment Collection (Razorpay) Integration */}
          <PaymentIntegrationSection formId={formId} />

          <div className="rounded-2xl border border-white/6 bg-white/1 p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/2">
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
                    <div className="mt-4 rounded-xl bg-white/3 border border-white/5 p-3.5 space-y-1.5">
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
                          <label
                            htmlFor="spreadsheet-url-input"
                            className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block"
                          >
                            Spreadsheet URL or ID (Optional)
                          </label>
                          <input
                            id="spreadsheet-url-input"
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
