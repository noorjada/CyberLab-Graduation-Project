import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import { applyTheme } from '../utils/applyTheme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, patchUser } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const userSyncedRef = useRef(null);

  // Sync DOM before browser paints — instant visual switch
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Pull theme from server only when a different user logs in (never fight local toggle)
  useEffect(() => {
    if (!user?.id) {
      userSyncedRef.current = null;
      return;
    }
    if (userSyncedRef.current === user.id) return;
    userSyncedRef.current = user.id;
    if (user.theme && user.theme !== theme) {
      setTheme(user.theme);
      applyTheme(user.theme);
    }
  }, [user?.id, user?.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    if (user) {
      patchUser({ theme: next });
      api.put('/users/me', { theme: next }).catch(() => {});
    }
  };

  const setThemeAndApply = (next) => {
    applyTheme(next);
    setTheme(next);
    if (user) {
      patchUser({ theme: next });
      api.put('/users/me', { theme: next }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeAndApply }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
