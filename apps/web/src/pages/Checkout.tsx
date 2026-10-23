import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, ShieldCheck, CreditCard, ArrowLeft,
  AlertCircle, Plus, Lock, Smartphone
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Address {
  id: string;
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export const Checkout: React.FC = () => {
  const { items, totalPrice, deliveryFee, clearCart } = useCart();
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(true);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // New Address Form toggle & state
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [pincode, setPincode] = useState<string>('585401');
  const [city, setCity] = useState<string>('Bidar');
  const [state, setState] = useState<string>('Karnataka');
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'mock_upi' | 'upi' | 'card'>('mock_upi');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    fetchAddresses();
  }, [isAuthenticated, items.length]);

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: Address[] = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      } else if (res.status === 401 || res.status === 404) {
        logout();
        navigate('/login?redirect=/checkout');
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePincodeLookup = async (pin: string) => {
    setPincode(pin);
    if (pin.length === 6) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/users/pincode/${pin}`);
        if (res.ok) {
          const data = await res.json();
          setCity(data.city);
          setState(data.state);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingAddress(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || undefined,
          landmark: landmark.trim() || undefined,
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
          is_default: addresses.length === 0,
          is_delivery_address: true,
          is_pickup_address: true,
        })
      });

      if (res.ok) {
        const newAddr = await res.json();
        setAddresses((prev) => [...prev, newAddr]);
        setSelectedAddressId(newAddr.id);
        setShowNewAddressForm(false);
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not save address');
      }
    } catch {
      alert('Network error while saving address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select or add a delivery address to proceed.');
      return;
    }

    setSubmittingOrder(true);
    setOrderError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_address_id: selectedAddressId,
          listing_ids: items.map((i) => i.listingId),
          payment_method: paymentMethod
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to place order. Some items may have already sold.');
      }

      // Clear the cart on successful placement
      clearCart();

      // Navigate to order tracking page
      navigate(`/order/${data.id}`);
    } catch (err: any) {
      setOrderError(err.message || 'Error occurred while creating your order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const isBidarAddress = selectedAddress && ['585401', '585402', '585403', '585404'].includes(selectedAddress.pincode);

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link
            to="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Cart</span>
          </Link>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 'var(--space-2) 0 0 0' }}>
            Checkout & Escrow Payment
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Peer-to-peer transaction protected by BookLoop T+3 Inspection Escrow.
          </p>
        </div>

        {orderError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-sm)'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{orderError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-6)' }}>
          {/* Left Column: Address & Payment Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Step 1: Delivery Address */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <MapPin size={20} color="var(--color-primary)" />
                  <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                    1. Delivery Address
                  </h2>
                </div>
                {!showNewAddressForm && addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', gap: '4px' }}
                  >
                    <Plus size={14} /> Add New
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Loading address book...</p>
              ) : showNewAddressForm ? (
                <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="responsive-two-col">
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Recipient Name"
                        className="input-field"
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile"
                        className="input-field"
                        style={{ padding: '8px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Flat / House / Building / Street *</label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="e.g. Flat 302, Sai Residency, Near Gandhi Circle"
                      className="input-field"
                      style={{ padding: '8px' }}
                    />
                  </div>

                  <div className="responsive-two-col">
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Area / Colony</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="e.g. Mailoor / Gumpa"
                        className="input-field"
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Landmark (Optional)</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near Gurudwara Gate"
                        className="input-field"
                        style={{ padding: '8px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => handlePincodeLookup(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 585401"
                      className="input-field"
                      style={{ padding: '8px' }}
                    />
                  </div>

                  <div className="responsive-two-col">
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>City</label>
                      <input
                        type="text"
                        readOnly
                        value={city}
                        className="input-field"
                        style={{ fontSize: 'var(--text-xs)', padding: '8px', backgroundColor: 'var(--bg-subtle)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>State</label>
                      <input
                        type="text"
                        readOnly
                        value={state}
                        className="input-field"
                        style={{ fontSize: 'var(--text-xs)', padding: '8px', backgroundColor: 'var(--bg-subtle)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                    >
                      {savingAddress ? 'Saving...' : 'Save & Deliver Here'}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    const isBidar = ['585401', '585402', '585403', '585404'].includes(addr.pincode);
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        style={{
                          border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3) var(--space-4)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{addr.full_name}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>• {addr.phone_number}</span>
                            {isBidar && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                backgroundColor: '#DCFCE7',
                                color: '#166534',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                Bidar Pilot Zone (Flat ₹40)
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px'
                        }}>
                          {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <CreditCard size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  2. Escrow Payment Method
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {/* Mock UPI Option (Sandbox) */}
                <div
                  onClick={() => setPaymentMethod('mock_upi')}
                  style={{
                    border: `1.5px solid ${paymentMethod === 'mock_upi' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'mock_upi' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Smartphone size={20} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Instant UPI (Sandbox / Pilot Mode)</span>
                        <span style={{ fontSize: '10px', backgroundColor: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                          Recommended for Pilot
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Instant simulation of Google Pay, PhonePe, Paytm, BHIM UPI.
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === 'mock_upi' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'mock_upi' ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {paymentMethod === 'mock_upi' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                  </div>
                </div>

                {/* Razorpay UPI */}
                <div
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    border: `1.5px solid ${paymentMethod === 'upi' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'upi' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Smartphone size={20} color="var(--text-secondary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        UPI Autopay / Gateway (Razorpay Route)
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Enter VPA (e.g. mobile@okaxis, user@ibl) for gateway checkout.
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === 'upi' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'upi' ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {paymentMethod === 'upi' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                  </div>
                </div>

                {/* Cards / Net Banking */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    border: `1.5px solid ${paymentMethod === 'card' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'card' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <CreditCard size={20} color="var(--text-secondary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        Debit / Credit Cards & NetBanking
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Visa, MasterCard, RuPay, and All Major Indian Banks.
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === 'card' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: paymentMethod === 'card' ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {paymentMethod === 'card' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)',
              position: 'sticky',
              top: '90px'
            }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0' }}>
                Order Summary ({items.length} {items.length === 1 ? 'book' : 'books'})
              </h2>

              {/* Book Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                {items.map((item) => (
                  <div key={item.listingId} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <img
                      src={item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Grade: {item.conditionGrade.replace('_', ' ')}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{item.askingPrice}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Books Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>
                    Doorstep Courier Delivery {isBidarAddress ? '(Bidar Flat)' : '(Standard)'}
                  </span>
                  <span>₹{isBidarAddress ? 40 : deliveryFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Platform Fee</span>
                  <span style={{ color: '#166534', fontWeight: 600 }}>FREE (₹0)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>GST on Books (HSN 4901)</span>
                  <span>0% Nil Rated</span>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 'var(--space-3)',
                  marginTop: 'var(--space-3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Total Payable</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                    ₹{totalPrice + (isBidarAddress ? 40 : deliveryFee)}
                  </span>
                </div>
              </div>

              {/* Escrow Guarantee Highlight */}
              <div style={{
                backgroundColor: 'var(--color-primary-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'flex-start'
              }}>
                <ShieldCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-primary)', lineHeight: 1.4 }}>
                  <strong>T+3 Inspection Escrow:</strong> Your money remains locked in an escrow account. The seller is only paid after 3 days of doorstep delivery and your satisfaction.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder || !selectedAddressId}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  justifyContent: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                <Lock size={16} />
                <span>
                  {submittingOrder ? 'Locking Escrow & Placing Order...' : `Pay ₹${totalPrice + (isBidarAddress ? 40 : deliveryFee)} Securely`}
                </span>
              </button>

              <p style={{ margin: 'var(--space-3) 0 0 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                By ordering, you agree to BookLoop's Buyer Protection & Returns Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
