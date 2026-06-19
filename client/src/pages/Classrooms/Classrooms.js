import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CourseBuilder from '../../components/CourseBuilder/CourseBuilder';
import CoursePlayer from '../../components/CoursePlayer/CoursePlayer';
import './Classrooms.css';

const Classrooms = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [classes, setClasses] = useState({ teaching: [], enrolled: [] });
  const [studentDash, setStudentDash] = useState(null);
  const [instructorDash, setInstructorDash] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDashboard, setClassDashboard] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [labOptions, setLabOptions] = useState([]);
  const [challengeOptions, setChallengeOptions] = useState([]);

  const [inviteCode, setInviteCode] = useState('');
  const [newClass, setNewClass] = useState({ name: '', courseCode: '', semester: '', departmentId: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({
    classroomId: '', title: '', description: '', dueDate: '', requiredLabs: [], requiredChallenges: [], maxScore: 100
  });
  const [gradeForm, setGradeForm] = useState({ submissionId: '', grade: '', feedback: '' });
  const [activeCourseId, setActiveCourseId] = useState(null);

  const isStaff = user?.role === 'admin' || user?.role === 'instructor';

  const load = async () => {
    try {
      const [mine, depts] = await Promise.all([
        api.get('/classrooms/mine'),
        api.get('/university/departments')
      ]);
      setClasses(mine.data);
      setDepartments(depts.data);

      if (isStaff) {
        const inst = await api.get('/university/dashboard/instructor');
        setInstructorDash(inst.data);
        const opts = await api.get('/assignments/options/labs-challenges');
        setLabOptions(opts.data.labs);
        setChallengeOptions(opts.data.challenges);
      }

      const stud = await api.get('/university/dashboard/student');
      setStudentDash(stud.data);
    } catch {
      toast.error('Failed to load university data');
    }
  };

  useEffect(() => { load(); }, [user?.role]);

  const join = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms/join', { inviteCode });
      toast.success('Joined class!');
      setInviteCode('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const createClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classrooms', newClass);
      toast.success('Class created!');
      setNewClass({ name: '', courseCode: '', semester: '', departmentId: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const openClass = async (id) => {
    setSelectedClass(id);
    setTab('class');
    try {
      const [dash, asgn] = await Promise.all([
        api.get(`/classrooms/${id}/dashboard`),
        api.get(`/assignments/classroom/${id}`)
      ]);
      setClassDashboard(dash.data);
      setAssignments(asgn.data);
    } catch {
      toast.error('Failed to load class');
    }
  };

  const loadDeptStats = async (deptId) => {
    setSelectedDept(deptId);
    try {
      const res = await api.get(`/university/departments/${deptId}/stats`);
      setDeptStats(res.data);
    } catch {
      toast.error('Failed to load department stats');
    }
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        classroomId: newAssignment.classroomId,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate,
        requiredLabs: newAssignment.requiredLabs,
        requiredChallenges: newAssignment.requiredChallenges,
        maxScore: parseInt(newAssignment.maxScore, 10)
      });
      toast.success('Assignment created!');
      setNewAssignment({ classroomId: '', title: '', description: '', dueDate: '', requiredLabs: [], requiredChallenges: [], maxScore: 100 });
      load();
      if (newAssignment.classroomId) openClass(newAssignment.classroomId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const submitAssignment = async (assignmentId) => {
    try {
      const res = await api.post(`/assignments/${assignmentId}/submit`);
      toast.success(`Submitted — auto-score: ${res.data.submission.autoScore}%`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    }
  };

  const gradeSubmission = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/submissions/${gradeForm.submissionId}/grade`, {
        grade: parseInt(gradeForm.grade, 10),
        feedback: gradeForm.feedback
      });
      toast.success('Grade saved');
      setGradeForm({ submissionId: '', grade: '', feedback: '' });
      if (selectedClass) openClass(selectedClass);
    } catch {
      toast.error('Grading failed');
    }
  };

  const toggleMulti = (field, id) => {
    setNewAssignment(prev => {
      const arr = prev[field];
      const str = id;
      return {
        ...prev,
        [field]: arr.includes(str) ? arr.filter(x => x !== str) : [...arr, str]
      };
    });
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="university-page">
      <div className="uni-header">
        <div>
          <h1>🏛️ University Portal</h1>
          <p>Multi-tenant classes, assignments, attendance, and department analytics.</p>
        </div>
      </div>

      <div className="uni-tabs">
        {['overview', 'classes', ...(isStaff ? ['courses', 'assignments', 'departments'] : ['my-work'])].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setSelectedClass(null); setActiveCourseId(null); }}>
            {t === 'overview' ? '📊 Overview' : t === 'classes' ? '🎓 Classes' : t === 'courses' ? '📘 Courses' : t === 'assignments' ? '📝 Assignments' : t === 'departments' ? '🏢 Departments' : '📋 My Work'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="uni-overview">
          <form onSubmit={join} className="uni-join-bar">
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter class invite code" />
            <button type="submit">Join Class</button>
          </form>

          {isStaff && instructorDash && (
            <section className="uni-section">
              <h2>👨‍🏫 Instructor Dashboard</h2>
              <div className="uni-kpi-grid">
                <div className="uni-kpi"><span>Classes</span><strong>{instructorDash.classrooms?.length || 0}</strong></div>
                <div className="uni-kpi"><span>Students</span><strong>{instructorDash.totalStudents}</strong></div>
                <div className="uni-kpi"><span>Assignments</span><strong>{instructorDash.totalAssignments}</strong></div>
                <div className="uni-kpi"><span>Overdue</span><strong>{instructorDash.overdueAssignments}</strong></div>
              </div>
              {instructorDash.classrooms?.map(c => (
                <div key={c._id} className="uni-class-row" onClick={() => openClass(c._id)}>
                  <div>
                    <strong>{c.name}</strong>
                    {c.courseCode && <span className="meta"> · {c.courseCode}</span>}
                    <p className="meta">{c.studentCount} students · {c.assignmentCount} assignments · {c.pendingGrading} pending grades</p>
                  </div>
                  <span className="invite-pill">Code: {c.inviteCode}</span>
                </div>
              ))}
            </section>
          )}

          {studentDash && (
            <section className="uni-section">
              <h2>🎒 Student Dashboard</h2>
              <div className="uni-kpi-grid">
                <div className="uni-kpi"><span>Enrolled Classes</span><strong>{studentDash.classrooms?.length || 0}</strong></div>
                <div className="uni-kpi"><span>Lab Sessions (week)</span><strong>{studentDash.attendance?.labSessions || 0}</strong></div>
                <div className="uni-kpi"><span>Participation Days</span><strong>{studentDash.attendance?.participationDays || 0}</strong></div>
                <div className="uni-kpi"><span>Assignments Done</span><strong>{studentDash.attendance?.assignmentsCompleted || 0}</strong></div>
              </div>

              <h3>📅 Upcoming Assignments</h3>
              {studentDash.assignments?.filter(a => a.status === 'pending' || a.status === 'overdue').slice(0, 5).map(a => (
                <div key={a._id} className="assignment-row">
                  <div>
                    <strong>{a.title}</strong>
                    <span className="meta"> · {a.classroom} · Due {formatDate(a.dueDate)}</span>
                  </div>
                  <span className={`status-pill ${a.status}`}>{a.status}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === 'classes' && (
        <div className="uni-classes">
          {isStaff && (
            <form onSubmit={createClass} className="uni-create-class">
              <h3>Create Class</h3>
              <div className="form-grid">
                <input placeholder="Class name *" value={newClass.name} onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))} required />
                <input placeholder="Course code" value={newClass.courseCode} onChange={e => setNewClass(p => ({ ...p, courseCode: e.target.value }))} />
                <input placeholder="Semester (e.g. Fall 2026)" value={newClass.semester} onChange={e => setNewClass(p => ({ ...p, semester: e.target.value }))} />
                <select value={newClass.departmentId} onChange={e => setNewClass(p => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">Department (optional)</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <textarea placeholder="Description" value={newClass.description} onChange={e => setNewClass(p => ({ ...p, description: e.target.value }))} rows={2} />
              <button type="submit">Create Class</button>
            </form>
          )}

          {classes.teaching?.length > 0 && (
            <section>
              <h3>Teaching</h3>
              {classes.teaching.map(c => (
                <div key={c._id} className="class-card" onClick={() => openClass(c._id)}>
                  <h4>{c.name}</h4>
                  <p>{c.courseCode} {c.semester && `· ${c.semester}`} · Code: <code>{c.inviteCode}</code></p>
                  <p>{c.students?.length || 0} students · {c.department?.name || 'No department'}</p>
                </div>
              ))}
            </section>
          )}

          {classes.enrolled?.length > 0 && (
            <section>
              <h3>Enrolled</h3>
              {classes.enrolled.map(c => (
                <div key={c._id} className="class-card" onClick={() => openClass(c._id)}>
                  <h4>{c.name}</h4>
                  <p>Instructor: {c.instructor?.username} · {c.department?.name || ''}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === 'courses' && isStaff && !activeCourseId && (
        <CourseBuilder
          classrooms={classes.teaching || []}
          labOptions={labOptions}
          challengeOptions={challengeOptions}
          onCreated={load}
        />
      )}

      {tab === 'courses' && activeCourseId && (
        <CoursePlayer courseId={activeCourseId} onBack={() => setActiveCourseId(null)} />
      )}

      {(tab === 'class' && classDashboard && !activeCourseId) && (
        <div className="uni-class-detail">
          <button type="button" className="back-link" onClick={() => setTab('classes')}>← Back to classes</button>
          <h2>{classDashboard.classroom.name}</h2>
          <p className="meta">{classDashboard.classroom.courseCode} · {classDashboard.classroom.semester} · {classDashboard.classroom.department?.name}</p>
          {classDashboard.classroom.inviteCode && (
            <p>Invite: <code>{classDashboard.classroom.inviteCode}</code></p>
          )}

          <div className="uni-kpi-grid">
            <div className="uni-kpi"><span>Students</span><strong>{classDashboard.classroom.studentCount}</strong></div>
            <div className="uni-kpi"><span>Assignments</span><strong>{classDashboard.assignments?.length || 0}</strong></div>
            <div className="uni-kpi"><span>Weeks Tracked</span><strong>{classDashboard.attendance?.weeksTracked || 0}</strong></div>
          </div>

          <h3>📊 Attendance Tracking</h3>
          <div className="attendance-table">
            <div className="att-header">
              <span>Student</span><span>Lab Sessions</span><span>Participation</span><span>Assignments</span><span>Rate</span>
            </div>
            {(classDashboard.attendance?.students || []).map(s => (
              <div key={s.userId} className="att-row">
                <span>{s.username}</span>
                <span>{s.totalLabSessions}</span>
                <span>{s.totalParticipationDays} days</span>
                <span>{s.assignmentsCompleted}</span>
                <span>{s.labAttendanceRate}%</span>
              </div>
            ))}
          </div>

          <h3>📘 Instructor Courses</h3>
          {classDashboard.courses?.length > 0 ? (
            <div className="class-courses-grid">
              {classDashboard.courses.map(c => (
                <div key={c._id} className="class-course-card" onClick={() => { setActiveCourseId(c._id); setTab('class'); }}>
                  <span className="course-card-icon">{c.icon}</span>
                  <div>
                    <strong>{c.title}</strong>
                    <p className="meta">{c.modules?.length || 0} modules · {c.progressPercent || 0}% complete</p>
                    {!c.isPublished && classDashboard.role === 'instructor' && (
                      <span className="draft-pill">Draft</span>
                    )}
                  </div>
                  <span className="course-open-btn">Open →</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">No courses assigned to this class yet. {classDashboard.role === 'instructor' && 'Create one in the Courses tab.'}</p>
          )}

          <h3>📝 Assignments</h3>
          {assignments?.assignments?.map(a => (
            <div key={a._id} className="assignment-card">
              <div className="assignment-card-head">
                <strong>{a.title}</strong>
                <span>Due {formatDate(a.dueDate)} · {a.maxScore} pts</span>
              </div>
              <p>{a.description}</p>
              <p className="meta">
                Labs: {a.requiredLabs?.map(l => l.title || l).join(', ') || 'None'} ·
                Challenges: {a.requiredChallenges?.map(c => c.title || c).join(', ') || 'None'}
              </p>
              {classDashboard.role === 'student' && (
                <button type="button" onClick={() => submitAssignment(a._id)}>Submit / Auto-Grade</button>
              )}
            </div>
          ))}

          {classDashboard.role === 'instructor' && assignments?.submissions?.length > 0 && (
            <>
              <h3>✏️ Grade Submissions</h3>
              {assignments.submissions.map(s => (
                <div key={s._id} className="submission-row">
                  <span>{s.student?.username}</span>
                  <span>{s.completionPercent}% complete</span>
                  <span>Auto: {s.autoScore}</span>
                  <span className={`status-pill ${s.status}`}>{s.status}</span>
                  <button type="button" onClick={() => setGradeForm({ submissionId: s._id, grade: s.grade || s.autoScore, feedback: '' })}>
                    Grade
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {(tab === 'class' && activeCourseId) && (
        <CoursePlayer courseId={activeCourseId} onBack={() => setActiveCourseId(null)} />
      )}

      {tab === 'assignments' && isStaff && (
        <div className="uni-assignments">
          <form onSubmit={createAssignment} className="assignment-form">
            <h3>Create Assignment</h3>
            <select value={newAssignment.classroomId} onChange={e => setNewAssignment(p => ({ ...p, classroomId: e.target.value }))} required>
              <option value="">Select class *</option>
              {classes.teaching?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input placeholder="Title *" value={newAssignment.title} onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))} required />
            <textarea placeholder="Description" value={newAssignment.description} onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))} rows={3} />
            <input type="datetime-local" value={newAssignment.dueDate} onChange={e => setNewAssignment(p => ({ ...p, dueDate: e.target.value }))} required />
            <input type="number" min="1" max="1000" placeholder="Max score" value={newAssignment.maxScore} onChange={e => setNewAssignment(p => ({ ...p, maxScore: e.target.value }))} />

            <label>Required Labs</label>
            <div className="checkbox-grid">
              {labOptions.map(l => (
                <label key={l._id} className="check-item">
                  <input type="checkbox" checked={newAssignment.requiredLabs.includes(l._id)} onChange={() => toggleMulti('requiredLabs', l._id)} />
                  {l.title}
                </label>
              ))}
            </div>

            <label>Required Challenges</label>
            <div className="checkbox-grid">
              {challengeOptions.map(c => (
                <label key={c._id} className="check-item">
                  <input type="checkbox" checked={newAssignment.requiredChallenges.includes(c._id)} onChange={() => toggleMulti('requiredChallenges', c._id)} />
                  {c.title}
                </label>
              ))}
            </div>

            <button type="submit">Publish Assignment</button>
          </form>
        </div>
      )}

      {tab === 'my-work' && !isStaff && studentDash && (
        <div className="uni-my-work">
          <h3>My Assignments</h3>
          {studentDash.assignments?.map(a => (
            <div key={a._id} className="assignment-card">
              <strong>{a.title}</strong>
              <p className="meta">{a.classroom} · Due {formatDate(a.dueDate)}</p>
              <div className="assignment-actions">
                <span className={`status-pill ${a.status}`}>{a.status}</span>
                {a.grade != null && <span>Grade: {a.grade}/{a.maxScore}</span>}
                {(a.status === 'pending' || a.status === 'overdue') && (
                  <button type="button" onClick={() => submitAssignment(a._id)}>Submit</button>
                )}
              </div>
            </div>
          ))}

          <h3>Weekly Participation</h3>
          {studentDash.attendance?.weeklyHistory?.map(w => (
            <div key={w.week} className="week-row">
              <span>{w.week}</span>
              <span>{w.labSessions} lab sessions</span>
              <span>{w.participationDays} active days</span>
              <span>{w.assignmentsCompleted} assignments</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'departments' && isStaff && (
        <div className="uni-departments">
          <select value={selectedDept} onChange={e => loadDeptStats(e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
          </select>

          {deptStats && (
            <div className="dept-stats">
              <h2>{deptStats.department.name}</h2>
              <div className="uni-kpi-grid">
                <div className="uni-kpi"><span>Classes</span><strong>{deptStats.overview.classrooms}</strong></div>
                <div className="uni-kpi"><span>Instructors</span><strong>{deptStats.overview.instructors}</strong></div>
                <div className="uni-kpi"><span>Students</span><strong>{deptStats.overview.students}</strong></div>
                <div className="uni-kpi"><span>Avg Grade</span><strong>{deptStats.overview.avgGrade}%</strong></div>
                <div className="uni-kpi"><span>Active This Week</span><strong>{deptStats.overview.activeStudentsThisWeek}</strong></div>
                <div className="uni-kpi"><span>Assignments</span><strong>{deptStats.overview.assignments}</strong></div>
              </div>
              <h3>Classes in Department</h3>
              {deptStats.classrooms?.map(c => (
                <div key={c._id} className="class-card" onClick={() => openClass(c._id)}>
                  <h4>{c.name}</h4>
                  <p>{c.courseCode} · {c.instructor} · {c.studentCount} students</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {gradeForm.submissionId && (
        <div className="grade-modal-overlay" onClick={() => setGradeForm({ submissionId: '', grade: '', feedback: '' })}>
          <form className="grade-modal" onClick={e => e.stopPropagation()} onSubmit={gradeSubmission}>
            <h3>Grade Submission</h3>
            <input type="number" min="0" max="1000" value={gradeForm.grade} onChange={e => setGradeForm(p => ({ ...p, grade: e.target.value }))} required />
            <textarea placeholder="Feedback (optional)" value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} rows={3} />
            <button type="submit">Save Grade</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Classrooms;
