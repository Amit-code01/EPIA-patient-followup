const express = require('express');
const controller = require('../controllers/followupController');
module.exports = db => { const router = express.Router(); const c = controller(db); router.post('/generate/:patientId', c.generate); router.get('/drafts', c.drafts); router.patch('/drafts/:id', c.edit); router.patch('/drafts/:id/approve', c.approve); return router; };
