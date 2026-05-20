import './UserConfirmModal.scss';

/**
 * Generic confirmation modal for user-side actions.
 *
 * Props:
 *  isOpen      - boolean
 *  title       - heading text
 *  message     - body text (can be JSX)
 *  confirmText - label for the confirm button (default: "Confirm")
 *  cancelText  - label for cancel button (default: "Cancel")
 *  variant     - 'danger' | 'warning' (default: 'danger')
 *  onConfirm   - called when user clicks confirm
 *  onClose     - called when user clicks cancel / overlay
 */
const UserConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ucm-overlay" onClick={onClose}>
      <div className="ucm" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className={`ucm__icon ucm__icon--${variant}`}>
          {variant === 'danger' ? '🗑️' : '⚠️'}
        </div>

        <h3 className="ucm__title">{title}</h3>

        {message && <p className="ucm__message">{message}</p>}

        <div className="ucm__actions">
          <button className="ucm__btn ucm__btn--cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`ucm__btn ucm__btn--${variant}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmModal;
