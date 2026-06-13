import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';
import './Login.css';
import { t } from '../../../utils/i18n';

const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('12345');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Generate a random 5-character captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789'; // Avoid ambiguous chars like O, 0, I, 1, l
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaError(false);
  };

  // Generate captcha on initial render
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleRowClick = (selectedEmail, selectedPassword, role) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    
    // Auto-fill captcha matching the current captcha code for testing convenience
    setCaptchaInput(captchaCode);
    setCaptchaError(false);

    toast.success(`${role} credentials & captcha loaded!`, {
      style: {
        background: '#157347',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: '500',
      },
      icon: '⚡',
      duration: 2000
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both Email and Password.', {
        style: { background: '#dc3545', color: '#fff' }
      });
      return;
    }

    if (!captchaInput) {
      setCaptchaError(true);
      toast.error('Please enter the Captcha Word.', {
        style: { background: '#dc3545', color: '#fff' }
      });
      return;
    }

    // Captcha validation
    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setCaptchaError(true);
      toast.error('Captcha code is incorrect. Try again!', {
        style: { background: '#dc3545', color: '#fff' }
      });
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Authenticating operator...');

    let result;
    try {
      result = await loginStore(email, password);
    } catch (err) {
      console.error('[Login] Error in handleSubmit:', err.message);
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
      toast.error('Authentication failed. Please try again.', {
        style: { background: '#dc3545', color: '#fff' }
      });
      generateCaptcha();
      return;
    }

    toast.dismiss(loadingToast);
    setIsSubmitting(false);

    if (result.success) {
      const isProductiveAdmin = result.role === 'admin' || result.role === 'super_admin';
      toast.success(`Successfully logged in as ${isProductiveAdmin ? 'Administrator' : result.role === 'barista' ? 'Kitchen Operator' : 'Kiosk Display'}!`, {
        style: { background: '#157347', color: '#fff' }
      });
      
      // Redirect based on role
      if (isProductiveAdmin) {
        navigate('/admin');
      } else if (result.role === 'barista') {
        navigate('/barista');
      } else {
        navigate('/kiosk');
      }
    } else {
      toast.error(result.error || 'Authentication failed. Please check credentials.', {
        style: { background: '#dc3545', color: '#fff' }
      });
      generateCaptcha();
    }
  };

  return (
    <div className="operator-login-container">
      <div className="operator-login-card">
        {/* Mockup Header */}
        <h1 className="operator-login-title">{t('adminLogin.title', 'Login')}</h1>
        <p className="operator-login-subtitle">{t('adminLogin.subtitle', 'Digital Coffee Enterprise Management Software')}</p>

        <form onSubmit={handleSubmit} className="operator-login-form">
          {/* Email Address Input */}
          <div className="operator-form-group">
            <label className="operator-form-label" htmlFor="email-input">{t('adminLogin.emailLabel', 'Email Address')}</label>
            <input
              id="email-input"
              type="email"
              className="operator-form-input"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="operator-form-group">
            <label className="operator-form-label" htmlFor="password-input">{t('adminLogin.passwordLabel', 'Password')}</label>
            <input
              id="password-input"
              type="password"
              className="operator-form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Captcha Generation Box and Input */}
          <div className="operator-form-group">
            <div className="captcha-generator-wrapper">
              <div className="captcha-display-box">
                {captchaCode.split('').map((char, index) => {
                  const rotation = (index % 2 === 0 ? 1 : -1) * (Math.random() * 15);
                  const scale = 0.9 + Math.random() * 0.25;
                  const shiftY = (Math.random() - 0.5) * 6;
                  return (
                    <span
                      key={index}
                      className="captcha-char"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${scale}) translateY(${shiftY}px)`,
                        color: index % 2 === 0 ? '#2b3e50' : '#c67c4e',
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
                <div className="captcha-noise-line"></div>
              </div>
              <button
                type="button"
                className="captcha-refresh-btn"
                onClick={generateCaptcha}
                title="Generate new Captcha"
              >
                🔄
              </button>
            </div>

            <input
              type="text"
              className={`operator-form-input captcha-input-field ${captchaError ? 'input-error' : ''}`}
              placeholder="Captcha Word"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (captchaError) setCaptchaError(false);
              }}
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="operator-login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Login'}
          </button>
        </form>

        {/* Credentials Reference Table */}
        <div className="credentials-reference-container">
          <div className="credentials-table-wrapper">
            <table className="credentials-reference-table">
              <thead>
                <tr>
                  <th>{t('adminLogin.colEmail', 'Email')}</th>
                  <th>{t('adminLogin.colPass', 'Pass')}</th>
                  <th>{t('adminLogin.colRole', 'Role')}</th>
                </tr>
              </thead>
              <tbody>
                <tr onClick={() => handleRowClick('admin@example.com', '12345', 'Admin')} title="Click to autofill Admin credentials">
                  <td>{'admin@example.com'}</td>
                  <td>{'12345'}</td>
                  <td><span className="role-tag role-admin">{t('adminLogin.roleAdmin', 'Admin')}</span></td>
                </tr>
                <tr onClick={() => handleRowClick('bianchi@gmail.com', '12345', 'Kitchen')} title="Click to autofill Kitchen credentials">
                  <td>{'bianchi@gmail.com'}</td>
                  <td>{'12345'}</td>
                  <td><span className="role-tag role-kitchen">{t('adminLogin.roleKitchen', 'Kitchen')}</span></td>
                </tr>
                <tr onClick={() => handleRowClick('counter@gmail.com', '12345', 'Customer Display')} title="Click to autofill Customer Display credentials">
                  <td>{'counter@gmail.com'}</td>
                  <td>{'12345'}</td>
                  <td><span className="role-tag role-display">{t('adminLogin.roleDisplay', 'Customer Display')}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
