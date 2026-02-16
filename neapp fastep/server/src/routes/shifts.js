import express from 'express';
import Shift from '../models/Shift.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

// GET /api/shifts
router.get('/', auth, async (req, res) => {
  const { workerId, date } = req.query;
  const filter = {};
  if (workerId) filter.workerId = workerId;
  if (date) filter.date = date;
  const shifts = await Shift.find(filter).populate('workerId', 'name');
  res.json(shifts);
});

// POST /api/shifts (worker)
router.post('/', auth, role('worker'), async (req, res) => {
  const { date, startTime, endTime, breakHours, totalHours, otHours, notes } = req.body;
  const shift = await Shift.create({
    workerId: req.user._id,
    date,
    startTime,
    endTime,
    breakHours,
    totalHours,
    otHours,
    notes,
    status: 'pending',
  });
  res.status(201).json(shift);
});

// PUT /api/shifts/:id (admin approve/reject)
router.put('/:id', auth, role('admin', 'supervisor'), async (req, res) => {
  const { status, approvedBy, approvedAt, notes } = req.body;
  const shift = await Shift.findByIdAndUpdate(
    req.params.id,
    { status, approvedBy: req.user._id, approvedAt: new Date(), notes },
    { new: true }
  );
  if (!shift) return res.status(404).json({ message: 'Shift not found' });
  res.json(shift);
});

export default router;
