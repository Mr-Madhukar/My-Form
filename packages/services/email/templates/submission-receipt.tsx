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

export interface PaymentReceiptInfo {
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly transactionId?: string;
  readonly itemName?: string;
  readonly provider?: string;
}

export interface SubmissionReceiptEmailProps {
  readonly formTitle: string;
  readonly submittedAt?: string;
  readonly answers?: readonly AnswerItem[];
  readonly payment?: PaymentReceiptInfo;
  readonly formUrl?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  EUR: "€",
  GBP: "£",
  USD: "$",
};

function getCurrencySymbol(currency?: string): string {
  if (!currency) return "$";
  return CURRENCY_SYMBOLS[currency] ?? "$";
}

export function SubmissionReceiptEmail({
  formTitle,
  submittedAt,
  answers = [],
  payment,
  formUrl,
}: Readonly<SubmissionReceiptEmailProps>) {
  const isPaid = payment?.status === "paid";
  const currencySymbol = getCurrencySymbol(payment?.currency);

  return (
    <Html>
      <Head />
      <Preview>
        {isPaid
          ? `Payment Receipt & Submission Confirmed: "${formTitle}"`
          : `Submission Received: "${formTitle}"`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <div style={brandBadge}>
              <span style={brandDot} />
              <span style={brandText}>My-Form</span>
            </div>
          </Section>

          {/* Title and Confirmation status */}
          <Section style={heroSection}>
            <div style={statusPill}>
              {isPaid ? "✓ Payment & Submission Confirmed" : "✓ Response Recorded"}
            </div>
            <Heading style={h1}>{formTitle}</Heading>
            <Text style={subtext}>
              {isPaid
                ? "Your payment was processed successfully and your submission has been received."
                : "Thank you! Your response has been securely saved."}
            </Text>
            {submittedAt && <Text style={metaText}>Submitted on {submittedAt}</Text>}
          </Section>

          {/* Payment Receipt Box (if payment is present) */}
          {isPaid && (
            <Section style={receiptCard}>
              <div style={receiptHeader}>
                <Text style={receiptTitle}>Payment Receipt</Text>
                <span style={paidBadge}>PAID</span>
              </div>
              <Hr style={divider} />
              <div style={receiptRow}>
                <Text style={receiptLabel}>Item / Service</Text>
                <Text style={receiptValue}>{payment.itemName || "Form Submission / Registration"}</Text>
              </div>
              <div style={receiptRow}>
                <Text style={receiptLabel}>Amount Paid</Text>
                <Text style={receiptAmount}>
                  {currencySymbol}
                  {payment.amount} {payment.currency}
                </Text>
              </div>
              {payment.transactionId && (
                <div style={receiptRow}>
                  <Text style={receiptLabel}>Transaction ID</Text>
                  <Text style={receiptMono}>{payment.transactionId}</Text>
                </div>
              )}
              {payment.provider && (
                <div style={receiptRow}>
                  <Text style={receiptLabel}>Payment Gateway</Text>
                  <Text style={receiptValue}>
                    {payment.provider.toUpperCase()} (256-Bit SSL Encrypted)
                  </Text>
                </div>
              )}
            </Section>
          )}

          {/* Submitted Answers Summary (if available) */}
          {answers.length > 0 && (
            <Section style={answersSection}>
              <Text style={sectionTitle}>Your Submitted Details</Text>
              <div style={answersCard}>
                {answers.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    style={idx === answers.length - 1 ? answerRowLast : answerRow}
                  >
                    <Text style={answerLabel}>{item.label}</Text>
                    <Text style={answerValue}>{item.value || "—"}</Text>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Optional Form Link CTA */}
          {formUrl && (
            <Section style={ctaSection}>
              <Link href={formUrl} style={buttonSecondary}>
                Visit Form Page →
              </Link>
            </Section>
          )}

          <Hr style={footerDivider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              This is an automated confirmation from <strong>My-Form</strong> on behalf of the form creator.
            </Text>
            <Text style={footerSubtext}>
              If you have questions about your registration or order, please reply directly to the organizer.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles (Dark-mode, Glassmorphism, SaaS Aesthetic)
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
  border: "1px solid #222530",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

const headerSection = {
  marginBottom: "24px",
};

const brandBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#1A1C24",
  border: "1px solid #2B2E3C",
  borderRadius: "20px",
  padding: "6px 14px",
};

const brandDot = {
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#E8854A",
  marginRight: "6px",
};

const brandText = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.05em",
};

const heroSection = {
  marginBottom: "24px",
};

const statusPill = {
  display: "inline-block",
  backgroundColor: "rgba(16, 185, 129, 0.15)",
  border: "1px solid rgba(16, 185, 129, 0.3)",
  color: "#34D399",
  fontSize: "12px",
  fontWeight: "700",
  borderRadius: "8px",
  padding: "4px 10px",
  marginBottom: "12px",
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
  margin: "0 0 6px 0",
};

const metaText = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "0",
  fontFamily: "monospace",
};

const receiptCard = {
  backgroundColor: "#161822",
  borderRadius: "12px",
  border: "1px solid #282C3D",
  padding: "20px",
  marginBottom: "24px",
};

const receiptHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const receiptTitle = {
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: "700",
  margin: 0,
};

const paidBadge = {
  backgroundColor: "rgba(16, 185, 129, 0.2)",
  border: "1px solid rgba(16, 185, 129, 0.4)",
  color: "#10B981",
  fontSize: "11px",
  fontWeight: "800",
  borderRadius: "6px",
  padding: "3px 8px",
  letterSpacing: "0.05em",
};

const divider = {
  borderTop: "1px solid #232635",
  margin: "12px 0",
};

const receiptRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
};

const receiptLabel = {
  color: "#9CA3AF",
  fontSize: "13px",
  margin: 0,
};

const receiptValue = {
  color: "#E5E7EB",
  fontSize: "13px",
  fontWeight: "500",
  margin: 0,
};

const receiptAmount = {
  color: "#34D399",
  fontSize: "15px",
  fontWeight: "700",
  margin: 0,
};

const receiptMono = {
  color: "#D1D5DB",
  fontSize: "12px",
  fontFamily: "monospace",
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

const buttonSecondary = {
  display: "inline-block",
  backgroundColor: "#1A1C26",
  border: "1px solid #2D3142",
  color: "#E5E7EB",
  fontSize: "13px",
  fontWeight: "600",
  padding: "10px 22px",
  borderRadius: "8px",
  textDecoration: "none",
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

export default SubmissionReceiptEmail;
