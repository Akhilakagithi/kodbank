const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Check balance - requires valid JWT, extracts username, fetches balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const username = req.user.sub;

    const [rows] = await pool.execute(
      'SELECT balance FROM koduser WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      balance: parseFloat(rows[0].balance),
    });
  } catch (err) {
    console.error('Balance fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch balance.' });
  }
});

module.exports = router;
