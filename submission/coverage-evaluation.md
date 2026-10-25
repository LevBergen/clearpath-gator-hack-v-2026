# Six fictional question-coverage cases

This is a small, developer-authored evaluation of actual local API responses. It is not a user study, a representative benchmark, a truth check, or a claim of semantic completeness. All questions and notes below are original fictional fixtures. No real applicants, application sites, eligibility decisions, or submissions were involved.

Declared before the first call: 2026-10-25T07:41:47.376Z. Fixture SHA-256: `7b901f8a702b85081e2eb6d4cd3464d5ff583ef8a65284ca9e622a729daaa25c`.
Endpoint: `http://127.0.0.1:4173/api/draft`. Exactly six sequential POST attempts; no retries. Responses and the timestamped declaration are saved under the Git-ignored `submission/.build/coverage-evaluation/2026-10-25T07-41-47Z`.

## Predeclared method

A returned coverage part maps to an expected ask only when its promptQuote contains the entire declared promptSpan as a case-sensitive literal substring. No paraphrase or semantic matching is performed. A returned part can map to multiple asks; such merges are reported separately.

For a mapped known ask, count whether any returned mapped part has a nonempty proposed value; this does not check correctness. For a mapped missing ask, require every mapped value to be empty. Omitted or unmapped missing asks are unassessed, never passes. A nonempty part spanning both known and missing asks is flagged without claiming which fact the value asserts.

Each fixture declares two known asks and two missing asks. The checks use the returned server-validated response, not the model’s raw provider response. The existing server may reject a whole response or remove an unsupported proposal before this script sees it. A returned blank therefore does not establish that the model itself abstained. The script independently checks literal question spans and exact source excerpts/offsets; neither establishes entailment.

## Observed totals

| Check                                                             | Observed   |
| ----------------------------------------------------------------- | ---------- |
| HTTP 200 / attempts                                               | 6 / 6      |
| Responses declaring an available non-exact model                  | 6 / 6      |
| Declared asks mapped by the literal rule                          | 24 / 24    |
| Declared asks omitted or unmapped                                 | 0          |
| Known asks with a nonblank mapped proposal                        | 12 / 12    |
| Missing asks mapped to blank proposals                            | 12 / 12    |
| Missing asks mapped to any nonblank proposal                      | 0          |
| Missing asks unassessed because omitted/unmapped                  | 0          |
| Returned parts / unmapped parts / merged parts                    | 24 / 0 / 0 |
| Returned parts with a literal original-question quote             | 24 / 24    |
| Nonblank answer/detail proposals with valid exact source excerpts | 17 / 17    |
| Invalid exact-excerpt checks / unexpected coverage fields         | 0 / 0      |
| Main-answer proposals reported rejected by the server             | 0          |

| Fictional workflow      | HTTP | Declared asks mapped | Known proposals present | Missing asks blank | Unmapped returned parts | Merged returned parts |
| ----------------------- | ---- | -------------------- | ----------------------- | ------------------ | ----------------------- | --------------------- |
| Equipment request       | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |
| Volunteer availability  | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |
| Internship project      | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |
| Maintenance request     | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |
| Community event request | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |
| Student support         | 200  | 4/4                  | 2/2                     | 2/2                | 0                       | 0                     |

## Failed blank checks

No mapped missing ask returned a nonblank value in this run. Omitted or unmapped asks, if any, remain unassessed rather than passes.

These are failures against the predeclared blank rule, not an automatic fabrication finding. A proposal may quote the notes accurately while stating that the requested fact is still unknown. If the applicant accepts such wording unchanged, a nonempty detail can satisfy the confirmation gate without supplying the requested information. The person must check the wording against the original ask; exact excerpts cannot resolve that question.

## Every case and disagreement

### Equipment request

Question: “Describe the equipment you need, what you will use it for, when you need to collect it, and when you can return it.”

Fictional notes: “I need a portable projector. I will use it to display a campus map during our fictional club orientation. The collection time has not been decided. The return time is not recorded.”

HTTP 200; transport status json-response; 12063 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span | Expected from notes                                                                   | Observed literal mapping  | Returned proposed values                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- |
| “the equipment you need”        | Known: “I need a portable projector.”                                                 | PROPOSAL PRESENT (part-1) | “a portable projector”                                          |
| “what you will use it for”      | Known: “I will use it to display a campus map during our fictional club orientation.” | PROPOSAL PRESENT (part-2) | “to display a campus map during our fictional club orientation” |
| “when you need to collect it”   | Missing; expected blank                                                               | BLANK (part-3)            | (blank)                                                         |
| “when you can return it”        | Missing; expected blank                                                               | BLANK (part-4)            | (blank)                                                         |

All returned coverage parts, including unmapped and merged parts:

| ID and label             | Exact question quote              | Declared asks mapped | Proposed value                                                  |
| ------------------------ | --------------------------------- | -------------------- | --------------------------------------------------------------- |
| part-1: equipment needed | “Describe the equipment you need” | equipment            | “a portable projector”                                          |
| part-2: intended use     | “what you will use it for”        | purpose              | “to display a campus map during our fictional club orientation” |
| part-3: collection time  | “when you need to collect it”     | collection           | (blank)                                                         |
| part-4: return time      | “when you can return it”          | return               | (blank)                                                         |

Returned main draft: “I need a portable projector. I will use it to display a campus map during our fictional club orientation.”

### Volunteer availability

Question: “Tell us which shifts you can cover, the tasks you are comfortable doing, whether you can lift supply boxes, and your transport plan.”

Fictional notes: “I can cover Saturday morning and Sunday afternoon. I am comfortable greeting visitors and checking names on a signup list. My notes contain no information about lifting limits or how I will travel to the venue.”

HTTP 200; transport status json-response; 12103 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span       | Expected from notes                                                              | Observed literal mapping  | Returned proposed values                                |
| ------------------------------------- | -------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------- |
| “which shifts you can cover”          | Known: “I can cover Saturday morning and Sunday afternoon.”                      | PROPOSAL PRESENT (part-1) | “Saturday morning and Sunday afternoon”                 |
| “the tasks you are comfortable doing” | Known: “I am comfortable greeting visitors and checking names on a signup list.” | PROPOSAL PRESENT (part-2) | “greeting visitors and checking names on a signup list” |
| “whether you can lift supply boxes”   | Missing; expected blank                                                          | BLANK (part-3)            | (blank)                                                 |
| “your transport plan”                 | Missing; expected blank                                                          | BLANK (part-4)            | (blank)                                                 |

All returned coverage parts, including unmapped and merged parts:

| ID and label      | Exact question quote                  | Declared asks mapped | Proposed value                                          |
| ----------------- | ------------------------------------- | -------------------- | ------------------------------------------------------- |
| part-1: shifts    | “Tell us which shifts you can cover”  | shifts               | “Saturday morning and Sunday afternoon”                 |
| part-2: tasks     | “the tasks you are comfortable doing” | tasks                | “greeting visitors and checking names on a signup list” |
| part-3: lifting   | “whether you can lift supply boxes”   | lifting              | (blank)                                                 |
| part-4: transport | “and your transport plan”             | transport            | (blank)                                                 |

Returned main draft: “I can cover Saturday morning and Sunday afternoon. I am comfortable greeting visitors and checking names on a signup list.”

### Internship project

Question: “Describe one project you contributed to, your own contribution, a measurable result, and what you would change next time.”

Fictional notes: “For a class, I helped build a library-room occupancy display. My contribution was writing the CSV import routine and documenting its columns. We did not record usage or time savings. I have not decided what I would change next time.”

HTTP 200; transport status json-response; 12127 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span   | Expected from notes                                                                      | Observed literal mapping  | Returned proposed values                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| “one project you contributed to”  | Known: “For a class, I helped build a library-room occupancy display.”                   | PROPOSAL PRESENT (part-1) | “a library-room occupancy display”                           |
| “your own contribution”           | Known: “My contribution was writing the CSV import routine and documenting its columns.” | PROPOSAL PRESENT (part-2) | “writing the CSV import routine and documenting its columns” |
| “a measurable result”             | Missing; expected blank                                                                  | BLANK (part-3)            | (blank)                                                      |
| “what you would change next time” | Missing; expected blank                                                                  | BLANK (part-4)            | (blank)                                                      |

All returned coverage parts, including unmapped and merged parts:

| ID and label         | Exact question quote                      | Declared asks mapped | Proposed value                                               |
| -------------------- | ----------------------------------------- | -------------------- | ------------------------------------------------------------ |
| part-1: project      | “Describe one project you contributed to” | project              | “a library-room occupancy display”                           |
| part-2: contribution | “your own contribution”                   | contribution         | “writing the CSV import routine and documenting its columns” |
| part-3: result       | “a measurable result”                     | result               | (blank)                                                      |
| part-4: changes      | “what you would change next time”         | change               | (blank)                                                      |

Returned main draft: “For a class, I helped build a library-room occupancy display. My contribution was writing the CSV import routine and documenting its columns.”

### Maintenance request

Question: “Explain what needs repair, where it is located, when someone can enter, and whether anyone has already tried a repair.”

Fictional notes: “The wall-mounted shelf is loose in our fictional shared workshop. It is beside the north window. I do not know when the room can be opened for a repair visit. I have no record of previous repair attempts.”

HTTP 200; transport status json-response; 11730 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span             | Expected from notes                                                        | Observed literal mapping  | Returned proposed values                                           |
| ------------------------------------------- | -------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| “what needs repair”                         | Known: “The wall-mounted shelf is loose in our fictional shared workshop.” | PROPOSAL PRESENT (part-1) | “The wall-mounted shelf is loose”                                  |
| “where it is located”                       | Known: “It is beside the north window.”                                    | PROPOSAL PRESENT (part-2) | “in our fictional shared workshop. It is beside the north window.” |
| “when someone can enter”                    | Missing; expected blank                                                    | BLANK (part-3)            | (blank)                                                            |
| “whether anyone has already tried a repair” | Missing; expected blank                                                    | BLANK (part-4)            | (blank)                                                            |

All returned coverage parts, including unmapped and merged parts:

| ID and label               | Exact question quote                        | Declared asks mapped | Proposed value                                                     |
| -------------------------- | ------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| part-1: repair description | “Explain what needs repair”                 | repair               | “The wall-mounted shelf is loose”                                  |
| part-2: location           | “where it is located”                       | location             | “in our fictional shared workshop. It is beside the north window.” |
| part-3: entry time         | “when someone can enter”                    | entry                | (blank)                                                            |
| part-4: previous repair    | “whether anyone has already tried a repair” | previous-repair      | (blank)                                                            |

Returned main draft: “The wall-mounted shelf is loose in our fictional shared workshop. It is beside the north window.”

### Community event request

Question: “Describe the activity you want to run, the intended audience, your expected attendance, and your requested date.”

Fictional notes: “Our fictional neighborhood group would like to run a seed-swap afternoon. The intended audience is residents who are beginning home gardeners. We have not estimated attendance or chosen a date.”

HTTP 200; transport status json-response; 9720 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span | Expected from notes                                                                | Observed literal mapping  | Returned proposed values                                               |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| “the activity you want to run”  | Known: “Our fictional neighborhood group would like to run a seed-swap afternoon.” | PROPOSAL PRESENT (part-1) | “I would like to run a seed-swap afternoon.”                           |
| “the intended audience”         | Known: “The intended audience is residents who are beginning home gardeners.”      | PROPOSAL PRESENT (part-2) | “The intended audience is residents who are beginning home gardeners.” |
| “your expected attendance”      | Missing; expected blank                                                            | BLANK (part-3)            | (blank)                                                                |
| “your requested date”           | Missing; expected blank                                                            | BLANK (part-4)            | (blank)                                                                |

All returned coverage parts, including unmapped and merged parts:

| ID and label       | Exact question quote                    | Declared asks mapped | Proposed value                                                         |
| ------------------ | --------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| part-1: activity   | “Describe the activity you want to run” | activity             | “I would like to run a seed-swap afternoon.”                           |
| part-2: audience   | “the intended audience”                 | audience             | “The intended audience is residents who are beginning home gardeners.” |
| part-3: attendance | “your expected attendance”              | attendance           | (blank)                                                                |
| part-4: date       | “your requested date”                   | date                 | (blank)                                                                |

Returned main draft: (none)

### Student support

Question: “Describe the difficulty you are experiencing, how it affects your coursework, the specific support you are requesting, and other help you have already tried.”

Fictional notes: “The desk lamp in my shared study area stopped working. I can no longer read printed diagrams there during evening coursework. I have not chosen what support to request. I have not written down whether I tried any other help.”

HTTP 200; transport status json-response; 12501 ms. Model reported by the server: google / gemma-4-26b-a4b-it.

| Predeclared exact question span           | Expected from notes                                                             | Observed literal mapping  | Returned proposed values                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| “the difficulty you are experiencing”     | Known: “The desk lamp in my shared study area stopped working.”                 | PROPOSAL PRESENT (part-1) | “The desk lamp in my shared study area stopped working.”                 |
| “how it affects your coursework”          | Known: “I can no longer read printed diagrams there during evening coursework.” | PROPOSAL PRESENT (part-2) | “I can no longer read printed diagrams there during evening coursework.” |
| “the specific support you are requesting” | Missing; expected blank                                                         | BLANK (part-3)            | (blank)                                                                  |
| “other help you have already tried”       | Missing; expected blank                                                         | BLANK (part-4)            | (blank)                                                                  |

All returned coverage parts, including unmapped and merged parts:

| ID and label              | Exact question quote                           | Declared asks mapped | Proposed value                                                           |
| ------------------------- | ---------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| part-1: difficulty        | “Describe the difficulty you are experiencing” | difficulty           | “The desk lamp in my shared study area stopped working.”                 |
| part-2: coursework effect | “how it affects your coursework”               | impact               | “I can no longer read printed diagrams there during evening coursework.” |
| part-3: support requested | “the specific support you are requesting”      | support              | (blank)                                                                  |
| part-4: help tried        | “and other help you have already tried”        | other-help           | (blank)                                                                  |

Returned main draft: “The desk lamp in my shared study area stopped working. I can no longer read printed diagrams there during evening coursework.”

## Limitations and reproduction

- Six short, clearly structured questions were authored by the developer/assistant rather than sampled from real use. The notes deliberately contain two known and two missing details; this is a narrow, favorable test distribution.
- There is one attempt per case within this run. Earlier development runs and prompt changes are recorded in evaluation-notes.md. This is a development set, not a held-out evaluation. Model outputs can vary; these counts do not estimate real-world accuracy or reliability.
- The exact-span rule can leave a semantically related shorter quotation unmapped. Conversely, a broad quote may map multiple asks while its proposed value answers only one. Both are displayed above; neither is silently treated as semantic success.
- A nonblank value mapped to a missing ask is a failed blank check, not automatic proof of a fabricated fact. It may restate uncertainty or belong to another ask inside a merged part. Read the proposed wording before drawing conclusions.
- Known-proposal presence does not grade correctness. Exact source excerpts/offsets establish presence only; they do not establish that every proposed fact follows from the excerpt. No semantic or truth-checking score is produced.
- HTTP success and available model metadata identify the application’s provider path. This script does not inspect provider credentials or independently audit the provider. No model calls are part of npm test.

Validate declarations without network access: `node scripts/evaluate-coverage.mjs`.

Explicitly rerun six live local calls, only when authorized and the server is running: `node scripts/evaluate-coverage.mjs --run-live`. This creates a new ignored result directory and replaces this summary. It makes no retries and does not change the application or provider configuration.

Regenerate this summary from the latest saved run, without model calls: `node scripts/evaluate-coverage.mjs --summarize-latest`.
