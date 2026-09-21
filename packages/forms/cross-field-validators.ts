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

function parseDateValue(val: unknown): Date | null {
  if (typeof val === "string" || typeof val === "number" || val instanceof Date) {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function evaluateDateAfter(rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown): string | null {
  if (sourceVal && targetVal) {
    const source = parseDateValue(sourceVal);
    const target = parseDateValue(targetVal);
    if (source && target && source <= target) {
      return rule.message ?? "This date must be after the referenced field";
    }
  }
  return null;
}

function evaluateDateBefore(rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown): string | null {
  if (sourceVal && targetVal) {
    const source = parseDateValue(sourceVal);
    const target = parseDateValue(targetVal);
    if (source && target && source >= target) {
      return rule.message ?? "This date must be before the referenced field";
    }
  }
  return null;
}

function evaluateNotEqual(rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown): string | null {
  if (sourceVal !== undefined && targetVal !== undefined && sourceVal === targetVal) {
    return rule.message ?? "This field must have a different value";
  }
  return null;
}

function evaluateSumMax(rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown): string | null {
  const s = Number(sourceVal) || 0;
  const t = Number(targetVal) || 0;
  if (s + t > 100) {
    return rule.message ?? "Combined value exceeds the maximum";
  }
  return null;
}

function evaluateSumMin(rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown): string | null {
  const s2 = Number(sourceVal) || 0;
  const t2 = Number(targetVal) || 0;
  if (s2 + t2 < 1) {
    return rule.message ?? "Combined value is below the minimum";
  }
  return null;
}

const ruleHandlers: Record<
  CrossFieldRule["type"],
  (rule: CrossFieldRule, sourceVal: unknown, targetVal: unknown) => string | null
> = {
  date_after: evaluateDateAfter,
  date_before: evaluateDateBefore,
  not_equal: evaluateNotEqual,
  sum_max: evaluateSumMax,
  sum_min: evaluateSumMin,
};

/**
 * Validates cross-field constraints on a set of answers.
 * Returns an array of error objects { fieldId, message } for any violations.
 */
export function validateCrossFieldRules(
  rules: readonly CrossFieldRule[],
  answers: Readonly<Record<string, unknown>>,
): { fieldId: string; message: string }[] {
  const errors: { fieldId: string; message: string }[] = [];

  for (const rule of rules) {
    const handler = ruleHandlers[rule.type];
    if (!handler) continue;
    const message = handler(rule, answers[rule.sourceFieldId], answers[rule.targetFieldId]);
    if (message) {
      errors.push({ fieldId: rule.sourceFieldId, message });
    }
  }

  return errors;
}
