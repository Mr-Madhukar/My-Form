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

export interface PlanUpgradeEmailProps {
  readonly userName?: string;
  readonly plan: "pro" | "team";
  readonly cycle: "monthly" | "annual";
  readonly amount?: number;
  readonly paymentId?: string;
  readonly subscriptionId?: string;
  readonly dashboardUrl: string;
}

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

const receiptCard = {
  backgroundColor: "#161822",
  borderRadius: "12px",
  border: "1px solid #282C3D",
  padding: "20px",
  marginBottom: "24px",
};

const receiptRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
};

const receiptLabel = {
  color: "#8B92A5",
  fontSize: "13px",
  margin: 0,
};

const receiptValue = {
  color: "#F3F4F6",
  fontSize: "13px",
  fontWeight: "600",
  margin: 0,
};

const featuresSection = {
  backgroundColor: "#13141B",
  borderRadius: "12px",
  border: "1px solid #222533",
  padding: "18px 20px",
  marginBottom: "24px",
};

const featureItem = {
  color: "#D1D5DB",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "6px 0",
};

export default function PlanUpgradeEmail({
  userName,
  plan,
  cycle,
  amount,
  paymentId,
  subscriptionId,
  dashboardUrl,
}: PlanUpgradeEmailProps) {
  const planTitle = plan === "pro" ? "Pro Plan" : "Team Workspace";
  const cycleText = cycle === "annual" ? "Annual" : "Monthly";
  const fallbackAmount = plan === "pro" ? "₹299" : "₹999";
  const formattedAmount = amount ? `₹${amount}` : fallbackAmount;

  const proFeatures = [
    "✨ Unlimited AI-native conversational forms",
    "📊 1,000 form submissions / month",
    "🤖 Unlimited qualitative AI follow-up questions",
    "📝 AI automated response summaries & insights",
    "🎨 Custom themes, branding & branching logic",
    "⚡ Priority customer support",
  ];

  const teamFeatures = [
    "✨ Everything in Pro included",
    "📊 5,000 form submissions / month",
    "👥 Team workspaces (up to 5 members)",
    "📈 Drop-off funnels & deep question analytics",
    "🔌 Webhooks + Slack / Discord integrations",
    "📁 CSV & JSON instant data export",
  ];

  const features = plan === "pro" ? proFeatures : teamFeatures;

  return (
    <Html>
      <Head />
      <Preview>{`🎉 Welcome to My-Form ${planTitle}! Your upgrade is active.`}</Preview>
      <Body style={baseBody}>
        <Container style={baseContainer}>
          <BrandHeader
            label="My-Form Subscription Active"
            dotColor="#10B981"
          />

          <Section style={baseHeroSection}>
            <span style={statusPill}>UPGRADE CONFIRMED</span>
            <Heading style={baseH1}>
              Welcome to {planTitle}! 🎉
            </Heading>
            <Text style={baseSubtext}>
              Hi {userName || "there"}, thank you for upgrading! Your subscription to the{" "}
              <strong style={{ color: "#E8854A" }}>{planTitle}</strong> ({cycleText}) is now
              active on your workspace.
            </Text>
          </Section>

          {/* Receipt / Subscription Summary Card */}
          <Section style={receiptCard}>
            <div style={receiptRow}>
              <span style={receiptLabel}>Plan</span>
              <span style={receiptValue}>{planTitle}</span>
            </div>
            <div style={receiptRow}>
              <span style={receiptLabel}>Billing Cycle</span>
              <span style={receiptValue}>{cycleText}</span>
            </div>
            <div style={receiptRow}>
              <span style={receiptLabel}>Amount Charged</span>
              <span style={{ ...receiptValue, color: "#10B981" }}>{formattedAmount}</span>
            </div>
            {paymentId && (
              <div style={receiptRow}>
                <span style={receiptLabel}>Payment ID</span>
                <span style={{ ...receiptValue, fontFamily: "monospace", fontSize: "11px" }}>
                  {paymentId}
                </span>
              </div>
            )}
            {subscriptionId && (
              <div style={receiptRow}>
                <span style={receiptLabel}>Subscription ID</span>
                <span style={{ ...receiptValue, fontFamily: "monospace", fontSize: "11px" }}>
                  {subscriptionId}
                </span>
              </div>
            )}
          </Section>

          {/* What's Unlocked */}
          <Section style={featuresSection}>
            <Text style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "700", margin: "0 0 10px 0" }}>
              What&apos;s unlocked on your workspace:
            </Text>
            {features.map((feature) => (
              <Text key={feature} style={featureItem}>
                {feature}
              </Text>
            ))}
          </Section>

          {/* CTA */}
          <Section style={baseCtaSection}>
            <Link href={dashboardUrl} style={baseButtonPrimary}>
              Go to Your Dashboard →
            </Link>
          </Section>

          <EmailFooter
            mainText="My-Form · AI-Native Forms & Conversational Analytics"
            subText="Have questions about your subscription or billing? Just reply directly to this email."
          />
        </Container>
      </Body>
    </Html>
  );
}
