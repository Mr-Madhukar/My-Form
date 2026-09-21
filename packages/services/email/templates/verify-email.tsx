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
  baseMetaText,
  baseCtaSection,
  baseButtonPrimary,
  BrandHeader,
  EmailFooter,
} from "./email-shared";

export interface VerifyEmailProps {
  readonly link: string;
  readonly userName?: string;
}

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

const h1 = { ...baseH1, margin: "0 0 10px 0" };
const subtext = { ...baseSubtext, lineHeight: "1.6", margin: "0 0 8px 0" };
const ctaSection = { ...baseCtaSection, margin: "28px 0" };
const buttonPrimary = { ...baseButtonPrimary, padding: "12px 30px" };

export function VerifyEmail({ link, userName }: Readonly<VerifyEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to activate your My-Form account</Preview>
      <Body style={baseBody}>
        <Container style={baseContainer}>
          <BrandHeader label="My-Form" />

          {/* Hero */}
          <Section style={baseHeroSection}>
            <div style={welcomePill}>✨ Welcome to My-Form</div>
            <Heading style={h1}>Verify Your Email Address</Heading>
            <Text style={subtext}>
              {userName ? `Hi ${userName},` : "Hello,"} thanks for signing up! Please confirm your email
              address to finish setting up your account and start publishing forms.
            </Text>
            <Text style={baseMetaText}>This verification link will expire in 24 hours.</Text>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Link href={link} style={buttonPrimary}>
              Verify Email Address →
            </Link>
          </Section>

          <EmailFooter
            mainText={<>Sent automatically by <strong>My-Form</strong>.</>}
            subText="If you did not sign up for My-Form, you can safely ignore this email."
          />
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmail;
