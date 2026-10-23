import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Search, PlusCircle, ShoppingBag, User, MapPin,
  Menu, X, Home, Compass, Package, HelpCircle, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Top Header */}
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
          height: '64px',
          gap: 'var(--space-3)'
        }}>
          {/* Brand Logo & Pilot City Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-inverse)',
                flexShrink: 0
              }}>
                <BookOpen size={20} />
              </div>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '1.35rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                BookLoop
              </span>
            </Link>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid rgba(44, 94, 67, 0.2)',
              whiteSpace: 'nowrap'
            }}>
              <MapPin size={11} />
              <span>Bidar</span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hide-on-mobile"
            style={{
              flex: 1,
              maxWidth: '460px',
              position: 'relative',
              margin: '0 var(--space-2)'
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Search books, authors, ISBN (UPSC, Engineering)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '40px',
                borderRadius: 'var(--radius-full)',
                height: '40px',
                fontSize: 'var(--text-sm)'
              }}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
          </form>

          {/* Desktop Action Navigation */}
          <div className="flex-hide-on-mobile" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link to="/explore" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Browse
            </Link>

            <Link to="/sell" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <PlusCircle size={16} />
              <span>Sell a Book</span>
            </Link>

            <Link to="/cart" aria-label="Cart" style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-subtle)',
              position: 'relative'
            }}>
              <ShoppingBag size={19} />
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                textDecoration: 'none'
              }}>
                <User size={16} />
                <span>{user.full_name ? user.full_name.split(' ')[0] : 'Profile'}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem' }}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Right Icons (Search toggle, Cart, Hamburger menu) */}
          <div className="flex-show-on-mobile" style={{ alignItems: 'center', gap: '8px' }}>
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle Search"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: mobileSearchOpen ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                color: mobileSearchOpen ? 'var(--color-primary)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Search size={18} />
            </button>

            {/* Mobile Cart Button */}
            <Link
              to="/cart"
              aria-label="Cart"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <ShoppingBag size={18} />
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

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: mobileMenuOpen ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: mobileMenuOpen ? '#fff' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Expandable Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="show-on-mobile animate-slide-down" style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-3) var(--space-4)'
          }}>
            <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  autoFocus
                  className="input-field"
                  placeholder="Search title, author, ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '15px'
                  }}
                />
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '0 16px',
                  fontSize: 'var(--text-xs)'
                }}
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setMobileMenuOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-down"
            style={{
              width: '100%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflowY: 'auto'
            }}
          >
            {/* Drawer User Status Header */}
            <div style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              {isAuthenticated && user ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 'var(--text-base)'
                    }}>
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{user.full_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{user.phone_number || user.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      marginTop: '4px'
                    }}
                  >
                    <span>View Profile & Orders</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', marginBottom: '4px' }}>Welcome to BookLoop</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    Buy and sell pre-loved books with doorstep delivery in Bidar.
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Navigation Links */}
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive('/') ? 'var(--color-primary)' : 'var(--text-primary)',
                  backgroundColor: isActive('/') ? 'var(--color-primary-subtle)' : 'transparent',
                  fontWeight: isActive('/') ? 600 : 500,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none'
                }}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive('/explore') ? 'var(--color-primary)' : 'var(--text-primary)',
                  backgroundColor: isActive('/explore') ? 'var(--color-primary-subtle)' : 'transparent',
                  fontWeight: isActive('/explore') ? 600 : 500,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none'
                }}
              >
                <Compass size={18} />
                <span>Browse All Books</span>
              </Link>

              <Link
                to="/sell"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-accent)',
                  backgroundColor: 'var(--color-accent-subtle)',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none'
                }}
              >
                <PlusCircle size={18} />
                <span>Sell a Book (Earn Money)</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive('/cart') ? 'var(--color-primary)' : 'var(--text-primary)',
                  backgroundColor: isActive('/cart') ? 'var(--color-primary-subtle)' : 'transparent',
                  fontWeight: isActive('/cart') ? 600 : 500,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <ShoppingBag size={18} />
                  <span>Shopping Cart</span>
                </div>
                {itemCount > 0 && (
                  <span style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px'
                  }}>
                    {itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    color: isActive('/profile') ? 'var(--color-primary)' : 'var(--text-primary)',
                    backgroundColor: isActive('/profile') ? 'var(--color-primary-subtle)' : 'transparent',
                    fontWeight: isActive('/profile') ? 600 : 500,
                    fontSize: 'var(--text-sm)',
                    textDecoration: 'none'
                  }}
                >
                  <Package size={18} />
                  <span>My Orders & Escrow</span>
                </Link>
              )}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: 'var(--space-2) 0' }} />

              <Link
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none'
                }}
              >
                <HelpCircle size={16} />
                <span>Help Centre & FAQs</span>
              </Link>

              <Link
                to="/delivery-policy"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '8px 14px',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none'
                }}
              >
                Bidar Delivery Policy
              </Link>

              <Link
                to="/returns"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '8px 14px',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none'
                }}
              >
                Returns & T+3 Escrow Policy
              </Link>
            </div>

            {/* Logout button if logged in */}
            {isAuthenticated && (
              <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Mobile Bottom Navigation Bar (app-like dock on screens < 768px) */}
      <nav
        className="show-on-mobile"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-subtle)',
          paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '56px',
          padding: '0 8px'
        }}>
          {/* 1. Home */}
          <Link
            to="/"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive('/') ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: isActive('/') ? 600 : 500,
              gap: '2px'
            }}
          >
            <Home size={20} color={isActive('/') ? 'var(--color-primary)' : 'var(--text-muted)'} />
            <span>Home</span>
          </Link>

          {/* 2. Explore / Browse */}
          <Link
            to="/explore"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive('/explore') ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: isActive('/explore') ? 600 : 500,
              gap: '2px'
            }}
          >
            <Compass size={20} color={isActive('/explore') ? 'var(--color-primary)' : 'var(--text-muted)'} />
            <span>Browse</span>
          </Link>

          {/* 3. Sell (+ Center Elevated Action) */}
          <Link
            to="/sell"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive('/sell') ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: '10px',
              fontWeight: 700,
              gap: '2px'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(44, 94, 67, 0.35)',
              transform: 'translateY(-4px)'
            }}>
              <PlusCircle size={22} />
            </div>
            <span style={{ transform: 'translateY(-4px)' }}>Sell</span>
          </Link>

          {/* 4. Cart */}
          <Link
            to="/cart"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive('/cart') ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: isActive('/cart') ? 600 : 500,
              position: 'relative',
              gap: '2px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <ShoppingBag size={20} color={isActive('/cart') ? 'var(--color-primary)' : 'var(--text-muted)'} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px'
                }}>
                  {itemCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </Link>

          {/* 5. Account / Profile */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: (isActive('/profile') || isActive('/login') || isActive('/register'))
                ? 'var(--color-primary)'
                : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: (isActive('/profile') || isActive('/login') || isActive('/register')) ? 600 : 500,
              gap: '2px'
            }}
          >
            <User
              size={20}
              color={(isActive('/profile') || isActive('/login') || isActive('/register'))
                ? 'var(--color-primary)'
                : 'var(--text-muted)'}
            />
            <span>{isAuthenticated ? 'Account' : 'Sign In'}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};
