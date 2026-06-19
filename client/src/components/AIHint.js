import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useExam } from '../context/ExamContext';
import './AIHint.css';

const AIHint = ({ challenge, isOpen, onClose }) => {
  const { inExam, session } = useExam();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm CyberBot 🤖 I'm here to help you with "${challenge?.title}". Ask me anything — I'll guide you without spoiling the flag!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    if (inExam) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔒 AI hints are disabled during "${session?.title || 'your practice exam'}". Finish or exit the exam first.`
      }]);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/ai/hint', {
        challengeId: challenge._id,
        userMessage,
        conversationHistory: history
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || 'Sorry, I am unavailable right now. Try again later!'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Give me a hint',
    'What tools should I use?',
    'Explain the vulnerability',
    'Where do I start?'
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={e => e.stopPropagation()}>
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-avatar">🤖</span>
            <div>
              <h3>CyberBot</h3>
              <span className="ai-status">● Online</span>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}>✕</button>
        </div>

        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="msg-avatar">🤖</span>
              )}
              <div className="msg-bubble">
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <span className="msg-avatar user-avatar">👤</span>
              )}
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <span className="msg-avatar">🤖</span>
              <div className="msg-bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              className="quick-btn"
              onClick={() => {
                setInput(q);
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={sendMessage} className="ai-input-form">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask CyberBot for help..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIHint;