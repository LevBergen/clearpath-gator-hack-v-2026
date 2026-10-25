import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { narration } from "./demo-narration.mjs";

const folder = path.resolve("submission/.build");
fs.mkdirSync(folder, { recursive: true });
if (!process.env.GEMINI_API_KEY)
  throw new Error(
    "Set the server-only GEMINI_API_KEY before generating narration.",
  );
for (const [index, segment] of narration.segments.entries()) {
  const transcript = segment[1];
  const signature = createHash("sha256")
    .update(
      JSON.stringify([
        narration.model,
        narration.voice,
        narration.style,
        transcript,
      ]),
    )
    .digest("hex");
  const output = path.join(folder, "narration-" + index + ".wav");
  const marker = output + ".sha256";
  if (
    fs.existsSync(output) &&
    fs.existsSync(marker) &&
    fs.readFileSync(marker, "utf8") === signature
  ) {
    console.log("Narration " + (index + 1) + ": cached");
    continue;
  }
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: narration.model,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: transcript,
                annotations: [
                  { type: "speech_metadata", style: narration.style },
                ],
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: narration.voice }] },
      }),
      signal: AbortSignal.timeout(90000),
    },
  );
  if (!response.ok)
    throw new Error(
      "Narration request failed with HTTP " +
        response.status +
        ". No provider response or credentials logged.",
    );
  const body = await response.json();
  const block = (body.steps || [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((item) => item.type === "audio")
    .at(-1);
  if (!block?.data || block.mime_type !== "audio/wav")
    throw new Error("Narration response did not contain WAV audio.");
  fs.writeFileSync(output, Buffer.from(block.data, "base64"));
  fs.writeFileSync(marker, signature);
  fs.writeFileSync(
    path.join(folder, "narration-" + index + ".txt"),
    transcript,
  );
  console.log("Narration " + (index + 1) + ": generated");
}
