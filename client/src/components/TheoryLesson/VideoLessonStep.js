import React, { useState, useEffect, useRef } from 'react';
import './VideoLessonStep.css';

const TYPE_META = {
  youtube: { icon: '▶️', label: 'Curated lesson' },
  instructor: { icon: '🎓', label: 'Instructor' },
  walkthrough: { icon: '🎬', label: 'Lab walkthrough' }
};

const VideoLessonStep = ({ videos = [], onComplete }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [watched, setWatched] = useState({});
  const skippedRef = useRef(false);

  useEffect(() => {
    if (!videos.length && !skippedRef.current) {
      skippedRef.current = true;
      onComplete?.();
    }
  }, [videos.length, onComplete]);

  if (!videos.length) return null;

  const current = videos[activeIdx];
  const meta = TYPE_META[current.type] || TYPE_META.youtube;
  const allWatched = videos.every(v => watched[v.id]);

  const markWatched = (id) => {
    setWatched(prev => {
      const next = { ...prev, [id]: true };
      if (videos.every(v => next[v.id])) onComplete?.();
      return next;
    });
  };

  return (
    <div className="video-lesson-step">
      <div className="vls-tabs">
        {videos.map((v, i) => {
          const m = TYPE_META[v.type] || TYPE_META.youtube;
          return (
            <button
              key={v.id}
              type="button"
              className={`vls-tab ${i === activeIdx ? 'active' : ''} ${watched[v.id] ? 'watched' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {m.icon} {m.label}
              {watched[v.id] && <span className="vls-check">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="vls-player-wrap">
        <iframe
          title={current.title}
          src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="vls-iframe"
        />
      </div>

      <a
        className="vls-youtube-link"
        href={`https://www.youtube.com/watch?v=${current.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        ▶ Watch on YouTube if the embed does not load
      </a>

      <div className="vls-meta">
        <span className="vls-type-badge">{meta.icon} {meta.label}</span>
        {current.duration && <span className="vls-duration">⏱ {current.duration}</span>}
        <span className="vls-instructor">👤 {current.instructor}</span>
      </div>

      <h4 className="vls-title">{current.title}</h4>
      <p className="vls-desc">{current.description}</p>

      {!watched[current.id] ? (
        <button type="button" className="vls-watched-btn" onClick={() => markWatched(current.id)}>
          ✓ Mark as watched
        </button>
      ) : (
        <p className="vls-watched-msg">✅ Watched — {allWatched ? 'all videos complete!' : 'select another tab or continue'}</p>
      )}

      {activeIdx < videos.length - 1 && watched[current.id] && (
        <button type="button" className="vls-next-vid" onClick={() => setActiveIdx(activeIdx + 1)}>
          Next video →
        </button>
      )}
    </div>
  );
};

export default VideoLessonStep;
