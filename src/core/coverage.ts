import type { Application, Source, Evidence } from "./types";
import { z } from "zod";
import { safeId } from "./schema";
import { validateSuggestions } from "./evidence";
export type CoveragePart = {
  id: string;
  label: string;
  promptQuote: string;
  question: string;
  value: string;
  evidence: Evidence[];
  accepted: boolean;
  dismissed: boolean;
  origin: "notes" | "person";
};
export type FieldCoverage = {
  confirmed: boolean;
  assembled: boolean;
  parts: CoveragePart[];
};
export type Coverage = Record<string, FieldCoverage>;
export const coverageStateSchema = z.record(
  safeId,
  z.object({
    confirmed: z.boolean(),
    assembled: z.boolean(),
    parts: z
      .array(
        z.object({
          id: safeId,
          label: z.string().min(1).max(120),
          promptQuote: z.string().min(3).max(800),
          question: z.string().min(4).max(400),
          value: z.string().max(2000),
          accepted: z.boolean(),
          dismissed: z.boolean(),
          origin: z.enum(["notes", "person"]),
          evidence: z
            .array(
              z.object({
                sourceId: safeId,
                quote: z.string().min(1).max(16000),
                start: z.number().int().min(0),
                end: z.number().int().min(0),
              }),
            )
            .max(5),
        }),
      )
      .min(1)
      .max(8),
  }),
);
export const rawCoverageSchema = z
  .array(
    z.object({
      fieldId: safeId,
      parts: z
        .array(
          z.object({
            id: safeId,
            label: z.string().trim().min(1).max(120),
            promptQuote: z.string().trim().min(3).max(800),
            question: z.string().trim().min(4).max(400),
            value: z.string().max(2000).default(""),
            evidence: z
              .array(
                z.object({
                  sourceId: safeId,
                  quote: z.string().min(1).max(16000),
                }),
              )
              .max(5)
              .default([]),
          }),
        )
        .min(1)
        .max(8),
    }),
  )
  .max(30);

export function validateCoverage(
  application: Application,
  sources: Source[],
  raw: unknown,
): Coverage {
  const proposals = rawCoverageSchema.parse(raw);
  const result: Coverage = Object.create(null);
  for (const proposal of proposals) {
    const field = application.fields.find((f) => f.id === proposal.fieldId);
    if (!field || Object.hasOwn(result, proposal.fieldId))
      throw new Error(
        "The question breakdown refers to an unknown or duplicate question.",
      );
    if (
      new Set(proposal.parts.map((part) => part.id)).size !==
      proposal.parts.length
    )
      throw new Error("The question breakdown contains duplicate parts.");
    const parts: CoveragePart[] = proposal.parts.map((part) => {
      if (!field.label.includes(part.promptQuote))
        throw new Error(
          "A suggested requirement could not be found in the original question.",
        );
      const detailApplication: Application = {
        ...application,
        fields: [{ ...field, id: part.id, kind: "long", maxLength: 2000 }],
      };
      const suggestion = part.value.trim()
        ? validateSuggestions(detailApplication, sources, {
            answers: [
              { fieldId: part.id, value: part.value, evidence: part.evidence },
            ],
          }).answers[part.id]
        : undefined;
      return {
        id: part.id,
        label: part.label,
        promptQuote: part.promptQuote,
        question: part.question,
        value: suggestion?.value || "",
        evidence: suggestion?.evidence || [],
        accepted: false,
        dismissed: false,
        origin: "notes",
      };
    });
    result[proposal.fieldId] = { confirmed: false, assembled: false, parts };
  }
  return result;
}

export function canAssembleCoverage(
  fieldId: string,
  coverage: Coverage,
): boolean {
  if (!Object.hasOwn(coverage, fieldId)) return false;
  const state = coverage[fieldId];
  const active = state.parts.filter((part) => !part.dismissed);
  return (
    state.confirmed &&
    active.length > 0 &&
    active.every(
      (part) =>
        part.accepted &&
        Boolean(part.value.trim()) &&
        part.value.length <= 2000,
    )
  );
}

export function coverageReady(fieldId: string, coverage: Coverage): boolean {
  if (!Object.hasOwn(coverage, fieldId)) return true;
  return coverage[fieldId].assembled && canAssembleCoverage(fieldId, coverage);
}

export function coverageStarted(fieldId: string, coverage: Coverage): boolean {
  if (!Object.hasOwn(coverage, fieldId)) return false;
  const state = coverage[fieldId];
  return (
    state.confirmed ||
    state.assembled ||
    state.parts.some(
      (part) =>
        part.accepted ||
        part.dismissed ||
        (part.origin === "person" && Boolean(part.value.trim())),
    )
  );
}

export function assembleCoverage(fieldId: string, coverage: Coverage): string {
  if (!canAssembleCoverage(fieldId, coverage))
    throw new Error(
      "Check the question breakdown and confirm every active detail first.",
    );
  return coverage[fieldId].parts
    .filter((part) => !part.dismissed)
    .map((part) => part.value.trim())
    .join("\n\n");
}

export function invalidateCoverage(
  fieldId: string,
  coverage: Coverage,
): Coverage {
  if (!Object.hasOwn(coverage, fieldId)) return coverage;
  return {
    ...coverage,
    [fieldId]: {
      ...coverage[fieldId],
      confirmed: false,
      assembled: false,
      parts: coverage[fieldId].parts.map((part) => ({
        ...part,
        accepted: false,
      })),
    },
  };
}

export function restoreCoverage(
  application: Application,
  sources: Source[],
  raw: unknown,
): Coverage {
  const saved = coverageStateSchema.parse(raw);
  const restored = validateCoverage(
    application,
    sources,
    Object.entries(saved).map(([fieldId, state]) => ({
      fieldId,
      parts: state.parts.map((part) => ({
        ...part,
        value: part.origin === "notes" ? part.value : "",
      })),
    })),
  );
  for (const [fieldId, state] of Object.entries(restored)) {
    state.parts = state.parts.map((part) => {
      const previous = saved[fieldId].parts.find((p) => p.id === part.id)!;
      return {
        ...part,
        ...(previous.origin === "person"
          ? { value: previous.value, origin: "person" as const, evidence: [] }
          : {}),
        dismissed: previous.dismissed,
      };
    });
  }
  return restored;
}
