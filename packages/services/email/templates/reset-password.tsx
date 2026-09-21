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

export interface ResetPasswordProps {
  readonly link: string;
  readonly userEmail?: string;
}

export function ResetPassword({ link, userEmail }: Readonly<ResetPasswordProps>) {
  return (
    <Html>
      <Head />
      <Preview>Reset your My-Form account password</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <div style={brandBadge}>
              <span style={brandDot} />
              <span style={brandText}>My-Form Security</span>
            </div>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <div style={securityPill}>🔐 Password Reset Request</div>
            <Heading style={h1}>Reset Your Password</Heading>
            <Text style={subtext}>
              {userEmail ? (
                <>
                  We received a password reset request for <strong>{userEmail}</strong>.
                </>
              ) : (
                "We received a request to reset the password for your My-Form account."
              )}
            </Text>
            <Text style={subtext}>
              Click the button below to choose a new password. This link is valid for{" "}
              <strong>60 minutes</strong>.
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Link href={link} style={buttonPrimary}>
              Reset Password →
            </Link>
          </Section>

          {/* Security Notice Box */}
          <Section style={noticeCard}>
            <Text style={noticeTitle}>Didn&apos;t request this reset?</Text>
            <Text style={noticeText}>
              If you did not request a password reset, you can safely ignore this email. Your
              password will remain unchanged and your account stays protected.
            </Text>
          </Section>

          <Hr style={footerDivider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent securely by <strong>My-Form Authentication Service</strong>.
            </Text>
            <Text style={footerSubtext}>
              Never share this link with anyone. Our team will never ask for your password.
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

const securityPill = {
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

const noticeCard = {
  backgroundColor: "#161822",
  borderRadius: "12px",
  border: "1px solid #242736",
  padding: "16px 20px",
  marginBottom: "20px",
};

const noticeTitle = {
  color: "#E5E7EB",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 6px 0",
};

const noticeText = {
  color: "#9CA3AF",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
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

export default ResetPassword;
