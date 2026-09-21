import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getDb() {
  const { default: db, eq, and } = await import("@repo/database");
  const { usersTable, subscriptionsTable } = await import("@repo/database/schema");
  return { db, eq, and, usersTable, subscriptionsTable };
}

function isSignatureValid(rawBody: string, signature: string | null, secret?: string): boolean {
  if (!secret || !signature) return true;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
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

async function handleSubscriptionActivated(sub?: SubscriptionEntity) {
  const userId = sub?.notes?.userId;
  if (!userId) return;

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
}

async function handlePaymentCaptured(payment?: PaymentEntity) {
  const userId = payment?.notes?.userId;
  const plan = payment?.notes?.plan;
  if (!userId || !plan) return;

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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!isSignatureValid(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      console.error("[Razorpay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event as string;

    console.info(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === "subscription.activated" || eventType === "subscription.charged") {
      await handleSubscriptionActivated(event?.payload?.subscription?.entity);
    } else if (eventType === "payment.captured") {
      await handlePaymentCaptured(event?.payload?.payment?.entity);
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.halted" ||
      eventType === "subscription.completed"
    ) {
      await handleSubscriptionCancelled(event?.payload?.subscription?.entity);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Razorpay Webhook] Processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
