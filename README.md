# Kodbank

A full-stack banking app with AIVEN MySQL, JWT authentication, and user dashboard with balance check and party popper animation.

## Features

- **Registration**: uid, username, password, email, phone, role (Customer only), default balance ₹100,000
- **Login**: Username/password validation, JWT generation (username as subject, role as claim), token stored in DB and sent as HTTP-only cookie
- **Dashboard**: Check balance button, JWT verification, balance display with canvas confetti animation

## Database (AIVEN MySQL)

### Tables

**koduser**
| Column   | Type           | Description                      |
|----------|----------------|----------------------------------|
| uid      | VARCHAR(36) PK | User ID                          |
| username | VARCHAR(100)   | Unique username                  |
| email    | VARCHAR(255)   | Email                            |
| password | VARCHAR(255)   | Bcrypt hashed password           |
| balance  | DECIMAL(15,2)  | Default 100000                   |
| phone    | VARCHAR(20)    | Phone number                     |
| role     | ENUM           | Customer, manager, admin         |

**usertoken**
| Column | Type | Description |
|--------|------|-------------|
| tid    | INT PK AUTO_INCREMENT | Token ID |
| token  | TEXT | JWT token |
| uid    | VARCHAR(36) FK | User ID |
| expiry | DATETIME | Token expiry |

## Setup

### 1. AIVEN MySQL

1. Create a MySQL service in [AIVEN Console](https://console.aiven.io/)
2. Copy connection details: host, port, user, password, database
3. If SSL is required, download CA cert (or use `rejectUnauthorized: true` with default system certs)

### 2. Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your AIVEN connection values:

```env
DB_HOST=your-project.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_SSL=true

JWT_SECRET=your-secure-random-secret
JWT_EXPIRY=24h

PORT=3001
```

### 3. Initialize Database

```bash
cd backend
npm install
node scripts/init-db.js
```

### 4. Run Server

```bash
npm start
```

Open http://localhost:3001

## Local MySQL (Development)

For local development without AIVEN:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=kodbank
DB_SSL=false
```

Create the database and run `node scripts/init-db.js`.

## API

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | /api/auth/register  | Register (uid, uname, password, email, phonenumber) |
| POST   | /api/auth/login     | Login (username, password), sets cookie |
| POST   | /api/auth/logout    | Logout, clears token           |
| GET    | /api/user/balance   | Get balance (requires JWT cookie) |
