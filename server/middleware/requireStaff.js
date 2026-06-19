module.exports = (req, res, next) => {
  if (!['admin', 'instructor'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin or instructor access required' });
  }
  next();
};

module.exports.canManageChallenge = (challenge, userId, role) => {
  if (role === 'admin') return true;
  return challenge.createdBy?.toString() === userId;
};
