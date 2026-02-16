import express from 'express';
import Advance from '../models/Advance.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

// GET /api/advances
router.get('/', auth, async (req, res) => {
  const { workerId } = req.query;
  const filter = {};
  if (workerId) filter.workerId = workerId;
  const advances = await Advance.find(filter).populate('workerId', 'name');
  res.json(advances);
});

// POST /api/advances (worker)
router.post('/', auth, role('worker'), async (req, res) => {
  const { amount, reason, requestDate } = req.body;
  const advance = await Advance.create({
    workerId: req.user._id,
    amount,
    reason,
    status: 'pending',
    requestDate,
  });
  res.status(201).json(advance);
});

// PUT /api/advances/:id (admin approve/reject)
router.put('/:id', auth, role('admin', 'supervisor'), async (req, res) => {
  const { status } = req.body;
  const advance = await Advance.findByIdAndUpdate(
    req.params.id,
    { status, approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!advance) return res.status(404).json({ message: 'Advance not found' });
  res.json(advance);
});

export default router;
