import db, {
  eq,
  count,
  sql,
  and,
  desc,
  ilike,
  or,
  gte,
  inArray,
} from "@repo/database";
import {
  usersTable,
  workspacesTable,
  workspaceMembersTable,
  formsTable,
  formVersionsTable,
  responsesTable,
} from "@repo/database/schema";
import { redisClient } from "@repo/services/redis";
import { tokenService } from "../../services";
import { router, adminProcedure } from "../../trpc";
import { z } from "../../schema";
import { TRPCError } from "@trpc/server";

function buildUserFilterConditions(
  search?: string,
  role?: "all" | "admin" | "user",
  status?: "all" | "active" | "banned",
) {
  const conditions: any[] = [];
  const queryText = search?.trim();

  if (queryText) {
    const query = `%${queryText}%`;
    conditions.push(or(ilike(usersTable.fullName, query), ilike(usersTable.email, query)));
  }

  if (role && role !== "all") {
    conditions.push(eq(usersTable.role, role));
  }

  if (status === "active") {
    conditions.push(eq(usersTable.isBanned, false));
  } else if (status === "banned") {
    conditions.push(eq(usersTable.isBanned, true));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

type UserMetricStats = { formsCount: number; responsesCount: number };

async function fetchUserWorkspacesAndForms(userIds: string[]) {
  const userWorkspaces = await db
    .select({
      userId: workspaceMembersTable.userId,
      workspaceId: workspaceMembersTable.workspaceId,
    })
    .from(workspaceMembersTable)
    .where(
      and(
        inArray(workspaceMembersTable.userId, userIds),
        eq(workspaceMembersTable.role, "owner"),
      ),
    );

  const workspaceIds = userWorkspaces.map((w) => w.workspaceId);
  if (workspaceIds.length === 0) {
    return { userWorkspaces, forms: [] };
  }

  const forms = await db
    .select({
      id: formsTable.id,
      workspaceId: formsTable.workspaceId,
    })
    .from(formsTable)
    .where(
      and(
        inArray(formsTable.workspaceId, workspaceIds),
        sql`${formsTable.deletedAt} is null`,
      ),
    );

  return { userWorkspaces, forms };
}

async function attachResponseCounts(
  forms: { id: string; workspaceId: string }[],
  userWorkspaces: { userId: string; workspaceId: string }[],
  userStatsMap: Map<string, UserMetricStats>,
) {
  const formIds = forms.map((f) => f.id);
  if (formIds.length === 0) return;

  const versionRows = await db
    .select({
      id: formVersionsTable.id,
      formId: formVersionsTable.formId,
    })
    .from(formVersionsTable)
    .where(inArray(formVersionsTable.formId, formIds));

  const versionIds = versionRows.map((v) => v.id);
  if (versionIds.length === 0) return;

  const versionToForm = new Map(versionRows.map((v) => [v.id, v.formId]));
  const formToWorkspace = new Map(forms.map((f) => [f.id, f.workspaceId]));
  const workspaceToUser = new Map(userWorkspaces.map((w) => [w.workspaceId, w.userId]));

  const responseRows = await db
    .select({
      formVersionId: responsesTable.formVersionId,
      count: count(),
    })
    .from(responsesTable)
    .where(
      and(
        inArray(responsesTable.formVersionId, versionIds),
        sql`${responsesTable.completedAt} is not null`,
      ),
    )
    .groupBy(responsesTable.formVersionId);

  for (const r of responseRows) {
    const fId = versionToForm.get(r.formVersionId);
    const wId = fId ? formToWorkspace.get(fId) : undefined;
    const uId = wId ? workspaceToUser.get(wId) : undefined;
    const stats = uId ? userStatsMap.get(uId) : undefined;
    if (stats) {
      stats.responsesCount += Number(r.count);
    }
  }
}

async function fetchUserMetrics(userIds: string[]) {
  const userStatsMap = new Map<string, UserMetricStats>();
  for (const id of userIds) {
    userStatsMap.set(id, { formsCount: 0, responsesCount: 0 });
  }

  if (userIds.length === 0) return userStatsMap;

  const { userWorkspaces, forms } = await fetchUserWorkspacesAndForms(userIds);
  if (userWorkspaces.length === 0) return userStatsMap;

  const workspaceFormCount = new Map<string, number>();
  for (const f of forms) {
    workspaceFormCount.set(f.workspaceId, (workspaceFormCount.get(f.workspaceId) ?? 0) + 1);
  }

  for (const w of userWorkspaces) {
    const current = userStatsMap.get(w.userId);
    if (current) {
      current.formsCount += workspaceFormCount.get(w.workspaceId) ?? 0;
    }
  }

  await attachResponseCounts(forms, userWorkspaces, userStatsMap);

  return userStatsMap;
}

export const adminRouter = router({
  getPlatformStats: adminProcedure.query(async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total Users & New Users
    const [[totalUsersRow], [newUsersRow]] = await Promise.all([
      db.select({ value: count() }).from(usersTable),
      db
        .select({ value: count() })
        .from(usersTable)
        .where(gte(usersTable.createdAt, thirtyDaysAgo)),
    ]);

    // Total Workspaces
    const [totalWorkspacesRow] = await db.select({ value: count() }).from(workspacesTable);

    // Total Forms & Published Forms
    const [totalFormsRow] = await db
      .select({ value: count() })
      .from(formsTable)
      .where(sql`${formsTable.deletedAt} is null`);

    const publishedFormsRows = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .innerJoin(
        formVersionsTable,
        and(
          eq(formVersionsTable.formId, formsTable.id),
          eq(formVersionsTable.status, "published"),
        ),
      )
      .where(sql`${formsTable.deletedAt} is null`);

    // Total Responses
    const [totalResponsesRow] = await db
      .select({ value: count() })
      .from(responsesTable)
      .where(sql`${responsesTable.completedAt} is not null`);

    // Recent 5 Signups
    const recentSignups = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        isBanned: usersTable.isBanned,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(5);

    // Last 14 days activity trend (Daily Signups & Submissions)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [userTrends, responseTrends] = await Promise.all([
      db
        .select({
          day: sql<string>`to_char(${usersTable.createdAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(usersTable)
        .where(gte(usersTable.createdAt, fourteenDaysAgo))
        .groupBy(sql`to_char(${usersTable.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          day: sql<string>`to_char(${responsesTable.completedAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(responsesTable)
        .where(
          and(
            gte(responsesTable.completedAt, fourteenDaysAgo),
            sql`${responsesTable.completedAt} is not null`,
          ),
        )
        .groupBy(sql`to_char(${responsesTable.completedAt}, 'YYYY-MM-DD')`),
    ]);

    const trendMap = new Map<string, { signups: number; submissions: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0]!;
      trendMap.set(key, { signups: 0, submissions: 0 });
    }

    for (const r of userTrends) {
      if (trendMap.has(r.day)) {
        trendMap.get(r.day)!.signups = Number(r.count);
      }
    }
    for (const r of responseTrends) {
      if (trendMap.has(r.day)) {
        trendMap.get(r.day)!.submissions = Number(r.count);
      }
    }

    const dailyTrends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return {
      totalUsers: totalUsersRow?.value ?? 0,
      newUsersThisMonth: newUsersRow?.value ?? 0,
      totalWorkspaces: totalWorkspacesRow?.value ?? 0,
      totalForms: totalFormsRow?.value ?? 0,
      publishedForms: publishedFormsRows.length,
      totalResponses: totalResponsesRow?.value ?? 0,
      recentSignups,
      dailyTrends,
    };
  }),

  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(["all", "admin", "user"]).default("all"),
        status: z.enum(["all", "active", "banned"]).default("all"),
      }),
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const whereClause = buildUserFilterConditions(input.search, input.role, input.status);

      const [totalCountRow] = await db
        .select({ value: count() })
        .from(usersTable)
        .where(whereClause);

      const total = totalCountRow?.value ?? 0;

      const users = await db
        .select({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          emailVerified: usersTable.emailVerified,
          profileImageUrl: usersTable.profileImageUrl,
          role: usersTable.role,
          isBanned: usersTable.isBanned,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(whereClause)
        .orderBy(desc(usersTable.createdAt))
        .limit(input.limit)
        .offset(offset);

      const userStatsMap = await fetchUserMetrics(users.map((u) => u.id));

      const usersWithStats = users.map((u) => ({
        ...u,
        formsCount: userStatsMap.get(u.id)?.formsCount ?? 0,
        responsesCount: userStatsMap.get(u.id)?.responsesCount ?? 0,
      }));

      return {
        users: usersWithStats,
        total,
        totalPages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["admin", "user"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own admin role",
        });
      }

      const [updated] = await db
        .update(usersTable)
        .set({ role: input.role })
        .where(eq(usersTable.id, input.userId))
        .returning({ id: usersTable.id, role: usersTable.role });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return { success: true, user: updated };
    }),

  toggleUserBan: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        isBanned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot ban or unban yourself",
        });
      }

      const [updated] = await db
        .update(usersTable)
        .set({ isBanned: input.isBanned })
        .where(eq(usersTable.id, input.userId))
        .returning({ id: usersTable.id, isBanned: usersTable.isBanned });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // If banned, revoke all active sessions immediately
      if (input.isBanned) {
        await tokenService.revokeAllRefreshTokens(input.userId);
      }

      return { success: true, user: updated };
    }),

  listAllForms: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.enum(["all", "active", "paused"]).default("all"),
      }),
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [sql`${formsTable.deletedAt} is null`];

      if (input.status === "active") {
        conditions.push(eq(formsTable.isAcceptingResponses, true));
      } else if (input.status === "paused") {
        conditions.push(eq(formsTable.isAcceptingResponses, false));
      }

      const queryText = input.search?.trim();
      if (queryText) {
        const query = `%${queryText}%`;
        conditions.push(ilike(formsTable.publicSlug, query));
      }

      const [totalRow] = await db
        .select({ value: count() })
        .from(formsTable)
        .where(and(...conditions));

      const total = totalRow?.value ?? 0;

      const forms = await db
        .select({
          id: formsTable.id,
          publicSlug: formsTable.publicSlug,
          isAcceptingResponses: formsTable.isAcceptingResponses,
          createdAt: formsTable.createdAt,
          workspaceId: formsTable.workspaceId,
          workspaceName: workspacesTable.name,
          creatorId: workspacesTable.createdBy,
        })
        .from(formsTable)
        .innerJoin(workspacesTable, eq(formsTable.workspaceId, workspacesTable.id))
        .where(and(...conditions))
        .orderBy(desc(formsTable.createdAt))
        .limit(input.limit)
        .offset(offset);

      const formIds = forms.map((f) => f.id);
      const creatorIds = Array.from(new Set(forms.map((f) => f.creatorId)));

      const [creators, versions, responses] = await Promise.all([
        creatorIds.length > 0
          ? db
              .select({
                id: usersTable.id,
                fullName: usersTable.fullName,
                email: usersTable.email,
              })
              .from(usersTable)
              .where(inArray(usersTable.id, creatorIds))
          : [],
        formIds.length > 0
          ? db
              .select({
                id: formVersionsTable.id,
                formId: formVersionsTable.formId,
                title: formVersionsTable.title,
                status: formVersionsTable.status,
              })
              .from(formVersionsTable)
              .where(inArray(formVersionsTable.formId, formIds))
          : [],
        formIds.length > 0
          ? db
              .select({
                formVersionId: responsesTable.formVersionId,
                count: count(),
              })
              .from(responsesTable)
              .where(sql`${responsesTable.completedAt} is not null`)
              .groupBy(responsesTable.formVersionId)
          : [],
      ]);

      const creatorMap = new Map(creators.map((c) => [c.id, c]));
      const responseCountByVersion = new Map(
        responses.map((r) => [r.formVersionId, Number(r.count)]),
      );

      const formDetails = forms.map((f) => {
        const formVers = versions.filter((v) => v.formId === f.id);
        const publishedVer = formVers.find((v) => v.status === "published") || formVers[0];
        const title = publishedVer?.title ?? "Untitled Form";
        const creator = creatorMap.get(f.creatorId);

        let totalResp = 0;
        for (const v of formVers) {
          totalResp += responseCountByVersion.get(v.id) ?? 0;
        }

        return {
          id: f.id,
          publicSlug: f.publicSlug,
          title,
          workspaceName: f.workspaceName,
          creatorName: creator?.fullName ?? "Unknown",
          creatorEmail: creator?.email ?? "Unknown",
          isAcceptingResponses: f.isAcceptingResponses,
          totalResponses: totalResp,
          createdAt: f.createdAt,
        };
      });

      return {
        forms: formDetails,
        total,
        totalPages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),

  toggleFormStatus: adminProcedure
    .input(
      z.object({
        formId: z.string().min(1),
        isAcceptingResponses: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(formsTable)
        .set({ isAcceptingResponses: input.isAcceptingResponses })
        .where(eq(formsTable.id, input.formId))
        .returning({
          id: formsTable.id,
          isAcceptingResponses: formsTable.isAcceptingResponses,
        });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }

      return { success: true, form: updated };
    }),

  getSystemHealth: adminProcedure.query(async () => {
    // Test DB
    let dbStatus = "connected";
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = "error";
    }

    // Test Redis
    let redisStatus = "connected";
    let redisLatencyMs = 0;
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      redisLatencyMs = Date.now() - redisStart;
    } catch {
      redisStatus = "error";
    }

    const mem = process.memoryUsage();

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      environment: process.env.NODE_ENV || "development",
      checkedAt: new Date(),
    };
  }),
});
