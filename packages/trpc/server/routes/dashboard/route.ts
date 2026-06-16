import db, { eq, count, isNotNull, and, sql, inArray } from "@repo/database";
import {
  formsTable,
  formVersionsTable,
  responsesTable,
  workspaceMembersTable,
} from "@repo/database/schema";
import { withCache, CacheKeys } from "@repo/services/redis";
import { router, workspaceProcedure } from "../../trpc";
import { z } from "../../schema";

const TAGS = ["Dashboard"];

export const dashboardRouter = router({
  getStats: workspaceProcedure
    .meta({ openapi: { method: "GET", path: "/workspaces/{workspaceId}/dashboard/stats", tags: TAGS } })
    .input(z.object({ workspaceId: z.string() }))
    .output(
      z.object({
        totalForms: z.number(),
        activeForms: z.number(),
        totalResponses: z.number(),
        publishedForms: z.number(),
      }),
    )
    .query(async ({ ctx }) => {
      return withCache(`dashboard:stats:${ctx.workspace.id}`, 120, async () => {
        // Total forms (not deleted)
        const [totalFormsRow] = await db
          .select({ value: count() })
          .from(formsTable)
          .where(
            and(
              eq(formsTable.workspaceId, ctx.workspace.id),
              sql`${formsTable.deletedAt} is null`,
            ),
          );

        // Published forms
        const publishedForms = await db
          .select({ id: formsTable.id })
          .from(formsTable)
          .innerJoin(
            formVersionsTable,
            and(
              eq(formVersionsTable.formId, formsTable.id),
              eq(formVersionsTable.status, "published"),
            ),
          )
          .where(
            and(
              eq(formsTable.workspaceId, ctx.workspace.id),
              sql`${formsTable.deletedAt} is null`,
            ),
          );

        // Active forms (accepting responses)
        const [activeFormsRow] = await db
          .select({ value: count() })
          .from(formsTable)
          .where(
            and(
              eq(formsTable.workspaceId, ctx.workspace.id),
              eq(formsTable.isAcceptingResponses, true),
              sql`${formsTable.deletedAt} is null`,
            ),
          );

        // Total responses across all workspace forms
        const workspaceForms = await db
          .select({ id: formsTable.id })
          .from(formsTable)
          .where(
            and(
              eq(formsTable.workspaceId, ctx.workspace.id),
              sql`${formsTable.deletedAt} is null`,
            ),
          );
        const formIds = workspaceForms.map((f) => f.id);

        let totalResponses = 0;
        if (formIds.length > 0) {
          const versionRows = await db
            .select({ id: formVersionsTable.id })
            .from(formVersionsTable)
            .where(inArray(formVersionsTable.formId, formIds));
          const versionIds = versionRows.map((v) => v.id);

          if (versionIds.length > 0) {
            const [totalResponsesRow] = await db
              .select({ value: count() })
              .from(responsesTable)
              .where(
                and(
                  inArray(responsesTable.formVersionId, versionIds),
                  isNotNull(responsesTable.completedAt),
                ),
              );
            totalResponses = totalResponsesRow?.value ?? 0;
          }
        }

        return {
          totalForms: totalFormsRow?.value ?? 0,
          activeForms: activeFormsRow?.value ?? 0,
          totalResponses,
          publishedForms: publishedForms.length,
        };
      });
    }),
});
