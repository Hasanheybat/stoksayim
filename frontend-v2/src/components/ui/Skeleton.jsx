/* ── SkeletonBar ──────────────────────────────────────────── */

export function SkeletonBar({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

/* ── SkeletonCard ─────────────────────────────────────────── */

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`
        bg-surface-container-lowest rounded-2xl p-5 shadow-card
        flex flex-col gap-4 ${className}
      `}
    >
      {/* Icon circle + title */}
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-3/5 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
        </div>
      </div>
      {/* Text lines */}
      <div className="flex flex-col gap-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-3 w-3/5 rounded" />
      </div>
    </div>
  );
}

/* ── SkeletonTable ────────────────────────────────────────── */

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-surface-container-low rounded-t-xl">
        <div className="skeleton h-3 w-1/6 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-3 w-1/5 rounded" />
        <div className="skeleton h-3 w-1/6 rounded" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4"
        >
          <div className="skeleton h-3 w-1/6 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-3 w-1/5 rounded" />
          <div className="skeleton h-3 w-1/6 rounded" />
        </div>
      ))}
    </div>
  );
}
