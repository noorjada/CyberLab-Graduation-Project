const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Challenge = require('./models/Challenge');
const Lab = require('./models/Lab');
const { getTheoryForItem } = require('./data/theoryLessons');
const { getLearningObjectives } = require('./data/learningObjectives');

dotenv.config();

async function seedTheory() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let challengeCount = 0;
  let labCount = 0;

  const challenges = await Challenge.find({});
  for (const c of challenges) {
    const theoryLesson = getTheoryForItem(c.title, c.category);
    const learningObjectives = getLearningObjectives(c.title, c.category);
    await Challenge.updateOne({ _id: c._id }, { $set: { theoryLesson, learningObjectives } });
    challengeCount++;
    console.log(`  ✓ Challenge: ${c.title}`);
  }

  const labs = await Lab.find({});
  for (const l of labs) {
    const theoryLesson = getTheoryForItem(l.title, l.category);
    const learningObjectives = getLearningObjectives(l.title, l.category);
    await Lab.updateOne({ _id: l._id }, { $set: { theoryLesson, learningObjectives } });
    labCount++;
    console.log(`  ✓ Lab: ${l.title}`);
  }

  console.log(`\nTheory + learning objectives applied: ${challengeCount} challenges, ${labCount} labs.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedTheory().catch((err) => {
  console.error(err);
  process.exit(1);
});
