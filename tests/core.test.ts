import { describe, expect, it } from 'vitest';
import { parseForm } from '../src/core/form';
import { validateSuggestions, exactMatches } from '../src/core/evidence';
import { canExport, exportPacket, editAnswer, fieldError } from '../src/core/workspace';
import type { Application, Source, Answer } from '../src/core/types';
import { serializeWorkspace, restoreWorkspace } from '../src/core/save';

const application: Application = {
  id: 'test', title: 'Community application', description: '',
  fields: [
    { id: 'name', label: 'Full name', plainLanguage: 'Your name', required: true, kind: 'short' },
    { id: 'reason', label: 'Why do you need support?', plainLanguage: 'Tell your story', required: true, kind: 'long', maxLength: 200 },
    { id: 'extra', label: 'Anything else?', plainLanguage: 'Optional details', required: false, kind: 'long' },
  ],
};
const sources: Source[] = [{ id: 'notes', name: 'My notes', text: 'Full name: Maya Chen\nMy laptop stopped working on Monday.\nI use library computers to finish assignments.' }];
const suggestion = (quote = 'My laptop stopped working on Monday.') => ({ answers: [{ fieldId: 'reason', value: 'My laptop stopped working on Monday.', evidence: [{ sourceId: 'notes', quote }] }] });
const answer = (fieldId: string, value: string, reviewed = true): Answer => ({ fieldId, value, reviewed, evidence: [], origin: 'person' });

describe('question import', () => {
  it('imports numbered questions without turning the title into a question', () => {
    const form = parseForm('Community application\n1. Full name *\n2. Why do you need support?\n3. Extra details (optional)');
    expect(form.title).toBe('Community application');
    expect(form.fields.map(f => [f.label, f.required])).toEqual([['Full name', true], ['Why do you need support?', true], ['Extra details', false]]);
    expect(new Set(form.fields.map(f => f.id)).size).toBe(3);
  });
  it('keeps a first-line question instead of consuming it as a title', () => {
    expect(parseForm('What is your name?\nEmail address:').fields).toHaveLength(2);
  });
  it('recognizes a character limit and email field', () => {
    const fields = parseForm('My form\nEmail address:\nTell us about yourself (max 200 characters)').fields;
    expect(fields[0].kind).toBe('email');
    expect(fields[1].maxLength).toBe(200);
  });
  it('rejects empty and excessive forms rather than generating an empty workspace', () => {
    expect(() => parseForm('   ')).toThrow();
    expect(() => parseForm('Title\n' + Array.from({ length: 31 }, (_, i) => `${i + 1}. Question ${i}?`).join('\n'))).toThrow();
  });
  it('keeps narrative questions as free text when they mention scalar words', () => {
    const form = parseForm('My application\nDescribe how you will use this amount\nExplain why email is not accessible');
    expect(form.fields.map(f => f.kind)).toEqual(['long', 'long']);
  });
  it('preserves optional as ordinary question text unless it is a marker', () => {
    const form = parseForm('Community application\nDescribe optional activities you enjoy');
    expect(form.fields[0].label).toBe('Describe optional activities you enjoy');
    expect(form.fields[0].required).toBe(true);
  });
});

describe('unfinished workspace preservation', () => {
  it('round-trips partial work without requiring completed answers', () => {
    const saved = serializeWorkspace(application, sources, { name: answer('name', 'Maya Chen') });
    const restored = restoreWorkspace(saved);
    expect(restored.application.title).toBe('Community application');
    expect(restored.sources[0].text).toContain('My laptop stopped working');
    expect(restored.answers.name.value).toBe('Maya Chen');
    expect(restored.answers.reason).toBeUndefined();
    expect(restored.answers.name.reviewed).toBe(false);
  });
  it('does not restore a saved AI answer with forged evidence', () => {
    const saved = JSON.stringify({ version: 1, application, sources, answers: { reason: { ...answer('reason', 'Invented fact'), origin: 'ai', evidence: [{ sourceId: 'notes', quote: 'Not in the notes', start: 0, end: 16 }] } } });
    expect(restoreWorkspace(saved).answers.reason).toBeUndefined();
  });
  it('rejects malformed and excessive saved work', () => {
    expect(() => restoreWorkspace('{broken')).toThrow();
    expect(() => restoreWorkspace(JSON.stringify({ version: 99 }))).toThrow();
    expect(() => restoreWorkspace('x'.repeat(200001))).toThrow();
  });
});

describe('source checks', () => {
  it('attaches real source offsets to a model quote', () => {
    const result = validateSuggestions(application, sources, suggestion());
    const drafted = result.answers.reason;
    expect(drafted.value).toBe('My laptop stopped working on Monday.');
    expect(drafted.reviewed).toBe(false);
    expect(drafted.evidence[0]).toEqual({ sourceId: 'notes', quote: 'My laptop stopped working on Monday.', start: 21, end: 57 });
  });
  it('rejects a fabricated quote even when a valid source ID is used', () => {
    const result = validateSuggestions(application, sources, suggestion('I have a 4.0 GPA.'));
    expect(result.answers.reason).toBeUndefined();
    expect(result.rejected).toHaveLength(1);
  });
  it('rejects a nonexistent source', () => {
    const raw = suggestion(); raw.answers[0].evidence[0].sourceId = 'forged';
    expect(validateSuggestions(application, sources, raw).answers.reason).toBeUndefined();
  });
  it('requires evidence for a generated answer', () => {
    const raw = suggestion(); raw.answers[0].evidence = [];
    expect(validateSuggestions(application, sources, raw).answers.reason).toBeUndefined();
  });
  it('does not accept an answer to a field that does not exist', () => {
    const raw = suggestion(); raw.answers[0].fieldId = 'bank';
    expect(Object.keys(validateSuggestions(application, sources, raw).answers)).toHaveLength(0);
  });
  it('rejects duplicate field proposals rather than silently choosing one', () => {
    const raw = suggestion(); raw.answers.push({ ...raw.answers[0], value: 'Conflicting answer' });
    expect(validateSuggestions(application, sources, raw).answers.reason).toBeUndefined();
  });
  it('rejects malformed JSON structures and oversized answers', () => {
    expect(() => validateSuggestions(application, sources, { answers: 'bad' })).toThrow();
    const raw = suggestion(); raw.answers[0].value = 'x'.repeat(201);
    expect(validateSuggestions(application, sources, raw).answers.reason).toBeUndefined();
  });
  it('exact mode only fills explicitly labeled values and leaves inferred facts empty', () => {
    const result = exactMatches(application, sources);
    expect(result.answers.name.value).toBe('Maya Chen');
    expect(result.answers.name.origin).toBe('exact');
    expect(result.answers.reason).toBeUndefined();
    expect(result.answers.extra).toBeUndefined();
  });
  it('conflicting explicit values stay unanswered', () => {
    const result = exactMatches(application, [...sources, { id: 'other', name: 'Other note', text: 'Full name: Jamie Park' }]);
    expect(result.answers.name).toBeUndefined();
  });
  it('does not accept an invented amount supported by an unrelated real quote', () => {
    const form: Application = { ...application, fields: [{ ...application.fields[0], id: 'amount', kind: 'number' }] };
    const raw = { answers: [{ fieldId: 'amount', value: '450', evidence: [{ sourceId: 'notes', quote: 'My laptop stopped working on Monday.' }] }] };
    expect(validateSuggestions(form, sources, raw).answers.amount).toBeUndefined();
  });
  it('accepts a plain-language guide only for an existing question', () => {
    const result = validateSuggestions(application, sources, { answers: [], guides: [{ fieldId: 'reason', plainLanguage: 'What happened, and how would support help?' }, { fieldId: 'forged', plainLanguage: 'Invented question' }] });
    expect(result.guides).toEqual({ reason: 'What happened, and how would support help?' });
  });
});

describe('human review and export', () => {
  it('blocks export when a required answer is missing', () => {
    expect(canExport(application, { name: answer('name', 'Maya Chen') })).toBe(false);
    expect(() => exportPacket(application, {})).toThrow();
  });
  it('blocks export for an unreviewed answer including an optional one', () => {
    const answers = { name: answer('name', 'Maya Chen'), reason: answer('reason', 'I need a working laptop.'), extra: answer('extra', 'Extra detail', false) };
    expect(canExport(application, answers)).toBe(false);
  });
  it('allows optional blanks and includes actual answers in the packet', () => {
    const answers = { name: answer('name', 'Maya Chen'), reason: answer('reason', 'I need a working laptop.') };
    expect(canExport(application, answers)).toBe(true);
    const packet = exportPacket(application, answers);
    expect(packet).toContain('Full name\nMaya Chen');
    expect(packet).toContain('I need a working laptop.');
    expect(packet).toContain('Not submitted');
  });
  it('editing a reviewed model answer removes old evidence and review', () => {
    const previous: Answer = { ...answer('reason', 'Old answer'), origin: 'ai', evidence: [{ sourceId: 'notes', quote: 'old', start: 0, end: 3 }] };
    expect(editAnswer(previous, 'Corrected answer')).toEqual({ fieldId: 'reason', value: 'Corrected answer', reviewed: false, evidence: [], origin: 'person' });
  });
  it('does not accept invalid email and nonfinite or negative amounts', () => {
    const email = { ...application.fields[0], kind: 'email' as const };
    const number = { ...application.fields[0], kind: 'number' as const };
    expect(fieldError(email, 'wrong')).toBeTruthy();
    expect(fieldError(email, 'maya@example.com')).toBeNull();
    expect(fieldError(number, 'Infinity')).toBeTruthy();
    expect(fieldError(number, '-1')).toBeTruthy();
    expect(fieldError(number, '450')).toBeNull();
  });
});
