import express from "express";
import { z } from "zod";
import type { Engine, Application, Source } from "../src/core/types";
import { exactMatches, validateSuggestions } from "../src/core/evidence";
import { applicationSchema, sourcesSchema } from "../src/core/schema";
import { validateCoverage } from "../src/core/coverage";
export type AppOptions = {
  engine: Engine;
  generate?: (application: Application, sources: Source[]) => Promise<unknown>;
};

const requestSchema = z.object({
  application: applicationSchema,
  sources: sourcesSchema,
});

export function createApp(options: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  const rate = new Map<string, { count: number; until: number }>();
  app.get("/api/status", (_req, res) => res.json(options.engine));
  app.post("/api/draft", async (req, res) => {
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          res
            .status(403)
            .json({ error: "Use Clearpath from its own browser tab." });
          return;
        }
      } catch {
        res.status(403).json({ error: "Invalid request origin." });
        return;
      }
    }
    const body = requestSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({
        error:
          "Check your form and notes. Use 1–30 questions and up to 32,000 characters of notes.",
      });
      return;
    }
    const now = Date.now();
    for (const [key, value] of rate) if (value.until < now) rate.delete(key);
    const key = req.ip || "local";
    const record = rate.get(key) ?? { count: 0, until: now + 60000 };
    if (record.count >= 12) {
      res
        .set("Retry-After", "60")
        .status(429)
        .json({ error: "Take a moment, then try drafting again in a minute." });
      return;
    }
    record.count++;
    rate.set(key, record);
    try {
      const { application, sources } = body.data;
      if (!options.engine.available) {
        res.json({
          ...exactMatches(application, sources),
          engine: options.engine,
        });
        return;
      }
      if (!options.generate) throw new Error("Provider not configured");
      const raw = await options.generate(application, sources);
      const proposedCoverage =
        raw && typeof raw === "object" && "coverage" in raw
          ? (raw as { coverage: unknown }).coverage
          : undefined;
      res.json({
        ...validateSuggestions(application, sources, raw),
        ...(proposedCoverage !== undefined
          ? {
              coverage: validateCoverage(
                application,
                sources,
                proposedCoverage,
              ),
            }
          : {}),
        engine: options.engine,
      });
    } catch {
      res.status(502).json({
        error:
          "The model could not produce a usable draft. Your notes are still here. Try again, check the model connection, or answer the questions yourself.",
      });
    }
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Unknown API route." }),
  );
  app.use(
    (
      error: { type?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (error.type === "entity.too.large") {
        res.status(413).json({
          error: "This request is too large. Shorten the form or notes.",
        });
        return;
      }
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: "The request could not be read." });
        return;
      }
      next(error);
    },
  );
  return app;
}
