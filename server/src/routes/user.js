const express = require('express');
const { getPgPool, getMongoDb } = require('../config/database');
const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const pool = getPgPool();
    const result = await pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const db = getMongoDb();
    const documents = await db.collection('documents')
      .find({ $or: [{ createdBy: req.user.id }, { sharedWith: req.user.id }] })
      .toArray();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

module.exports = router;
