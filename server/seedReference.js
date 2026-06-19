const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ReferenceArticle = require('./models/ReferenceArticle');
const { articles } = require('./data/referenceSeed');

dotenv.config();

async function seedReference() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let created = 0;
    let updated = 0;

    for (const article of articles) {
      const result = await ReferenceArticle.findOneAndUpdate(
        { slug: article.slug },
        { $set: article },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`Reference seed complete: ${created} created, ${updated} updated (${articles.length} total).`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedReference();
