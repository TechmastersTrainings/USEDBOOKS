import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, PlusCircle, ShoppingBag, User, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        gap: 'var(--space-4)'
      }}>
        {/* Brand Logo & Pilot City Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-inverse)'
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                BookLoop
              </span>
            </div>
          </Link>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            border: '1px solid rgba(44, 94, 67, 0.2)'
          }}>
            <MapPin size={12} />
            <span>Bidar Pilot</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{
          flex: 1,
          maxWidth: '520px',
          position: 'relative'
        }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by title, author, ISBN (e.g. UPSC, Engineering, Novel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', borderRadius: 'var(--radius-full)' }}
          />
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
        </form>

        {/* Action Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/explore" className="btn btn-secondary">
            Browse
          </Link>

          <Link to="/sell" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Sell a Book</span>
          </Link>

          <Link to="/cart" aria-label="Cart" style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-subtle)',
            position: 'relative'
          }}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--text-inverse)',
                fontSize: '10px',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated && user ? (
            <Link to="/profile" aria-label="Account" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none'
            }}>
              <User size={16} />
              <span>{user.full_name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-sm)' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
