import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Cart: React.FC = () => {
  const { items, removeFromCart, clearCart, totalPrice, deliveryFee, totalOrderAmount, pincode, setPincode, isPilotIntracity } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [pinInput, setPinInput] = useState(pincode);
  const [pinChecked, setPinChecked] = useState(true);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPincode(pinInput.trim());
    setPinChecked(true);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <ShoppingBag size={32} />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Your Cart is Empty
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            Explore verified used books listed by readers in Bidar with doorstep delivery.
          </p>
          <Link to="/explore" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
          Shopping Cart ({items.length} {items.length === 1 ? 'Book' : 'Books'})
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'start'
        }}>
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {items.map((item) => (
              <div
                key={item.listingId}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  gap: 'var(--space-4)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Book Thumbnail */}
                <div style={{
                  width: '80px',
                  height: '110px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src={item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Book Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link to={`/book/${item.listingId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 4px 0' }}>
                          {item.title}
                        </h2>
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.listingId)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      By {item.authors}
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span style={{
                        textTransform: 'capitalize',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {item.conditionGrade.replace('_', ' ')}
                      </span>
                      {item.missingPagesDefect && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <AlertTriangle size={12} /> Missing pages disclosed
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{item.askingPrice}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      1 physical copy
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0' }}>
              <button
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
              >
                Clear Cart
              </button>
              <Link to="/explore" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, textDecoration: 'none' }}>
                + Add More Books
              </Link>
            </div>
          </div>

          {/* Order Summary & Delivery Box */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0' }}>
              Order Summary
            </h2>

            {/* Pincode & Delivery estimation */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)'
            }}>
              <form onSubmit={handleUpdatePin} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN"
                    className="input-field"
                    style={{ fontSize: 'var(--text-xs)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}>
                  Update PIN
                </button>
              </form>

              {pinChecked && (
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <Check size={12} />
                  <span>
                    {isPilotIntracity ? 'Bidar Pilot Zone: Flat ₹40 Doorstep Courier' : 'Intercity Regional Courier (₹70)'}
                  </span>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Books Subtotal ({items.length} items)</span>
                <span>₹{totalPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Doorstep Delivery</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Platform Convenience Fee</span>
                <span style={{ color: '#166534', fontWeight: 600 }}>FREE (₹0)</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--color-primary)' }}>₹{totalOrderAmount}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={handleProceedToCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                justifyContent: 'center',
                fontSize: 'var(--text-base)',
                marginBottom: 'var(--space-4)'
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            {/* Escrow Trust Safeguard */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              <ShieldCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>T+3 Escrow Protection:</strong> Your payment is held safely until the book is delivered and inspected. If damaged or not as described, return it with 100% refund.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
