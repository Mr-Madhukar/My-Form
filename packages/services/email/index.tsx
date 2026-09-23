import React from "react";
import { Resend } from "resend";
import { env } from "../env";
import VerifyEmail from "./templates/verify-email";
import ResetPassword from "./templates/reset-password";
import NewResponseEmail from "./templates/new-response";
import type { PaymentSummary, LeadScoreSummary } from "./templates/new-response";
import SubmissionReceiptEmail from "./templates/submission-receipt";
import type { PaymentReceiptInfo } from "./templates/submission-receipt";
import HotLeadAlertEmail from "./templates/hot-lead-alert";
import PlanUpgradeEmail from "./templates/plan-upgrade";
import type { AnswerItem } from "./templates/email-shared";

export type { AnswerItem, PaymentSummary, LeadScoreSummary, PaymentReceiptInfo };


const resend = new Resend(env.RESEND_API_KEY);

const DEFAULT_FROM = env.RESEND_FROM_EMAIL || "My-Form <my-form@mrmadhukar.in>";
const SANDBOX_FALLBACK_FROM = "My-Form <onboarding@resend.dev>";

class EmailService {
  private async sendSafe(params: {
    from?: string;
    to: string | string[];
    subject: string;
    react: React.ReactElement;
  }): Promise<void> {
    const from = params.from || DEFAULT_FROM;
    try {
      const res = await resend.emails.send({
        from,
        to: params.to,
        subject: params.subject,
        react: params.react,
      });

      if (res.error) {
        console.warn("[EmailService] Resend error:", res.error.message);
        // If error is domain verification related and we used custom domain, attempt sandbox fallback
        const msg = res.error.message.toLowerCase();
        if (
          from !== SANDBOX_FALLBACK_FROM &&
          (msg.includes("domain") || msg.includes("verify") || msg.includes("not verified"))
        ) {
          console.info("[EmailService] Attempting fallback to sandbox onboarding@resend.dev...");
          await resend.emails.send({
            from: SANDBOX_FALLBACK_FROM,
            to: params.to,
            subject: params.subject,
            react: params.react,
          });
        }
      }
    } catch (err) {
      console.error("[EmailService] Unexpected failure while sending email:", err);
    }
  }

  async sendVerificationEmail(to: string, token: string, userName?: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.sendSafe({
      to,
      subject: "Verify your email address — My-Form",
      react: <VerifyEmail link={link} userName={userName} />,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.sendSafe({
      to,
      subject: "Reset your My-Form password",
      react: <ResetPassword link={link} userEmail={to} />,
    });
  }

  async sendNewResponseEmail(params: {
    readonly ownerEmail: string;
    readonly formTitle: string;
    readonly formId: string;
    readonly responseCount: number;
    readonly submittedAt?: string;
    readonly answersSummary?: readonly AnswerItem[];
    readonly payment?: PaymentSummary;
    readonly leadScore?: LeadScoreSummary;
  }): Promise<void> {
    const responsesUrl = `${env.FRONTEND_URL}/forms/${params.formId}/responses`;
    const subject = params.payment?.status === "paid"
      ? `💰 New Paid Response on "${params.formTitle}" (Response #${params.responseCount})`
      : `🎉 New Response on "${params.formTitle}" (Response #${params.responseCount})`;

    await this.sendSafe({
      to: params.ownerEmail,
      subject,
      react: (
        <NewResponseEmail
          formTitle={params.formTitle}
          responseCount={params.responseCount}
          responsesUrl={responsesUrl}
          submittedAt={params.submittedAt}
          answersSummary={params.answersSummary}
          payment={params.payment}
          leadScore={params.leadScore}
        />
      ),
    });
  }

  async sendSubmissionReceiptEmail(params: {
    readonly to: string;
    readonly formTitle: string;
    readonly formUrl?: string;
    readonly submittedAt?: string;
    readonly answers?: readonly AnswerItem[];
    readonly payment?: PaymentReceiptInfo;
  }): Promise<void> {
    const subject = params.payment?.status === "paid"
      ? `Payment Receipt & Submission Confirmed: "${params.formTitle}"`
      : `Submission Received: "${params.formTitle}"`;

    await this.sendSafe({
      to: params.to,
      subject,
      react: (
        <SubmissionReceiptEmail
          formTitle={params.formTitle}
          formUrl={params.formUrl}
          submittedAt={params.submittedAt}
          answers={params.answers}
          payment={params.payment}
        />
      ),
    });
  }

  async sendHotLeadAlertEmail(params: {
    readonly ownerEmail: string;
    readonly formTitle: string;
    readonly formId: string;
    readonly responseId: string;
    readonly score: number;
    readonly intent: "high" | "warm" | "low";
    readonly reason?: string;
    readonly recommendedAction?: string;
    readonly respondentContact?: string;
    readonly answersSummary?: readonly AnswerItem[];
  }): Promise<void> {
    const responsesUrl = `${env.FRONTEND_URL}/forms/${params.formId}/responses`;
    const subject = `🔥 High Intent Lead Alert (${params.score}/100) — "${params.formTitle}"`;

    await this.sendSafe({
      to: params.ownerEmail,
      subject,
      react: (
        <HotLeadAlertEmail
          formTitle={params.formTitle}
          score={params.score}
          intent={params.intent}
          reason={params.reason}
          recommendedAction={params.recommendedAction}
          respondentContact={params.respondentContact}
          answersSummary={params.answersSummary}
          responsesUrl={responsesUrl}
        />
      ),
    });
  }

  async sendPlanUpgradeEmail(params: {
    readonly to: string;
    readonly userName?: string;
    readonly plan: "pro" | "team";
    readonly cycle: "monthly" | "annual";
    readonly amount?: number;
    readonly paymentId?: string;
    readonly subscriptionId?: string;
  }): Promise<void> {
    const dashboardUrl = `${env.FRONTEND_URL}/billing`;
    const planName = params.plan === "pro" ? "Pro Plan" : "Team Workspace";
    await this.sendSafe({
      to: params.to,
      subject: `🎉 You're now on My-Form ${planName}!`,
      react: (
        <PlanUpgradeEmail
          userName={params.userName}
          plan={params.plan}
          cycle={params.cycle}
          amount={params.amount}
          paymentId={params.paymentId}
          subscriptionId={params.subscriptionId}
          dashboardUrl={dashboardUrl}
        />
      ),
    });
  }
}

export const emailService = new EmailService();
