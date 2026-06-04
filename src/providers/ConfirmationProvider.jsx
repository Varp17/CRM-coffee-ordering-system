import React, { createContext, useState, useCallback, useRef } from 'react';
import ConfirmationModal from '../components/system/ConfirmationModal';

export const ConfirmationContext = createContext({
  confirmAction: () => Promise.resolve(false)
});

export const ConfirmationProvider = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState(null);
  
  // Keep resolve function stored across renders
  const resolveRef = useRef(null);

  const confirmAction = useCallback((options) => {
    setModalOptions(options);
    setModalOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleResolve = (result) => {
    setModalOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirmAction }}>
      {children}
      <ConfirmationModal 
        isOpen={modalOpen} 
        options={modalOptions} 
        onResolve={handleResolve} 
      />
    </ConfirmationContext.Provider>
  );
};
