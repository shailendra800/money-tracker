const db = require('./db');

const stmt = db.prepare('SELECT * FROM users');
const users = stmt.all();
console.log('Users in DB:', users);
