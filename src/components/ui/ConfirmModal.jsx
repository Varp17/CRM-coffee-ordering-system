import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';
import { AlertTriangle, HelpCircle, CheckCircle, Info, X } from 'lucide-react';

const TONE_ICONS = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  primary: HelpCircle,
  success: CheckCircle,
  info: Info,
};

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to perform this action? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon: CustomIcon,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const IconComponent = CustomIcon || TONE_ICONS[tone] || AlertTriangle;

  return createPortal(
    <div className="confirm-modal-overlay" onClick={() => !isLoading && onCancel()}>
      <div
        className={`confirm-modal-card confirm-modal-card--${tone}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="confirm-modal-close"
          onClick={() => !isLoading && onCancel()}
          disabled={isLoading}
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon-badge confirm-modal-icon-badge--${tone}`}>
            <IconComponent size={24} />
          </div>
          <div className="confirm-modal-header-text">
            <h3 className="confirm-modal-title">{title}</h3>
            <p className="confirm-modal-step-tag">Confirmation Step Required</p>
          </div>
        </div>

        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`confirm-modal-btn confirm-modal-btn--confirm confirm-modal-btn--${tone}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="confirm-modal-spinner" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
