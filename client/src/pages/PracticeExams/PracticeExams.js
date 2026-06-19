import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import api from '../../utils/api';
import './PracticeExams.css';
import '../../components/ExamSafeBrowser/ExamSafeBrowser.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const draftKey = (examId) => `cyberlab-exam-draft:${examId}`;

const loadDraft = (examId, questionCount) => {
  try {
    const raw = sessionStorage.getItem(draftKey(examId));
    if (!raw) return { answers: new Array(questionCount).fill(-1), currentQ: 0 };
    const parsed = JSON.parse(raw);
    const answers = Array.isArray(parsed.answers) && parsed.answers.length === questionCount
      ? parsed.answers
      : new Array(questionCount).fill(-1);
    const currentQ = Number.isInteger(parsed.currentQ) && parsed.currentQ >= 0 && parsed.currentQ < questionCount
      ? parsed.currentQ
      : 0;
    return { answers, currentQ };
  } catch {
    return { answers: new Array(questionCount).fill(-1), currentQ: 0 };
  }
};

const saveDraft = (examId, answers, currentQ) => {
  try {
    sessionStorage.setItem(draftKey(examId), JSON.stringify({ answers, currentQ }));
  } catch { /* ignore quota */ }
};

const clearDraft = (examId) => {
  try {
    sessionStorage.removeItem(draftKey(examId));
  } catch { /* ignore */ }
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const PracticeExams = () => {
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { enterExam, exitExam, focusWarnings, reportFocusWarning, syncSession, inExam } = useExam();
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('catalog');
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [prestartExam, setPrestartExam] = useState(null);
  const [starting, setStarting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusAlert, setFocusAlert] = useState('');
  const timerRef = useRef(null);
  const submitRef = useRef(null);
  const examShellRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    try {
      const [examsRes, historyRes] = await Promise.all([
        api.get('/exams'),
        api.get('/exams/attempts/my')
      ]);
      setExams(examsRes.data);
      setHistory(historyRes.data);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const restoreActiveExam = async () => {
      try {
        const res = await api.get('/exams/session/active');
        if (!res.data?.active || !res.data.session || view !== 'catalog' || activeExam) return;

        const examRes = await api.get(`/exams/${res.data.session.examId}`);
        enterExam(res.data.session);
        setActiveExam(examRes.data);
        const draft = loadDraft(examRes.data._id, examRes.data.questions.length);
        setAnswers(draft.answers);
        setCurrentQ(draft.currentQ);
        setResults(null);

        const started = new Date(res.data.session.startedAt).getTime();
        const expires = new Date(res.data.session.expiresAt).getTime();
        const totalSec = examRes.data.durationMinutes * 60;
        const elapsedSec = Math.max(0, Math.floor((Date.now() - started) / 1000));
        const remaining = Math.max(0, Math.min(totalSec - elapsedSec, Math.floor((expires - Date.now()) / 1000)));

        setElapsed(elapsedSec);
        setTimeLeft(remaining);
        setView('exam');
        toast.info('Resumed your active exam session.');
      } catch { /* ignore */ }
    };
    restoreActiveExam();
  }, [loadCatalog, view, activeExam, enterExam]);

  useEffect(() => {
    if (!exams.length) return;
    const open = new URLSearchParams(location.search).get('open');
    if (!open || prestartExam || view === 'exam' || activeExam || inExam) return;
    const match = exams.find((e) => e.slug === open);
    if (match) setPrestartExam(match);
  }, [exams, location.search, prestartExam, view, activeExam, inExam]);

  const requestFullscreen = async () => {
    try {
      const el = examShellRef.current || document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      setIsFullscreen(!!document.fullscreenElement);
    } catch {
      /* fullscreen optional */
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* ignore */ }
    setIsFullscreen(false);
  };

  const launchExam = async (examId) => {
    setStarting(true);
    try {
      const [startRes, examRes] = await Promise.all([
        api.post(`/exams/${examId}/start`),
        api.get(`/exams/${examId}`)
      ]);

      enterExam({
        examId: startRes.data.exam._id,
        title: startRes.data.exam.title,
        slug: startRes.data.exam.slug,
        icon: startRes.data.exam.icon,
        startedAt: startRes.data.session.startedAt,
        expiresAt: startRes.data.session.expiresAt,
        focusWarnings: 0
      });

      setActiveExam(examRes.data);
      const draft = loadDraft(examRes.data._id, examRes.data.questions.length);
      setAnswers(draft.answers);
      setCurrentQ(draft.currentQ);
      setResults(null);
      setTimeLeft(examRes.data.durationMinutes * 60);
      setElapsed(0);
      setView('exam');
      setPrestartExam(null);
      await requestFullscreen();
      toast.info('Safe exam mode — CyberBot and AI hints are disabled.', { autoClose: 4000 });
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response?.data?.message || 'Finish your current exam first.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to start exam');
      }
    } finally {
      setStarting(false);
    }
  };

  const promptStartExam = (exam) => setPrestartExam(exam);

  const abandonExam = useCallback(async (examId) => {
    if (examId) {
      try {
        await api.post(`/exams/${examId}/abandon`);
      } catch { /* ignore */ }
    }
    if (examId) clearDraft(examId);
    exitExam();
    await exitFullscreen();
    await syncSession();
  }, [exitExam, syncSession]);

  useEffect(() => {
    if (view !== 'exam') return undefined;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        const count = await reportFocusWarning();
        setFocusAlert(`Tab switch detected (${count}). Stay focused — AI remains disabled.`);
        setTimeout(() => setFocusAlert(''), 5000);
      }
    };

    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);

    const onContextMenu = (e) => e.preventDefault();

    const onKeyDown = (e) => {
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const blocked = ['c', 'v', 'x', 'a', 'p', 'u', 's'];
        if (blocked.includes(e.key.toLowerCase())) e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [view, reportFocusWarning]);

  const selectAnswer = (qIndex, optionIndex) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      if (activeExam?._id) saveDraft(activeExam._id, next, currentQ);
      return next;
    });
  };

  useEffect(() => {
    if (view === 'exam' && activeExam?._id) {
      saveDraft(activeExam._id, answers, currentQ);
    }
  }, [view, activeExam?._id, answers, currentQ]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;

    const unanswered = answers.filter(a => a < 0).length;
    if (!auto && unanswered > 0) {
      if (!window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
    }

    clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const res = await api.post(`/exams/${activeExam._id}/submit`, {
        answers,
        timeSpentSeconds: elapsed
      });
      setResults(res.data);
      setView('results');
      clearDraft(activeExam._id);
      await abandonExam(activeExam._id);
      if (res.data.passed) {
        toast.success(`Passed with ${res.data.score}%!`);
        if (res.data.pointsEarned > 0) await refreshUser();
      } else {
        toast.info(`Score: ${res.data.score}% — need ${res.data.passThreshold}% to pass`);
      }
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, answers, elapsed, activeExam, refreshUser, loadCatalog, abandonExam]);

  submitRef.current = handleSubmit;

  useEffect(() => {
    if (view !== 'exam' || !activeExam) return undefined;

    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitRef.current?.(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [view, activeExam?._id]);

  const backToCatalog = async (confirmExit = true) => {
    if (view === 'exam' && confirmExit) {
      if (!window.confirm('Exit the exam without submitting? Your session will end and answers will be lost.')) {
        return;
      }
      await abandonExam(activeExam?._id);
    }
    clearInterval(timerRef.current);
    setView('catalog');
    setActiveExam(null);
    setResults(null);
    loadCatalog();
  };

  const difficultyClass = (d) => `difficulty-${d}`;

  if (loading) return <div className="loading">Loading practice exams...</div>;

  if (view === 'results' && results) {
    const topicBreakdown = {};
    results.results?.forEach(r => {
      if (!topicBreakdown[r.topic]) topicBreakdown[r.topic] = { correct: 0, total: 0 };
      topicBreakdown[r.topic].total++;
      if (r.correct) topicBreakdown[r.topic].correct++;
    });

    return (
      <div className="exams-page">
        <div className="exam-results">
          <div className={`results-score-ring ${results.passed ? 'passed' : 'failed'}`}>
            <span className="score">{results.score}%</span>
            <span className="label">{results.correctCount}/{results.totalQuestions} correct</span>
          </div>
          <h2 className="results-title">
            {results.passed ? '🎓 Exam Passed!' : '📝 Keep Practicing'}
          </h2>
          <p className="results-sub">
            {results.passed
              ? `You met the ${results.passThreshold}% passing threshold.`
              : `You need ${results.passThreshold}% to pass. Review the breakdown below.`}
            {results.pointsEarned > 0 && ` +${results.pointsEarned} points earned!`}
          </p>
          <p className="results-sub">Time: {formatTime(results.timeSpentSeconds || elapsed)}</p>

          {Object.keys(topicBreakdown).length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
              {Object.entries(topicBreakdown).map(([topic, stats]) => (
                <span key={topic} style={{ background: '#161b22', padding: '0.3rem 0.7rem', borderRadius: 8, fontSize: '0.8rem', color: '#8b949e' }}>
                  {topic}: {stats.correct}/{stats.total}
                </span>
              ))}
            </div>
          )}

          <button className="submit-exam-btn" onClick={() => backToCatalog(false)}>← Back to Exams</button>

          <div className="results-breakdown">
            <h3>📋 Question Review</h3>
            {results.results?.map((r, i) => (
              <div key={i} className={`result-item ${r.correct ? 'correct' : 'incorrect'}`}>
                <div className="result-item-header">
                  <span className="result-question">Q{i + 1}. {r.question}</span>
                  <span className={`result-status ${r.correct ? 'correct' : 'incorrect'}`}>
                    {r.correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                {!r.correct && r.selectedIndex >= 0 && (
                  <p style={{ color: '#8b949e', fontSize: '0.82rem', margin: '0.3rem 0' }}>
                    Your answer: {LETTERS[r.selectedIndex]} · Correct: {LETTERS[r.correctIndex]}
                  </p>
                )}
                {r.explanation && (
                  <p className="result-explanation">{r.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (prestartExam) {
    return (
      <div className="exams-page">
        <div className="exam-prestart-overlay">
          <div className="exam-prestart-modal">
            <h2>{prestartExam.icon} {prestartExam.title}</h2>
            <p>Enter Safe Exam Browser to begin. This mode locks AI assistance and discourages leaving the exam window.</p>
            <ul className="exam-prestart-rules">
              <li>CyberBot, SOC Assistant, AI hints, and lab mentor are disabled server-side</li>
              <li>Navigation away from the exam requires confirmation</li>
              <li>Tab switches are logged and shown as warnings</li>
              <li>Right-click is disabled during the exam</li>
              <li>Fullscreen is recommended (optional if blocked by browser)</li>
              <li>{prestartExam.questionCount} questions · {prestartExam.durationMinutes} min · {prestartExam.passThreshold}% to pass</li>
            </ul>
            <div className="exam-prestart-actions">
              <button type="button" className="exam-prestart-btn secondary" onClick={() => setPrestartExam(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="exam-prestart-btn primary"
                disabled={starting}
                onClick={() => launchExam(prestartExam._id)}
              >
                {starting ? 'Starting...' : '🔒 Enter Safe Exam Browser'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'exam' && activeExam) {
    const questions = activeExam.questions;
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const answeredCount = answers.filter(a => a >= 0).length;

    return (
      <div className={`exam-safe-shell ${isFullscreen ? 'fullscreen' : ''}`} ref={examShellRef}>
        {focusAlert && <div className="exam-focus-toast">{focusAlert}</div>}
        <div className="exam-safe-banner">
          <div>
            <strong>🔒 Safe Exam Mode</strong> — AI disabled · Do not leave this window
          </div>
          <div className="exam-safe-tags">
            <span className="exam-safe-tag">CyberBot off</span>
            <span className="exam-safe-tag">No AI hints</span>
            {focusWarnings > 0 && (
              <span className="exam-safe-tag warn">Focus warnings: {focusWarnings}</span>
            )}
            {!isFullscreen && (
              <button type="button" className="exam-safe-tag" onClick={requestFullscreen} style={{ cursor: 'pointer' }}>
                ⛶ Fullscreen
              </button>
            )}
          </div>
        </div>
        <div className="exams-page">
        <div className="exam-session secure">
          <div className="exam-session-header">
            <div className="exam-session-title">
              <span style={{ fontSize: '1.5rem' }}>{activeExam.icon}</span>
              <h2>{activeExam.title}</h2>
            </div>
            <div className={`exam-timer ${timeLeft < 300 ? 'urgent' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="exam-progress-bar">
            <div className="exam-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Question {currentQ + 1} of {questions.length} · {answeredCount} answered · Pass: {activeExam.passThreshold}%
          </p>

          <div className="question-card">
            {q.topic && <span className="question-topic">{q.topic}</span>}
            <p className="question-text">{q.question}</p>
            <div className="option-list">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={`option-btn ${answers[currentQ] === i ? 'selected' : ''}`}
                  onClick={() => selectAnswer(currentQ, i)}
                >
                  <span className="option-letter">{LETTERS[i]}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="exam-nav">
            <button
              type="button"
              className="back-exam-btn"
              onClick={() => currentQ > 0 ? setCurrentQ(c => c - 1) : backToCatalog(true)}
            >
              {currentQ > 0 ? '← Previous' : '← Exit Exam'}
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentQ < questions.length - 1 ? (
                <button
                  type="button"
                  className="submit-exam-btn"
                  style={{ background: '#1f6feb' }}
                  onClick={() => setCurrentQ(c => c + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  className="submit-exam-btn"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                >
                  {submitting ? 'Grading...' : '✓ Submit Exam'}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exams-page">
      <div className="exams-header">
        <h1>🎓 Practice Exams</h1>
        <p>Certification-style assessments with automatic grading. Pass to earn points and track your readiness.</p>
      </div>

      <div className="exams-grid">
        {exams.map(exam => (
          <div
            key={exam._id}
            className={`exam-card ${exam.passed ? 'passed' : ''}`}
            onClick={() => promptStartExam(exam)}
          >
            {exam.passed && <span className="exam-passed-badge">✓ Passed</span>}
            <div className="exam-card-icon">{exam.icon}</div>
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
            <div className="exam-card-meta">
              <span className={difficultyClass(exam.difficulty)}>{exam.difficulty}</span>
              <span>📝 {exam.questionCount} questions</span>
              <span>⏱️ {exam.durationMinutes} min</span>
              <span>🎯 {exam.passThreshold}% to pass</span>
            </div>
            {exam.bestScore != null && (
              <p className="exam-best-score">
                Best score: {exam.bestScore}%
                {exam.attemptCount > 0 && ` · ${exam.attemptCount} attempt${exam.attemptCount !== 1 ? 's' : ''}`}
              </p>
            )}
            {!exam.passed && exam.bestScore == null && (
              <p className="exam-best-score">Not attempted yet</p>
            )}
          </div>
        ))}
      </div>

      {exams.length === 0 && (
        <p style={{ color: '#8b949e', textAlign: 'center' }}>
          No exams available. Run <code>node seedExams.js</code> on the server.
        </p>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h2>📊 Recent Attempts</h2>
          {history.slice(0, 10).map(attempt => (
            <div key={attempt._id} className="history-row">
              <span>
                {attempt.exam?.icon} {attempt.exam?.title}
                <span className="meta" style={{ display: 'block' }}>
                  {new Date(attempt.submittedAt).toLocaleDateString()} · {formatTime(attempt.timeSpentSeconds || 0)}
                </span>
              </span>
              <span style={{ color: attempt.passed ? '#3fb950' : '#f85149', fontWeight: 600 }}>
                {attempt.score}% {attempt.passed ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeExams;
