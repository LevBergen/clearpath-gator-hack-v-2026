import { test, expect } from "@playwright/test";
import {
  challengeApplication,
  challengeSources,
  challengeCoverage,
  challengeIllustration,
} from "../src/core/challenge";
import { validateCoverage } from "../src/core/coverage";
import { validateSuggestions } from "../src/core/evidence";
import { serializeWorkspace } from "../src/core/save";

const regenerated = () => {
  const raw = structuredClone(challengeIllustration);
  raw.answers.find((answer) => answer.fieldId === "story")!.value =
    "My laptop stopped working on Monday.";
  return {
    ...validateSuggestions(challengeApplication, challengeSources, raw),
    coverage: validateCoverage(
      challengeApplication,
      challengeSources,
      challengeCoverage,
    ),
    engine: {
      provider: "google",
      model: "local-test-fixture",
      available: true,
    },
  };
};

test("a complete-looking draft exposes two missing details and cannot skip to final review", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Did you answer every part?",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("4 suggested parts. 2 have no proposed detail yet.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "This breakdown matches the question" })
    .click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByLabel("Detail: The amount you are requesting")
    .fill("I am requesting 450 dollars.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByLabel("Detail: Other financial help tried")
    .fill("I have not tried other financial help yet.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByRole("button", { name: "Build my answer from these details" })
    .click();
  await expect(page.getByLabel(/Answer: Describe the unexpected/)).toHaveValue(
    /I am requesting 450 dollars/,
  );
  await page
    .getByRole("button", { name: "Review & export", exact: true })
    .click();
  await page.getByRole("button", { name: "Review every answer" }).click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "This answer is accurate" }).click();
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeEnabled();
});

test("changing a generated paragraph invalidates its earlier coverage confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  await page
    .getByRole("button", { name: "This breakdown matches the question" })
    .click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByLabel("Detail: The amount you are requesting")
    .fill("I am requesting 450 dollars.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page.getByLabel("Detail: Other financial help tried").fill("None yet.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByRole("button", {
      name: "I checked that my current wording covers these details",
    })
    .click();
  await page.route("**/api/draft", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(regenerated()),
    }),
  );
  await page
    .getByRole("button", { name: /Match my details|Draft from my notes/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Did you answer every part?",
    }),
  ).toBeVisible();
});

test("regeneration preserves a manually removed question part", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  await page
    .getByRole("button", { name: "This breakdown matches the question" })
    .click();
  await page
    .getByRole("button", {
      name: "This part is not asked: Other financial help tried",
    })
    .click();
  await page.route("**/api/draft", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(regenerated()),
    }),
  );
  await page
    .getByRole("button", { name: /Match my details|Draft from my notes/ })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Restore part: Other financial help tried",
    }),
  ).toBeVisible();
});

test("confirmed details remain editable when the assembled answer is too long", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  await page
    .getByRole("button", { name: "This breakdown matches the question" })
    .click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByLabel("Detail: The amount you are requesting")
    .fill("x".repeat(1600));
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page.getByLabel("Detail: Other financial help tried").fill("None yet.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByRole("button", { name: "Build my answer from these details" })
    .click();
  await expect(page.getByRole("alert")).toContainText("need editing");
  await page
    .getByRole("button", {
      name: "Check part 3: The amount you are requesting",
    })
    .click();
  await page
    .getByLabel("Detail: The amount you are requesting")
    .fill("I am requesting 450 dollars.");
  await page.getByRole("button", { name: "Confirm this detail" }).click();
  await page
    .getByRole("button", { name: "Build my answer from these details" })
    .click();
  await expect(page.getByLabel(/Answer: Describe the unexpected/)).toHaveValue(
    /450/,
  );
});

function optionalWorkspace(answer = "") {
  const application = {
    id: "optional-follow-up",
    title: "Fictional optional question",
    description: "Synthetic regression fixture.",
    fields: [
      {
        id: "story",
        label: "Describe an optional activity and the support you need.",
        plainLanguage: "What activity would you like support for?",
        kind: "long" as const,
        required: false,
      },
    ],
  };
  const sources = [{ id: "notes", name: "Fictional notes", text: "" }];
  const coverage = validateCoverage(application, sources, [
    {
      fieldId: "story",
      parts: [
        {
          id: "support",
          label: "Support needed",
          promptQuote: "the support you need",
          question: "What support would help?",
          value: "",
          evidence: [],
        },
      ],
    },
  ]);
  coverage.story.parts[0] = {
    ...coverage.story.parts[0],
    origin: "person",
    value: "I would need a fictional equipment loan.",
  };
  return serializeWorkspace(
    application,
    sources,
    answer
      ? {
          story: {
            fieldId: "story",
            value: answer,
            reviewed: false,
            origin: "person",
            evidence: [],
          },
        }
      : {},
    coverage,
  );
}

test("started optional details block export and route both the banner and review into follow-ups", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose a saved Clearpath workspace").setInputFiles({
    name: "optional.clearpath.json",
    mimeType: "application/json",
    buffer: Buffer.from(optionalWorkspace()),
  });
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Check the missing details" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Did you answer every part?",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review & export", exact: true })
    .click();
  await page.getByRole("button", { name: "Review every answer" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Did you answer every part?",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "This breakdown matches the question" })
    .click();
  await expect(page.getByLabel("Detail: Support needed")).toHaveValue(
    "I would need a fictional equipment loan.",
  );
});

test("explicitly skipping an optional question clears its old answer and follow-up details", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose a saved Clearpath workspace").setInputFiles({
    name: "optional.clearpath.json",
    mimeType: "application/json",
    buffer: Buffer.from(optionalWorkspace("An earlier fictional answer.")),
  });
  await page
    .getByRole("button", {
      name: "Skip this optional question and clear its follow-up details",
    })
    .click();
  await expect(
    page.getByLabel(
      "Answer: Describe an optional activity and the support you need.",
    ),
  ).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeEnabled();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save workspace" }).click();
  const download = await pending;
  const saved = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile((await download.path())!, "utf8"),
  );
  expect(saved.answers).toEqual({});
  expect(saved.coverage).toEqual({});
});

test("direct-answer fallback names the detail discard and preserves existing final wording", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose a saved Clearpath workspace").setInputFiles({
    name: "optional.clearpath.json",
    mimeType: "application/json",
    buffer: Buffer.from(optionalWorkspace("An earlier fictional answer.")),
  });
  await page
    .getByRole("button", {
      name: "Discard these follow-up details and answer directly",
    })
    .click();
  await expect(
    page.getByLabel(
      "Answer: Describe an optional activity and the support you need.",
    ),
  ).toHaveValue("An earlier fictional answer.");
});
