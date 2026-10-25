import { describe, expect, it } from "vitest";
import type { Application, Source } from "../src/core/types";
import {
  validateCoverage,
  coverageReady,
  assembleCoverage,
  invalidateCoverage,
} from "../src/core/coverage";
import { canExport } from "../src/core/workspace";
import { serializeWorkspace, restoreWorkspace } from "../src/core/save";

const application: Application = {
  id: "test",
  title: "Test application",
  description: "",
  fields: [
    {
      id: "story",
      label:
        "Explain what happened, its effect on your studies, the amount requested, and other financial help you tried.",
      plainLanguage: "Tell us the whole situation.",
      kind: "long",
      required: true,
    },
  ],
};
const sources: Source[] = [
  {
    id: "notes",
    name: "Notes",
    text: "My laptop broke on Monday. I need CAD for class.",
  },
];
const raw = [
  {
    fieldId: "story",
    parts: [
      {
        id: "event",
        label: "What happened",
        promptQuote: "what happened",
        question: "What happened?",
        value: "My laptop broke on Monday.",
        evidence: [{ sourceId: "notes", quote: "My laptop broke on Monday." }],
      },
      {
        id: "amount",
        label: "Requested amount",
        promptQuote: "the amount requested",
        question: "What amount have you confirmed you want to request?",
        value: "",
        evidence: [],
      },
    ],
  },
];

describe("prompt-backed coverage suggestions", () => {
  it("keeps sourced proposals as suggestions and leaves unknown details open", () => {
    const coverage = validateCoverage(application, sources, raw);
    expect(coverage.story.confirmed).toBe(false);
    expect(coverage.story.parts[0].value).toBe("My laptop broke on Monday.");
    expect(coverage.story.parts[0].accepted).toBe(false);
    expect(coverage.story.parts[1].value).toBe("");
    expect(coverageReady("story", coverage)).toBe(false);
  });
  it("rejects a requirement whose cited words are absent from the original question", () => {
    const forged = structuredClone(raw);
    forged[0].parts[0].promptQuote = "upload your passport";
    expect(() => validateCoverage(application, sources, forged)).toThrow();
  });
  it("rejects unknown fields and duplicate part IDs", () => {
    const unknown = structuredClone(raw);
    unknown[0].fieldId = "unknown";
    expect(() => validateCoverage(application, sources, unknown)).toThrow();
    const duplicate = structuredClone(raw);
    duplicate[0].parts[1].id = "event";
    expect(() => validateCoverage(application, sources, duplicate)).toThrow();
  });
  it("leaves an unsupported proposed detail blank rather than preserving it", () => {
    const forged = structuredClone(raw);
    forged[0].parts[0].evidence[0].quote = "I have a perfect GPA.";
    expect(
      validateCoverage(application, sources, forged).story.parts[0].value,
    ).toBe("");
  });
  it("never assembles while an active part is unanswered or unaccepted", () => {
    const coverage = validateCoverage(application, sources, raw);
    coverage.story.confirmed = true;
    coverage.story.parts[0].accepted = true;
    expect(() => assembleCoverage("story", coverage)).toThrow();
    coverage.story.parts[1].value = "I am requesting 450 dollars.";
    expect(coverageReady("story", coverage)).toBe(false);
    coverage.story.parts[1].accepted = true;
    expect(assembleCoverage("story", coverage)).toBe(
      "My laptop broke on Monday.\n\nI am requesting 450 dollars.",
    );
  });
  it("requires at least one active part after dismissing mistaken suggestions", () => {
    const coverage = validateCoverage(application, sources, raw);
    coverage.story.confirmed = true;
    coverage.story.parts.forEach((part) => {
      part.dismissed = true;
    });
    expect(coverageReady("story", coverage)).toBe(false);
  });
  it("invalidates confirmations after editing the final answer", () => {
    const coverage = validateCoverage(application, sources, raw);
    coverage.story.confirmed = true;
    coverage.story.parts.forEach((part) => {
      part.accepted = true;
      part.value = "Confirmed detail";
    });
    const changed = invalidateCoverage("story", coverage);
    expect(coverageReady("story", changed)).toBe(false);
    expect(changed.story.parts.every((p) => !p.accepted)).toBe(true);
    expect(coverage.story.parts[0].accepted).toBe(true);
  });
  it("does not add a coverage gate to a field with no analysis", () => {
    expect(coverageReady("story", {})).toBe(true);
  });
  it("blocks export of a reviewed paragraph while its coverage is unresolved", () => {
    const coverage = validateCoverage(application, sources, raw);
    const answers = {
      story: {
        fieldId: "story",
        value: "A plausible paragraph.",
        evidence: [],
        reviewed: true,
        origin: "person" as const,
      },
    };
    expect(canExport(application, answers, coverage)).toBe(false);
  });
  it("preserves unfinished detail responses on save and resets confirmations on restore", () => {
    const coverage = validateCoverage(application, sources, raw);
    coverage.story.confirmed = true;
    coverage.story.parts[1] = {
      ...coverage.story.parts[1],
      value: "I am requesting 450 dollars.",
      origin: "person",
      accepted: true,
    };
    const restored = restoreWorkspace(
      serializeWorkspace(application, sources, {}, coverage),
    );
    expect(restored.coverage.story.parts[1].value).toBe(
      "I am requesting 450 dollars.",
    );
    expect(restored.coverage.story.parts[1].accepted).toBe(false);
    expect(restored.coverage.story.confirmed).toBe(false);
  });
  it("does not force an unanswered optional question through coverage review", () => {
    const optionalApplication = {
      ...application,
      fields: application.fields.map((field) => ({
        ...field,
        required: false,
      })),
    };
    const coverage = validateCoverage(optionalApplication, sources, raw);
    expect(canExport(optionalApplication, {}, coverage)).toBe(true);
  });
  it("does not silently drop started follow-up details from an optional question", () => {
    const optionalApplication = {
      ...application,
      fields: application.fields.map((field) => ({
        ...field,
        required: false,
      })),
    };
    const coverage = validateCoverage(optionalApplication, sources, raw);
    coverage.story.parts[1] = {
      ...coverage.story.parts[1],
      value: "I am requesting 450 dollars.",
      origin: "person",
    };
    expect(canExport(optionalApplication, {}, coverage)).toBe(false);
  });
  it.each(["confirmed", "assembled", "accepted", "dismissed"] as const)(
    "keeps an optional question gated after %s interaction",
    (interaction) => {
      const optionalApplication = {
        ...application,
        fields: application.fields.map((field) => ({
          ...field,
          required: false,
        })),
      };
      const coverage = validateCoverage(optionalApplication, sources, raw);
      if (interaction === "confirmed" || interaction === "assembled")
        coverage.story[interaction] = true;
      else coverage.story.parts[0][interaction] = true;
      expect(canExport(optionalApplication, {}, coverage)).toBe(false);
    },
  );
  it("does not gate an untouched optional question merely because notes proposed a detail", () => {
    const optionalApplication = {
      ...application,
      fields: application.fields.map((field) => ({
        ...field,
        required: false,
      })),
    };
    const coverage = validateCoverage(optionalApplication, sources, raw);
    expect(coverage.story.parts[0].value).toBe("My laptop broke on Monday.");
    expect(canExport(optionalApplication, {}, coverage)).toBe(true);
    coverage.story.parts[1].origin = "person";
    coverage.story.parts[1].value = "   ";
    expect(canExport(optionalApplication, {}, coverage)).toBe(true);
  });
  it("requires a final answer when optional details have been assembled", () => {
    const optionalApplication = {
      ...application,
      fields: application.fields.map((field) => ({
        ...field,
        required: false,
      })),
    };
    const coverage = validateCoverage(optionalApplication, sources, raw);
    coverage.story.confirmed = true;
    coverage.story.assembled = true;
    coverage.story.parts.forEach((part) => {
      part.accepted = true;
      part.value = "Confirmed detail.";
    });
    expect(coverageReady("story", coverage)).toBe(true);
    expect(canExport(optionalApplication, {}, coverage)).toBe(false);
  });
});
