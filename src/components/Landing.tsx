import { ArrowRight, ArrowUpRight, Check, FileText, ShieldCheck, Sparkles } from 'lucide-react';

export function Landing({ onSample, onImport, onResume }: { onSample: () => void; onImport: () => void; onResume: () => void }) {
  return <main id="main-content" className="landing">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="status-dot" /> A CLEARER WAY FORWARD</div>
        <h1>More possibility.<br /><span>Less paperwork.</span></h1>
        <p className="hero-description">A confusing form shouldn’t be the thing that stops you. Turn it into simple questions, bring your own story, and take the next step with confidence.</p>
        <div className="hero-actions"><button className="button primary large" onClick={onSample}>Explore a sample <ArrowRight size={19} /></button><button className="button secondary large" onClick={onImport}>Use my own form <ArrowUpRight size={18} /></button></div>
        <p className="hero-caption"><ShieldCheck size={15} /> No sign-in. You review every answer. You decide what leaves.</p>
        <button className="text-button resume-link" onClick={onResume}><FileText size={14} /> Resume a saved workspace</button>
        <div className="hero-bottom"><div className="tiny-avatar">M</div><p>From “where do I even start?”<br /><strong>to “I can do this.”</strong></p><div className="hand-arrow" aria-hidden="true">↗</div></div>
      </div>
      <div className="hero-visual" aria-label="An example of a complex form becoming a simple question">
        <div className="visual-grid" aria-hidden="true" />
        <div className="paper back-paper" aria-hidden="true"><div className="paper-top"><FileText size={18} /><span>APPLICATION FOR ASSISTANCE</span></div><div className="paper-rule" /><p>Describe the unforeseen circumstances necessitating financial assistance and the resulting impediment to academic participation.</p><div className="fake-line" /><div className="fake-line shorter" /><div className="fake-line" /></div>
        <div className="transform-label"><Sparkles size={16} /> Let’s make that clearer.</div>
        <div className="paper front-paper"><div className="paper-top"><span className="mini-mark">c</span><span>ONE QUESTION AT A TIME</span><span className="counter">04 / 07</span></div><h2>What happened, and how is it making college harder?</h2><div className="sample-answer">“My laptop stopped working. I’m using library computers, but the lab closes before I finish work.”</div><div className="evidence-stamp"><Check size={14} /> From your notes <span>·</span> For you to review</div></div>
        <div className="floating-note"><div className="note-icon"><Check size={19} /></div><div><strong>Your story. Your final say.</strong><span>Sources beside every draft.</span></div></div>
        <span className="visual-caption">Fictional example · illustrative draft</span>
      </div>
    </section>
    <section className="promise-strip" aria-label="How Clearpath works">
      <div><span className="step-number">01</span><div><h3>Understand the ask.</h3><p>The original question, in plain English.</p></div></div>
      <div><span className="step-number">02</span><div><h3>Start with what you know.</h3><p>Draft from your notes. See the source.</p></div></div>
      <div><span className="step-number">03</span><div><h3>Make it yours.</h3><p>Fill the gaps. Review. Take it with you.</p></div></div>
    </section>
    <footer className="landing-footer"><span>Good opportunities deserve a clear path.</span><span>GATOR HACK V <span className="footer-dot">·</span> 2026</span></footer>
  </main>;
}
