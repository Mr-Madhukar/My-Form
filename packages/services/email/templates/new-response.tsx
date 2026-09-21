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
  getCurrencySymbol,
  baseBody,
  baseContainer,
  baseHeroSection,
  baseH1,
  baseSubtext,
  baseMetaText,
  baseCtaSection,
  baseButtonPrimary,
  BrandHeader,
  EmailFooter,
  AnswersPreview,
} from "./email-shared";

export type { AnswerItem };

export interface PaymentSummary {
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly transactionId?: string;
}

export interface LeadScoreSummary {
  readonly score: number;
  readonly intent: "high" | "warm" | "low";
}

export interface NewResponseEmailProps {
  readonly formTitle: string;
  readonly responseCount: number;
  readonly responsesUrl: string;
  readonly submittedAt?: string;
  readonly answersSummary?: readonly AnswerItem[];
  readonly payment?: PaymentSummary;
  readonly leadScore?: LeadScoreSummary;
}

// ---------------------------------------------------------------------------
// Template-specific styles
// ---------------------------------------------------------------------------

const heroSection = { ...baseHeroSection, marginBottom: "20px" };

const countPill = {
  display: "inline-block",
  backgroundColor: "rgba(232, 133, 74, 0.15)",
  border: "1px solid rgba(232, 133, 74, 0.35)",
  color: "#E8854A",
  fontSize: "12px",
  fontWeight: "800",
  borderRadius: "8px",
  padding: "4px 10px",
  marginBottom: "10px",
  letterSpacing: "0.05em",
};

const badgesSection = {
  display: "flex",
  gap: "10px",
  marginBottom: "22px",
};

const paidBadge = {
  display: "inline-block",
  backgroundColor: "rgba(16, 185, 129, 0.15)",
  border: "1px solid rgba(16, 185, 129, 0.3)",
  color: "#34D399",
  fontSize: "11px",
  fontWeight: "800",
  borderRadius: "6px",
  padding: "4px 10px",
  letterSpacing: "0.05em",
};

const highIntentBadge = {
  display: "inline-block",
  backgroundColor: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.35)",
  color: "#F87171",
  fontSize: "11px",
  fontWeight: "800",
  borderRadius: "6px",
  padding: "4px 10px",
  letterSpacing: "0.05em",
};

const warmIntentBadge = {
  display: "inline-block",
  backgroundColor: "rgba(245, 158, 11, 0.15)",
  border: "1px solid rgba(245, 158, 11, 0.35)",
  color: "#FBBF24",
  fontSize: "11px",
  fontWeight: "800",
  borderRadius: "6px",
  padding: "4px 10px",
  letterSpacing: "0.05em",
};

const lowIntentBadge = {
  display: "inline-block",
  backgroundColor: "#1F222F",
  border: "1px solid #2B2E3E",
  color: "#9CA3AF",
  fontSize: "11px",
  fontWeight: "700",
  borderRadius: "6px",
  padding: "4px 10px",
};

function getLeadScoreBadgeStyle(intent: "high" | "warm" | "low"): React.CSSProperties {
  if (intent === "high") return highIntentBadge;
  if (intent === "warm") return warmIntentBadge;
  return lowIntentBadge;
}

export function NewResponseEmail({
  formTitle,
  responseCount,
  responsesUrl,
  submittedAt,
  answersSummary = [],
  payment,
  leadScore,
}: Readonly<NewResponseEmailProps>) {
  const isPaid = payment?.status === "paid";
  const currencySymbol = getCurrencySymbol(payment?.currency);

  return (
    <Html>
      <Head />
      <Preview>{`New response #${responseCount} on "${formTitle}" 🎉`}</Preview>
      <Body style={baseBody}>
        <Container style={baseContainer}>
          <BrandHeader label="My-Form Notifications" />

          {/* Title & Count */}
          <Section style={heroSection}>
            <div style={countPill}>Response #{responseCount}</div>
            <Heading style={baseH1}>New Form Submission</Heading>
            <Text style={baseSubtext}>
              Someone just submitted <strong>&quot;{formTitle}&quot;</strong>.
            </Text>
            {submittedAt && <Text style={baseMetaText}>Submitted at {submittedAt}</Text>}
          </Section>

          {/* Dynamic Badges Row */}
          {(isPaid || leadScore) && (
            <Section style={badgesSection}>
              {isPaid && (
                <div style={paidBadge}>
                  💰 {currencySymbol}
                  {payment.amount} {payment.currency} PAID
                </div>
              )}
              {leadScore && (
                <div style={getLeadScoreBadgeStyle(leadScore.intent)}>
                  {leadScore.intent === "high" ? "🔥" : "⚡"} {leadScore.score}/100 LEAD SCORE
                </div>
              )}
            </Section>
          )}

          {/* Submitted Answers Preview */}
          <AnswersPreview title="Response Preview" items={answersSummary} maxItems={8} />

          {/* Primary CTA Button */}
          <Section style={baseCtaSection}>
            <Link href={responsesUrl} style={baseButtonPrimary}>
              View Full Response in Dashboard →
            </Link>
          </Section>

          <EmailFooter
            mainText={<>You are receiving this email because you created <strong>{formTitle}</strong> on My-Form.</>}
            subText={<>Total lifetime responses on this form: <strong>{responseCount}</strong></>}
          />
        </Container>
      </Body>
    </Html>
  );
}

export default NewResponseEmail;
