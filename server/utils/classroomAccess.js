const Classroom = require('../models/Classroom');
const Department = require('../models/Department');

const canManageClassroom = async (classroomId, userId, role) => {
  if (role === 'admin') return true;
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) return false;
  return classroom.instructor.toString() === userId;
};

const canAccessClassroom = async (classroomId, userId, role) => {
  if (role === 'admin') return true;
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) return false;
  if (classroom.instructor.toString() === userId) return true;
  return classroom.students.some(s => s.toString() === userId);
};

const canManageDepartment = async (departmentId, userId, role) => {
  if (role === 'admin') return true;
  const dept = await Department.findById(departmentId);
  if (!dept) return false;
  return dept.admins?.some(a => a.toString() === userId);
};

module.exports = { canManageClassroom, canAccessClassroom, canManageDepartment };
