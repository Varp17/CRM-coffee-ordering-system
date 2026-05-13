import React, { useState } from 'react';
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

  return (
    <div className="kiosk-login">
      <div className="login-card glass">
        <button className="back-btn" onClick={onBack}>← Back</button>
        
        {!isOtpSent ? (
          <>
            <h2>Enter Mobile Number</h2>
            <p>To save points and access favorites</p>
            <div className="input-display">
              {mobileNumber || '0000000000'}
            </div>
          </>
        ) : (
          <>
            <h2>Enter OTP</h2>
            <p>Sent to +91 {mobileNumber}</p>
            <div className="input-display otp-display">
              {otp || '0000'}
            </div>
          </>
        )}

        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="key-btn" onClick={() => handleKeyClick(num.toString())}>{num}</button>
          ))}
          <button className="key-btn" onClick={handleBackspace}>⌫</button>
          <button className="key-btn" onClick={() => handleKeyClick('0')}>0</button>
          {!isOtpSent ? (
            <button className="key-btn action-key" onClick={handleContinue} disabled={mobileNumber.length !== 10}>→</button>
          ) : (
            <button className="key-btn action-key" onClick={handleVerify} disabled={otp.length !== 4}>✓</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
