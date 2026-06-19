/**
 * Import exported JSON into primary DB (skip duplicates).
 * Usage: node scripts/import-merge.js [primaryUri] [exportDir]
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const PRIMARY = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyberlab';
const IN_DIR = process.argv[3] || path.join(__dirname, '..', 'backups', 'db-export');

const USER_MATCH = (doc) => ({ email: doc.email });
const SLUG_MATCH = (doc) => (doc.slug ? { slug: doc.slug } : null);

const MATCHERS = {
  users: USER_MATCH,
  challenges: SLUG_MATCH,
  studyplans: SLUG_MATCH,
  referencearticles: SLUG_MATCH,
  learningpaths: SLUG_MATCH,
  courses: SLUG_MATCH,
  theorymodules: SLUG_MATCH,
  exams: (doc) => (doc.title ? { title: doc.title } : null),
};

async function main() {
  if (!fs.existsSync(IN_DIR)) {
    console.error('Export dir not found:', IN_DIR);
    process.exit(1);
  }

  const conn = await mongoose.createConnection(PRIMARY).asPromise();
  const db = conn.db;
  const files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));

  console.log(`\nImporting into ${PRIMARY} from ${IN_DIR}\n`);

  for (const file of files) {
    const colName = file.replace(/\.json$/, '');
    const docs = JSON.parse(fs.readFileSync(path.join(IN_DIR, file), 'utf8'));
    if (!docs.length) continue;

    const col = db.collection(colName);
    const matcher = MATCHERS[colName];
    let inserted = 0;
    let skipped = 0;

    for (const doc of docs) {
      let exists = false;
      if (matcher) {
        const q = matcher(doc);
        if (q) exists = !!(await col.findOne(q));
      }
      if (!exists) exists = !!(await col.findOne({ _id: doc._id }));

      if (exists) {
        skipped++;
        continue;
      }

      try {
        const toInsert = { ...doc };
        if (typeof toInsert._id === 'string' && /^[a-f0-9]{24}$/i.test(toInsert._id)) {
          toInsert._id = new mongoose.Types.ObjectId(toInsert._id);
        }
        await col.insertOne(toInsert);
        inserted++;
      } catch (err) {
        if (err.code === 11000) skipped++;
        else throw err;
      }
    }

    console.log(`  ${colName}: +${inserted} new, ${skipped} skipped (${docs.length} in export)`);
  }

  const users = await db.collection('users').find({}).project({ email: 1, username: 1, role: 1 }).toArray();
  console.log(`\n✅ Unified database: ${users.length} user(s)`);
  for (const u of users) {
    console.log(`    • ${u.email} (${u.username})`);
  }

  const najah = users.find((u) => u.email === 's12113474@stu.najah.edu');
  if (najah) console.log('\n   ✓ s12113474@stu.najah.edu is available');

  await conn.close();
  console.log('');
}

main().catch((e) => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
