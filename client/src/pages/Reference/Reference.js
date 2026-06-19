import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './Reference.css';

const LINK_ICONS = {
  website: '🌐',
  tool: '🧰',
  library: '📦',
  book: '📕',
  cert: '🎓',
  standard: '📜',
  course: '🎬',
  repo: '💾'
};

const ReferenceCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ articles: [], counts: {}, categories: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const category = searchParams.get('category') || 'all';
  const difficulty = searchParams.get('difficulty') || 'all';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        if (search.trim().length >= 2) params.set('q', search.trim());
        const res = await api.get(`/reference?${params}`);
        setData(res.data);
      } catch {
        toast.error('Failed to load reference library');
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [category, difficulty, search]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const featured = useMemo(() => data.articles.filter(a => a.featured), [data.articles]);
  const regular = useMemo(() => data.articles.filter(a => !a.featured), [data.articles]);

  const totalAll = Object.values(data.counts || {}).reduce((s, n) => s + n, 0);

  return (
    <div className="reference-page">
      <aside className="reference-sidebar">
        <h3>Categories</h3>
        <button
          type="button"
          className={`ref-cat-btn ${category === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('category', 'all')}
        >
          <span>📚</span> All topics
          <span className="ref-cat-count">{totalAll}</span>
        </button>
        {(data.categories || []).map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`ref-cat-btn ${category === cat.id ? 'active' : ''}`}
            onClick={() => setFilter('category', cat.id)}
          >
            <span>{cat.icon}</span> {cat.label}
            <span className="ref-cat-count">{data.counts?.[cat.id] || 0}</span>
          </button>
        ))}
      </aside>

      <div className="reference-main">
        <header className="reference-main-header">
          <h1>Cybersecurity Reference</h1>
          <p>
            Your curated knowledge base for ethical hacking, penetration testing, digital forensics,
            blue team operations, careers, certifications, tools, libraries, and learning resources.
          </p>
        </header>

        <div className="ref-toolbar">
          <input
            type="search"
            className="ref-search"
            placeholder="Search articles, tags, topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="ref-filter-select"
            value={difficulty}
            onChange={e => setFilter('difficulty', e.target.value)}
          >
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {loading ? (
          <div className="ref-loading">Loading reference library...</div>
        ) : data.articles.length === 0 ? (
          <div className="ref-empty">
            <p>No articles match your filters.</p>
            <p>Run <code>npm run seed:reference</code> in the server folder if the library is empty.</p>
          </div>
        ) : (
          <>
            {category === 'all' && !search && featured.length > 0 && (
              <section className="ref-featured">
                <h2>⭐ Featured guides</h2>
                <div className="ref-grid">
                  {featured.map(article => (
                    <ArticleCard key={article.slug} article={article} featured />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="ref-section-title">
                {category === 'all' && !search ? 'All articles' : `${data.articles.length} article${data.articles.length !== 1 ? 's' : ''}`}
              </h2>
              <div className="ref-grid">
                {(category === 'all' && !search ? regular : data.articles).map(article => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const ArticleCard = ({ article, featured }) => (
  <Link to={`/reference/${article.slug}`} className={`ref-card ${featured ? 'featured-card' : ''}`}>
    <div className="ref-card-top">
      <span className="ref-card-icon">{article.icon}</span>
      <span className={`ref-diff ${article.difficulty}`}>{article.difficulty}</span>
    </div>
    <h3>{article.title}</h3>
    <p>{article.summary}</p>
    <div className="ref-card-meta">
      <span>⏱ {article.readingMinutes} min read</span>
      {article.tags?.slice(0, 2).map(t => (
        <span key={t} className="ref-tag">{t}</span>
      ))}
    </div>
  </Link>
);

const ReferenceArticleView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reference/${slug}`);
        setData(res.data);
      } catch {
        toast.error('Article not found');
        navigate('/reference');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

  if (loading) return <div className="ref-loading">Loading article...</div>;
  if (!data?.article) return null;

  const { article, related } = data;

  return (
    <article className="ref-article-page">
      <button type="button" className="ref-back" onClick={() => navigate('/reference')}>
        ← Back to Reference
      </button>

      <header className="ref-article-hero">
        <span style={{ fontSize: '2.5rem' }}>{article.icon}</span>
        <h1>{article.title}</h1>
        <p className="ref-article-summary">{article.summary}</p>
        <div className="ref-article-badges">
          <span className={`ref-diff ${article.difficulty}`}>{article.difficulty}</span>
          <span className="ref-tag">⏱ {article.readingMinutes} min</span>
          <span className="ref-tag">{article.category.replace(/-/g, ' ')}</span>
          {article.tags?.map(t => <span key={t} className="ref-tag">{t}</span>)}
        </div>
      </header>

      {article.tools?.length > 0 && (
        <div className="ref-tools-panel">
          <h2>🧰 Key tools</h2>
          {article.tools.map(tool => (
            <div key={tool.name} className="ref-tool-item">
              <strong>{tool.name}</strong>
              <span>{tool.description}</span>
              {tool.url && (
                <a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.url}</a>
              )}
            </div>
          ))}
        </div>
      )}

      {article.sections?.map((section, i) => (
        <section key={i} className="ref-article-section">
          <h2>{section.title}</h2>
          {section.content && section.content.split('\n\n').map((para, j) => (
            <p key={j}>{para}</p>
          ))}
          {section.bullets?.length > 0 && (
            <ul className="ref-bullets">
              {section.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          )}
          {section.links?.length > 0 && (
            <div className="ref-links-grid">
              {section.links.map((link, j) => (
                <a
                  key={j}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ref-link-card"
                >
                  <span className="ref-link-type">{LINK_ICONS[link.type] || '🔗'}</span>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </section>
      ))}

      {related?.length > 0 && (
        <section className="ref-related">
          <h2 className="ref-section-title">Related reading</h2>
          <div className="ref-related-grid">
            {related.map(r => (
              <Link key={r.slug} to={`/reference/${r.slug}`} className="ref-related-card">
                <span>{r.icon}</span>{r.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

const Reference = () => {
  const { slug } = useParams();
  if (slug) return <ReferenceArticleView />;
  return <ReferenceCatalog />;
};

export default Reference;
