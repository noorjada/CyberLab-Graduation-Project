import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './CoursePlayer.css';

const MODULE_ICONS = {
  lesson: '📖',
  quiz: '❓',
  lab: '🖥️',
  exam: '📝',
  certificate: '📜'
};

const CoursePlayer = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
      const first = res.data.modules?.find(m => m.unlocked && !m.completed) || res.data.modules?.[0];
      setActiveModuleId(first?.id || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load course');
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setQuizResult(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const active = course?.modules?.find(m => m.id === activeModuleId);

  useEffect(() => {
    if (active && ['quiz', 'exam'].includes(active.type)) {
      setAnswers((active.questions || []).map(() => 0));
      setQuizResult(null);
    }
  }, [activeModuleId, active?.type, active?.questions?.length]);

  const selectModule = (mod) => {
    if (!mod.unlocked) {
      toast.info('Complete previous modules first');
      return;
    }
    setActiveModuleId(mod.id);
    setQuizResult(null);
  };

  const completeModule = async (moduleId) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/courses/${courseId}/modules/${moduleId}/complete`);
      toast.success(res.data.message);
      setCourse(prev => ({ ...prev, ...res.data }));
      const next = res.data.modules?.find(m => m.unlocked && !m.completed);
      if (next) setActiveModuleId(next.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/courses/${courseId}/modules/${active.id}/submit`, { answers });
      setQuizResult(res.data.graded);
      setCourse(prev => ({ ...prev, ...res.data }));
      if (res.data.passed) {
        toast.success(res.data.message);
        const next = res.data.modules?.find(m => m.unlocked && !m.completed);
        if (next) setActiveModuleId(next.id);
      } else {
        toast.warning(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="course-player-loading">Loading course...</p>;
  if (!course) return null;

  return (
    <div className="course-player">
      <div className="course-player-header">
        <button type="button" className="course-back" onClick={onBack}>← Back</button>
        <div>
          <span className="course-player-icon">{course.icon}</span>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <div className="course-player-progress">
            <div className="course-progress-bar">
              <div className="course-progress-fill" style={{ width: `${course.progressPercent}%`, background: course.color }} />
            </div>
            <span>{course.progressPercent}% · {course.completedModules}/{course.totalModules} modules</span>
          </div>
        </div>
      </div>

      <div className="course-player-body">
        <aside className="course-module-nav">
          <h4>Course outline</h4>
          {course.modules?.map((mod, i) => (
            <button
              key={mod.id}
              type="button"
              className={`course-module-btn ${activeModuleId === mod.id ? 'active' : ''} ${mod.completed ? 'done' : ''} ${!mod.unlocked ? 'locked' : ''}`}
              onClick={() => selectModule(mod)}
            >
              <span className="mod-icon">{mod.completed ? '✓' : MODULE_ICONS[mod.type]}</span>
              <span className="mod-label">
                <span className="mod-step">{i + 1}</span>
                {mod.title}
              </span>
            </button>
          ))}
        </aside>

        <main className="course-module-content">
          {active && (
            <>
              <div className="module-type-badge">{MODULE_ICONS[active.type]} {active.type}</div>
              <h3>{active.title}</h3>
              <p className="module-desc">{active.description}</p>

              {active.type === 'lesson' && (
                <div className="lesson-content">
                  {active.videoYoutubeId && (
                    <div className="lesson-video">
                      <iframe
                        title={active.title}
                        src={`https://www.youtube.com/embed/${active.videoYoutubeId}?rel=0`}
                        allowFullScreen
                      />
                    </div>
                  )}
                  {active.lessonContent && <p>{active.lessonContent}</p>}
                  {active.lessonBullets?.length > 0 && (
                    <ul>{active.lessonBullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  )}
                  {!active.completed && (
                    <button type="button" className="course-action-btn" disabled={submitting} onClick={() => completeModule(active.id)}>
                      Mark lesson complete →
                    </button>
                  )}
                </div>
              )}

              {['quiz', 'exam'].includes(active.type) && (
                <div className="quiz-content">
                  {(active.questions || []).map((q, qi) => (
                    <div key={qi} className="quiz-question">
                      <p><strong>{qi + 1}.</strong> {q.question}</p>
                      <div className="quiz-options">
                        {q.options.map((opt, oi) => (
                          <label key={oi} className={quizResult ? (oi === quizResult.results[qi]?.correctIndex ? 'correct' : oi === quizResult.results[qi]?.selectedIndex ? 'wrong' : '') : ''}>
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={answers[qi] === oi}
                              disabled={!!quizResult?.passed || active.completed}
                              onChange={() => setAnswers(prev => prev.map((a, i) => (i === qi ? oi : a)))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                      {quizResult && (
                        <p className="quiz-explanation">{quizResult.results[qi]?.explanation}</p>
                      )}
                    </div>
                  ))}
                  {!active.completed && (
                    <button type="button" className="course-action-btn" disabled={submitting} onClick={submitQuiz}>
                      {submitting ? 'Submitting...' : `Submit ${active.type === 'exam' ? 'final exam' : 'quiz'}`}
                    </button>
                  )}
                  {active.completed && active.score != null && (
                    <p className="quiz-score">Score: {active.score}% ✓</p>
                  )}
                </div>
              )}

              {active.type === 'lab' && (
                <div className="lab-content">
                  <p>Complete the hands-on lab, then mark this module done.</p>
                  {active.lab && (
                    <Link to="/labs" className="course-link-btn">Open {active.lab.title || 'Lab'} →</Link>
                  )}
                  {active.challenge && (
                    <Link to="/challenges" className="course-link-btn">Open {active.challenge.title || 'Challenge'} →</Link>
                  )}
                  {!active.lab && !active.challenge && (
                    <Link to="/labs" className="course-link-btn">Go to Hacking Labs →</Link>
                  )}
                  {!active.completed && (
                    <button type="button" className="course-action-btn secondary" disabled={submitting} onClick={() => completeModule(active.id)}>
                      I've completed the lab →
                    </button>
                  )}
                </div>
              )}

              {active.type === 'certificate' && (
                <div className="cert-content">
                  {course.certificateEarned ? (
                    <>
                      <div className="cert-earned-card">
                        <span>🎓</span>
                        <h4>Certificate Earned!</h4>
                        <p>{course.certificateTitle || course.title}</p>
                        <code>{course.certificateId}</code>
                      </div>
                    </>
                  ) : active.unlocked ? (
                    <button type="button" className="course-action-btn" disabled={submitting} onClick={() => completeModule(active.id)}>
                      Claim certificate →
                    </button>
                  ) : (
                    <p className="cert-locked">Complete all lessons, quiz, lab, and final exam to unlock your certificate.</p>
                  )}
                </div>
              )}

              {active.completed && active.type !== 'certificate' && (
                <p className="module-done">✅ Module complete</p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoursePlayer;
