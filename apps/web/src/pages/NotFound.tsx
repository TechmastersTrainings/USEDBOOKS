import React from 'react';
import { Link } from 'react-router-dom';
import { BookX, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="container" style={{
      padding: 'var(--space-16) var(--space-4)',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-primary-subtle)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto var(--space-6)'
      }}>
        <BookX size={44} />
      </div>

      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        color: 'var(--color-accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        Error 404
      </span>

      <h1 style={{ fontSize: 'var(--text-4xl)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        This Page Has Gone Missing
      </h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, marginBottom: 'var(--space-8)' }}>
        Like a rare out-of-print edition, the page or book listing you are looking for doesn't exist, has been removed, or has moved to a new shelf.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          <Home size={18} />
          <span>Return Home</span>
        </Link>
        <Link to="/explore" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
          <span>Browse Available Books</span>
        </Link>
      </div>
    </div>
  );
};
