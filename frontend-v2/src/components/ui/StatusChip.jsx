const STATUS_CONFIG = {
  devam: {
    bg: 'bg-info/10',
    text: 'text-info',
    dot: 'bg-info',
    label: 'Devam Ediyor',
    pulse: true,
  },
  tamamlandi: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Tamamlandi',
    pulse: false,
  },
  aktif: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: null,
    label: 'Aktif',
    pulse: false,
  },
  pasif: {
    bg: 'bg-error/8',
    text: 'text-on-surface-variant',
    dot: null,
    label: 'Pasif',
    pulse: false,
  },
  silindi: {
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    dot: null,
    label: 'Silindi',
    pulse: false,
  },
};

const SIZE_MAP = {
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-2.5 py-1 text-[10px]',
};

export default function StatusChip({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold tracking-wide
        ${config.bg} ${config.text} ${SIZE_MAP[size]}
      `}
    >
      {config.dot && (
        <span className="relative flex h-1.5 w-1.5">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75 animate-ping`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`}
          />
        </span>
      )}
      {config.label}
    </span>
  );
}
