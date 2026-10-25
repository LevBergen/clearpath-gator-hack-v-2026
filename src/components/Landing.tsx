import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";

export function Landing({
  onSample,
  onImport,
  onResume,
  onChallenge,
}: {
  onSample: () => void;
  onImport: () => void;
  onResume: () => void;
  onChallenge: () => void;
}) {
  return (
    <main id="main-content" className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> APPLICATIONS, ONE PART AT A TIME
          </div>
          <h1>
            Did you answer
            <br />
            <span>the whole question?</span>
          </h1>
          <p className="hero-description">
            A question can ask for four things in one sentence. Bring your
            notes, spot the gaps, and build an answer you’ve checked.
          </p>
          <div className="hero-actions">
            <button className="button primary large" onClick={onChallenge}>
              Try the missing-details challenge <ArrowRight size={19} />
            </button>
            <button className="button secondary large" onClick={onImport}>
              Use my own form <ArrowUpRight size={18} />
            </button>
          </div>
          <p className="hero-caption">
            <ShieldCheck size={15} /> No account needed. Review every answer
            before export.
          </p>
          <button className="text-button resume-link" onClick={onResume}>
            <FileText size={14} /> Resume a saved workspace
          </button>
          <button className="text-button simple-sample-link" onClick={onSample}>
            Explore a sample <ArrowRight size={14} />
          </button>
          <div className="hero-bottom">
            <p>
              Try a fictional student-support request.
              <br />
              <strong>The draft answers two parts. What’s missing?</strong>
            </p>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Illustration: a four-part application question with two details still missing"
        >
          <div className="visual-grid" aria-hidden="true" />
          <div className="paper back-paper" aria-hidden="true">
            <div className="paper-top">
              <FileText size={18} />
              <span>APPLICATION FOR ASSISTANCE</span>
            </div>
            <div className="paper-rule" />
            <p>
              Describe the unexpected expense and how it affects your
              coursework. Include the amount you are requesting and any other
              financial help you have already tried.
            </p>
            <div className="fake-line" />
            <div className="fake-line shorter" />
            <div className="fake-line" />
          </div>
          <div className="paper front-paper">
            <div className="paper-top">
              <span className="mini-mark">c</span>
              <span>SUGGESTED QUESTION PARTS</span>
              <span className="counter">02 / 04</span>
            </div>
            <h2>
              Four parts.
              <br />
              Two still need you.
            </h2>
            <div className="preview-parts">
              <div>
                <Check size={14} />
                <span>What happened</span>
                <small>In the notes</small>
              </div>
              <div>
                <Check size={14} />
                <span>Effect on coursework</span>
                <small>In the notes</small>
              </div>
              <div className="preview-gap">
                <span className="preview-open">3</span>
                <span>Amount requested</span>
                <small>Ask Maya</small>
              </div>
              <div className="preview-gap">
                <span className="preview-open">4</span>
                <span>Other help tried</span>
                <small>Ask Maya</small>
              </div>
            </div>
            <div className="evidence-stamp">
              Check the breakdown against the original.
            </div>
          </div>
          <span className="visual-caption">
            Fictional example · illustrative draft
          </span>
        </div>
      </section>
      <section className="promise-strip" aria-label="How Clearpath works">
        <div>
          <span className="step-number">01</span>
          <div>
            <h3>Read each part.</h3>
            <p>Check the breakdown against the original.</p>
          </div>
        </div>
        <div>
          <span className="step-number">02</span>
          <div>
            <h3>Fill the gaps.</h3>
            <p>Use your notes. Add what’s missing.</p>
          </div>
        </div>
        <div>
          <span className="step-number">03</span>
          <div>
            <h3>Review your answer.</h3>
            <p>Edit the draft, then download it.</p>
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <span>Built for the question that asks four things at once.</span>
        <span>
          GATOR HACK V <span className="footer-dot">·</span> 2026
        </span>
      </footer>
    </main>
  );
}
