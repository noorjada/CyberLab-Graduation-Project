const User = require('../models/User');
const LabProgress = require('../models/LabProgress');
const Assignment = require('../models/Assignment');

const gradeSubmission = async (assignment, studentId) => {
  const user = await User.findById(studentId).select('solvedChallenges');
  const requiredLabs = assignment.requiredLabs || [];
  const requiredChallenges = assignment.requiredChallenges || [];

  const labProgress = requiredLabs.length
    ? await LabProgress.find({
        user: studentId,
        lab: { $in: requiredLabs },
        completed: true
      })
    : [];

  const labsCompleted = labProgress.map(p => p.lab.toString());
  const solvedSet = new Set((user?.solvedChallenges || []).map(id => id.toString()));
  const challengesCompleted = requiredChallenges
    .map(id => id.toString())
    .filter(id => solvedSet.has(id));

  const totalRequired = requiredLabs.length + requiredChallenges.length;
  const totalCompleted = labsCompleted.length + challengesCompleted.length;

  const completionPercent = totalRequired
    ? Math.round((totalCompleted / totalRequired) * 100)
    : 100;

  const autoScore = Math.round((completionPercent / 100) * (assignment.maxScore || 100));

  return {
    labsCompleted,
    challengesCompleted,
    completionPercent,
    autoScore,
    maxGrade: assignment.maxScore || 100,
    fullyComplete: totalRequired === 0 || totalCompleted >= totalRequired
  };
};

const isLate = (assignment) => new Date() > new Date(assignment.dueDate);

module.exports = { gradeSubmission, isLate };
