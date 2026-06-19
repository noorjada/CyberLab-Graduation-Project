const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['challenge', 'lab'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
});

ratingSchema.index({ itemType: 1, itemId: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
