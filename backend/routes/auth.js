const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Register - role must be Customer only
router.post('/register', async (req, res) => {
  try {
    const uid = (req.body.uid || '').trim();
    const uname = (req.body.uname || '').trim();
    const password = req.body.password || '';
    const email = (req.body.email || '').trim();
    const phonenumber = (req.body.phonenumber || '').trim();
    const role = req.body.role;

    if (!uid || !uname || !password || !email || !phonenumber) {
      return res.status(400).json({
        success: false,
        message: 'uid, uname, password, email, phonenumber are required',
      });
    }

    const userRole = role === 'Customer' ? 'Customer' : 'Customer';

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      `INSERT INTO koduser (uid, username, email, password, balance, phone, role) 
       VALUES (?, ?, ?, ?, 100000.00, ?, ?)`,
      [uid, uname, email, hashedPassword, phonenumber, userRole]
    );

    console.log('[Register] User created:', uname);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login.',
      redirect: '/login.html',
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ success: false, message: 'Database tables not created. Run: node scripts/init-db.js' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(500).json({ success: false, message: 'Cannot connect to database. Ensure MySQL is running and .env is correct.' });
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_DBACCESS_DENIED_ERROR') {
      return res.status(500).json({ success: false, message: 'Database access denied. Check DB_USER and DB_PASSWORD in .env' });
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      return res.status(500).json({ success: false, message: "Database does not exist. Create it or run init-db.js." });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed: ' + (err.message || 'Unknown error') });
  }
});

// Login - validate username/password, generate JWT, store in DB, set cookie
router.post('/login', async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const [rows] = await pool.execute(
      'SELECT uid, username, password, role FROM koduser WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      console.log('[Login] No user found for username:', JSON.stringify(username));
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('[Login] Password mismatch for user:', username);
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { sub: username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
    );

    const expiryDate = new Date();
    const hours = JWT_EXPIRY.includes('h') ? parseInt(JWT_EXPIRY) : 24;
    expiryDate.setHours(expiryDate.getHours() + hours);

    await pool.execute(
      'INSERT INTO usertoken (token, uid, expiry) VALUES (?, ?, ?)',
      [token, user.uid, expiryDate]
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: hours * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      redirect: '/userdashboard.html',
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    await pool.execute('DELETE FROM usertoken WHERE token = ?', [token]);
  }
  res.clearCookie('token');
  res.json({ success: true });
});

module.exports = router;
