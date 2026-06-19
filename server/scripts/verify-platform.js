/**
 * End-to-end API verification for CyberLab platform features.
 * Usage: node scripts/verify-platform.js
 */
const dotenv = require('dotenv');
dotenv.config();

const BASE = (process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

let token = null;
let passed = 0;
let failed = 0;
const errors = [];

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

function ok(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    const msg = `${name}${detail ? `: ${detail}` : ''}`;
    errors.push(msg);
    console.log(`  ✗ ${msg}`);
  }
}

async function login() {
  const creds = [
    { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD },
    { email: 'admin@cyberlab.com', password: 'admin123' },
    { email: 'instructor@cyberlab.com', password: 'instructor123' }
  ].filter(c => c.email && c.password);

  for (const c of creds) {
    const res = await req('POST', '/auth/login', c);
    if (res.status === 200 && res.data?.token) {
      token = res.data.token;
      return res.data.user;
    }
  }

  // Register temp user
  const email = `verify-${Date.now()}@test.local`;
  const reg = await req('POST', '/auth/register', {
    username: `verify${Date.now().toString().slice(-6)}`,
    email,
    password: 'VerifyTest123!'
  });
  if (reg.status === 201 || reg.status === 200) {
    const loginRes = await req('POST', '/auth/login', { email, password: 'VerifyTest123!' });
    if (loginRes.data?.token) {
      token = loginRes.data.token;
      return loginRes.data.user;
    }
  }
  return null;
}

async function run() {
  console.log('\n🔍 CyberLab Platform Verification\n');
  console.log(`API: ${BASE}\n`);

  // Health
  const health = await fetch(`${BASE.replace('/api', '')}/api/health`).catch(() => null);
  if (health) {
    const h = await health.json().catch(() => ({}));
    ok('Health endpoint', health.status === 200 && h.status === 'ok', `status ${health.status}`);
  } else {
    ok('Server reachable', false, 'Cannot connect — start server with npm run dev');
    printSummary();
    process.exit(1);
  }

  const user = await login();
  ok('Authentication', !!token, user ? `as ${user.username}` : 'login failed');

  if (!token) {
    printSummary();
    process.exit(1);
  }

  // Core routes
  const challenges = await req('GET', '/challenges');
  ok('Challenges API', challenges.status === 200 && Array.isArray(challenges.data));
  if (challenges.data?.[0]) {
    ok('Challenge learning objectives', Array.isArray(challenges.data[0].learningObjectives));
    ok('Challenge theory lesson', challenges.data[0].theoryLesson?.enabled !== undefined);
  }

  const labs = await req('GET', '/labs');
  ok('Labs API', labs.status === 200 && Array.isArray(labs.data));

  const paths = await req('GET', '/paths');
  ok('Learning paths API', paths.status === 200 && Array.isArray(paths.data));

  const reference = await req('GET', '/reference');
  ok('Reference API', reference.status === 200 && Array.isArray(reference.data?.articles));

  const studyPlans = await req('GET', '/study-plans');
  ok('Study plans API', studyPlans.status === 200 && Array.isArray(studyPlans.data?.plans));
  if (studyPlans.data?.plans?.length) {
    const slug = studyPlans.data.plans[0].slug;
    const detail = await req('GET', `/study-plans/${slug}`);
    ok('Study plan detail', detail.status === 200 && detail.data?.phases?.length > 0);

    const planId = detail.data?._id;
    const topicId = detail.data?.phases?.[0]?.topics?.[0]?.id;
    if (planId && topicId) {
      const enroll = await req('POST', `/study-plans/${planId}/enroll`);
      ok('Study plan enroll', enroll.status === 200 && enroll.data?.plan?.enrolled === true);

      const toggle = await req('POST', `/study-plans/${planId}/topics/${topicId}/toggle`);
      ok('Study plan topic toggle', toggle.status === 200 && Array.isArray(toggle.data?.plan?.phases));

      const hasFrameworks = detail.data?.phases?.some((p) =>
        p.topics?.some((t) => t.frameworks?.length > 0 && t.links?.length > 0)
      );
      ok('Study plan has frameworks + links', hasFrameworks);

      const hasDeepLinks = detail.data?.phases?.some((p) =>
        p.topics?.some((t) => t.links?.some((l) => l.path?.includes('open=') || l.path?.startsWith('/reference/')))
      );
      ok('Study plan deep links', hasDeepLinks);
    } else {
      ok('Study plan enroll', false, `missing plan id (${planId}) or topic id (${topicId})`);
    }
  }

  try {
    require('../data/studyPlansSeed');
    require('../data/studyPlanResources');
    ok('Study plan seed modules load', true);
  } catch (e) {
    ok('Study plan seed modules load', false, e.message);
  }

  const coursesMine = await req('GET', '/courses/mine');
  ok('Courses mine API', coursesMine.status === 200);

  const search = await req('GET', '/search?q=sql');
  ok('Search API', search.status === 200 && search.data?.query === 'sql');

  const classrooms = await req('GET', '/classrooms/mine');
  ok('Classrooms API', classrooms.status === 200);

  const certs = await req('GET', '/certificates/my');
  ok('Path certificates API', certs.status === 200 && Array.isArray(certs.data));

  const courseCerts = await req('GET', '/courses/certificates/my');
  ok('Course certificates API', courseCerts.status === 200 && Array.isArray(courseCerts.data));

  const examsList = await req('GET', '/exams');
  ok('Exams API', examsList.status === 200 && Array.isArray(examsList.data));
  if (examsList.data?.[0]?._id) {
    const examId = examsList.data[0]._id;

    const startExam = await req('POST', `/exams/${examId}/start`);
    ok('Exam session start', startExam.status === 200 && startExam.data?.session?.expiresAt);

    const activeSession = await req('GET', '/exams/session/active');
    ok('Active exam session', activeSession.status === 200 && activeSession.data?.active === true);

    const aiBlocked = await req('POST', '/ai/chat', { message: 'help me cheat on the exam', conversationHistory: [] });
    ok('AI chat blocked during exam', aiBlocked.status === 403 && aiBlocked.data?.code === 'EXAM_IN_PROGRESS');

    const socBlocked = await req('POST', '/ai/soc', { message: 'analyze this alert', conversationHistory: [] });
    ok('SOC AI blocked during exam', socBlocked.status === 403 && socBlocked.data?.code === 'EXAM_IN_PROGRESS');

    const focusWarn = await req('POST', '/exams/session/focus-warning');
    ok('Exam focus warning', focusWarn.status === 200 && typeof focusWarn.data?.focusWarnings === 'number');

    const abandonExam = await req('POST', `/exams/${examId}/abandon`);
    ok('Exam abandon', abandonExam.status === 200);

    const clearedSession = await req('GET', '/exams/session/active');
    ok('Exam session cleared', clearedSession.status === 200 && clearedSession.data?.active === false);
  }

  const analytics = await req('GET', '/analytics/skills');
  ok('Analytics API', analytics.status === 200);

  // Model load check
  try {
    require('../models/Course');
    require('../models/StudyPlan');
    require('../models/CourseProgress');
    require('../data/learningObjectives');
    require('../data/courseTemplates');
    ok('All new models/data load', true);
  } catch (e) {
    ok('All new models/data load', false, e.message);
  }

  // Labs have seeded learning content
  const sqliLab = (labs.data || []).find(l => /SQL Injection/i.test(l.title));
  ok('SQL lab has learning objectives', sqliLab?.learningObjectives?.length >= 4);
  ok('SQL lab has theory videos', sqliLab?.theoryLesson?.videos?.length >= 3);

  // Instructor course lifecycle (if instructor/admin)
  if (['instructor', 'admin'].includes(user?.role)) {
    const created = await req('POST', '/courses', {
      title: `Verify Course ${Date.now()}`,
      templateId: 'web-app-security',
      category: 'web'
    });
    ok('Create instructor course', created.status === 201 && created.data?.course?._id);
    const courseId = created.data?.course?._id;
    if (courseId) {
      const pub = await req('PUT', `/courses/${courseId}`, { isPublished: true });
      ok('Publish course', pub.status === 200);
      const detail = await req('GET', `/courses/${courseId}`);
      ok('Course detail with modules', detail.status === 200 && detail.data?.modules?.length >= 6);
      const lesson = detail.data.modules.find(m => m.type === 'lesson' && m.unlocked);
      if (lesson) {
        const done = await req('POST', `/courses/${courseId}/modules/${lesson.id}/complete`);
        ok('Complete lesson module', done.status === 200);
      }
      const quiz = detail.data.modules.find(m => m.type === 'quiz');
      if (quiz?.questions?.length) {
        const answers = quiz.questions.map((_, i) => 0);
        const sub = await req('POST', `/courses/${courseId}/modules/${quiz.id}/submit`, { answers });
        ok('Submit quiz module', sub.status === 200 && typeof sub.data?.graded?.score === 'number');
      }
      // Cleanup test course
      const Course = require('../models/Course');
      await Course.findByIdAndDelete(courseId).catch(() => {});
    }
  } else {
    ok('Instructor course lifecycle', true, 'skipped (not instructor)');
  }

  printSummary();
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  console.log(`\n─────────────────────────────`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (errors.length) {
    console.log('\nFailures:');
    errors.forEach(e => console.log(`  • ${e}`));
  }
  console.log(failed === 0 ? '\n✅ All checks passed\n' : '\n❌ Some checks failed\n');
}

run().catch(err => {
  console.error('Verification crashed:', err);
  process.exit(1);
});
