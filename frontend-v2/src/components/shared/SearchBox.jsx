import { useState, useEffect, useRef, useCallback } from 'react';

export default function SearchBox({
  value = '',
  onChange,
  placeholder = 'Ara...',
  debounceMs = 350,
}) {
  const [internal, setInternal] = useState(value);
  const timerRef = useRef(null);
  const isControlled = onChange !== undefined;

  /* ── Sync external value ─────────────────────────────────── */
  useEffect(() => {
    setInternal(value);
  }, [value]);

  /* ── Debounced change ────────────────────────────────────── */
  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setInternal(val);

      if (!isControlled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    },
    [onChange, debounceMs, isControlled]
  );

  /* ── Clear ───────────────────────────────────────────────── */
  const handleClear = () => {
    setInternal('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange?.('');
  };

  /* ── Cleanup ─────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Search icon */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
        <span className="material-symbols-outlined text-xl">search</span>
      </span>

      {/* Input */}
      <input
        type="text"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 rounded-xl
                   bg-surface-container-low text-on-surface text-sm
                   placeholder:text-on-surface-variant/50
                   ghost-border ghost-border-focus
                   outline-none transition-shadow"
      />

      {/* Clear button */}
      {internal && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     w-7 h-7 rounded-lg flex items-center justify-center
                     text-on-surface-variant hover:bg-surface-container-high
                     transition-colors"
          aria-label="Temizle"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}
