const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const http = require('node:http');
const { createApp } = require('../src/app');
let db, app, patientId, draftId;
async function request(method, pathname, body) {
  const response = { status: 200, body: {}, headers: {} };
  const req = { method, path: pathname, url: pathname, originalUrl: pathname, headers: { 'content-type': 'application/json' }, body: body || {}, params: {}, query: {}, get(name) { return this.headers[name.toLowerCase()]; } };
  const res = {
    status(code) { response.status = code; return this; },
    json(payload) { response.body = payload; return this; },
    set(name, value) { response.headers[name.toLowerCase()] = value; return this; },
    setHeader(name, value) { response.headers[name.toLowerCase()] = value; },
    getHeaderNames() { return Object.keys(response.headers); },
    removeHeader(name) { delete response.headers[name.toLowerCase()]; },
    write() { return true; },
    getHeader(name) { return response.headers[name.toLowerCase()]; },
    end(payload) { if (payload) { try { response.body = JSON.parse(payload); } catch {} } return this; },
    send(payload) { response.body = payload; return this; }
  };
  await new Promise(resolve => { const next = err => { if (err) { response.status = 500; response.body = { error: err.message }; resolve(); } }; app.handle(req, res, next); setImmediate(resolve); });
  return response;
}
before(() => { db = new Database(':memory:'); db.pragma('foreign_keys = ON'); db.exec(`CREATE TABLE patients(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL,consultation_date TEXT NOT NULL,next_followup_date TEXT NOT NULL,followup_status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE followup_drafts(id INTEGER PRIMARY KEY AUTOINCREMENT,patient_id INTEGER NOT NULL REFERENCES patients(id),message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',ai_provider TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`); app=createApp(db); });
after(() => db.close());
test('creates and retrieves a patient', async () => { const r=await request('POST','/api/patients',{name:'Asha Mehta',phone:'+91 98765 43210',consultation_date:'2026-01-01',next_followup_date:new Date().toISOString().slice(0,10)}); assert.equal(r.status,201); patientId=r.body.data.id; assert.equal((await request('GET','/api/patients')).body.data.length,1); });
test('validates required fields, phone and real dates', async () => { assert.equal((await request('POST','/api/patients',{})).status,400); assert.equal((await request('POST','/api/patients',{name:'X',phone:'bad',consultation_date:'2026-02-30',next_followup_date:'2026-03-01'})).status,400); });
test('returns due patients and excludes completed patients', async () => { assert.equal((await request('GET','/api/patients/due-today')).body.data.length,1); await request('PATCH',`/api/patients/${patientId}/status`); assert.equal((await request('GET','/api/patients/due-today')).body.data.length,0); assert.equal((await request('PATCH','/api/patients/999/status')).status,404); });
test('generates mock draft, edits and requires explicit approval', async () => { db.prepare("UPDATE patients SET followup_status='pending',next_followup_date=? WHERE id=?").run(new Date().toISOString().slice(0,10),patientId); const generated=await request('POST',`/api/followups/generate/${patientId}`); assert.equal(generated.status,201); assert.equal(generated.body.data.ai_provider,'MOCK'); draftId=generated.body.data.id; assert.equal((await request('PATCH',`/api/followups/drafts/${draftId}`,{message:'Edited reminder'})).status,200); assert.equal((await request('PATCH',`/api/followups/drafts/${draftId}/approve`)).body.data.status,'approved'); assert.equal((await request('PATCH',`/api/followups/drafts/${draftId}/approve`)).status,409); assert.equal((await request('PATCH',`/api/followups/drafts/${draftId}`,{message:'again'})).status,409); assert.equal((await request('GET','/api/followups/drafts')).body.data[0].message,'Edited reminder'); });
test('invalid IDs return client errors and unknown routes return 404', async () => { assert.equal((await request('PATCH','/api/patients/no/status')).status,400); assert.equal((await request('GET','/api/nope')).status,404); });


