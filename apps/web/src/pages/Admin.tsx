import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Truck, AlertTriangle, Settings, Users,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw,
  ArrowUpRight, DollarSign, Package, AlertCircle, Eye,
  Lock, ExternalLink, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface PlatformOverview {
  total_gmv: number;
  total_orders: number;
  orders_by_status: Record<string, number>;
  total_users: number;
  buyers_count: number;
  sellers_count: number;
  active_listings_count: number;
  catalogue_titles_count: number;
  escrow_liability_balance: number;
  total_platform_revenue: number;
  total_gst_collected: number;
  pending_disputes_count: number;
}

interface ListingItem {
  id: string;
  custom_title: string;
  custom_authors?: string;
  asking_price: number;
  condition_grade: string;
  missing_pages_defect: boolean;
  has_annotations_highlighting: boolean;
  defect_description?: string;
  status: string;
  created_at?: string;
  seller_id: string;
  book_catalogue?: {
    title: string;
    authors?: string;
    original_mrp?: number;
    isbn_13?: string;
    cover_image_url?: string;
  };
  images?: { image_url: string; is_primary: boolean }[];
}

interface OrderItemData {
  id: string;
  order_number: string;
  total_amount: number;
  total_books_amount: number;
  delivery_fee: number;
  platform_commission: number;
  tax_amount: number;
  status: string;
  created_at: string;
  buyer_id: string;
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
    listing?: {
      id: string;
      custom_title?: string;
      asking_price?: number;
      book_catalogue?: {
        title: string;
        cover_image_url?: string;
      };
    };
  }[];
}

interface UserItem {
  id: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  seller_profile?: {
    store_name?: string;
    kyc_status: string;
    upi_id?: string;
    rating_average?: number;
  };
}

interface SystemSettingItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  is_public: boolean;
}

export const Admin: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Active admin tab: 'overview' | 'listings' | 'orders' | 'disputes' | 'settings' | 'users'
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'orders' | 'disputes' | 'settings' | 'users'>('overview');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [orders, setOrders] = useState<OrderItemData[]>([]);
  const [disputes, setDisputes] = useState<OrderItemData[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  // Filters
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings form
  const [commissionRate, setCommissionRate] = useState<string>('10');
  const [gstRate, setGstRate] = useState<string>('18');
  const [localShipping, setLocalShipping] = useState<string>('40');
  const [courierShipping, setCourierShipping] = useState<string>('70');
  const [pincodesInput, setPincodesInput] = useState<string>('585401, 585402, 585403, 585404');

  // Authorization Check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin');
      return;
    }
    if (user && user.role !== 'admin') {
      // Not an admin
      setLoading(false);
    } else if (token) {
      fetchAdminData();
    }
  }, [isAuthenticated, user, token, activeTab]);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);

    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'overview') {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/overview`, { headers });
        if (res.ok) setOverview(await res.json());
      } else if (activeTab === 'listings') {
        const url = listingStatusFilter === 'all'
          ? `${API_BASE_URL}/api/v1/admin/moderation/listings`
          : `${API_BASE_URL}/api/v1/admin/moderation/listings?status_filter=${listingStatusFilter}`;
        const res = await fetch(url, { headers });
        if (res.ok) setListings(await res.json());
      } else if (activeTab === 'orders') {
        const url = orderStatusFilter === 'all'
          ? `${API_BASE_URL}/api/v1/admin/orders`
          : `${API_BASE_URL}/api/v1/admin/orders?status_filter=${orderStatusFilter}`;
        const res = await fetch(url, { headers });
        if (res.ok) setOrders(await res.json());
      } else if (activeTab === 'disputes') {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/disputes`, { headers });
        if (res.ok) setDisputes(await res.json());
      } else if (activeTab === 'settings') {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, { headers });
        if (res.ok) {
          const data: SystemSettingItem[] = await res.json();
          data.forEach(s => {
            if (s.key === 'commission_percent') setCommissionRate(s.value);
            if (s.key === 'gst_percent') setGstRate(s.value);
            if (s.key === 'intracity_shipping_flat') setLocalShipping(s.value);
            if (s.key === 'intercity_shipping_base') setCourierShipping(s.value);
            if (s.key === 'launch_pincodes') setPincodesInput(s.value);
          });
        }
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_BASE_URL}/api/v1/admin/users?limit=100`, { headers });
        if (res.ok) setUsersList(await res.json());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch admin data from server.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Listing Moderation Action
  const handleModerateListing = async (listingId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND', notes?: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/moderation/listings/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, moderation_notes: notes || `Action ${action} by Admin` })
      });
      if (res.ok) {
        showToast(`Listing ${listingId} ${action.toLowerCase()}d successfully.`);
        fetchAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Could not moderate listing.');
      }
    } catch {
      setErrorMsg('Network error while moderating listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Order Lifecycle Status Update Action
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, notes: `Status manually updated to ${newStatus}` })
      });
      if (res.ok) {
        showToast(`Order status updated to ${newStatus}.`);
        fetchAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to update order status.');
      }
    } catch {
      setErrorMsg('Network error updating order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Dispute Adjudication Action
  const handleAdjudicateDispute = async (orderId: string, decision: 'REFUND_BUYER' | 'RELEASE_TO_SELLER', notes: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/disputes/${orderId}/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, resolution_notes: notes })
      });
      if (res.ok) {
        showToast(`Dispute resolved: ${decision === 'REFUND_BUYER' ? 'Refunded Buyer' : 'Payout Released to Seller'}.`);
        fetchAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Could not adjudicate dispute.');
      }
    } catch {
      setErrorMsg('Network error resolving dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // User Status & KYC Update Action
  const handleUpdateUser = async (userId: string, updates: { is_active?: boolean; role?: string; kyc_status?: string }) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        showToast('User record updated successfully.');
        fetchAdminData();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to update user.');
      }
    } catch {
      setErrorMsg('Network error updating user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save System Settings Action
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);

    const payload = [
      { key: 'commission_percent', value: commissionRate, description: 'Marketplace platform commission percentage', is_public: true },
      { key: 'gst_percent', value: gstRate, description: 'GST on platform service commission', is_public: true },
      { key: 'intracity_shipping_flat', value: localShipping, description: 'Flat shipping fee within Bidar pilot zone', is_public: true },
      { key: 'intercity_shipping_base', value: courierShipping, description: 'Standard intercity courier base shipping', is_public: true },
      { key: 'launch_pincodes', value: pincodesInput, description: 'Serviceable same-day pilot pincodes list', is_public: true }
    ];

    try {
      for (const item of payload) {
        await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(item)
        });
      }
      showToast('Marketplace settings updated successfully.');
      fetchAdminData();
    } catch {
      setErrorMsg('Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // Blocked View for Non-Admins
  if (!loading && user && user.role !== 'admin') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Admin Access Required
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 'var(--space-6)' }}>
            This portal is restricted to BookLoop administrators. Your current account (<strong>{user.full_name}</strong>) has role <code>{user.role}</code>.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/" className="btn btn-secondary">Return Home</Link>
            <Link to="/profile" className="btn btn-primary">My Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 64px)', padding: 'var(--space-6) 0' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>

        {/* Portal Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
              <span style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--text-inverse)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                Master Console
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Pilot Zone: <strong>Bidar, Karnataka</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              BookLoop Administration & Governance
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => fetchAdminData()}
              disabled={loading || actionLoading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              View Storefront <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Alerts / Notifications */}
        {successMsg && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

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
            { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
            { id: 'listings', label: 'Listings & Moderation', icon: BookOpen },
            { id: 'orders', label: 'Orders & Logistics', icon: Truck },
            { id: 'disputes', label: 'Disputes & Escrow', icon: AlertTriangle },
            { id: 'users', label: 'Users & KYC', icon: Users },
            { id: 'settings', label: 'Platform Settings', icon: Settings },
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
                  fontWeight: isCurrent ? 600 : 500,
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
        {/* TAB 1: OVERVIEW COMMAND CENTER                           */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div>
            {loading && !overview ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading platform performance analytics...
              </div>
            ) : overview ? (
              <>
                {/* Metric Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-6)'
                }}>
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>Gross Merchandise Volume (GMV)</span>
                      <DollarSign size={18} color="var(--color-primary)" />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                      ₹{overview.total_gmv.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Across {overview.total_orders} total orders
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>Platform Net Commission</span>
                      <ShieldCheck size={18} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>
                      ₹{overview.total_platform_revenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      + ₹{overview.total_gst_collected} GST collected
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>Escrow Liability Balance</span>
                      <Lock size={18} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#d97706' }}>
                      ₹{overview.escrow_liability_balance.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Held safely during 3-day return window
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>Active Book Inventory</span>
                      <BookOpen size={18} color="#6366f1" />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#4f46e5' }}>
                      {overview.active_listings_count}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {overview.catalogue_titles_count} verified titles catalogued
                    </div>
                  </div>
                </div>

                {/* Status Breakdown & Quick Action Rows */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-5)' }}>
                  
                  {/* Order Stages Breakdown */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                      Order Lifecycle Distribution
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.entries(overview.orders_by_status).map(([st, cnt]) => (
                        <div key={st} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontSize: '0.9rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                            {st.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cnt}</span>
                        </div>
                      ))}
                      {Object.keys(overview.orders_by_status).length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders placed yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Registered Users & Escrow Health */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                      Marketplace Participants
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Total Accounts</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered students & general readers</div>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{overview.total_users}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Active Sellers</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>With verified pickup locations</div>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{overview.sellers_count}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Open Disputes</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Returns awaiting admin decision</div>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: overview.pending_disputes_count > 0 ? '#dc2626' : '#10b981' }}>
                          {overview.pending_disputes_count}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LISTINGS & MODERATION                             */}
        {/* ======================================================== */}
        {activeTab === 'listings' && (
          <div>
            {/* Filter Sub-bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'active', 'pending_moderation', 'rejected', 'paused'].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setListingStatusFilter(st); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: listingStatusFilter === st ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: listingStatusFilter === st ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                      color: listingStatusFilter === st ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {listings.length} listings
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading listings from database...
              </div>
            ) : listings.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
              }}>
                <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h3>No listings found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No listings matched the filter "{listingStatusFilter}".</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {listings.map((item) => {
                  const cover = item.images?.[0]?.image_url || item.book_catalogue?.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300';
                  const title = item.custom_title || item.book_catalogue?.title || 'Untitled Book';
                  const authors = item.custom_authors || item.book_catalogue?.authors || 'Unknown';
                  const mrp = item.book_catalogue?.original_mrp;
                  const discountPct = mrp ? Math.round(((mrp - item.asking_price) / mrp) * 100) : null;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--space-4)',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Book Thumbnail & Info */}
                      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', minWidth: '280px', flex: 1 }}>
                        <img
                          src={cover}
                          alt={title}
                          style={{
                            width: '56px',
                            height: '76px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: item.status === 'active' ? '#ecfdf5' : '#fef2f2',
                              color: item.status === 'active' ? '#065f46' : '#991b1b'
                            }}>
                              {item.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            by {authors} • Condition: <strong>{item.condition_grade?.replace('_', ' ')}</strong>
                          </div>
                          {item.defect_description && (
                            <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px' }}>
                              ⚠️ Defect: {item.defect_description}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Listing ID: <code>{item.id}</code> • Seller: <code>{item.seller_id.slice(0, 8)}...</code>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₹{item.asking_price}
                        </div>
                        {mrp && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            MRP <del>₹{mrp}</del> ({discountPct}% OFF)
                          </div>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {item.status !== 'active' && (
                          <button
                            onClick={() => handleModerateListing(item.id, 'APPROVE')}
                            disabled={actionLoading}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                          >
                            <CheckCircle2 size={15} /> Approve
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerateListing(item.id, 'REJECT')}
                            disabled={actionLoading}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.85rem',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        )}
                        {item.status === 'active' && (
                          <button
                            onClick={() => handleModerateListing(item.id, 'SUSPEND')}
                            disabled={actionLoading}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.85rem',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer'
                            }}
                          >
                            Pause
                          </button>
                        )}
                        <Link
                          to={`/book/${item.id}`}
                          target="_blank"
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Eye size={15} />
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ORDERS & LOGISTICS DESK                           */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Sub-bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['all', 'payment_confirmed', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setOrderStatusFilter(st); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: orderStatusFilter === st ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: orderStatusFilter === st ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                      color: orderStatusFilter === st ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {st.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total Orders: {orders.length}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
              }}>
                <Package size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h3>No orders found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders in status "{orderStatusFilter}".</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-5)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ord.order_number}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: ord.status === 'completed' ? '#ecfdf5' : '#fef3c7',
                            color: ord.status === 'completed' ? '#065f46' : '#92400e'
                          }}>
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Placed on: {new Date(ord.created_at).toLocaleString()} • Order ID: <code>{ord.id}</code>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₹{ord.total_amount}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Books: ₹{ord.total_books_amount} + Delivery: ₹{ord.delivery_fee}
                        </div>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', margin: '14px 0' }}>
                      {/* Destination Address */}
                      <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                          📍 Delivery Destination
                        </div>
                        {ord.delivery_address ? (
                          <>
                            <div>{ord.delivery_address.full_name} ({ord.delivery_address.phone_number})</div>
                            <div style={{ color: 'var(--text-muted)' }}>{ord.delivery_address.address_line1}, {ord.delivery_address.city}, {ord.delivery_address.state} - <strong>{ord.delivery_address.pincode}</strong></div>
                          </>
                        ) : (
                          <div style={{ color: 'var(--text-muted)' }}>Address ID: {ord.buyer_id}</div>
                        )}
                      </div>

                      {/* Items */}
                      <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                          📚 Items ({ord.items?.length || 0})
                        </div>
                        {ord.items?.map((it) => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>{it.listing?.custom_title || it.listing?.book_catalogue?.title || 'Book Listing'}</span>
                            <strong>₹{it.price}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Status Lifecycle Advancement Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Platform Commission: <strong>₹{ord.platform_commission}</strong> • GST: <strong>₹{ord.tax_amount}</strong>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Advance State:</span>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          disabled={actionLoading}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem',
                            backgroundColor: 'var(--bg-surface)',
                            fontWeight: 600
                          }}
                        >
                          <option value="payment_confirmed">Payment Confirmed</option>
                          <option value="awaiting_seller_confirmation">Awaiting Seller Confirmation</option>
                          <option value="pickup_scheduled">Pickup Scheduled</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="completed">Completed (Release Payout)</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <Link
                          to={`/order/${ord.id}`}
                          target="_blank"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          Details <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DISPUTES & ESCROW ADJUDICATION                    */}
        {/* ======================================================== */}
        {activeTab === 'disputes' && (
          <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Open Dispute Adjudication</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Review disputed orders where buyers reported condition discrepancies or missing books during the 3-day escrow period.
              </p>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading dispute records...
              </div>
            ) : disputes.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8)',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
              }}>
                <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <h3>No Pending Disputes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  All orders are operating cleanly with zero open buyer disputes or escrow locks.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {disputes.map((dsp) => (
                  <div
                    key={dsp.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-5)',
                      border: '1px solid #fecaca',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#b91c1c' }}>
                          ⚠️ Dispute on Order #{dsp.order_number}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Order ID: <code>{dsp.id}</code> • Status: <strong>{dsp.status}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>₹{dsp.total_amount}</div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Buyer requested return or disputed book condition upon delivery. As admin referee, review evidence and decide escrow payout.
                    </p>

                    {/* Adjudication Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter resolution notes for Buyer Refund:', 'Condition does not match description. Refunding buyer and returning book.');
                          if (notes) handleAdjudicateDispute(dsp.id, 'REFUND_BUYER', notes);
                        }}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Refund Buyer (100% Escrow Return)
                      </button>

                      <button
                        onClick={() => {
                          const notes = prompt('Enter resolution notes for Seller Settlement:', 'Inspected condition details match listing disclosure. Releasing escrow payout.');
                          if (notes) handleAdjudicateDispute(dsp.id, 'RELEASE_TO_SELLER', notes);
                        }}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Dismiss Dispute & Pay Seller
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: USERS & KYC GOVERNANCE                            */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Participant & Seller KYC Registry</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage account status, verify seller UPI/bank accounts, and enforce safety policies.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search user by name, phone or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  minWidth: '260px'
                }}
              />
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading user directory...
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                overflowX: 'auto',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>User / Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Contact Info</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Account Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>KYC / Store Details</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList
                      .filter(u => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          u.full_name?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.phone_number?.includes(q)
                        );
                      })
                      .map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: <code>{u.id.slice(0, 8)}</code></div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div>{u.phone_number || 'No phone'}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{u.email || 'No email'}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: u.role === 'admin' ? '#ede9fe' : u.role === 'seller' ? '#e0f2fe' : 'var(--bg-subtle)',
                              color: u.role === 'admin' ? '#6b21a8' : u.role === 'seller' ? '#0369a1' : 'var(--text-secondary)'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: u.is_active ? '#ecfdf5' : '#fef2f2',
                              color: u.is_active ? '#065f46' : '#991b1b'
                            }}>
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {u.seller_profile ? (
                              <div>
                                <div><strong>{u.seller_profile.store_name || 'Store'}</strong></div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  UPI: <code>{u.seller_profile.upi_id || 'Not set'}</code> • KYC: <strong>{u.seller_profile.kyc_status}</strong>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Buyer only</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {u.seller_profile && u.seller_profile.kyc_status !== 'verified' && (
                                <button
                                  onClick={() => handleUpdateUser(u.id, { kyc_status: 'verified' })}
                                  disabled={actionLoading}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  Verify KYC
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                                disabled={actionLoading}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: u.is_active ? '#fee2e2' : '#ecfdf5',
                                  color: u.is_active ? '#991b1b' : '#065f46',
                                  cursor: 'pointer'
                                }}
                              >
                                {u.is_active ? 'Ban' : 'Unban'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DYNAMIC PLATFORM SETTINGS                         */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Dynamic Marketplace Configuration</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Adjust commissions, courier fees, and Bidar pilot pincodes on the fly without server redeploys.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Marketplace Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: 10% deducted from seller earnings</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Commission GST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Indian GST on platform commission (18%)</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Bidar Intracity Flat Delivery (₹)
                  </label>
                  <input
                    type="number"
                    value={localShipping}
                    onChange={(e) => setLocalShipping(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Charged on orders delivered within Bidar (Default: ₹40)</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Intercity Courier Base Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={courierShipping}
                    onChange={(e) => setCourierShipping(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>India Post / Courier base fee outside Bidar (Default: ₹70)</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Pilot City Serviceable Pincodes
                </label>
                <input
                  type="text"
                  value={pincodesInput}
                  onChange={(e) => setPincodesInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Comma-separated list (e.g. <code>585401, 585402, 585403, 585404</code>)
                </span>
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  {actionLoading ? 'Saving...' : 'Save All Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
