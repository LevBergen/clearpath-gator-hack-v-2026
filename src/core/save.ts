import type { Application, Source, Answers } from "./types";
import { z } from "zod";
import { applicationSchema, safeId, sourcesSchema } from "./schema";
import { validateSuggestions } from "./evidence";
import {
  coverageStateSchema,
  restoreCoverage,
  type Coverage,
} from "./coverage";

const savedAnswer = z.object({
  fieldId: safeId,
  value: z.string().max(6000),
  reviewed: z.boolean(),
  origin: z.enum(["ai", "exact", "person", "example"]),
  evidence: z
    .array(
      z.object({
        sourceId: safeId,
        quote: z.string().min(1).max(16000),
        start: z.number().int().min(0),
        end: z.number().int().min(0),
      }),
    )
    .max(10),
});
const savedSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  application: applicationSchema,
  sources: sourcesSchema,
  answers: z.record(safeId, savedAnswer),
  coverage: coverageStateSchema.optional().default({}),
});

export function serializeWorkspace(
  application: Application,
  sources: Source[],
  answers: Answers,
  coverage: Coverage = {},
): string {
  const text = JSON.stringify(
    savedSchema.parse({ version: 2, application, sources, answers, coverage }),
    null,
    2,
  );
  if (text.length > 1000000)
    throw new Error(
      "This workspace is too large to save. Shorten the notes or answer details.",
    );
  return text;
}

export function restoreWorkspace(text: string): {
  application: Application;
  sources: Source[];
  answers: Answers;
  coverage: Coverage;
} {
  if (text.length > 1000000) throw new Error("This workspace is too large.");
  const saved = savedSchema.parse(JSON.parse(text));
  const answers: Answers = {};
  for (const field of saved.application.fields) {
    if (!Object.hasOwn(saved.answers, field.id)) continue;
    const previous = saved.answers[field.id];
    if (!previous) continue;
    if (previous.origin === "person")
      answers[field.id] = {
        ...previous,
        fieldId: field.id,
        reviewed: false,
        evidence: [],
      };
    else {
      const result = validateSuggestions(saved.application, saved.sources, {
        answers: [{ ...previous, fieldId: field.id }],
      });
      if (result.answers[field.id])
        answers[field.id] = {
          ...result.answers[field.id],
          origin: previous.origin,
          reviewed: false,
        };
    }
  }
  return {
    application: saved.application,
    sources: saved.sources,
    answers,
    coverage: restoreCoverage(saved.application, saved.sources, saved.coverage),
  };
}
