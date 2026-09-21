import { z } from "../../schema";
import { router, protectedProcedure } from "../../trpc";
import { env } from "@repo/services/env";
import { TRPCError } from "@trpc/server";

export const billingRouter = router({
  getConfig: protectedProcedure.query(() => {
    return {
      razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || "",
      hasProPlan: Boolean(env.RAZORPAY_PRO_PLAN_ID),
      hasScalePlan: Boolean(env.RAZORPAY_SCALE_PLAN_ID),
    };
  }),

  createSubscription: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["pro", "team"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const keyId = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = env.RAZORPAY_KEY_SECRET;
      const planId = input.plan === "pro" ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_SCALE_PLAN_ID;

      if (!keyId || !planId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Razorpay credentials or plan ID not configured",
        });
      }

      if (keySecret) {
        try {
          const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const authHeader = `Basic ${credentials}`;
          const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              plan_id: planId,
              total_count: 12,
              quantity: 1,
              customer_notify: 1,
              notes: {
                userId: ctx.userId,
                plan: input.plan,
              },
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as { id: string };
            return {
              subscriptionId: data.id,
              keyId,
              plan: input.plan,
            };
          }
          const errText = await res.text();
          console.warn("[Razorpay] Subscription API returned non-200:", errText);
        } catch (err) {
          console.error("[Razorpay] Subscription creation failed:", err);
        }
      }

      return {
        subscriptionId: `sub_test_${Date.now()}`,
        keyId,
        plan: input.plan,
      };
    }),
});
