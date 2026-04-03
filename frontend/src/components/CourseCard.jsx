import { Link } from 'react-router-dom';
import { Star, Clock, Users, Award, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const LEVEL_COLORS = {
  Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  Advanced:     'bg-red-50 text-red-700 border-red-100',
};

const PLATFORM_COLORS = {
  Coursera:            'bg-brand-50 text-brand-700',
  edX:                 'bg-red-50 text-red-700',
  YouTube:             'bg-red-50 text-red-600',
  'MIT OpenCourseWare':'bg-rose-50 text-rose-700',
  'freeCodeCamp':      'bg-emerald-50 text-emerald-700',
  'Khan Academy':      'bg-green-50 text-green-700',
  'AWS Training':      'bg-orange-50 text-orange-700',
  'Open University':   'bg-indigo-50 text-indigo-700',
};

function StarRating({ rating }) {
  const full  = Math.floor(rating);
  const frac  = rating - full;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          className={clsx('transition-colors',
            i <= full ? 'text-amber-400 fill-amber-400'
            : i === full + 1 && frac >= 0.5 ? 'text-amber-400 fill-amber-200'
            : 'text-surface-300')}
        />
      ))}
    </span>
  );
}

export default function CourseCard({ course, style }) {
  const {
    id, title, platform, provider, instructor, duration,
    rating, ratingCount, level, tags = [], link, thumbnail,
    enrollmentCount, certificate,
  } = course;

  const fmtNum = (n) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

  return (
    <article className="card group flex flex-col overflow-hidden" style={style}>
      {/* Thumbnail */}
      <Link to={`/course/${id}`} className="block relative overflow-hidden aspect-video bg-surface-100">
        <img
          src={thumbnail || `https://placehold.co/400x225/0ba5ec/white?text=${encodeURIComponent(platform)}`}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = `https://placehold.co/400x225/0ba5ec/white?text=${encodeURIComponent(platform)}`; }}
        />
        {/* Platform badge */}
        <span className={clsx('absolute top-2 left-2 badge border text-[11px]',
          PLATFORM_COLORS[platform] || 'bg-surface-100 text-surface-600')}>
          {platform}
        </span>
        {certificate && (
          <span className="absolute top-2 right-2 badge bg-accent-500 text-white gap-1">
            <Award size={9} /> Certificate
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Level + provider */}
        <div className="flex items-center justify-between">
          <span className={clsx('badge border text-[11px]', LEVEL_COLORS[level] || 'bg-surface-100 text-surface-600')}>
            {level}
          </span>
          <span className="text-xs text-surface-400 truncate max-w-[120px]">{provider}</span>
        </div>

        {/* Title */}
        <Link to={`/course/${id}`}>
          <h3 className="font-display font-semibold text-surface-900 text-sm leading-snug
                         line-clamp-2 group-hover:text-brand-600 transition-colors">
            {title}
          </h3>
        </Link>

        <p className="text-xs text-surface-500 line-clamp-1">{instructor}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-surface-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <StarRating rating={rating || 0} />
              <span className="font-medium text-surface-700">{rating?.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {duration}
            </span>
            {enrollmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} />
                {fmtNum(enrollmentCount)}
              </span>
            )}
          </div>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-500
                       hover:text-brand-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Free <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}
