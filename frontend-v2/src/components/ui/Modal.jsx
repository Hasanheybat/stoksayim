import { useEffect, useRef, useCallback } from 'react';

const MAX_WIDTH_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export default function Modal({
  open,
  onClose,
  title,
  icon,
  iconColor = '#4343d5',
  children,
  maxWidth = 'md',
  showHandle = false,
}) {
  const backdropRef = useRef(null);

  const handleEscape = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  if (!open) return null;

  const gradientBar = iconColor
    ? { background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)` }
    : { background: 'linear-gradient(135deg, #4343d5, #5d5fef)' };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div
        className={`
          relative w-full bg-surface-container-lowest
          rounded-t-2xl sm:rounded-2xl
          ${MAX_WIDTH_CLASSES[maxWidth] || 'sm:max-w-md'} sm:mx-4
          shadow-elevated
          flex flex-col max-h-[85vh]
        `}
        style={{ animation: 'slideUp 0.2s ease' }}
      >
        {/* Gradient top bar */}
        <div
          className="h-0.5 w-full rounded-t-2xl shrink-0"
          style={gradientBar}
        />

        {/* Mobile drag handle */}
        {showHandle && (
          <div className="flex justify-center pt-1.5 sm:hidden shrink-0">
            <div className="w-8 h-0.5 rounded-full bg-outline-variant/40" />
          </div>
        )}

        {/* Header */}
        {(title || icon) && (
          <div className="flex items-center gap-2.5 px-5 pt-4 pb-1 shrink-0">
            {icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: iconColor }}
                >
                  {icon}
                </span>
              </div>
            )}
            {title && (
              <h3 className="text-base font-bold font-headline text-on-surface flex-1 leading-tight">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center
                         text-on-surface-variant/60 hover:bg-surface-container-high
                         transition-colors shrink-0"
              aria-label="Kapat"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 pb-5 pt-2 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
