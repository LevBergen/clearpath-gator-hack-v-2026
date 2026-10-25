# Submission fields

## Project name

Clearpath

## Elevator pitch

Turn confusing application questions into clear steps, draft answers from your own notes, and review the evidence before you export.

## About the project

### Inspiration

A form can ask for something simple in language that makes it feel impossible. For someone already dealing with a broken laptop, a work shift, or a stressful deadline, that extra barrier matters. We wanted the next step to feel understandable and manageable.

### What it does

Clearpath turns a text application into a guided workspace. It keeps the original question visible, offers a plain-English guide, and drafts from information the applicant supplies. Each generated answer includes source excerpts that the application checks against those notes.

If a fact is missing, the space stays open. In our fictional student-support example, Maya has explained why she needs a working laptop but has not confirmed a replacement price. Clearpath drafts her circumstances and study plan while leaving the requested amount unanswered.

Applicants can edit answers, use read-aloud, work one question at a time, save an unfinished workspace locally, and resume later. A reviewed text packet becomes downloadable only after required answers are complete and every completed answer has been reviewed. Clearpath does not submit applications.

### How we built it

The prototype was written from scratch during the event with AI coding assistance. It uses React, TypeScript, Vite, Express, and shared Zod validation. Pure domain functions handle evidence checks, field validation, review state, and export.

The model is **Gemma 4 `gemma-4-26b-a4b-it`**, called through the Gemini API. It proposes answers and plain-language question guides; application code checks exact excerpt matches and validates scalar values. The model cannot approve a review, execute tools, or submit a form. Keys stay on the server.

### Challenges

A valid source quote is not the same as a true answer. We made that distinction explicit and kept the human review gate. We also had to prevent old model results from overwriting newer edits, preserve notes during asynchronous file imports, and distinguish authored sample drafts from real inference.

A live integration test exposed latency from Gemma's default thinking behavior. We used the documented minimal-thinking configuration for this bounded drafting task and exercised the full application again successfully.

### Accomplishments

The complete local workflow runs from imported questions to a reviewed download. The live Gemma example produced five sourced answers and seven question guides while leaving the unknown amount blank. Automated domain, API, browser, and accessibility checks accompany the implementation.

### What we learned

Useful AI assistance includes knowing when to leave a blank. Showing the original question, supporting excerpts, and an editable draft together makes it easier to inspect the output than a chat transcript alone.

### What's next

Test with actual applicants and campus support staff, measure whether the guides preserve every requirement, add carefully reviewed PDF/image import, and evaluate multilingual explanations. We have not run a user study or established an improvement in completion rates.

### Current limits

This prototype accepts text questions and text/Markdown notes. It does not establish eligibility, verify facts, discover funding opportunities, fill arbitrary websites, or submit anything. Excerpt checks do not prove that a model interpreted the source correctly. Human review is required. The example applicant and support fund are fictional. Google receives notes when AI drafting is requested.

## Built with

TypeScript, React, Vite, Express, Gemma, Gemini API, Zod, Vitest, Playwright, axe-core

## Try it out links

Add the actual public code repository and deployed demo URL after publication. Do not submit a localhost URL.

## Prize selections

- Main awards.
- Best Use of Gemma: model is named above and live inference has been exercised.
- Best Open Source Project: select only after the public repository includes LICENSE.
- Vobile: confirm any opening-ceremony challenge requirements before selecting.
- Twinly: not selected; Twinly has not been integrated.

## Owner completion

Add the real registered partner and correct school/department details. Confirm the two-department rule and AI-assistance policy with the event. Add actual YouTube/Vimeo demo URL after upload. Final Devpost submission is the owner's action.
