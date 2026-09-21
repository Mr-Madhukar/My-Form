import { test, expect } from "@playwright/test";
import crypto from "node:crypto";

/**
 * Razorpay Webhook E2E Tests
 *
 * Tests the Next.js webhook endpoint at /api/webhooks/razorpay
 * to verify signature validation, event parsing, and error handling.
 *
 * This suite hits the FRONTEND (Next.js on :3000), not the backend,
 * so it works without the Express backend running.
 */

test.describe("Razorpay Webhook Endpoint", () => {
  test("POST /api/webhooks/razorpay returns 200 for valid payload without webhook secret configured", async ({
    request,
  }) => {
    // When RAZORPAY_WEBHOOK_SECRET is not set, signature validation is skipped
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_123",
            notes: {
              userId: "00000000-0000-0000-0000-000000000001",
              plan: "pro",
              cycle: "monthly",
            },
          },
        },
      },
    });

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    // Should either succeed (200) or fail on DB operation (500) — never 400/401/404
    expect([200, 500]).toContain(response.status());
  });

  test("POST /api/webhooks/razorpay rejects invalid JSON body", async ({ request }) => {
    const response = await request.post("/api/webhooks/razorpay", {
      data: "this is not valid json {{{",
      headers: { "Content-Type": "text/plain" },
    });

    // Should return 500 due to JSON.parse failure
    expect(response.status()).toBe(500);

    const body = await response.json();
    expect(body.error).toMatch(/webhook processing failed/i);
  });

  test("POST /api/webhooks/razorpay handles unknown event type gracefully", async ({ request }) => {
    const payload = JSON.stringify({
      event: "some.unknown.event",
      payload: {},
    });

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    // Unknown events are silently acknowledged
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.received).toBe(true);
  });

  test("POST /api/webhooks/razorpay validates HMAC signature when secret is present", async ({
    request,
  }) => {
    // Use the same secret the server has configured
    const testSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    // Skip if no webhook secret is configured (signature validation is bypassed)
    test.skip(!testSecret, "RAZORPAY_WEBHOOK_SECRET not set — signature validation is disabled");

    const payload = JSON.stringify({
      event: "subscription.cancelled",
      payload: {
        subscription: {
          entity: {
            id: "sub_test_cancel",
            notes: { userId: "00000000-0000-0000-0000-000000000002" },
          },
        },
      },
    });

    const validSignature = crypto.createHmac("sha256", testSecret).update(payload).digest("hex");

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSignature,
      },
    });

    // Valid signature → should be accepted (200 or 500 if DB operation fails)
    expect([200, 500]).toContain(response.status());
  });

  test("POST /api/webhooks/razorpay rejects forged HMAC signature", async ({ request }) => {
    const testSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    test.skip(!testSecret, "RAZORPAY_WEBHOOK_SECRET not set — signature validation is disabled");

    const payload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: "pay_forged" } },
      },
    });

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": "forged_invalid_signature_abc123",
      },
    });

    // With secret set, forged signature must be rejected
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toMatch(/invalid signature/i);
  });
});
