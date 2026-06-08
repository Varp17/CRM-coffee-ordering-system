import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useKioskStore } from '../../../store/useKioskStore';
import { reorderService } from '../../../services/reorderService';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import toast from 'react-hot-toast';
import './TokenConfirmation.css';

const STATES = [
  { key: 'queued', label: '[01/QUEUED]', description: 'ORDER VERIFIED. QUEUED IN PRODUCTION ENGINE.' },
  { key: 'crafting', label: '[02/CRAFTING]', description: 'BARISTA EXTRACTING BEVERAGE CORE ELEMENTS.' },
  { key: 'finishing', label: '[03/FINISHING]', description: 'AERATING AND VELVET TEXTURING LIQUID LAYERS.' },
  { key: 'ready', label: '[04/READY]', description: 'COMPOSITION FINISHED. READY AT SERVICE COUNTER.' }
];

const TokenConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentToken = useKioskStore((state) => state.currentToken);
  const clearKioskCart = useKioskStore((state) => state.clearKioskCart);
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [activeStateIndex, setActiveStateIndex] = useState(0);
  const [isReordering, setIsReordering] = useState(false);

  // Get order from location state (passed from handleKioskComplete)
  const orderFromState = location.state?.order || null;

  // Fallback redirect if no active token
  useEffect(() => {
    if (!currentToken) {
      const timer = setTimeout(() => {
        navigate('/kiosk');
      }, 30000); // Wait 30 seconds before auto-reverting
      return () => clearTimeout(timer);
    }
  }, [currentToken, navigate]);

  // Simulate cinematic progression transitions
  useEffect(() => {
    const intervals = [3000, 4500, 4000]; // Duration spent in each state
    let currentIndex = 0;

    const runNextStep = () => {
      if (currentIndex < STATES.length - 1) {
        setTimeout(() => {
          currentIndex += 1;
          setActiveStateIndex(currentIndex);
          runNextStep();
        }, intervals[currentIndex]);
      }
    };

    runNextStep();
  }, []);

  const handleReorder = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to reorder');
      return;
    }

    setIsReordering(true);
    try {
      const res = await reorderService.reorderFromPastOrder(
        orderFromState?.id,
        orderFromState?.store?.id || 1,
        'kiosk'
      );

      toast.success('Order placed successfully!');
      navigate(`/kiosk/token`, { state: { order: res.order || res.data } });
    } catch (err) {
      console.error('Reorder failed:', err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsReordering(false);
    }
  };

  const handleFinish = () => {
    clearKioskCart();
    navigate('/kiosk');
  };




  const activeToken = currentToken || 'T-204';

  const transitionEase = [0.16, 1, 0.3, 1];

  return (
    <div className="token-confirmation-view">
      <motion.div 
        className="token-success-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: transitionEase }}
      >
        <h1 className="token-success-title">ORDER RECEIVED</h1>
        <p className="token-success-subtitle">RECEIPT PRINTED BELOW TERMINAL. RETRIEVE TICKET SLIP.</p>

        <div className="token-display-box">
          <span className="token-display-label">PICKUP IDENTIFICATION</span>
          <h2 className="token-code-number">{activeToken}</h2>
        </div>

        {/* Cinematic Progression Timeline */}
        <div className="cinematic-timeline">
          {STATES.map((state, index) => {
            const isActive = activeStateIndex === index;
            const isCompleted = activeStateIndex > index;
            return (
              <div 
                key={state.key} 
                className={`timeline-step-row ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <span>{state.label} {state.description}</span>
                {isActive && <div className="ambient-pulse" />}
              </div>
            );
          })}
        </div>

         <div className="token-actions">
           {orderFromState && !isReordering && (
             <motion.button
               whileTap={{ scale: 0.98 }}
               className="btn btn-outline btn-large"
               onClick={handleReorder}
             >
               REORDER THIS DRINK
             </motion.button>
           )}
           <motion.button
             whileTap={{ scale: 0.98 }}
             className="btn btn-primary btn-large"
             onClick={handleFinish}
           >
             COMPLETE SYSTEM VISIT
           </motion.button>
         </div>
       </motion.div>
     </div>
   );
 };

 export default TokenConfirmation;
