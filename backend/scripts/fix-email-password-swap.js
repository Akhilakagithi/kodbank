/**
 * One-time fix: email and password were stored in wrong columns during registration.
 * This script swaps them so existing users can log in.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function fix() {
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
    await conn.query(`
      UPDATE koduser SET email = password, password = email
    `);
    console.log('Swapped email and password columns. Existing users can now log in with their original password.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

fix();
