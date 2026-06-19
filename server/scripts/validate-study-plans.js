/**
 * Validates study plan seed links against platform resources.
 * Usage: node scripts/validate-study-plans.js
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const { STUDY_PLANS } = require('../data/studyPlansSeed');
const {
  ALL_CHALLENGE_TITLES,
  ALL_LAB_TITLES,
  ALL_EXAM_SLUGS,
  ALL_REFERENCE_SLUGS,
  VALID_REFERENCE_CATEGORIES
} = require('../data/studyPlanResources');
const { articles } = require('../data/referenceSeed');

const INTERNAL_ROUTES = [
  '/labs', '/challenges', '/exams', '/reference', '/roadmap', '/soc',
  '/certificates', '/notes', '/terminal', '/exploits', '/virustotal', '/courses'
];

const REF_SLUGS = new Set(articles.map((a) => a.slug));

let errors = 0;
let warnings = 0;

function fail(msg) {
  errors++;
  console.error(`  ✗ ${msg}`);
}

function warn(msg) {
  warnings++;
  console.warn(`  ⚠ ${msg}`);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function validateLink(planSlug, topicId, lnk) {
  const ctx = `${planSlug} → ${topicId} → "${lnk.label}"`;

  if (!lnk.path) {
    fail(`${ctx}: missing path`);
    return;
  }

  if (lnk.type === 'external') {
    if (!/^https:\/\/.+/i.test(lnk.path)) {
      fail(`${ctx}: external link must use https — ${lnk.path}`);
    }
    return;
  }

  if (lnk.type === 'challenge' && lnk.resourceTitle) {
    if (!ALL_CHALLENGE_TITLES.includes(lnk.resourceTitle)) {
      warn(`${ctx}: challenge title not in canonical list — ${lnk.resourceTitle}`);
    }
    if (!lnk.path.includes('open=')) {
      fail(`${ctx}: challenge link missing open= param`);
    }
    return;
  }

  if (lnk.type === 'lab' && lnk.resourceTitle) {
    if (!ALL_LAB_TITLES.includes(lnk.resourceTitle)) {
      warn(`${ctx}: lab title not in canonical list — ${lnk.resourceTitle}`);
    }
    if (!lnk.path.includes('open=')) {
      fail(`${ctx}: lab link missing open= param`);
    }
    return;
  }

  if (lnk.type === 'exams' && lnk.resourceSlug) {
    if (!ALL_EXAM_SLUGS.includes(lnk.resourceSlug)) {
      fail(`${ctx}: unknown exam slug — ${lnk.resourceSlug}`);
    }
    return;
  }

  if (lnk.type === 'reference' && lnk.resourceSlug) {
    if (!REF_SLUGS.has(lnk.resourceSlug)) {
      fail(`${ctx}: unknown reference slug — ${lnk.resourceSlug}`);
    }
    return;
  }

  if (lnk.type === 'reference' && lnk.path.startsWith('/reference?category=')) {
    const cat = new URL(lnk.path, 'http://local').searchParams.get('category');
    if (cat && !VALID_REFERENCE_CATEGORIES.includes(cat)) {
      warn(`${ctx}: reference category may be empty — ${cat}`);
    }
    return;
  }

  const isInternal = INTERNAL_ROUTES.some((r) => lnk.path === r || lnk.path.startsWith(`${r}?`) || lnk.path.startsWith(`${r}/`));
  if (!isInternal) {
    fail(`${ctx}: unrecognized internal path — ${lnk.path}`);
  }
}

async function validateAgainstDb() {
  const Challenge = require('../models/Challenge');
  const Lab = require('../models/Lab');
  const Exam = require('../models/Exam');

  const [challenges, labs, exams] = await Promise.all([
    Challenge.find().select('title'),
    Lab.find().select('title'),
    Exam.find().select('slug title')
  ]);

  const challengeTitles = new Set(challenges.map((c) => c.title));
  const labTitles = new Set(labs.map((l) => l.title));
  const examSlugs = new Set(exams.map((e) => e.slug));

  for (const title of ALL_CHALLENGE_TITLES) {
    if (!challengeTitles.has(title)) fail(`DB missing challenge: ${title}`);
    else ok(`Challenge exists: ${title}`);
  }

  for (const title of ALL_LAB_TITLES) {
    if (!labTitles.has(title)) fail(`DB missing lab: ${title}`);
    else ok(`Lab exists: ${title}`);
  }

  for (const slug of ALL_EXAM_SLUGS) {
    if (!examSlugs.has(slug)) fail(`DB missing exam: ${slug}`);
    else ok(`Exam exists: ${slug}`);
  }

  for (const slug of ALL_REFERENCE_SLUGS) {
    if (!REF_SLUGS.has(slug)) fail(`Reference seed missing slug: ${slug}`);
    else ok(`Reference article: ${slug}`);
  }
}

async function run() {
  console.log('\n📋 Study Plan Link Validation\n');

  const topicIds = new Set();
  let totalTopics = 0;
  let totalLinks = 0;

  for (const plan of STUDY_PLANS) {
    console.log(`\nPlan: ${plan.title} (${plan.slug})`);
    if (!plan.phases?.length) fail(`${plan.slug}: no phases`);

    for (const phase of plan.phases || []) {
      for (const topic of phase.topics || []) {
        totalTopics++;
        if (topicIds.has(topic.id)) fail(`Duplicate topic id: ${topic.id}`);
        topicIds.add(topic.id);

        if (!topic.objectives?.length) warn(`${plan.slug}/${topic.id}: no objectives`);
        if (!topic.links?.length) fail(`${plan.slug}/${topic.id}: no links`);

        for (const lnk of topic.links || []) {
          totalLinks++;
          validateLink(plan.slug, topic.id, lnk);
        }
      }
    }
  }

  console.log(`\nSeed summary: ${STUDY_PLANS.length} plans, ${totalTopics} topics, ${totalLinks} links`);

  if (process.env.MONGO_URI) {
    console.log('\nDatabase resource check:\n');
    await mongoose.connect(process.env.MONGO_URI);
    await validateAgainstDb();
    await mongoose.disconnect();
  } else {
    warn('MONGO_URI not set — skipping database checks');
  }

  console.log(`\nResult: ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(errors > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
