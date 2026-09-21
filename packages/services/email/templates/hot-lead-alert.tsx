import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface AnswerItem {
  readonly label: string;
  readonly value: string;
}

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
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <div style={brandBadge}>
              <span style={brandDot} />
              <span style={brandText}>My-Form AI Alert</span>
            </div>
          </Section>

          {/* Alert Hero Banner */}
          <Section style={heroSection}>
            <div style={alertPill}>
              <span style={fireEmoji}>🔥</span> {intentLabel} LEAD · {score}/100 SCORE
            </div>
            <Heading style={h1}>Hot Lead Opportunity</Heading>
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
          {answersSummary.length > 0 && (
            <Section style={answersSection}>
              <Text style={sectionTitle}>Response Snapshot</Text>
              <div style={answersCard}>
                {answersSummary.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    style={idx === answersSummary.length - 1 ? answerRowLast : answerRow}
                  >
                    <Text style={answerLabel}>{item.label}</Text>
                    <Text style={answerValue}>{item.value || "—"}</Text>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* CTA to View & Take Action */}
          <Section style={ctaSection}>
            <Link href={responsesUrl} style={buttonPrimary}>
              Open Lead in Dashboard →
            </Link>
          </Section>

          <Hr style={footerDivider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent automatically by <strong>My-Form AI Lead Scoring</strong>.
            </Text>
            <Text style={footerSubtext}>
              Speed-to-lead matters: reaching out within 5 minutes increases conversion rates by up to 9x.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const body = {
  backgroundColor: "#07080A",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: "24px 0",
  margin: 0,
};

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#111217",
  borderRadius: "16px",
  padding: "36px 32px",
  border: "1px solid #292436",
  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
};

const headerSection = {
  marginBottom: "20px",
};

const brandBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#1A1624",
  border: "1px solid #36294A",
  borderRadius: "20px",
  padding: "6px 14px",
};

const brandDot = {
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#A855F7",
  marginRight: "6px",
};

const brandText = {
  color: "#D8B4FE",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.05em",
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

const h1 = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 8px 0",
  letterSpacing: "-0.02em",
};

const subtext = {
  color: "#9CA3AF",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 12px 0",
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

const answersSection = {
  marginBottom: "24px",
};

const sectionTitle = {
  color: "#9CA3AF",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 10px 0",
};

const answersCard = {
  backgroundColor: "#161822",
  borderRadius: "12px",
  border: "1px solid #242736",
  overflow: "hidden",
};

const answerRow = {
  padding: "12px 16px",
  borderBottom: "1px solid #1F2230",
};

const answerRowLast = {
  padding: "12px 16px",
};

const answerLabel = {
  color: "#9CA3AF",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 3px 0",
};

const answerValue = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: "1.4",
  margin: 0,
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const buttonPrimary = {
  display: "inline-block",
  backgroundColor: "#E8854A",
  color: "#080808",
  fontWeight: "700",
  fontSize: "14px",
  padding: "12px 28px",
  borderRadius: "10px",
  textDecoration: "none",
  boxShadow: "0 4px 14px rgba(232, 133, 74, 0.4)",
};

const footerDivider = {
  borderTop: "1px solid #1F222F",
  margin: "24px 0 16px 0",
};

const footerSection = {
  textAlign: "center" as const,
};

const footerText = {
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};

const footerSubtext = {
  color: "#4B5563",
  fontSize: "11px",
  lineHeight: "1.4",
  margin: 0,
};

export default HotLeadAlertEmail;
