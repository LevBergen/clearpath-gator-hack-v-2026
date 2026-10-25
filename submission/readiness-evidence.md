# Readiness evidence

This is a record of bounded technical checks, not a claim of zero bugs, novel invention of form filling, or measured improvement for real applicants.

## Independent reviews and reproduced defects

Two read-only review passes challenged the original implementation and the new coaching flow. Concrete failures were reproduced before correction: partial scalar matches, non-Latin label collisions, save/editor length mismatch, multiline short-answer review mismatch, spurious imported title questions, inherited property IDs, stale file imports, lost manual coverage corrections, stale coverage confirmation after regeneration, and editing a too-long assembled answer.

The regression suite uses synthetic inputs. The browser suite exercises the actual UI and a local HTTP server. Network boundaries are replaced with controlled fixtures in browser regression cases so test runs spend no model quota. Live model calls are separate explicit readiness exercises.

## Live model exercises

Model: gemma-4-26b-a4b-it through Google's API, with minimal thinking.

The original fictional support example returned five sourced answers and seven guides, leaving the unknown requested amount blank. The harder multipart challenge returned four question parts, with proposed details for the event and coursework effect and empty details for requested amount and other financial help. That response took about 20 seconds in the observed run.

These are individual observed responses, not a population-level accuracy measure. Exact quote matching establishes text presence, not entailment or truth. The applicant still checks the proposed breakdown, every detail used, and the final answer.

## Manual submission checks still required

The owner must verify the deployed URL after publication, check video playback at the eventual public/unlisted URL, fill actual team/department details, confirm organizer-only rules/announcements, and perform the final Devpost submission. No public launch or final submission has been performed by the assistant.

No independent applicant testing or user study has been conducted. Lev clarified that the project is built by him with AI assistance and that the partner is not a development or testing dependency. Contributions must be described accurately.

## Final technical check — October 25

The final unit/API suite has 96 passing tests; the browser suite has 15, including the optional follow-up regression and axe checks on the tested screens. The production build succeeds. See evaluation-notes.md for both initial uncertainty failures and the revised six-case development run. This evaluation is not held out. The final video is 135.5 seconds with disclosed synthetic Orus male narration. The local production app/status returned 200, .env was not exposed, and a boolean scan found no configured key in client or publishable files.
