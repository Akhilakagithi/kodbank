const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

async function verifyToken(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT * FROM usertoken WHERE token = ? AND expiry > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

module.exports = { verifyToken };
