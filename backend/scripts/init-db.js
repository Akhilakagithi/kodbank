const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDb() {
  let conn;
  const dbName = process.env.DB_NAME || 'kodbank';
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  };

  try {
    console.log('Connecting to MySQL at', baseConfig.host + ':' + baseConfig.port + '...');
    conn = await mysql.createConnection({ ...baseConfig });
    console.log('Connected.');

    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    } catch (e) {
      console.log('Database may already exist:', e.message);
    }
    await conn.query(`USE \`${dbName}\``);
    console.log('Using database:', dbName);

    console.log('Creating table koduser...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS koduser (
        uid VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 100000.00,
        phone VARCHAR(20) NOT NULL,
        role ENUM('Customer', 'manager', 'admin') NOT NULL DEFAULT 'Customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Creating table usertoken...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usertoken (
        tid INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        uid VARCHAR(36) NOT NULL,
        expiry DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES koduser(uid) ON DELETE CASCADE,
        INDEX idx_token (token(255)),
        INDEX idx_uid (uid),
        INDEX idx_expiry (expiry)
      )
    `);

    console.log('Database initialized successfully. Tables: koduser, usertoken');
  } catch (err) {
    console.error('Database initialization failed.');
    console.error('Message:', err && err.message);
    console.error('Code:', err && err.code);
    console.error('SQL:', err && err.sqlMessage);
    if (err && err.stack) console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

initDb();
