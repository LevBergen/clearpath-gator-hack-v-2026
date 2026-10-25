# What the live development checks showed

These six fictional cases are a development set. They are not independent applicant testing or a held-out benchmark. The questions and expected known/missing details were written before the first inference run, and the fixture hash remained unchanged.

## Initial run

On October 25, six sequential local API calls returned HTTP 200. All 24 declared question spans mapped to returned parts. All 12 known asks had a proposed detail. Ten of the 12 missing asks were blank.

The two other proposals repeated uncertainty from the notes:

- Internship: “I have not decided what I would change next time.”
- Maintenance: “I have no record of previous repair attempts.”

Those excerpts exist, but they do not supply the requested future change or previous-repair information. A source match and a nonempty answer are insufficient evidence that a question has been answered.

## Instruction refinement and rerun

We changed the drafting instruction to distinguish a requested fact from a statement that the fact is unknown, undecided, unconfirmed, unwritten, or unavailable. We also clarified that having no record of an event does not establish that it did not happen. This changes an instruction, not a semantic guarantee enforced by code.

An immediate run coincided with the development server restarting: all six local connection attempts failed before a response. These attempts are retained in the ignored run folder. The runner now checks local readiness before starting and returns a failing process status for unsuccessful HTTP runs.

After verifying that the server was ready, six further sequential model calls returned HTTP 200. All 24 declared spans mapped, all 12 known asks had proposals, and all 12 missing asks were blank. The result describes this run on this development set after prompt refinement; it does not establish a reliability rate or guarantee the same behavior on a new question.

The initial and revised assessments are saved in `evaluation-observations.json`. `coverage-evaluation.md` contains the revised run's case-by-case output and mapping rules. The response is assessed after server validation, so a blank proposal does not by itself prove that the raw model abstained. No semantic correctness score, real-user benefit, or elimination of hallucination is claimed.
