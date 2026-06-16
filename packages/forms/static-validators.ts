import { z } from "zod";

// ---------------------------------------------------------------------------
// Static validators — reusable schemas for common form-builder primitives
// These complement the dynamic zodForField() and buildResponseSchema() system
// as a distinct "static" validation layer applied at the form-builder level.
// ---------------------------------------------------------------------------

/** Form title: 1–255 chars, no leading/trailing whitespace, no HTML tags */
export const formTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(255, "Title must be 255 characters or fewer")
  .trim()
  .refine((v) => !/<[^>]+>/.test(v), { message: "HTML tags are not allowed" });

/** Custom slug: alphanumeric + hyphens, 3–50 chars, lowercase */
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be 50 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Only lowercase letters, numbers, and hyphens are allowed",
  });

/** Extended email validation with domain sanity check */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(320, "Email must be 320 characters or fewer")
  .refine((v) => v.includes(".") && v.split("@")[1]!.includes("."), {
    message: "Email domain must contain a dot",
  });

/** Password strength: 8+ chars, uppercase, lowercase, number, special char */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer")
  .refine((v) => /[A-Z]/.test(v), { message: "Must contain an uppercase letter" })
  .refine((v) => /[a-z]/.test(v), { message: "Must contain a lowercase letter" })
  .refine((v) => /[0-9]/.test(v), { message: "Must contain a number" })
  .refine((v) => /[^A-Za-z0-9]/.test(v), { message: "Must contain a special character" });

/** Form description: optional, max 2000 chars, no HTML */
export const formDescriptionSchema = z
  .string()
  .max(2000, "Description must be 2000 characters or fewer")
  .refine((v) => !/<[^>]+>/.test(v), { message: "HTML tags are not allowed" })
  .optional()
  .or(z.literal(""));

/** Field label: 1–500 chars */
export const fieldLabelSchema = z
  .string()
  .min(1, "Label is required")
  .max(500, "Label must be 500 characters or fewer")
  .trim();

/** Response limit: positive integer or null for unlimited */
export const responseLimitSchema = z
  .number()
  .int()
  .min(1, "Response limit must be at least 1")
  .max(1_000_000, "Response limit cannot exceed 1,000,000")
  .nullable();
