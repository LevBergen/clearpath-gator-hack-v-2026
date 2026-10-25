import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home and workspace have no detected WCAG A or AA violations", async ({
  page,
}) => {
  await page.goto("/");
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole("button", { name: "Explore a sample" }).click();
  const workspace = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(workspace.violations).toEqual([]);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  const coverage = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(coverage.violations).toEqual([]);
});
