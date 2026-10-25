import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Explicit opt-in only. This script is intentionally separate from npm test.
// It reads no environment variables, dotenv files, keys, or applicant files.
// The default mode validates the declarations without any HTTP requests.
const root = fileURLToPath(new URL("../", import.meta.url));
const casesFile = path.join(root, "scripts/coverage-cases.json");
const reportFile = path.join(root, "submission/coverage-evaluation.md");
const endpoint = "http://127.0.0.1:4173/api/draft";
const fieldId = "response";
const args = process.argv.slice(2);
assert(
  args.length <= 1 &&
    (!args.length || ["--run-live", "--summarize-latest"].includes(args[0])),
  "Use no flag, --run-live, or --summarize-latest.",
);
const fixtureText = await fs.readFile(casesFile, "utf8");
const fixture = JSON.parse(fixtureText);
assert.equal(fixture.fictional, true);
assert.equal(fixture.schemaVersion, 1);
assert.equal(fixture.cases.length, 6);
assert.equal(new Set(fixture.cases.map((item) => item.id)).size, 6);
for (const item of fixture.cases) {
  assert(/^[a-z][a-z-]+$/.test(item.id));
  assert(item.question.length <= 800 && item.notes.length <= 16000);
  assert.equal(item.expected.length, 4);
  assert.equal(new Set(item.expected.map((ask) => ask.id)).size, 4);
  assert.equal(item.expected.filter((ask) => ask.state === "known").length, 2);
  assert.equal(
    item.expected.filter((ask) => ask.state === "missing").length,
    2,
  );
  for (const ask of item.expected) {
    assert(
      item.question.includes(ask.promptSpan),
      "A declared prompt span is absent.",
    );
    assert(ask.state === "known" || ask.state === "missing");
    if (ask.state === "known")
      assert(
        item.notes.includes(ask.notesQuote),
        "A declared known fact is absent.",
      );
    else assert.equal(ask.notesQuote, null);
  }
}
const fixtureSha256 = createHash("sha256").update(fixtureText).digest("hex");
const payloadFor = (item) => ({
  application: {
    id: `eval-${item.id}`,
    title: `Fictional ${item.workflow.toLowerCase()} evaluation`,
    description:
      "Original synthetic evaluation fixture. Not a real application, applicant, or submission.",
    fields: [
      {
        id: fieldId,
        label: item.question,
        plainLanguage: item.question,
        kind: "long",
        required: true,
        maxLength: 1600,
      },
    ],
  },
  sources: [
    { id: "synthetic-notes", name: "Fictional notes", text: item.notes },
  ],
});
const nonblank = (value) => typeof value === "string" && Boolean(value.trim());

function evaluate(item, response) {
  const payload = payloadFor(item);
  const body =
    response.body && typeof response.body === "object" ? response.body : {};
  const parts = Array.isArray(body.coverage?.[fieldId]?.parts)
    ? body.coverage[fieldId].parts
    : [];
  const asks = item.expected.map((ask) => {
    const mapped = parts.filter(
      (part) =>
        typeof part.promptQuote === "string" &&
        part.promptQuote.includes(ask.promptSpan),
    );
    return {
      ...ask,
      mappedPartIds: mapped.map((part) => part.id),
      proposals: mapped.map((part) => ({
        id: part.id,
        value: part.value ?? "",
      })),
      status: !mapped.length
        ? "OMITTED / UNMAPPED"
        : ask.state === "missing"
          ? mapped.every((part) => !nonblank(part.value))
            ? "BLANK"
            : "NONBLANK ON MISSING ASK"
          : mapped.some((part) => nonblank(part.value))
            ? "PROPOSAL PRESENT"
            : "KNOWN DETAIL LEFT BLANK",
    };
  });
  const returned = parts.map((part) => ({
    id: part.id,
    label: part.label,
    promptQuote: part.promptQuote,
    value: part.value ?? "",
    mappedAskIds: asks
      .filter((ask) => ask.mappedPartIds.includes(part.id))
      .map((ask) => ask.id),
    literalPromptMatch:
      typeof part.promptQuote === "string" &&
      item.question.includes(part.promptQuote),
    evidence: part.evidence ?? [],
  }));
  const proposals = [...parts, ...Object.values(body.answers ?? {})].filter(
    (part) => nonblank(part.value),
  );
  const excerptChecks = proposals.map((part) => ({
    valid:
      Array.isArray(part.evidence) &&
      part.evidence.length > 0 &&
      part.evidence.every((evidence) => {
        const source = payload.sources.find(
          (source) => source.id === evidence.sourceId,
        );
        return (
          source &&
          typeof evidence.quote === "string" &&
          evidence.quote.length > 0 &&
          Number.isInteger(evidence.start) &&
          Number.isInteger(evidence.end) &&
          evidence.start >= 0 &&
          evidence.end >= evidence.start &&
          source.text.slice(evidence.start, evidence.end) === evidence.quote
        );
      }),
  }));
  return {
    caseId: item.id,
    httpStatus: response.httpStatus,
    durationMs: response.durationMs,
    transportStatus: response.transportStatus,
    liveResponse:
      response.httpStatus === 200 &&
      body.engine?.available === true &&
      body.engine?.provider !== "exact",
    engine: body.engine ?? null,
    asks,
    returned,
    mainAnswer: body.answers?.[fieldId]?.value ?? "",
    rejectedAnswerCount: Array.isArray(body.rejected)
      ? body.rejected.length
      : 0,
    nonblankProposalCount: proposals.length,
    exactExcerptChecksPassed: excerptChecks.filter((check) => check.valid)
      .length,
    invalidExcerptChecks: excerptChecks.filter((check) => !check.valid).length,
    unexpectedFieldCount: Object.keys(body.coverage ?? {}).filter(
      (id) => id !== fieldId,
    ).length,
  };
}

const safe = (text) =>
  String(text ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " / ");
const quote = (text) => `“${safe(text)}”`;
function totalsFor(results) {
  const asks = results.flatMap((result) => result.asks);
  const parts = results.flatMap((result) => result.returned);
  return {
    callsAttempted: results.length,
    http200: results.filter((result) => result.httpStatus === 200).length,
    liveResponses: results.filter((result) => result.liveResponse).length,
    declaredAsks: asks.length,
    mappedAsks: asks.filter((ask) => ask.mappedPartIds.length).length,
    omittedOrUnmappedAsks: asks.filter((ask) => !ask.mappedPartIds.length)
      .length,
    knownAsks: asks.filter((ask) => ask.state === "known").length,
    knownProposalsPresent: asks.filter(
      (ask) => ask.status === "PROPOSAL PRESENT",
    ).length,
    missingAsks: asks.filter((ask) => ask.state === "missing").length,
    missingAsksMappedBlank: asks.filter((ask) => ask.status === "BLANK").length,
    missingAsksMappedNonblank: asks.filter(
      (ask) => ask.status === "NONBLANK ON MISSING ASK",
    ).length,
    missingAsksUnassessed: asks.filter(
      (ask) => ask.state === "missing" && !ask.mappedPartIds.length,
    ).length,
    returnedParts: parts.length,
    unmappedReturnedParts: parts.filter((part) => !part.mappedAskIds.length)
      .length,
    mergedReturnedParts: parts.filter((part) => part.mappedAskIds.length > 1)
      .length,
    literalPromptMatches: parts.filter((part) => part.literalPromptMatch)
      .length,
    nonblankProposals: results.reduce(
      (sum, result) => sum + result.nonblankProposalCount,
      0,
    ),
    exactExcerptChecksPassed: results.reduce(
      (sum, result) => sum + result.exactExcerptChecksPassed,
      0,
    ),
    invalidExcerptChecks: results.reduce(
      (sum, result) => sum + result.invalidExcerptChecks,
      0,
    ),
    unexpectedCoverageFields: results.reduce(
      (sum, result) => sum + result.unexpectedFieldCount,
      0,
    ),
    rejectedAnswers: results.reduce(
      (sum, result) => sum + result.rejectedAnswerCount,
      0,
    ),
  };
}

function report(declaration, results, totals, directory) {
  const lines = [
    "# Six fictional question-coverage cases",
    "",
    "This is a small, developer-authored evaluation of actual local API responses. It is not a user study, a representative benchmark, a truth check, or a claim of semantic completeness. All questions and notes below are original fictional fixtures. No real applicants, application sites, eligibility decisions, or submissions were involved.",
    "",
    `Declared before the first call: ${declaration.declaredAt}. Fixture SHA-256: \`${declaration.fixtureSha256}\`.`,
    `Endpoint: \`${endpoint}\`. Exactly six sequential POST attempts; no retries. Responses and the timestamped declaration are saved under the Git-ignored \`${path.relative(root, directory)}\`.`,
    "",
    "## Predeclared method",
    "",
    fixture.mappingRule,
    "",
    fixture.detailRule,
    "",
    "Each fixture declares two known asks and two missing asks. The checks use the returned server-validated response, not the model’s raw provider response. The existing server may reject a whole response or remove an unsupported proposal before this script sees it. A returned blank therefore does not establish that the model itself abstained. The script independently checks literal question spans and exact source excerpts/offsets; neither establishes entailment.",
    "",
    "## Observed totals",
    "",
    "| Check | Observed |",
    "| --- | --- |",
    `| HTTP 200 / attempts | ${totals.http200} / ${totals.callsAttempted} |`,
    `| Responses declaring an available non-exact model | ${totals.liveResponses} / ${totals.callsAttempted} |`,
    `| Declared asks mapped by the literal rule | ${totals.mappedAsks} / ${totals.declaredAsks} |`,
    `| Declared asks omitted or unmapped | ${totals.omittedOrUnmappedAsks} |`,
    `| Known asks with a nonblank mapped proposal | ${totals.knownProposalsPresent} / ${totals.knownAsks} |`,
    `| Missing asks mapped to blank proposals | ${totals.missingAsksMappedBlank} / ${totals.missingAsks} |`,
    `| Missing asks mapped to any nonblank proposal | ${totals.missingAsksMappedNonblank} |`,
    `| Missing asks unassessed because omitted/unmapped | ${totals.missingAsksUnassessed} |`,
    `| Returned parts / unmapped parts / merged parts | ${totals.returnedParts} / ${totals.unmappedReturnedParts} / ${totals.mergedReturnedParts} |`,
    `| Returned parts with a literal original-question quote | ${totals.literalPromptMatches} / ${totals.returnedParts} |`,
    `| Nonblank answer/detail proposals with valid exact source excerpts | ${totals.exactExcerptChecksPassed} / ${totals.nonblankProposals} |`,
    `| Invalid exact-excerpt checks / unexpected coverage fields | ${totals.invalidExcerptChecks} / ${totals.unexpectedCoverageFields} |`,
    `| Main-answer proposals reported rejected by the server | ${totals.rejectedAnswers} |`,
    "",
    "| Fictional workflow | HTTP | Declared asks mapped | Known proposals present | Missing asks blank | Unmapped returned parts | Merged returned parts |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const result of results) {
    const item = fixture.cases.find((item) => item.id === result.caseId);
    lines.push(
      `| ${item.workflow} | ${result.httpStatus ?? result.transportStatus} | ${result.asks.filter((ask) => ask.mappedPartIds.length).length}/4 | ${result.asks.filter((ask) => ask.status === "PROPOSAL PRESENT").length}/2 | ${result.asks.filter((ask) => ask.status === "BLANK").length}/2 | ${result.returned.filter((part) => !part.mappedAskIds.length).length} | ${result.returned.filter((part) => part.mappedAskIds.length > 1).length} |`,
    );
  }
  lines.push("", "## Failed blank checks", "");
  const blankDisagreements = results.flatMap((result) =>
    result.asks
      .filter((ask) => ask.status === "NONBLANK ON MISSING ASK")
      .map((ask) => ({ result, ask })),
  );
  if (!blankDisagreements.length)
    lines.push(
      "No mapped missing ask returned a nonblank value in this run. Omitted or unmapped asks, if any, remain unassessed rather than passes.",
    );
  for (const { result, ask } of blankDisagreements) {
    const item = fixture.cases.find((item) => item.id === result.caseId);
    lines.push(
      `- ${item.workflow}, ${quote(ask.promptSpan)}: ${ask.proposals
        .filter((proposal) => nonblank(proposal.value))
        .map((proposal) => quote(proposal.value))
        .join("; ")}`,
    );
  }
  lines.push(
    "",
    "These are failures against the predeclared blank rule, not an automatic fabrication finding. A proposal may quote the notes accurately while stating that the requested fact is still unknown. If the applicant accepts such wording unchanged, a nonempty detail can satisfy the confirmation gate without supplying the requested information. The person must check the wording against the original ask; exact excerpts cannot resolve that question.",
    "",
  );
  lines.push("", "## Every case and disagreement", "");
  for (const result of results) {
    const item = fixture.cases.find((item) => item.id === result.caseId);
    lines.push(
      `### ${item.workflow}`,
      "",
      `Question: ${quote(item.question)}`,
      "",
      `Fictional notes: ${quote(item.notes)}`,
      "",
      `HTTP ${result.httpStatus ?? "unavailable"}; transport status ${result.transportStatus}; ${result.durationMs} ms. Model reported by the server: ${safe(result.engine?.provider ?? "unavailable")} / ${safe(result.engine?.model ?? "unavailable")}.`,
      "",
      "| Predeclared exact question span | Expected from notes | Observed literal mapping | Returned proposed values |",
      "| --- | --- | --- | --- |",
    );
    for (const ask of result.asks) {
      lines.push(
        `| ${quote(ask.promptSpan)} | ${ask.state === "known" ? "Known: " + quote(ask.notesQuote) : "Missing; expected blank"} | ${ask.status}${ask.mappedPartIds.length ? " (" + ask.mappedPartIds.map(safe).join(", ") + ")" : ""} | ${ask.proposals.length ? ask.proposals.map((proposal) => (nonblank(proposal.value) ? quote(proposal.value) : "(blank)")).join("<br>") : "(no mapped part)"} |`,
      );
    }
    lines.push(
      "",
      "All returned coverage parts, including unmapped and merged parts:",
      "",
      "| ID and label | Exact question quote | Declared asks mapped | Proposed value |",
      "| --- | --- | --- | --- |",
    );
    if (!result.returned.length) lines.push("| (none) | — | — | — |");
    for (const part of result.returned)
      lines.push(
        `| ${safe(part.id)}: ${safe(part.label)} | ${quote(part.promptQuote)} | ${part.mappedAskIds.length ? part.mappedAskIds.map(safe).join(", ") : "UNMAPPED"} | ${nonblank(part.value) ? quote(part.value) : "(blank)"} |`,
      );
    lines.push(
      "",
      `Returned main draft: ${nonblank(result.mainAnswer) ? quote(result.mainAnswer) : "(none)"}`,
      "",
    );
  }
  lines.push(
    "## Limitations and reproduction",
    "",
    "- Six short, clearly structured questions were authored by the developer/assistant rather than sampled from real use. The notes deliberately contain two known and two missing details; this is a narrow, favorable test distribution.",
    "- There is one attempt per case within this run. Earlier development runs and prompt changes are recorded in evaluation-notes.md. This is a development set, not a held-out evaluation. Model outputs can vary; these counts do not estimate real-world accuracy or reliability.",
    "- The exact-span rule can leave a semantically related shorter quotation unmapped. Conversely, a broad quote may map multiple asks while its proposed value answers only one. Both are displayed above; neither is silently treated as semantic success.",
    "- A nonblank value mapped to a missing ask is a failed blank check, not automatic proof of a fabricated fact. It may restate uncertainty or belong to another ask inside a merged part. Read the proposed wording before drawing conclusions.",
    "- Known-proposal presence does not grade correctness. Exact source excerpts/offsets establish presence only; they do not establish that every proposed fact follows from the excerpt. No semantic or truth-checking score is produced.",
    "- HTTP success and available model metadata identify the application’s provider path. This script does not inspect provider credentials or independently audit the provider. No model calls are part of npm test.",
    "",
    "Validate declarations without network access: `node scripts/evaluate-coverage.mjs`.",
    "",
    "Explicitly rerun six live local calls, only when authorized and the server is running: `node scripts/evaluate-coverage.mjs --run-live`. This creates a new ignored result directory and replaces this summary. It makes no retries and does not change the application or provider configuration.",
    "",
    "Regenerate this summary from the latest saved run, without model calls: `node scripts/evaluate-coverage.mjs --summarize-latest`.",
    "",
  );
  return lines.join("\n");
}

if (!args.length) {
  console.log(
    JSON.stringify({
      status: "declarations-valid",
      cases: fixture.cases.length,
      declaredAsks: fixture.cases.reduce(
        (sum, item) => sum + item.expected.length,
        0,
      ),
      knownAsks: 12,
      missingAsks: 12,
      networkCalls: 0,
    }),
  );
} else {
  const buildRoot = path.join(root, "submission/.build/coverage-evaluation");
  let directory;
  let declaration;
  let responses;
  if (args[0] === "--summarize-latest") {
    const latest = JSON.parse(
      await fs.readFile(path.join(buildRoot, "latest.json"), "utf8"),
    );
    assert(/^[0-9TZ-]+$/.test(latest.runId));
    directory = path.join(buildRoot, latest.runId);
    declaration = JSON.parse(
      await fs.readFile(path.join(directory, "declaration.json"), "utf8"),
    );
    assert.equal(
      declaration.fixtureSha256,
      fixtureSha256,
      "The fixtures changed after the recorded run; refusing to re-score.",
    );
    responses = await Promise.all(
      fixture.cases.map((item) =>
        fs
          .readFile(path.join(directory, `${item.id}.json`), "utf8")
          .then(JSON.parse),
      ),
    );
  } else {
    const health = await fetch("http://127.0.0.1:4173/api/status", {
      signal: AbortSignal.timeout(5000),
    });
    assert(
      health.ok && (await health.json()).available,
      "Start the app with live AI available before running this explicit evaluation.",
    );
    const declaredAt = new Date().toISOString();
    const runId = declaredAt.replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
    directory = path.join(buildRoot, runId);
    await fs.mkdir(directory, { recursive: true });
    declaration = {
      declaredAt,
      fixtureSha256,
      endpoint,
      mappingRule: fixture.mappingRule,
      detailRule: fixture.detailRule,
      fixture,
    };
    // This complete declaration is written before the first authorized call.
    await fs.writeFile(
      path.join(directory, "declaration.json"),
      JSON.stringify(declaration, null, 2) + "\n",
      { flag: "wx" },
    );
    responses = [];
    for (let index = 0; index < fixture.cases.length; index++) {
      const item = fixture.cases[index];
      const began = Date.now();
      const response = {
        caseId: item.id,
        requestedAt: new Date().toISOString(),
        httpStatus: null,
        transportStatus: "not-started",
        durationMs: 0,
        body: null,
        rawText: null,
      };
      try {
        const http = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFor(item)),
          signal: AbortSignal.timeout(120000),
          redirect: "error",
        });
        response.httpStatus = http.status;
        response.rawText = await http.text();
        try {
          response.body = JSON.parse(response.rawText);
          response.transportStatus = "json-response";
        } catch {
          response.transportStatus = "non-json-response";
        }
      } catch (error) {
        // Safe category only. Never print arbitrary provider/error contents.
        response.transportStatus =
          error?.name === "TimeoutError" ? "timeout" : "request-failed";
      }
      response.durationMs = Date.now() - began;
      await fs.writeFile(
        path.join(directory, `${item.id}.json`),
        JSON.stringify(response, null, 2) + "\n",
      );
      responses.push(response);
      const assessed = evaluate(item, response);
      console.log(
        JSON.stringify({
          caseNumber: index + 1,
          caseCount: fixture.cases.length,
          httpStatus: response.httpStatus,
          transportStatus: response.transportStatus,
          mappedAsks: assessed.asks.filter((ask) => ask.mappedPartIds.length)
            .length,
          declaredAsks: item.expected.length,
          missingAsksBlank: assessed.asks.filter(
            (ask) => ask.status === "BLANK",
          ).length,
          declaredMissingAsks: 2,
        }),
      );
    }
    await fs.writeFile(
      path.join(buildRoot, "latest.json"),
      JSON.stringify({ runId }, null, 2) + "\n",
    );
  }
  const results = fixture.cases.map((item, index) =>
    evaluate(item, responses[index]),
  );
  const totals = totalsFor(results);
  await fs.writeFile(
    path.join(directory, "assessment.json"),
    JSON.stringify({ fixtureSha256, totals, results }, null, 2) + "\n",
  );
  await fs.writeFile(
    reportFile,
    report(declaration, results, totals, directory),
  );
  console.log(
    JSON.stringify({
      status: "evaluation-recorded",
      ...totals,
      networkCallsThisInvocation: args[0] === "--run-live" ? 6 : 0,
    }),
  );
  if (totals.http200 !== totals.callsAttempted) process.exitCode = 1;
}
