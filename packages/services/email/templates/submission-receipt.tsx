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
  BrandHeader,
  EmailFooter,
  AnswersPreview,
} from "./email-shared";

export type { AnswerItem };

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

// ---------------------------------------------------------------------------
// Template-specific styles
// ---------------------------------------------------------------------------

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

const subtext = { ...baseSubtext, margin: "0 0 6px 0" };

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
      <Body style={baseBody}>
        <Container style={baseContainer}>
          <BrandHeader label="My-Form" />

          {/* Title and Confirmation status */}
          <Section style={baseHeroSection}>
            <div style={statusPill}>
              {isPaid ? "✓ Payment & Submission Confirmed" : "✓ Response Recorded"}
            </div>
            <Heading style={baseH1}>{formTitle}</Heading>
            <Text style={subtext}>
              {isPaid
                ? "Your payment was processed successfully and your submission has been received."
                : "Thank you! Your response has been securely saved."}
            </Text>
            {submittedAt && <Text style={baseMetaText}>Submitted on {submittedAt}</Text>}
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
          <AnswersPreview title="Your Submitted Details" items={answers} />

          {/* Optional Form Link CTA */}
          {formUrl && (
            <Section style={baseCtaSection}>
              <Link href={formUrl} style={buttonSecondary}>
                Visit Form Page →
              </Link>
            </Section>
          )}

          <EmailFooter
            mainText={<>This is an automated confirmation from <strong>My-Form</strong> on behalf of the form creator.</>}
            subText="If you have questions about your registration or order, please reply directly to the organizer."
          />
        </Container>
      </Body>
    </Html>
  );
}

export default SubmissionReceiptEmail;
