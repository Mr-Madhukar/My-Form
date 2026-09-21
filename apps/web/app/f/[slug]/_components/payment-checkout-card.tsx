"use client";

import { CreditCard, ShieldCheck, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";

export type PaymentReceipt = {
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
};

type PaymentCheckoutCardProps = {
  readonly itemName: string;
  readonly amount: number;
  readonly currency: string;
  readonly description?: string;
  readonly isProcessing: boolean;
  readonly paymentSuccess: PaymentReceipt | null;
  readonly submitPending: boolean;
  readonly onPayRazorpay: () => void;
  readonly onPayTest: () => void;
  readonly onCompleteSubmit: () => void;
  readonly onBack: () => void;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  EUR: "€",
  GBP: "£",
  USD: "$",
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? "$";
}

export function PaymentCheckoutCard({
  itemName,
  amount,
  currency,
  description,
  isProcessing,
  paymentSuccess,
  submitPending,
  onPayRazorpay,
  onPayTest,
  onCompleteSubmit,
  onBack,
}: PaymentCheckoutCardProps) {
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="w-full bg-[#2b2d31]/50 border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col justify-between backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/6 pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#949ba4] block leading-none">
            Final Step · Payment
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">Order Summary</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <ShieldCheck className="size-3.5" />
          <span>SSL Secured</span>
        </span>
      </div>

      {/* Item & Pricing Box */}
      <div className="rounded-xl bg-white/3 border border-white/5 p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-semibold text-zinc-100">{itemName}</span>
          <span className="text-2xl font-mono font-extrabold text-(--form-accent)">
            {currencySymbol}
            {amount}
          </span>
        </div>
        {description && <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>}
      </div>

      {/* Payment Action or Verified Status */}
      {paymentSuccess ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="size-4" />
            <span>
              Payment Verified: {currencySymbol}
              {amount}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Transaction ID: <span className="text-zinc-200">{paymentSuccess.transactionId}</span>
          </p>
          <Button
            onClick={onCompleteSubmit}
            disabled={submitPending}
            className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {submitPending && <Loader2 className="size-3.5 animate-spin mr-2" />}
            Confirm & Complete Submission
          </Button>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {/* Razorpay Button */}
          <Button
            onClick={onPayRazorpay}
            disabled={isProcessing}
            className="w-full h-12 bg-(--form-accent) hover:brightness-110 text-[#0a0a0a] font-bold text-sm rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            <span>
              Pay {currencySymbol}
              {amount} with UPI / Card
            </span>
          </Button>

          {/* Test Simulation Button */}
          <button
            type="button"
            onClick={onPayTest}
            disabled={isProcessing}
            className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 border border-dashed border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🧪 Test Payment (Simulation Mode)</span>
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="pt-2 border-t border-white/4 flex items-center justify-between text-xs text-zinc-500">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isProcessing || submitPending}
          className="h-8 rounded-lg px-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <ArrowLeft className="size-3.5 mr-1" />
          Edit Answers
        </Button>
        <span className="font-mono text-[11px] text-zinc-400">Powered by Razorpay</span>
      </div>
    </div>
  );
}
