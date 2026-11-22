import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title = 'Hapus produk?',
  children,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);
  const dialogRef = useRef(null);

  // Fokus awal ke tombol Batal saat dialog dibuka
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Tangani tombol Escape dan focus trap di dalam dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!busy && onCancel) {
          e.preventDefault();
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !busy && onCancel) {
      onCancel();
    }
  };

  return (
    <div
      className="dlg-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        className="dlg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dlg-icon-wrap" aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h2 id="dlg-title" className="dlg-title">
          {title}
        </h2>

        <div className="dlg-body">
          {children}
        </div>

        {error && (
          <div className="dlg-error-box" role="alert">
            <svg
              className="dlg-error-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="dlg-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="dlg-btn dlg-btn-cancel"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="dlg-btn btn-danger dlg-btn-confirm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
