import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './WriteupSubmitPanel.css';

const ScoreBar = ({ label, score }) => (
  <div className="review-score-row">
    <span>{label}</span>
    <div className="review-score-bar">
      <div className="review-score-fill" style={{ width: `${score * 10}%` }} />
    </div>
    <span className="review-score-num">{score}/10</span>
  </div>
);

const WriteupSubmitPanel = ({ challengeId, onSubmitted }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [community, setCommunity] = useState([]);

  useEffect(() => {
    api.get(`/writeups/challenge/${challengeId}`)
      .then(r => setCommunity(r.data))
      .catch(() => {});
  }, [challengeId]);

  const alreadySubmitted = community.some(
    w => w.user?.toString() === user?._id || w.username === user?.username
  );

  const handleReview = async () => {
    if (!content.trim()) return toast.error('Write your writeup first');
    setReviewing(true);
    setReview(null);
    try {
      const res = await api.post('/ai/review-writeup', { challengeId, title, content });
      setReview(res.data.review);
      toast.success('AI review complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error('Title and content required');
    setSubmitting(true);
    try {
      await api.post('/writeups', { challengeId, title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setReview(null);
      toast.success('Writeup submitted!');
      const list = await api.get(`/writeups/challenge/${challengeId}`);
      setCommunity(list.data);
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="writeup-submit-panel submitted">
        <p>✅ You submitted a writeup for this challenge.</p>
      </div>
    );
  }

  return (
    <div className="writeup-submit-panel">
      <h4>✍️ Submit Community Writeup</h4>
      <p className="writeup-submit-hint">
        Share your solution approach. Use AI review to improve accuracy and clarity before publishing.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Writeup title"
          maxLength={120}
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Describe your approach, tools used, and step-by-step solution..."
          rows={6}
        />
        <div className="writeup-submit-actions">
          <button type="button" className="review-btn" onClick={handleReview} disabled={reviewing || !content.trim()}>
            {reviewing ? 'Reviewing...' : '🤖 Review with AI'}
          </button>
          <button type="submit" className="submit-writeup-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Publish Writeup'}
          </button>
        </div>
      </form>

      {review && (
        <div className="ai-review-card">
          <h5>🤖 AI Review</h5>
          <p className="review-summary">{review.summary}</p>
          <ScoreBar label="Accuracy" score={review.accuracy} />
          <ScoreBar label="Clarity" score={review.clarity} />
          <ScoreBar label="Overall" score={review.overallScore} />
          {review.missingSteps?.length > 0 && (
            <div className="review-list">
              <strong>Missing steps</strong>
              <ul>{review.missingSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {review.improvements?.length > 0 && (
            <div className="review-list">
              <strong>Suggested improvements</strong>
              <ul>{review.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {community.length > 0 && (
        <div className="community-writeups">
          <strong>Community writeups ({community.length})</strong>
          {community.slice(0, 3).map(w => (
            <div key={w._id} className="community-writeup-item">
              <span>{w.title}</span>
              <small>by {w.username} · 👍 {w.upvoteCount || 0}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WriteupSubmitPanel;
