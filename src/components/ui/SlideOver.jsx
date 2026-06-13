import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './SlideOver.css';

export const SlideOver = ({ isOpen, onClose, title, children, width = '80vw' }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className="slide-over-panel animate-slide-in" 
        style={{ width: width, maxWidth: '1200px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slide-over-header">
          <h2>{title}</h2>
          <button className="slide-over-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="slide-over-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
