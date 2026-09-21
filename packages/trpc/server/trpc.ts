import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { z } from "zod";
import db, { eq, and } from "@repo/database";
import { workspaceMembersTable, formsTable, usersTable } from "@repo/database/schema";
import { isSuperAdminEmail } from "./services";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// kept for backward compat with auth routes
export const protectedProcedure = authedProcedure;

export const adminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  const [user] = await db
    .select({ role: usersTable.role, email: usersTable.email, isBanned: usersTable.isBanned })
    .from(usersTable)
    .where(eq(usersTable.id, ctx.userId))
    .limit(1);

  if (!user || user.isBanned) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended or not found" });
  }

  const isSuperAdmin = user.role === "admin" || isSuperAdminEmail(user.email);
  if (!isSuperAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  }

  if (user.role !== "admin") {
    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, ctx.userId));
  }

  return next({ ctx: { ...ctx, userRole: "admin" } });
});

export const workspaceProcedure = authedProcedure
  .input(z.object({ workspaceId: z.uuid() }))
  .use(async ({ ctx, input, next }) => {
    const [member] = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, input.workspaceId),
          eq(workspaceMembersTable.userId, ctx.userId),
        ),
      )
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, workspace: { id: input.workspaceId } } });
  });

export const formProcedure = authedProcedure
  .input(z.object({ formId: z.uuid() }))
  .use(async ({ ctx, input, next }) => {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, input.formId))
      .limit(1);
    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    const [member] = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, form.workspaceId),
          eq(workspaceMembersTable.userId, ctx.userId),
        ),
      )
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, form } });
  });
