/**
 * Create default login accounts for local dev / mobile testing.
 * Usage: node seedUsers.js
 */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');

dotenv.config();

const USERS = [
  { username: 'admin', email: 'admin@cyberlab.com', password: 'admin123', role: 'admin' },
  { username: 'instructor', email: 'instructor@cyberlab.com', password: 'instructor123', role: 'instructor' },
  { username: 'student', email: 'student@cyberlab.com', password: 'student123', role: 'user' },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  skip  ${u.email} (already exists)`);
      continue;
    }
    const user = new User({
      username: u.username,
      email: u.email,
      password: u.password,
      role: u.role,
      emailVerified: true,
    });
    await user.save();
    console.log(`  added ${u.email} / ${u.password} (${u.role})`);
  }

  const total = await User.countDocuments();
  console.log(`\nDone. ${total} user(s) in database.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
