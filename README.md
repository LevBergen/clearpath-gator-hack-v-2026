# Clearpath

**More possibility. Less paperwork.**

Clearpath turns application questions into a guided drafting workspace. Bring a text form and your own notes; see suggested answers beside exact source excerpts, fill missing facts yourself, then review before exporting.

Built from scratch during Gator Hack V, October 24–25, 2026. No pre-event Tables n Tabs project code, data, or infrastructure is used.

## Run locally

Requires Node.js 22.12+ and npm. This build was verified with Node.js 26.

```sh
npm install
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:4173. To enable AI, set `GEMINI_API_KEY` in `.env`; the current model is **`gemma-4-26b-a4b-it`**. Google accepted this model with the configured project and it has been exercised against the full example application. Restarting is automatic during development after `.env` changes. Keep the key server-only and out of Git.

You can use direct answers, exact label/value matching, review, save/resume, and export without a model. The sample starts with explicitly labeled authored illustrative drafts; pressing “Draft from my notes” performs a real model call. The UI distinguishes those states.

For local Ollama, install a model separately and set `AI_PROVIDER=ollama` and `OLLAMA_MODEL`. The adapter exists; local Ollama inference has not been exercised on the development machine.

## Use it

1. Explore the fictional student support application or paste a title and one question per line. Mark optional questions with `(optional)` and character limits with `(max 200 characters)`.
2. Add notes directly or import `.txt`/`.md` notes. Original questions remain visible.
3. Draft with the connected model, or copy exact labeled matches without AI.
4. Inspect excerpts, answer unknowns, and edit the draft. Edits require another review.
5. Review each completed answer, then download the text packet. Clearpath never submits an application.

“Save workspace” downloads unfinished work as a local JSON file. “Resume a saved workspace” restores it without automatically trusting previous review states. Saved work contains your own notes and answers; keep that file private.

## What is checked

- Request validation: 1–30 fields, at most 5 notes, 16,000 characters per note and 32,000 total.
- Each generated answer must cite exact text present in a submitted source. Unknown field/source IDs and duplicate proposals are rejected.
- Numbers and email addresses must also occur in the cited excerpts.
- Sources are checked again on workspace restore. All restored reviews reset.
- Changing context clears drafts and reviews. In-flight results cannot overwrite a newer workspace or manually edited answer.
- Export requires all required answers to pass field validation and every completed answer to have been reviewed.
- Source presence is **not** fact checking, semantic entailment, or eligibility verification. A model can misinterpret a real excerpt. Human review remains essential.

## Technical approach

React + TypeScript + Vite on the client, a small Express server, Zod schemas shared across API and saved-workspace boundaries, pure domain modules, Vitest integration tests, and Playwright browser tests. Gemma 4 runs through Google's generateContent API with thinking disabled for the bounded drafting task. No arbitrary tool execution or external URL fetching is available to the model.

No application database, analytics, automatic browser storage, or outgoing messages. Notes go to Google only when the user chooses AI drafting. Google processing is governed by the terms of the user's API project; Clearpath cannot promise that an external provider retains nothing. Fonts are self-hosted. Read-aloud uses the browser/OS speech engine; available voices and where synthesis occurs depend on the browser.

## Verify

```sh
npm test
npm run typecheck
npm run build
npx playwright test
```

The browser tests use installed Google Chrome and a separate local test server on port 4174 with AI disabled, so they never spend API quota. Live inference is checked separately with fictional data.

```sh
npm run build
npm start
```

Production serves only `dist/` and the API. Set `HOST=0.0.0.0` on a hosting provider. `render.yaml` is prepared for a Render web service; publishing is a separate owner action.

## Limits

Text forms only: no PDF/image parsing, native site filling, accounts, funding discovery, eligibility decisions, or actual application submission. Imported field inference is deliberately simple; check the imported questions and requirements. The rate limiter is in-memory and intended for a single early-stage instance; add shared limits/authentication before scaling a public deployment. The hosted prototype should be used with fictional data during judging.

## Submission materials

See `submission/devpost.md`, `submission/demo-script.md`, and the prepared gallery. No public repository, deployment, team affiliation, or submission URL is claimed before the owner actually publishes it. See `docs/progress.md` for verified build state.

## License

MIT for this application. Model weights and external services have their own licenses and terms. An open-source code license does not grant rights to the applicant's notes.
