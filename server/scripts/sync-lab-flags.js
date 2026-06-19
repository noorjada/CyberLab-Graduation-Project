/**
 * Sync lab DB flags from Dockerfile on disk.
 * Usage: node scripts/sync-lab-flags.js [slug]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lab = require('../models/Lab');
const { resolveLabFlags } = require('../utils/labFlagSync');

const slug = process.argv[2] || 'xss-reflected';

async function main() {
  const dockerfilePath = path.join(__dirname, '..', 'docker-labs', slug, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    console.error('No Dockerfile for', slug);
    process.exit(1);
  }

  const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
  await mongoose.connect(process.env.MONGO_URI);

  const lab = await Lab.findOne({ slug });
  if (!lab) {
    console.error('No lab with slug', slug);
    process.exit(1);
  }

  const { flag, flags } = resolveLabFlags({
    slug,
    points: lab.points,
    flag: lab.flag,
    files: [{ path: 'Dockerfile', content: dockerfile }]
  });

  lab.flag = flag;
  lab.flags = flags;
  await lab.save();

  console.log('Synced', lab.title);
  console.log('  flag:', flag);
  console.log('  flags:', flags.map(f => `${f.label}: ${f.flag}`).join(', '));
  await mongoose.disconnect();
}

main();
