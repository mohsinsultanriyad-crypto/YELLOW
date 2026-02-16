import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing credentials' });
  const user = await User.findOne({ userId });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.userId, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { userId: user.userId, name: user.name, role: user.role, trade: user.trade, salary: user.salary, phone: user.phone, documents: user.documents, expiryDates: user.expiryDates } });
});

export default router;
