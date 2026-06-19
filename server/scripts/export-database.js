/**
 * Export all collections from a MongoDB database to JSON files.
 * Usage: node scripts/export-database.js [uri] [outDir]
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const URI = process.argv[2] || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyberlab';
const OUT = process.argv[3] || path.join(__dirname, '..', 'backups', 'db-export');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const conn = await mongoose.createConnection(URI).asPromise();
  const db = conn.db;
  const cols = await db.listCollections().toArray();

  console.log(`Exporting ${URI} -> ${OUT}\n`);

  for (const { name } of cols) {
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(OUT, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
    console.log(`  ${name}: ${docs.length} documents`);
  }

  fs.writeFileSync(path.join(OUT, '_meta.json'), JSON.stringify({ uri: URI, exportedAt: new Date().toISOString(), collections: cols.map((c) => c.name) }, null, 2));
  await conn.close();
  console.log('\nExport done.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
