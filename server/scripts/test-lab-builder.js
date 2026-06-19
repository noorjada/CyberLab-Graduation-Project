/**
 * End-to-end smoke test for AI Lab Builder APIs.
 * Run: node scripts/test-lab-builder.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Lab = require('../models/Lab');

const API = `http://localhost:${process.env.PORT || 5000}`;

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const results = [];
  const pass = (name, detail) => { results.push({ name, ok: true, detail }); console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`); };
  const fail = (name, detail) => { results.push({ name, ok: false, detail }); console.log(`❌ ${name} — ${detail}`); };

  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    fail('setup', 'No admin user in database');
    process.exit(1);
  }

  const token = jwt.sign(
    { userId: admin._id.toString(), role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 1. Health
  try {
    const health = await fetch(`${API}/api/health`);
    if (health.ok) pass('Server health', await health.json().then(r => r.status));
    else fail('Server health', `HTTP ${health.status}`);
  } catch (e) {
    fail('Server health', e.message);
    console.log('\nStart server: cd server && npm run dev');
    process.exit(1);
  }

  // 2. Lab builder list (admin)
  const list = await api('GET', '/api/lab-builder/labs', token);
  if (list.status === 200) pass('List labs', `${list.data.length} labs`);
  else fail('List labs', `${list.status} ${list.data.message || ''}`);

  // 3. AI generate lab
  const testSlug = `ai-test-${Date.now().toString(36)}`;
  let draft = null;
  const gen = await api('POST', '/api/ai/generate-lab', token, {
    prompt: 'Create an easy web lab: simple reflected XSS in a PHP search page. Keep Dockerfile minimal.'
  });
  if (gen.status === 200 && gen.data.draft?.files?.length) {
    draft = gen.data.draft;
    draft.slug = testSlug;
    draft.dockerImage = `cyberlab-${testSlug}`;
    pass('AI generate lab', `"${draft.title}" + Dockerfile (${draft.files[0].content.length} chars)`);
  } else {
    fail('AI generate lab', `${gen.status} ${gen.data.message || JSON.stringify(gen.data).slice(0, 200)}`);
  }

  // 4. Publish with Docker build
  if (draft) {
    const pub = await api('POST', '/api/lab-builder/publish', token, { draft, skipBuild: false });
    if (pub.status === 201 && pub.data.lab) {
      pass('Publish + Docker build', `lab id ${pub.data.lab._id}, status ${pub.data.lab.buildStatus}`);
    } else if (pub.status === 500 && pub.data.lab) {
      fail('Publish + Docker build', pub.data.buildError || pub.data.message);
    } else {
      fail('Publish + Docker build', `${pub.status} ${pub.data.message || ''}`);
    }

    // 5. Verify lab appears for students (isActive)
    const lab = await Lab.findOne({ slug: testSlug });
    if (lab?.buildStatus === 'ready' && lab.isActive) {
      pass('Lab live in DB', `${lab.title} · ${lab.dockerImage}`);
    } else if (lab) {
      fail('Lab live in DB', `buildStatus=${lab.buildStatus}, isActive=${lab.isActive}, error=${lab.buildError || 'none'}`);
    }

    // 6. Verify files on disk
    const fs = require('fs');
    const dockerfile = require('path').join(__dirname, '..', 'docker-labs', testSlug, 'Dockerfile');
    if (fs.existsSync(dockerfile)) pass('Files written', dockerfile);
    else fail('Files written', 'Dockerfile missing');

    // 7. Docker image exists
    const { execFileSync } = require('child_process');
    try {
      const out = execFileSync('docker', ['images', '-q', `cyberlab-${testSlug}`], { encoding: 'utf8' }).trim();
      if (out) pass('Docker image', `cyberlab-${testSlug}`);
      else fail('Docker image', 'image not found after build');
    } catch (e) {
      fail('Docker image', e.message);
    }

    // 8. Cleanup test lab
    if (lab) {
      const del = await api('DELETE', `/api/lab-builder/labs/${lab._id}`, token);
      if (del.status === 200) pass('Cleanup test lab', 'deleted');
      else fail('Cleanup test lab', del.data.message);
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await mongoose.disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
