import type { Application, Answers, Answer } from "./types";
import { coverageReady, coverageStarted, type Coverage } from "./coverage";

export { fieldError } from "./field-validation";
import { fieldError } from "./field-validation";

export function canExport(
  application: Application,
  answers: Answers,
  coverage: Coverage = {},
): boolean {
  return (
    application.fields.length > 0 &&
    application.fields.every((field) => {
      const answer = Object.hasOwn(answers, field.id)
        ? answers[field.id]
        : undefined;
      const value = answer?.value ?? "";
      const started = coverageStarted(field.id, coverage);
      return (
        !fieldError(field, value) &&
        (!started || Boolean(value.trim())) &&
        ((!field.required && !value.trim() && !started) ||
          coverageReady(field.id, coverage)) &&
        (!value.trim() || answer?.reviewed === true)
      );
    })
  );
}

export function exportPacket(
  application: Application,
  answers: Answers,
  coverage: Coverage = {},
): string {
  if (!canExport(application, answers, coverage))
    throw new Error(
      "Answer the required questions and review every completed answer before exporting.",
    );
  return [
    application.title,
    "Prepared with Clearpath · Not submitted",
    "Review this draft against the original application before you use it. Source excerpts show where wording came from; they do not verify truth or eligibility.",
    ...application.fields.map((field) => {
      const answer = Object.hasOwn(answers, field.id)
        ? answers[field.id]
        : undefined;
      if (!answer?.value.trim())
        return `${field.label}\nNot provided (optional)`;
      const provenance = answer.evidence
        .map((e) => `Source ${e.sourceId}: “${e.quote}”`)
        .join("\n");
      const parts = Object.hasOwn(coverage, field.id)
        ? "\nQuestion parts checked by applicant:\n" +
          coverage[field.id].parts
            .map(
              (part) =>
                `- ${part.label}: ${part.dismissed ? "Removed as not asked by applicant" : part.value}`,
            )
            .join("\n")
        : "";
      return `${field.label}\n${answer.value}\n${provenance || "Entered by applicant."}${parts}`;
    }),
  ].join("\n\n");
}

export function editAnswer(previous: Answer, value: string): Answer {
  return {
    fieldId: previous.fieldId,
    value,
    evidence: [],
    origin: "person",
    reviewed: false,
  };
}
