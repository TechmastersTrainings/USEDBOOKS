import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bookloop_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential') => {
    localStorage.setItem('bookloop_cookie_consent', type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-strong)',
        padding: 'var(--space-4) var(--space-6)',
        boxShadow: '0 -4px 16px rgba(28, 25, 23, 0.12)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', maxWidth: '780px' }}>
        <ShieldCheck size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          We respect your privacy. BookLoop uses strictly necessary cookies to manage authentication, shopping cart state, and fraud prevention in accordance with our <Link to="/privacy" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Privacy Policy</Link>. No third-party behavioral ad trackers are loaded.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          onClick={() => handleAccept('essential')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.875rem', fontSize: 'var(--text-xs)' }}
        >
          Essential Only
        </button>
        <button
          onClick={() => handleAccept('all')}
          className="btn btn-primary"
          style={{ padding: '0.4rem 1rem', fontSize: 'var(--text-xs)' }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
