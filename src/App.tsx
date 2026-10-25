import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  Leaf,
  LoaderCircle,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Landing } from "./components/Landing";
import { Modal } from "./components/Modal";
import { FieldEditor } from "./components/FieldEditor";
import { EvidencePanel } from "./components/EvidencePanel";
import { ContextEditor } from "./components/ContextEditor";
import {
  sampleApplication,
  sampleIllustration,
  sampleSources,
} from "./core/sample";
import { parseForm } from "./core/form";
import { validateSuggestions } from "./core/evidence";
import {
  canExport,
  editAnswer,
  exportPacket,
  fieldError,
} from "./core/workspace";
import { serializeWorkspace, restoreWorkspace } from "./core/save";
import type {
  Application,
  Answers,
  DraftResult,
  Engine,
  Source,
} from "./core/types";
import "./styles.css";

type ModalName = "import" | "context" | "about" | "connection" | "reset" | null;
type Stage = "draft" | "guide" | "review";

export default function App() {
  const [application, setApplication] = useState<Application | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState<Stage>("draft");
  const [modal, setModal] = useState<ModalName>(null);
  const [engine, setEngine] = useState<Engine>({
    provider: "exact",
    model: "Exact matches",
    available: false,
  });
  const [illustration, setIllustration] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const requestRevision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const fieldHeading = useRef<HTMLDivElement>(null);
  const resumeInput = useRef<HTMLInputElement>(null);

  const refreshEngine = () =>
    fetch("/api/status")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setEngine)
      .catch(() =>
        setMessage(
          "The drafting service is unavailable. You can still answer and review questions.",
        ),
      );
  useEffect(() => {
    void refreshEngine();
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 7000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function cancelDraft() {
    requestRevision.current++;
    controller.current?.abort();
    setBusy(false);
  }
  function start(app: Application, context: Source[], sample = false) {
    cancelDraft();
    setApplication(app);
    setSources(context);
    setStage("draft");
    setSelected(sample ? 3 : 0);
    setModal(null);
    setError("");
    setReviewing(false);
    setIllustration(sample);
    if (sample) {
      const result = validateSuggestions(app, context, sampleIllustration);
      setAnswers(
        Object.fromEntries(
          Object.entries(result.answers).map(([key, value]) => [
            key,
            { ...value, origin: "example" as const },
          ]),
        ),
      );
    } else setAnswers({});
    window.scrollTo({ top: 0 });
  }
  function select(index: number, focus = false) {
    setSelected(index);
    if (focus) requestAnimationFrame(() => fieldHeading.current?.focus());
  }
  function updateAnswer(value: string) {
    if (!application) return;
    cancelDraft();
    const field = application.fields[selected];
    setAnswers((previous) => ({
      ...previous,
      [field.id]: editAnswer(
        previous[field.id] ?? {
          fieldId: field.id,
          value: "",
          origin: "person",
          reviewed: false,
          evidence: [],
        },
        value,
      ),
    }));
  }
  async function draft() {
    if (!application) return;
    if (!sources.some((s) => s.text.trim())) {
      setModal("context");
      setMessage(
        "Add a few details first so Clearpath has something to work from.",
      );
      return;
    }
    cancelDraft();
    const revision = requestRevision.current;
    controller.current = new AbortController();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application, sources }),
        signal: controller.current.signal,
      });
      const result = (await response.json()) as DraftResult & {
        engine: Engine;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "The draft could not be prepared.");
      if (revision !== requestRevision.current) return;
      const count = Object.keys(result.answers).length;
      // Explicitly entered answers survive regeneration; all refreshed drafts need review.
      setAnswers((previous) => ({
        ...result.answers,
        ...Object.fromEntries(
          Object.entries(previous).filter(
            ([, value]) => value.origin === "person" && value.value.trim(),
          ),
        ),
      }));
      setEngine(result.engine);
      setIllustration(false);
      setReviewing(false);
      if (result.guides)
        setApplication((previous) =>
          previous
            ? {
                ...previous,
                fields: previous.fields.map((f) => ({
                  ...f,
                  plainLanguage: result.guides?.[f.id] || f.plainLanguage,
                })),
              }
            : previous,
        );
      const first = application.fields.findIndex((f) => result.answers[f.id]);
      if (first >= 0) select(first);
      setMessage(
        `${count} ${count === 1 ? "draft" : "drafts"} prepared${result.engine.provider === "exact" ? " from exact labeled matches" : ` with ${result.engine.model}`}. ${result.rejected.length ? `${result.rejected.length} unsupported drafts left out. ` : ""}Review each answer before you use it.`,
      );
    } catch (cause) {
      if (cause instanceof Error && cause.name !== "AbortError")
        setError(cause.message);
    } finally {
      if (revision === requestRevision.current) setBusy(false);
    }
  }
  function approve() {
    if (!application) return;
    const field = application.fields[selected];
    const current = answers[field.id];
    if (!current || fieldError(field, current.value)) return;
    const next = { ...answers, [field.id]: { ...current, reviewed: true } };
    setAnswers(next);
    const index = application.fields.findIndex(
      (f) => next[f.id]?.value.trim() && !next[f.id].reviewed,
    );
    if (index >= 0) select(index, true);
    else {
      setReviewing(false);
      setMessage("Every completed answer has been reviewed.");
    }
  }
  function beginReview() {
    if (!application) return;
    const index = application.fields.findIndex(
      (f) => answers[f.id]?.value.trim() && !answers[f.id].reviewed,
    );
    if (index >= 0) {
      setSelected(index);
      setReviewing(true);
    } else setMessage("Every completed answer has already been reviewed.");
  }
  function download() {
    if (!application || !canExport(application, answers)) return;
    const blob = new Blob([exportPacket(application, answers)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      application.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "application"
    }-reviewed-draft.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Downloaded to your device. This application has not been submitted.",
    );
  }
  function saveWorkspace() {
    if (!application) return;
    const blob = new Blob([serializeWorkspace(application, sources, answers)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-workspace.clearpath.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Workspace saved to your device, including unfinished answers and notes. Keep this personal file private.",
    );
  }
  async function resumeWorkspace(file?: File) {
    if (!file) return;
    const revision = requestRevision.current;
    try {
      if (file.size > 4000000) throw new Error("File is too large");
      const restored = restoreWorkspace(await file.text());
      if (revision !== requestRevision.current) return;
      start(restored.application, restored.sources);
      setAnswers(restored.answers);
      setIllustration(
        Object.values(restored.answers).some((a) => a.origin === "example"),
      );
      setMessage(
        "Workspace restored. Review your saved answers again before exporting.",
      );
    } catch {
      setMessage(
        "This file could not be restored. Choose a workspace JSON file saved by Clearpath.",
      );
    } finally {
      if (resumeInput.current) resumeInput.current.value = "";
    }
  }
  function speak() {
    if (!application) return;
    if (!("speechSynthesis" in window)) {
      setMessage(
        "Read-aloud is unavailable in this browser. The full question is on screen.",
      );
      return;
    }
    const field = application.fields[selected];
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${field.plainLanguage} ${answers[field.id]?.value || ""}`,
    );
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  const field = application?.fields[selected];
  const required = application?.fields.filter((f) => f.required) ?? [];
  const ready = required.filter(
    (f) => !fieldError(f, answers[f.id]?.value || ""),
  ).length;
  const missing = required.length - ready;
  const completed =
    application?.fields.filter((f) => answers[f.id]?.value.trim()) ?? [];
  const reviewed = completed.filter((f) => answers[f.id]?.reviewed).length;
  const exportReady = application ? canExport(application, answers) : false;

  return (
    <>
      <div className="app" inert={modal !== null}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header
          className={`site-header ${application ? "workspace-header" : ""}`}
        >
          <button
            className="brand"
            aria-label="Clearpath home"
            onClick={() =>
              application ? setModal("reset") : window.scrollTo({ top: 0 })
            }
          >
            <span className="brand-icon">
              <Leaf size={23} strokeWidth={1.8} />
            </span>
            <span>
              clearpath<span className="brand-period">.</span>
            </span>
          </button>
          {application && (
            <div className="header-breadcrumb">
              <ChevronRight size={14} />
              <span>Your workspace</span>
            </div>
          )}
          <nav aria-label="Main navigation">
            <button
              className="text-button how-button"
              onClick={() => setModal("about")}
            >
              <HelpCircle size={16} />
              <span>How it works</span>
            </button>
            {application && (
              <button
                className="text-button save-button"
                aria-label="Save workspace"
                onClick={saveWorkspace}
              >
                <Download size={16} />
                <span>Save workspace</span>
              </button>
            )}
            <button
              className={`connection-button ${engine.available ? "connected" : ""}`}
              onClick={() => setModal("connection")}
            >
              <span className="status-dot" />
              {engine.available ? engine.model : "Local workspace"}
              <Settings2 size={14} />
            </button>
            {application && (
              <button
                className="icon-button"
                aria-label="Start a new workspace"
                onClick={() => setModal("reset")}
              >
                <Plus size={20} />
              </button>
            )}
          </nav>
        </header>
        <input
          ref={resumeInput}
          className="sr-only"
          tabIndex={-1}
          type="file"
          accept=".json,application/json"
          aria-label="Choose a saved Clearpath workspace"
          onChange={(e) => void resumeWorkspace(e.target.files?.[0])}
        />
        {!application ? (
          <Landing
            onSample={() =>
              start(sampleApplication, structuredClone(sampleSources), true)
            }
            onImport={() => {
              setImportError("");
              setModal("import");
            }}
            onResume={() => resumeInput.current?.click()}
          />
        ) : (
          <main id="main-content" className="workspace">
            <div className="workspace-intro">
              <div>
                <div className="eyebrow">YOUR NEXT STEP, MADE SIMPLE</div>
                <h1>{application.title}</h1>
                <p>
                  {application.id === sampleApplication.id
                    ? "A fictional form. A very real way to get unstuck."
                    : application.description}
                </p>
              </div>
              <div className="workspace-status">
                <span className={`pill ${illustration ? "sample" : "soft"}`}>
                  {illustration
                    ? "Fictional sample · illustrative drafts"
                    : engine.available
                      ? `Connected: ${engine.model}`
                      : "Guided workspace · AI not connected"}
                </span>
                <span>
                  <ShieldCheck size={14} /> You review. You decide.
                </span>
              </div>
            </div>
            <div className="workspace-toolbar">
              <div
                className="stage-tabs"
                role="group"
                aria-label="Application stages"
              >
                {(
                  [
                    ["draft", "Your application"],
                    ["guide", "One at a time"],
                    ["review", "Review & export"],
                  ] as const
                ).map(([id, label], i) => (
                  <button
                    aria-label={label}
                    aria-pressed={stage === id}
                    key={id}
                    onClick={() => {
                      setStage(id);
                      setReviewing(false);
                    }}
                  >
                    <span aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="button primary draft-button"
                onClick={() => void draft()}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {busy
                  ? "Finding the right words…"
                  : engine.available
                    ? "Draft from my notes"
                    : "Match my details"}
              </button>
            </div>
            {error && (
              <div className="notice error-notice" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss error"
                  onClick={() => setError("")}
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {stage === "review" && !reviewing ? (
              <section className="review-screen">
                <div className="review-intro">
                  <div className="eyebrow">
                    A FINAL LOOK, WITH YOU IN CONTROL
                  </div>
                  <h2>Does this sound like you?</h2>
                  <p>
                    Check every answer for accuracy. A source match shows where
                    words came from; only you can confirm they’re right.
                  </p>
                  <button
                    className="button primary"
                    onClick={beginReview}
                    disabled={
                      completed.length === 0 || reviewed === completed.length
                    }
                  >
                    <CheckCircle2 size={17} /> Review every answer
                  </button>
                </div>
                <div className="review-summary">
                  {application.fields.map((f, i) => (
                    <button
                      className="review-row"
                      key={f.id}
                      onClick={() => {
                        setSelected(i);
                        setReviewing(true);
                      }}
                    >
                      <span
                        className={`question-status ${answers[f.id]?.reviewed ? "done" : !answers[f.id]?.value ? "empty" : ""}`}
                      >
                        {answers[f.id]?.reviewed ? <Check size={15} /> : i + 1}
                      </span>
                      <div>
                        <strong>{f.label}</strong>
                        <p>
                          {answers[f.id]?.value ||
                            (f.required
                              ? "Still needs your answer"
                              : "Optional · left blank")}
                        </p>
                      </div>
                      <span className="review-row-status">
                        {answers[f.id]?.reviewed
                          ? "Reviewed"
                          : answers[f.id]?.value
                            ? "To review"
                            : f.required
                              ? "Missing"
                              : "Optional"}
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <>
                <div className="progress-heading">
                  <div>
                    <span>
                      {ready} of {required.length} required answers ready
                    </span>
                    <div className="progress-track">
                      <div
                        style={{
                          width: `${required.length ? (ready / required.length) * 100 : 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span>
                    {reviewing
                      ? "Reviewing your answers"
                      : "Go at your own pace."}
                  </span>
                </div>
                {missing > 0 && !reviewing && (
                  <div className="missing-banner">
                    <div>
                      <span className="missing-icon">
                        <AlertCircle size={18} />
                      </span>
                      <div>
                        <strong>
                          {missing === 1
                            ? "One detail still needs you"
                            : `${missing} details still need you`}
                        </strong>
                        <p>
                          {missing === 1
                            ? "Clearpath left it open. A missing fact deserves a question, not a guess."
                            : "Bring what you know. We’ll leave room for the details only you can add."}
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        const next = application.fields.findIndex(
                          (f) =>
                            f.required &&
                            fieldError(f, answers[f.id]?.value || ""),
                        );
                        setStage("guide");
                        select(next, true);
                      }}
                    >
                      Answer{" "}
                      {missing === 1
                        ? "the missing question"
                        : "a missing question"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <div className="work-grid">
                  <section
                    className="question-workspace"
                    aria-label="Application questions"
                  >
                    <div
                      className="question-picker"
                      aria-label="Choose a question"
                    >
                      {application.fields.map((f, i) => (
                        <button
                          key={f.id}
                          className={`${selected === i ? "selected" : ""} ${answers[f.id]?.reviewed ? "reviewed" : ""}`}
                          aria-label={`Question ${i + 1}: ${f.label}`}
                          aria-current={selected === i ? "step" : undefined}
                          onClick={() => select(i)}
                        >
                          <span>
                            {answers[f.id]?.reviewed ? (
                              <Check size={13} />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </span>
                          <span>
                            {f.kind === "long"
                              ? f.id === "circumstances"
                                ? "Your situation"
                                : f.id === "plan"
                                  ? "Your next step"
                                  : f.label.length > 22
                                    ? `Question ${i + 1}`
                                    : f.label
                              : f.label.length > 24
                                ? `Question ${i + 1}`
                                : f.label}
                          </span>
                          {answers[f.id]?.value && !answers[f.id]?.reviewed && (
                            <i className="filled-dot" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div
                      ref={fieldHeading}
                      tabIndex={-1}
                      className="field-focus"
                    >
                      {field && (
                        <FieldEditor
                          field={field}
                          answer={answers[field.id]}
                          position={selected}
                          total={application.fields.length}
                          onEdit={updateAnswer}
                          onPrevious={() =>
                            select(Math.max(0, selected - 1), true)
                          }
                          onNext={() =>
                            select(
                              Math.min(
                                application.fields.length - 1,
                                selected + 1,
                              ),
                              true,
                            )
                          }
                          onSpeak={speak}
                          reviewing={reviewing}
                          onApprove={approve}
                        />
                      )}
                    </div>
                    {reviewing && (
                      <button
                        className="text-button back-review"
                        onClick={() => setReviewing(false)}
                      >
                        Back to all answers
                      </button>
                    )}
                  </section>
                  <EvidencePanel
                    answer={field ? answers[field.id] : undefined}
                    sources={sources}
                    onEditContext={() => setModal("context")}
                  />
                </div>
              </>
            )}
            <div className="workspace-bottom">
              <div>
                <span
                  className={`completion-icon ${exportReady ? "done" : ""}`}
                >
                  {exportReady ? (
                    <CheckCircle2 size={21} />
                  ) : (
                    <ShieldCheck size={21} />
                  )}
                </span>
                <div>
                  <strong>
                    {exportReady
                      ? "Ready for your next step."
                      : "Your words. Your final say."}
                  </strong>
                  <span>
                    {exportReady
                      ? "Your reviewed draft is ready to take with you. Nothing has been submitted."
                      : `${reviewed} of ${completed.length} completed answers reviewed${missing ? ` · ${missing} required ${missing === 1 ? "answer" : "answers"} missing` : ""}`}
                  </span>
                </div>
              </div>
              <button
                className="button primary"
                disabled={!exportReady}
                onClick={download}
              >
                <Download size={17} /> Download reviewed draft
              </button>
            </div>
            <p className="workspace-footnote">
              Session only · Use “Save workspace” to keep unfinished work before
              closing this tab.{" "}
              <button onClick={() => setModal("connection")}>
                {engine.available
                  ? `Drafting sends your notes to ${engine.provider === "google" ? "Google" : "your local Ollama model"}.`
                  : "AI is not connected. Exact matching and direct answers work locally."}
              </button>
            </p>
          </main>
        )}
      </div>
      {message && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "import" && (
        <Modal title="Bring your own form." onClose={() => setModal(null)}>
          <p className="modal-intro">
            Paste the title on the first line, then one question per line. Mark
            optional questions with “(optional)”. Add a limit like “(max 200
            characters)” when needed.
          </p>
          <label htmlFor="import-text">Application questions</label>
          <textarea
            id="import-text"
            rows={9}
            maxLength={16001}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={
              "Community application\n1. Full name\n2. Email address\n3. Why are you applying? (max 500 characters)\n4. Anything else? (optional)"
            }
          />
          <p className="fine-print">
            Import up to 30 questions. Check the imported questions against the
            original; instructions pasted on separate lines may need editing
            first.
          </p>
          {importError && (
            <p role="alert" className="error-text">
              {importError}
            </p>
          )}
          <div className="modal-footer">
            <span className="muted">A fresh start, at your pace.</span>
            <button
              className="button primary"
              onClick={() => {
                try {
                  start(parseForm(importText), [
                    { id: "my-notes", name: "My notes", text: "" },
                  ]);
                } catch (cause) {
                  setImportError(
                    cause instanceof Error
                      ? cause.message
                      : "Check your questions.",
                  );
                }
              }}
            >
              Create my workspace <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "context" && (
        <Modal
          title="A little context goes a long way."
          wide
          onClose={() => setModal(null)}
        >
          <ContextEditor
            sources={sources}
            onSave={(next) => {
              cancelDraft();
              setSources(next);
              setAnswers({});
              setIllustration(false);
              setReviewing(false);
              setStage("draft");
              setSelected(0);
              setError("");
              setModal(null);
              setMessage("Context updated. Old drafts and reviews cleared.");
            }}
          />
        </Modal>
      )}
      {modal === "connection" && (
        <Modal title="Your model connection." onClose={() => setModal(null)}>
          <div
            className={`connection-state ${engine.available ? "is-connected" : ""}`}
          >
            <span className="status-dot" />
            <strong>
              {engine.available ? engine.model : "AI is not connected"}
            </strong>
            <span>
              {engine.provider === "google"
                ? "Google API"
                : engine.provider === "ollama"
                  ? "Local Ollama"
                  : "Exact matching available"}
            </span>
          </div>
          <p className="modal-intro">
            {engine.available
              ? `When you choose “Draft from my notes”, your form and notes are sent to ${engine.provider === "google" ? "Google’s model API" : "Ollama on this computer"}. Clearpath does not keep an application database. You still review every answer.`
              : "You can answer questions, copy exact labeled details from notes, review, and export without AI. The sample contains clearly labeled illustrative drafts."}
          </p>
          <div className="setup-note">
            <h3>For the person running Clearpath</h3>
            <p>
              Copy <code>.env.example</code> to <code>.env</code>, set{" "}
              <code>GEMINI_API_KEY</code> and a model available to your project,
              then restart the server. For a local model, use{" "}
              <code>AI_PROVIDER=ollama</code> and an installed{" "}
              <code>OLLAMA_MODEL</code>.
            </p>
            <p>
              Keep keys on the server. Never put a key in a form or application
              notes.
            </p>
          </div>
          <div className="modal-footer">
            <a
              className="text-button"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio <ArrowUpRight size={15} />
            </a>
            <button
              className="button secondary"
              onClick={() => {
                void refreshEngine();
                setMessage("Connection status refreshed.");
              }}
            >
              <RotateCcw size={15} /> Refresh status
            </button>
          </div>
        </Modal>
      )}
      {modal === "about" && (
        <Modal
          title="A clear path through the form."
          onClose={() => setModal(null)}
        >
          <div className="how-steps">
            {[
              [
                "Bring the questions.",
                "Paste a form, or explore our fictional student support application. The original questions stay visible.",
              ],
              [
                "Bring your story.",
                "Add your notes. A connected model can suggest answers with exact excerpts. Without AI, only explicit label/value matches are copied.",
              ],
              [
                "Fill the gaps.",
                "Unknown information stays open. Answer one question at a time and listen to the plain-language guide if that helps.",
              ],
              [
                "Review and take it with you.",
                "Confirm every completed answer before downloading your draft. Clearpath never submits a form for you.",
              ],
            ].map(([title, text], i) => (
              <div key={title}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="notice">
            Source excerpts do not establish truth or eligibility. Clearpath is
            a drafting aid. Always check the original form’s requirements.
          </div>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="Start a new workspace?" onClose={() => setModal(null)}>
          <p className="modal-intro">
            This clears the questions, notes, and drafts in this session. Use
            “Save workspace” first if you want to keep unfinished work.
          </p>
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setModal(null)}>
              Keep working
            </button>
            <button
              className="button primary"
              onClick={() => {
                cancelDraft();
                window.speechSynthesis?.cancel();
                setApplication(null);
                setAnswers({});
                setSources([]);
                setModal(null);
                setMessage("");
                setError("");
              }}
            >
              Start fresh
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
