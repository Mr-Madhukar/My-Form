import { z } from "zod";

// ---------------------------------------------------------------------------
// Cross-field validation — validates relationships BETWEEN fields
// This is a third distinct validation method:
//   1. Dynamic per-field: zodForField() + buildResponseSchema()
//   2. Static field configs: fieldConfigSchemas (per-type config validation)
//   3. Cross-field: validateCrossFieldRules() (inter-field constraints)
// ---------------------------------------------------------------------------

export const crossFieldRuleSchema = z.object({
  type: z.enum(["date_after", "date_before", "not_equal", "sum_max", "sum_min"]),
  sourceFieldId: z.string(),
  targetFieldId: z.string(),
  message: z.string().optional(),
});

export type CrossFieldRule = z.infer<typeof crossFieldRuleSchema>;

/**
 * Validates cross-field constraints on a set of answers.
 * Returns an array of error objects { fieldId, message } for any violations.
 */
export function validateCrossFieldRules(
  rules: CrossFieldRule[],
  answers: Record<string, unknown>,
): { fieldId: string; message: string }[] {
  const errors: { fieldId: string; message: string }[] = [];

  for (const rule of rules) {
    const sourceVal = answers[rule.sourceFieldId];
    const targetVal = answers[rule.targetFieldId];

    switch (rule.type) {
      case "date_after": {
        if (sourceVal && targetVal) {
          const source = new Date(String(sourceVal));
          const target = new Date(String(targetVal));
          if (!isNaN(source.getTime()) && !isNaN(target.getTime()) && source <= target) {
            errors.push({
              fieldId: rule.sourceFieldId,
              message: rule.message ?? "This date must be after the referenced field",
            });
          }
        }
        break;
      }
      case "date_before": {
        if (sourceVal && targetVal) {
          const source = new Date(String(sourceVal));
          const target = new Date(String(targetVal));
          if (!isNaN(source.getTime()) && !isNaN(target.getTime()) && source >= target) {
            errors.push({
              fieldId: rule.sourceFieldId,
              message: rule.message ?? "This date must be before the referenced field",
            });
          }
        }
        break;
      }
      case "not_equal": {
        if (sourceVal !== undefined && targetVal !== undefined && sourceVal === targetVal) {
          errors.push({
            fieldId: rule.sourceFieldId,
            message: rule.message ?? "This field must have a different value",
          });
        }
        break;
      }
      case "sum_max": {
        const s = Number(sourceVal) || 0;
        const t = Number(targetVal) || 0;
        if (s + t > 100) {
          errors.push({
            fieldId: rule.sourceFieldId,
            message: rule.message ?? "Combined value exceeds the maximum",
          });
        }
        break;
      }
      case "sum_min": {
        const s2 = Number(sourceVal) || 0;
        const t2 = Number(targetVal) || 0;
        if (s2 + t2 < 1) {
          errors.push({
            fieldId: rule.sourceFieldId,
            message: rule.message ?? "Combined value is below the minimum",
          });
        }
        break;
      }
    }
  }

  return errors;
}
