const mongoose = require('mongoose');

const userWriteupSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

userWriteupSchema.index({ challenge: 1, upvotes: -1 });

module.exports = mongoose.model('UserWriteup', userWriteupSchema);
