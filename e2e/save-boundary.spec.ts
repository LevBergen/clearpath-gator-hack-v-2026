import { test, expect } from "@playwright/test";
test("the editor and save path agree on the maximum answer length", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Use my own form" }).click();
  await page
    .getByLabel("Application questions")
    .fill("Test form\nDescribe your circumstances");
  await page.getByRole("button", { name: "Create my workspace" }).click();
  const input = page.getByLabel("Answer: Describe your circumstances");
  await input.fill("x".repeat(6001));
  expect((await input.inputValue()).length).toBeLessThanOrEqual(6000);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save workspace" }).click();
  expect((await download).suggestedFilename()).toContain(".json");
  expect(errors).toEqual([]);
});
