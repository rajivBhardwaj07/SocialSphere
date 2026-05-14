const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

router.post('/:postId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text required' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    let comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    });
    post.comments.push(comment._id);
    await post.save();
    comment = await comment.populate('author', 'username avatar');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
