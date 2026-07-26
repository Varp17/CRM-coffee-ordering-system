import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (authMode === 'signup' && (!name || name.trim().length < 2)) {
      toast.error('Please enter your name for registration.');
      return;
    }

    try {
      const res = await sendOtp(phoneNumber, authMode);
      if (res.success) {
        setOtpStep(true);
        if (res.otp) {
          setSimulatedOtp(res.otp);
          toast.success(`[Email Notification] OTP code generated: ${res.otp}`, {
            duration: 8000,
          });
        } else {
          toast.success('OTP sent successfully via Email.');
        }
      } else {
        toast.error(res.error || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error('Failed to send OTP.');
    }
  };

  const handleOtpKeyPress = (num) => {
    if (otpCode.length < 6) {
      setOtpCode((prev) => prev + num);
    }
  };

  const handleOtpClear = () => {
    setOtpCode('');
  };

  const executeOtpVerification = async (codeToVerify) => {
    const targetCode = codeToVerify || otpCode;
    if (!targetCode || targetCode.length < 4) {
      toast.error('Please enter the full verification code.');
      return;
    }

    try {
      const res = await verifyOtp(phoneNumber, targetCode, authMode, { name, email });
      if (res.success) {
        toast.success(`Welcome to Digital Coffee, ${res.user?.name || 'Coffee Lover'}! ☕`);
        navigate('/store/profile');
      } else {
        toast.error(res.error || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      toast.error('Something went wrong during verification.');
    }
  };

  const handleVerifyOtpSubmit = (e) => {
    if (e) e.preventDefault();
    executeOtpVerification();
  };

  const handleAutoFillAndSubmit = (code) => {
    setOtpCode(code);
    executeOtpVerification(code);
  };

  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${useAuthStore.getState().user?.name || 'User'}! ☕`);
        navigate('/store/profile');
      } else {
        toast.error(res.error || 'Authentication failed.');
      }
    } catch (err) {
      toast.error('Failed to log in.');
    }
  };

  return (
    <div className="d2c-login-page container animate-fade-in">
      <div className="login-card-wrapper ">
        {/* Brand Logo Header */}
        <div className="login-brand-header">
          <div className="brand-circle-logo">☕</div>
          <h2 className="brand-name">{t('login.brandName', 'Digital Coffee')}</h2>
          <p className="brand-tagline">{t('login.tagline', 'Freshly Brewed D2C Commerce Ecosystem')}</p>
        </div>

        {/* Auth Mode Toggle (Login vs Create Account) */}
        {!otpStep && (
          <div className="login-tab-bar">
            <button
              className={`login-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Log In
            </button>
            <button
              className={`login-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Switch layout views */}
        {otpStep ? (
          /* OTP Entry Step */
          <div className="otp-entry-section animate-scale-in">
            <h3>Enter 6-Digit OTP Code</h3>
            <p className="otp-sent-to-info">
              {t('login.otpSentTo', 'Verification code sent to')} <strong>+91 {phoneNumber}</strong>
            </p>

            {/* On-Site Notification Banner for Dev Simulated OTP */}
            {simulatedOtp && (
              <div className="simulated-otp-banner">
                <span className="banner-text">
                  💬 <strong>Notification:</strong> Code is <strong>{simulatedOtp}</strong>
                </span>
                <button
                  type="button"
                  className="autofill-btn"
                  onClick={() => handleAutoFillAndSubmit(simulatedOtp)}
                >
                  ⚡ Auto-Fill & Continue
                </button>
              </div>
            )}

            <div className="otp-digit-boxes-row">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const digit = String(otpCode).charAt(idx);
                return (
                  <div key={idx} className={`otp-digit-box ${digit ? 'filled' : ''}`}>
                    {digit || ''}
                  </div>
                );
              })}
            </div>

            {/* Virtual Numpad */}
            <div className="otp-virtual-numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} type="button" onClick={() => handleOtpKeyPress(num.toString())}>
                  {num}
                </button>
              ))}
              <button type="button" className="numpad-clear" onClick={handleOtpClear}>
                {t('login.clear', 'Clear')}
              </button>
              <button type="button" onClick={() => handleOtpKeyPress('0')}>
                {'0'}
              </button>
              <button 
                type="button" 
                className="numpad-submit" 
                onClick={handleVerifyOtpSubmit}
                disabled={otpCode.length < 4 || isLoading}
              >
                {t('login.go', 'Go ➜')}
              </button>
            </div>

            <button 
              type="button" 
              className="otp-back-link-btn" 
              onClick={() => { setOtpStep(false); setOtpCode(''); setSimulatedOtp(''); }}
            >
              ← Back to mobile details
            </button>
          </div>
        ) : loginMethod === 'otp' ? (
          /* Mobile OTP entry form */
          <form className="login-form-fields animate-slide-up" onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
            {authMode === 'signup' && (
              <>
                <div className="form-group">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Email Address (Optional)"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label-txt">{t('login.mobileLabel', 'Enter Indian Mobile Number')}</label>
              <div className="phone-prefix-input-wrap">
                <span className="phone-prefix-val">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength="10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="phone-styled-input"
                  required
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="large"
              fullWidth={true}
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
            >
              {authMode === 'signup' ? 'Create Account & Send OTP 🚀' : 'Send Secure OTP Code 🚀'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                onClick={() => setLoginMethod('password')}
              >
                Or sign in with Email & Password
              </button>
            </div>
          </form>
        ) : (
          /* Email & Password entry form */
          <form className="login-form-fields animate-slide-up" onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <Input
                label="Email Address"
                placeholder="you@gmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              variant="primary"
              size="large"
              fullWidth={true}
              type="submit"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Verifying Credentials...' : 'Access Dashboard 🔓'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                onClick={() => setLoginMethod('otp')}
              >
                ← Back to Mobile OTP Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

