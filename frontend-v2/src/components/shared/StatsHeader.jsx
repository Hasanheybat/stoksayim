export default function StatsHeader({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-0">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center">
          {/* Tonal divider (not on first item) */}
          {idx > 0 && (
            <div className="hidden sm:block w-px h-10 bg-surface-container-high mx-5 shrink-0" />
          )}

          {/* Stat block */}
          <div className="px-4 sm:px-0 py-2">
            <p
              className="text-2xl font-bold font-headline leading-tight"
              style={item.color ? { color: item.color } : undefined}
            >
              {item.value ?? '--'}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
