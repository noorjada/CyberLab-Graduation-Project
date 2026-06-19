import React, { useState, useEffect, useMemo, useCallback } from 'react';
import InteractiveModule from './InteractiveModule';
import VideoLessonStep from './VideoLessonStep';
import CertificateProgressStep from './CertificateProgressStep';
import './TheoryLessonPanel.css';

const STEPS = [
  { id: 'lesson', icon: '📖', label: 'Lesson' },
  { id: 'video', icon: '🎬', label: 'Video' },
  { id: 'quiz', icon: '❓', label: 'Quiz' },
  { id: 'handsOn', icon: '🎯', label: 'Lab' },
  { id: 'certificate', icon: '📜', label: 'Certificate' }
];

const SECTIONS = [
  { key: 'theory', icon: '📖', label: 'Theory' },
  { key: 'example', icon: '🧪', label: 'Example' },
  { key: 'commonMistakes', icon: '⚠️', label: 'Common mistakes' },
  { key: 'defense', icon: '🛡️', label: 'Defense' },
  { key: 'labGoal', icon: '🎯', label: 'Goal' }
];

const TheoryLessonPanel = ({
  lesson,
  itemType = 'challenge',
  itemId,
  itemTitle = '',
  itemCategory = '',
  points = 0,
  isCompleted = false,
  compact = false,
  onAcknowledge
}) => {
  const storageKey = itemId ? `learning-path-${itemType}-${itemId}` : null;

  const videos = lesson?.videos || [];
  const interactives = lesson?.interactives || [];
  const hasVideos = videos.length > 0;
  const hasInteractives = interactives.length > 0;
  const useInteractiveQuiz = lesson?.interactiveMode !== false && hasInteractives;

  const hasReference = useMemo(() => {
    if (!lesson?.enabled) return false;
    return SECTIONS.some(({ key }) => {
      const block = lesson[key];
      return block?.content || block?.bullets?.length || block?.code;
    });
  }, [lesson]);

  const hasContent = hasReference || hasVideos || hasInteractives;

  const activeSteps = useMemo(() => {
    const handsOnLabel = itemType === 'lab' ? 'Lab' : 'Challenge';
    return STEPS
      .filter(s => {
        if (s.id === 'video') return hasVideos;
        if (s.id === 'quiz') return useInteractiveQuiz || hasReference;
        return true;
      })
      .map(s => (s.id === 'handsOn' ? { ...s, label: handsOnLabel } : s));
  }, [hasVideos, useInteractiveQuiz, hasReference, itemType]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [lessonDone, setLessonDone] = useState(false);
  const [videoDone, setVideoDone] = useState(!hasVideos);
  const [quizDone, setQuizDone] = useState(false);
  const [handsOnAck, setHandsOnAck] = useState(false);
  const firstSection = useMemo(() => {
    for (const { key } of SECTIONS) {
      const block = lesson?.[key];
      if (block?.content || block?.bullets?.length || block?.code) return key;
    }
    return null;
  }, [lesson]);

  const [openSection, setOpenSection] = useState(null);
  const [restored, setRestored] = useState(false);

  const currentStep = activeSteps[currentStepIdx]?.id;

  const unlockHandsOn = useCallback(() => {
    onAcknowledge?.();
  }, [onAcknowledge]);

  useEffect(() => {
    if (!lesson?.enabled || !hasContent) onAcknowledge?.();
  }, [lesson?.enabled, hasContent, onAcknowledge]);

  useEffect(() => {
    if (!storageKey || restored) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved.lessonDone) setLessonDone(true);
      if (saved.videoDone || !hasVideos) setVideoDone(true);
      if (saved.quizDone) {
        setQuizDone(true);
        unlockHandsOn();
      }
      if (saved.handsOnAck) setHandsOnAck(true);
      if (typeof saved.stepIdx === 'number' && saved.stepIdx < activeSteps.length) {
        setCurrentStepIdx(saved.stepIdx);
      }
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, [storageKey, restored, hasVideos, activeSteps.length, unlockHandsOn]);

  const persist = useCallback((patch) => {
    if (!storageKey) return;
    try {
      const prev = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...patch }));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const goToStep = (idx) => {
    const next = Math.max(0, Math.min(idx, activeSteps.length - 1));
    setCurrentStepIdx(next);
    persist({ stepIdx: next });
  };

  useEffect(() => {
    if (firstSection) setOpenSection(firstSection);
  }, [firstSection, itemId]);

  const advanceStep = () => goToStep(currentStepIdx + 1);

  const handleLessonContinue = () => {
    setLessonDone(true);
    persist({ lessonDone: true });
    advanceStep();
  };

  const handleVideoComplete = useCallback(() => {
    setVideoDone(true);
    persist({ videoDone: true });
    setCurrentStepIdx((prev) => {
      const next = Math.min(prev + 1, activeSteps.length - 1);
      persist({ stepIdx: next });
      return next;
    });
  }, [persist, activeSteps.length]);

  const handleQuizComplete = () => {
    setQuizDone(true);
    persist({ quizDone: true });
    unlockHandsOn();
    advanceStep();
  };

  const handleReferenceAck = () => {
    setQuizDone(true);
    persist({ quizDone: true });
    unlockHandsOn();
    advanceStep();
  };

  const handleHandsOnContinue = () => {
    setHandsOnAck(true);
    persist({ handsOnAck: true });
    advanceStep();
  };

  const stepUnlocked = (idx) => {
    if (idx === 0) return true;
    const prev = activeSteps[idx - 1]?.id;
    if (prev === 'lesson') return lessonDone;
    if (prev === 'video') return videoDone;
    if (prev === 'quiz') return quizDone;
    if (prev === 'handsOn') return handsOnAck;
    return false;
  };

  if (!lesson?.enabled || !hasContent) return null;

  const labLabel = itemType === 'lab' ? 'Lab objective' : 'Challenge goal';
  const handsOnTitle = itemType === 'lab' ? 'Start the lab' : 'Start the challenge';

  return (
    <div className={`theory-lesson learning-path ${compact ? 'theory-lesson--compact' : ''}`}>
      <div className="theory-lesson-header">
        <span className="theory-lesson-badge">⭐ Video Learning Path</span>
        <p className="theory-lesson-intro">
          Lesson → Video → Quiz → {itemType === 'lab' ? 'Lab' : 'Challenge'} → Certificate progress
        </p>
      </div>

      <nav className="learning-stepper" aria-label="Learning path steps">
        {activeSteps.map((step, idx) => {
          const done =
            (step.id === 'lesson' && lessonDone) ||
            (step.id === 'video' && videoDone) ||
            (step.id === 'quiz' && quizDone) ||
            (step.id === 'handsOn' && handsOnAck) ||
            (step.id === 'certificate' && handsOnAck);
          const active = idx === currentStepIdx;
          const unlocked = stepUnlocked(idx);

          return (
            <button
              key={step.id}
              type="button"
              className={`learning-step ${active ? 'active' : ''} ${done ? 'done' : ''} ${!unlocked ? 'locked' : ''}`}
              onClick={() => unlocked && goToStep(idx)}
              disabled={!unlocked}
              title={!unlocked ? 'Complete the previous step first' : step.label}
            >
              <span className="learning-step-icon">{done ? '✓' : step.icon}</span>
              <span className="learning-step-label">{step.label}</span>
              {idx < activeSteps.length - 1 && <span className="learning-step-arrow">↓</span>}
            </button>
          );
        })}
      </nav>

      <div className="learning-step-content">
        {currentStep === 'lesson' && (
          <div className="learning-lesson-step">
            <p className="learning-step-desc">
              Read the core concepts before watching videos and taking the quiz.
            </p>
            <div className="theory-tabs">
              {SECTIONS.map(({ key, icon, label }) => {
                const block = lesson[key];
                const empty = !block?.content && !block?.bullets?.length && !block?.code;
                if (empty) return null;
                const displayLabel = key === 'labGoal' ? labLabel : label;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`theory-tab ${openSection === key ? 'active' : ''}`}
                    onClick={() => setOpenSection(key)}
                  >
                    {icon} {displayLabel}
                  </button>
                );
              })}
            </div>

            {openSection && lesson[openSection] && (
              <div className="theory-panel">
                {(() => {
                  const block = lesson[openSection] || {};
                  return (
                    <div className="theory-panel-content">
                      {block.content && <p>{block.content}</p>}
                      {block.code && (
                        <pre className="theory-code"><code>{block.code}</code></pre>
                      )}
                      {block.bullets?.length > 0 && (
                        <ul className="theory-bullets">
                          {block.bullets.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {!lessonDone && (
              <button type="button" className="theory-ack-btn" onClick={handleLessonContinue}>
                Continue to videos →
              </button>
            )}
          </div>
        )}

        {currentStep === 'video' && hasVideos && (
          <VideoLessonStep videos={videos} onComplete={handleVideoComplete} />
        )}

        {currentStep === 'quiz' && (
          <div className="learning-quiz-step">
            {useInteractiveQuiz ? (
              <InteractiveModule
                exercises={interactives}
                onAllComplete={handleQuizComplete}
              />
            ) : (
              <>
                <p className="learning-step-desc">
                  Review the lesson above, then continue to unlock the {itemType}.
                </p>
                {!quizDone && (
                  <button type="button" className="theory-ack-btn" onClick={handleReferenceAck}>
                    ✓ I understand — continue
                  </button>
                )}
              </>
            )}
            {quizDone && (
              <p className="theory-ack-done">✅ Quiz complete — {itemType} unlocked!</p>
            )}
          </div>
        )}

        {currentStep === 'handsOn' && (
          <div className="learning-handson-step">
            <div className="handson-ready-card">
              <span className="handson-icon">🚀</span>
              <h4>{handsOnTitle}</h4>
              <p>
                You finished the lesson, videos, and quiz for <strong>{itemTitle || `this ${itemType}`}</strong>.
                The hands-on section below is now unlocked.
              </p>
              {points > 0 && (
                <p className="handson-points">Earn <strong>+{points} pts</strong> on completion.</p>
              )}
              {isCompleted ? (
                <p className="theory-ack-done">🏆 Already completed — great work!</p>
              ) : (
                <p className="handson-hint">
                  Scroll down to submit flags and complete tasks.
                </p>
              )}
            </div>
            {!handsOnAck && (
              <button type="button" className="theory-ack-btn" onClick={handleHandsOnContinue}>
                View certificate progress →
              </button>
            )}
          </div>
        )}

        {currentStep === 'certificate' && (
          <CertificateProgressStep
            itemType={itemType}
            itemCategory={itemCategory}
            itemTitle={itemTitle || `this ${itemType}`}
            points={points}
            isItemCompleted={isCompleted}
          />
        )}
      </div>

      {quizDone && currentStep !== 'handsOn' && currentStep !== 'certificate' && (
        <p className="theory-ack-hint subtle">
          {itemType === 'lab' ? 'Lab' : 'Challenge'} unlocked — finish remaining steps or jump to hands-on below.
        </p>
      )}
    </div>
  );
};

export default TheoryLessonPanel;
