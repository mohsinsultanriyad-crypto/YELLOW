import express from 'express';
import Attendance from '../models/Attendance.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all attendance (admin/supervisor)
router.get('/', authenticateToken, async (req, res) => {
  const { workerId } = req.query;
  const filter = workerId ? { workerId } : {};
  const data = await Attendance.find(filter);
  res.json(data);
});

// Create attendance (worker)
router.post('/', authenticateToken, async (req, res) => {
  const { workerId, date, inTime, outTime, lunch, totalHours, baseHours, overtime, status, supervisorId } = req.body;
  if (!workerId || !date) return res.status(400).json({ error: 'Missing fields' });
  const att = new Attendance({ workerId, date, inTime, outTime, lunch, totalHours, baseHours, overtime, status, supervisorId });
  await att.save();
  res.status(201).json(att);
});

// Update attendance (supervisor/admin)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const att = await Attendance.findByIdAndUpdate(id, update, { new: true });
  if (!att) return res.status(404).json({ error: 'Not found' });
  res.json(att);
});

export default router;
