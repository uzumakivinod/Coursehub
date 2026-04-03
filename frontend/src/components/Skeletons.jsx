export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-14 rounded-md" />
          <div className="skeleton h-5 w-16 rounded-md" />
          <div className="skeleton h-5 w-12 rounded-md" />
        </div>
        <div className="pt-3 border-t border-surface-100 flex justify-between">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return <div className="skeleton h-8 w-16 rounded" />;
}
