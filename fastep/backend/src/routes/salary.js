import express from 'express';
import Attendance from '../models/Attendance.js';
import Advance from '../models/Advance.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Calculate salary for a worker
router.get('/:workerId', authenticateToken, async (req, res) => {
  const { workerId } = req.params;
  const user = await User.findOne({ userId: workerId });
  if (!user) return res.status(404).json({ error: 'Worker not found' });
  const attendances = await Attendance.find({ workerId, status: 'admin-approved' });
  const advances = await Advance.find({ workerId, status: 'deducted' });
  const leaves = await Leave.find({ workerId, status: 'finalized' });

  // Salary calculation
  const baseSalary = user.salary || 0;
  const approvedOT = attendances.reduce((sum, a) => sum + (a.overtime || 0), 0);
  const otRate = (baseSalary / 30 / 10) * 1.5;
  const otPay = approvedOT * otRate;
  const advancesTotal = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const leaveDeductions = leaves.reduce((sum, l) => sum + (l.finalDeduction || 0), 0);
  const finalSalary = baseSalary + otPay - advancesTotal - leaveDeductions;

  res.json({
    baseSalary,
    approvedOT,
    otRate,
    otPay,
    advancesTotal,
    leaveDeductions,
    finalSalary
  });
});

export default router;
