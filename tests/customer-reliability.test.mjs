import assert from 'node:assert/strict';
import test from 'node:test';
import { sessionExpired, tokenExpiry } from '../src/services/session.js';
import { parseActionPlan } from '../src/services/actionPlan.js';
const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
test('Expiry rejects old and malformed sessions and retains live sessions', () => {
  assert.equal(tokenExpiry(token(100)), 100000);
  assert.equal(sessionExpired(token(100), 99999), false);
  assert.equal(sessionExpired(token(100), 100000), true);
  for (const value of [null, '', 'invalid', 'header.e30.signature']) assert.equal(sessionExpired(value), true);
});
const analysis = { finding: 'Fuel', reason: 'Combustion', recommendation: 'Measure', assumptions: [] };
const action = { title: 'Audit', priority: 'High', timeframe: 'This quarter', expected_impact: 'Lower consumption', why_it_matters: 'Largest source', steps: ['Measure'] };
const plan = { executive_summary: 'Summary', measurement: 'Track monthly', top_priority: { title: 'Energy', why_now: 'Largest source' }, scope_analysis: [1, 2, 3].map(scope => ({ ...analysis, scope })), company_analysis: analysis, actions: Array.from({ length: 4 }, () => ({ ...action })) };
test('Complete saved advice renders without invented action details', () => {
  assert.deepEqual(parseActionPlan(JSON.stringify(plan)), plan);
});
test('Incomplete advice and missing reasons are rejected', () => {
  for (const edit of [{ actions: [{}, {}, {}, {}] }, { executive_summary: '' }, { scope_analysis: [analysis] }, { measurement: '' }, { top_priority: {} }]) assert.equal(parseActionPlan(JSON.stringify({ ...plan, ...edit })), null);
  for (const edit of [{ why_it_matters: '' }, { steps: [] }, { steps: [''] }, { priority: 'Urgent' }]) assert.equal(parseActionPlan(JSON.stringify({ ...plan, actions: [{ ...action, ...edit }, ...plan.actions.slice(1)] })), null);
});

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
globalThis.sessionStorage = new Storage();
globalThis.localStorage = new Storage();
globalThis.window = new EventTarget();
const { api, isAuthenticated } = await import('../src/services/api.js');
let expiryEvents = 0;
window.addEventListener('carbonai:session-expired', () => expiryEvents++);
const liveToken = () => token(Math.floor(Date.now() / 1000) + 3600);
const unauthorized = config => Object.assign(new Error('Unauthorized'), { config, response: { status: 401 } });
test('Expired protected requests clear credentials and notify UI before sending', async () => {
  sessionStorage.setItem('access_token', token(1)); sessionStorage.setItem('user', 'old user');
  let sent = false; const before = expiryEvents;
  await assert.rejects(api.get('/results', { adapter: async () => { sent = true; } }), /session expired/);
  assert.equal(sent, false); assert.equal(sessionStorage.getItem('access_token'), null);
  assert.equal(sessionStorage.getItem('user'), null); assert.equal(expiryEvents, before + 1);
});
test('Server 401 clears the matching session, while stale 401 preserves newer login', async () => {
  sessionStorage.setItem('access_token', liveToken());
  await assert.rejects(api.get('/results', { adapter: async config => { throw unauthorized(config); } }));
  assert.equal(sessionStorage.getItem('access_token'), null);
  const old = liveToken(); const newer = token(Math.floor(Date.now() / 1000) + 7200);
  sessionStorage.setItem('access_token', old);
  await assert.rejects(api.get('/results', { adapter: async config => { sessionStorage.setItem('access_token', newer); throw unauthorized(config); } }));
  assert.equal(sessionStorage.getItem('access_token'), newer);
});
test('Login requests are allowed despite stale stored tokens; reload rejects expired session', async () => {
  sessionStorage.setItem('access_token', token(1));
  const response = await api.post('/auth/signin', {}, { adapter: async config => ({ status: 200, data: { ok: true }, headers: {}, config }) });
  assert.equal(response.data.ok, true);
  assert.equal(isAuthenticated(), false); assert.equal(sessionStorage.getItem('access_token'), null);
});
