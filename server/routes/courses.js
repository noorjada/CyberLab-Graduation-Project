const express = require('express');
const crypto = require('crypto');
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const CourseCertificate = require('../models/CourseCertificate');
const Classroom = require('../models/Classroom');
const Lab = require('../models/Lab');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { gradeExam } = require('../utils/examGrading');
const { WEB_APP_SECURITY } = require('../data/courseTemplates');
const {
  slugify,
  canManageCourse,
  canAccessCourse,
  enrollStudentInCourse,
  enrollClassroomInCourses,
  sortedModules,
  isModuleUnlocked,
  attachModuleProgress
} = require('../utils/courseAccess');

const router = express.Router();

const modId = () => crypto.randomBytes(4).toString('hex');

async function uniqueSlug(base) {
  let slug = slugify(base);
  let n = 0;
  while (await Course.findOne({ slug: n ? `${slug}-${n}` : slug })) {
    n++;
  }
  return n ? `${slug}-${n}` : slug;
}

async function resolveLabRefs(modules) {
  const sqliLab = await Lab.findOne({ title: /SQL Injection Attack/i });
  return modules.map(m => {
    if (m.type === 'lab' && !m.lab && sqliLab) return { ...m, lab: sqliLab._id };
    return m;
  });
}

// GET /api/courses/templates
router.get('/templates', auth, (req, res) => {
  if (!['admin', 'instructor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Instructor access required' });
  }
  res.json({
    templates: [
      { id: 'web-app-security', label: 'Web Application Security', icon: '🌐', preview: WEB_APP_SECURITY }
    ]
  });
});

// GET /api/courses/certificates/my  (before /:id)
router.get('/certificates/my', auth, async (req, res) => {
  try {
    const certs = await CourseCertificate.find({ user: req.user.userId })
      .populate('course', 'title icon category')
      .sort({ completedAt: -1 });
    res.json(certs.map(c => ({
      ...c.toObject(),
      type: 'course',
      pathTitle: c.courseTitle
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/mine
router.get('/mine', auth, async (req, res) => {
  try {
    let teaching = [];
    if (['admin', 'instructor'].includes(req.user.role)) {
      teaching = await Course.find({ instructor: req.user.userId })
        .populate('classroom', 'name courseCode')
        .sort({ updatedAt: -1 });
    }

    const progressRecords = await CourseProgress.find({ user: req.user.userId })
      .populate({
        path: 'course',
        match: { isPublished: true },
        populate: { path: 'instructor', select: 'username' }
      })
      .populate('classroom', 'name');

    const enrolled = progressRecords
      .filter(p => p.course)
      .map(p => ({
        ...p.course.toObject(),
        progress: attachModuleProgress(p.course, p),
        enrolledAt: p.enrolledAt
      }));

    res.json({ teaching, enrolled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/classroom/:classroomId
router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const isInstructor = classroom.instructor.toString() === req.user.userId || req.user.role === 'admin';
    const isStudent = classroom.students.some(s => s.toString() === req.user.userId);
    if (!isInstructor && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courses = await Course.find({
      _id: { $in: classroom.assignedCourses || [] },
      ...(isStudent ? { isPublished: true } : {})
    }).populate('instructor', 'username');

    const withProgress = await Promise.all(courses.map(async (course) => {
      const progress = await CourseProgress.findOne({ user: req.user.userId, course: course._id });
      return {
        ...course.toObject(),
        ...attachModuleProgress(course, progress)
      };
    }));

    res.json(withProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Instructor access required' });
    }

    const { title, description, category, icon, color, classroomId, templateId, certificateTitle } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    let modules = [];
    let meta = {};

    if (templateId === 'web-app-security') {
      meta = { ...WEB_APP_SECURITY };
      modules = await resolveLabRefs(meta.modules.map(m => ({ ...m, id: modId() })));
    }

    const slug = await uniqueSlug(title);
    const course = await Course.create({
      title: title.trim(),
      slug,
      description: description || meta.description || '',
      category: category || meta.category || 'general',
      icon: icon || meta.icon || '📘',
      color: color || meta.color || '#1f6feb',
      certificateTitle: certificateTitle || meta.certificateTitle || title.trim(),
      instructor: req.user.userId,
      classroom: classroomId || undefined,
      modules,
      isPublished: false
    });

    if (classroomId) {
      await Classroom.findByIdAndUpdate(classroomId, {
        $addToSet: { assignedCourses: course._id }
      });
      const classroom = await Classroom.findById(classroomId);
      if (classroom?.students?.length) {
        await enrollClassroomInCourses(classroomId, classroom.students);
      }
    }

    res.status(201).json({ message: 'Course created', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username')
      .populate('classroom', 'name courseCode inviteCode')
      .populate('modules.lab', 'title category difficulty points')
      .populate('modules.challenge', 'title category difficulty points');

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const allowed = await canAccessCourse(course._id, req.user.userId, req.user.role);
    const isOwner = await canManageCourse(course, req.user.userId, req.user.role);

    if (!allowed && !isOwner) return res.status(403).json({ message: 'Access denied' });
    if (!course.isPublished && !isOwner) return res.status(403).json({ message: 'Course not published' });

    let progress = await CourseProgress.findOne({ user: req.user.userId, course: course._id });
    if (!progress && allowed) {
      progress = await enrollStudentInCourse(req.user.userId, course._id, course.classroom);
    }

    const attached = attachModuleProgress(course, progress);
    const classroom = course.classroom;
    const payload = course.toObject();

    if (!isOwner && classroom) {
      delete payload.classroom?.inviteCode;
    }

    res.json({
      ...payload,
      ...attached,
      canEdit: isOwner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/courses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!await canManageCourse(course, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    ['title', 'description', 'category', 'icon', 'color', 'certificateTitle', 'isPublished'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (req.body.classroomId !== undefined) {
      const oldClassroom = course.classroom?.toString();
      updates.classroom = req.body.classroomId || undefined;
      if (oldClassroom) {
        await Classroom.findByIdAndUpdate(oldClassroom, { $pull: { assignedCourses: course._id } });
      }
      if (req.body.classroomId) {
        await Classroom.findByIdAndUpdate(req.body.classroomId, { $addToSet: { assignedCourses: course._id } });
        const classroom = await Classroom.findById(req.body.classroomId);
        if (classroom?.students?.length) {
          await enrollClassroomInCourses(req.body.classroomId, classroom.students);
        }
      }
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Course updated', course: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses/:id/modules
router.post('/:id/modules', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!await canManageCourse(course, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, title, description, lessonContent, lessonBullets, videoYoutubeId,
      questions, passThreshold, labId, challengeId, estimatedMinutes } = req.body;

    if (!type || !title) return res.status(400).json({ message: 'Type and title required' });

    const maxOrder = course.modules.reduce((m, mod) => Math.max(m, mod.order), 0);
    const module = {
      id: modId(),
      type,
      title: title.trim(),
      description: description || '',
      order: maxOrder + 1,
      lessonContent: lessonContent || '',
      lessonBullets: lessonBullets || [],
      videoYoutubeId: videoYoutubeId || '',
      questions: questions || [],
      passThreshold: passThreshold ?? 70,
      lab: labId || undefined,
      challenge: challengeId || undefined,
      estimatedMinutes: estimatedMinutes || 30
    };

    course.modules.push(module);
    await course.save();
    res.status(201).json({ message: 'Module added', module, course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/courses/:id/modules/:moduleId
router.delete('/:id/modules/:moduleId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!await canManageCourse(course, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.modules = course.modules.filter(m => m.id !== req.params.moduleId);
    await course.save();
    res.json({ message: 'Module removed', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses/:id/modules/:moduleId/complete
router.post('/:id/modules/:moduleId/complete', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = await canManageCourse(course, req.user.userId, req.user.role);
    if (!course.isPublished && !isOwner) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const allowed = await canAccessCourse(course._id, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const module = course.modules.find(m => m.id === req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    let progress = await CourseProgress.findOne({ user: req.user.userId, course: course._id });
    if (!progress) progress = await enrollStudentInCourse(req.user.userId, course._id, course.classroom);

    if (!isModuleUnlocked(course.modules, module.id, progress.completedModuleIds)) {
      return res.status(400).json({ message: 'Complete previous modules first' });
    }

    if (module.type === 'certificate') {
      const sorted = sortedModules(course);
      const required = sorted.filter(m => m.type !== 'certificate');
      const allDone = required.every(m => progress.completedModuleIds.includes(m.id));
      if (!allDone) return res.status(400).json({ message: 'Complete all modules before claiming certificate' });

      let cert = await CourseCertificate.findOne({ user: req.user.userId, course: course._id });
      if (!cert) {
        const instructor = await User.findById(course.instructor).select('username');
        const examMod = sorted.find(m => m.type === 'exam');
        const examScore = progress.moduleScores.find(s => s.moduleId === examMod?.id)?.score || 0;
        cert = await CourseCertificate.create({
          user: req.user.userId,
          course: course._id,
          classroom: course.classroom,
          courseTitle: course.certificateTitle || course.title,
          instructorName: instructor?.username || 'Instructor',
          finalExamScore: examScore
        });
      }
      if (!progress.completedModuleIds.includes(module.id)) {
        progress.completedModuleIds.push(module.id);
      }
      progress.certificateId = cert.certificateId;
      progress.completedAt = new Date();
      await progress.save();

      return res.json({
        message: '🎓 Certificate earned!',
        certificate: cert,
        ...attachModuleProgress(course, progress)
      });
    }

    if (['quiz', 'exam'].includes(module.type)) {
      return res.status(400).json({ message: 'Submit quiz/exam answers instead' });
    }

    if (!progress.completedModuleIds.includes(module.id)) {
      progress.completedModuleIds.push(module.id);
      await progress.save();
    }

    res.json({
      message: `"${module.title}" completed`,
      ...attachModuleProgress(course, progress)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses/:id/modules/:moduleId/submit
router.post('/:id/modules/:moduleId/submit', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = await canManageCourse(course, req.user.userId, req.user.role);
    if (!course.isPublished && !isOwner) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const allowed = await canAccessCourse(course._id, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const module = course.modules.find(m => m.id === req.params.moduleId);
    if (!module || !['quiz', 'exam'].includes(module.type)) {
      return res.status(400).json({ message: 'Invalid quiz/exam module' });
    }

    let progress = await CourseProgress.findOne({ user: req.user.userId, course: course._id });
    if (!progress) progress = await enrollStudentInCourse(req.user.userId, course._id, course.classroom);

    if (!isModuleUnlocked(course.modules, module.id, progress.completedModuleIds)) {
      return res.status(400).json({ message: 'Complete previous modules first' });
    }

    const graded = gradeExam(
      { questions: module.questions, passThreshold: module.passThreshold },
      req.body.answers || []
    );

    const existingIdx = progress.moduleScores.findIndex(s => s.moduleId === module.id);
    const scoreEntry = {
      moduleId: module.id,
      score: graded.score,
      passed: graded.passed,
      completedAt: new Date()
    };
    if (existingIdx >= 0) progress.moduleScores[existingIdx] = scoreEntry;
    else progress.moduleScores.push(scoreEntry);

    if (graded.passed && !progress.completedModuleIds.includes(module.id)) {
      progress.completedModuleIds.push(module.id);
    }
    await progress.save();

    res.json({
      message: graded.passed ? `Passed with ${graded.score}%` : `Score ${graded.score}% — need ${module.passThreshold}% to pass`,
      graded,
      passed: graded.passed,
      ...attachModuleProgress(course, progress)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
