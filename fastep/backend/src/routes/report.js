import express from 'express';
import xlsx from 'xlsx';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Export attendance report to Excel
router.get('/attendance', authenticateToken, async (req, res) => {
  const { month, year } = req.query;
  const filter = {};
  if (month && year) {
    filter.date = { $regex: `^${year}-${month}` };
  }
  const data = await Attendance.find(filter);
  const users = await User.find();
  const userMap = Object.fromEntries(users.map(u => [u.userId, u.name]));
  const rows = data.map(a => ({
    Worker: userMap[a.workerId] || a.workerId,
    Date: a.date,
    In: a.inTime,
    Out: a.outTime,
    Lunch: a.lunch,
    TotalHours: a.totalHours,
    BaseHours: a.baseHours,
    Overtime: a.overtime,
    Status: a.status
  }));
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Attendance');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

export default router;
