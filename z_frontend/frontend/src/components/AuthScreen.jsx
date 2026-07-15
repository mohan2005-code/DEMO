import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Mail } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || (!isLogin && !email)) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = isLogin 
      ? 'http://localhost:8000/api/auth/login' 
      : 'http://localhost:8000/api/auth/register';

    const payload = isLogin 
      ? { username, password } 
      : { username, email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        onLoginSuccess(data.access_token, data.role, data.username);
      } else {
        setSuccess('Registration successful! You can now sign in.');
        setIsLogin(true);
        setPassword('');
        setEmail('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '1rem',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div className="card" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '2.5rem',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header Icon & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 'var(--radius-full)',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: 'var(--primary)'
          }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.25rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            {isLogin ? 'Access your secure debt management dashboard' : 'Secure your financial future with AI-guided tools'}
          </p>
        </div>

        {/* Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
          marginBottom: '2rem',
          border: '1px solid var(--glass-border)'
        }}>
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            style={{
              flex: 1,
              background: isLogin ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              border: 'none',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '0.6rem 0',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            style={{
              flex: 1,
              background: !isLogin ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              border: 'none',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '0.6rem 0',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Register
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0, animation: 'fadeIn 0.3s ease-out' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <span className="spinner" style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Register'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
