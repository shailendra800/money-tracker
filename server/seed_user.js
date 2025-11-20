const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    const passwordHash = await bcrypt.hash('admin', 10);
    try {
        const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        stmt.run('admin', passwordHash);
        console.log('User admin created');
    } catch (e) {
        console.log('User admin likely already exists');
    }
}

seed();
