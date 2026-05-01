const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.options('*', cors());
app.use(express.json());

// Логирование
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | IP: ${req.ip}`);
    next();
});

// PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
    if (err) console.error('❌ DB error:', err);
    else { console.log('✅ PostgreSQL connected'); release(); }
});

// ============ HELPERS ============
function toPgArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '{}';
    return '{' + arr.map(s => '"' + String(s).replace(/"/g, '\\"') + '"').join(',') + '}';
}

// ============ ROUTES ============

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ BREAKDOWNS ============

app.get('/api/breakdowns', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM breakdowns WHERE active = true ORDER BY sort_order, name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.get('/api/breakdowns/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM breakdowns ORDER BY sort_order, name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/breakdowns', async (req, res) => {
    const { name, emoji, steps, video_url, image_url, extra, contact, active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO breakdowns (name, emoji, steps, video_url, image_url, extra, contact, active, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [name, emoji || '🔧', toPgArray(steps), video_url || '', image_url || '', extra || '', contact || 'fanis', active !== false, req.body.sort_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST breakdowns error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.put('/api/breakdowns/:id', async (req, res) => {
    const { id } = req.params;
    const { name, emoji, steps, video_url, image_url, extra, contact, active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE breakdowns 
             SET name=$1, emoji=$2, steps=$3, video_url=$4, image_url=$5, 
                 extra=$6, contact=$7, active=$8, sort_order=$9, updated_at=CURRENT_TIMESTAMP
             WHERE id=$10 RETURNING *`,
            [name, emoji, toPgArray(steps), video_url, image_url, extra, contact, active, req.body.sort_order || 0, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT breakdowns error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.delete('/api/breakdowns/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM breakdowns WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/breakdowns/reorder', async (req, res) => {
    const { order } = req.body;
    try {
        await Promise.all(order.map(item => 
            pool.query('UPDATE breakdowns SET sort_order=$1 WHERE id=$2', [item.sort_order, item.id])
        ));
        res.json({ success: true });
    } catch (err) {
        console.error('POST reorder error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ============ ERRORS ============

app.get('/api/errors/:system', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM errors WHERE system = $1 AND active = true ORDER BY sort_order, code',
            [req.params.system]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.get('/api/errors/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM errors ORDER BY system, sort_order, code');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/errors', async (req, res) => {
    const { system, code, description, period, solution, image_url, contact, active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO errors (system, code, description, period, solution, image_url, contact, active, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [system, code, description, period || '', toPgArray(solution), image_url || '', contact || 'fanis', active !== false, req.body.sort_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST errors error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.put('/api/errors/:id', async (req, res) => {
    const { id } = req.params;
    const { system, code, description, period, solution, image_url, contact, active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE errors 
             SET system=$1, code=$2, description=$3, period=$4, solution=$5, 
                 image_url=$6, contact=$7, active=$8, sort_order=$9, updated_at=CURRENT_TIMESTAMP
             WHERE id=$10 RETURNING *`,
            [system, code, description, period, toPgArray(solution), image_url, contact, active, req.body.sort_order || 0, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT errors error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.delete('/api/errors/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM errors WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/errors/reorder', async (req, res) => {
    const { order } = req.body;
    try {
        await Promise.all(order.map(item => 
            pool.query('UPDATE errors SET sort_order=$1 WHERE id=$2', [item.sort_order, item.id])
        ));
        res.json({ success: true });
    } catch (err) {
        console.error('POST errors reorder error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ============ CONTACTS ============

app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts');
        const contacts = {};
        result.rows.forEach(row => { contacts[row.name] = row.phone; });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.put('/api/contacts/:name', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE contacts SET phone=$1, updated_at=CURRENT_TIMESTAMP WHERE name=$2 RETURNING *',
            [req.body.phone, req.params.name]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ============ ADMIN ============

app.post('/api/admin/check', async (req, res) => {
    try {
        const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
        if (result.rows.length === 0) return res.status(500).json({ error: 'Password not set' });
        const isValid = await bcrypt.compare(req.body.password, result.rows[0].value);
        res.json({ valid: isValid });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/admin/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
        if (result.rows.length === 0) return res.status(500).json({ error: 'Password not set' });
        const isValid = await bcrypt.compare(oldPassword, result.rows[0].value);
        if (!isValid) return res.status(401).json({ error: 'Invalid old password' });
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE settings SET value=$1 WHERE key=$2', [newHash, 'admin_password']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    if (req.body.confirm !== 'RESET') return res.status(400).json({ error: 'Confirmation required' });
    try {
        const defaultHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        await pool.query('UPDATE settings SET value=$1 WHERE key=$2', [defaultHash, 'admin_password']);
        res.json({ success: true, password: 'fanis2024' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
