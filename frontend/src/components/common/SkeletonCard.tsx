interface SkeletonCardProps {
  lines?: number
  className?: string
}

export default function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl border border-white/5 bg-white/3 p-4 ${className}`}>
      <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 animate-pulse rounded bg-white/5"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  )
}
