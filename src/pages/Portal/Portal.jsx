import React, { useState } from 'react';
import './Portal.css';
import api from '../../services/api';

const Portal = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login-email', { email, password });
      const user = response.data.data?.user || response.data.user;
      const token = response.data.data?.accessToken || response.data.accessToken || response.data.token;
      
      if (token) {
        localStorage.setItem('token', token);
      }

      let role = 'd2c';
      if (user) {
        if (user.role === 'super_admin' || user.role === 'admin') role = 'admin';
        else if (user.role === 'barista' || user.role === 'kitchen') role = 'barista';
        else if (user.role === 'store_manager' || user.role === 'kiosk') role = 'kiosk';
      }

      onLogin(role);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-card glass">
        <h1 className="portal-title">Login</h1>
        <p className="portal-subtitle">Vasify Coffee Ordering System</p>
        
        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="portal-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="credentials-table-container">
          <table className="credentials-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Pass</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr onClick={() => { setEmail('admin@example.com'); setPassword('12345'); }}>
                <td>admin@example.com</td>
                <td>12345</td>
                <td>Admin</td>
              </tr>
              <tr onClick={() => { setEmail('bianchi@gmail.com'); setPassword('12345'); }}>
                <td>bianchi@gmail.com</td>
                <td>12345</td>
                <td>Kitchen (Barista)</td>
              </tr>
              <tr onClick={() => { setEmail('counter@gmail.com'); setPassword('12345'); }}>
                <td>counter@gmail.com</td>
                <td>12345</td>
                <td>Customer Display (Kiosk)</td>
              </tr>
            </tbody>
          </table>
          <p style={{ textAlign: 'center', marginTop: '15px', color: 'var(--color-text-muted)' }}>
            *Click a row to autofill credentials.
          </p>
        </div>
        
        {/* Added shortcut to D2C for easy access */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            type="button" 
            className="back-btn" 
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => onLogin('d2c')}
          >
            Access D2C Consumer App
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portal;
