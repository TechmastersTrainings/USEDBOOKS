import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Plus, Trash2, CheckCircle2,
  AlertCircle, LogOut, Check, Package, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  is_pickup_address: boolean;
  is_delivery_address: boolean;
}

interface OrderItemSummary {
  id: string;
  price: number;
  listing?: {
    title: string;
    cover_image_url?: string;
  };
}

interface OrderSummary {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItemSummary[];
}

export const Profile: React.FC = () => {
  const { user, token, isAuthenticated, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Address form state
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('Bidar');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPincode, setAddrPincode] = useState('585401');
  const [addrIsDefault, setAddrIsDefault] = useState(true);
  const [addrIsPickup, setAddrIsPickup] = useState(true);
  const [addrIsDelivery, setAddrIsDelivery] = useState(true);
  const [pinServiceable, setPinServiceable] = useState<string | null>(null);

  // Seller KYC state
  const [storeName, setStoreName] = useState(user?.seller_profile?.store_name || '');
  const [upiId, setUpiId] = useState(user?.seller_profile?.upi_id || '');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Edit profile state
  const [editName, setEditName] = useState(user?.full_name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAddresses();
    fetchOrders();
  }, [isAuthenticated, token]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/users/me/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePincodeCheck = async (pin: string) => {
    setAddrPincode(pin);
    if (pin.length === 6) {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/users/pincode/${pin}`);
        if (res.ok) {
          const data = await res.json();
          setAddrCity(data.city);
          setAddrState(data.state);
          setPinServiceable(data.is_pilot_zone ? 'Pilot City (Same Day / ₹40 Flat)' : 'All-India Courier Serviceable');
        } else {
          setPinServiceable('Invalid PIN code format.');
        }
      } catch {
        setPinServiceable(null);
      }
    } else {
      setPinServiceable(null);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8000/api/v1/users/me/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: addrName || user?.full_name,
          phone_number: addrPhone || user?.phone_number || '9876543210',
          address_line1: addrLine1,
          address_line2: addrLine2 || undefined,
          landmark: addrLandmark || undefined,
          city: addrCity,
          state: addrState,
          pincode: addrPincode,
          is_default: addrIsDefault,
          is_pickup_address: addrIsPickup,
          is_delivery_address: addrIsDelivery
        })
      });

      if (res.ok) {
        setShowAddressModal(false);
        fetchAddresses();
        // Reset form
        setAddrLine1('');
        setAddrLine2('');
        setAddrLandmark('');
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/me/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveProfileName = async () => {
    if (!token || !editName.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: editName.trim() })
      });
      if (res.ok) {
        setIsEditingName(false);
        refreshProfile();
      }
    } catch {
      // Ignore
    }
  };

  const handleBecomeSeller = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/users/me/become-seller', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        refreshProfile();
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveSellerKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingKyc(true);
    setKycSuccess(null);
    setKycError(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/users/me/seller/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          store_name: storeName.trim() || undefined,
          upi_id: upiId.trim() || undefined,
          bank_account_number: bankAcc.trim() || undefined,
          bank_ifsc: bankIfsc.trim().toUpperCase() || undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update payout details.');
      }
      setKycSuccess('Payout details verified successfully. Escrow funds will settle directly to this account.');
      refreshProfile();
    } catch (err: any) {
      setKycError(err.message || 'Error updating KYC details.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* User Profile Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700
              }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {isEditingName ? (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field"
                        style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                      />
                      <button onClick={handleSaveProfileName} className="btn btn-primary" style={{ padding: '6px 12px' }}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {user.full_name}
                      </h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {user.is_verified && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600
                    }}>
                      <Check size={12} /> Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                  {user.email && <span>{user.email}</span>}
                  {user.phone_number && <span>+91 {user.phone_number}</span>}
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>Role: {user.role}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* My Orders & Purchases */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Package size={22} color="var(--color-primary)" />
                <span>My Orders & Escrow Trackers</span>
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Track live courier movement, doorstep delivery confirmation, and T+3 inspection escrow release.
              </p>
            </div>
          </div>

          {loadingOrders ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading order history...</p>
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                You have not placed any book orders yet.
              </p>
              <Link to="/explore" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                Browse Verified Books
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                        Order #{order.order_number}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: order.status === 'CANCELLED' ? '#FEE2E2' : order.status === 'DELIVERED' ? '#DCFCE7' : 'var(--color-primary-subtle)',
                        color: order.status === 'CANCELLED' ? '#991B1B' : order.status === 'DELIVERED' ? '#166534' : 'var(--color-primary)',
                        textTransform: 'uppercase'
                      }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {order.items.length} {order.items.length === 1 ? 'book' : 'books'} • Total ₹{order.total_amount} • {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <Link
                    to={`/order/${order.id}`}
                    className="btn btn-secondary"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      fontSize: 'var(--text-xs)',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Track Order & Escrow</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Address Book */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
                Saved Addresses (Pickup & Delivery)
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Used for doorstep courier pickup and deliveries. Physical addresses are never publicly visible to buyers.
              </p>
            </div>
            <button
              onClick={() => setShowAddressModal(true)}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Plus size={16} />
              <span>Add Address</span>
            </button>
          </div>

          {loadingAddresses ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading address book...</p>
          ) : addresses.length === 0 ? (
            <div style={{
              padding: 'var(--space-8)',
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <MapPin size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No addresses saved yet.</p>
              <p style={{ margin: '4px 0 var(--space-4) 0', fontSize: 'var(--text-sm)' }}>
                Add your Bidar home or hostel address to buy or sell books with doorstep pickup.
              </p>
              <button onClick={() => setShowAddressModal(true)} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-sm)' }}>
                Add First Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    backgroundColor: addr.is_default ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      {addr.is_default && (
                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--color-primary)', color: 'var(--text-inverse)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          DEFAULT
                        </span>
                      )}
                      {addr.is_pickup_address && (
                        <span style={{ fontSize: '10px', fontWeight: 600, backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          PICKUP
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                      title="Delete Address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: 'var(--text-sm)' }}>{addr.full_name}</p>
                  <p style={{ margin: '0 0 2px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{addr.address_line1}</p>
                  {addr.address_line2 && <p style={{ margin: '0 0 2px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{addr.address_line2}</p>}
                  {addr.landmark && <p style={{ margin: '0 0 2px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Landmark: {addr.landmark}</p>}
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {addr.city}, {addr.state} — PIN {addr.pincode}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Phone: +91 {addr.phone_number}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller Payout & KYC Section */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
                Seller Payouts & Escrow Settlement
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                When your book is delivered, funds are placed on a 3-day inspection hold and automatically settled to your verified UPI ID or Bank Account.
              </p>
            </div>
            {user.role !== 'seller' && user.role !== 'admin' && (
              <button onClick={handleBecomeSeller} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-sm)' }}>
                Activate Seller Account
              </button>
            )}
          </div>

          {kycSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', backgroundColor: '#F0FDF4', color: '#166534', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              <CheckCircle2 size={18} />
              <span>{kycSuccess}</span>
            </div>
          )}

          {kycError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              <AlertCircle size={18} />
              <span>{kycError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSellerKYC} style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Seller Store / Bookshelf Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh's Academic Books"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                UPI ID for Instant Payouts (Preferred)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. ramesh@okaxis or mobile@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Direct bank settlement via UPI 2.0 with zero processing deductions.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Bank Account Number
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Bank Account Number"
                  value={bankAcc}
                  onChange={(e) => setBankAcc(e.target.value)}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. SBIN0001234"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingKyc}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              {submittingKyc ? 'Saving...' : 'Save Payout Details'}
            </button>
          </form>
        </div>

        {/* Add Address Modal */}
        {showAddressModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: 'var(--space-6)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-4) 0' }}>
                Add Delivery / Pickup Address
              </h2>
              <form onSubmit={handleCreateAddress}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ramesh Kulkarni"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      required
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="10-digit number"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      required
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                    House / Flat No., Building, Street
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. House No. 8-4-12, Near Shivaji Chowk"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    required
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Locality / Colony
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Gandhi Gunj / Naubad"
                      value={addrLine2}
                      onChange={(e) => setAddrLine2(e.target.value)}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Near Govt Hospital"
                      value={addrLandmark}
                      onChange={(e) => setAddrLandmark(e.target.value)}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      6-Digit PIN Code
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="585401"
                      value={addrPincode}
                      onChange={(e) => handlePincodeCheck(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      required
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                      required
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>

                {pinServiceable && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, margin: '0 0 var(--space-3) 0' }}>
                    {pinServiceable}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-4)', margin: 'var(--space-4) 0', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                    />
                    Set as Default
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsPickup}
                      onChange={(e) => setAddrIsPickup(e.target.checked)}
                    />
                    Enable for Pickup
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsDelivery}
                      onChange={(e) => setAddrIsDelivery(e.target.checked)}
                    />
                    Enable for Delivery
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="btn btn-secondary"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
