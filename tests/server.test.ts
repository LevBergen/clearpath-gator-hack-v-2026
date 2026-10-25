import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../server/app';
import type { AddressInfo } from 'node:net';
import { sampleApplication, sampleSources } from '../src/core/sample';

let server: Server;
let base: string;
beforeAll(async () => {
  const app = createApp({ engine: { provider: 'exact', model: 'Exact matches', available: false } });
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

const post = (body: unknown, origin?: string) => fetch(`${base}/api/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });

describe('draft boundary', () => {
  it('reports the actual provider without leaking configuration', async () => {
    const res = await fetch(`${base}/api/status`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ provider: 'exact', model: 'Exact matches', available: false });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
  it('performs genuine exact matching without pretending to call a model', async () => {
    const res = await post({ application: sampleApplication, sources: sampleSources });
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.engine.provider).toBe('exact');
    expect(result.answers.name.value).toBe('Maya Chen');
    expect(result.answers.circumstances).toBeUndefined();
    expect(result.answers.amount).toBeUndefined();
  });
  it('rejects malformed inputs and duplicate source identities', async () => {
    expect((await post({ application: {}, sources: [] })).status).toBe(400);
    expect((await post({ application: sampleApplication, sources: [sampleSources[0], sampleSources[0]] })).status).toBe(400);
  });
  it('rejects an oversized note before invoking a model', async () => {
    const res = await post({ application: sampleApplication, sources: [{ id: 'huge', name: 'Huge', text: 'x'.repeat(16001) }] });
    expect(res.status).toBe(400);
  });
  it('rejects browser requests from a different origin', async () => {
    expect((await post({ application: sampleApplication, sources: sampleSources }, 'https://untrusted.example')).status).toBe(403);
  });
  it('does not allow reserved field keys', async () => {
    const malicious = { ...sampleApplication, fields: [{ ...sampleApplication.fields[0], id: '__proto__' }] };
    expect((await post({ application: malicious, sources: sampleSources })).status).toBe(400);
  });
});

describe('provider failures and output checks', () => {
  it('discards a provider answer with invented evidence', async () => {
    const app = createApp({ engine: { provider: 'google', model: 'test-provider', available: true }, generate: async () => ({ answers: [{ fieldId: 'amount', value: '450', evidence: [{ sourceId: 'my-notes', quote: 'I need 450 dollars.' }] }] }) });
    const local = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => local.once('listening', resolve));
    try {
      const res = await fetch(`http://127.0.0.1:${(local.address() as AddressInfo).port}/api/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ application: sampleApplication, sources: sampleSources }) });
      const body = await res.json();
      expect(body.answers.amount).toBeUndefined();
      expect(body.rejected).toHaveLength(1);
    } finally { await new Promise<void>(resolve => local.close(() => resolve())); }
  });
  it('returns a recoverable provider error without returning secret error content', async () => {
    const app = createApp({ engine: { provider: 'google', model: 'test-provider', available: true }, generate: async () => { throw new Error('secret-provider-debug-value'); } });
    const local = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => local.once('listening', resolve));
    try {
      const res = await fetch(`http://127.0.0.1:${(local.address() as AddressInfo).port}/api/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ application: sampleApplication, sources: sampleSources }) });
      expect(res.status).toBe(502);
      expect(await res.text()).not.toContain('secret-provider-debug-value');
    } finally { await new Promise<void>(resolve => local.close(() => resolve())); }
  });
});
