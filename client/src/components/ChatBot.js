import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import './ChatBot.css';

const ChatBot = () => {
  const { user } = useAuth();
  const { inExam, session } = useExam();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);

  // Rebuild greeting whenever user changes
  useEffect(() => {
    const greeting = user
      ? `Hey ${user.username}! I'm CyberBot 🤖\n\nI can see your profile — Level ${user.level}, ${user.points} pts${user.dailyStreak > 0 ? `, ${user.dailyStreak}-day streak 🔥` : ''}.\n\nAsk me anything or try:\n• "What lab should I do next?"\n• "What are my weak areas?"\n• "Explain SQL injection"`
      : `Hi! I'm CyberBot 🤖 Your personal cybersecurity mentor!\n\nWhat would you like to learn today?`;

    setMessages([{ role: 'assistant', content: greeting }]);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    if (inExam) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔒 CyberBot is disabled during "${session?.title || 'your practice exam'}". Finish or exit the exam to chat again.`
      }]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');

    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build history: all messages except the initial greeting and current user message
      const history = updatedMessages
        .slice(1, -1)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const endpoint = user ? '/ai/chat' : '/ai/public-ask';
      const payload = user
        ? { message: userMessage, conversationHistory: history }
        : { question: userMessage };

      const res = await api.post(endpoint, payload);

      const reply = { role: 'assistant', content: res.data.message };
      setMessages(prev => [...prev, reply]);
      if (!isOpen) setUnread(prev => prev + 1);
    } catch (err) {
      console.error('ChatBot error:', err?.response?.status, err?.response?.data || err?.message);
      const status = err?.response?.status;
      let errMsg = 'Sorry, something went wrong. Please try again.';
      if (status === 401) errMsg = 'Session expired — please log out and log back in.';
      else if (status === 403 && err?.response?.data?.code === 'EXAM_IN_PROGRESS') {
        errMsg = err.response.data.message;
      } else if (status === 429) errMsg = 'Too many messages! Wait a moment before sending more.';
      else if (err?.response?.data?.message) errMsg = err.response.data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = user ? [
    '🎯 What lab should I do next?',
    '📊 Analyze my progress',
    '⚠️ What are my weak areas?',
    '🛠️ Best tools for pentesting?',
    '🌐 Explain SQL injection',
    '🏆 How do I level up faster?',
  ] : [
    '🔰 How do I start hacking?',
    '🛠️ Best tools for pentesting?',
    '🌐 What is SQL injection?',
    '🔐 How does JWT work?',
  ];

  const clearChat = () => {
    const greeting = user
      ? `Hey ${user.username}! I'm CyberBot 🤖\n\nWhat would you like to work on?`
      : `Hi! I'm CyberBot 🤖 What would you like to learn today?`;
    setMessages([{ role: 'assistant', content: greeting }]);
  };

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>CyberBot</h3>
                <span className="chatbot-status">● Always online</span>
              </div>
            </div>
            <div className="chatbot-actions">
              <button className="chatbot-action-btn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="chatbot-action-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <span className="chatbot-msg-avatar">🤖</span>
                )}
                <div className="chatbot-bubble">
                  {msg.content.split('\n').map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <span className="chatbot-msg-avatar user">👤</span>
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message assistant">
                <span className="chatbot-msg-avatar">🤖</span>
                <div className="chatbot-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                className="chatbot-quick-btn"
                onClick={() => setInput(q.slice(3))}
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={sendMessage} className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything about cybersecurity..."
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      )}

      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && unread > 0 && (
          <span className="chatbot-unread">{unread}</span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
