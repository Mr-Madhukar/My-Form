import { z } from "zod";

// ---------------------------------------------------------------------------
// Conditional Logic — show/hide/require fields based on other field values
// ---------------------------------------------------------------------------

export const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
]);

export const conditionActionSchema = z.enum(["show", "hide", "require"]);

export const fieldConditionSchema = z.object({
  id: z.string(),
  sourceFieldId: z.string(),
  operator: conditionOperatorSchema,
  value: z.unknown().optional(),
  action: conditionActionSchema,
});

export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;
export type ConditionAction = z.infer<typeof conditionActionSchema>;
export type FieldCondition = z.infer<typeof fieldConditionSchema>;

/**
 * Evaluates a single condition against the current form answers.
 * Returns true if the condition is "met" (i.e. the action should fire).
 */
export function evaluateCondition(
  condition: FieldCondition,
  answers: Record<string, unknown>,
): boolean {
  const sourceValue = answers[condition.sourceFieldId];

  switch (condition.operator) {
    case "equals":
      return sourceValue === condition.value;
    case "not_equals":
      return sourceValue !== condition.value;
    case "contains": {
      if (typeof sourceValue === "string" && typeof condition.value === "string") {
        return sourceValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      if (Array.isArray(sourceValue)) {
        return sourceValue.includes(condition.value);
      }
      return false;
    }
    case "not_contains": {
      if (typeof sourceValue === "string" && typeof condition.value === "string") {
        return !sourceValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      if (Array.isArray(sourceValue)) {
        return !sourceValue.includes(condition.value);
      }
      return true;
    }
    case "is_empty":
      return (
        sourceValue === undefined ||
        sourceValue === null ||
        sourceValue === "" ||
        (Array.isArray(sourceValue) && sourceValue.length === 0)
      );
    case "is_not_empty":
      return (
        sourceValue !== undefined &&
        sourceValue !== null &&
        sourceValue !== "" &&
        !(Array.isArray(sourceValue) && sourceValue.length === 0)
      );
    case "greater_than":
      return Number(sourceValue) > Number(condition.value);
    case "less_than":
      return Number(sourceValue) < Number(condition.value);
    default:
      return false;
  }
}

function applyConditionAction(
  condition: FieldCondition,
  answers: Record<string, unknown>,
  state: { visible: boolean; required: boolean }
): void {
  const met = evaluateCondition(condition, answers);

  switch (condition.action) {
    case "show":
      if (!met) state.visible = false;
      break;
    case "hide":
      if (met) state.visible = false;
      break;
    case "require":
      if (met) state.required = true;
      break;
  }
}

function resolveFieldState(
  field: { required: boolean; conditions?: FieldCondition[] },
  answers: Record<string, unknown>
): { visible: boolean; required: boolean } {
  const state = { visible: true, required: field.required };

  if (field.conditions && field.conditions.length > 0) {
    for (const condition of field.conditions) {
      applyConditionAction(condition, answers, state);
    }
  }

  // Hidden fields cannot be required (no validation on hidden fields)
  if (!state.visible) {
    state.required = false;
  }

  return state;
}

/**
 * Determines which fields should be visible and which should be required
 * based on the current answers and each field's conditions.
 *
 * Fields with no conditions are always visible with their default required state.
 */
export function evaluateFieldVisibility(
  fields: { id: string; required: boolean; conditions?: FieldCondition[] }[],
  answers: Record<string, unknown>
): Map<string, { visible: boolean; required: boolean }> {
  const result = new Map<string, { visible: boolean; required: boolean }>();

  for (const field of fields) {
    result.set(field.id, resolveFieldState(field, answers));
  }

  return result;
}
