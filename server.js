const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test DB connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('DB connection error:', err);
    } else {
        console.log('✅ Connected to PostgreSQL');
        release();
    }
});

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ BREAKDOWNS ============

// Get all active breakdowns
app.get('/api/breakdowns', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM breakdowns WHERE active = true ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all breakdowns (admin)
app.get('/api/breakdowns/all', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM breakdowns ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create breakdown
app.post('/api/breakdowns', async (req, res) => {
    const { name, emoji, steps, video_url, image_url, extra, contact, active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO breakdowns (name, emoji, steps, video_url, image_url, extra, contact, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, emoji || '🔧', steps || [], video_url || '', image_url || '', extra || '', contact || 'fanis', active !== false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update breakdown
app.put('/api/breakdowns/:id', async (req, res) => {
    const { id } = req.params;
    const { name, emoji, steps, video_url, image_url, extra, contact, active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE breakdowns 
             SET name = $1, emoji = $2, steps = $3, video_url = $4, image_url = $5, 
                 extra = $6, contact = $7, active = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [name, emoji, steps, video_url, image_url, extra, contact, active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete breakdown
app.delete('/api/breakdowns/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM breakdowns WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============ ERRORS ============

// Get errors by system
app.get('/api/errors/:system', async (req, res) => {
    const { system } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM errors WHERE system = $1 AND active = true ORDER BY code',
            [system]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all errors (admin)
app.get('/api/errors/all', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM errors ORDER BY system, code'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create error
app.post('/api/errors', async (req, res) => {
    const { system, code, description, period, solution, image_url, contact, active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO errors (system, code, description, period, solution, image_url, contact, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [system, code, description, period || '', solution || [], image_url || '', contact || 'fanis', active !== false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update error
app.put('/api/errors/:id', async (req, res) => {
    const { id } = req.params;
    const { system, code, description, period, solution, image_url, contact, active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE errors 
             SET system = $1, code = $2, description = $3, period = $4, solution = $5, 
                 image_url = $6, contact = $7, active = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [system, code, description, period, solution, image_url, contact, active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete error
app.delete('/api/errors/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM errors WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============ CONTACTS ============

// Get all contacts
app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts');
        const contacts = {};
        result.rows.forEach(row => {
            contacts[row.name] = row.phone;
        });
        res.json(contacts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update contact
app.put('/api/contacts/:name', async (req, res) => {
    const { name } = req.params;
    const { phone } = req.body;
    try {
        const result = await pool.query(
            `UPDATE contacts SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 RETURNING *`,
            [phone, name]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============ ADMIN PASSWORD ============

// Check password
app.post('/api/admin/check', async (req, res) => {
    const { password } = req.body;
    try {
        const result = await pool.query(
            'SELECT value FROM settings WHERE key = $1',
            ['admin_password']
        );
        if (result.rows.length === 0) {
            return res.status(500).json({ error: 'Password not set' });
        }
        const hash = result.rows[0].value;
        const isValid = await bcrypt.compare(password, hash);
        res.json({ valid: isValid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Change password
app.post('/api/admin/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        // Verify old password
        const result = await pool.query(
            'SELECT value FROM settings WHERE key = $1',
            ['admin_password']
        );
        if (result.rows.length === 0) {
            return res.status(500).json({ error: 'Password not set' });
        }
        const hash = result.rows[0].value;
        const isValid = await bcrypt.compare(oldPassword, hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid old password' });
        }
        // Set new password
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE settings SET value = $1 WHERE key = $2',
            [newHash, 'admin_password']
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Reset password (to default)
app.post('/api/admin/reset-password', async (req, res) => {
    const { confirm } = req.body;
    if (confirm !== 'RESET') {
        return res.status(400).json({ error: 'Confirmation required' });
    }
    try {
        const defaultHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        await pool.query(
            'UPDATE settings SET value = $1 WHERE key = $2',
            [defaultHash, 'admin_password']
        );
        res.json({ success: true, password: 'fanis2024' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============ START SERVER ============

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
