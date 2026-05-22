import React, { useState } from 'react';
import './Login.css';
import Button from '../../../components/Button/Button';
import api from '../../../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login-email', { email, password });
      
      const token = response.data.data?.accessToken || response.data.accessToken || response.data.token || response.data.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        onLogin();
      } else {
        alert('Login failed: No token received.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <h1 className="login-title">Admin <span className="text-gradient">Login</span></h1>
        <p className="login-subtitle">Enter your credentials to access the dashboard.</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="admin@coffee.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button variant="primary" size="large" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
