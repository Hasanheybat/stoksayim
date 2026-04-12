import Modal from './Modal';

const TYPE_CONFIG = {
  danger: {
    icon: 'delete',
    iconColor: '#ba1a1a',
    confirmBg: 'bg-error',
    confirmText: 'text-on-error',
    confirmHover: 'hover:opacity-90',
  },
  success: {
    icon: 'check_circle',
    iconColor: '#10b981',
    confirmBg: 'bg-success',
    confirmText: 'text-white',
    confirmHover: 'hover:opacity-90',
  },
  warning: {
    icon: 'warning',
    iconColor: '#f59e0b',
    confirmBg: 'bg-warning',
    confirmText: 'text-white',
    confirmHover: 'hover:opacity-90',
  },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Onayla',
  cancelText = 'Vazgec',
  loading = false,
  children,
}) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.danger;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={config.icon}
      iconColor={config.iconColor}
      maxWidth="sm"
      showHandle
    >
      {/* Message */}
      {message && (
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
          {message}
        </p>
      )}

      {/* Optional extra content */}
      {children}

      {/* Actions */}
      <div className="flex items-center gap-2.5 mt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 h-9 rounded-lg text-xs font-semibold
                     bg-surface-container-high text-on-surface
                     hover:bg-surface-container-highest
                     transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 h-9 rounded-lg text-xs font-semibold
                     ${config.confirmBg} ${config.confirmText}
                     ${config.confirmHover}
                     transition-colors disabled:opacity-50
                     flex items-center justify-center gap-2`}
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
