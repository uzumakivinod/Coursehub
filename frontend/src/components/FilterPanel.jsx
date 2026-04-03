import { SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';

const LEVELS    = ['all', 'Beginner', 'Intermediate', 'Advanced'];
const DURATIONS = [
  { value: 'all',    label: 'Any Duration' },
  { value: 'short',  label: 'Short (≤10h)' },
  { value: 'medium', label: 'Medium (10–40h)' },
  { value: 'long',   label: 'Long (40h+)' },
];
const SORTS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating',    label: 'Highest Rated' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'newest',    label: 'Newest First' },
];

export default function FilterPanel({ filters, platforms = [], categories = [], onChange, onReset }) {
  const hasActive =
    (filters.platform && filters.platform !== 'all') ||
    (filters.level    && filters.level    !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.duration && filters.duration !== 'all');

  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-surface-800 flex items-center gap-2 text-sm">
          <SlidersHorizontal size={15} className="text-brand-500" />
          Filters
        </h3>
        {hasActive && (
          <button onClick={onReset}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors">
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Sort By</label>
        <select value={filters.sort || 'relevance'} onChange={e => set('sort', e.target.value)}
          className="select-filter w-full">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Platform</label>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...platforms].map(p => (
            <button key={p} onClick={() => set('platform', p)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                (filters.platform === p || (!filters.platform && p === 'all'))
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-600')}>
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Level</label>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map(l => (
            <button key={l} onClick={() => set('level', l)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                (filters.level === l || (!filters.level && l === 'all'))
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-600')}>
              {l === 'all' ? 'All Levels' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Duration</label>
        <div className="flex flex-col gap-1">
          {DURATIONS.map(d => (
            <button key={d.value} onClick={() => set('duration', d.value)}
              className={clsx('px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all',
                (filters.duration === d.value || (!filters.duration && d.value === 'all'))
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'bg-white text-surface-600 border-surface-100 hover:border-brand-200 hover:text-brand-600')}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Category</label>
          <select value={filters.category || 'all'} onChange={e => set('category', e.target.value)}
            className="select-filter w-full">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
