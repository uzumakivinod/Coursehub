import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, TrendingUp } from 'lucide-react';
import { fetchSuggestions } from '../utils/api';

const TRENDING = ['Python', 'Machine Learning', 'Web Development', 'Docker', 'React', 'Data Science'];

export default function SearchBar({ initialValue = '', autoFocus = false, size = 'lg' }) {
  const [query, setQuery]           = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);

  const navigate    = useNavigate();
  const inputRef    = useRef(null);
  const dropRef     = useRef(null);
  const timerRef    = useRef(null);

  // Auto-focus
  useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced suggestions
  const fetchSuggestionsDebounced = useCallback((q) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await fetchSuggestions(q);
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setActiveIdx(-1);
    setShowDrop(true);
    fetchSuggestionsDebounced(v);
  };

  const doSearch = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setShowDrop(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e) => { e.preventDefault(); doSearch(query); };

  const handleKeyDown = (e) => {
    if (!showDrop) return;
    const len = suggestions.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, len - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); doSearch(suggestions[activeIdx].title); }
    else if (e.key === 'Escape') { setShowDrop(false); setActiveIdx(-1); }
  };

  const isLg = size === 'lg';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search
          size={isLg ? 20 : 16}
          className="absolute left-4 text-surface-400 pointer-events-none z-10"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDrop(true)}
          placeholder={isLg ? 'Search for courses, skills, topics…' : 'Search courses…'}
          className={`w-full bg-white border-2 border-surface-200 rounded-2xl text-surface-900
                      transition-all duration-200
                      focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100
                      ${isLg ? 'pl-12 pr-32 py-4 text-base shadow-card' : 'pl-10 pr-20 py-2.5 text-sm'}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />

        {/* Clear button */}
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-28 text-surface-400 hover:text-surface-600 transition-colors z-10">
            {loading
              ? <Loader2 size={isLg ? 18 : 14} className="animate-spin" />
              : <X size={isLg ? 18 : 14} />
            }
          </button>
        )}

        <button type="submit"
          className={`absolute right-2 btn-primary ${isLg ? 'px-5 py-2.5' : 'px-3 py-1.5 text-xs'}`}>
          Search
        </button>
      </form>

      {/* Dropdown */}
      {showDrop && (
        <div ref={dropRef}
          className="absolute top-full mt-2 w-full bg-white border border-surface-200 rounded-2xl
                     shadow-xl z-50 overflow-hidden animate-fade-in">
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-surface-50 border-b border-surface-100">
                Suggestions
              </div>
              {suggestions.map((s, i) => (
                <button key={s.id} type="button"
                  onClick={() => doSearch(s.title)}
                  className={`w-full flex items-center justify-between px-4 py-3
                               text-left hover:bg-brand-50 transition-colors border-b border-surface-50 last:border-0
                               ${i === activeIdx ? 'bg-brand-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-surface-800">{s.title}</p>
                    <p className="text-xs text-surface-400">{s.platform} · {s.category}</p>
                  </div>
                  <Search size={13} className="text-surface-300 shrink-0" />
                </button>
              ))}
            </>
          ) : query.length < 2 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-surface-50 border-b border-surface-100 flex items-center gap-1.5">
                <TrendingUp size={12} /> Trending searches
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {TRENDING.map(t => (
                  <button key={t} type="button" onClick={() => { setQuery(t); doSearch(t); }}
                    className="tag-chip text-sm py-1 px-3">{t}</button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}