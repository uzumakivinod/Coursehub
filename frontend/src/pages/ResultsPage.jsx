import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CourseCard from '../components/CourseCard';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import { CourseGridSkeleton } from '../components/Skeletons';
import { searchCourses, fetchFilters } from '../utils/api';

const DEFAULT_FILTERS = {
  platform: 'all',
  level:    'all',
  category: 'all',
  duration: 'all',
  sort:     'relevance',
};

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Sync filters from URL
  const query    = searchParams.get('q')        || '';
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const platform = searchParams.get('platform') || 'all';
  const level    = searchParams.get('level')    || 'all';
  const category = searchParams.get('category') || 'all';
  const duration = searchParams.get('duration') || 'all';
  const sort     = searchParams.get('sort')     || 'relevance';

  const filters = { platform, level, category, duration, sort };

  // Update URL when filters change
  const updateParams = useCallback((newFilters, newPage = 1) => {
    const params = { page: String(newPage) };
    if (query) params.q = query;
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== 'all') params[k] = v;
    });
    setSearchParams(params, { replace: true });
  }, [query, setSearchParams]);

  const handleFilterChange = (newFilters) => updateParams(newFilters, 1);
  const handlePageChange   = (newPage)    => updateParams(filters, newPage);
  const handleReset        = () => updateParams(DEFAULT_FILTERS, 1);

  // Search query
  const searchKey = ['search', query, platform, level, category, duration, sort, page];
  const { data, isLoading, isError, error } = useQuery(
    searchKey,
    () => searchCourses({ q: query, platform, level, category, duration, sort, page, limit: 12 }),
    { keepPreviousData: true, staleTime: 2 * 60_000 }
  );

  // Filter options
  const { data: filterData } = useQuery('filters', fetchFilters, { staleTime: 30 * 60_000 });

  const courses    = data?.courses    || [];
  const pagination = data?.pagination || null;
  const total      = pagination?.total || 0;
  const searchTime = data?.searchTime || '';

  const hasActiveFilters = platform !== 'all' || level !== 'all' || category !== 'all' || duration !== 'all';

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── Search header ────────────────────────────────── */}
      <div className="bg-white border-b border-surface-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-2xl">
              <SearchBar initialValue={query} size="sm" />
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                ${hasActiveFilters
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-surface-200 text-surface-600'}`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-brand-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Result meta */}
          {!isLoading && (
            <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-surface-500">
                {query
                  ? <><span className="font-semibold text-surface-800">{total}</span> results for "<span className="font-semibold text-brand-600">{query}</span>"</>
                  : <><span className="font-semibold text-surface-800">{total}</span> courses available</>
                }
                {searchTime && <span className="text-surface-400 ml-1.5">· {searchTime}</span>}
              </p>
              {hasActiveFilters && (
                <button onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium">
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* ── Sidebar filters (desktop) ─────────────────── */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="sticky top-36">
              <FilterPanel
                filters={filters}
                platforms={filterData?.platforms || []}
                categories={filterData?.categories || []}
                onChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* ── Mobile filters drawer ────────────────────── */}
          {showFiltersMobile && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFiltersMobile(false)} />
              <div className="absolute right-0 top-0 h-full w-72 bg-surface-50 overflow-y-auto
                              shadow-2xl animate-slide-up">
                <div className="p-4 border-b border-surface-200 flex items-center justify-between bg-white">
                  <span className="font-semibold text-surface-800">Filters</span>
                  <button onClick={() => setShowFiltersMobile(false)} className="text-surface-500">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <FilterPanel
                    filters={filters}
                    platforms={filterData?.platforms || []}
                    categories={filterData?.categories || []}
                    onChange={(f) => { handleFilterChange(f); setShowFiltersMobile(false); }}
                    onReset={() => { handleReset(); setShowFiltersMobile(false); }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Main content ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Error state */}
            {isError && (
              <div className="card p-8 text-center space-y-3">
                <p className="text-2xl">⚠️</p>
                <p className="font-semibold text-surface-800">Something went wrong</p>
                <p className="text-sm text-surface-500">{error?.message}</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && <CourseGridSkeleton count={12} />}

            {/* Empty state */}
            {!isLoading && !isError && courses.length === 0 && (
              <div className="card p-12 text-center space-y-4">
                <p className="text-5xl">🎓</p>
                <h3 className="font-display font-semibold text-xl text-surface-800">No courses found</h3>
                <p className="text-surface-500 text-sm max-w-sm mx-auto">
                  {query
                    ? `No results for "${query}". Try a different keyword or clear the filters.`
                    : 'No courses match the selected filters.'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {query && (
                    <Link to="/search" className="btn-primary text-sm">Clear search</Link>
                  )}
                  {hasActiveFilters && (
                    <button onClick={handleReset} className="btn-secondary text-sm">Reset filters</button>
                  )}
                </div>
              </div>
            )}

            {/* Results grid */}
            {!isLoading && !isError && courses.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {courses.map((course, i) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                    />
                  ))}
                </div>

                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
