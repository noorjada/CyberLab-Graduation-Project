const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  solvedChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  currentTrack: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  careerPath: {
    type: String,
    enum: ['pentester', 'soc', 'forensics', 'general'],
    default: 'general'
  },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  lastSolvedDate: { type: Date },
  dailyStreak: { type: Number, default: 0 },
  completedLabs:  { type: Number, default: 0 },
  completedPaths: { type: Number, default: 0 },
  achievements: [{
    name:        String,
    description: String,
    icon:        { type: String, default: '🏅' },
    unlockedAt:  { type: Date, default: Date.now }
  }],
  bookmarks: [{
    itemType: { type: String, enum: ['challenge', 'lab', 'path'] },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    addedAt: { type: Date, default: Date.now }
  }],
  hintsRevealed: [{
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    count: { type: Number, default: 0 }
  }],
  onboardingComplete: { type: Boolean, default: false },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  oauthProvider: { type: String },
  oauthId: { type: String },
  digestEnabled: { type: Boolean, default: true },
  studyPlanEnrollments: [{
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' },
    enrolledAt: { type: Date, default: Date.now },
    completedTopics: [{ type: String }],
    isActive: { type: Boolean, default: true }
  }],
  activeExamSession: {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    startedAt: { type: Date },
    expiresAt: { type: Date },
    focusWarnings: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);