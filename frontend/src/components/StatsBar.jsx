import { useQuery } from 'react-query';
import { BookOpen, Globe, LayoutGrid, Star } from 'lucide-react';
import { fetchStats } from '../utils/api';

function StatItem({ icon: Icon, value, label, color = 'text-brand-500' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="font-display font-bold text-surface-900 text-lg leading-none">{value}</p>
        <p className="text-xs text-surface-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { data, isLoading } = useQuery('stats', fetchStats, { staleTime: 5 * 60_000 });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <div className="skeleton h-5 w-12 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const fmtNum = n => n >= 1000 ? `${(n / 1000).toFixed(0)}K+` : `${n}+`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatItem icon={BookOpen} value={fmtNum(data?.totalCourses || 0)} label="Free Courses" />
      <StatItem icon={Globe}    value={fmtNum(data?.platforms || 0)}    label="Platforms"    color="text-accent-500" />
      <StatItem icon={LayoutGrid} value={fmtNum(data?.categories || 0)} label="Categories"   color="text-emerald-500" />
      <StatItem icon={Star}     value={data?.avgRating || '4.7'}        label="Avg Rating"   color="text-amber-500" />
    </div>
  );
}
