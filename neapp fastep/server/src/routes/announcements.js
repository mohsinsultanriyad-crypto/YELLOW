import express from 'express';
import Announcement from '../models/Announcement.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

// GET /api/announcements
router.get('/', auth, async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
});

// POST /api/announcements (admin only)
router.post('/', auth, role('admin', 'supervisor'), async (req, res) => {
  const { title, message } = req.body;
  const announcement = await Announcement.create({
    title,
    message,
    createdBy: req.user._id,
  });
  res.status(201).json(announcement);
});

export default router;
