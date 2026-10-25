import { test, expect } from "@playwright/test";
test("unfinished answers can be saved locally and resumed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore a sample" }).click();
  await page.getByRole("button", { name: "Question 1: Full name" }).click();
  await page.getByLabel("Answer: Full name").fill("Saved Person");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save workspace" }).click();
  const path = await (await pending).path();
  await page.goto("/");
  await page
    .getByLabel("Choose a saved Clearpath workspace")
    .setInputFiles(path!);
  await expect(page.getByLabel("Answer: Full name")).toHaveValue(
    "Saved Person",
  );
  await expect(
    page.getByRole("button", { name: "Download reviewed draft" }),
  ).toBeDisabled();
});
