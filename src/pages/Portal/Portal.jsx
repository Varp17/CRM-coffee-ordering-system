import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portal.css';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../utils/i18n';
import toast from 'react-hot-toast';

const Portal = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(t('portal.loggingIn', 'Authenticating...'));
    try {
      const result = await loginStore(email, password);

      if (result.success) {
        toast.success(t('portal.loginSuccess', 'Welcome back! ☕'), { id: toastId });
        // Determine destination based on role from the backend
        let destination = '/store';
        const role = (result.role || '').toLowerCase();
        if (role === 'super_admin' || role === 'store_admin') {
          destination = '/admin';
        } else if (role === 'staff' || role === 'kitchen') {
          destination = '/barista';
        } else if (role === 'manager' || role === 'kiosk') {
          window.location.href = 'https://coffee-ordering-kiosk-248e1f.gitlab.io/';
          return;
        } else {
          // customer or any other role → D2C storefront
          destination = '/store';
        }
        navigate(destination);
      } else {
        toast.error(result.error || t('portal.loginFailed', 'Login failed. Please check your credentials.'), { id: toastId });
      }
    } catch (err) {
      console.error('Login failed:', err);
      toast.error(t('portal.loginError', 'Connection error. Please try again later.'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (selectedEmail, selectedPassword, roleName) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    toast.success(t('portal.autofillLoaded', `Filled ${roleName} credentials! ⚡`), {
      duration: 1500,
      icon: '☕'
    });
  };

  return (
    <div className="portal-page">
      <div className="portal-card-glow"></div>
      <div className="portal-card glass">
        {/* Modern Lock Badge */}
        <div className="portal-badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">{t('portal.badgeText', 'Internal CRM • Authorised Access Only')}</span>
        </div>

        {/* Text Logo - Coffee System */}
        <div className="portal-logo-container">
          <h1 className="portal-brand-title">
            <span className="brand-accent">Coffee</span> System
          </h1>
          <p className="portal-brand-subtitle">{t('portal.subtitle', 'Enterprise Management & POS Hub')}</p>
        </div>

        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('portal.emailLabel', 'Work Email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="portal-input"
              placeholder="operator@coffeesystem.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('portal.passwordLabel', 'Password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="portal-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="portal-login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>
                {t('portal.loginBtn', 'Access Dashboard')}
                <span className="btn-arrow">➔</span>
              </>
            )}
          </button>
        </form>

        <p className="portal-disclaimer">
          {t('portal.disclaimerText', 'This is a private internal tool. Unauthorised access is prohibited.')}
        </p>

        <div className="portal-partner-branding">
          <span className="partner-circle"></span>
          <span className="partner-text">{t('portal.partnerText', 'VasifyTech PVT LTD • WhatsApp Business Partner')}</span>
        </div>

        {/* Collapsible Login Credentials Drawer */}
        <div className="login-credentials-drawer">
          <button
            type="button"
            className={`credentials-toggle-btn ${showCredentials ? 'active' : ''}`}
            onClick={() => setShowCredentials(!showCredentials)}
          >
            {showCredentials 
              ? t('portal.hideCredentials', 'HIDE LOGIN CREDENTIALS ▲') 
              : t('portal.showCredentials', 'SHOW LOGIN CREDENTIALS ▼')}
          </button>
          
          <div className={`credentials-table-wrapper ${showCredentials ? 'expanded' : ''}`}>
            <div className="credentials-table-container">
              <table className="credentials-table">
                <thead>
                  <tr>
                    <th>{t('portal.colEmail', 'Email')}</th>
                    <th>{t('portal.colPass', 'Pass')}</th>
                    <th>{t('portal.colRole', 'Role')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr onClick={() => handleAutofill('admin@example.com', '12345', 'Admin')}>
                    <td><code>admin@example.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-admin">Admin</span></td>
                  </tr>
                  <tr onClick={() => handleAutofill('bianchi@gmail.com', '12345', 'Barista')}>
                    <td><code>bianchi@gmail.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-barista">Barista</span></td>
                  </tr>
                  <tr onClick={() => handleAutofill('counter@gmail.com', '12345', 'Kiosk')}>
                    <td><code>counter@gmail.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-kiosk">Kiosk</span></td>
                  </tr>
                </tbody>
              </table>
              <p className="autofill-hint">
                {t('portal.autofillHint', '* Click any row to automatically fill credentials.')}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Link to D2C storefront */}
        <div className="d2c-shortcut-container">
          <button
            type="button"
            className="back-btn-d2c"
            onClick={() => navigate('/store')}
          >
            {t('portal.accessD2C', 'Access D2C Consumer App')}
            <span className="d2c-arrow">☕</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portal;

