import { test, expect } from "@playwright/test";

test("sample makes missing facts visible and keeps export behind human review", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore a sample" }).click();
  await expect(
    page.getByText("Fictional sample · illustrative drafts"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeDisabled();
  await expect(page.getByText("One detail still needs you")).toBeVisible();
  await page
    .getByRole("button", { name: "Answer the missing question" })
    .click();
  await expect(page.getByLabel("Answer: Amount requested")).toHaveValue("");
  await page.getByLabel("Answer: Amount requested").fill("450");
  await page
    .getByRole("button", { name: "Review & export", exact: true })
    .click();
  await page.getByRole("button", { name: "Review every answer" }).click();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "This answer is accurate" }).click();
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download reviewed draft" }).click();
  expect((await downloadPromise).suggestedFilename()).toContain(".txt");
});

test("editing notes removes stale drafts and their reviews", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore a sample" }).click();
  await page.getByRole("button", { name: "Edit my context" }).click();
  await page.getByLabel("Text for My notes").fill("Full name: Jordan Smith");
  await page
    .getByRole("button", { name: "Save context & reset drafts" })
    .click();
  await expect(page.getByText("0 of 6 required answers ready")).toBeVisible();
  await page.getByRole("button", { name: "Match my details" }).click();
  await expect(page.getByLabel("Answer: Full name")).toHaveValue(
    "Jordan Smith",
  );
});

test("custom import supports a complete guided workflow without AI", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use my own form" }).click();
  await page
    .getByLabel("Application questions")
    .fill(
      "Community application\n1. Full name\n2. Email address\n3. Extra details (optional)",
    );
  await page.getByRole("button", { name: "Create my workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Community application", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Answer: Full name").fill("Jordan Smith");
  await page.getByRole("button", { name: "Question 2: Email address" }).click();
  await page.getByLabel("Answer: Email address").fill("jordan@example.com");
  await page
    .getByRole("button", { name: "Review & export", exact: true })
    .click();
  await page.getByRole("button", { name: "Review every answer" }).click();
  await page.getByRole("button", { name: "This answer is accurate" }).click();
  await page.getByRole("button", { name: "This answer is accurate" }).click();
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeEnabled();
});

test("mobile layout stays within the viewport and dialogs support Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Use my own form" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Explore a sample" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Answer the missing question" })
    .click();
  await expect(page.getByLabel("Answer: Amount requested")).toBeVisible();
});
