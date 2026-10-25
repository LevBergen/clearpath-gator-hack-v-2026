# Clearpath: question coverage

## Decision

Retain the working application and make the central demo about a plausible answer that misses parts of a multipart question. Form filling and source citations already exist in mature products. Our event-scale contribution is an inspectable applicant-coaching workflow: expose the question's parts, ask for missing details, preserve the person's facts, and require an explicit review.

Lev delegated implementation decisions and authorized a substantial readiness pass. He clarified that the project is built by him and this assistant; his partner is not a development or testing dependency. No independent usability exercise is planned or claimed.

## Alternatives

- Restart on an unrelated idea: no specific better-understood problem or tester exists; it sacrifices a working interface and integration.
- Add broad OCR, multilingual, or external-form automation: useful but common and expensive to make reliable.
- Add original-prompt-backed coverage coaching: chosen because it strengthens the actual application task and creates a harder, honest demo.

## Behavior

An AI response can propose a short list of parts a question asks for. Each must cite an exact span of the original question. The applicant checks the breakdown against that question before using it. The suggestions are not a proof that every requirement was found.

Each part can have a possible answer from the applicant's notes, with exact excerpts, or a focused follow-up. The applicant accepts or corrects each detail. These are confirmed applicant facts, not verified claims. A person can mark a proposed part as not actually required. An explicit manual correction remains visible in the local workspace.

Once details are confirmed, the applicant can assemble a draft deterministically from those details. This step does not invent connecting facts. The assembled draft is editable and needs a final review. Unresolved active coverage checks block review/export. Editing a main answer invalidates both its review and its coverage confirmation; changing source notes clears drafts and coverage. Saving preserves unfinished detail responses. Restoring resets all confirmations.

Legacy/custom forms without a coverage analysis keep the existing direct-answer workflow. Coverage can be generated with live AI. The harder built-in sample includes explicitly labeled illustrative coverage so judges can inspect the interaction without spending API quota; pressing the live draft button uses Gemma.

## Types and boundaries

`Coverage` is a record keyed by field ID. A `FieldCoverage` has `confirmed`, `assembled`, and `parts`. Each `CoveragePart` has a stable ID, `label`, `promptQuote`, `question`, optional proposed value/evidence, `value`, `accepted`, and `dismissed`.

`validateCoverage(application, sources, raw)` checks exact prompt spans, known fields, unique parts, bounded count/text, and exact proposed-source excerpts. It starts every confirmation false. `coverageReady(fieldId, coverage)` requires confirmed breakdown, at least one active part, and a nonempty accepted value for every active part. `assembleCoverage(fieldId, coverage)` requires readiness and joins only the accepted values. `invalidateCoverage` resets the relevant confirmations after edits.

Coverage state is part of version 2 saved workspaces; version 1 files remain readable. Restore revalidates question/source spans, resets confirmations, and never trusts saved review flags. Existing API answer/source validation and exact-match caveats remain in force.

## Validation and demo

Test invented/foreign prompt spans, unknown fields, duplicates, unsupported proposed details, unresolved/dismissed parts, saved-workspace round trips, source edits, final-answer edits, and export gates. Keep all existing regression tests.

Use an original fictional multipart student-support question informed by public emergency-funding instructions, with attribution and no institutional partnership claim. Notes support the emergency and coursework impact; requested amount and other financial help remain open. Show the app exposing those gaps, collecting the user's details, assembling the answer, and reviewing the packet. Do not claim zero hallucinations, semantic completeness, eligibility verification, or measured user benefit.
