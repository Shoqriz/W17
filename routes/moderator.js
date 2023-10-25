const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { hasRole, authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// GET all bloggers (users) - Moderator-only access
router.get('/bloggers', hasRole('moderator'), async (req, res) => {
  const bloggers = await User.find({ role: 'blogger' });
  res.json(bloggers);
});

// GET all posts created by bloggers
router.get('/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// GET a post by ID
router.get('/posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).populate('author', 'username');
    if (!post) {
      return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mendapatkan konten.' });
  }
});

// DELETE a post by ID - Moderator-only access
router.delete('/posts/:postId', hasRole('moderator'), async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findByIdAndRemove(postId);
    if (!post) {
      return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    }
    res.json({ message: 'Konten berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus konten.' });
  }
});

module.exports = router;
