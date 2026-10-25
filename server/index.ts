import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { configuredEngine, createGenerator } from "./ai";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = configuredEngine();
const app = createApp({ engine, generate: createGenerator(engine) });
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () =>
  console.log(
    `Clearpath ready at http://${host}:${port} · ${engine.provider === "exact" ? "Exact matching; AI not connected" : engine.model}`,
  ),
);
