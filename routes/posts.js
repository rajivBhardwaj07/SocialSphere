const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

router.get('/feed', protect, async (req, res) => {
  try {
    const ids = [req.user._id, ...req.user.following];
    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
      });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/explore', protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
      });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content required' });
    }
    let post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image: image || '',
    });
    post = await post.populate('author', 'username avatar');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
      });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.some((id) => String(id) === String(req.user._id));
    if (liked) {
      post.likes = post.likes.filter((id) => String(id) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
