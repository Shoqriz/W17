const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Post = require('../models/Post');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post(
  '/posts',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = new Post({ title, content, author: userId });

    try {
      await post.save();
      res.json({ message: 'Post created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create the post' });
    }
  }
);

router.get('/posts', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const posts = await Post.find({ author: userId });
  res.json(posts);
});

router.put('/posts/:postId', authenticateToken, async (req, res) => {
  const postId = req.params.postId;
  const { title, content } = req.body;

  try {
    const post = await Post.findByIdAndUpdate(postId, { title, content }, { new: true });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update the post' });
  }
});

router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  try {
    const post = await Post.findOne({ _id: postId, author: userId });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or you do not have permission to delete it.' });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete the post' });
  }
});

module.exports = router;