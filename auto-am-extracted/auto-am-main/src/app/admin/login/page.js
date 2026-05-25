'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginAdmin } from '@/utils/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginAdmin(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-sans)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 60%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{
        background: 'var(--color-surface)',
        padding: '48px 40px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-elevated)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--color-border)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Image
            src="/images/logo.png"
            alt="Amine Auto Logo"
            width={180}
            height={60}
            priority
            style={{ margin: '0 auto 16px', display: 'block', objectFit: 'contain' }}
          />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>Espace Administrateur</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '14px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            textAlign: 'center',
            fontWeight: '600',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Adresse Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@amineauto.dz" 
              required
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)', 
                fontSize: '1rem',
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)', 
                fontSize: '1rem',
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--color-primary-light)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '1.05rem', 
              fontWeight: '700',
              marginTop: '12px',
              background: 'var(--color-primary)',
              color: 'var(--color-dark)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px var(--color-primary-glow)'
            }}
            onMouseOver={(e) => { if(!loading) { e.target.style.background = 'var(--color-primary-hover)'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px var(--color-primary-glow)'; } }}
            onMouseOut={(e) => { if(!loading) { e.target.style.background = 'var(--color-primary)'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px var(--color-primary-glow)'; } }}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
