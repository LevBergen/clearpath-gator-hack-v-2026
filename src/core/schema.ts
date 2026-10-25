import { z } from "zod";
export const safeId = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/)
  .refine(
    (value) => value !== "prototype" && !Object.hasOwn(Object.prototype, value),
  );
export const fieldSchema = z.object({
  id: safeId,
  label: z.string().trim().min(1).max(800),
  plainLanguage: z.string().max(800),
  required: z.boolean(),
  kind: z.enum(["short", "long", "email", "number"]),
  maxLength: z.number().int().min(1).max(6000).optional(),
});
export const applicationSchema = z.object({
  id: safeId,
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000),
  fields: z
    .array(fieldSchema)
    .min(1)
    .max(30)
    .refine(
      (fields) => new Set(fields.map((f) => f.id)).size === fields.length,
    ),
});
export const sourcesSchema = z
  .array(
    z.object({
      id: safeId,
      name: z.string().trim().min(1).max(160),
      text: z.string().max(16000),
    }),
  )
  .min(1)
  .max(5)
  .refine(
    (sources) =>
      new Set(sources.map((s) => s.id)).size === sources.length &&
      sources.reduce((n, s) => n + s.text.length, 0) <= 32000,
  );
