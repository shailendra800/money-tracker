const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super_secret_key_change_this_in_prod'; // In a real app, use env var

app.use(cors());
app.use(express.json());

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        const info = stmt.run(username, hashedPassword);
        res.status(201).json({ id: info.lastInsertRowid, username });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);

        if (!user) return res.status(400).json({ error: 'User not found' });

        if (await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
            res.json({ token, user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transaction Routes
app.get('/api/transactions', authenticateToken, (req, res) => {
    const { month, year } = req.query;
    try {
        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [req.user.id];

        if (year) {
            query += " AND strftime('%Y', date) = ?";
            params.push(year);
        }
        if (month) {
            query += " AND strftime('%m', date) = ?";
            params.push(month.toString().padStart(2, '0'));
        }

        query += ' ORDER BY date DESC';

        const stmt = db.prepare(query);
        const transactions = stmt.all(...params);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const { type, amount, description, date } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(req.user.id, type, amount, description, date);
        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    const { type, amount, description, date } = req.body;
    const { id } = req.params;
    try {
        const stmt = db.prepare('UPDATE transactions SET type = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?');
        const info = stmt.run(type, amount, description, date, id, req.user.id);

        if (info.changes === 0) return res.status(404).json({ error: 'Transaction not found or unauthorized' });

        res.json({ id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
        const info = stmt.run(id, req.user.id);

        if (info.changes === 0) return res.status(404).json({ error: 'Transaction not found or unauthorized' });

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/summary', authenticateToken, (req, res) => {
    const { month, year } = req.query;
    try {
        let query = `
            SELECT type, SUM(amount) as total 
            FROM transactions 
            WHERE user_id = ?
        `;
        const params = [req.user.id];

        if (year) {
            query += " AND strftime('%Y', date) = ?";
            params.push(year);
        }
        if (month) {
            query += " AND strftime('%m', date) = ?";
            params.push(month.toString().padStart(2, '0'));
        }

        query += ' GROUP BY type';

        const stmt = db.prepare(query);
        const rows = stmt.all(...params);

        const summary = { earn: 0, spend: 0, invest: 0 };
        rows.forEach(row => {
            summary[row.type] = row.total;
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
