import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [focusWarnings, setFocusWarnings] = useState(0);

  const syncSession = useCallback(async () => {
    if (!user) {
      setSession(null);
      setFocusWarnings(0);
      return;
    }
    try {
      const res = await api.get('/exams/session/active');
      if (res.data?.active && res.data.session) {
        setSession(res.data.session);
        setFocusWarnings(res.data.session.focusWarnings || 0);
      } else {
        setSession(null);
        setFocusWarnings(0);
      }
    } catch {
      setSession(null);
    }
  }, [user]);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  useEffect(() => {
    if (session) {
      document.body.classList.add('exam-mode-active');
    } else {
      document.body.classList.remove('exam-mode-active');
    }
    return () => document.body.classList.remove('exam-mode-active');
  }, [session]);

  const enterExam = useCallback((examSession) => {
    setSession(examSession);
    setFocusWarnings(examSession?.focusWarnings || 0);
  }, []);

  const exitExam = useCallback(() => {
    setSession(null);
    setFocusWarnings(0);
  }, []);

  const reportFocusWarning = useCallback(async () => {
    try {
      const res = await api.post('/exams/session/focus-warning');
      setFocusWarnings(res.data.focusWarnings || 0);
      return res.data.focusWarnings || 0;
    } catch {
      return focusWarnings;
    }
  }, [focusWarnings]);

  const inExam = !!session;

  return (
    <ExamContext.Provider value={{
      session,
      inExam,
      focusWarnings,
      enterExam,
      exitExam,
      syncSession,
      reportFocusWarning
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    return {
      session: null,
      inExam: false,
      focusWarnings: 0,
      enterExam: () => {},
      exitExam: () => {},
      syncSession: () => {},
      reportFocusWarning: async () => 0
    };
  }
  return ctx;
};

export default ExamContext;
