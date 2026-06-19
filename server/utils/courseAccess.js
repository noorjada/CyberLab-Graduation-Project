const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const Classroom = require('../models/Classroom');

const slugify = (text) =>
  (text || 'course')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

async function canManageCourse(course, userId, role) {
  if (role === 'admin') return true;
  return course.instructor?.toString() === userId;
}

async function canAccessCourse(courseId, userId, role) {
  if (role === 'admin') return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  if (course.instructor.toString() === userId) return true;

  const progress = await CourseProgress.findOne({ user: userId, course: courseId });
  if (progress) return true;

  if (course.classroom) {
    const classroom = await Classroom.findById(course.classroom);
    if (classroom?.students?.some(s => s.toString() === userId)) return true;
  }
  return false;
}

async function enrollStudentInCourse(userId, courseId, classroomId) {
  return CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      user: userId,
      course: courseId,
      classroom: classroomId,
      $setOnInsert: { enrolledAt: new Date(), completedModuleIds: [], moduleScores: [] }
    },
    { upsert: true, new: true }
  );
}

async function enrollClassroomInCourses(classroomId, studentIds) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom?.assignedCourses?.length) return;

  for (const studentId of studentIds) {
    for (const courseId of classroom.assignedCourses) {
      await enrollStudentInCourse(studentId, courseId, classroomId);
    }
  }
}

function sortedModules(course) {
  return [...(course.modules || [])].sort((a, b) => a.order - b.order);
}

function isModuleUnlocked(modules, moduleId, completedIds) {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex(m => m.id === moduleId);
  if (idx <= 0) return true;
  for (let i = 0; i < idx; i++) {
    if (!completedIds.includes(sorted[i].id)) return false;
  }
  return true;
}

function attachModuleProgress(course, progress) {
  const completed = new Set(progress?.completedModuleIds || []);
  const scoreMap = {};
  (progress?.moduleScores || []).forEach(s => { scoreMap[s.moduleId] = s; });

  const modules = sortedModules(course).map(m => ({
    ...m,
    completed: completed.has(m.id),
    score: scoreMap[m.id]?.score,
    passed: scoreMap[m.id]?.passed,
    unlocked: isModuleUnlocked(course.modules, m.id, progress?.completedModuleIds || []),
    questions: ['quiz', 'exam'].includes(m.type)
      ? (m.questions || []).map((q, i) => ({
        index: i,
        question: q.question,
        options: q.options
      }))
      : undefined
  }));

  const completable = modules.filter(m => m.type !== 'certificate');
  const done = completable.filter(m => completed.has(m.id)).length;

  return {
    modules,
    progressPercent: completable.length ? Math.round((done / completable.length) * 100) : 0,
    completedModules: done,
    totalModules: completable.length,
    certificateEarned: !!progress?.certificateId,
    certificateId: progress?.certificateId || null,
    completedAt: progress?.completedAt
  };
}

module.exports = {
  slugify,
  canManageCourse,
  canAccessCourse,
  enrollStudentInCourse,
  enrollClassroomInCourses,
  sortedModules,
  isModuleUnlocked,
  attachModuleProgress
};
