import type { Application, Source, DraftResult } from './types';
import { z } from 'zod';
import { fieldError } from './workspace';

const rawSchema = z.object({ answers: z.array(z.object({
  fieldId: z.string().max(100), value: z.string().max(6000),
  evidence: z.array(z.object({ sourceId: z.string().max(100), quote: z.string().min(1).max(16000) })).max(10),
})).max(60), guides: z.array(z.object({ fieldId: z.string().max(100), plainLanguage: z.string().min(4).max(600) })).max(30).optional() });

export function validateSuggestions(application: Application, sources: Source[], raw: unknown): DraftResult {
  const parsed = rawSchema.parse(raw);
  const result: DraftResult = { answers: {}, rejected: [] };
  if (parsed.guides) result.guides = Object.fromEntries(parsed.guides.filter(guide => application.fields.some(f => f.id === guide.fieldId)).map(guide => [guide.fieldId, guide.plainLanguage]));
  for (const proposal of parsed.answers) {
    const field = application.fields.find(f => f.id === proposal.fieldId);
    const duplicate = parsed.answers.filter(a => a.fieldId === proposal.fieldId).length > 1;
    const evidence = proposal.evidence.flatMap(item => {
      const source = sources.find(s => s.id === item.sourceId);
      const start = source?.text.indexOf(item.quote) ?? -1;
      return start < 0 ? [] : [{ ...item, start, end: start + item.quote.length }];
    });
    const numbers = evidence.flatMap(e => [...e.quote.matchAll(/\d[\d,]*(?:\.\d{1,2})?/g)].map(m => Number(m[0].replace(/,/g, ''))));
    const unsupportedScalar = field?.kind === 'number' ? !numbers.includes(Number(proposal.value)) : field?.kind === 'email' ? !evidence.some(e => e.quote.toLowerCase().includes(proposal.value.toLowerCase())) : false;
    const reason = !field ? 'Unknown question.' : duplicate ? 'Conflicting drafts for this question.' : !proposal.value.trim() ? 'No answer supplied.' : fieldError(field, proposal.value) || (evidence.length === 0 || evidence.length !== proposal.evidence.length ? 'A source excerpt could not be found in your notes.' : unsupportedScalar ? 'The exact value could not be found in the cited excerpts.' : null);
    if (reason) { result.rejected.push({ fieldId: proposal.fieldId, reason }); continue; }
    result.answers[proposal.fieldId] = { fieldId: proposal.fieldId, value: proposal.value, evidence, origin: 'ai', reviewed: false };
  }
  return result;
}

const normalizeLabel = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export function exactMatches(application: Application, sources: Source[]): DraftResult {
  const result: DraftResult = { answers: {}, rejected: [] };
  for (const field of application.fields) {
    const matches = sources.flatMap(source => source.text.split(/\r?\n/).flatMap(line => {
      const separator = line.indexOf(':');
      if (separator < 0 || normalizeLabel(line.slice(0, separator)) !== normalizeLabel(field.label)) return [];
      const value = line.slice(separator + 1).trim();
      if (!value || fieldError(field, value)) return [];
      return [{ value, sourceId: source.id, quote: line, start: source.text.indexOf(line), end: source.text.indexOf(line) + line.length }];
    }));
    if (new Set(matches.map(m => m.value)).size !== 1) continue;
    const { value, ...evidence } = matches[0];
    result.answers[field.id] = { fieldId: field.id, value, evidence: [evidence], origin: 'exact', reviewed: false };
  }
  return result;
}
