const { validatePatient, validDate } = require('../utils/validation');
function patientController(db) {
  const list = db.prepare('SELECT * FROM patients ORDER BY created_at DESC, id DESC');
  return {
    create(req, res) {
      const errors = validatePatient(req.body);
      if (errors.length) return res.status(400).json({ error: 'Invalid patient data', details: errors });
      const p = req.body;
      const result = db.prepare('INSERT INTO patients (name,phone,consultation_date,next_followup_date) VALUES (?,?,?,?)').run(p.name.trim(), p.phone.trim(), p.consultation_date, p.next_followup_date);
      return res.status(201).json({ data: db.prepare('SELECT * FROM patients WHERE id=?').get(result.lastInsertRowid) });
    },
    all(req, res) { return res.json({ data: list.all() }); },
    due(req, res) { const today = req.query.date || new Date().toISOString().slice(0, 10); if (!validDate(today)) return res.status(400).json({ error: 'date must be valid YYYY-MM-DD' }); return res.json({ data: db.prepare("SELECT * FROM patients WHERE next_followup_date=? AND followup_status='pending' ORDER BY id").all(today) }); },
    complete(req, res) {
      if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) return res.status(400).json({ error: 'Patient ID must be a positive integer' });
      const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      db.prepare("UPDATE patients SET followup_status='completed' WHERE id=?").run(req.params.id);
      return res.json({ data: db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id) });
    }
  };
}
module.exports = patientController;
