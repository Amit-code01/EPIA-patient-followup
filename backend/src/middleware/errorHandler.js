module.exports = (err, req, res, next) => { console.error(err.message); return res.status(500).json({ error: 'Internal server error' }); };
