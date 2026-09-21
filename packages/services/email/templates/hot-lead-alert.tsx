import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  type AnswerItem,
  baseBody,
  baseH1,
  baseSubtext,
  baseCtaSection,
  baseButtonPrimary,
  BrandHeader,
  EmailFooter,
  AnswersPreview,
} from "./email-shared";

export type { AnswerItem };

export interface HotLeadAlertEmailProps {
  readonly formTitle: string;
  readonly score: number;
  readonly intent: "high" | "warm" | "low";
  readonly reason?: string;
  readonly recommendedAction?: string;
  readonly respondentContact?: string;
  readonly answersSummary?: readonly AnswerItem[];
  readonly responsesUrl: string;
}

// ---------------------------------------------------------------------------
// Template-specific styles (purple AI theme)
// ---------------------------------------------------------------------------

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#111217",
  borderRadius: "16px",
  padding: "36px 32px",
  border: "1px solid #292436",
  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
};

const heroSection = {
  marginBottom: "24px",
};

const alertPill = {
  display: "inline-block",
  backgroundColor: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.4)",
  color: "#F87171",
  fontSize: "12px",
  fontWeight: "800",
  borderRadius: "8px",
  padding: "4px 10px",
  marginBottom: "12px",
  letterSpacing: "0.05em",
};

const fireEmoji = {
  marginRight: "4px",
};

const contactPill = {
  display: "inline-block",
  backgroundColor: "#191B24",
  border: "1px solid #2B2E3D",
  color: "#D1D5DB",
  fontSize: "13px",
  borderRadius: "8px",
  padding: "6px 12px",
  margin: 0,
};

const aiCard = {
  backgroundColor: "#161320",
  borderRadius: "12px",
  border: "1px solid #3B2857",
  padding: "20px",
  marginBottom: "24px",
};

const aiCardHeader = {
  marginBottom: "12px",
};

const aiBadge = {
  color: "#C084FC",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.08em",
  margin: 0,
};

const aiBlock = {
  marginBottom: "14px",
  paddingBottom: "14px",
  borderBottom: "1px solid #2B1E40",
};

const aiBlockLast = {
  margin: 0,
};

const aiLabel = {
  color: "#A1A1AA",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};

const aiText = {
  color: "#F3E8FF",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
};

const aiActionLabel = {
  color: "#FBBF24",
  fontSize: "12px",
  fontWeight: "700",
  margin: "0 0 4px 0",
};

const aiActionText = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: 0,
};

const subtext = { ...baseSubtext, margin: "0 0 12px 0" };

export function HotLeadAlertEmail({
  formTitle,
  score,
  intent,
  reason,
  recommendedAction,
  respondentContact,
  answersSummary = [],
  responsesUrl,
}: Readonly<HotLeadAlertEmailProps>) {
  const intentLabel = intent === "high" ? "HIGH INTENT" : intent.toUpperCase();

  return (
    <Html>
      <Head />
      <Preview>{`🔥 High Intent Lead Alert (${score}/100) on "${formTitle}"`}</Preview>
      <Body style={baseBody}>
        <Container style={container}>
          <BrandHeader
            label="My-Form AI Alert"
            dotColor="#A855F7"
            badgeStyle={{ backgroundColor: "#1A1624", border: "1px solid #36294A" }}
            textStyle={{ color: "#D8B4FE" }}
          />

          {/* Alert Hero Banner */}
          <Section style={heroSection}>
            <div style={alertPill}>
              <span style={fireEmoji}>🔥</span> {intentLabel} LEAD · {score}/100 SCORE
            </div>
            <Heading style={baseH1}>Hot Lead Opportunity</Heading>
            <Text style={subtext}>
              A response on <strong>&quot;{formTitle}&quot;</strong> has been classified as high-intent by the AI Lead Qualification engine.
            </Text>
            {respondentContact && (
              <Text style={contactPill}>
                Lead Contact: <strong>{respondentContact}</strong>
              </Text>
            )}
          </Section>

          {/* AI Intelligence Card */}
          <Section style={aiCard}>
            <div style={aiCardHeader}>
              <Text style={aiBadge}>AI ANALYSIS & QUALIFICATION</Text>
            </div>
            {reason && (
              <div style={aiBlock}>
                <Text style={aiLabel}>Why this lead is hot</Text>
                <Text style={aiText}>{reason}</Text>
              </div>
            )}
            {recommendedAction && (
              <div style={aiBlockLast}>
                <Text style={aiActionLabel}>Recommended Next Step</Text>
                <Text style={aiActionText}>{recommendedAction}</Text>
              </div>
            )}
          </Section>

          {/* Key Answers Preview */}
          <AnswersPreview title="Response Snapshot" items={answersSummary} />

          {/* CTA to View & Take Action */}
          <Section style={baseCtaSection}>
            <Link href={responsesUrl} style={baseButtonPrimary}>
              Open Lead in Dashboard →
            </Link>
          </Section>

          <EmailFooter
            mainText={<>Sent automatically by <strong>My-Form AI Lead Scoring</strong>.</>}
            subText="Speed-to-lead matters: reaching out within 5 minutes increases conversion rates by up to 9x."
          />
        </Container>
      </Body>
    </Html>
  );
}

export default HotLeadAlertEmail;
