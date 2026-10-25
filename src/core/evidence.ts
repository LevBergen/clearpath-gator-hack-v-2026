import type { Application, Source, DraftResult } from "./types";
import { z } from "zod";
import { fieldError } from "./field-validation";

const rawSchema = z.object({
  answers: z
    .array(
      z.object({
        fieldId: z.string().max(100),
        value: z.string().max(6000),
        evidence: z
          .array(
            z.object({
              sourceId: z.string().max(100),
              quote: z.string().min(1).max(16000),
            }),
          )
          .max(10),
      }),
    )
    .max(60),
  guides: z
    .array(
      z.object({
        fieldId: z.string().max(100),
        plainLanguage: z.string().min(4).max(600),
      }),
    )
    .max(30)
    .optional(),
});

function numericValue(token: string): string | null {
  const value = token.replace(/[$€£\s]/g, "").replace("−", "-");
  if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value)) return null;
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value
    .replace(/^[+-]/, "")
    .replace(/,/g, "")
    .split(".");
  const integer = whole.replace(/^0+(?=\d)/, "");
  const decimal = fraction.replace(/0+$/, "");
  const magnitude = integer + (decimal ? `.${decimal}` : "");
  return negative && magnitude !== "0" ? `-${magnitude}` : magnitude;
}

function hasNumericValue(quote: string, value: string): boolean {
  const wanted = numericValue(value.trim());
  if (wanted === null) return false;
  // Preserve signs and whole tokens, including unsupported decimal/exponent
  // forms, so a fragment cannot be mistaken for the requested amount.
  const tokens =
    quote.match(
      /(?<![\p{L}\p{N}_.,])[+−-]?\s*[$€£]?\s*\d(?:[\d,]*\d)?(?:\.\d+)?(?:[eE][+−-]?\d+)?(?![\p{L}\p{N}_]|[.,]\d)/gu,
    ) ?? [];
  return tokens.some((token) => numericValue(token) === wanted);
}

function hasEmailValue(quote: string, value: string): boolean {
  const tokens =
    quote.match(
      /[\p{L}\p{M}\p{N}.!#$%&'*+/=?^_`{|}~-]+@[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}.-]*[\p{L}\p{M}\p{N}])?(?![\p{L}\p{M}\p{N}_.@-])/gu,
    ) ?? [];
  return tokens.some((token) => token.toLowerCase() === value.toLowerCase());
}

export function validateSuggestions(
  application: Application,
  sources: Source[],
  raw: unknown,
): DraftResult {
  const parsed = rawSchema.parse(raw);
  const result: DraftResult = { answers: {}, rejected: [] };
  if (parsed.guides)
    result.guides = Object.fromEntries(
      parsed.guides
        .filter((guide) =>
          application.fields.some((f) => f.id === guide.fieldId),
        )
        .map((guide) => [guide.fieldId, guide.plainLanguage]),
    );
  for (const proposal of parsed.answers) {
    const field = application.fields.find((f) => f.id === proposal.fieldId);
    const duplicate =
      parsed.answers.filter((a) => a.fieldId === proposal.fieldId).length > 1;
    const evidence = proposal.evidence.flatMap((item) => {
      const source = sources.find((s) => s.id === item.sourceId);
      const start = source?.text.indexOf(item.quote) ?? -1;
      return start < 0
        ? []
        : [{ ...item, start, end: start + item.quote.length }];
    });
    const unsupportedScalar =
      field?.kind === "number"
        ? !evidence.some((e) => hasNumericValue(e.quote, proposal.value))
        : field?.kind === "email"
          ? !evidence.some((e) => hasEmailValue(e.quote, proposal.value))
          : false;
    const reason = !field
      ? "Unknown question."
      : duplicate
        ? "Conflicting drafts for this question."
        : !proposal.value.trim()
          ? "No answer supplied."
          : fieldError(field, proposal.value) ||
            (evidence.length === 0 ||
            evidence.length !== proposal.evidence.length
              ? "A source excerpt could not be found in your notes."
              : unsupportedScalar
                ? "The exact value could not be found in the cited excerpts."
                : null);
    if (reason) {
      result.rejected.push({ fieldId: proposal.fieldId, reason });
      continue;
    }
    result.answers[proposal.fieldId] = {
      fieldId: proposal.fieldId,
      value: proposal.value,
      evidence,
      origin: "ai",
      reviewed: false,
    };
  }
  return result;
}

const normalizeLabel = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, "");

export function exactMatches(
  application: Application,
  sources: Source[],
): DraftResult {
  const result: DraftResult = { answers: {}, rejected: [] };
  for (const field of application.fields) {
    const label = normalizeLabel(field.label);
    if (!label) continue;
    const matches = sources.flatMap((source) =>
      source.text.split(/\r?\n/).flatMap((line) => {
        const separator = line.indexOf(":");
        if (separator < 0 || normalizeLabel(line.slice(0, separator)) !== label)
          return [];
        const value = line.slice(separator + 1).trim();
        if (!value || fieldError(field, value)) return [];
        return [
          {
            value,
            sourceId: source.id,
            quote: line,
            start: source.text.indexOf(line),
            end: source.text.indexOf(line) + line.length,
          },
        ];
      }),
    );
    if (new Set(matches.map((m) => m.value)).size !== 1) continue;
    const { value, ...evidence } = matches[0];
    result.answers[field.id] = {
      fieldId: field.id,
      value,
      evidence: [evidence],
      origin: "exact",
      reviewed: false,
    };
  }
  return result;
}
