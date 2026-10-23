import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  MapPin, Plus, Trash2, CheckCircle2, AlertCircle, LogOut, Check,
  Package, ExternalLink, BookOpen, Truck, Wallet,
  Pause, Play, ShieldCheck, PlusCircle
} from 'lucide-react';
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

interface SellerListing {
  id: string;
  custom_title?: string;
  custom_authors?: string;
  asking_price: number;
  condition_grade: string;
  status: string;
  missing_pages_defect: boolean;
  defect_description?: string;
  pickup_address_id?: string;
  created_at?: string;
  book_catalogue?: {
    title: string;
    authors?: string;
    original_mrp?: number;
    cover_image_url?: string;
  };
  images?: { image_url: string; is_primary: boolean }[];
}

interface SellerOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  delivery_address?: {
    full_name: string;
    phone_number: string;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items?: {
    id: string;
    price: number;
    commission_amount: number;
    seller_payout_amount: number;
    listing?: {
      id: string;
      custom_title?: string;
      book_catalogue?: {
        title: string;
        cover_image_url?: string;
      };
    };
  }[];
}

interface SellerEarnings {
  total_books_sold: number;
  gross_sales_amount: number;
  total_commission_deducted: number;
  total_gst_deducted: number;
  net_earnings: number;
  pending_escrow_amount: number;
  settled_payout_amount: number;
  upi_id?: string;
  kyc_status: string;
}

export const Profile: React.FC = () => {
  const { user, token, isAuthenticated, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Main Tabs: 'purchases' | 'seller_hub' | 'addresses' | 'kyc'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'purchases' | 'seller_hub' | 'addresses' | 'kyc'>(
    tabParam === 'seller' ? 'seller_hub' : tabParam === 'addresses' ? 'addresses' : 'purchases'
  );

  // Seller Hub subtabs: 'listings' | 'orders_to_ship' | 'payouts'
  const [sellerSubTab, setSellerSubTab] = useState<'listings' | 'orders_to_ship' | 'payouts'>('listings');

  // Addresses state
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

  // Buyer Orders state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Seller Hub states
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(false);
  const [sellerEarnings, setSellerEarnings] = useState<SellerEarnings | null>(null);

  // Inline editing price for seller listing
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');

  // Seller KYC state
  const [storeName, setStoreName] = useState(user?.seller_profile?.store_name || '');
  const [upiId, setUpiId] = useState(user?.seller_profile?.upi_id || '');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState(user?.full_name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAddresses();
    fetchOrders();
    fetchSellerData();
  }, [isAuthenticated, token]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
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
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      } else if (res.status === 401 || res.status === 404) {
        logout();
        navigate('/login?redirect=/profile');
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchSellerData = async () => {
    if (!token) return;
    setLoadingListings(true);
    setLoadingSellerOrders(true);

    try {
      // 1. My Listings
      const listingsRes = await fetch(`${API_BASE_URL}/api/v1/listings/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listingsRes.ok) {
        setSellerListings(await listingsRes.json());
      }

      // 2. Orders to ship
      const ordersRes = await fetch(`${API_BASE_URL}/api/v1/orders/seller/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        setSellerOrders(await ordersRes.json());
      }

      // 3. Earnings summary
      const earningsRes = await fetch(`${API_BASE_URL}/api/v1/orders/seller/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (earningsRes.ok) {
        setSellerEarnings(await earningsRes.json());
      }
    } catch {
      // Ignore
    } finally {
      setLoadingListings(false);
      setLoadingSellerOrders(false);
    }
  };

  // Seller Action: Toggle Pause / Resume listing
  const handleToggleListingStatus = async (listing: SellerListing) => {
    if (!token) return;
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Listing ${newStatus === 'active' ? 'resumed' : 'paused'}.`);
        fetchSellerData();
      }
    } catch {
      showToast('Failed to update listing status.');
    }
  };

  // Seller Action: Update Price
  const handleSaveListingPrice = async (listingId: string) => {
    if (!token || !newPrice) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asking_price: priceNum })
      });
      if (res.ok) {
        showToast('Listing price updated.');
        setEditingListingId(null);
        setNewPrice('');
        fetchSellerData();
      }
    } catch {
      showToast('Failed to update price.');
    }
  };

  // Seller Action: Delete listing
  const handleDeleteListing = async (listingId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this book listing?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/listings/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Listing removed from marketplace.');
        fetchSellerData();
      }
    } catch {
      showToast('Failed to delete listing.');
    }
  };

  // Seller Action: Confirm Book Packed & Ready for Pickup
  const handleConfirmDispatch = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/confirm-dispatch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Order confirmed! Courier pickup has been scheduled.');
        fetchSellerData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not update dispatch status.');
      }
    } catch {
      alert('Network error confirming dispatch.');
    }
  };

  const handlePincodeCheck = async (pin: string) => {
    setAddrPincode(pin);
    if (pin.length === 6) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/users/pincode/${pin}`);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: addrName || user?.full_name,
          phone_number: addrPhone || user?.phone_number || '9108950128',
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
        showToast('Address saved successfully.');
      } else if (res.status === 401 || res.status === 404) {
        logout();
        navigate('/login?redirect=/profile');
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save address.');
      }
    } catch {
      alert('Network error while saving address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAddresses();
        showToast('Address deleted.');
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveProfileName = async () => {
    if (!token || !editName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
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
        showToast('Profile name updated.');
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
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/seller/kyc`, {
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
      fetchSellerData();
      showToast('Seller KYC details verified.');
    } catch (err: any) {
      setKycError(err.message || 'Error updating KYC details.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-6) 0' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'var(--color-primary)',
            color: 'var(--text-inverse)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* User Profile Header Card */}
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
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
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
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      <Check size={12} /> Verified
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span style={{
                      backgroundColor: '#ede9fe',
                      color: '#6b21a8',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Admin
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px', flexWrap: 'wrap' }}>
                  {user.email && <span>{user.email}</span>}
                  {user.phone_number && <span>+91 {user.phone_number}</span>}
                  <span>Account ID: <code>{user.id.slice(0, 8)}...</code></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-secondary" style={{ backgroundColor: '#ede9fe', color: '#6b21a8', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-sm)', gap: '6px' }}>
                  <ShieldCheck size={15} />
                  <span>Admin Console</span>
                </Link>
              )}
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
        </div>

        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'purchases', label: `My Purchases (${orders.length})`, icon: Package },
            { id: 'seller_hub', label: `Seller Hub (${sellerListings.length} books)`, icon: BookOpen },
            { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: 'kyc', label: 'Payout Details & KYC', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: isCurrent ? '1px solid var(--color-primary)' : '1px solid transparent',
                  backgroundColor: isCurrent ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: isCurrent ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: BUYER PURCHASES                                   */}
        {/* ======================================================== */}
        {activeTab === 'purchases' && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Package size={22} color="var(--color-primary)" />
                  <span>Purchases & Doorstep Delivery Trackers</span>
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Track live courier movement, delivery confirmation, and T+3 inspection escrow release.
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
                          backgroundColor: order.status === 'cancelled' ? '#FEE2E2' : order.status === 'delivered' ? '#DCFCE7' : 'var(--color-primary-subtle)',
                          color: order.status === 'cancelled' ? '#991B1B' : order.status === 'delivered' ? '#166534' : 'var(--color-primary)',
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
                      <span>Track Order</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SELLER HUB (INVENTORY, ORDERS TO SHIP, EARNINGS) */}
        {/* ======================================================== */}
        {activeTab === 'seller_hub' && (
          <div>
            {/* Earnings Summary Dashboard Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-5)'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Book Sales</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{sellerEarnings?.gross_sales_amount.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sellerEarnings?.total_books_sold || 0} books sold</div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-surface)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Earnings (Post-Fee)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  ₹{sellerEarnings?.net_earnings.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10% Platform fee deducted</div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-surface)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Escrow Hold</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  ₹{sellerEarnings?.pending_escrow_amount.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>3-day buyer inspection lock</div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-surface)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Settled to Bank/UPI</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                  ₹{sellerEarnings?.settled_payout_amount.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPI: {sellerEarnings?.upi_id || 'Not set'}</div>
              </div>
            </div>

            {/* Seller Hub Sub-Tabs & Action Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setSellerSubTab('listings')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: sellerSubTab === 'listings' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: sellerSubTab === 'listings' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    color: sellerSubTab === 'listings' ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  My Listed Books ({sellerListings.length})
                </button>
                <button
                  onClick={() => setSellerSubTab('orders_to_ship')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: sellerSubTab === 'orders_to_ship' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: sellerSubTab === 'orders_to_ship' ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    color: sellerSubTab === 'orders_to_ship' ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Sold Orders to Ship ({sellerOrders.length})
                </button>
              </div>

              <Link to="/sell" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}>
                <PlusCircle size={16} />
                <span>+ List a Book for Sale</span>
              </Link>
            </div>

            {/* SUBTAB 1: MY LISTED BOOKS */}
            {sellerSubTab === 'listings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {loadingListings ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your book listings...</p>
                ) : sellerListings.length === 0 ? (
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>No books listed yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                      Have old textbooks from engineering, UPSC, or school? Turn them into cash with doorstep pickup!
                    </p>
                    <Link to="/sell" className="btn btn-primary" style={{ display: 'inline-flex', gap: '6px' }}>
                      <PlusCircle size={16} /> List Your First Book
                    </Link>
                  </div>
                ) : (
                  sellerListings.map((item) => {
                    const cover = item.images?.[0]?.image_url || item.book_catalogue?.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300';
                    const title = item.custom_title || item.book_catalogue?.title || 'Untitled Book';
                    const authors = item.custom_authors || item.book_catalogue?.authors || 'Unknown';
                    const isEditing = editingListingId === item.id;

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border-subtle)',
                          padding: 'var(--space-4)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {/* Book details */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flex: 1, minWidth: '260px' }}>
                          <img
                            src={cover}
                            alt={title}
                            style={{
                              width: '50px',
                              height: '68px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: item.status === 'active' ? '#ecfdf5' : item.status === 'sold' ? '#e0f2fe' : '#fef3c7',
                                color: item.status === 'active' ? '#065f46' : item.status === 'sold' ? '#0369a1' : '#92400e'
                              }}>
                                {item.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              by {authors} • Condition: <strong>{item.condition_grade.replace('_', ' ')}</strong>
                            </div>
                            {item.defect_description && (
                              <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                                Note: {item.defect_description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Asking price & inline edit */}
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <span>₹</span>
                              <input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                style={{ width: '80px', padding: '4px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
                              />
                              <button onClick={() => handleSaveListingPrice(item.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Save
                              </button>
                              <button onClick={() => setEditingListingId(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                ₹{item.asking_price}
                              </div>
                              <button
                                onClick={() => { setEditingListingId(item.id); setNewPrice(item.asking_price.toString()); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Edit Price
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {item.status !== 'sold' && (
                            <button
                              onClick={() => handleToggleListingStatus(item)}
                              title={item.status === 'active' ? 'Pause Listing' : 'Resume Listing'}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-subtle)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {item.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteListing(item.id)}
                            title="Delete Listing"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>

                          <Link
                            to={`/book/${item.id}`}
                            target="_blank"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SUBTAB 2: ORDERS TO SHIP */}
            {sellerSubTab === 'orders_to_ship' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {loadingSellerOrders ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading sales...</p>
                ) : sellerOrders.length === 0 ? (
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <Truck size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>No orders to dispatch yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      When a reader orders one of your books, the order will appear here with courier pickup details.
                    </p>
                  </div>
                ) : (
                  sellerOrders.map((ord) => {
                    const isAwaitingDispatch = ord.status === 'payment_confirmed' || ord.status === 'awaiting_seller_confirmation';

                    return (
                      <div
                        key={ord.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border-subtle)',
                          padding: 'var(--space-5)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Order #{ord.order_number}</span>
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: ord.status === 'completed' ? '#ecfdf5' : '#fef3c7',
                              color: ord.status === 'completed' ? '#065f46' : '#92400e'
                            }}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Ordered on {new Date(ord.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                              ₹{ord.total_amount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Buyer Payment Confirmed</div>
                          </div>
                        </div>

                        {/* Destination & Items */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)', marginBottom: '12px' }}>
                          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              📍 Deliver To (Buyer)
                            </div>
                            {ord.delivery_address ? (
                              <div>
                                {ord.delivery_address.full_name} • {ord.delivery_address.city}, {ord.delivery_address.state} (<strong>{ord.delivery_address.pincode}</strong>)
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)' }}>Address ID on record</div>
                            )}
                          </div>

                          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              📚 Books in Order
                            </div>
                            {ord.items?.map((it) => (
                              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{it.listing?.custom_title || it.listing?.book_catalogue?.title || 'Book'}</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>+₹{it.seller_payout_amount} Payout</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Action */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {isAwaitingDispatch
                              ? '👉 Please pack the book securely with clean paper or bubble wrap.'
                              : 'Courier rider will collect package from your registered address.'}
                          </span>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isAwaitingDispatch && (
                              <button
                                onClick={() => handleConfirmDispatch(ord.id)}
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '0.85rem', gap: '6px' }}
                              >
                                <CheckCircle2 size={15} />
                                <span>Confirm & Ready for Pickup</span>
                              </button>
                            )}
                            <Link to={`/order/${ord.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              Tracking <ExternalLink size={13} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SAVED ADDRESSES                                   */}
        {/* ======================================================== */}
        {activeTab === 'addresses' && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <MapPin size={22} color="var(--color-primary)" />
                  <span>Saved Addresses & Pickup Points</span>
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Manage addresses used for book doorstep delivery and seller courier pickups.
                </p>
              </div>

              <button
                onClick={() => setShowAddressModal(true)}
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-8) var(--space-4)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No saved addresses found. Add an address to start buying or selling books.
                </p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  Add Your Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      border: addr.is_default ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-surface)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{addr.full_name}</span>
                        {addr.is_default && (
                          <span style={{
                            backgroundColor: 'var(--color-primary-subtle)',
                            color: 'var(--color-primary)',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {addr.phone_number}
                      </p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {addr.address_line1}
                        {addr.address_line2 && `, ${addr.address_line2}`}
                        {addr.landmark && ` (Near ${addr.landmark})`}
                        <br />
                        {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: 'var(--text-xs)'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PAYOUT DETAILS & SELLER KYC                       */}
        {/* ======================================================== */}
        {activeTab === 'kyc' && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-2) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Wallet size={22} color="var(--color-primary)" />
              <span>Seller Payout Account & KYC</span>
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4) 0' }}>
              Enter your UPI ID or Bank account details. When your sold books pass the 3-day return window, sales revenue settles automatically.
            </p>

            {kycSuccess && (
              <div style={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <CheckCircle2 size={16} />
                <span>{kycSuccess}</span>
              </div>
            )}

            {kycError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <AlertCircle size={16} />
                <span>{kycError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSellerKYC} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                  Store / Bookshelf Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Shiva's Engineering & UPSC Resale"
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                  UPI ID for Direct Payouts (Instant Settlement)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okhdfcbank or yourphone@paytm"
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Payouts will be sent directly via UPI Auto-Disbursement upon order completion.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                    Bank Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankAcc}
                    onChange={(e) => setBankAcc(e.target.value)}
                    placeholder="e.g. 50100412345678"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                    Bank IFSC Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    placeholder="e.g. HDFC0000123"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: 'var(--text-sm)' }}
                >
                  {submittingKyc ? 'Verifying...' : 'Save & Verify Payout Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Address */}
        {showAddressModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              padding: 'var(--space-6)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add Delivery / Pickup Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 'var(--text-lg)', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Contact Name</label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder="Full name"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>House / Flat No., Building, Street</label>
                  <input
                    type="text"
                    required
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    placeholder="e.g. Plot 42, GNDEC Campus Road"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Locality / Colony</label>
                  <input
                    type="text"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    placeholder="e.g. Naubad or Gandhi Gunj"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="e.g. Near Gurudwara Gate"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>6-Digit PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addrPincode}
                    onChange={(e) => handlePincodeCheck(e.target.value)}
                    placeholder="585401"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                  />
                  {pinServiceable && (
                    <span style={{ fontSize: '11px', color: pinServiceable.includes('Pilot') ? '#15803D' : 'var(--color-primary)' }}>
                      {pinServiceable}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>City</label>
                    <input
                      type="text"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>State</label>
                    <input
                      type="text"
                      required
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                    />
                    <span>Set as primary default address</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsPickup}
                      onChange={(e) => setAddrIsPickup(e.target.checked)}
                    />
                    <span>Seller pickup address (for courier book pickups)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addrIsDelivery}
                      onChange={(e) => setAddrIsDelivery(e.target.checked)}
                    />
                    <span>Buyer delivery address (for incoming book orders)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="btn btn-secondary"
                    style={{ borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 'var(--text-sm)' }}
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

export default Profile;
