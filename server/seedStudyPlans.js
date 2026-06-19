const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StudyPlan = require('./models/StudyPlan');
const { STUDY_PLANS } = require('./data/studyPlansSeed');

dotenv.config();

async function seedStudyPlans() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const plan of STUDY_PLANS) {
    await StudyPlan.findOneAndUpdate(
      { slug: plan.slug },
      { $set: plan },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    console.log(`  ✓ Study plan: ${plan.title}`);
  }

  console.log(`\nSeeded ${STUDY_PLANS.length} study plans.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedStudyPlans().catch((err) => {
  console.error(err);
  process.exit(1);
});
