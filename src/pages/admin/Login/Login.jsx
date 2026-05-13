import React, { useState } from 'react';
import './Login.css';
import Button from '../../../components/Button/Button';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@coffee.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just simulate a successful login
    if (email && password) {
      onLogin();
    } else {
      alert('Please fill in all fields.');
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
          <Button variant="primary" size="large" type="submit">Sign In</Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
