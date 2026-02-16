import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/users (admin only)
router.get('/', auth, role('admin', 'supervisor'), async (req, res) => {
  const users = await User.find({ role: 'worker' });
  res.json(users);
});

// POST /api/users (admin only)
router.post('/', auth, role('admin', 'supervisor'), async (req, res) => {
  const { name, email, password, role: userRole, phone, trade, nationality } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: userRole || 'worker', phone, trade, nationality });
  res.status(201).json(user);
});

// PUT /api/users/:id (admin only)
router.put('/:id', auth, role('admin', 'supervisor'), async (req, res) => {
  const { name, email, role: userRole, phone, trade, nationality, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role: userRole, phone, trade, nationality, isActive },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', auth, role('admin', 'supervisor'), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});

export default router;
