const mongoose = require('mongoose');

const dailyActiveUserSchema = new mongoose.Schema({
  date: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

dailyActiveUserSchema.index({ date: 1, user: 1 }, { unique: true });
dailyActiveUserSchema.index({ date: 1 });

module.exports = mongoose.model('DailyActiveUser', dailyActiveUserSchema);
