"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { StatsBar } from "./stats-bar";
import { LandingFooter } from "./landing-footer";

const ProductBento = dynamic(
  () => import("./product-bento").then((mod) => mod.ProductBento),
  { ssr: true }
);
const WedgeShowcase = dynamic(
  () => import("./wedge-showcase").then((mod) => mod.WedgeShowcase),
  { ssr: true }
);
const Pricing = dynamic(
  () => import("./pricing").then((mod) => mod.Pricing),
  { ssr: true }
);
const Testimonials = dynamic(
  () => import("./testimonials").then((mod) => mod.Testimonials),
  { ssr: true }
);
const LandingFaq = dynamic(
  () => import("./faq").then((mod) => mod.LandingFaq),
  { ssr: true }
);
const FinalCta = dynamic(
  () => import("./final-cta").then((mod) => mod.FinalCta),
  { ssr: true }
);

export function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("homepage-dark");
    return () => {
      document.documentElement.classList.remove("homepage-dark");
    };
  }, []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Background Lighting Flares */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 -top-72 h-176 w-176 -translate-x-1/2 rounded-full bg-[#E8854A] opacity-[0.12] blur-[160px]" />
        <div className="absolute -bottom-88 left-[8vw] h-144 w-xl rounded-full bg-[#174c4c] opacity-[0.12] blur-[170px]" />
        <div className="absolute bottom-[10vh] -right-72 h-144 w-xl rounded-full bg-[#E8854A] opacity-[0.06] blur-[170px]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Page Content */}
      <div className="relative z-10">
        <LandingNav />
        <Hero />
        <StatsBar />
        <ProductBento />
        <WedgeShowcase />
        <Pricing />
        <Testimonials />
        <LandingFaq />
        <FinalCta />
        <LandingFooter />
      </div>
    </main>
  );
}
