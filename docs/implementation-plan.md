# Clearpath Implementation Plan

> Execute natively using superpowers:executing-plans; one independent whole-project review at the end.

**Goal:** Produce a working, evidence-linked application assistant and truthful submission materials.
**Architecture:** React UI, pure shared TypeScript domain, Express AI adapter; memory-only session.
**Tech stack:** React, TypeScript, Vite, Express, Zod, Vitest, Playwright.
**Spec:** docs/design.md

## Global constraints
- Never reuse TnT project code or data.
- Never invent missing applicant facts; preserve unknowns.
- AI keys are server-only. No body/key logging.
- No external submission or publication without Lev's final action.
- Synthetic examples and replay must be clearly labeled.

## Review focus
- Fabricated source quote: reject suggestion instead of displaying as sourced.
- Source changes: invalidate old drafts/reviews instead of mixing versions.
- Missing required fields: block export; optional blanks do not block it.
- Provider failures, malformed JSON, and oversized input: visible, recoverable errors.
- Keyboard/mobile review: focus and meaningful controls work without hover.

## Task 1: Application domain
Files: src/core/types.ts, form.ts, evidence.ts, workspace.ts, sample.ts; tests/core.test.ts.
Interfaces: parseForm(text): Application; validateSuggestions(application, sources, raw): DraftResult; canExport(application, answers): boolean; exportPacket(application, answers): string.
1. Write tests covering imported question parsing, invalid evidence, unknown field IDs, duplicate suggestions, review requirements, edits invalidating review, and export gates.
2. Run npm test and observe expected failures.
3. Implement the pure domain functions and sample data.
4. Run tests to green and commit locally.

## Task 2: AI boundary
Files: server/app.ts, ai.ts, index.ts; tests/server.test.ts.
Interfaces: GET /api/status; POST /api/draft {application, sources}; returns validated DraftResult + engine label.
1. Write request tests for missing keys, malformed/oversized inputs, source spoofing, exact matching without AI, and provider failure.
2. Observe failures; implement validation, bounded requests, Google/Ollama adapter, same-origin protection, rate limiting, no-store.
3. Run all tests and typecheck; commit locally.

## Task 3: User workflow
Files: src/App.tsx, components/*, styles.css, main.tsx; tests/browser.spec.ts.
Interfaces: shared domain types and draft endpoint.
1. Write browser cases for sample launch, evidence panel, changing notes clearing drafts, guide completion, review/export gate, custom import, and mobile navigation.
2. Observe missing UI failures. Implement landing, application workspace, notes editor, guide, review, export, settings and help.
3. Build, run browser cases, inspect actual screenshots, repair observed issues, commit locally.

## Task 4: Delivery and review
Files: README.md, LICENSE, submission/*.
1. Write factual Devpost draft and timed demo script from observed functionality.
2. Generate 3:2 thumbnail/gallery from the actual app and prepare local recording.
3. Run full tests, typecheck and production build; get a fresh independent review and address material findings.
4. Report exact remaining external actions and AI connection status.
