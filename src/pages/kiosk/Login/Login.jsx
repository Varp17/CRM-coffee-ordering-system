import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Login.css';

const Login = ({ onLogin, onBack }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleKeyClick = (num) => {
    if (isOtpSent) {
      if (otp.length < 4) setOtp(otp + num);
    } else {
      if (mobileNumber.length < 10) setMobileNumber(mobileNumber + num);
    }
  };

  const handleBackspace = () => {
    if (isOtpSent) {
      setOtp(otp.slice(0, -1));
    } else {
      setMobileNumber(mobileNumber.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (mobileNumber.length === 10) {
      setIsOtpSent(true);
    }
  };

  const handleVerify = () => {
    if (otp.length === 4) {
      onLogin(mobileNumber);
    }
  };

  const transitionEase = [0.16, 1, 0.3, 1];

  return (
    <div className="kiosk-login">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: transitionEase }}
      >
        {!isOtpSent ? (
          <>
            <h2>MEMBER SIGN IN</h2>
            <p>ENTER MOBILE IDENTIFICATION TO COMPOSE FROM FAVORITES</p>
            <div className="input-display">
              {mobileNumber || '0000000000'}
            </div>
          </>
        ) : (
          <>
            <h2>VERIFICATION REQUIRED</h2>
            <p>ENTER THE 4-DIGIT CODE TRANSMITTED TO +91 {mobileNumber}</p>
            <div className="input-display otp-display">
              {otp || '0000'}
            </div>
          </>
        )}

        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="key-btn" onClick={() => handleKeyClick(num.toString())}>{num}</button>
          ))}
          <button className="key-btn" onClick={handleBackspace}>[CLR]</button>
          <button className="key-btn" onClick={() => handleKeyClick('0')}>0</button>
          {!isOtpSent ? (
            <button className="key-btn action-key" onClick={handleContinue} disabled={mobileNumber.length !== 10}>[OK]</button>
          ) : (
            <button className="key-btn action-key" onClick={handleVerify} disabled={otp.length !== 4}>[OK]</button>
          )}
        </div>

        <div className="build-actions">
          <button className="step-nav-btn" onClick={onBack} style={{ width: '100%' }}>
            RETURN TO GALLERY
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
