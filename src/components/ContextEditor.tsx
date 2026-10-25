import { useRef, useState } from 'react';
import { FilePlus2, Plus, Trash2 } from 'lucide-react';
import type { Source } from '../core/types';

export function ContextEditor({ sources, onSave }: { sources: Source[]; onSave: (sources: Source[]) => void }) {
  const [state, setState] = useState({ draft: sources, error: '', pending: 0 });
  const { draft, error, pending } = state;
  const setDraft = (update: Source[] | ((current: Source[]) => Source[])) => setState(current => ({ ...current, draft: typeof update === 'function' ? update(current.draft) : update }));
  const setError = (error: string) => setState(current => ({ ...current, error }));
  const fileRef = useRef<HTMLInputElement>(null);
  const total = draft.reduce((sum, source) => sum + source.text.length, 0);
  const addFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 64000) { setError('Choose a .txt or .md file under 64 KB.'); return; }
    setState(current => ({ ...current, pending: current.pending + 1 }));
    try {
      const text = await file.text();
      const source = { id: `source-${crypto.randomUUID()}`, name: file.name.slice(0, 160), text };
      setState(current => {
        const pending = Math.max(0, current.pending - 1);
        if (text.length > 16000 || current.draft.reduce((n, s) => n + s.text.length, 0) + text.length > 32000 || current.draft.length >= 5) return { ...current, pending, error: 'Use up to 5 notes, 16,000 characters each, and 32,000 in total.' };
        return { draft: [...current.draft, source], pending, error: '' };
      });
    } catch { setState(current => ({ ...current, pending: Math.max(0, current.pending - 1), error: 'This file could not be read. Try another text file.' })); }
    if (fileRef.current) fileRef.current.value = '';
  };
  return <div className="context-editor">
    <p className="modal-intro">Bring the details you already know. Notes stay in memory until you choose to draft with a connected model. Use fictional information while exploring.</p>
    <div className="notice amber">Changing your context clears existing drafts and reviews so old answers can’t be mistaken for current ones.</div>
    {draft.map((source, index) => <div className="source-editor" key={source.id}><div className="source-editor-heading"><label htmlFor={`source-${index}`}>{source.name}</label>{draft.length > 1 && <button className="icon-button" aria-label={`Remove ${source.name}`} onClick={() => setDraft(draft.filter(s => s.id !== source.id))}><Trash2 size={16} /></button>}</div><textarea id={`source-${index}`} aria-label={`Text for ${source.name}`} value={source.text} maxLength={16001} rows={7} onChange={e => setDraft(draft.map(s => s.id === source.id ? { ...s, text: e.target.value } : s))} placeholder="Write naturally, or use labels such as Full name: Maya Chen. Leave unknown details out." /><span className="character-count">{source.text.length.toLocaleString()} / 16,000 characters</span></div>)}
    <div className="context-tools"><button className="button secondary" disabled={draft.length >= 5} onClick={() => setDraft([...draft, { id: `source-${crypto.randomUUID()}`, name: `Note ${draft.length + 1}`, text: '' }])}><Plus size={15} /> Add note</button><button className="button secondary" disabled={draft.length >= 5} onClick={() => fileRef.current?.click()}><FilePlus2 size={15} /> Import text file</button><input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" tabIndex={-1} aria-label="Import a text note" onChange={e => void addFile(e.target.files?.[0])} /></div>
    {error && <p role="alert" className="error-text">{error}</p>}
    <div className="modal-footer"><span className={total > 32000 ? 'error-text' : 'muted'}>{pending ? 'Reading your file…' : `${total.toLocaleString()} / 32,000 total`}</span><button className="button primary" disabled={pending > 0 || total > 32000 || draft.some(s => s.text.length > 16000)} onClick={() => onSave(draft)}>Save context & reset drafts</button></div>
  </div>;
}
