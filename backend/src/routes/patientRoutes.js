const express = require('express');
const controller = require('../controllers/patientController');
module.exports = db => { const router = express.Router(); const c = controller(db); router.post('/', c.create); router.get('/', c.all); router.get('/due-today', c.due); router.patch('/:id/status', c.complete); return router; };
