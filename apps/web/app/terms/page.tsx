"use client";

import { FileText, ShieldAlert } from "lucide-react";
import LegalPageLayout from "../_components/legal-page-layout";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the My Form workspace, public runner endpoints, and AI generative modules, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the platform.",
  },
  {
    title: "2. Description of Service",
    content:
      "My Form provides an AI-native conversational form workspace including our 3-Pane Visual Editor, Typeform-style runner interfaces, AI Auto-Follow Up processors, and response analytics dashboard visualization engines. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.",
  },
  {
    title: "3. Account Security & Auth",
    content:
      "You are responsible for keeping your account credentials secure. You must immediately notify My Form of any unauthorized use of your account. My Form cannot and will not be liable for any loss or damage arising from your failure to secure your account credentials.",
  },
  {
    title: "4. Data Ownership & Content",
    content:
      "You retain full ownership of all form schemas, descriptive configurations, and respondent submission values collected through My Form. My Form acts solely as a data processor. You are solely responsible for compliance with global privacy regulations (GDPR, CCPA) regarding the collection of personal information.",
  },
  {
    title: "5. Intellectual Property",
    content:
      "All visual canvas layouts, Zustand state managers, custom CSS tokens, proprietary AI routing logic, and system codebase parameters are the sole intellectual property of My Form. You may not reverse-engineer, copy, or redistribute any aspect of the platform's core code or proprietary visual systems.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "My Form is provided on an 'as-is' and 'as-available' basis without warranties of any kind. Under no circumstances shall My Form be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform.",
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      badgeIcon={<FileText className="size-3 text-[#E8854A]" />}
      badgeText="Legal Guidelines"
      pageTitle="Terms of Service"
      lastUpdated="May 27, 2026"
      introParagraph="Welcome to My Form. Please read these Terms of Service carefully before utilizing our workspace platforms. By logging into your account or running active schemas, you acknowledge that you have read, understood, and agreed to be governed by these conditions."
      sections={SECTIONS}
      noticeIcon={<ShieldAlert className="size-4.5 text-[#E8854A] shrink-0 mt-0.5" />}
      noticeTitle="Acceptable Use Policy"
      noticeContent="Accounts found constructing malicious schemas, executing phishing surveys, or deliberately generating harmful content violating global directives will be terminated immediately."
    />
  );
}
