import { describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createApp } from "../server/app";
import {
  challengeApplication,
  challengeSources,
  challengeCoverage,
  challengeIllustration,
} from "../src/core/challenge";

async function draft(raw: unknown) {
  const app = createApp({
    engine: { provider: "google", model: "test-fixture", available: true },
    generate: async () => raw,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/draft`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application: challengeApplication,
          sources: challengeSources,
        }),
      },
    );
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("coverage at the API boundary", () => {
  it("returns checked prompt spans with every human confirmation initially unset", async () => {
    const result = await draft({
      ...challengeIllustration,
      coverage: challengeCoverage,
    });
    expect(result.status).toBe(200);
    expect(result.body.coverage.story.parts).toHaveLength(4);
    expect(
      result.body.coverage.story.parts.filter(
        (p: { value: string }) => !p.value,
      ),
    ).toHaveLength(2);
    expect(result.body.coverage.story.confirmed).toBe(false);
  });
  it("fails closed if a model invents a requirement absent from the original question", async () => {
    const coverage = structuredClone(challengeCoverage);
    coverage[0].parts[0].promptQuote = "Send your passport";
    expect((await draft({ ...challengeIllustration, coverage })).status).toBe(
      502,
    );
  });
});
