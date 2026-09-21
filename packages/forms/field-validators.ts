import { z } from "zod";
import { type FieldType } from "./field-types";
import { fieldConfigSchemas } from "./field-configs";

export type FieldForValidation = {
  id: string;
  type: FieldType;
  required: boolean;
  config: unknown;
};

const REQUIRED = { error: "This field is required" } as const;

function buildTextSchema(
  type: "short_text" | "long_text",
  config: unknown,
  required: boolean
): z.ZodTypeAny {
  const cfg = fieldConfigSchemas[type].parse(config ?? {});
  let s = z.string(required ? REQUIRED : undefined);
  if (cfg.minLength !== undefined) s = s.min(cfg.minLength);
  if (cfg.maxLength !== undefined) s = s.max(cfg.maxLength);
  return s;
}

function buildNumberSchema(config: unknown, required: boolean): z.ZodTypeAny {
  const cfg = fieldConfigSchemas.number.parse(config ?? {});
  let s = z.number(required ? REQUIRED : undefined);
  if (cfg.min !== undefined) s = s.min(cfg.min);
  if (cfg.max !== undefined) s = s.max(cfg.max);
  return s;
}

function buildSingleChoiceSchema(config: unknown, required: boolean): z.ZodTypeAny {
  const cfg = fieldConfigSchemas.single_choice.parse(config ?? { options: [] });
  const ids = new Set(cfg.options.map((o) => o.id));
  return z
    .string(required ? REQUIRED : undefined)
    .refine((v) => ids.has(v), { message: "Invalid option" });
}

function buildMultipleChoiceSchema(config: unknown): z.ZodTypeAny {
  const cfg = fieldConfigSchemas.multiple_choice.parse(config ?? { options: [] });
  const ids = new Set(cfg.options.map((o) => o.id));
  let s = z.array(z.string().refine((v) => ids.has(v), { message: "Invalid option" }));
  if (cfg.min !== undefined) s = s.min(cfg.min);
  if (cfg.max !== undefined) s = s.max(cfg.max);
  return s;
}

function buildRatingSchema(config: unknown, required: boolean): z.ZodTypeAny {
  const cfg = fieldConfigSchemas.rating.parse(config ?? { scale: 5, style: "star" });
  return z
    .number(required ? REQUIRED : undefined)
    .int()
    .min(1)
    .max(cfg.scale);
}

function buildFieldBaseSchema(
  type: FieldType,
  config: unknown,
  required: boolean
): z.ZodTypeAny {
  switch (type) {
    case "short_text":
    case "long_text":
      return buildTextSchema(type, config, required);
    case "email":
      return z.string(required ? REQUIRED : undefined).email();
    case "number":
      return buildNumberSchema(config, required);
    case "single_choice":
      return buildSingleChoiceSchema(config, required);
    case "multiple_choice":
      return buildMultipleChoiceSchema(config);
    case "rating":
      return buildRatingSchema(config, required);
    case "date":
    case "time":
      return z.string(required ? REQUIRED : undefined);
    case "file_upload":
      return z.string(required ? REQUIRED : undefined).url({ message: "Invalid file URL" });
    case "url":
      return z.string(required ? REQUIRED : undefined).url({ message: "Invalid URL" });
    default:
      return z.unknown();
  }
}

export function zodForField(field: FieldForValidation): z.ZodTypeAny {
  const { type, required, config } = field;
  const schema = buildFieldBaseSchema(type, config, required);

  if (!required) {
    return schema.optional();
  }

  return schema;
}
