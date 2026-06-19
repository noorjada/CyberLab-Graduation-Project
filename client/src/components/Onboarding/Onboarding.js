import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Onboarding.css';

const Onboarding = () => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [careerPath, setCareerPath] = useState('general');
  const [currentTrack, setCurrentTrack] = useState('beginner');
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.onboardingComplete || dismissed) return null;

  const finish = async (skip = false) => {
    try {
      await api.put('/users/me', {
        careerPath: skip ? user.careerPath || 'general' : careerPath,
        currentTrack: skip ? user.currentTrack || 'beginner' : currentTrack,
        onboardingComplete: true
      });
      await refreshUser();
    } catch {
      setDismissed(true);
    }
  };

  const steps = [
    {
      title: 'Welcome to CyberLab! 🛡️',
      body: 'Hands-on hacking labs, CTF challenges, and AI mentorship — let\'s personalize your journey.'
    },
    {
      title: 'Pick your career path',
      body: (
        <div className="onboard-options">
          {[['pentester', '⚔️ Pentester'], ['soc', '🛡️ SOC Analyst'], ['forensics', '🔍 Forensics'], ['general', '🎯 General']].map(([k, l]) => (
            <button key={k} className={careerPath === k ? 'active' : ''} onClick={() => setCareerPath(k)}>{l}</button>
          ))}
        </div>
      )
    },
    {
      title: 'What\'s your skill level?',
      body: (
        <div className="onboard-options">
          {[['beginner', '🌱 Beginner'], ['intermediate', '⚡ Intermediate'], ['advanced', '💀 Advanced']].map(([k, l]) => (
            <button key={k} className={currentTrack === k ? 'active' : ''} onClick={() => setCurrentTrack(k)}>{l}</button>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-close" onClick={() => finish(true)} aria-label="Skip onboarding">✕</button>
        <h2>{steps[step].title}</h2>
        <div className="onboarding-body">{steps[step].body}</div>
        <div className="onboarding-actions">
          <button type="button" className="skip-btn" onClick={() => finish(true)}>Skip</button>
          <div className="onboarding-nav">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}
            {step < steps.length - 1 ? (
              <button type="button" className="primary" onClick={() => setStep(step + 1)}>Next →</button>
            ) : (
              <button type="button" className="primary" onClick={() => finish(false)}>Start Hacking 🚀</button>
            )}
          </div>
        </div>
        <div className="onboard-dots">
          {steps.map((_, i) => <span key={i} className={i === step ? 'active' : ''} />)}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
