import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'sidebar' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${variant} ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={!isDark}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__icons">
          <span className="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
          <span className="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
        </span>
        <span className="theme-toggle__thumb" />
      </span>
      {variant === 'sidebar' && (
        <span className="theme-toggle__label">{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
