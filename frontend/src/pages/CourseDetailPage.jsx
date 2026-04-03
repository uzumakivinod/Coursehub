import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft, Star, Clock, Users, Award, ExternalLink,
  Tag, Globe, BookOpen, Calendar, CheckCircle
} from 'lucide-react';
import { fetchCourse, searchCourses } from '../utils/api';
import CourseCard from '../components/CourseCard';
import { CourseCardSkeleton } from '../components/Skeletons';
import clsx from 'clsx';

const LEVEL_COLORS = {
  Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50  text-amber-700  border-amber-200',
  Advanced:     'bg-red-50    text-red-700    border-red-200',
};

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={16}
            className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-300'} />
        ))}
      </div>
      <span className="font-bold text-surface-900">{rating?.toFixed(1)}</span>
      {count > 0 && (
        <span className="text-sm text-surface-400">
          ({count >= 1000 ? `${(count/1000).toFixed(0)}K` : count} ratings)
        </span>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-100 last:border-0">
      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-500" />
      </div>
      <div>
        <p className="text-xs text-surface-400 font-medium">{label}</p>
        <p className="text-sm text-surface-800 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();

  const { data: courseData, isLoading, isError } = useQuery(
    ['course', id],
    () => fetchCourse(id),
    { staleTime: 10 * 60_000 }
  );

  const course = courseData?.course;

  // Related courses
  const { data: relatedData } = useQuery(
    ['related', course?.category],
    () => searchCourses({ category: course?.category, limit: 4 }),
    { enabled: !!course?.category, staleTime: 10 * 60_000 }
  );
  const related = (relatedData?.courses || []).filter(c => c.id !== id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton aspect-video max-w-2xl rounded-2xl" />
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <p className="text-5xl">😕</p>
        <h2 className="font-display font-bold text-2xl text-surface-800">Course not found</h2>
        <p className="text-surface-500">This course may have been removed or the link is incorrect.</p>
        <Link to="/search" className="btn-primary inline-flex">Browse All Courses</Link>
      </div>
    );
  }

  const {
    title, platform, provider, instructor, duration, durationHours,
    rating, ratingCount, level, tags = [], link, thumbnail,
    description, enrollmentCount, certificate, language, category,
    lastUpdated, isFree,
  } = course;

  const fmtEnroll = n => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── Breadcrumb ──────────────────────────────────── */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-surface-500">
          <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-brand-500 transition-colors">Courses</Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/search?category=${encodeURIComponent(category)}`}
                className="hover:text-brand-500 transition-colors">{category}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-surface-700 font-medium truncate max-w-xs">{title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Main content ──────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Back */}
            <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-surface-500
                                           hover:text-brand-500 transition-colors font-medium">
              <ArrowLeft size={15} /> Back to results
            </Link>

            {/* Thumbnail */}
            <div className="rounded-2xl overflow-hidden aspect-video bg-surface-100 shadow-card">
              <img
                src={thumbnail || `https://placehold.co/800x450/0ba5ec/white?text=${encodeURIComponent(platform)}`}
                alt={title}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = `https://placehold.co/800x450/0ba5ec/white?text=${encodeURIComponent(platform)}`; }}
              />
            </div>

            {/* Title block */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx('badge border text-xs', LEVEL_COLORS[level] || 'bg-surface-100 text-surface-600')}>
                  {level}
                </span>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs">
                  {platform}
                </span>
                {certificate && (
                  <span className="badge bg-accent-50 text-accent-700 border border-accent-100 gap-1 text-xs">
                    <Award size={10} /> Certificate Available
                  </span>
                )}
                {isFree && (
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                    ✓ Free
                  </span>
                )}
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-900 leading-tight">
                {title}
              </h1>

              <p className="text-surface-600 text-sm">by <span className="font-semibold">{instructor}</span> · {provider}</p>

              {rating > 0 && (
                <StarRating rating={rating} count={ratingCount || 0} />
              )}
              {enrollmentCount > 0 && (
                <p className="text-sm text-surface-500 flex items-center gap-1.5">
                  <Users size={14} className="text-brand-400" />
                  <span className="font-semibold text-surface-700">{fmtEnroll(enrollmentCount)}</span> students enrolled
                </p>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className="card p-6 space-y-3">
                <h2 className="font-display font-semibold text-surface-800 text-lg">About this course</h2>
                <p className="text-surface-600 leading-relaxed text-sm">{description}</p>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="card p-6 space-y-3">
                <h2 className="font-display font-semibold text-surface-800 flex items-center gap-2 text-base">
                  <Tag size={15} className="text-brand-500" /> Topics Covered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}
                      className="tag-chip text-sm py-1.5 px-3">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────── */}
          <aside className="lg:w-72 shrink-0 space-y-5">

            {/* CTA card */}
            <div className="card p-6 space-y-4 lg:sticky lg:top-32">
              <div className="text-center space-y-1">
                <p className="text-3xl font-display font-extrabold text-emerald-600">FREE</p>
                <p className="text-xs text-surface-400">No cost · No sign-up required</p>
              </div>

              <a href={link} target="_blank" rel="noopener noreferrer"
                className="btn-primary w-full justify-center text-base py-3">
                Go to Course <ExternalLink size={15} />
              </a>

              <div className="space-y-1">
                <InfoRow icon={Clock}     label="Duration"   value={`${duration}${durationHours ? ` (≈${durationHours}h)` : ''}`} />
                <InfoRow icon={BookOpen}  label="Level"      value={level} />
                <InfoRow icon={Globe}     label="Language"   value={language || 'English'} />
                {lastUpdated && (
                  <InfoRow icon={Calendar} label="Last Updated" value={new Date(lastUpdated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
                )}
              </div>

              <div className="pt-1 space-y-2">
                {['Completely free to audit', 'No credit card required', 'Self-paced learning'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
                {certificate && (
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Award size={14} className="text-accent-500 shrink-0" />
                    Certificate available
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Related courses ──────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-12 space-y-5">
            <h2 className="font-display font-bold text-xl text-surface-900">
              More in {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
