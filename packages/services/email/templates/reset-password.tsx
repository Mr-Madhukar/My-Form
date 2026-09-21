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
  baseBody,
  baseContainer,
  baseHeroSection,
  baseH1,
  baseSubtext,
  baseCtaSection,
  baseButtonPrimary,
  BrandHeader,
  EmailFooter,
} from "./email-shared";

export interface ResetPasswordProps {
  readonly link: string;
  readonly userEmail?: string;
}

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

const h1 = { ...baseH1, margin: "0 0 10px 0" };
const subtext = { ...baseSubtext, lineHeight: "1.6", margin: "0 0 8px 0" };
const ctaSection = { ...baseCtaSection, margin: "28px 0" };
const buttonPrimary = { ...baseButtonPrimary, padding: "12px 30px" };

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

export function ResetPassword({ link, userEmail }: Readonly<ResetPasswordProps>) {
  return (
    <Html>
      <Head />
      <Preview>Reset your My-Form account password</Preview>
      <Body style={baseBody}>
        <Container style={baseContainer}>
          <BrandHeader label="My-Form Security" />

          {/* Hero */}
          <Section style={baseHeroSection}>
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

          <EmailFooter
            mainText={<>Sent securely by <strong>My-Form Authentication Service</strong>.</>}
            subText="Never share this link with anyone. Our team will never ask for your password."
          />
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPassword;
