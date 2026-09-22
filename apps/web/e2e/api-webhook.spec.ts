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

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

/**
 * Build request headers for a webhook call.
 * When RAZORPAY_WEBHOOK_SECRET is configured (CI / prod), a valid HMAC
 * signature is attached so the request passes signature validation and
 * reaches the code path actually being tested.
 */
function webhookHeaders(body: string, contentType = "application/json"): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (WEBHOOK_SECRET) {
    headers["x-razorpay-signature"] = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
  }
  return headers;
}

test.describe("Razorpay Webhook Endpoint", () => {
  test("POST /api/webhooks/razorpay returns 200 for valid payload", async ({
    request,
  }) => {
    // When the referenced user doesn't exist in the DB, the handler gracefully
    // skips the DB insert and still returns 200.
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
      headers: webhookHeaders(payload),
    });

    expect(response.status()).toBe(200);
  });

  test("POST /api/webhooks/razorpay rejects invalid JSON body", async ({ request }) => {
    const body = "this is not valid json {{{";

    const response = await request.post("/api/webhooks/razorpay", {
      data: body,
      headers: webhookHeaders(body, "text/plain"),
    });

    // Should return 400 for malformed body
    expect(response.status()).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/invalid json body/i);
  });

  test("POST /api/webhooks/razorpay handles unknown event type gracefully", async ({ request }) => {
    const payload = JSON.stringify({
      event: "some.unknown.event",
      payload: {},
    });

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: webhookHeaders(payload),
    });

    // Unknown events are silently acknowledged
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.received).toBe(true);
  });

  test("POST /api/webhooks/razorpay validates HMAC signature when secret is present", async ({
    request,
  }) => {
    // Skip if no webhook secret is configured (signature validation is bypassed)
    test.skip(!WEBHOOK_SECRET, "RAZORPAY_WEBHOOK_SECRET not set — signature validation is disabled");

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

    const validSignature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");

    const response = await request.post("/api/webhooks/razorpay", {
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": validSignature,
      },
    });

    // Valid signature → should be accepted
    expect(response.status()).toBe(200);
  });

  test("POST /api/webhooks/razorpay rejects forged HMAC signature", async ({ request }) => {
    test.skip(!WEBHOOK_SECRET, "RAZORPAY_WEBHOOK_SECRET not set — signature validation is disabled");

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
