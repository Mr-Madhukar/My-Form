import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getDb() {
  const { default: db, eq, and } = await import("@repo/database");
  const { usersTable, subscriptionsTable } = await import("@repo/database/schema");
  return { db, eq, and, usersTable, subscriptionsTable };
}

function isSignatureValid(rawBody: string, signature: string | null, secret?: string): boolean {
  // No secret configured → skip validation (dev / CI environments)
  if (!secret) return true;
  // Secret IS configured but request has no signature → reject
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  // timingSafeEqual throws if lengths differ — reject outright
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

interface SubscriptionEntity {
  id?: string;
  current_end?: number;
  notes?: {
    userId?: string;
    plan?: "free" | "pro" | "team";
    cycle?: "monthly" | "annual";
  };
}

interface PaymentEntity {
  id?: string;
  notes?: {
    userId?: string;
    plan?: "free" | "pro" | "team";
    cycle?: "monthly" | "annual";
  };
}

/** Returns true if the user row exists in the DB. */
async function userExists(userId: string): Promise<boolean> {
  const { db, eq, usersTable } = await getDb();
  const rows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return rows.length > 0;
}

async function handleSubscriptionActivated(sub?: SubscriptionEntity) {
  const userId = sub?.notes?.userId;
  if (!userId) return;

  if (!(await userExists(userId))) {
    console.warn(`[Razorpay Webhook] Ignoring subscription — user ${userId} not found`);
    return;
  }

  const plan = sub?.notes?.plan || "pro";
  const cycle = sub?.notes?.cycle || "monthly";

  const { db, eq, usersTable, subscriptionsTable } = await getDb();
  await db.update(usersTable).set({ plan }).where(eq(usersTable.id, userId));

  const periodEnd = sub?.current_end
    ? new Date(sub.current_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(subscriptionsTable).values({
    userId,
    plan,
    billingCycle: cycle,
    status: "active",
    razorpaySubscriptionId: sub?.id || null,
    currentPeriodEnd: periodEnd,
  });

  if (plan === "pro" || plan === "team") {
    await sendUpgradeEmailSafely({
      userId,
      plan,
      cycle: cycle as "monthly" | "annual",
      subscriptionId: sub?.id,
    });
  }
}

async function sendUpgradeEmailSafely(params: {
  userId: string;
  plan: "pro" | "team";
  cycle: "monthly" | "annual";
  subscriptionId?: string;
  paymentId?: string;
}) {
  try {
    const { db, eq, usersTable } = await getDb();
    const [user] = await db
      .select({ email: usersTable.email, fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, params.userId))
      .limit(1);

    if (user?.email) {
      const { emailService } = await import("@repo/services/email");
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
        subscriptionId: params.subscriptionId,
        paymentId: params.paymentId,
      });
    }
  } catch (err) {
    console.error("[Razorpay Webhook] Failed to send upgrade email:", err);
  }
}

async function handlePaymentCaptured(payment?: PaymentEntity) {
  const userId = payment?.notes?.userId;
  const plan = payment?.notes?.plan;
  if (!userId || !plan) return;

  if (!(await userExists(userId))) {
    console.warn(`[Razorpay Webhook] Ignoring payment — user ${userId} not found`);
    return;
  }

  const cycle = payment?.notes?.cycle || "monthly";
  const { db, eq, usersTable, subscriptionsTable } = await getDb();
  await db.update(usersTable).set({ plan }).where(eq(usersTable.id, userId));

  const days = cycle === "annual" ? 365 : 30;
  await db.insert(subscriptionsTable).values({
    userId,
    plan,
    billingCycle: cycle,
    status: "active",
    razorpayPaymentId: payment?.id || null,
    currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  if (plan === "pro" || plan === "team") {
    await sendUpgradeEmailSafely({
      userId,
      plan,
      cycle: cycle as "monthly" | "annual",
      paymentId: payment?.id,
    });
  }
}

async function handleSubscriptionCancelled(sub?: SubscriptionEntity) {
  const userId = sub?.notes?.userId;
  if (!userId) return;

  const { db, eq, and, usersTable, subscriptionsTable } = await getDb();
  await db.update(usersTable).set({ plan: "free" }).where(eq(usersTable.id, userId));

  if (sub?.id) {
    await db
      .update(subscriptionsTable)
      .set({ status: "cancelled", cancelAtPeriodEnd: true })
      .where(
        and(
          eq(subscriptionsTable.userId, userId),
          eq(subscriptionsTable.razorpaySubscriptionId, sub.id),
        ),
      );
  }
}

function tryParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!isSignatureValid(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      console.warn("[Razorpay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = tryParseJSON(rawBody);
    if (!event || typeof event !== "object") {
      console.warn("[Razorpay Webhook] Malformed request body — not valid JSON");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventType = (event as Record<string, unknown>)?.event as string | undefined;

    console.info(`[Razorpay Webhook] Received event: ${eventType ?? "unknown"}`);

    const payload = (event as Record<string, unknown>)?.payload as Record<string, unknown> | undefined;

    try {
      if (eventType === "subscription.activated" || eventType === "subscription.charged") {
        await handleSubscriptionActivated(
          (payload?.subscription as Record<string, unknown>)?.entity as SubscriptionEntity | undefined,
        );
      } else if (eventType === "payment.captured") {
        await handlePaymentCaptured(
          (payload?.payment as Record<string, unknown>)?.entity as PaymentEntity | undefined,
        );
      } else if (
        eventType === "subscription.cancelled" ||
        eventType === "subscription.halted" ||
        eventType === "subscription.completed"
      ) {
        await handleSubscriptionCancelled(
          (payload?.subscription as Record<string, unknown>)?.entity as SubscriptionEntity | undefined,
        );
      }
    } catch (dbError) {
      // DB may be unreachable (e.g. CI without a database).
      // Log the error but still acknowledge the webhook so the
      // provider does not keep retrying endlessly.
      console.error(`[Razorpay Webhook] DB error while handling ${eventType}:`, dbError);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Razorpay Webhook] Processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

