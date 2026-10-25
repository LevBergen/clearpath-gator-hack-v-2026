import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--disable-gpu"],
});
const context = await browser.newContext({
  viewport: { width: 1500, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4173/submission/thumbnail.html");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "submission/thumbnail.png" });
await page.goto("http://127.0.0.1:4173");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "submission/01-landing.png" });
await page.getByRole("button", { name: "Explore a sample" }).click();
await page.screenshot({ path: "submission/02-workspace.png", fullPage: true });
await page.getByRole("button", { name: "Answer the missing question" }).click();
await page.getByLabel("Answer: Amount requested").fill("450");
await page
  .getByRole("button", { name: "Review & export", exact: true })
  .click();
await page.screenshot({ path: "submission/03-review.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page
  .getByRole("button", { name: "Your application", exact: true })
  .click();
await page.getByRole("button", { name: /Question 4:/ }).click();
await page.screenshot({ path: "submission/04-mobile.png", fullPage: true });
await browser.close();
console.log("Thumbnail and gallery captured from the actual application.");
