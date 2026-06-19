const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { sendDigestEmail } = require('./email');

async function sendWeeklyDigests() {
  if (!process.env.EMAIL_USER) return;

  const users = await User.find({ digestEnabled: { $ne: false }, emailVerified: true })
    .select('email username points dailyStreak xp')
    .limit(500);

  const newChallenges = await Challenge.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }
  });

  for (const user of users) {
    try {
      await sendDigestEmail(user, { newChallenges });
    } catch (err) {
      console.error(`Digest failed for ${user.email}:`, err.message);
    }
  }

  if (users.length > 0) {
    console.log(`Weekly digest sent to ${users.length} user(s)`);
  }
}

module.exports = { sendWeeklyDigests };
