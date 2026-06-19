const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.get('/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ message: 'GitHub OAuth not configured' });
  }
  const redirectUri = `${process.env.CLIENT_URL || 'http://localhost:3000'}/oauth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  res.json({ url });
});

router.post('/github/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !process.env.GITHUB_CLIENT_ID) {
      return res.status(400).json({ message: 'OAuth not configured or missing code' });
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ message: 'GitHub auth failed' });
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'CyberLab' }
    });
    const ghUser = await userRes.json();

    let user = await User.findOne({ oauthProvider: 'github', oauthId: String(ghUser.id) });
    if (!user) {
      const email = ghUser.email || `${ghUser.login}@github.oauth`;
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          username: ghUser.login.substring(0, 20),
          email,
          password: require('crypto').randomBytes(32).toString('hex'),
          oauthProvider: 'github',
          oauthId: String(ghUser.id),
          emailVerified: true,
          onboardingComplete: false
        });
        await user.save();
      } else {
        user.oauthProvider = 'github';
        user.oauthId = String(ghUser.id);
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        level: user.level,
        role: user.role,
        xp: user.xp,
        onboardingComplete: user.onboardingComplete,
        theme: user.theme
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'OAuth failed' });
  }
});

module.exports = router;
