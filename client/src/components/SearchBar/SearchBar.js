import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './SearchBar.css';

const SearchBar = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const search = async (query) => {
    setQ(query);
    if (query.length < 2) { setResults(null); return; }
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      setOpen(true);
    } catch {}
  };

  const go = (type, id, slug) => {
    setOpen(false);
    setQ('');
    if (type === 'challenge') navigate('/challenges');
    if (type === 'lab') navigate('/labs');
    if (type === 'path') navigate('/roadmap');
    if (type === 'article' && slug) navigate(`/reference/${slug}`);
    if (type === 'studyPlan' && slug) navigate(`/study-plans/${slug}`);
  };

  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="🔍 Search..."
        value={q}
        onChange={e => search(e.target.value)}
        onFocus={() => results && setOpen(true)}
      />
      {open && results && (
        <div className="search-dropdown">
          {results.challenges?.map(c => (
            <button key={c._id} onClick={() => go('challenge', c._id)}>
              🚩 {c.title} <span>{c.category}</span>
            </button>
          ))}
          {results.labs?.map(l => (
            <button key={l._id} onClick={() => go('lab', l._id)}>
              🖥️ {l.title} <span>{l.category}</span>
            </button>
          ))}
          {results.paths?.map(p => (
            <button key={p._id} onClick={() => go('path', p._id)}>
              🗺️ {p.title}
            </button>
          ))}
          {results.articles?.map(a => (
            <button key={a.slug} onClick={() => go('article', a._id, a.slug)}>
              📚 {a.title} <span>{a.category}</span>
            </button>
          ))}
          {results.studyPlans?.map(sp => (
            <button key={sp.slug} onClick={() => go('studyPlan', sp._id, sp.slug)}>
              📅 {sp.title} <span>{sp.career}</span>
            </button>
          ))}
          {!results.challenges?.length && !results.labs?.length && !results.paths?.length && !results.articles?.length && !results.studyPlans?.length && (
            <p className="search-empty">No results</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
