import express from 'express';
import Advance from '../models/Advance.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all advances (admin/worker)
router.get('/', authenticateToken, async (req, res) => {
  const { workerId } = req.query;
  const filter = workerId ? { workerId } : {};
  const data = await Advance.find(filter);
  res.json(data);
});

// Create advance (worker)
router.post('/', authenticateToken, async (req, res) => {
  const { workerId, amount, requestDate } = req.body;
  if (!workerId || !amount || !requestDate) return res.status(400).json({ error: 'Missing fields' });
  const adv = new Advance({ workerId, amount, requestDate });
  await adv.save();
  res.status(201).json(adv);
});

// Update advance (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const adv = await Advance.findByIdAndUpdate(id, update, { new: true });
  if (!adv) return res.status(404).json({ error: 'Not found' });
  res.json(adv);
});

export default router;
