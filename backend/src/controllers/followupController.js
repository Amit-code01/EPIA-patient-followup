const { generateMessage } = require('../services/aiService');
function followupController(db) {
  return {
    async generate(req, res) {
      if (!/^\d+$/.test(req.params.patientId) || Number(req.params.patientId) < 1) return res.status(400).json({ error: 'Patient ID must be a positive integer' });
      const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.patientId);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      if (patient.followup_status === 'completed' || patient.next_followup_date !== new Date().toISOString().slice(0, 10)) return res.status(409).json({ error: 'Drafts can only be generated for patients due today with pending follow-up' });
      const generated = await generateMessage(patient);
      const result = db.prepare('INSERT INTO followup_drafts (patient_id,message,status,ai_provider) VALUES (?,?,\'pending\',?)').run(patient.id, generated.message, generated.provider);
      return res.status(201).json({ data: db.prepare('SELECT * FROM followup_drafts WHERE id=?').get(result.lastInsertRowid) });
    },
    drafts(req, res) { return res.json({ data: db.prepare('SELECT d.*, p.name AS patient_name FROM followup_drafts d JOIN patients p ON p.id=d.patient_id ORDER BY d.created_at DESC,d.id DESC').all() }); },
    edit(req, res) {
      if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) return res.status(400).json({ error: 'Draft ID must be a positive integer' });
      const draft = db.prepare('SELECT * FROM followup_drafts WHERE id=?').get(req.params.id);
      if (!draft) return res.status(404).json({ error: 'Draft not found' });
      if (draft.status !== 'pending') return res.status(409).json({ error: 'Approved drafts cannot be edited' });
      if (typeof req.body.message !== 'string' || !req.body.message.trim()) return res.status(400).json({ error: 'message must be a non-empty string' });
      db.prepare("UPDATE followup_drafts SET message=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.body.message.trim(), draft.id);
      return res.json({ data: db.prepare('SELECT * FROM followup_drafts WHERE id=?').get(draft.id) });
    },
    approve(req, res) {
      if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) return res.status(400).json({ error: 'Draft ID must be a positive integer' });
      const draft = db.prepare('SELECT * FROM followup_drafts WHERE id=?').get(req.params.id);
      if (!draft) return res.status(404).json({ error: 'Draft not found' });
      if (draft.status !== 'pending') return res.status(409).json({ error: 'Only pending drafts can be approved' });
      db.prepare("UPDATE followup_drafts SET status='approved',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(draft.id);
      return res.json({ data: db.prepare('SELECT * FROM followup_drafts WHERE id=?').get(draft.id), message: 'Draft approved. No message was sent.' });
    }
  };
}
module.exports = followupController;
