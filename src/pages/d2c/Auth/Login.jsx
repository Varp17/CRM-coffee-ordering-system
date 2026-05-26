import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Simulate OTP generation
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(randomOtp);
    setOtpStep(true);

    // Alert user about simulated OTP in development
    toast.success(`[SIMULATED SMS] Your Digital Coffee OTP code is: ${randomOtp}`, {
      duration: 10000,
    });
  };

  const handleOtpKeyPress = (num) => {
    if (otpCode.length < 4) {
      setOtpCode(otpCode + num);
    }
  };

  const handleOtpClear = () => {
    setOtpCode('');
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otpCode !== simulatedOtp) {
      toast.error('Invalid OTP. Please check the simulated notification toast.');
      return;
    }

    try {
      const res = await login(phoneNumber, otpCode);
      if (res.success) {
        toast.success(`Welcome back, ${useAuthStore.getState().user?.name || 'Customer'}! ☕`);
        navigate('/store/profile');
      } else {
        toast.error(res.error || 'Authentication failed.');
      }
    } catch (err) {
      toast.error('Something went wrong during login.');
    }
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
        toast.success(`Welcome back, ${useAuthStore.getState().user?.name || 'Customer'}! ☕`);
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
          <h2 className="brand-name">Digital Coffee</h2>
          <p className="brand-tagline">Freshly Brewed D2C Commerce Ecosystem</p>
        </div>

        {/* Tab Selection */}
        {!otpStep && (
          <div className="login-tab-bar">
            <button
              className={`login-tab-btn ${loginMethod === 'otp' ? 'active' : ''}`}
              onClick={() => setLoginMethod('otp')}
            >
              Secure OTP Login
            </button>
            <button
              className={`login-tab-btn ${loginMethod === 'password' ? 'active' : ''}`}
              onClick={() => setLoginMethod('password')}
            >
              Email & Password
            </button>
          </div>
        )}

        {/* Switch layout views */}
        {otpStep ? (
          /* OTP Entry Step */
          <div className="otp-entry-section animate-scale-in">
            <h3>Enter 4-Digit OTP Code</h3>
            <p className="otp-sent-to-info">We sent an verification code to <strong>+91 {phoneNumber}</strong></p>

            <div className="otp-digit-boxes-row">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={`otp-digit-box ${otpCode[idx] ? 'filled' : ''}`}>
                  {otpCode[idx] || ''}
                </div>
              ))}
            </div>

            {/* Virtual Numpad */}
            <div className="otp-virtual-numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} type="button" onClick={() => handleOtpKeyPress(num.toString())}>
                  {num}
                </button>
              ))}
              <button type="button" className="numpad-clear" onClick={handleOtpClear}>
                Clear
              </button>
              <button type="button" onClick={() => handleOtpKeyPress('0')}>
                0
              </button>
              <button 
                type="button" 
                className="numpad-submit" 
                onClick={handleVerifyOtp}
                disabled={otpCode.length < 4 || isLoading}
              >
                Go ➔
              </button>
            </div>

            <button 
              type="button" 
              className="otp-back-link-btn" 
              onClick={() => { setOtpStep(false); setOtpCode(''); }}
            >
              ← Back to login details
            </button>
          </div>
        ) : loginMethod === 'otp' ? (
          /* Mobile OTP entry form */
          <form className="login-form-fields animate-slide-up" onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
            <div className="form-group">
              <label className="form-label-txt">Enter Indian Mobile Number</label>
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
              Send Secure OTP Code 🚀
            </Button>
            <p className="login-disclaimer-txt">
              By continuing, you agree to receive automated simulated OTP tokens. Standard developer simulated rates apply.
            </p>
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
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

