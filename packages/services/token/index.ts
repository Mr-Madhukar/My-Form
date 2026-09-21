import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db, eq, and, isNull } from "@repo/database";
import { refreshTokensTable } from "@repo/database/schema";
import { env } from "../env";
import { accessTokenPayloadSchema, type AccessTokenPayload } from "./model";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

class TokenService {
  createAccessToken(userId: string): string {
    return jwt.sign({ userId } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: "7d",
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const raw = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return accessTokenPayloadSchema.parse(raw);
  }

  async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokensTable).values({ userId, tokenHash, expiresAt });
    return raw;
  }

  async rotateRefreshToken(raw: string): Promise<{ userId: string; newRaw: string }> {
    const tokenHash = hashToken(raw);
    const [existing] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    if (!existing) throw new Error("INVALID_REFRESH_TOKEN");

    // Reuse detection: token already revoked means possible theft
    if (existing.revokedAt !== null) {
      // 30-second grace period for concurrent network requests (e.g. multiple tabs or window focus)
      const elapsed = Date.now() - existing.revokedAt.getTime();
      if (elapsed < 30_000) {
        const newRaw = await this.createRefreshToken(existing.userId);
        return { userId: existing.userId, newRaw };
      }

      await this.revokeAllRefreshTokens(existing.userId);
      throw new Error("REFRESH_TOKEN_REUSE_DETECTED");
    }

    if (existing.expiresAt < new Date()) throw new Error("REFRESH_TOKEN_EXPIRED");

    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, existing.id));

    const newRaw = await this.createRefreshToken(existing.userId);
    return { userId: existing.userId, newRaw };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const tokenHash = hashToken(raw);
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokensTable.tokenHash, tokenHash), isNull(refreshTokensTable.revokedAt)),
      );
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokensTable.userId, userId), isNull(refreshTokensTable.revokedAt)));
  }
}

export const tokenService = new TokenService();
