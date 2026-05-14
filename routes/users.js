const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

router.get('/search', protect, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
    })
      .limit(20)
      .select('username avatar bio');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/suggestions', protect, async (req, res) => {
  try {
    const me = req.user;
    const exclude = [me._id, ...me.following];
    const users = await User.find({ _id: { $nin: exclude } })
      .limit(5)
      .select('username avatar bio');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const postCount = await Post.countDocuments({ author: user._id });
    res.json({ ...user.toJSON(), postCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { bio, avatar, username } = req.body;
    const user = await User.findById(req.user._id);
    if (username && username !== user.username) {
      const taken = await User.findOne({ username });
      if (taken) return res.status(400).json({ message: 'Username taken' });
      user.username = username;
    }
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "Can't follow yourself" });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user._id);
    const isFollowing = me.following.some((id) => String(id) === String(target._id));

    if (isFollowing) {
      me.following = me.following.filter((id) => String(id) !== String(target._id));
      target.followers = target.followers.filter((id) => String(id) !== String(me._id));
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await me.save();
    await target.save();
    res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
      followingCount: me.following.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/posts', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id })
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

module.exports = router;
