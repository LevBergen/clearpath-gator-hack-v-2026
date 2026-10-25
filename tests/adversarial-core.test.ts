import { describe, expect, it } from "vitest";
import { exactMatches, validateSuggestions } from "../src/core/evidence";
import { parseForm } from "../src/core/form";
import { restoreWorkspace, serializeWorkspace } from "../src/core/save";
import { applicationSchema, safeId } from "../src/core/schema";
import { canExport, fieldError } from "../src/core/workspace";
import type { Application, Field, Source } from "../src/core/types";

const field: Field = {
  id: "answer",
  label: "Answer",
  plainLanguage: "What is your answer?",
  kind: "short",
  required: true,
};
const application: Application = {
  id: "synthetic-form",
  title: "Synthetic application",
  description: "Fictional test data only.",
  fields: [field],
};
const notes: Source[] = [{ id: "notes", name: "Synthetic notes", text: "" }];

function suggest(kind: Field["kind"], value: string, quote: string) {
  return validateSuggestions(
    { ...application, fields: [{ ...field, kind }] },
    [{ ...notes[0], text: quote }],
    {
      answers: [
        { fieldId: "answer", value, evidence: [{ sourceId: "notes", quote }] },
      ],
    },
  );
}

describe("complete scalar evidence", () => {
  it.each([
    ["maya@example.com", "Email: notmaya@example.com"],
    ["maya@example.com", "Email: maya@example.com.au"],
    ["maya@example.com", "Email: maya@example.com-other.org"],
  ])("rejects a different email containing %s", (value, quote) => {
    expect(suggest("email", value, quote).answers.answer).toBeUndefined();
  });

  it("accepts a complete email next to prose punctuation", () => {
    expect(
      suggest("email", "maya@example.com", "Contact <MAYA@example.com>.")
        .answers.answer?.value,
    ).toBe("maya@example.com");
  });

  it.each([
    ["450", "Amount: -450 dollars"],
    ["450", "Amount: −450 dollars"],
    ["450", "Amount: -$450"],
    ["1.23", "Amount: 1.234"],
    ["9007199254740993", "Amount: 9007199254740992"],
    ["100", "Amount: 1,00"],
  ])("rejects a different numeric token for %s", (value, quote) => {
    expect(suggest("number", value, quote).answers.answer).toBeUndefined();
  });

  it.each([
    ["1250", "Amount requested: $1,250.00."],
    ["450.50", "Amount requested: +450.50 dollars"],
    ["0.50", "Amount requested: $0.50, confirmed today"],
  ])("accepts the complete equivalent amount %s", (value, quote) => {
    expect(suggest("number", value, quote).answers.answer?.value).toBe(value);
  });
});

describe("Unicode exact label matching", () => {
  it("does not copy one non-Latin label into different questions", () => {
    const app = {
      ...application,
      fields: [
        { ...field, id: "age", label: "年龄" },
        { ...field, id: "address", label: "家庭地址" },
      ],
    };
    const result = exactMatches(app, [{ ...notes[0], text: "姓名: 王小明" }]);
    expect(Object.keys(result.answers)).toEqual([]);
  });

  it("matches the intended non-Latin label", () => {
    const app = { ...application, fields: [{ ...field, label: "姓名" }] };
    const result = exactMatches(app, [{ ...notes[0], text: "姓名: 王小明" }]);
    expect(result.answers.answer?.value).toBe("王小明");
  });

  it("does not match labels that normalize to no letters or numbers", () => {
    const app = { ...application, fields: [{ ...field, label: "???" }] };
    expect(
      Object.keys(
        exactMatches(app, [{ ...notes[0], text: "!!!: Wrong" }]).answers,
      ),
    ).toEqual([]);
  });
});

describe("form import boundaries", () => {
  it("keeps a title containing address out of the required questions", () => {
    const app = parseForm(
      "Change of address application\n1. Full name\n2. Current address",
    );
    expect(app.title).toBe("Change of address application");
    expect(app.fields.map((item) => item.label)).toEqual([
      "Full name",
      "Current address",
    ]);
  });

  it("preserves title-free imperative questions", () => {
    const app = parseForm("Describe your circumstances\nExplain your plan");
    expect(app.title).toBe("My application");
    expect(app.fields.map((item) => item.label)).toEqual([
      "Describe your circumstances",
      "Explain your plan",
    ]);
  });

  it.each(["0", "-1", "1.5", "many", "6001", "999999999999999999999"])(
    "rejects an unsupported character limit of %s before creating a workspace",
    (limit) => {
      expect(() =>
        parseForm(
          "Synthetic form\n1. Your story (max " + limit + " characters)",
        ),
      ).toThrow(/character limit/i);
    },
  );

  it("imports a supported limit as schema-valid, saveable state", () => {
    const app = parseForm("Synthetic form\n1. Your story (max 200 characters)");
    expect(app.fields[0].maxLength).toBe(200);
    expect(applicationSchema.safeParse(app).success).toBe(true);
    expect(
      restoreWorkspace(serializeWorkspace(app, notes, {})).application,
    ).toEqual(app);
  });

  it("rejects conflicting character-limit annotations", () => {
    expect(() =>
      parseForm(
        "Synthetic form\n1. Your story (max 200 characters) (max 300 characters)",
      ),
    ).toThrow(/character limit/i);
  });

  it("rejects an empty markdown title before creating unusable state", () => {
    expect(() => parseForm("#\n1. Full name")).toThrow(/title/i);
  });
});

describe("inherited record keys", () => {
  it.each([
    "toString",
    "valueOf",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toLocaleString",
  ])("rejects inherited identifier %s at the input boundary", (id) => {
    expect(safeId.safeParse(id).success).toBe(false);
    const app = { ...application, fields: [{ ...field, id }] };
    expect(() => serializeWorkspace(app, notes, {})).toThrow();
    expect(() =>
      restoreWorkspace(
        JSON.stringify({
          version: 1,
          application: app,
          sources: notes,
          answers: {},
        }),
      ),
    ).toThrow();
  });

  it("does not treat inherited answers as completed reviewed work", () => {
    const inherited = Object.create({
      answer: {
        fieldId: "answer",
        value: "Unreviewed inherited fact",
        reviewed: true,
        origin: "person",
        evidence: [],
      },
    });
    expect(canExport(application, inherited)).toBe(false);
  });
});

describe("answers match the single-line review controls", () => {
  it.each([
    ["short", "Jordan\nSmith", "Name: Jordan\nSmith"],
    ["short", "Jordan\rSmith", "Name: Jordan\rSmith"],
    ["email", "\nmaya@example.com\n", "Email:\nmaya@example.com\n"],
    ["number", "450\n", "Amount: 450\n"],
  ] as const)("rejects a multiline %s draft", (kind, value, quote) => {
    expect(suggest(kind, value, quote).answers.answer).toBeUndefined();
  });

  it("does not export a restored multiline short answer as reviewed", () => {
    const restored = restoreWorkspace(
      serializeWorkspace(application, notes, {
        answer: {
          fieldId: "answer",
          value: "Jordan\nSmith",
          origin: "person",
          reviewed: true,
          evidence: [],
        },
      }),
    );
    expect(fieldError(field, restored.answers.answer.value)).toBeTruthy();
    expect(
      canExport(application, {
        answer: { ...restored.answers.answer, reviewed: true },
      }),
    ).toBe(false);
  });

  it("rejects surrounding email whitespace that the browser would remove", () => {
    expect(
      suggest("email", " maya@example.com ", "Email: maya@example.com ").answers
        .answer,
    ).toBeUndefined();
  });

  it("keeps paragraphs in long narrative answers", () => {
    expect(
      suggest(
        "long",
        "First paragraph.\nSecond paragraph.",
        "First paragraph.\nSecond paragraph.",
      ).answers.answer?.value,
    ).toBe("First paragraph.\nSecond paragraph.");
  });
});
