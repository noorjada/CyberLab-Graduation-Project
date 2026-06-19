const DailyActiveUser = require('../models/DailyActiveUser');

const todayKey = () => new Date().toISOString().slice(0, 10);

const recordDailyActive = async (userId) => {
  if (!userId) return;
  try {
    await DailyActiveUser.findOneAndUpdate(
      { date: todayKey(), user: userId },
      {},
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err.code !== 11000) {
      console.error('DAU record failed:', err.message);
    }
  }
};

module.exports = { recordDailyActive, todayKey };
