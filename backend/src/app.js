const express = require('express');
const cors = require('cors');
const patientRoutes = require('./routes/patientRoutes');
const followupRoutes = require('./routes/followupRoutes');
const errorHandler = require('./middleware/errorHandler');
function createApp(db) { const app = express(); app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' })); app.use(express.json({ limit: '20kb' })); app.get('/api/health', (req, res) => res.json({ status: 'ok' })); app.use('/api/patients', patientRoutes(db)); app.use('/api/followups', followupRoutes(db)); app.use((req, res) => res.status(404).json({ error: 'Route not found' })); app.use(errorHandler); return app; }
module.exports = { createApp };
