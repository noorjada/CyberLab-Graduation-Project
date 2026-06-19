/**
 * Fix a lab's Dockerfile on disk and rebuild its Docker image.
 * Usage: node scripts/fix-and-rebuild-lab.js <slug>
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lab = require('../models/Lab');
const { normalizeDockerfile } = require('../utils/dockerfileNormalize');
const { buildLabImage } = require('../utils/labDockerBuilder');
const { resolveLabFlags } = require('../utils/labFlagSync');

const slug = process.argv[2] || 'xss-reflected';

async function main() {
  const dockerfilePath = path.join(__dirname, '..', 'docker-labs', slug, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    console.error('No Dockerfile at', dockerfilePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dockerfilePath, 'utf8');
  const fixed = normalizeDockerfile(raw);
  fs.writeFileSync(dockerfilePath, fixed);
  console.log('Dockerfile normalized.');

  await mongoose.connect(process.env.MONGO_URI);
  const lab = await Lab.findOne({ slug });
  if (!lab) {
    console.error('No lab in DB with slug', slug);
    process.exit(1);
  }

  const fixed = fs.readFileSync(dockerfilePath, 'utf8');
  const { flag, flags } = resolveLabFlags({
    slug,
    points: lab.points,
    files: [{ path: 'Dockerfile', content: fixed }]
  });
  lab.flag = flag;
  lab.flags = flags;
  lab.buildStatus = 'building';
  lab.buildError = '';
  await lab.save();
  console.log('Flags synced:', flag);

  try {
    const result = await buildLabImage(slug, lab.dockerImage);
    lab.buildStatus = 'ready';
    lab.isActive = true;
    lab.buildError = '';
    await lab.save();
    console.log('BUILD OK —', lab.dockerImage);
    console.log(result.log?.slice(-500) || '');
  } catch (err) {
    lab.buildStatus = 'failed';
    lab.buildError = err.message;
    await lab.save();
    console.error('BUILD FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
