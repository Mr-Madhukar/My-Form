import crypto from "crypto";
import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { authService } from "@repo/services/auth";
import { redisClient } from "@repo/services/redis";

import { env } from "./env";

export const app = express();

// Trust the upstream proxy so req.ip (used by rate limiting) reflects the real client IP
app.set("trust proxy", 1);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Allow Scalar documentation UI assets on /docs and /openapi.json
  if (req.path.startsWith("/docs") || req.path.startsWith("/openapi.json")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';"
    );
  } else {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none';"
    );
  }
  next();
});

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "My Form OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// Strict rate limiter for OAuth endpoints (10 req / 15 min; each attempt uses 2: start + callback)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: "rl:oauth:",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
  handler: (_req, res) => {
    res.redirect(`${env.FRONTEND_URL}/login?error=rate_limited`);
  },
});

// General API limiter (100 req / 15 min)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: "rl:api:",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
});

// Sensitive credential operations — strict per-IP limit (10 / 15 min).
// Mounted ahead of the tRPC/OpenAPI handlers; only matches auth paths.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: "rl:credential:",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
  message: { error: "rate_limited" },
});

// Operations that must be tightly throttled regardless of transport (REST or tRPC).
const CREDENTIAL_PATTERNS = [
  /\/authentication\/(login|signup|forgot-password|reset-password|verify-email)/,
  /auth\.(login|signup|forgotPassword|resetPassword|verifyEmail)/,
];

function credentialGuard(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const target = `${req.path}${req.url}`;
  if (CREDENTIAL_PATTERNS.some((re) => re.test(target))) {
    return credentialLimiter(req, res, next);
  }
  return next();
}

app.get("/", (req, res) => {
  return res.json({ message: "My Form is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "My Form server is healthy", healthy: true });
});

const isProd = env.NODE_ENV === "prod";
const OAUTH_STATE_COOKIE = "oauth_state";
const domainOpt = env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {};

const OAUTH_FRONTEND_URL_COOKIE = "oauth_frontend_url";

// Google OAuth routes
app.get("/auth/google", authLimiter, async (req, res) => {
  const { googleOAuth2Client } = await import("@repo/services/clients/google-oauth");
  const state = crypto.randomBytes(16).toString("hex");
  
  // Safe redirect validation to prevent open redirects
  const origin = req.query.origin as string | undefined;
  let frontendUrl = env.FRONTEND_URL;
  if (origin) {
    const isLocalhost = origin.startsWith("http://localhost:") || origin === "http://localhost";
    const isProdFrontend = origin === env.FRONTEND_URL;
    if (isLocalhost || isProdFrontend) {
      frontendUrl = origin;
    }
  }

  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
    ...domainOpt,
  });

  res.cookie(OAUTH_FRONTEND_URL_COOKIE, frontendUrl, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
    ...domainOpt,
  });

  const url = googleOAuth2Client.generateAuthUrl({
    scope: ["email", "profile"],
    access_type: "offline",
    state,
  });
  res.redirect(url);
});

app.get("/auth/google/callback", authLimiter, async (req, res) => {
  const code = req.query.code as string | undefined;
  const returnedState = req.query.state as string | undefined;
  const storedState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
  const storedFrontendUrl = req.cookies?.[OAUTH_FRONTEND_URL_COOKIE] as string | undefined || env.FRONTEND_URL;

  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", ...domainOpt });
  res.clearCookie(OAUTH_FRONTEND_URL_COOKIE, { path: "/", ...domainOpt });

  if (!code || !returnedState || !storedState || returnedState !== storedState) {
    return res.redirect(`${storedFrontendUrl}/login?error=oauth_failed`);
  }

  try {
    const { accessToken, refreshToken } = await authService.googleCallback(code);
    
    // Generate a temporary one-time authorization code
    const tempCode = crypto.randomBytes(32).toString("hex");
    
    // Store tokens in Redis for 60 seconds
    const key = `temp_auth_code:${tempCode}`;
    await redisClient.set(
      key,
      JSON.stringify({ accessToken, refreshToken }),
      "EX",
      60
    );

    return res.redirect(`${storedFrontendUrl}/callback?code=${tempCode}`);
  } catch (err) {
    logger.error("Google OAuth callback error", err);
    return res.redirect(`${storedFrontendUrl}/login?error=oauth_failed`);
  }
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  credentialGuard,
  apiLimiter,
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  credentialGuard,
  apiLimiter,
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
