"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  X,
  Mic,
  CreditCard,
  Flame,
  MessageSquare,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface FeatureRow {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly badge?: string;
  readonly myForm: {
    readonly available: boolean;
    readonly text: string;
  };
  readonly googleForms: {
    readonly available: boolean;
    readonly text: string;
  };
  readonly msForms: {
    readonly available: boolean;
    readonly text: string;
  };
}

const COMPARISON_FEATURES: readonly FeatureRow[] = [
  {
    title: "Voice-to-Form Dictation",
    description: "Speak answers naturally on mobile with AI transcription & key points.",
    icon: Mic,
    badge: "AI Powered",
    myForm: {
      available: true,
      text: "Instant AI speech-to-text dictation",
    },
    googleForms: {
      available: false,
      text: "Manual keyboard typing only",
    },
    msForms: {
      available: false,
      text: "Manual keyboard typing only",
    },
  },
  {
    title: "Native Payment Collection",
    description: "In-form 1-click Razorpay / Stripe checkout with automated receipts.",
    icon: CreditCard,
    badge: "Zero Fraud",
    myForm: {
      available: true,
      text: "Native Checkout modal + verified receipts",
    },
    googleForms: {
      available: false,
      text: "Manual UPI screenshot upload",
    },
    msForms: {
      available: false,
      text: "External 3rd-party plugin required",
    },
  },
  {
    title: "AI Lead Scoring & Hot Alerts",
    description: "Evaluates intent 0–100 and sends instant alerts for high-value leads.",
    icon: Flame,
    badge: "Revenue Boost",
    myForm: {
      available: true,
      text: "Real-time scoring & instant hot lead email",
    },
    googleForms: {
      available: false,
      text: "Raw unorganized spreadsheet dump",
    },
    msForms: {
      available: false,
      text: "Basic response charts only",
    },
  },
  {
    title: "Conversational UI & Follow-ups",
    description: "Discord-style interactive runner with adaptive AI follow-up questions.",
    icon: MessageSquare,
    badge: "2x Completion",
    myForm: {
      available: true,
      text: "Interactive chat view + dynamic AI debrief",
    },
    googleForms: {
      available: false,
      text: "Static 2012-era wall of questions",
    },
    msForms: {
      available: false,
      text: "Traditional paginated survey",
    },
  },
  {
    title: "Ultra-Premium Email Receipts",
    description: "Dark-glass receipts with transaction ID and submitted answers copy.",
    icon: Mail,
    myForm: {
      available: true,
      text: "Branded Resend receipts & notifications",
    },
    googleForms: {
      available: false,
      text: "Plain unstyled notification or none",
    },
    msForms: {
      available: false,
      text: "Standard plain text system email",
    },
  },
  {
    title: "BYOK Gateway (Custom Keys)",
    description: "Route registration fees directly into your own Razorpay merchant account.",
    icon: KeyRound,
    myForm: {
      available: true,
      text: "Direct merchant routing + test sandbox",
    },
    googleForms: {
      available: false,
      text: "Not supported",
    },
    msForms: {
      available: false,
      text: "Not supported",
    },
  },
  {
    title: "Real-time Google Sheets Sync",
    description: "Automated background row appending with formatted response values.",
    icon: ShieldCheck,
    myForm: {
      available: true,
      text: "Instant background sync with payment ID",
    },
    googleForms: {
      available: true,
      text: "Standard Google Sheet connection",
    },
    msForms: {
      available: false,
      text: "Excel Online sync only",
    },
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="relative px-4 py-24 sm:py-32">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-160 w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8854A] opacity-[0.04] blur-[160px]"
      />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-16 text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full border border-[#E8854A]/25 bg-[#E8854A]/5 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#E8854A]">
              <Sparkles className="size-3 animate-pulse text-[#E8854A]" />
              <span>The Modern Alternative</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl md:text-5xl">
              Why Teams are Leaving Legacy Forms
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#8E8E93] sm:text-base">
              Google Forms was built in 2012 for passive questionnaires. My-Form is built for 2026:
              voice-powered, revenue-generating, and qualified by AI in real time.
            </p>
          </div>
        </ScrollReveal>

        {/* Comparison Table Container */}
        <ScrollReveal delay={0.1}>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/6 bg-[#0E0F14]/80 backdrop-blur-xl shadow-2xl">
            {/* Table wrapper for mobile horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/6 bg-white/2">
                    <th className="p-6 text-xs font-semibold uppercase tracking-wider text-[#8E8E93] w-2/5">
                      Capability & Feature
                    </th>
                    {/* My-Form Header (Highlighted) */}
                    <th className="relative p-6 text-left w-2/5 bg-[#E8854A]/6 border-x border-[#E8854A]/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white tracking-tight">
                            My-Form
                          </span>
                          <span className="rounded-full bg-[#E8854A] px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-black">
                            Next-Gen
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="p-6 text-left w-1/5 text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                      Google Forms
                    </th>
                    <th className="p-6 text-left w-1/5 text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                      Microsoft Forms
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {COMPARISON_FEATURES.map((feat) => {
                    const IconComponent = feat.icon;
                    return (
                      <tr
                        key={feat.title}
                        className="transition-colors hover:bg-white/1.5 group"
                      >
                        {/* Feature name & description */}
                        <td className="p-6 align-top">
                          <div className="flex items-start gap-3.5">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/4 border border-white/8 text-[#E8854A] group-hover:border-[#E8854A]/30 transition-colors">
                              <IconComponent className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#F2F2F2]">
                                  {feat.title}
                                </span>
                                {feat.badge && (
                                  <span className="rounded border border-[#E8854A]/30 bg-[#E8854A]/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#E8854A]">
                                    {feat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-[#8E8E93] leading-relaxed">
                                {feat.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* My-Form Cell (Highlighted) */}
                        <td className="p-6 align-top bg-[#E8854A]/4 border-x border-[#E8854A]/15">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                              <Check className="size-3 stroke-3" />
                            </div>
                            <span className="text-xs font-semibold text-white leading-tight">
                              {feat.myForm.text}
                            </span>
                          </div>
                        </td>

                        {/* Google Forms Cell */}
                        <td className="p-6 align-top">
                          <div className="flex items-start gap-2.5">
                            {feat.googleForms.available ? (
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                                <Check className="size-3" />
                              </div>
                            ) : (
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-600">
                                <X className="size-3" />
                              </div>
                            )}
                            <span className="text-xs text-[#71717A] leading-tight">
                              {feat.googleForms.text}
                            </span>
                          </div>
                        </td>

                        {/* Microsoft Forms Cell */}
                        <td className="p-6 align-top">
                          <div className="flex items-start gap-2.5">
                            {feat.msForms.available ? (
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                                <Check className="size-3" />
                              </div>
                            ) : (
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-600">
                                <X className="size-3" />
                              </div>
                            )}
                            <span className="text-xs text-[#71717A] leading-tight">
                              {feat.msForms.text}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Conversion Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/6 bg-linear-to-r from-white/2 via-[#E8854A]/5 to-white/2 p-6 sm:p-8">
              <div>
                <h4 className="text-base font-semibold text-white">
                  Stop losing respondents to tedious, 2012-era forms.
                </h4>
                <p className="mt-0.5 text-xs text-[#8E8E93]">
                  Start collecting payments and qualifying leads with AI in under 2 minutes.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E8854A] px-5 py-2.5 text-xs font-bold text-[#080808] transition-all hover:bg-[color-mix(in_srgb,#E8854A_90%,#fff)] shadow-lg shadow-[#E8854A]/20 cursor-pointer shrink-0"
              >
                Create Your First Form Free
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default ComparisonSection;
