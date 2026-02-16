import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  const users = await User.find({}, '-passwordHash');
  res.json(users);
});

// Create user (admin only)
router.post('/', authenticateToken, async (req, res) => {
  const { userId, name, role, trade, salary, phone, password } = req.body;
  if (!userId || !name || !role || !password) return res.status(400).json({ error: 'Missing fields' });
  const exists = await User.findOne({ userId });
  if (exists) return res.status(400).json({ error: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ userId, name, role, trade, salary, phone, passwordHash });
  await user.save();
  res.status(201).json({ message: 'User created' });
});

export default router;
