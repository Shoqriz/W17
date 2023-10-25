const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { hasRole, authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// GET all users including moderators and bloggers (admin-only access)
router.get('/users', hasRole('admin'), async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// GET all posts created by bloggers
router.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// GET a post by ID
router.get('/posts/:postId', async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// DELETE a user by ID (admin-only access)
router.delete('/users/:userId', hasRole('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndRemove(userId);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus pengguna.' });
  }
});

module.exports = router;
