"use client";

import { ShieldCheck, Eye } from "lucide-react";
import LegalPageLayout from "../_components/legal-page-layout";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "We collect minimal account information required to provide secure workspace authentication, including your email address and securely hashed login passwords. When configuring forms, we collect and store the structure of your forms (questions, configurations, validation limits) and all respondent submissions routed to your dashboard.",
  },
  {
    title: "2. How We Use Your Data",
    content:
      "Your data is used strictly to run the conversational runner, construct the 3-Pane Editor preview workspace, deliver real-time response analytics, and power active AI follow-up processors. We do not use your respondent answers or private form configurations to train public large language models.",
  },
  {
    title: "3. Data Security & Encryption",
    content:
      "Data integrity is our utmost priority. All web traffic is routed over secure SSL/TLS channels. Internally, all data communications utilize type-safe, authenticated tRPC routes. Secure database hashing layers protect your passwords, and database access controls isolate workspace partitions cleanly.",
  },
  {
    title: "4. AI Processing Disclosures",
    content:
      "My Form utilizes secure API endpoints to process AI follow-ups (Slice 5) and AI form generation (Slice 7). Prompt descriptions are sent securely to Claude's analytical models to determine the optimal question sequence. These inputs are not retained or utilized by third parties for model training purposes.",
  },
  {
    title: "5. Integrations & Webhooks",
    content:
      "My Form offers support for third-party integrations (Slice 11+). When you configure outbound webhooks, Slack alerts, or Discord channels, form responses are transmitted directly to the configured endpoint. My Form has no control over how these third-party platforms handle your data.",
  },
  {
    title: "6. Your Data Rights & Deletion",
    content:
      "You retain complete control over your workspace. You can edit configurations, clear submissions, or delete your entire form version history from the dashboard at any time. Form deletions instantly and permanently purge all associated respondent tables from our servers.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      badgeIcon={<ShieldCheck className="size-3 text-[#E8854A]" />}
      badgeText="User Protection"
      pageTitle="Privacy Policy"
      lastUpdated="May 27, 2026"
      introParagraph="At My Form, we believe privacy is a fundamental right. This document details our absolute commitment to user data security, explaining exactly what information we collect, how it is routed, and the comprehensive control schemas you maintain over your workspace."
      sections={SECTIONS}
      noticeIcon={<Eye className="size-4.5 text-[#E8854A] shrink-0 mt-0.5" />}
      noticeTitle="Zero Public Training Policy"
      noticeContent="My Form respects content ownership. Under no circumstances do we lease, sell, or utilize private form response telemetry to train public generative model networks."
    />
  );
}
