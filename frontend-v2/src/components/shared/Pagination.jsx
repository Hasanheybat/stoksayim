import { useMemo } from 'react';

/**
 * Build page number array with ellipsis.
 * Example: [1, '...', 4, 5, 6, '...', 20]
 */
function buildPageRange(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < totalPages - 2) pages.push('...');

  pages.push(totalPages);

  return pages;
}

export default function Pagination({ current, total, perPage, onChange }) {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage]
  );

  const pages = useMemo(
    () => buildPageRange(current, totalPages),
    [current, totalPages]
  );

  if (totalPages <= 1) return null;

  const btnBase =
    'h-9 min-w-[2.25rem] rounded-lg flex items-center justify-center text-sm font-medium transition-colors';

  return (
    <nav className="flex items-center gap-1" aria-label="Sayfa navigasyonu">
      {/* Previous */}
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current <= 1}
        className={`${btnBase} px-1 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Onceki sayfa"
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="h-9 min-w-[2.25rem] flex items-center justify-center text-sm text-on-surface-variant"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`${btnBase} ${
              page === current
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
            aria-current={page === current ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(Math.min(totalPages, current + 1))}
        disabled={current >= totalPages}
        className={`${btnBase} px-1 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:pointer-events-none`}
        aria-label="Sonraki sayfa"
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </nav>
  );
}
