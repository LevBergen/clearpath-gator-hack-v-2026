import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--disable-gpu"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1500, height: 1000 },
    deviceScaleFactor: 1,
  });
  const poster = await context.newPage();
  await poster.goto("http://127.0.0.1:4173/submission/thumbnail.html");
  await poster.evaluate(() => document.fonts.ready);
  await poster.screenshot({ path: "submission/thumbnail.png" });
  await poster.close();
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "submission/01-landing.png" });
  await page
    .getByRole("button", { name: "Try the missing-details challenge" })
    .click();
  await page.locator(".coverage-card").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "submission/02-workspace.png",
    fullPage: true,
  });
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
  await page
    .getByRole("button", { name: "Review & export", exact: true })
    .click();
  await page.getByRole("button", { name: "Review every answer" }).click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "This answer is accurate" }).click();
  await page.locator(".review-summary").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "submission/03-review.png", fullPage: true });
  await page
    .getByRole("button", { name: "Your application", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Question 4:/ }).click();
  await page.locator(".editor-card").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "submission/04-mobile.png", fullPage: true });
  console.log(
    "Thumbnail and gallery captured from the actual app. No model requests were made.",
  );
} finally {
  await browser.close();
}
