const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('emailVerified role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin' || user.emailVerified) {
      return next();
    }

    return res.status(403).json({
      message: 'Please verify your email before using this feature.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
