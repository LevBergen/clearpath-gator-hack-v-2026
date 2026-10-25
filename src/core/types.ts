export type Field = { id: string; label: string; plainLanguage: string; required: boolean; kind: 'short' | 'long' | 'email' | 'number'; maxLength?: number };
export type Application = { id: string; title: string; description: string; fields: Field[] };
export type Source = { id: string; name: string; text: string };
export type Evidence = { sourceId: string; quote: string; start: number; end: number };
export type Answer = { fieldId: string; value: string; evidence: Evidence[]; origin: 'ai' | 'exact' | 'person' | 'example'; reviewed: boolean };
export type Answers = Record<string, Answer>;
export type DraftResult = { answers: Answers; rejected: { fieldId: string; reason: string }[]; guides?: Record<string, string> };
export type Engine = { provider: 'google' | 'ollama' | 'exact'; model: string; available: boolean };
