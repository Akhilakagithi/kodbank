const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function listUsers() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kodbank',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    });
    const [rows] = await conn.execute(
      'SELECT uid, username, email, role, balance, created_at FROM koduser ORDER BY created_at DESC'
    );
    console.log('Users in database:', rows.length);
    console.table(rows);
  } catch (err) {
    console.error('Error:', err.message || err.code);
  } finally {
    if (conn) await conn.end();
  }
}

listUsers();
