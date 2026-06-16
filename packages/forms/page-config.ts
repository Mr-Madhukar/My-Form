import { z } from "zod";

// ---------------------------------------------------------------------------
// Multi-page Form Configuration
// ---------------------------------------------------------------------------

export const pageConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export type PageConfig = z.infer<typeof pageConfigSchema>;

export const multiPageSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  pages: z.array(pageConfigSchema).default([]),
});

export type MultiPageSettings = z.infer<typeof multiPageSettingsSchema>;

/**
 * Groups fields by their page number (from config.page).
 * Fields without a page number are assigned to page 0.
 */
export function groupFieldsByPage<T extends { config: Record<string, unknown> }>(
  fields: T[],
): Map<number, T[]> {
  const pages = new Map<number, T[]>();

  for (const field of fields) {
    const page = typeof field.config.page === "number" ? field.config.page : 0;
    const existing = pages.get(page) ?? [];
    existing.push(field);
    pages.set(page, existing);
  }

  return pages;
}

/**
 * Returns the total number of pages for a set of fields.
 */
export function getPageCount<T extends { config: Record<string, unknown> }>(fields: T[]): number {
  let maxPage = 0;
  for (const field of fields) {
    const page = typeof field.config.page === "number" ? field.config.page : 0;
    if (page > maxPage) maxPage = page;
  }
  return maxPage + 1;
}
