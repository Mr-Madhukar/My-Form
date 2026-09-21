import { test, expect } from "@playwright/test";

/**
 * Backend API E2E Tests
 *
 * These tests verify the Express backend (apps/api) is reachable and
 * responding correctly. The backend runs on port 8123 by default.
 *
 * Prerequisites: Start the backend with `pnpm --filter @repo/api dev`
 * If the backend is not running, all tests in this suite are skipped.
 */

const API_BASE = process.env.E2E_API_BASE || "http://localhost:8123";

/** Quick connectivity check — skip the entire suite if backend is unreachable */
async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

test.describe("Backend API Health & Connectivity", () => {
  test.beforeAll(async () => {
    const reachable = await isBackendReachable();
    test.skip(!reachable, `Backend not reachable at ${API_BASE} — start it with: pnpm --filter @repo/api dev`);
  });

  test("GET / returns server running message", async ({ request }) => {
    const response = await request.get(`${API_BASE}/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("message");
    expect(body.message).toMatch(/my form/i);
  });

  test("GET /health returns healthy status", async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.healthy).toBe(true);
  });

  test("GET /openapi.json returns valid OpenAPI document", async ({ request }) => {
    const response = await request.get(`${API_BASE}/openapi.json`);
    expect(response.status()).toBe(200);

    const doc = await response.json();
    expect(doc).toHaveProperty("openapi");
    expect(doc).toHaveProperty("info");
    expect(doc.info.title).toMatch(/my form/i);
    expect(doc).toHaveProperty("paths");
  });

  test("GET /api/health returns tRPC health status", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  test("GET /api/authentication/supported-providers returns auth methods", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/authentication/supported-providers`);
    expect(response.status()).toBe(200);

    const providers = await response.json();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });
});
