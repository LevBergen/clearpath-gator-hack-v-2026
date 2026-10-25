import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  X,
} from "lucide-react";
import type { FieldCoverage, CoveragePart } from "../core/coverage";

export function CoveragePanel({
  question,
  currentAnswer,
  state,
  onConfirm,
  onEdit,
  onAccept,
  onDismiss,
  onBuild,
  onUseCurrent,
  onRemove,
  onSkip,
}: {
  question: string;
  currentAnswer: string;
  state: FieldCoverage;
  onConfirm: () => void;
  onEdit: (id: string, value: string) => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onBuild: () => void;
  onUseCurrent: () => void;
  onRemove: () => void;
  onSkip?: () => void;
}) {
  const [active, setActive] = useState(0);
  const buildButton = useRef<HTMLButtonElement>(null);
  const parts = state.parts;
  const part = parts[active] || parts[0];
  const remaining = parts.filter((p) => !p.dismissed && !p.accepted).length;
  const canBuild =
    state.confirmed &&
    parts.some((p) => !p.dismissed) &&
    parts.every((p) => p.dismissed || (p.accepted && p.value.trim()));
  const initialGaps = parts.filter(
    (p) => !p.dismissed && !p.value.trim(),
  ).length;
  useEffect(() => {
    if (!state.confirmed) return;
    if (part && !part.dismissed)
      document
        .getElementById(`detail-${part.id}`)
        ?.focus({ preventScroll: true });
  }, [active, state.confirmed]);
  useEffect(() => {
    if (canBuild) buildButton.current?.focus({ preventScroll: true });
  }, [canBuild]);
  useEffect(() => {
    setActive((index) => Math.min(index, parts.length - 1));
  }, [parts.length]);
  const status = (p: CoveragePart) =>
    p.dismissed
      ? "Removed by you"
      : p.accepted
        ? "Confirmed by you"
        : p.value.trim()
          ? "Possible detail in notes"
          : "Needs your detail";
  function accept() {
    onAccept(part.id);
    const next = parts.findIndex(
      (p, i) => i > active && !p.dismissed && !p.accepted,
    );
    const earlier = parts.findIndex(
      (p, i) => i < active && !p.dismissed && !p.accepted,
    );
    if (next >= 0) setActive(next);
    else if (earlier >= 0) setActive(earlier);
  }
  return (
    <article
      className="coverage-card"
      aria-label="Check every part of the question"
    >
      <div className="coverage-heading">
        <span className="eyebrow">A QUESTION CAN ASK MORE THAN ONE THING</span>
        <h2>Did you answer every part?</h2>
        <p>
          A fluent paragraph can still leave something out. Check these
          suggested parts against the original question, then confirm or add
          your details.
        </p>
      </div>
      <div className="original-question">
        <span>THE ORIGINAL QUESTION</span>
        <p>{question}</p>
      </div>
      <details className="current-draft" open={!state.confirmed}>
        <summary>Read the current draft</summary>
        <p>
          {currentAnswer || "No draft yet. Start with the details you know."}
        </p>
      </details>
      {!state.confirmed && (
        <div className="coverage-explanation">
          <HelpCircle size={18} />
          <span>
            {parts.length} suggested parts.{" "}
            {initialGaps
              ? `${initialGaps} have no proposed detail yet.`
              : "Check each proposed detail before using it."}{" "}
            This is a coaching aid, not a guarantee that every requirement was
            found.
          </span>
        </div>
      )}
      <div className="coverage-parts" aria-label="Suggested question parts">
        {parts.map((p, i) => (
          <div
            key={p.id}
            className={`coverage-part ${active === i ? "active" : ""} ${p.accepted ? "accepted" : ""} ${p.dismissed ? "dismissed" : ""}`}
          >
            <button
              className="coverage-part-main"
              aria-label={`Check part ${i + 1}: ${p.label}`}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              <span className="coverage-part-number">
                {p.accepted ? <Check size={15} /> : i + 1}
              </span>
              <span>
                <strong>{p.label}</strong>
                <q>{p.promptQuote}</q>
                <span className="coverage-part-status">{status(p)}</span>
              </span>
              <ChevronRight size={15} />
            </button>
            {state.confirmed && (
              <button
                className="icon-button"
                aria-label={
                  p.dismissed
                    ? `Restore part: ${p.label}`
                    : `This part is not asked: ${p.label}`
                }
                title={
                  p.dismissed
                    ? "Restore this part"
                    : "Remove a mistaken suggestion"
                }
                onClick={() => onDismiss(p.id)}
              >
                {p.dismissed ? <RotateCcw size={14} /> : <X size={14} />}
              </button>
            )}
          </div>
        ))}
      </div>
      {!state.confirmed ? (
        <div className="coverage-confirm">
          <p>
            Keep the original meaning, including any qualifiers. Remove mistaken
            suggestions after confirming, or use the original question directly.
          </p>
          <button className="button primary" onClick={onConfirm}>
            <Check size={16} /> This breakdown matches the question
          </button>
        </div>
      ) : (
        <>
          {canBuild && (
            <div className="coverage-build">
              <CheckCircle2 size={24} />
              <h3>You have a detail for every active part.</h3>
              <p>
                Build a draft using only the details you confirmed. You can edit
                the result and review it before export.
              </p>
              <button
                ref={buildButton}
                className="button primary"
                onClick={onBuild}
              >
                Build my answer from these details <ArrowRight size={16} />
              </button>
              {currentAnswer.trim() && (
                <button className="text-button" onClick={onUseCurrent}>
                  I checked that my current wording covers these details
                </button>
              )}
            </div>
          )}
          {part && !part.dismissed ? (
            <section className="coverage-detail" aria-label="Focused follow-up">
              <div className="coverage-detail-heading">
                <span className="eyebrow">
                  {remaining
                    ? remaining +
                      (remaining === 1
                        ? " DETAIL TO CONFIRM"
                        : " DETAILS TO CONFIRM")
                    : "EDIT A CONFIRMED DETAIL"}
                </span>
                <h3>{part.question}</h3>
              </div>
              <label htmlFor={`detail-${part.id}`}>Your detail</label>
              <textarea
                id={`detail-${part.id}`}
                aria-label={`Detail: ${part.label}`}
                maxLength={2000}
                rows={3}
                value={part.value}
                placeholder="Use only what you know. If you haven't tried something, you can say that."
                onChange={(e) => onEdit(part.id, e.target.value)}
              />
              {part.evidence.length > 0 && (
                <details className="part-evidence">
                  <summary>See the supporting notes</summary>
                  {part.evidence.map((e, i) => (
                    <blockquote key={i}>{e.quote}</blockquote>
                  ))}
                </details>
              )}
              <p className="fine-print">
                {part.origin === "notes"
                  ? "Suggested from your notes. Check that it actually answers this part."
                  : "Entered by you. Confirm the detail is accurate before using it."}
              </p>
              <button
                className="button primary"
                disabled={!part.value.trim() || part.accepted}
                onClick={accept}
              >
                <Check size={16} />{" "}
                {part.accepted ? "Detail confirmed" : "Confirm this detail"}
              </button>
            </section>
          ) : (
            <p className="fine-print">
              This suggestion was removed by you. Select another part, restore
              it, or use the original question directly.
            </p>
          )}
        </>
      )}
      <button className="text-button coverage-remove" onClick={onRemove}>
        {parts.some((p) => p.origin === "person" && p.value.trim())
          ? "Discard these follow-up details and answer directly"
          : "Use the original question without this breakdown"}
      </button>
      {onSkip && (
        <button className="text-button coverage-remove" onClick={onSkip}>
          Skip this optional question and clear its follow-up details
        </button>
      )}
    </article>
  );
}
