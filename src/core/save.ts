import type { Application, Source, Answers } from './types';
import { z } from 'zod';
import { applicationSchema, safeId, sourcesSchema } from './schema';
import { validateSuggestions } from './evidence';

const savedAnswer = z.object({ fieldId: safeId, value: z.string().max(6000), reviewed: z.boolean(), origin: z.enum(['ai', 'exact', 'person', 'example']), evidence: z.array(z.object({ sourceId: safeId, quote: z.string().min(1).max(16000), start: z.number().int().min(0), end: z.number().int().min(0) })).max(10) });
const savedSchema = z.object({ version: z.literal(1), application: applicationSchema, sources: sourcesSchema, answers: z.record(safeId, savedAnswer) });

export function serializeWorkspace(application: Application, sources: Source[], answers: Answers): string {
  return JSON.stringify(savedSchema.parse({ version: 1, application, sources, answers }), null, 2);
}

export function restoreWorkspace(text: string): { application: Application; sources: Source[]; answers: Answers } {
  if (text.length > 1000000) throw new Error('This workspace is too large.');
  const saved = savedSchema.parse(JSON.parse(text));
  const answers: Answers = {};
  for (const field of saved.application.fields) {
    const previous = saved.answers[field.id];
    if (!previous) continue;
    if (previous.origin === 'person') answers[field.id] = { ...previous, fieldId: field.id, reviewed: false, evidence: [] };
    else {
      const result = validateSuggestions(saved.application, saved.sources, { answers: [{ ...previous, fieldId: field.id }] });
      if (result.answers[field.id]) answers[field.id] = { ...result.answers[field.id], origin: previous.origin, reviewed: false };
    }
  }
  return { application: saved.application, sources: saved.sources, answers };
}
