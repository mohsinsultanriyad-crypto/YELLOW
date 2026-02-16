import express from 'express';
import Announcement from '../models/Announcement.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all announcements
router.get('/', authenticateToken, async (req, res) => {
  const data = await Announcement.find();
  res.json(data);
});

// Create announcement
router.post('/', authenticateToken, async (req, res) => {
  const { content, authorId } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const ann = new Announcement({ content, authorId });
  await ann.save();
  res.status(201).json(ann);
});

export default router;
