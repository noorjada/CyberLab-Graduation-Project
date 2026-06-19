const { assertNotInExam, EXAM_LOCK_MESSAGE } = require('../utils/examSession');

async function blockDuringExam(req, res, next) {
  try {
    await assertNotInExam(req.user.userId);
    next();
  } catch (err) {
    if (err.code === 'EXAM_IN_PROGRESS') {
      return res.status(403).json({
        message: EXAM_LOCK_MESSAGE,
        code: 'EXAM_IN_PROGRESS',
        examSession: err.session
      });
    }
    next(err);
  }
}

module.exports = blockDuringExam;
