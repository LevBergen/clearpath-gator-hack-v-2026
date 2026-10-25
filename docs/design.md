# Clearpath

Built from scratch for Gator Hack V, starting October 24, 2026. Lev delegated product and implementation decisions. No Tables n Tabs code, data, credentials, or infrastructure is reused.

## Intent

Help a person turn a confusing application into a reviewable draft without inventing facts about them. The entry must demonstrate useful behavior within a minute and produce an honest, repeatable three-minute video.

## Product

A calm, accessible web workspace. Start with a clearly fictional campus support application or paste your own questions. Add notes, then draft answers. Each AI draft includes exact source excerpts checked against the submitted notes. Missing evidence stays empty. A guided one-question-at-a-time view lets the user answer or correct every field. Review before exporting a plain-text packet. The app never submits an application.

Original questions stay visible next to a plain-language guide. Read-aloud uses the browser's speech engine, with graceful fallback. Keyboard navigation, reduced motion, responsive layouts, and readable contrast are core requirements.

## Approaches considered

- Generic chat: cheap to build, difficult to audit or demonstrate completion.
- Autonomous cross-site filling: visually strong, but unreliable across arbitrary websites and dependent on a sponsor's desktop software.
- Structured application workspace: chosen by the implementer for inspectable evidence, reliable demonstration, and a bounded end-to-end task.

## Architecture

React + TypeScript + Vite with a small Express server. Pure domain functions own parsing, evidence validation, progress, review invalidation, and export. The server calls Google generateContent or a local Ollama service; keys remain server-only. No database, user accounts, analytics, or persistent upload storage. Drafts live in browser memory; an explicit save action can download a local JSON workspace.

Without an AI connection, exact label/value matching and guided answers work. A bundled synthetic example may use an explicitly labeled illustrative replay. No replay is presented as a live model response. User input is treated as data, never executed. Source presence is not proof of truth or semantic entailment: all answers require human review.

## Boundaries

No eligibility decision, legal/financial advice, external form submission, arbitrary URL fetching, real personal demonstration data, or automatic credential discovery. No claim to a sponsor prize until its model/API has actually been exercised. Export is blocked until every required field is answered and every answered field reviewed.

## Delivery

Local working app, focused unit/integration tests, desktop/mobile browser QA, README, MIT license, Devpost copy, 3:2 thumbnail and gallery images, and a three-minute demo script. Publishing and submission remain Lev's final actions.

## Submission constraints from screenshots

Name: 60 characters. Pitch: 200 characters. Story: inspiration, what it does, how built, challenges, lessons, accomplishments, next steps. Up to 25 built-with tags. Demo/code links. Images JPG/PNG/GIF, <=5 MB each, recommended 3:2, <=15 gallery items. Video link: YouTube or Vimeo, <=3 minutes per event requirements. Team details must be completed with actual registered people.
