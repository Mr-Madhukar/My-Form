import db, { eq, and, inArray, asc, isNotNull, count, sql } from "@repo/database";
import {
  responsesTable,
  responseAnswersTable,
  formFieldsTable,
  formVersionsTable,
  analyticsEventsTable,
} from "@repo/database/schema";
import { withCache } from "@repo/services/redis";
import { router, formProcedure } from "../../trpc";
import { z } from "../../schema";

const TAGS = ["Analytics"];

function aggregateChoiceField(values: unknown[]): { label: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const items = Array.isArray(v) ? v : [v];
    for (const item of items) {
      const s = String(item);
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function aggregateRatingField(values: unknown[]): { label: string; value: number }[] {
  const scale = 5;
  const counts: Record<number, number> = {};
  for (let i = 1; i <= scale; i++) counts[i] = 0;
  for (const v of values) {
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 1 && n <= scale) {
      counts[n] = (counts[n] ?? 0) + 1;
    }
  }
  return Object.entries(counts).map(([k, v]) => ({
    label: `${k} star${Number(k) === 1 ? "" : "s"}`,
    value: v,
  }));
}

function aggregateNumberField(values: unknown[]): { label: string; value: number }[] {
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return [];
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return [
    { label: "Average", value: Math.round(avg * 10) / 10 },
    { label: "Min", value: min },
    { label: "Max", value: max },
    { label: "Count", value: nums.length },
  ];
}

function aggregateFieldData(type: string, values: unknown[]): { label: string; value: number }[] {
  if (type === "single_choice" || type === "multiple_choice") {
    return aggregateChoiceField(values);
  }
  if (type === "rating") {
    return aggregateRatingField(values);
  }
  if (type === "number") {
    return aggregateNumberField(values);
  }
  return [];
}

export const analyticsRouter = router({
  getFormAnalytics: formProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{formId}/analytics", tags: TAGS } })
    .input(z.object({ formId: z.string() }))
    .output(
      z.object({
        totalResponses: z.number(),
        totalViews: z.number(),
        totalStarts: z.number(),
        completionRate: z.number(),
        responsesOverTime: z.array(
          z.object({ date: z.string(), count: z.number() }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      return withCache(`analytics:form:${ctx.form.id}`, 120, async () => {
        const versions = await db
          .select({ id: formVersionsTable.id })
          .from(formVersionsTable)
          .where(eq(formVersionsTable.formId, ctx.form.id));
        const versionIds = versions.map((v) => v.id);

        if (versionIds.length === 0) {
          return {
            totalResponses: 0,
            totalViews: 0,
            totalStarts: 0,
            completionRate: 0,
            responsesOverTime: [],
          };
        }

        // Total completed responses
        const [totalRow] = await db
          .select({ value: count() })
          .from(responsesTable)
          .where(
            and(
              inArray(responsesTable.formVersionId, versionIds),
              isNotNull(responsesTable.completedAt),
            ),
          );
        const totalResponses = totalRow?.value ?? 0;

        // Analytics events counts
        const viewsResult = await db
          .select({ value: count() })
          .from(analyticsEventsTable)
          .where(
            and(
              eq(analyticsEventsTable.formId, ctx.form.id),
              eq(analyticsEventsTable.eventType, "form_view"),
            ),
          );
        const recordedViews = viewsResult[0]?.value ?? 0;

        const startsResult = await db
          .select({ value: count() })
          .from(analyticsEventsTable)
          .where(
            and(
              eq(analyticsEventsTable.formId, ctx.form.id),
              eq(analyticsEventsTable.eventType, "form_start"),
            ),
          );
        const recordedStarts = startsResult[0]?.value ?? 0;

        // Funnel integrity rule:
        // Any submitted response must have been started, and any started form must have been viewed.
        // This prevents contradictory anomalies (e.g. 1 response but 0 views/starts) for historical data or if client-side telemetry was blocked.
        const totalStarts = Math.max(recordedStarts, totalResponses);
        const totalViews = Math.max(recordedViews, totalStarts);

        const completionRate =
          totalStarts > 0 ? Math.min(100, Math.round((totalResponses / totalStarts) * 100)) : 0;

        // Responses over time (last 30 days)
        const responsesOverTime = await db
          .select({
            date: sql<string>`to_char(${responsesTable.completedAt}, 'YYYY-MM-DD')`,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(responsesTable)
          .where(
            and(
              inArray(responsesTable.formVersionId, versionIds),
              isNotNull(responsesTable.completedAt),
              sql`${responsesTable.completedAt} >= now() - interval '30 days'`,
            ),
          )
          .groupBy(sql`to_char(${responsesTable.completedAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`to_char(${responsesTable.completedAt}, 'YYYY-MM-DD')`);

        return {
          totalResponses,
          totalViews,
          totalStarts,
          completionRate,
          responsesOverTime,
        };
      });
    }),

  getFieldBreakdown: formProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{formId}/analytics/fields", tags: TAGS } })
    .input(z.object({ formId: z.string() }))
    .output(
      z.array(
        z.object({
          fieldId: z.string(),
          label: z.string(),
          type: z.string(),
          data: z.array(
            z.object({ label: z.string(), value: z.number() }),
          ),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      return withCache(`analytics:fields:${ctx.form.id}`, 120, async () => {
        const versions = await db
          .select({ id: formVersionsTable.id })
          .from(formVersionsTable)
          .where(eq(formVersionsTable.formId, ctx.form.id));
        const versionIds = versions.map((v) => v.id);
        if (versionIds.length === 0) return [];

        const responses = await db
          .select({ id: responsesTable.id })
          .from(responsesTable)
          .where(
            and(
              inArray(responsesTable.formVersionId, versionIds),
              isNotNull(responsesTable.completedAt),
            ),
          );
        if (responses.length === 0) return [];
        const responseIds = responses.map((r) => r.id);

        const answers = await db
          .select({
            fieldId: responseAnswersTable.fieldId,
            value: responseAnswersTable.value,
            label: formFieldsTable.label,
            type: formFieldsTable.type,
            order: formFieldsTable.order,
          })
          .from(responseAnswersTable)
          .innerJoin(formFieldsTable, eq(formFieldsTable.id, responseAnswersTable.fieldId))
          .where(inArray(responseAnswersTable.responseId, responseIds))
          .orderBy(asc(formFieldsTable.order));

        const fieldMap = new Map<
          string,
          { label: string; type: string; order: number; values: unknown[] }
        >();
        for (const a of answers) {
          const existing = fieldMap.get(a.fieldId);
          if (existing) {
            existing.values.push(a.value);
          } else {
            fieldMap.set(a.fieldId, {
              label: a.label,
              type: a.type,
              order: a.order,
              values: [a.value],
            });
          }
        }

        return [...fieldMap.entries()]
          .sort((a, b) => a[1].order - b[1].order)
          .map(([fieldId, { label, type, values }]) => ({
            fieldId,
            label,
            type,
            data: aggregateFieldData(type, values),
          }))
          .filter((f) => f.data.length > 0);
      });
    }),
});
