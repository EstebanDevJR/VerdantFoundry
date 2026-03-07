import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: Record<string, string>;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/60',
        className
      )}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-20 h-9 mb-2" />
      <Skeleton className="w-28 h-4" />
    </div>
  );
}

const chartHeights = [55, 72, 40, 63, 48, 80, 35, 58, 45, 70, 52, 67];

export function ChartSkeleton() {
  return (
    <div className="glass-panel rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="w-40 h-7" />
        <Skeleton className="w-32 h-5" />
      </div>
      <div className="h-64 flex items-end gap-2">
        {chartHeights.map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
          <Skeleton className="w-2 h-2 rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="w-48 h-5 mb-2" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-20 h-5" />
        </div>
      ))}
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-3xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="w-28 h-6 mb-2" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}
