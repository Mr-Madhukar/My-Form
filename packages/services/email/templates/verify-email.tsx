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

export interface VerifyEmailProps {
  readonly link: string;
  readonly userName?: string;
}

export function VerifyEmail({ link, userName }: Readonly<VerifyEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to activate your My-Form account</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <div style={brandBadge}>
              <span style={brandDot} />
              <span style={brandText}>My-Form</span>
            </div>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <div style={welcomePill}>✨ Welcome to My-Form</div>
            <Heading style={h1}>Verify Your Email Address</Heading>
            <Text style={subtext}>
              {userName ? `Hi ${userName},` : "Hello,"} thanks for signing up! Please confirm your email
              address to finish setting up your account and start publishing forms.
            </Text>
            <Text style={metaText}>This verification link will expire in 24 hours.</Text>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Link href={link} style={buttonPrimary}>
              Verify Email Address →
            </Link>
          </Section>

          <Hr style={footerDivider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent automatically by <strong>My-Form</strong>.
            </Text>
            <Text style={footerSubtext}>
              If you did not sign up for My-Form, you can safely ignore this email.
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
  border: "1px solid #222530",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

const headerSection = {
  marginBottom: "20px",
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

const welcomePill = {
  display: "inline-block",
  backgroundColor: "rgba(232, 133, 74, 0.15)",
  border: "1px solid rgba(232, 133, 74, 0.35)",
  color: "#E8854A",
  fontSize: "12px",
  fontWeight: "800",
  borderRadius: "8px",
  padding: "4px 10px",
  marginBottom: "12px",
  letterSpacing: "0.05em",
};

const h1 = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 10px 0",
  letterSpacing: "-0.02em",
};

const subtext = {
  color: "#9CA3AF",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px 0",
};

const metaText = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "0",
  fontFamily: "monospace",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const buttonPrimary = {
  display: "inline-block",
  backgroundColor: "#E8854A",
  color: "#080808",
  fontWeight: "700",
  fontSize: "14px",
  padding: "12px 30px",
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

export default VerifyEmail;
