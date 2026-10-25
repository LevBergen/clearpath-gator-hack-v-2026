# Clearpath

A draft can read well and still miss part of the question.

Clearpath breaks application questions into parts tied to the original wording. It brings in details from the applicant's notes and asks follow-ups for what is missing. The applicant checks the suggestions and reviews the final answer before downloading it.

Built by Lev Bergen with Codex assistance during Gator Hack V, October 24–25, 2026. This is a fresh project; no Tables n Tabs code, data, or infrastructure is reused.

## Try the workflow

The fictional example asks Maya to explain an unexpected expense, its effect on coursework, the amount she needs, and other financial help she has tried. Her paragraph covers the first two. It sounds finished, but the question asks for more.

1. Open the missing-details challenge, or paste your own text form with one question per line.
2. Add notes directly or import `.txt`/`.md` files.
3. Choose **Draft from my notes** to call Gemma 4. Check the proposed question parts against the original wording.
4. Confirm or correct the suggested details, answer the follow-ups, and remove any part the question does not actually ask for.
5. Build an answer from the details you confirmed, edit it if needed, then review every completed answer and download the text packet.

The examples begin with labeled illustrations; the drafting button makes a real model call. Without AI, you can explore the illustration, enter answers, copy exact labeled details from notes, review, and export.

**Save workspace** downloads unfinished work as a local JSON file. Resuming keeps your notes and answers but resets confirmations and reviews. The file contains your information; keep it private.

## Run locally

Requires Node.js 22.12+ and npm. Development has been tested with Node.js 26.

```sh
npm install
cp .env.example .env
npm run dev
```

Open [the local app](http://127.0.0.1:4173). Set `GEMINI_API_KEY` in `.env` to enable **Gemma 4 `gemma-4-26b-a4b-it`** through Google's Gemini API. The key stays on the server and must stay out of Git. The development server watches `.env` for changes.

An Ollama adapter is also available through `AI_PROVIDER=ollama` and `OLLAMA_MODEL`. Local Ollama inference has not been tested on the development machine.

## How it works

React, TypeScript, and Vite provide the interface; an Express server calls Gemma with minimal thinking. The model proposes drafts, simpler questions, and question parts. Zod schemas and domain functions check exact quotes against the notes and original questions.

A matching quote establishes that the text is present. It does **not** establish that the answer is true, that the quote supports the claim, or that the breakdown found every requirement. The applicant checks all three.

Building an answer joins only the confirmed details. Export requires all required answers and a review of every completed answer. An answer with a breakdown needs its active checks resolved first. Editing an answer resets its review and question checks; changing the notes clears old drafts and checks. Late model responses cannot replace newer edits.

## Data and scope

Clearpath has no application database, analytics, or automatic browser storage. Choosing AI drafting sends the form and notes to Google under the terms of the configured API project. Explicit downloads stay on your device. Read-aloud uses the speech engine configured by the browser or operating system.

This prototype accepts text forms and notes. It does not parse PDFs/images, decide eligibility, verify facts, fill external websites, or submit applications. Check imported questions against the original form. Use fictional data for judging. No applicant study has been conducted.

## Verify and host

```sh
npm test
npm run typecheck
npm run build
npx playwright test
```

Browser tests use Google Chrome and a separate server on port 4174 with AI disabled. They do not call a live model.

```sh
npm run build
npm start
```

Production serves `dist/` and the API. `render.yaml` prepares a separate Render web service with `HOST=0.0.0.0`. The in-memory rate limit is intended for a single prototype instance. Publication and deployment remain the owner's actions.

Submission materials are in `submission/`; recorded checks are in `docs/progress.md` and `submission/readiness-evidence.md`. Public instructions informed the fictional challenge, with references in `src/core/challenge.ts`. It is not an official application or university partnership.

## License

MIT for the application code. Models and external services have their own terms. Applicant notes remain the applicant's information.
