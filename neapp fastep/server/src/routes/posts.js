import express from 'express';
import Post from '../models/Post.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/posts
router.get('/', auth, async (req, res) => {
  const posts = await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
  res.json(posts);
});

// POST /api/posts (worker)
router.post('/', auth, async (req, res) => {
  const { content, imageUrl } = req.body;
  const post = await Post.create({
    authorId: req.user._id,
    content,
    imageUrl,
  });
  res.status(201).json(post);
});

// DELETE /api/posts/:id (admin or author)
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
});

export default router;
