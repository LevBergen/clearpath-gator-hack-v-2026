import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { narration } from "./demo-narration.mjs";
const build = path.resolve("submission/.build");
fs.mkdirSync(path.join(build, "video"), { recursive: true });
const segments = narration.segments;
const durations = [];
for (let i = 0; i < segments.length; i++) {
  if (!fs.existsSync(path.join(build, "narration-" + i + ".wav")))
    throw new Error("Run node scripts/generate-narration.mjs first.");
  durations.push(
    Number(
      execFileSync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          path.join(build, "narration-" + i + ".wav"),
        ],
        { encoding: "utf8" },
      ).trim(),
    ),
  );
}
console.log(
  JSON.stringify({
    narrationSeconds: durations.reduce((a, b) => a + b, 0),
    segments: durations.length,
  }),
);
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--disable-gpu"],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: path.join(build, "video"),
    size: { width: 1600, height: 1000 },
  },
});
const page = await context.newPage();
const timeline = [];
let liveParts = [];
async function caption(text) {
  await page.evaluate((text) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText =
        "position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:10000;background:#163e32f5;color:#f8faed;border:1px solid #759260;padding:12px 22px;border-radius:8px;font:14px system-ui;box-shadow:0 6px 25px #0002;white-space:nowrap;pointer-events:none";
      document.body.append(el);
    }
    el.textContent = text + "  ·  Synthetic narration / fictional data";
  }, text);
}
async function segment(i, action) {
  await caption(segments[i][0]);
  const start = Date.now();
  await action();
  await page.waitForTimeout(
    Math.max(0, (durations[i] + 1.2) * 1000 - (Date.now() - start)),
  );
  const length = (Date.now() - start) / 1000;
  timeline.push({ segment: i, duration: length });
  console.log(
    "Recorded segment " +
      (i + 1) +
      "/" +
      segments.length +
      ": " +
      length.toFixed(1) +
      "s",
  );
}
try {
  await page.goto("http://127.0.0.1:4173");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await segment(0, async () => {});
  await segment(1, async () => {
    await page
      .getByRole("button", { name: "Try the missing-details challenge" })
      .click();
    await page.locator(".original-question").scrollIntoViewIfNeeded();
  });
  await segment(2, async () => {
    await page
      .getByRole("button", { name: "Draft from my notes" })
      .scrollIntoViewIfNeeded();
    const pending = page.waitForResponse(
      (r) => r.url().endsWith("/api/draft") && r.request().method() === "POST",
      { timeout: 50000 },
    );
    await page.getByRole("button", { name: "Draft from my notes" }).click();
    const response = await pending;
    if (!response.ok())
      throw new Error("Live inference failed during recording");
    const data = await response.json();
    liveParts = data.coverage?.story?.parts || [];
    if (
      !data.answers.story ||
      liveParts.length !== 4 ||
      liveParts.filter((part) => !part.value.trim()).length !== 2
    )
      throw new Error("Live output did not match this demonstration");
    await page.getByRole("button", { name: /Question 4:/ }).click();
  });
  await segment(3, async () => {
    await page.locator(".coverage-card").scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "This breakdown matches the question" })
      .click();
    for (const [index, part] of liveParts.entries()) {
      if (!part.value.trim()) continue;
      await page
        .getByRole("button", {
          name: "Check part " + (index + 1) + ": " + part.label,
          exact: true,
        })
        .click();
      const evidence = page.locator(".part-evidence summary");
      if (await evidence.count()) await evidence.click();
      await page.waitForTimeout(1200);
      await page.getByRole("button", { name: "Confirm this detail" }).click();
    }
  });
  await segment(4, async () => {
    for (const [index, part] of liveParts.entries()) {
      if (part.value.trim()) continue;
      await page
        .getByRole("button", {
          name: "Check part " + (index + 1) + ": " + part.label,
          exact: true,
        })
        .click();
      const value = /amount/i.test(part.promptQuote)
        ? "I am requesting 450 dollars."
        : "I have not tried other financial help yet.";
      await page
        .getByLabel("Detail: " + part.label, { exact: true })
        .fill(value);
      await page.waitForTimeout(800);
      await page.getByRole("button", { name: "Confirm this detail" }).click();
    }
    await page
      .getByRole("button", { name: "Build my answer from these details" })
      .click();
    await page.locator(".editor-card").scrollIntoViewIfNeeded();
  });
  await segment(5, async () => {
    await page
      .getByRole("button", { name: "Review & export", exact: true })
      .click();
    await page.getByRole("button", { name: "Review every answer" }).click();
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(1200);
      await page
        .getByRole("button", { name: "This answer is accurate" })
        .click();
    }
  });
  await segment(6, async () => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download reviewed draft" }).click();
    await (await pending).saveAs("submission/example-reviewed-draft.txt");
    await page.locator(".workspace-bottom").scrollIntoViewIfNeeded();
  });
  const recording = await page.video().path();
  await context.close();
  const audioInputs = [];
  const chains = [];
  for (let i = 0; i < segments.length; i++) {
    audioInputs.push("-i", path.join(build, "narration-" + i + ".wav"));
    chains.push(
      "[" +
        i +
        ":a]apad,atrim=duration=" +
        timeline[i].duration.toFixed(3) +
        ",asetpts=PTS-STARTPTS[a" +
        i +
        "]",
    );
  }
  const concat =
    chains.join(";") +
    ";" +
    timeline.map((_, i) => "[a" + i + "]").join("") +
    "concat=n=" +
    segments.length +
    ":v=0:a=1,adelay=1500|1500,loudnorm=I=-16:TP=-1.5:LRA=11[out]";
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    ...audioInputs,
    "-filter_complex",
    concat,
    "-map",
    "[out]",
    path.join(build, "narration.wav"),
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    recording,
    "-i",
    path.join(build, "narration.wav"),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    "-shortest",
    "submission/clearpath-demo.mp4",
  ]);
  const seconds = Number(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        "submission/clearpath-demo.mp4",
      ],
      { encoding: "utf8" },
    ).trim(),
  );
  if (seconds > 180) throw new Error("Demo exceeded three minutes");
  fs.writeFileSync(
    "submission/demo-recording.json",
    JSON.stringify(
      {
        durationSeconds: seconds,
        narration: "Synthetic male Orus voice via " + narration.model,
        fictionalData: true,
        liveModel: "gemma-4-26b-a4b-it",
        waitingTimeRetained: true,
        segments: timeline,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ saved: "submission/clearpath-demo.mp4", seconds }),
  );
} finally {
  await browser.close();
}
