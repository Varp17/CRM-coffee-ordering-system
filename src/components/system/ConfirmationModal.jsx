import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, options, onResolve }) => {
  const [typedInput, setTypedInput] = useState('');
  const [checkedAck, setCheckedAck] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const {
    title = 'Confirm Action',
    description = 'Are you sure you want to perform this operation?',
    type = 'level1', // level1, level2, level3
    payload = {},
    isDestructive = false
  } = options || {};

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
      setCheckedAck(false);
      setPasswordInput('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (type === 'level2') {
      if (payload.requireText && typedInput !== 'CONFIRM') return;
      if (payload.requireCheckbox && !checkedAck) return;
    }
    if (type === 'level3') {
      if (passwordInput !== 'admin') {
        alert('Invalid administrative security key re-entry.');
        return;
      }
    }
    onResolve(true);
  };

  const handleCancel = () => {
    onResolve(false);
  };

  const transitionEase = [0.16, 1, 0.3, 1];

  const isConfirmDisabled = () => {
    if (type === 'level2') {
      if (payload.requireText && typedInput !== 'CONFIRM') return true;
      if (payload.requireCheckbox && !checkedAck) return true;
    }
    if (type === 'level3') {
      return !passwordInput;
    }
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="system-confirm-backdrop">
          <motion.div 
            className="system-confirm-container"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: transitionEase }}
          >
            <div className="system-confirm-header">
              <span className="system-confirm-meta">
                SECURITY ACCESS LAYER // LEVEL {type.toUpperCase()}
              </span>
              <h2 className="system-confirm-title">{title.toUpperCase()}</h2>
            </div>

            <div className="system-confirm-body">
              <p>{description}</p>

              {/* Entity Payload details */}
              {payload.details && (
                <div className="system-confirm-details">
                  {Object.entries(payload.details).map(([key, val]) => (
                    <div key={key}>
                      {key.toUpperCase()}: {String(val)}
                    </div>
                  ))}
                </div>
              )}

              {isDestructive && (
                <div className="system-confirm-warning destructive">
                  CRITICAL: This operation is irreversible and will permanently modify system state.
                </div>
              )}

              {/* Level 2 Typed verification input */}
              {type === 'level2' && payload.requireText && (
                <div className="system-confirm-input-wrapper">
                  <label className="system-confirm-input-label">TYPE 'CONFIRM' TO ACKNOWLEDGE AUTHORITY</label>
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="CONFIRM"
                    className="system-confirm-input"
                  />
                </div>
              )}

              {/* Level 2 Checkbox acknowledgement */}
              {type === 'level2' && payload.requireCheckbox && (
                <label className="system-confirm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={checkedAck}
                    onChange={(e) => setCheckedAck(e.target.checked)}
                  />
                  <span>I acknowledge the operational impact of this stock/price sync.</span>
                </label>
              )}

              {/* Level 3 Password re-entry check */}
              {type === 'level3' && (
                <div className="system-confirm-input-wrapper">
                  <label className="system-confirm-input-label">ENTER ADMINISTRATIVE KEY [admin] FOR LOCKOUT BYPASS</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="system-confirm-input"
                  />
                </div>
              )}
            </div>

            <div className="system-confirm-footer">
              <button 
                className="system-confirm-btn system-confirm-btn-cancel" 
                onClick={handleCancel}
              >
                CANCEL
              </button>
              <button 
                className={`system-confirm-btn system-confirm-btn-confirm ${isDestructive ? 'destructive' : ''}`}
                onClick={handleConfirm}
                disabled={isConfirmDisabled()}
              >
                {isDestructive ? 'PERMANENTLY EXECUTE' : 'VERIFY & RUN'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
