import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './CourseBuilder.css';

const MODULE_TYPES = [
  { id: 'lesson', label: '📖 Lesson' },
  { id: 'quiz', label: '❓ Quiz' },
  { id: 'lab', label: '🖥️ Lab' },
  { id: 'exam', label: '📝 Final Exam' },
  { id: 'certificate', label: '📜 Certificate' }
];

const EMPTY_MODULE = {
  type: 'lesson',
  title: '',
  description: '',
  lessonContent: '',
  lessonBullets: '',
  videoYoutubeId: '',
  passThreshold: 70,
  labId: '',
  challengeId: '',
  estimatedMinutes: 30,
  questionsJson: ''
};

const CourseBuilder = ({ classrooms = [], labOptions = [], challengeOptions = [], onCreated }) => {
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'web',
    classroomId: '',
    templateId: 'web-app-security'
  });
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/courses/mine');
      setCourses(res.data.teaching || []);
    } catch {
      toast.error('Failed to load courses');
    }
  };

  useEffect(() => { load(); }, []);

  const selected = courses.find(c => c._id === selectedId);

  const refreshSelected = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourses(prev => prev.map(c => (c._id === courseId ? { ...c, modules: res.data.modules, isPublished: res.data.isPublished } : c)));
    } catch {
      await load();
    }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/courses', newCourse);
      toast.success('Course created — add modules or publish when ready');
      setNewCourse({ title: '', description: '', category: 'web', classroomId: '', templateId: 'web-app-security' });
      await load();
      setSelectedId(res.data.course._id);
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!selected) return;
    try {
      await api.put(`/courses/${selected._id}`, { isPublished: !selected.isPublished });
      toast.success(selected.isPublished ? 'Course unpublished' : 'Course published!');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const addModule = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      let questions = [];
      if (moduleForm.questionsJson.trim()) {
        try {
          questions = JSON.parse(moduleForm.questionsJson);
          if (!Array.isArray(questions)) throw new Error('Questions must be a JSON array');
        } catch {
          toast.error('Invalid questions JSON — use an array of {question, options, correctIndex}');
          setSaving(false);
          return;
        }
      }
      await api.post(`/courses/${selected._id}/modules`, {
        type: moduleForm.type,
        title: moduleForm.title,
        description: moduleForm.description,
        lessonContent: moduleForm.lessonContent,
        lessonBullets: moduleForm.lessonBullets.split('\n').filter(Boolean),
        videoYoutubeId: moduleForm.videoYoutubeId,
        passThreshold: parseInt(moduleForm.passThreshold, 10) || 70,
        labId: moduleForm.labId || undefined,
        challengeId: moduleForm.challengeId || undefined,
        estimatedMinutes: parseInt(moduleForm.estimatedMinutes, 10) || 30,
        questions
      });
      toast.success('Module added');
      setModuleForm(EMPTY_MODULE);
      await refreshSelected(selected._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add module');
    } finally {
      setSaving(false);
    }
  };

  const removeModule = async (moduleId) => {
    if (!selected || !window.confirm('Remove this module?')) return;
    try {
      await api.delete(`/courses/${selected._id}/modules/${moduleId}`);
      toast.success('Module removed');
      await refreshSelected(selected._id);
    } catch {
      toast.error('Failed to remove module');
    }
  };

  return (
    <div className="course-builder">
      <form onSubmit={createCourse} className="course-create-form">
        <h3>📘 Create Instructor Course</h3>
        <p className="form-hint">Example: Web Application Security → Lesson 1 → Lesson 2 → Quiz → Lab → Final Exam → Certificate</p>
        <div className="form-grid">
          <input
            placeholder="Course title * (e.g. Web Application Security)"
            value={newCourse.title}
            onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))}
            required
          />
          <select value={newCourse.category} onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))}>
            <option value="web">Web</option>
            <option value="network">Network</option>
            <option value="linux">Linux</option>
            <option value="forensics">Forensics</option>
            <option value="soc">SOC</option>
            <option value="general">General</option>
          </select>
          <select value={newCourse.classroomId} onChange={e => setNewCourse(p => ({ ...p, classroomId: e.target.value }))}>
            <option value="">Assign to class (optional)</option>
            {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={newCourse.templateId} onChange={e => setNewCourse(p => ({ ...p, templateId: e.target.value }))}>
            <option value="web-app-security">Template: Web Application Security</option>
            <option value="">Blank course (no modules)</option>
          </select>
        </div>
        <textarea
          placeholder="Course description"
          value={newCourse.description}
          onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))}
          rows={2}
        />
        <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Course'}</button>
      </form>

      {courses.length > 0 && (
        <div className="course-manage">
          <h3>Your courses</h3>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">Select a course to manage</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.title} {c.isPublished ? '(published)' : '(draft)'}
              </option>
            ))}
          </select>

          {selected && (
            <div className="course-manage-detail">
              <div className="course-manage-head">
                <div>
                  <strong>{selected.title}</strong>
                  <span className="meta">{selected.modules?.length || 0} modules · {selected.classroom?.name || 'No class'}</span>
                </div>
                <button type="button" className={selected.isPublished ? 'unpublish' : 'publish'} onClick={togglePublish}>
                  {selected.isPublished ? 'Unpublish' : 'Publish course'}
                </button>
              </div>

              <ol className="module-outline">
                {(selected.modules || []).sort((a, b) => a.order - b.order).map((m, i) => (
                  <li key={m.id}>
                    <span>{i + 1}. {m.type}: {m.title}</span>
                    <button type="button" onClick={() => removeModule(m.id)}>✕</button>
                  </li>
                ))}
              </ol>

              <form onSubmit={addModule} className="module-add-form">
                <h4>Add module</h4>
                <div className="form-grid">
                  <select value={moduleForm.type} onChange={e => setModuleForm(p => ({ ...p, type: e.target.value }))}>
                    {MODULE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input
                    placeholder="Module title *"
                    value={moduleForm.title}
                    onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <input
                  placeholder="Short description"
                  value={moduleForm.description}
                  onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                />

                {moduleForm.type === 'lesson' && (
                  <>
                    <textarea placeholder="Lesson content" value={moduleForm.lessonContent} onChange={e => setModuleForm(p => ({ ...p, lessonContent: e.target.value }))} rows={3} />
                    <textarea placeholder="Bullet points (one per line)" value={moduleForm.lessonBullets} onChange={e => setModuleForm(p => ({ ...p, lessonBullets: e.target.value }))} rows={2} />
                    <input placeholder="YouTube video ID (optional)" value={moduleForm.videoYoutubeId} onChange={e => setModuleForm(p => ({ ...p, videoYoutubeId: e.target.value }))} />
                  </>
                )}

                {moduleForm.type === 'lab' && (
                  <select value={moduleForm.labId} onChange={e => setModuleForm(p => ({ ...p, labId: e.target.value }))}>
                    <option value="">Select lab (optional)</option>
                    {labOptions.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                )}

                {['quiz', 'exam'].includes(moduleForm.type) && (
                  <>
                    <input type="number" min="50" max="100" placeholder="Pass % (default 70)" value={moduleForm.passThreshold} onChange={e => setModuleForm(p => ({ ...p, passThreshold: e.target.value }))} />
                    <textarea
                      placeholder='Questions JSON: [{"question":"...","options":["A","B"],"correctIndex":0,"explanation":"..."}]'
                      value={moduleForm.questionsJson}
                      onChange={e => setModuleForm(p => ({ ...p, questionsJson: e.target.value }))}
                      rows={4}
                    />
                  </>
                )}

                <button type="submit" disabled={saving}>Add module</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
