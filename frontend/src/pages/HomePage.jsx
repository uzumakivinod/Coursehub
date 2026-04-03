import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CourseCard from '../components/CourseCard';
import StatsBar from '../components/StatsBar';
import { CourseGridSkeleton } from '../components/Skeletons';
import { fetchTrending } from '../utils/api';

const PLATFORMS = [
  { name: 'Google',    bg: 'bg-blue-50',    text: 'text-blue-700',   logo: '🔵' },
  { name: 'IBM',       bg: 'bg-indigo-50',  text: 'text-indigo-700', logo: '🔷' },
  { name: 'Harvard',   bg: 'bg-red-50',     text: 'text-red-700',    logo: '🎓' },
  { name: 'MIT',       bg: 'bg-rose-50',    text: 'text-rose-700',   logo: '🏛️' },
  { name: 'Coursera',  bg: 'bg-sky-50',     text: 'text-sky-700',    logo: '📚' },
  { name: 'edX',       bg: 'bg-red-50',     text: 'text-red-600',    logo: '🎯' },
  { name: 'YouTube',   bg: 'bg-red-50',     text: 'text-red-600',    logo: '▶️' },
  { name: 'freeCodeCamp', bg: 'bg-green-50', text: 'text-green-700', logo: '💻' },
];

const FEATURES = [
  { icon: Zap,    title: 'Instant Search',     desc: 'Fuzzy search with Redis-cached results under 50ms.' },
  { icon: Shield, title: '100% Free',          desc: 'Every course is genuinely free — no hidden fees, ever.' },
  { icon: Globe,  title: 'Multiple Providers', desc: 'Aggregated from 10+ top platforms in one place.' },
];

const POPULAR_TAGS = [
  'Python', 'JavaScript', 'Machine Learning', 'React', 'Docker',
  'SQL', 'AWS', 'Data Science', 'TypeScript', 'Kubernetes',
];

export default function HomePage() {
  const { data: trendingData, isLoading } = useQuery(
    'trending',
    () => fetchTrending(8),
    { staleTime: 10 * 60_000 }
  );

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-grid pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100
                          rounded-full text-brand-700 text-xs font-semibold animate-fade-in">
            <TrendingUp size={12} />
            <span>20+ free courses from top providers — updated daily</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl
                         text-surface-900 leading-[1.1] tracking-tight animate-slide-up">
            Find <span className="text-gradient">Free Courses</span><br />
            from the World's Best
          </h1>

          <p className="text-surface-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed
                        animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Search thousands of free courses from Google, IBM, Harvard, MIT, Coursera,
            edX, YouTube and more — all in one place. No sign-up required.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <SearchBar size="lg" autoFocus />
          </div>

          {/* Popular tags */}
          <div className="flex flex-wrap justify-center gap-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {POPULAR_TAGS.map(tag => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="tag-chip text-sm py-1 px-3">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="bg-white border-y border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <StatsBar />
        </div>
      </section>

      {/* ── Platform logos ───────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold text-surface-400 uppercase tracking-widest mb-6">
            Courses from top providers
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map(p => (
              <Link key={p.name} to={`/search?platform=${encodeURIComponent(p.name)}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200
                            ${p.bg} ${p.text} text-sm font-semibold
                            hover:shadow-md hover:border-brand-200 transition-all duration-200`}>
                <span>{p.logo}</span>
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Courses ─────────────────────────────── */}
      <section className="py-12 px-4 bg-surface-50">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface-900 flex items-center gap-2">
                <TrendingUp size={22} className="text-brand-500" />
                Trending Courses
              </h2>
              <p className="text-surface-500 text-sm mt-1">Most popular free courses right now</p>
            </div>
            <Link to="/search" className="btn-secondary text-sm hidden sm:flex">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <CourseGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(trendingData?.courses || []).map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          )}

          <div className="text-center sm:hidden">
            <Link to="/search" className="btn-primary">
              Browse All Courses <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-center text-surface-900 mb-10">
            Why FreeCourseHub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6 space-y-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <f.icon size={18} className="text-brand-500" />
                </div>
                <h3 className="font-display font-semibold text-surface-800">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-br from-brand-600 to-accent-600">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display font-bold text-3xl text-white">
            Start Learning for Free Today
          </h2>
          <p className="text-brand-100 text-base leading-relaxed">
            No account needed. No credit card. Just click, learn, and grow.
          </p>
          <Link to="/search" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-600
                                        font-bold rounded-2xl shadow-lg hover:shadow-xl
                                        hover:-translate-y-0.5 transition-all duration-200 font-display">
            Browse Free Courses <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
