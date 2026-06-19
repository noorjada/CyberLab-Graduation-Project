/**
 * Merge D: dev MongoDB into C: original (primary) cyberlab database.
 *
 * Usage:
 *   node scripts/merge-databases.js
 *
 * Requires:
 *   - PRIMARY on mongodb://127.0.0.1:27017/cyberlab (original C: data)
 *   - SECONDARY on mongodb://127.0.0.1:27019/cyberlab (D: dev export instance)
 *
 * Or run merge-databases.ps1 which orchestrates both instances.
 */
const mongoose = require('mongoose');

const PRIMARY = process.env.PRIMARY_URI || 'mongodb://127.0.0.1:27017/cyberlab';
const SECONDARY = process.env.SECONDARY_URI || 'mongodb://127.0.0.1:27019/cyberlab';

// Collections to merge: copy docs from secondary only if no matching unique key exists
const MERGE_PLAN = [
  {
    name: 'users',
    match: (doc) => ({ email: doc.email }),
    label: (doc) => doc.email,
  },
  {
    name: 'challenges',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'studyplans',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'exams',
    match: (doc) => ({ title: doc.title }),
    label: (doc) => doc.title,
  },
  {
    name: 'referencearticles',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'learningpaths',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'courses',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'theorymodules',
    match: (doc) => ({ slug: doc.slug }),
    label: (doc) => doc.slug || doc.title,
  },
  {
    name: 'notifications',
    match: (doc) => ({ _id: doc._id }),
    label: (doc) => String(doc._id),
  },
];

async function mergeCollection(primaryDb, secondaryDb, plan) {
  const { name, match, label } = plan;
  const collections = await primaryDb.listCollections().toArray();
  const names = collections.map((c) => c.name);
  const secondaryNames = (await secondaryDb.listCollections().toArray()).map((c) => c.name);

  if (!secondaryNames.includes(name)) {
    return { name, skipped: true, reason: 'not on secondary' };
  }

  const primaryCol = primaryDb.collection(name);
  const secondaryCol = secondaryDb.collection(name);
  const secondaryDocs = await secondaryCol.find({}).toArray();

  let inserted = 0;
  let skipped = 0;

  for (const doc of secondaryDocs) {
    const query = match(doc);
    const hasNullKey = Object.values(query).some((v) => v == null || v === '');
    if (hasNullKey) {
      const exists = await primaryCol.findOne({ _id: doc._id });
      if (exists) {
        skipped++;
        continue;
      }
    } else {
      const exists = await primaryCol.findOne(query);
      if (exists) {
        skipped++;
        continue;
      }
    }

    const { _id, ...rest } = doc;
    try {
      await primaryCol.insertOne({ _id, ...rest });
      inserted++;
      console.log(`    + ${name}: ${label(doc)}`);
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  return { name, inserted, skipped, total: secondaryDocs.length };
}

async function main() {
  console.log('\n🔗 CyberLab database merge\n');
  console.log(`  Primary (keep all):   ${PRIMARY}`);
  console.log(`  Secondary (add new):  ${SECONDARY}\n`);

  const primaryConn = await mongoose.createConnection(PRIMARY).asPromise();
  const secondaryConn = await mongoose.createConnection(SECONDARY).asPromise();

  const primaryDb = primaryConn.db;
  const secondaryDb = secondaryConn.db;

  const primaryUsers = await primaryDb.collection('users').countDocuments();
  const secondaryUsers = await secondaryDb.collection('users').countDocuments();
  console.log(`  Users before — primary: ${primaryUsers}, secondary: ${secondaryUsers}\n`);

  const results = [];
  for (const plan of MERGE_PLAN) {
    const r = await mergeCollection(primaryDb, secondaryDb, plan);
    results.push(r);
    if (!r.skipped) {
      console.log(`  ${r.name}: +${r.inserted} new, ${r.skipped} already existed (${r.total} on secondary)`);
    }
  }

  // Merge any other secondary collections not in plan (generic by _id)
  const planned = new Set(MERGE_PLAN.map((p) => p.name));
  const secondaryCols = (await secondaryDb.listCollections().toArray()).map((c) => c.name);
  for (const colName of secondaryCols) {
    if (planned.has(colName) || colName.startsWith('system.')) continue;
    const primaryCol = primaryDb.collection(colName);
    const secondaryCol = secondaryDb.collection(colName);
    const docs = await secondaryCol.find({}).toArray();
    let inserted = 0;
    let skipped = 0;
    for (const doc of docs) {
      const exists = await primaryCol.findOne({ _id: doc._id });
      if (exists) {
        skipped++;
        continue;
      }
      try {
        await primaryCol.insertOne(doc);
        inserted++;
      } catch (err) {
        if (err.code === 11000) skipped++;
        else throw err;
      }
    }
    if (docs.length > 0) {
      console.log(`  ${colName}: +${inserted} new, ${skipped} skipped (${docs.length} on secondary)`);
      results.push({ name: colName, inserted, skipped, total: docs.length });
    }
  }

  const finalUsers = await primaryDb.collection('users').countDocuments();
  const najah = await primaryDb.collection('users').findOne({ email: 's12113474@stu.najah.edu' });

  console.log(`\n✅ Merge complete. Users in unified DB: ${finalUsers}`);
  if (najah) {
    console.log(`   Found: s12113474@stu.najah.edu (${najah.username})`);
  } else {
    console.log('   Note: s12113474@stu.najah.edu not found — register or check original backup.');
  }

  const emails = await primaryDb.collection('users').find({}).project({ email: 1, username: 1, role: 1 }).toArray();
  console.log('\n  All accounts:');
  for (const u of emails) {
    console.log(`    • ${u.email} (${u.username}, ${u.role || 'user'})`);
  }

  await primaryConn.close();
  await secondaryConn.close();
  console.log('');
}

main().catch((err) => {
  console.error('Merge failed:', err.message);
  process.exit(1);
});
