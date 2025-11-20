const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'finance.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earn', 'spend', 'invest')),
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
