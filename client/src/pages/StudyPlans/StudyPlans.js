import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './StudyPlans.css';

const CAREER_META = {
  pentester: { label: 'Pentester', icon: '🕷️', color: '#3fb950' },
  soc: { label: 'SOC Analyst', icon: '👁️', color: '#58a6ff' },
  forensics: { label: 'Forensics', icon: '🔍', color: '#d29922' },
  general: { label: 'General', icon: '🛡️', color: '#8b949e' }
};

const LINK_ICONS = {
  challenge: '🚩',
  lab: '🖥️',
  labs: '🖥️',
  reference: '📚',
  roadmap: '🗺️',
  soc: '🛡️',
  exams: '🎓',
  exploits: '🌐',
  notes: '📓',
  terminal: '💻',
  virustotal: '🦠',
  certificates: '📜',
  course: '🎓',
  external: '🔗'
};

const StudyPlanLink = ({ lnk }) => {
  const icon = LINK_ICONS[lnk.type] || '🔗';
  const className = 'study-topic-link';
  if (lnk.type === 'external' || (lnk.path && /^https?:\/\//i.test(lnk.path))) {
    return (
      <a href={lnk.path} className={className} target="_blank" rel="noopener noreferrer">
        {icon} {lnk.label}
      </a>
    );
  }
  return (
    <Link to={lnk.path || '#'} className={className}>
      {icon} {lnk.label}
    </Link>
  );
};

const StudyPlanCatalog = ({ plans, activePlan, onSelect, filter, setFilter }) => (
  <div className="study-plans-catalog">
    {activePlan && (
      <div className="study-active-banner">
        <div>
          <span className="study-active-label">Your active plan</span>
          <strong>{activePlan.icon} {activePlan.title}</strong>
          <span>{activePlan.progress}% complete · {activePlan.completedTopics}/{activePlan.totalTopics} topics</span>
        </div>
        <button type="button" className="study-active-btn" onClick={() => onSelect(activePlan)}>
          Continue →
        </button>
      </div>
    )}

    <div className="study-filters">
      {['all', 'pentester', 'soc', 'forensics'].map(key => {
        const meta = key === 'all' ? { label: 'All plans', icon: '📅' } : CAREER_META[key];
        return (
          <button
            key={key}
            type="button"
            className={`study-filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {meta.icon} {meta.label}
          </button>
        );
      })}
    </div>

    <div className="study-plans-grid">
      {plans.map(plan => {
        const career = CAREER_META[plan.career] || CAREER_META.general;
        return (
          <article
            key={plan._id}
            className={`study-plan-card ${plan.isActive ? 'active-plan' : ''} ${plan.featured ? 'featured' : ''}`}
            onClick={() => onSelect(plan)}
            onKeyDown={e => e.key === 'Enter' && onSelect(plan)}
            role="button"
            tabIndex={0}
          >
            {plan.featured && <span className="study-featured-badge">Featured</span>}
            <div className="study-plan-card-icon" style={{ background: `${plan.color}22`, color: plan.color }}>
              {plan.icon}
            </div>
            <h3>{plan.title}</h3>
            <p className="study-plan-sub">{plan.subtitle}</p>
            <div className="study-plan-meta">
              <span style={{ color: career.color }}>{career.icon} {career.label}</span>
              <span>⏱ {plan.duration}</span>
              <span>{plan.phases?.length || 0} phases</span>
            </div>
            {plan.enrolled && (
              <div className="study-plan-progress">
                <div className="study-plan-progress-bar">
                  <div className="study-plan-progress-fill" style={{ width: `${plan.progress}%`, background: plan.color }} />
                </div>
                <span>{plan.progress}%</span>
              </div>
            )}
            <span className="study-plan-cta">View plan →</span>
          </article>
        );
      })}
    </div>
  </div>
);

const StudyPlanDetail = ({ plan, enrolling, onEnroll, onToggleTopic, onBack }) => {
  const career = CAREER_META[plan.career] || CAREER_META.general;

  return (
    <div className="study-plan-detail">
      <button type="button" className="study-back-btn" onClick={onBack}>← All study plans</button>

      <header className="study-detail-header" style={{ borderColor: `${plan.color}44` }}>
        <div className="study-detail-icon" style={{ background: `${plan.color}22`, color: plan.color }}>
          {plan.icon}
        </div>
        <div className="study-detail-titles">
          <span className="study-detail-career" style={{ color: career.color }}>
            {career.icon} {career.label} · {plan.duration}
          </span>
          <h1>{plan.title}</h1>
          <p>{plan.description}</p>
        </div>
        <div className="study-detail-actions">
          {!plan.enrolled ? (
            <button type="button" className="study-enroll-btn" disabled={enrolling} onClick={onEnroll}>
              {enrolling ? 'Enrolling...' : 'Start this plan'}
            </button>
          ) : (
            <div className="study-enrolled-badge">
              {plan.isActive ? '✓ Active plan' : '✓ Enrolled'}
              <span>{plan.progress}% · {plan.completedTopics}/{plan.totalTopics} topics</span>
            </div>
          )}
        </div>
      </header>

      {plan.outcomes?.length > 0 && (
        <section className="study-outcomes">
          <h3>What you will learn</h3>
          <ul>
            {plan.outcomes.map((o, i) => (
              <li key={i}><span>✓</span>{o}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="study-phases">
        {plan.phases?.map((phase, phaseIdx) => (
          <section key={phase.id} className="study-phase">
            <div className="study-phase-header">
              <span className="study-phase-num">{phaseIdx + 1}</span>
              <div>
                <h2>{phase.title}</h2>
                <p>{phase.description}</p>
                <span className="study-phase-progress">
                  {phase.completedTopics}/{phase.totalTopics} topics · {phase.progress}%
                </span>
              </div>
            </div>

            <div className="study-topics">
              {phase.topics?.map(topic => (
                <div key={topic.id} className={`study-topic ${topic.completed ? 'completed' : ''}`}>
                  <div className="study-topic-head">
                    <button
                      type="button"
                      className={`study-topic-check ${topic.completed ? 'done' : ''}`}
                      onClick={() => onToggleTopic(topic.id)}
                      title={topic.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {topic.completed ? '✓' : ''}
                    </button>
                    <div>
                      <h4>
                        {topic.day ? <span className="study-topic-day">Day {topic.day}</span> : null}
                        {topic.week && !topic.day ? <span className="study-topic-day">Week {topic.week}</span> : null}
                        {topic.title}
                      </h4>
                      <p>{topic.description}</p>
                      <span className="study-topic-hours">~{topic.estimatedHours}h</span>
                    </div>
                  </div>

                  {topic.frameworks?.length > 0 && (
                    <div className="study-topic-frameworks">
                      {topic.frameworks.map((fw, i) => (
                        <span key={i} className="study-fw-badge">{fw}</span>
                      ))}
                    </div>
                  )}

                  {topic.objectives?.length > 0 && (
                    <ul className="study-topic-objectives">
                      {topic.objectives.map((obj, i) => (
                        <li key={i}><span>✓</span>{obj}</li>
                      ))}
                    </ul>
                  )}

                  {topic.links?.length > 0 && (
                    <div className="study-topic-links">
                      {topic.links.map((lnk, i) => (
                        <StudyPlanLink key={`${lnk.type}-${lnk.path}-${i}`} lnk={lnk} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const StudyPlans = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadPlans = async () => {
    try {
      const res = await api.get('/study-plans');
      setPlans(res.data.plans || []);
      setActivePlan(res.data.activePlan || null);
    } catch {
      toast.error('Failed to load study plans');
    }
  };

  const loadDetail = async (planSlug) => {
    setLoading(true);
    try {
      const res = await api.get(`/study-plans/${planSlug}`);
      setSelected(res.data);
    } catch {
      toast.error('Study plan not found');
      navigate('/study-plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans().finally(() => {
      if (!slug) setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (slug) loadDetail(slug);
    else setSelected(null);
  }, [slug]);

  const handleSelect = (plan) => {
    navigate(`/study-plans/${plan.slug}`);
  };

  const handleBack = () => navigate('/study-plans');

  const handleEnroll = async () => {
    if (!selected) return;
    setEnrolling(true);
    try {
      const res = await api.post(`/study-plans/${selected._id}/enroll`);
      setSelected(res.data.plan);
      await loadPlans();
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleTopic = async (topicId) => {
    if (!selected) return;
    try {
      const res = await api.post(`/study-plans/${selected._id}/topics/${topicId}/toggle`);
      setSelected(res.data.plan);
      await loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update topic');
    }
  };

  const filteredPlans = filter === 'all'
    ? plans
    : plans.filter(p => p.career === filter);

  if (loading && slug) {
    return <div className="study-plans-page"><p className="study-loading">Loading study plan...</p></div>;
  }

  return (
    <div className="study-plans-page">
      {!slug ? (
        <>
          <header className="study-plans-hero">
            <span className="study-hero-badge">⭐ Study Plans</span>
            <h1>Structured career learning paths</h1>
            <p>Follow week-by-week plans for pentesting, SOC analysis, and digital forensics — with linked labs, challenges, and reference material.</p>
          </header>
          <StudyPlanCatalog
            plans={filteredPlans}
            activePlan={activePlan}
            onSelect={handleSelect}
            filter={filter}
            setFilter={setFilter}
          />
        </>
      ) : selected ? (
        <StudyPlanDetail
          plan={selected}
          enrolling={enrolling}
          onEnroll={handleEnroll}
          onToggleTopic={handleToggleTopic}
          onBack={handleBack}
        />
      ) : null}
    </div>
  );
};

export default StudyPlans;
