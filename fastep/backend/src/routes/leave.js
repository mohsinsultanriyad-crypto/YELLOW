import express from 'express';
import Leave from '../models/Leave.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all leaves (admin/worker)
router.get('/', authenticateToken, async (req, res) => {
  const { workerId } = req.query;
  const filter = workerId ? { workerId } : {};
  const data = await Leave.find(filter);
  res.json(data);
});

// Create leave (worker)
router.post('/', authenticateToken, async (req, res) => {
  const { workerId, type, reason } = req.body;
  if (!workerId || !type) return res.status(400).json({ error: 'Missing fields' });
  const leave = new Leave({ workerId, type, reason });
  await leave.save();
  res.status(201).json(leave);
});

// Update leave (admin/worker)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const leave = await Leave.findByIdAndUpdate(id, update, { new: true });
  if (!leave) return res.status(404).json({ error: 'Not found' });
  res.json(leave);
});

export default router;
