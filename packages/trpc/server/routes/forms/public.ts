import db, { eq, and, asc, count, sql } from "@repo/database";
import {
  formsTable,
  formVersionsTable,
  formFieldsTable,
  responsesTable,
  responseAnswersTable,
  aiFollowupsTable,
  usersTable,
  workspaceMembersTable,
} from "@repo/database/schema";
import { emailService } from "@repo/services/email";
import { appendRowToSheet } from "@repo/services/clients/google-sheets";
import { scoreLeadResponse } from "@repo/services/lead-scoring";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { buildResponseSchema, themeSchema } from "@repo/forms";
import {
  rateLimit,
  withCache,
  invalidateKeys,
  invalidatePattern,
  CacheKeys,
} from "@repo/services/redis";
import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { env } from "@repo/services/env";
import { publicFormSchema, followupInputSchema, exploreFormSchema, formPaymentConfigSchema } from "./model";

const TAGS = ["Public Forms"];

function formatSheetCellValue(ans: unknown): string {
  if (ans === undefined || ans === null) return "";
  if (typeof ans === "string") return ans;
  if (typeof ans === "number" || typeof ans === "boolean") return String(ans);
  if (typeof ans === "object") {
    return Array.isArray(ans) ? ans.map(formatSheetCellValue).join(", ") : JSON.stringify(ans);
  }
  return "";
}

async function validateFormLimits(
  settings: Record<string, unknown>,
  formVersionId: string,
): Promise<void> {
  if (settings.expiresAt) {
    const expiryDate = new Date(settings.expiresAt as string);
    if (!Number.isNaN(expiryDate.getTime()) && new Date() > expiryDate) {
      throw new TRPCError({ code: "FORBIDDEN", message: "form_expired" });
    }
  }

  if (settings.maxResponses) {
    const maxResponses = Number(settings.maxResponses);
    if (!Number.isNaN(maxResponses) && maxResponses > 0) {
      const [countRow] = await db
        .select({ value: count() })
        .from(responsesTable)
        .where(
          and(
            eq(responsesTable.formVersionId, formVersionId),
            sql`${responsesTable.completedAt} is not null`,
          ),
        );
      if ((countRow?.value ?? 0) >= maxResponses) {
        throw new TRPCError({ code: "FORBIDDEN", message: "response_limit_reached" });
      }
    }
  }
}

async function saveSubmission(
  formVersionId: string,
  answers: Record<string, unknown>,
  followups?: Array<{ fieldId: string; aiQuestion: string; userAnswer?: string | null }>,
  payment?: {
    provider: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
  },
): Promise<string> {
  return await db.transaction(async (tx) => {
    const metadata: Record<string, unknown> = {};
    if (payment) {
      metadata.payment = {
        ...payment,
        paidAt: new Date().toISOString(),
      };
    }

    const [response] = await tx
      .insert(responsesTable)
      .values({
        formVersionId,
        responseToken: nanoid(),
        completedAt: new Date(),
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      })
      .returning();

    const entries = Object.entries(answers);
    if (entries.length > 0) {
      await tx
        .insert(responseAnswersTable)
        .values(entries.map(([fieldId, value]) => ({ responseId: response!.id, fieldId, value })));
    }

    if (followups && followups.length > 0) {
      await tx.insert(aiFollowupsTable).values(
        followups.map((f) => ({
          responseId: response!.id,
          fieldId: f.fieldId,
          aiQuestion: f.aiQuestion,
          userAnswer: f.userAnswer ?? null,
        })),
      );
    }

    return response!.id;
  });
}

function syncToGoogleSheets(
  form: { id: string; googleSheetsConnected: boolean | null; googleSheetsSpreadsheetId: string | null },
  fields: Array<{ id: string }>,
  answers: Record<string, unknown>,
): void {
  if (!form.googleSheetsConnected || !form.googleSheetsSpreadsheetId) return;

  const spreadsheetId = form.googleSheetsSpreadsheetId;
  void (async () => {
    try {
      const values = [
        new Date().toISOString(),
        ...fields.map((f) => formatSheetCellValue(answers[f.id])),
      ];
      console.log(
        `[Google Sheets Sync] Syncing submission for form ${form.id} to sheet ${spreadsheetId}:`,
        values,
      );
      await appendRowToSheet(spreadsheetId, values);
      console.log(
        `[Google Sheets Sync] Successfully synced submission for form ${form.id} to sheet ${spreadsheetId}`,
      );
    } catch (err) {
      console.error("Failed to append submission to Google Sheets:", err);
    }
  })();
}

function notifyWorkspaceOwner(
  workspaceId: string,
  formId: string,
  formVersionId: string,
  title: string,
): void {
  void (async () => {
    try {
      const [owner] = await db
        .select({ email: usersTable.email })
        .from(workspaceMembersTable)
        .innerJoin(usersTable, eq(usersTable.id, workspaceMembersTable.userId))
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            eq(workspaceMembersTable.role, "owner"),
          ),
        )
        .limit(1);

      if (owner?.email) {
        const countRows = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(responsesTable)
          .where(
            and(
              eq(responsesTable.formVersionId, formVersionId),
              sql`${responsesTable.completedAt} is not null`,
            ),
          );
        const responseCount = countRows[0]?.count ?? 0;

        await emailService.sendNewResponseEmail({
          ownerEmail: owner.email,
          formTitle: title,
          formId,
          responseCount,
        });
      }
    } catch (err) {
      console.error("Failed to send new response email:", err);
    }
  })();
}

function triggerLeadScoring(
  formId: string,
  responseId: string,
  title: string,
  settings: Record<string, unknown>,
): void {
  if (!settings.aiLeadScoringEnabled) return;

  void (async () => {
    try {
      await scoreLeadResponse(formId, responseId, title);
    } catch (err) {
      console.error("[LeadScoring] Background scoring failed:", err);
    }
  })();
}

export const formsPublicRouter = router({
  listPublic: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/forms", tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(exploreFormSchema))
    .query(async () => {
      return withCache(CacheKeys.formsPublicList(), 300, async () => {
        const rows = await db
          .select({
            id: formsTable.id,
            publicSlug: formsTable.publicSlug,
            title: formVersionsTable.title,
            description: formVersionsTable.description,
            publishedAt: formVersionsTable.publishedAt,
            fieldCount: sql<number>`cast(count(distinct ${formFieldsTable.id}) as int)`,
            responseCount: sql<number>`cast(count(distinct ${responsesTable.id}) as int)`,
          })
          .from(formsTable)
          .innerJoin(
            formVersionsTable,
            and(
              eq(formVersionsTable.formId, formsTable.id),
              eq(formVersionsTable.status, "published"),
            ),
          )
          .leftJoin(formFieldsTable, eq(formFieldsTable.formVersionId, formVersionsTable.id))
          .leftJoin(
            responsesTable,
            and(
              eq(responsesTable.formVersionId, formVersionsTable.id),
              sql`${responsesTable.completedAt} is not null`,
            ),
          )
          .where(and(eq(formsTable.visibility, "public"), sql`${formsTable.deletedAt} is null`))
          .groupBy(formsTable.id, formVersionsTable.id);

        return rows;
      });
    }),

  getBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/forms/{slug}", tags: TAGS } })
    .input(z.object({ slug: z.string() }))
    .output(publicFormSchema)
    .query(async ({ input }) => {
      return withCache(CacheKeys.formSlug(input.slug), 1800, async () => {
        const [form] = await db
          .select()
          .from(formsTable)
          .where(eq(formsTable.publicSlug, input.slug))
          .limit(1);

        if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

        const [published] = await db
          .select()
          .from(formVersionsTable)
          .where(
            and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")),
          )
          .limit(1);

        if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
        if (!form.isAcceptingResponses)
          throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

        const fields = await db
          .select()
          .from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, published.id))
          .orderBy(asc(formFieldsTable.order));

        const settings = (published.settings ?? {}) as Record<string, unknown>;
        const rawPayment = (settings.payment ?? {}) as Record<string, unknown>;
        let paymentConfig = null;
        if (rawPayment.enabled) {
          const parsed = formPaymentConfigSchema.safeParse(rawPayment);
          if (parsed.success) {
            paymentConfig = {
              ...parsed.data,
              razorpayKeyId:
                parsed.data.customKeyEnabled && parsed.data.razorpayKeyId
                  ? parsed.data.razorpayKeyId
                  : env.NEXT_PUBLIC_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || "",
            };
          }
        }

        return {
          form: {
            id: form.id,
            publicSlug: form.publicSlug,
            isAcceptingResponses: form.isAcceptingResponses,
          },
          version: {
            id: published.id,
            title: published.title,
            description: published.description,
            theme: themeSchema.nullable().safeParse(published.theme).data ?? null,
            payment: paymentConfig,
          },
          fields: fields.map((f) => ({
            ...f,
            config: (f.config ?? {}) as Record<string, unknown>,
          })),
        };
      });
    }),

  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/forms/{slug}/submit", tags: TAGS } })
    .input(
      z.object({
        slug: z.string(),
        answers: z.record(z.string(), z.unknown()),
        followups: z.array(followupInputSchema).optional(),
        payment: z
          .object({
            provider: z.string(),
            transactionId: z.string(),
            amount: z.number(),
            currency: z.string(),
            status: z.string(),
          })
          .optional(),
        _gotcha: z.string().optional(),
      }),
    )
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Honeypot: bots fill the hidden field — fake success, store nothing.
      if (input._gotcha && input._gotcha.trim() !== "") {
        return { id: nanoid() };
      }

      const ip = ctx.ip ?? "unknown";
      const { allowed } = await rateLimit(`responses:submit:${ip}:${input.slug}`, 10, 60);
      if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });

      // Re-resolve the published version from the slug — never trust a client-sent version.
      const [form] = await db
        .select()
        .from(formsTable)
        .where(eq(formsTable.publicSlug, input.slug))
        .limit(1);
      if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

      const [published] = await db
        .select()
        .from(formVersionsTable)
        .where(
          and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")),
        )
        .limit(1);
      if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
      if (!form.isAcceptingResponses)
        throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

      // Check form expiry and max responses
      const publishedSettings = (published.settings ?? {}) as Record<string, unknown>;
      await validateFormLimits(publishedSettings, published.id);

      // Verify payment requirement if enabled
      const rawPayment = (publishedSettings.payment ?? {}) as Record<string, unknown>;
      if (rawPayment.enabled && rawPayment.requirePayment !== false) {
        if (input.payment?.status !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "payment_required" });
        }
      }

      const fields = await db
        .select()
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formVersionId, published.id))
        .orderBy(asc(formFieldsTable.order));

      const schema = buildResponseSchema(
        fields.map((f) => ({ id: f.id, type: f.type, required: f.required, config: f.config })),
      );
      const parsed = schema.safeParse(input.answers);
      if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "invalid_answers" });

      const id = await saveSubmission(published.id, parsed.data, input.followups, input.payment);

      await Promise.all([
        invalidateKeys(CacheKeys.formResponses(form.id), CacheKeys.formSummary(form.id)),
        invalidatePattern(`form:ai-summary:${form.id}:*`),
      ]);

      // Fire-and-forget side effects
      syncToGoogleSheets(form, fields, input.answers);
      notifyWorkspaceOwner(form.workspaceId, form.id, published.id, published.title);
      triggerLeadScoring(form.id, id, published.title, publishedSettings);

      return { id };
    }),

  saveFollowups: publicProcedure
    .meta({
      openapi: { method: "POST", path: "/public/responses/{responseId}/followups", tags: TAGS },
    })
    .input(
      z.object({
        responseId: z.string(),
        followups: z.array(followupInputSchema).min(1).max(50),
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      if (input.followups.length === 0) return;

      const ip = ctx.ip ?? "unknown";
      const { allowed } = await rateLimit(`responses:followups:${ip}`, 30, 60);
      if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });

      // Verify the response exists; fetch formId (cache) and completedAt (recency).
      const [response] = await db
        .select({
          id: responsesTable.id,
          formId: formVersionsTable.formId,
          completedAt: responsesTable.completedAt,
        })
        .from(responsesTable)
        .innerJoin(formVersionsTable, eq(formVersionsTable.id, responsesTable.formVersionId))
        .where(eq(responsesTable.id, input.responseId))
        .limit(1);
      if (!response) throw new TRPCError({ code: "NOT_FOUND" });

      // Follow-ups are saved immediately after submission. Reject appends to
      // responses completed more than an hour ago to close the "append forever" hole.
      const completedAt = response.completedAt;
      if (!completedAt || Date.now() - completedAt.getTime() > 60 * 60 * 1000) {
        throw new TRPCError({ code: "FORBIDDEN", message: "response_closed" });
      }

      await db.insert(aiFollowupsTable).values(
        input.followups.map((f) => ({
          responseId: input.responseId,
          fieldId: f.fieldId,
          aiQuestion: f.aiQuestion,
          userAnswer: f.userAnswer ?? null,
        })),
      );

      await invalidateKeys(CacheKeys.formResponses(response.formId));
    }),
});
