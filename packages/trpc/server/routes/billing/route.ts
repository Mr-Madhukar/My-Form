import crypto from "node:crypto";
import { z } from "../../schema";
import { router, protectedProcedure } from "../../trpc";
import { env } from "@repo/services/env";
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

async function tryCreateRazorpaySubscription(params: SubscriptionParams) {
  try {
    const credentials = Buffer.from(`${params.keyId}:${params.keySecret}`).toString("base64");
    const authHeader = `Basic ${credentials}`;
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        plan_id: params.planId,
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
        type: "subscription" as const,
        subscriptionId: data.id,
        keyId: params.keyId,
        plan: params.plan,
        cycle: params.cycle,
      };
    }
    const errText = await res.text();
    console.warn("[Razorpay] Subscriptions API non-200, falling back to Order:", errText);
  } catch (err) {
    console.error("[Razorpay] Subscription creation failed:", err);
  }
  return null;
}

async function tryCreateRazorpayOrder(params: OrderParams) {
  try {
    const prices = {
      pro: params.cycle === "annual" ? 239 * 12 : 299,
      team: params.cycle === "annual" ? 799 * 12 : 999,
    };
    const amountInPaise = prices[params.plan] * 100;

    const credentials = Buffer.from(`${params.keyId}:${params.keySecret}`).toString("base64");
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
        type: "order" as const,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: "INR",
        keyId: params.keyId,
        plan: params.plan,
        cycle: params.cycle,
      };
    }
    const errText = await res.text();
    console.warn("[Razorpay] Orders API failed:", errText);
  } catch (err) {
    console.error("[Razorpay] Order creation failed:", err);
  }
  return null;
}

export const billingRouter = router({
  getConfig: protectedProcedure.query(() => {
    return {
      razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || "",
      hasProPlan: Boolean(env.RAZORPAY_PRO_PLAN_ID),
      hasScalePlan: Boolean(env.RAZORPAY_SCALE_PLAN_ID),
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
      const keyId = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = env.RAZORPAY_KEY_SECRET;
      const planId = input.plan === "pro" ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_SCALE_PLAN_ID;

      if (!keyId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Razorpay Key ID is not configured in server environment.",
        });
      }

      if (keySecret && planId) {
        const sub = await tryCreateRazorpaySubscription({
          keyId,
          keySecret,
          planId,
          plan: input.plan,
          cycle: input.cycle,
          userId: ctx.userId,
        });
        if (sub) return sub;
      }

      if (keySecret) {
        const order = await tryCreateRazorpayOrder({
          keyId,
          keySecret,
          plan: input.plan,
          cycle: input.cycle,
          userId: ctx.userId,
        });
        if (order) return order;
      }

      return {
        type: "simulation" as const,
        subscriptionId: `sub_sim_${Date.now()}`,
        keyId,
        plan: input.plan,
        cycle: input.cycle,
      };
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
      const secret = env.RAZORPAY_KEY_SECRET;

      if (secret && input.razorpaySignature) {
        if (input.razorpaySubscriptionId && input.razorpayPaymentId) {
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
        } else if (input.razorpayOrderId && input.razorpayPaymentId) {
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
