import { Check, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import type { Answer, Field } from "../core/types";
import { fieldError } from "../core/workspace";

export function FieldEditor({
  field,
  answer,
  position,
  total,
  onEdit,
  onPrevious,
  onNext,
  onSpeak,
  reviewing,
  onApprove,
}: {
  field: Field;
  answer?: Answer;
  position: number;
  total: number;
  onEdit: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeak: () => void;
  reviewing?: boolean;
  onApprove?: () => void;
}) {
  const value = answer?.value ?? "";
  const error = value ? fieldError(field, value) : null;
  const inputProps = {
    id: `answer-${field.id}`,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onEdit(e.target.value),
    "aria-label": `Answer: ${field.label}`,
    "aria-describedby": `hint-${field.id}`,
    "aria-invalid": Boolean(error),
    maxLength: 6001,
  };
  return (
    <article className="editor-card">
      <div className="editor-top">
        <span className="eyebrow">
          QUESTION {String(position + 1).padStart(2, "0")}{" "}
          <span className="muted">/ {String(total).padStart(2, "0")}</span>
        </span>
        <button className="text-button" onClick={onSpeak}>
          <Volume2 size={16} /> Read aloud
        </button>
      </div>
      <div className="original-question">
        <span>THE ORIGINAL QUESTION</span>
        <p>{field.label}</p>
      </div>
      <div className="plain-question">
        <span className="pill soft">IN PLAIN ENGLISH</span>
        <h2>{field.plainLanguage}</h2>
      </div>
      <div className="answer-label">
        <label htmlFor={`answer-${field.id}`}>
          Your answer{" "}
          {field.required ? (
            <span className="muted">· required</span>
          ) : (
            <span className="muted">· optional</span>
          )}
        </label>
        {answer?.reviewed && (
          <span className="reviewed-label">
            <Check size={13} /> Reviewed
          </span>
        )}
      </div>
      {field.kind === "long" ? (
        <textarea
          {...inputProps}
          rows={5}
          placeholder="Start with what you know. You can always change it."
        />
      ) : (
        <input
          {...inputProps}
          type={field.kind === "email" ? "email" : "text"}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          placeholder={
            field.kind === "number"
              ? "Enter the amount you have confirmed"
              : "Type your answer here"
          }
        />
      )}
      <div
        id={`hint-${field.id}`}
        className={`input-hint ${error ? "error-text" : ""}`}
      >
        <span>
          {error ||
            (answer?.origin === "ai"
              ? "AI draft · check the source and make it yours."
              : answer?.origin === "example"
                ? "Illustrative draft · check the source and make it yours."
                : answer?.origin === "exact"
                  ? "Copied from an explicitly labeled detail in your notes."
                  : "Your words are enough. Only include details you know are accurate.")}
        </span>
        {field.maxLength && (
          <span className={value.length > field.maxLength ? "error-text" : ""}>
            {value.length} / {field.maxLength}
          </span>
        )}
      </div>
      {reviewing ? (
        <div className="review-confirm">
          <p>
            Check the answer against the original question. Source excerpts do
            not verify the facts for you.
          </p>
          <button
            className="button primary"
            disabled={!value.trim() || Boolean(error)}
            onClick={onApprove}
          >
            <Check size={17} /> This answer is accurate
          </button>
        </div>
      ) : (
        <div className="editor-navigation">
          <button
            className="button ghost"
            disabled={position === 0}
            onClick={onPrevious}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span>
            {field.required ? "Required question" : "Optional question"}
          </span>
          <button
            className="button secondary"
            disabled={position === total - 1}
            onClick={onNext}
          >
            Next question <ChevronRight size={16} />
          </button>
        </div>
      )}
    </article>
  );
}
