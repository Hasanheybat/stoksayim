import { SkeletonTable } from '../ui/Skeleton';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Kayit bulunamadi',
  onRowClick,
}) {
  /* ── Loading state ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <SkeletonTable rows={6} />
      </div>
    );
  }

  /* ── Empty state ─────────────────────────────────────────── */
  if (!data.length) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl shadow-card py-16 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
          search_off
        </span>
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          {/* ── Header ─────────────────────────────────────── */}
          <thead>
            <tr className="bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`
                  transition-colors
                  hover:bg-surface-container-low/50
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3.5 text-sm text-on-surface whitespace-nowrap"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
