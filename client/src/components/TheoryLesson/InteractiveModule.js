import React, { useState, useMemo, useCallback } from 'react';
import './InteractiveModule.css';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const normalize = (s) => String(s || '').trim().toLowerCase();

const DragExercise = ({ exercise, onResult }) => {
  const [order, setOrder] = useState(() => shuffle(exercise.items.map(i => i.id)));
  const [feedback, setFeedback] = useState(null);

  const labelMap = useMemo(
    () => Object.fromEntries(exercise.items.map(i => [i.id, i.label])),
    [exercise.items]
  );

  const check = () => {
    const correct = order.every((id, idx) => id === exercise.correctOrder[idx]);
    setFeedback(correct ? 'correct' : 'wrong');
    onResult(correct);
  };

  const move = (idx, dir) => {
    if (feedback) return;
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrder(next);
  };

  const onDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e, targetIdx) => {
    e.preventDefault();
    if (feedback) return;
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(fromIdx) || fromIdx === targetIdx) return;
    const next = [...order];
    const [item] = next.splice(fromIdx, 1);
    next.splice(targetIdx, 0, item);
    setOrder(next);
  };

  return (
    <div className="ile-drag">
      <p className="ile-drag-hint">Drag items into the correct order (or use ▲▼)</p>
      <ul className="ile-drag-list">
        {order.map((id, idx) => (
          <li
            key={id}
            className={`ile-drag-item ${feedback === 'correct' ? 'correct' : ''} ${feedback === 'wrong' ? 'wrong' : ''}`}
            draggable={!feedback}
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, idx)}
          >
            <span className="ile-drag-handle">⠿</span>
            <span className="ile-drag-label">{idx + 1}. {labelMap[id]}</span>
            {!feedback && (
              <span className="ile-drag-arrows">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === order.length - 1}>▼</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {!feedback && (
        <button type="button" className="ile-check-btn" onClick={check}>Check order</button>
      )}
      {feedback === 'correct' && <p className="ile-feedback correct">✅ Perfect order!</p>}
      {feedback === 'wrong' && (
        <>
          <p className="ile-feedback wrong">❌ Not quite — read the explanation and try again.</p>
          <button
            type="button"
            className="ile-retry-btn"
            onClick={() => {
              setOrder(shuffle(exercise.items.map(i => i.id)));
              setFeedback(null);
            }}
          >
            Reset order
          </button>
        </>
      )}
    </div>
  );
};

const InteractiveModule = ({ exercises = [], onAllComplete }) => {
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState({});
  const [mcqPick, setMcqPick] = useState(null);
  const [fillVal, setFillVal] = useState('');
  const [miniVal, setMiniVal] = useState('');
  const [feedback, setFeedback] = useState(null);

  const current = exercises[index];
  const doneCount = Object.keys(completed).length;
  const allDone = doneCount >= exercises.length && exercises.length > 0;

  const resetInput = useCallback(() => {
    setMcqPick(null);
    setFillVal('');
    setMiniVal('');
    setFeedback(null);
  }, []);

  const markDone = useCallback((exId) => {
    setCompleted(prev => {
      const next = { ...prev, [exId]: true };
      if (Object.keys(next).length >= exercises.length) {
        onAllComplete?.();
      }
      return next;
    });
  }, [exercises.length, onAllComplete]);

  const goNext = () => {
    if (index < exercises.length - 1) {
      setIndex(index + 1);
      resetInput();
    }
  };

  const checkFillOrMini = (value, exercise) => {
    const acceptable = (exercise.acceptable || [exercise.answer]).map(normalize);
    const ok = acceptable.includes(normalize(value));
    setFeedback(ok ? 'correct' : 'wrong');
    if (ok) markDone(exercise.id);
    return ok;
  };

  const checkMcq = (optionIdx) => {
    setMcqPick(optionIdx);
    const ok = optionIdx === current.correctIndex;
    setFeedback(ok ? 'correct' : 'wrong');
    if (ok) markDone(current.id);
  };

  const handleDragResult = (ok) => {
    if (ok) markDone(current.id);
  };

  if (!exercises.length) return null;

  if (allDone) {
    return (
      <div className="ile-complete-banner">
        <span>🎉</span>
        <div>
          <strong>Module complete!</strong>
          <p>You nailed all {exercises.length} exercises — ready for hands-on practice.</p>
        </div>
      </div>
    );
  }

  const typeLabel = {
    mcq: 'Multiple choice',
    fill: 'Fill in the blank',
    drag: 'Attack flow order',
    mini: 'Mini challenge'
  };

  return (
    <div className="interactive-module">
      <div className="ile-progress">
        <div className="ile-progress-bar">
          <div
            className="ile-progress-fill"
            style={{ width: `${(doneCount / exercises.length) * 100}%` }}
          />
        </div>
        <span className="ile-progress-text">
          {doneCount}/{exercises.length} complete · Question {index + 1} of {exercises.length}
        </span>
      </div>

      <div className="ile-card">
        <span className="ile-type-badge">{typeLabel[current.type] || 'Exercise'}</span>
        <h4 className="ile-question">{current.question}</h4>

        {current.type === 'mcq' && (
          <div className="ile-mcq-options">
            {current.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              let cls = 'ile-mcq-opt';
              if (mcqPick !== null) {
                if (i === current.correctIndex) cls += ' correct';
                else if (i === mcqPick) cls += ' wrong';
              }
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  disabled={feedback === 'correct'}
                  onClick={() => checkMcq(i)}
                >
                  <span className="ile-mcq-letter">{letter}.</span> {opt}
                </button>
              );
            })}
          </div>
        )}

        {current.type === 'fill' && (
          <div className="ile-fill">
            <input
              type="text"
              className="ile-fill-input"
              value={fillVal}
              onChange={e => setFillVal(e.target.value)}
              disabled={feedback === 'correct'}
              placeholder="Type your answer..."
              onKeyDown={e => e.key === 'Enter' && !feedback && checkFillOrMini(fillVal, current)}
            />
            {feedback !== 'correct' && (
              <button
                type="button"
                className="ile-check-btn"
                onClick={() => checkFillOrMini(fillVal, current)}
              >
                Check answer
              </button>
            )}
          </div>
        )}

        {current.type === 'mini' && (
          <div className="ile-fill">
            <input
              type="text"
              className="ile-fill-input ile-mini-input"
              value={miniVal}
              onChange={e => setMiniVal(e.target.value)}
              disabled={feedback === 'correct'}
              placeholder="Command, header name, or short answer..."
              onKeyDown={e => e.key === 'Enter' && !feedback && checkFillOrMini(miniVal, current)}
            />
            {feedback !== 'correct' && (
              <button
                type="button"
                className="ile-check-btn"
                onClick={() => checkFillOrMini(miniVal, current)}
              >
                Submit
              </button>
            )}
          </div>
        )}

        {current.type === 'drag' && (
          <DragExercise
            key={current.id}
            exercise={current}
            onResult={(ok) => {
              setFeedback(ok ? 'correct' : 'wrong');
              handleDragResult(ok);
            }}
          />
        )}

        {feedback && current.explanation && (
          <div className={`ile-explanation ${feedback}`}>
            <strong>{feedback === 'correct' ? '💡 Why this is right' : '📚 Learn more'}</strong>
            <p>{current.explanation}</p>
          </div>
        )}

        {feedback === 'correct' && index < exercises.length - 1 && (
          <button type="button" className="ile-next-btn" onClick={goNext}>
            Next exercise →
          </button>
        )}

        {feedback === 'wrong' && current.type !== 'drag' && (
          <button type="button" className="ile-retry-btn" onClick={resetInput}>
            Try again
          </button>
        )}
      </div>

      <div className="ile-dots">
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            type="button"
            className={`ile-dot ${completed[ex.id] ? 'done' : ''} ${i === index ? 'active' : ''}`}
            onClick={() => { setIndex(i); resetInput(); }}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveModule;
