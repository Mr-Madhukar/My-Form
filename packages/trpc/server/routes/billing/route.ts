import crypto from "node:crypto";
import { z } from "../../schema";
import { router, protectedProcedure } from "../../trpc";
import { env } from "@repo/services/env";
import { emailService } from "@repo/services/email";
import { TRPCError } from "@trpc/server";
import db, { eq, and, desc, gte, inArray, count, isNull } from "@repo/database";
import {
  usersTable,
  subscriptionsTable,
  workspaceMembersTable,
  formsTable,
  formVersionsTable,
  responsesTable,
  aiFollowupsTable,
} from "@repo/database/schema";

interface SubscriptionParams {
  keyId: string;
  keySecret: string;
  planId: string;
  plan: "pro" | "team";
  cycle: "monthly" | "annual";
  userId: string;
}

interface OrderParams {
  keyId: string;
  keySecret: string;
  plan: "pro" | "team";
  cycle: "monthly" | "annual";
  userId: string;
}

function cleanKey(val?: string | null): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

async function tryCreateRazorpaySubscription(params: SubscriptionParams) {
  try {
    const cleanId = cleanKey(params.keyId);
    const cleanSecret = cleanKey(params.keySecret);
    const cleanPlanId = cleanKey(params.planId);
    const credentials = Buffer.from(`${cleanId}:${cleanSecret}`).toString("base64");
    const authHeader = `Basic ${credentials}`;
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        plan_id: cleanPlanId,
        total_count: params.cycle === "annual" ? 1 : 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: params.userId,
          plan: params.plan,
          cycle: params.cycle,
        },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { id: string };
      return {
        success: true as const,
        data: {
          type: "subscription" as const,
          subscriptionId: data.id,
          keyId: cleanId,
          plan: params.plan,
          cycle: params.cycle,
        },
      };
    }
    const errText = await res.text();
    console.warn("[Razorpay] Subscriptions API non-200:", res.status, errText);
    return { success: false as const, error: `Subscription API (${res.status}): ${errText}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Razorpay] Subscription creation failed:", message);
    return { success: false as const, error: `Subscription error: ${message}` };
  }
}

async function tryCreateRazorpayOrder(params: OrderParams) {
  try {
    const cleanId = cleanKey(params.keyId);
    const cleanSecret = cleanKey(params.keySecret);
    const prices = {
      pro: params.cycle === "annual" ? 239 * 12 : 299,
      team: params.cycle === "annual" ? 799 * 12 : 999,
    };
    const amountInPaise = prices[params.plan] * 100;

    const credentials = Buffer.from(`${cleanId}:${cleanSecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${params.userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId: params.userId,
          plan: params.plan,
          cycle: params.cycle,
        },
      }),
    });

    if (res.ok) {
      const orderData = (await res.json()) as { id: string; amount: number };
      return {
        success: true as const,
        data: {
          type: "order" as const,
          orderId: orderData.id,
          amount: orderData.amount,
          currency: "INR",
          keyId: cleanId,
          plan: params.plan,
          cycle: params.cycle,
        },
      };
    }
    const errText = await res.text();
    console.warn("[Razorpay] Orders API failed:", res.status, errText);
    return { success: false as const, error: `Order API (${res.status}): ${errText}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Razorpay] Order creation failed:", message);
    return { success: false as const, error: `Order error: ${message}` };
  }
}

interface VerifySignatureInput {
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

function validateRazorpaySignature(secret: string, input: VerifySignatureInput) {
  if (!secret || !input.razorpaySignature || !input.razorpayPaymentId) return;

  if (input.razorpaySubscriptionId) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`)
      .digest("hex");
    if (expected !== input.razorpaySignature) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid Razorpay subscription payment signature.",
      });
    }
    return;
  }

  if (input.razorpayOrderId) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");
    if (expected !== input.razorpaySignature) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid Razorpay order payment signature.",
      });
    }
  }
}

async function notifyUserPlanUpgrade(params: {
  userId: string;
  plan: "pro" | "team";
  cycle: "monthly" | "annual";
  paymentId?: string;
  subscriptionId?: string;
}) {
  try {
    const [user] = await db
      .select({ email: usersTable.email, fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, params.userId))
      .limit(1);

    if (!user?.email) return;

    const prices = {
      pro: params.cycle === "annual" ? 239 * 12 : 299,
      team: params.cycle === "annual" ? 799 * 12 : 999,
    };

    await emailService.sendPlanUpgradeEmail({
      to: user.email,
      userName: user.fullName || undefined,
      plan: params.plan,
      cycle: params.cycle,
      amount: prices[params.plan],
      paymentId: params.paymentId,
      subscriptionId: params.subscriptionId,
    });
  } catch (err) {
    console.error("[Billing] Failed to send upgrade email:", err);
  }
}

export const billingRouter = router({
  getConfig: protectedProcedure.query(() => {
    return {
      razorpayKeyId: cleanKey(env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID),
      hasProPlan: Boolean(cleanKey(env.RAZORPAY_PRO_PLAN_ID)),
      hasScalePlan: Boolean(cleanKey(env.RAZORPAY_SCALE_PLAN_ID)),
    };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db
      .select({ id: usersTable.id, plan: usersTable.plan })
      .from(usersTable)
      .where(eq(usersTable.id, ctx.userId))
      .limit(1);

    const currentPlan = (user?.plan || "free") as "free" | "pro" | "team";

    const [activeSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, ctx.userId), eq(subscriptionsTable.status, "active")))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const memberRows = await db
      .select({ workspaceId: workspaceMembersTable.workspaceId })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, ctx.userId));

    const workspaceIds = memberRows.map((m) => m.workspaceId);

    let formsCount = 0;
    let submissionsMonthCount = 0;
    let aiCreditsMonthCount = 0;

    if (workspaceIds.length > 0) {
      const formsRows = await db
        .select({ id: formsTable.id })
        .from(formsTable)
        .where(
          and(
            inArray(formsTable.workspaceId, workspaceIds),
            isNull(formsTable.deletedAt),
          ),
        );
      formsCount = formsRows.length;
      const formIds = formsRows.map((f) => f.id);

      if (formIds.length > 0) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [subRes] = await db
          .select({ value: count() })
          .from(responsesTable)
          .innerJoin(formVersionsTable, eq(responsesTable.formVersionId, formVersionsTable.id))
          .where(
            and(
              inArray(formVersionsTable.formId, formIds),
              gte(responsesTable.startedAt, thirtyDaysAgo),
            ),
          );
        submissionsMonthCount = Number(subRes?.value || 0);

        const [aiRes] = await db
          .select({ value: count() })
          .from(aiFollowupsTable)
          .where(gte(aiFollowupsTable.createdAt, thirtyDaysAgo));
        aiCreditsMonthCount = Number(aiRes?.value || 0);
      }
    }

    const limits = {
      free: { formsMax: 5, submissionsMax: 1000, aiCreditsMax: 10 },
      pro: { formsMax: 9999, submissionsMax: 1000, aiCreditsMax: 9999 },
      team: { formsMax: 9999, submissionsMax: 5000, aiCreditsMax: 9999 },
    }[currentPlan];

    return {
      currentPlan,
      status: activeSub?.status || (currentPlan !== "free" ? "active" : "inactive"),
      billingCycle: (activeSub?.billingCycle || "monthly") as "monthly" | "annual",
      currentPeriodEnd: activeSub?.currentPeriodEnd ? activeSub.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: Boolean(activeSub?.cancelAtPeriodEnd),
      usage: {
        formsCreated: formsCount,
        formsMax: limits.formsMax,
        monthlySubmissions: submissionsMonthCount,
        monthlySubmissionsMax: limits.submissionsMax,
        aiCreditsUsed: aiCreditsMonthCount,
        aiCreditsMax: limits.aiCreditsMax,
      },
    };
  }),

  createSubscription: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["pro", "team"]),
        cycle: z.enum(["monthly", "annual"]).default("monthly"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const keyId = cleanKey(env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      const keySecret = cleanKey(env.RAZORPAY_KEY_SECRET);
      const planId = cleanKey(input.plan === "pro" ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_SCALE_PLAN_ID);

      if (!keyId || !keySecret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Razorpay credentials missing on backend server: ${!keyId ? "KEY_ID" : ""} ${!keySecret ? "KEY_SECRET" : ""}`.trim(),
        });
      }

      const errors: string[] = [];

      if (planId) {
        const sub = await tryCreateRazorpaySubscription({
          keyId,
          keySecret,
          planId,
          plan: input.plan,
          cycle: input.cycle,
          userId: ctx.userId,
        });
        if (sub.success) return sub.data;
        errors.push(sub.error);
      }

      const order = await tryCreateRazorpayOrder({
        keyId,
        keySecret,
        plan: input.plan,
        cycle: input.cycle,
        userId: ctx.userId,
      });
      if (order.success) return order.data;
      errors.push(order.error);

      console.error("[Razorpay] All checkout methods failed:", errors);
      const maskedKey = keyId.length > 8 ? `${keyId.slice(0, 8)}...${keyId.slice(-4)} (len ${keyId.length})` : keyId;
      const maskedSecret = keySecret.length > 6 ? `${keySecret.slice(0, 3)}...${keySecret.slice(-3)} (len ${keySecret.length})` : `(len ${keySecret.length})`;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Razorpay [Key: ${maskedKey}, Secret: ${maskedSecret}]: ${errors.join(" | ")}`,
      });
    }),

  verifyPayment: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["pro", "team"]),
        cycle: z.enum(["monthly", "annual"]).default("monthly"),
        razorpayPaymentId: z.string().optional(),
        razorpaySubscriptionId: z.string().optional(),
        razorpayOrderId: z.string().optional(),
        razorpaySignature: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const secret = cleanKey(env.RAZORPAY_KEY_SECRET);
      validateRazorpaySignature(secret, input);

      const days = input.cycle === "annual" ? 365 : 30;
      const periodStart = new Date();
      const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await db
        .update(usersTable)
        .set({ plan: input.plan })
        .where(eq(usersTable.id, ctx.userId));

      await db.insert(subscriptionsTable).values({
        userId: ctx.userId,
        plan: input.plan,
        billingCycle: input.cycle,
        status: "active",
        razorpaySubscriptionId: input.razorpaySubscriptionId || null,
        razorpayPaymentId: input.razorpayPaymentId || null,
        razorpaySignature: input.razorpaySignature || null,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      // Send confirmation email asynchronously
      void notifyUserPlanUpgrade({
        userId: ctx.userId,
        plan: input.plan,
        cycle: input.cycle,
        paymentId: input.razorpayPaymentId,
        subscriptionId: input.razorpaySubscriptionId,
      });

      return {
        success: true,
        plan: input.plan,
      };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(subscriptionsTable)
      .set({ status: "cancelled", cancelAtPeriodEnd: true })
      .where(and(eq(subscriptionsTable.userId, ctx.userId), eq(subscriptionsTable.status, "active")));

    await db
      .update(usersTable)
      .set({ plan: "free" })
      .where(eq(usersTable.id, ctx.userId));

    return { success: true };
  }),
});
