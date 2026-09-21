"use client";

import React from "react";
import { ScrollReveal } from "./landing/scroll-reveal";
import { LandingNav } from "./landing/landing-nav";
import { LandingFooter } from "./landing/landing-footer";
import { handleSpotlightMouseMove } from "~/lib/utils";

interface LegalSection {
  readonly title: string;
  readonly content: string;
}

interface LegalPageLayoutProps {
  readonly badgeIcon: React.ReactNode;
  readonly badgeText: string;
  readonly pageTitle: string;
  readonly lastUpdated: string;
  readonly introParagraph: string;
  readonly sections: readonly LegalSection[];
  readonly noticeIcon: React.ReactNode;
  readonly noticeTitle: string;
  readonly noticeContent: string;
}

export default function LegalPageLayout({
  badgeIcon,
  badgeText,
  pageTitle,
  lastUpdated,
  introParagraph,
  sections,
  noticeIcon,
  noticeTitle,
  noticeContent,
}: LegalPageLayoutProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080808] text-[#F2F2F2] flex flex-col justify-between">
      {/* Background Lighting Flares */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 -top-72 h-176 w-176 -translate-x-1/2 rounded-full bg-[#E8854A] opacity-[0.08] blur-[160px]" />
        <div className="absolute -bottom-88 left-[8vw] h-144 w-xl rounded-full bg-[#174c4c] opacity-[0.08] blur-[170px]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <LandingNav />

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-32 sm:pt-36 grow">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full border border-[#E8854A]/25 bg-[#E8854A]/5 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#E8854A]">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-5xl">
              {pageTitle}
            </h1>
            <p className="mt-3 text-xs font-mono text-[#6B6B6B]">Last updated: {lastUpdated}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div
            onMouseMove={handleSpotlightMouseMove}
            className="group relative rounded-[2rem] bg-white/2 p-1.5 ring-1 ring-white/6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/10"
          >
            {/* Spotlight border overlay — radial gradient follows cursor */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(350px circle at var(--mx) var(--my), rgba(232,133,74,0.1), transparent 45%)",
              }}
            />

            {/* Inner Content Core */}
            <div className="relative rounded-[calc(2rem-6px)] bg-[#111] p-6 sm:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/2 text-left">
              {/* Introduction */}
              <div className="mb-8 border-b border-white/6 pb-6">
                <p className="text-sm leading-relaxed text-[#B0B0B0]">
                  {introParagraph}
                </p>
              </div>

              {/* Sections list */}
              <div className="space-y-8">
                {sections.map((sec) => (
                  <div key={sec.title} className="space-y-2.5">
                    <h2 className="text-base font-semibold tracking-tight text-[#F2F2F2]">
                      {sec.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#8E8E93]">{sec.content}</p>
                  </div>
                ))}
              </div>

              {/* Notice capsule */}
              <div className="mt-10 rounded-xl border border-dashed border-[#E8854A]/25 bg-[#E8854A]/4 p-4 flex gap-3 items-start">
                {noticeIcon}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#E8854A] uppercase tracking-wider font-mono">
                    {noticeTitle}
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    {noticeContent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <LandingFooter />
    </main>
  );
}
