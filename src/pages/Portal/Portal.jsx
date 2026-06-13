import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portal.css';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../utils/i18n';

const Portal = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginStore(email, password);
      
      if (result.success) {
        // Determine destination based on role from the backend
        let destination = '/store';
        const role = (result.role || '').toLowerCase();
        if (role === 'super_admin' || role === 'store_admin') {
          destination = '/admin';
        } else if (role === 'staff' || role === 'kitchen') {
          destination = '/barista';
        } else if (role === 'manager' || role === 'kiosk') {
          destination = '/kiosk';
        } else {
          // customer or any other role → D2C storefront
          destination = '/store';
        }
        navigate(destination);
      } else {
        alert(result.error || t('portal.loginFailed', 'Login failed. Please check your credentials.'));
      }
    } catch (err) {
      console.error('Login failed:', err);
      alert(t('portal.loginFailed', 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-card glass">
        <h1 className="portal-title">{t('portal.title', 'Login')}</h1>
        <p className="portal-subtitle">{t('portal.subtitle', 'Vasify Coffee Ordering System')}</p>
        
        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('portal.emailLabel', 'Email Address')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('portal.passwordLabel', 'Password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="portal-login-btn" disabled={loading}>
            {loading ? t('portal.authenticating', 'Authenticating...') : t('portal.loginBtn', 'Login')}
          </button>
        </form>

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
              <tr onClick={() => { setEmail('admin@example.com'); setPassword('12345'); }}>
                <td>{'admin@example.com'}</td>
                <td>{'12345'}</td>
                <td>{t('portal.roleAdmin', 'Admin')}</td>
              </tr>
              <tr onClick={() => { setEmail('bianchi@gmail.com'); setPassword('12345'); }}>
                <td>{'bianchi@gmail.com'}</td>
                <td>{'12345'}</td>
                <td>{t('portal.roleBarista', 'Kitchen (Barista)')}</td>
              </tr>
              <tr onClick={() => { setEmail('counter@gmail.com'); setPassword('12345'); }}>
                <td>{'counter@gmail.com'}</td>
                <td>{'12345'}</td>
                <td>{t('portal.roleKiosk', 'Customer Display (Kiosk)')}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ textAlign: 'center', marginTop: '15px', color: 'var(--color-text-muted)' }}>
            {t('portal.autofillHint', '*Click a row to autofill credentials.')}
          </p>
        </div>
        
        {/* Added shortcut to D2C for easy access */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            type="button" 
            className="back-btn" 
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/store')}
          >
            {t('portal.accessD2C', 'Access D2C Consumer App')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portal;
