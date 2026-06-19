const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const Notification = require('../models/Notification');

const router = express.Router();

// Register
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = verifyToken;
    await user.save({ validateBeforeSave: false });

    try {
      await sendWelcomeEmail(user.email, user.username, verifyToken);
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        level: user.level,
        role: user.role,
        solvedChallenges: user.solvedChallenges,
        badges: user.badges,
        completedModules: user.completedModules
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        user.loginAttempts = 0;
        await user.save({ validateBeforeSave: false });

        // Lockout notification
        await Notification.create({
          user: user._id,
          title: '🔒 Account Locked',
          message: 'Your account has been locked for 15 minutes due to too many failed login attempts.',
          type: 'system',
          icon: '🔒',
          link: '/profile'
        });

        return res.status(423).json({
          message: 'Too many failed attempts. Account locked for 15 minutes.'
        });
      }

      await user.save({ validateBeforeSave: false });

      // Failed login notification
      await Notification.create({
        user: user._id,
        title: '⚠️ Failed Login Attempt',
        message: `Someone tried to login to your account with the wrong password. ${5 - user.loginAttempts} attempts remaining before lockout.`,
        type: 'system',
        icon: '⚠️',
        link: '/profile'
      });

      return res.status(400).json({
        message: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.`
      });
    }

    // Reset on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    user.lastActiveDate = new Date();
    await user.save({ validateBeforeSave: false });

    const { recordDailyActive } = require('../utils/recordDailyActive');
    const { recordParticipation } = require('../utils/attendance');
    recordDailyActive(user._id);
    recordParticipation(user._id);

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        level: user.level,
        xp: user.xp,
        dailyStreak: user.dailyStreak,
        role: user.role,
        solvedChallenges: user.solvedChallenges,
        badges: user.badges,
        completedModules: user.completedModules,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        careerPath: user.careerPath,
        currentTrack: user.currentTrack
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, resetToken, user.username);

    res.json({ message: 'Password reset email sent! Check your inbox.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Password reset notification
    await Notification.create({
      user: user._id,
      title: '🔐 Password Reset',
      message: 'Your password was reset successfully. If you did not do this, contact support immediately.',
      type: 'system',
      icon: '🔐',
      link: '/profile'
    });

    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({ emailVerifyToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    await Notification.create({
      user: user._id,
      title: '✅ Email Verified',
      message: 'Your email has been verified successfully. Welcome to CyberLab!',
      type: 'system',
      icon: '✅',
      link: '/dashboard'
    });

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = verifyToken;
    await user.save({ validateBeforeSave: false });

    await sendWelcomeEmail(user.email, user.username, verifyToken);
    res.json({ message: 'Verification email resent!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (logged in)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Password change notification
    await Notification.create({
      user: req.user.userId,
      title: '🔐 Password Changed',
      message: 'Your password was successfully changed. If you did not do this, contact support immediately.',
      type: 'system',
      icon: '🔐',
      link: '/profile'
    });

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;