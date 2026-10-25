# Submission fields

## Project name

Clearpath

## Elevator pitch

A good paragraph can miss part of the question. Clearpath helps you spot the gaps, add your own details, and review the answer before you use it.

## About the project

### Inspiration

“Describe the unexpected expense and how it affects your coursework. Include the amount you are requesting and any other financial help you have already tried.”

That is one application question with four things to answer. A paragraph about a broken laptop can sound complete while leaving out the amount and other help tried. I built Clearpath to help applicants catch that omission.

### What it does

Clearpath keeps the original question visible and suggests its separate parts, each linked to words in the question. The applicant checks that breakdown, confirms details drawn from their notes, and answers focused follow-ups where information is missing.

In the fictional demo, Maya's notes explain her laptop failure and the effect on coursework. The amount and other help tried stay open for her to supply. Clearpath joins the details she confirms into an editable answer. She reviews the final wording before downloading a text packet.

People can bring their own text forms, use read-aloud, and save unfinished work locally without an account. Clearpath does not submit applications.

### How I built it

I built Clearpath from scratch during Gator Hack V with Codex assistance in product exploration, implementation, debugging, and tests.

The React and TypeScript interface connects to an Express server that calls **Gemma 4 `gemma-4-26b-a4b-it`** through the Gemini API. Gemma proposes question breakdowns and drafts from supplied notes. The app checks quoted text against those notes and the original question. Building the answer joins confirmed details without another generation step.

The sample begins with labeled illustrations so it can be explored immediately. The drafting button calls the real model.

### Challenges

A real quote can still be used to support the wrong claim. A breakdown can also quote the question while missing an important qualifier. Checking that text is present cannot establish truth or completeness. Keeping the original wording visible gives the applicant something concrete to check at each step.

Edits and saved work raised another problem: an old review should not approve new wording. Editing an answer or restoring a workspace resets its confirmations.

### Accomplishments

The flow works from rough notes through follow-ups to a reviewed download. A live Gemma run produced four parts for the demo question and left the two unknown details open. Automated domain, API, and browser checks cover edits, review, export, and save/resume.

### What I learned

Asking “What other help have you tried?” can be more useful than polishing the paragraph again. It gives the applicant a next step that answers the original question.

### What's next

Test with applicants and support staff: do they notice omissions, do the guides preserve qualifiers, and where does the app add work? No applicant study has been conducted yet.

The prototype takes text forms and notes; PDF/image import can follow that testing. It does not verify facts or determine eligibility.

The fictional exercise draws on public [University of Minnesota emergency-funding instructions](https://onestop.umn.edu/finances/types-financial-aid/student-emergency-funds) and the [University of Florida Aid-a-Gator overview](https://www.sfa.ufl.edu/aidagator/), without institutional affiliation. AI drafting sends the form and notes to Google.

## Built with

TypeScript, React, Vite, Express, Gemma, Gemini API, Zod, Vitest, Playwright, axe-core

## Links and media to add in Devpost

Use the actual public repository, deployed app, and YouTube/Vimeo video links after publication. Add the thumbnail and gallery images from `submission/`. Check that the video plays and meets the three-minute limit. The replacement narration uses Gemini 3.8 with the Orus male voice; disclose that it is synthetic.

## Owner completion notes — not part of the project story

Aim to finish before **11 AM Eastern on Sunday, October 25, 2026**. The official deadline is **5 PM Eastern**.

Enter the real registered participants and their school/department details. The build described here is Lev's work with AI assistance; do not attribute development or testing to a partner who did not do it. Confirm the event's two-department requirement, AI-assistance policy, and any opening-ceremony challenge requirements.

Consider Main awards and Best Use of Gemma. Select Best Open Source Project after publishing the repository with its MIT license. Confirm Vobile's requirements before selecting it. Twinly is not integrated. Lev performs the final publication and Devpost submission.
