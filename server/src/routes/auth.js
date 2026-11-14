import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role = 'User', department = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const assignedRole = role === 'Planner' ? 'Planner' : 'User';

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(name.trim(), cleanEmail, password_hash, assignedRole, department);

    const newUser = db.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(newUser);

    return res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      created_at: user.created_at
    };

    const token = signToken(safeUser);

    return res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Current user profile
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching profile.' });
  }
});

export default router;
