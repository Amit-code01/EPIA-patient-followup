const Database = require('better-sqlite3');
const path = require('node:path');

function createDatabase(file = process.env.DB_PATH || path.join(__dirname, '../../data/patients.db')) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0), phone TEXT NOT NULL,
    consultation_date TEXT NOT NULL, next_followup_date TEXT NOT NULL,
    followup_status TEXT NOT NULL DEFAULT 'pending' CHECK(followup_status IN ('pending','completed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_patients_due ON patients(next_followup_date, followup_status);
  CREATE TABLE IF NOT EXISTS followup_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK(length(trim(message)) > 0), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved')),
    ai_provider TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  return db;
}
module.exports = { createDatabase };
