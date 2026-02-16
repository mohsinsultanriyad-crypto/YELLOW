import express from 'express';
import Leave from '../models/Leave.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

// GET /api/leaves
router.get('/', auth, async (req, res) => {
  const { workerId } = req.query;
  const filter = {};
  if (workerId) filter.workerId = workerId;
  const leaves = await Leave.find(filter).populate('workerId', 'name');
  res.json(leaves);
});

// POST /api/leaves (worker)
router.post('/', auth, role('worker'), async (req, res) => {
  const { fromDate, toDate, reason } = req.body;
  const leave = await Leave.create({
    workerId: req.user._id,
    fromDate,
    toDate,
    reason,
    status: 'pending',
  });
  res.status(201).json(leave);
});

// PUT /api/leaves/:id (admin approve/reject)
router.put('/:id', auth, role('admin', 'supervisor'), async (req, res) => {
  const { status } = req.body;
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status, approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!leave) return res.status(404).json({ message: 'Leave not found' });
  res.json(leave);
});

export default router;
