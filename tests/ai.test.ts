import { describe, expect, it } from 'vitest';
import { createGenerator, parseModelJson } from '../server/ai';
import { sampleApplication, sampleSources } from '../src/core/sample';

describe('model transport', () => {
  it('requests fast Gemma generation and ignores thought parts when reading JSON', async () => {
    const before = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-only-key';
    try {
      const fetcher: typeof fetch = async (_input, init) => {
        const payload = JSON.parse(String(init?.body));
        if (payload.generationConfig.thinkingConfig?.thinkingLevel !== 'minimal') throw new Error('Gemma thinking must be disabled for this bounded drafting task');
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'internal work', thought: true }, { text: '```json\n{"answers":[]}\n```' }] } }] }), { status: 200 });
      };
      const generate = createGenerator({ provider: 'google', model: 'gemma-4-26b-a4b-it', available: true }, fetcher);
      expect(await generate(sampleApplication, sampleSources)).toEqual({ answers: [] });
    } finally { if (before === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = before; }
  });
  it('accepts fenced JSON but never evaluates model text as code', () => {
    expect(parseModelJson('```json\n{"answers":[]}\n```')).toEqual({ answers: [] });
    expect(() => parseModelJson('process.exit(0)')).toThrow();
  });
});
