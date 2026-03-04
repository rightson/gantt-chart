import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 40,
        width: 400,
        border: '1px solid #0f3460',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{ color: '#e0e0ff', textAlign: 'center', marginBottom: 8, fontSize: 28 }}>
          Gantt Chart
        </h1>
        <p style={{ color: '#8888aa', textAlign: 'center', marginBottom: 30, fontSize: 13 }}>
          Project management made visual
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #333' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'none',
                border: 'none',
                borderBottom: mode === m ? '2px solid #0096c7' : '2px solid transparent',
                color: mode === m ? '#e0e0ff' : '#666',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
              minLength={mode === 'register' ? 6 : undefined}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(233,69,96,0.15)',
              border: '1px solid #e94560',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#e94560',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 0',
              background: '#0f3460',
              border: 'none',
              borderRadius: 8,
              color: '#e0e0ff',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              marginTop: 6,
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#8888aa',
  fontSize: 11,
  marginBottom: 4,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0d1117',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#e0e0ff',
  fontSize: 14,
  outline: 'none',
};
