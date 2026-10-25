import {
  AlertCircle,
  ArrowUpRight,
  FileText,
  Pencil,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { Answer, Source } from "../core/types";

export function EvidencePanel({
  answer,
  sources,
  onEditContext,
}: {
  answer?: Answer;
  sources: Source[];
  onEditContext: () => void;
}) {
  const [tab, setTab] = useState<"evidence" | "context">("evidence");
  return (
    <aside className="evidence-panel" aria-label="Sources and context">
      <div className="aside-title">
        <span className="eyebrow">A LITTLE CLARITY</span>
        <h3>
          The context behind
          <br />
          your answer.
        </h3>
      </div>
      <div className="aside-tabs" role="group" aria-label="Context views">
        <button
          aria-pressed={tab === "evidence"}
          onClick={() => setTab("evidence")}
        >
          Source excerpts
        </button>
        <button
          aria-pressed={tab === "context"}
          onClick={() => setTab("context")}
        >
          My context <span>{sources.length}</span>
        </button>
      </div>
      {tab === "evidence" ? (
        <div className="evidence-content" role="tabpanel">
          {answer?.evidence.length ? (
            <>
              <div className="source-found">
                <ShieldCheck size={16} />
                <span>
                  {answer.evidence.length === 1
                    ? "Excerpt found in your notes"
                    : `${answer.evidence.length} excerpts found in your notes`}
                </span>
              </div>
              {answer.evidence.map((item, i) => (
                <div className="quote-card" key={`${item.sourceId}-${i}`}>
                  <div>
                    <FileText size={14} />
                    <strong>
                      {sources.find((s) => s.id === item.sourceId)?.name ||
                        item.sourceId}
                    </strong>
                  </div>
                  <Quote size={18} className="quote-icon" />
                  <blockquote>{item.quote}</blockquote>
                  <span className="quote-location">
                    Characters {item.start + 1}–{item.end}
                  </span>
                </div>
              ))}
              <p className="source-caution">
                An excerpt shows where the draft came from. It doesn’t prove
                that the answer is accurate or complete.
              </p>
            </>
          ) : (
            <div className="empty-evidence">
              <div className="empty-icon">
                {answer?.value ? (
                  <Pencil size={23} />
                ) : (
                  <AlertCircle size={23} />
                )}
              </div>
              <h4>
                {answer?.value
                  ? "In your own words."
                  : "This detail needs you."}
              </h4>
              <p>
                {answer?.value
                  ? "You entered this answer directly. Review it against the original question before you use it."
                  : "There isn’t a source-backed answer here. Clearpath leaves the space open so you can supply the right information."}
              </p>
              <button className="text-button" onClick={onEditContext}>
                Add to my context <ArrowUpRight size={15} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="context-content" role="tabpanel">
          {sources.map((source) => (
            <div className="context-preview" key={source.id}>
              <div>
                <FileText size={16} />
                <strong>{source.name}</strong>
              </div>
              <p>{source.text || "No notes added yet."}</p>
            </div>
          ))}
        </div>
      )}
      <button className="button secondary context-edit" onClick={onEditContext}>
        <Pencil size={15} /> Edit my context
      </button>
      <div className="privacy-note">
        <ShieldCheck size={15} />
        <p>
          Your workspace stays in this session. You choose when to send notes to
          a connected model or download a draft.
        </p>
      </div>
    </aside>
  );
}
