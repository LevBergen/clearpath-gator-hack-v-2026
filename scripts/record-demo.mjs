import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const build = path.resolve("submission/.build");
fs.mkdirSync(path.join(build, "video"), { recursive: true });
const segments = [
  [
    "A clearer way forward",
    "A student needs a working laptop to keep up with class. But the support application asks them to describe the unforeseen circumstances necessitating assistance. The opportunity is helpful. The form is hard to start. Clearpath turns that moment into a clearer next step.",
  ],
  [
    "Fictional applicant · illustrative starting drafts",
    "This is Maya, a fictional student, and this is a fictional support application. Clearpath keeps the original question visible and offers a simpler guide. What happened, and how is it making college harder? Her notes and supporting excerpts stay beside the answer. The starting drafts are labeled examples, not a live generation.",
  ],
  [
    "Real Gemma 4 call · waiting time retained",
    "Now we call Gemma four with the actual questions and notes. This is real inference, and the waiting time is kept in this recording. The model suggests answers and plain language question guides. The application checks each quoted excerpt against the supplied notes. Unsupported source quotes are rejected. The model cannot approve the application or submit it.",
  ],
  [
    "A source match is not a fact check",
    "The model has drafted the supported details. Here is the situation, alongside the exact words it used from Maya’s notes. A matching excerpt does not establish that an answer is true or complete. The applicant can inspect the original question, change the wording, and check every answer before using it.",
  ],
  [
    "Unknown information stays open",
    "One important space remains empty. Maya has not checked the cost of a replacement, so there is no requested amount in her notes. Clearpath asks instead of making one up. For this fictional demonstration, Maya has now confirmed an amount of four hundred fifty dollars, and enters it herself.",
  ],
  [
    "Review each answer · then export",
    "Next comes human review. Each completed answer needs an explicit confirmation, including answers written by the applicant. Editing an answer removes that confirmation. The download stays unavailable until every required field is valid and every completed answer has been reviewed. The final decision stays with the person applying.",
  ],
  [
    "Local download · nothing submitted",
    "The result is a reviewed text packet downloaded to this device. Nothing has been submitted. Unfinished work can also be saved locally and resumed later. Clearpath currently accepts text forms and notes. It does not decide eligibility or verify facts. The next step is testing these guides with real applicants and support staff. More possibility. Less paperwork.",
  ],
];
const durations = [];
for (let i = 0; i < segments.length; i++) {
  const file = path.join(build, "narration-" + i + ".txt");
  fs.writeFileSync(file, segments[i][1]);
  execFileSync("say", [
    "-v",
    "Samantha",
    "-r",
    "160",
    "-f",
    file,
    "-o",
    path.join(build, "narration-" + i + ".aiff"),
  ]);
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
          path.join(build, "narration-" + i + ".aiff"),
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
    await page.getByRole("button", { name: "Explore a sample" }).click();
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
    if (!data.answers.circumstances || data.answers.amount)
      throw new Error("Live output did not match this demonstration");
    await page.getByRole("button", { name: /Question 4:/ }).click();
  });
  await segment(3, async () => {
    await page.locator(".work-grid").scrollIntoViewIfNeeded();
  });
  await segment(4, async () => {
    await page
      .getByRole("button", { name: "Answer the missing question" })
      .click();
    await page.getByLabel("Answer: Amount requested").fill("450");
  });
  await segment(5, async () => {
    await page
      .getByRole("button", { name: "Review & export", exact: true })
      .click();
    await page.getByRole("button", { name: "Review every answer" }).click();
    for (let i = 0; i < 6; i++) {
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
    audioInputs.push("-i", path.join(build, "narration-" + i + ".aiff"));
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
    ":v=0:a=1,adelay=1500|1500[out]";
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
        narration: "Synthetic macOS Samantha voice",
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
