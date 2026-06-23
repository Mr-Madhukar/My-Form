import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

/**
 * Verifies the access_token cookie using JWT_ACCESS_SECRET, matching the API.
 * Returns the userId, or null if the cookie is absent, invalid, or expired.
 */
export async function getUserIdFromCookies(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  // 1. Local verification (faster)
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const secret = process.env.JWT_ACCESS_SECRET;
  if (secret) {
    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload === "object" && payload && typeof payload.userId === "string") {
        return payload.userId;
      }
    } catch {
      // Mismatched secret or expired token locally; try backend validation fallback
    }
  }

  // 2. Backend verification fallback (handles out-of-sync secrets or missing Vercel env vars)
  try {
    const apiTarget = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const cookieStore = await cookies();
    const res = await fetch(`${apiTarget}/trpc/auth.me`, {
      headers: {
        cookie: cookieStore.toString(),
      },
    });
    if (res.ok) {
      const data = await res.json();
      const userId = data?.result?.data?.id;
      if (typeof userId === "string") {
        return userId;
      }
    }
  } catch (err) {
    console.error("Backend auth verification fallback error:", err);
  }

  return null;
}
