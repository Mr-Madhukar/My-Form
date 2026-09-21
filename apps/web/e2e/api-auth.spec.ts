import { test, expect } from "@playwright/test";

/**
 * Auth API E2E Tests
 *
 * Tests the authentication endpoints end-to-end through the backend
 * API — signup validation, login validation, refresh token flow,
 * and logout.
 *
 * NOTE: The backend enforces a credentialLimiter (10 req / 15 min) for
 * login/signup/reset/verify endpoints in production mode. Tests accept
 * 429 as a valid alternate response since rate limiting is correct
 * security behavior.
 *
 * Prerequisites: Start the backend with `pnpm --filter @repo/api dev`
 * If the backend is not running, all tests in this suite are skipped.
 */

const API_BASE = process.env.E2E_API_BASE || "http://localhost:3001";

/** Quick connectivity check — skip the entire suite if backend is unreachable */
async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Credential endpoints are rate-limited (10 req / 15 min in prod).
 * Accept 429 as a valid alternate response — rate limiting IS correct.
 */
function expectStatusOrRateLimited(actual: number, expected: number) {
  expect([expected, 429]).toContain(actual);
}

test.describe("Auth API Endpoints", () => {
  // Run serially to minimise rate-limit pressure
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const reachable = await isBackendReachable();
    test.skip(!reachable, `Backend not reachable at ${API_BASE} — start it with: pnpm --filter @repo/api dev`);
  });

  test("POST /api/authentication/signup rejects short password", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/signup`, {
      data: {
        email: "test-e2e@example.com",
        password: "123", // too short (min 8)
        fullName: "Test User",
      },
    });

    // tRPC/OpenAPI returns 400 for input validation failures (or 429 if rate-limited)
    expectStatusOrRateLimited(response.status(), 400);
  });

  test("POST /api/authentication/signup rejects invalid email format", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/signup`, {
      data: {
        email: "not-an-email",
        password: "securePassword123",
        fullName: "Test User",
      },
    });

    expectStatusOrRateLimited(response.status(), 400);
  });

  test("POST /api/authentication/signup rejects missing fullName", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/signup`, {
      data: {
        email: "test@example.com",
        password: "securePassword123",
        fullName: "", // empty, min 1
      },
    });

    expectStatusOrRateLimited(response.status(), 400);
  });

  test("POST /api/authentication/login rejects non-existent user", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/login`, {
      data: {
        email: `e2e-nonexistent-${Date.now()}@test.dev`,
        password: "doesNotMatter123",
      },
    });

    // Should be 401 UNAUTHORIZED (INVALID_CREDENTIALS mapped) or 429 rate-limited
    expectStatusOrRateLimited(response.status(), 401);
  });

  test("POST /api/authentication/refresh returns 401 without refresh cookie", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/refresh`, {
      data: {},
    });

    // No refresh_token cookie → 401
    expect(response.status()).toBe(401);
  });

  test("POST /api/authentication/logout succeeds even without cookies", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/logout`, {
      data: {},
    });

    // Logout is idempotent — always succeeds
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test("POST /api/authentication/forgot-password returns success for any email", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/forgot-password`, {
      data: {
        email: "any-email@example.com",
      },
    });

    // Always returns 200 to prevent email enumeration (or 429 if rate-limited)
    expectStatusOrRateLimited(response.status(), 200);
  });

  test("POST /api/authentication/reset-password rejects invalid token", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/reset-password`, {
      data: {
        token: "fake-invalid-token-12345",
        newPassword: "newSecurePassword123",
      },
    });

    // INVALID_RESET_TOKEN → BAD_REQUEST (or 429 if rate-limited)
    expectStatusOrRateLimited(response.status(), 400);
  });

  test("POST /api/authentication/verify-email rejects invalid token", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/authentication/verify-email`, {
      data: {
        token: "fake-verification-token-12345",
      },
    });

    // INVALID_VERIFICATION_TOKEN → BAD_REQUEST (or 429 if rate-limited)
    expectStatusOrRateLimited(response.status(), 400);
  });

  test("GET /api/authentication/me returns 401 without auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/authentication/me`);

    // protectedProcedure → 401 UNAUTHORIZED
    expect(response.status()).toBe(401);
  });
});
