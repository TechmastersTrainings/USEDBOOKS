import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package, CheckCircle2, ShieldCheck,
  AlertTriangle, ArrowLeft, RefreshCw, XCircle, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface OrderItem {
  id: string;
  order_id: string;
  listing_id: string;
  price: number;
  commission_amount: number;
  seller_payout_amount: number;
  listing?: {
    id: string;
    title: string;
    authors: string;
    cover_image_url?: string;
    condition_grade: string;
    defects?: string[];
    seller?: {
      id: string;
      full_name: string;
      seller_profile?: {
        store_name?: string;
      };
    };
  };
}

interface OrderData {
  id: string;
  order_number: string;
  buyer_id: string;
  delivery_address_id: string;
  total_books_amount: number;
  delivery_fee: number;
  platform_commission: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  cancellation_reason?: string;
  created_at: string;
  items: OrderItem[];
  delivery_address?: {
    full_name: string;
    phone_number: string;
    address_line1: string;
    address_line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const ORDER_STEPS = [
  { key: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed & Escrow Locked' },
  { key: 'AWAITING_SELLER_CONFIRMATION', label: 'Seller Packed & Ready' },
  { key: 'PICKED_UP', label: 'Picked Up by Courier' },
  { key: 'IN_TRANSIT', label: 'Out for Doorstep Delivery' },
  { key: 'DELIVERED', label: 'Delivered (T+3 Inspection Window Active)' },
  { key: 'COMPLETED', label: 'Funds Released to Seller' }
];

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal/action
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Dispute modal/action
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeReason, setDisputeReason] = useState<string>('');
  const [disputing, setDisputing] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated, token]);

  const fetchOrder = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: OrderData = await res.json();
        setOrder(data);
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to load order details');
      }
    } catch {
      setError('Network error while loading order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !cancelReason.trim()) return;

    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason.trim() })
      });
      if (res.ok) {
        setShowCancelModal(false);
        fetchOrder();
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not cancel order');
      }
    } catch {
      alert('Error communicating with cancellation service');
    } finally {
      setCancelling(false);
    }
  };

  const handleDisputeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !disputeReason.trim()) return;

    setDisputing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: disputeReason.trim(), evidence_photo_urls: [] })
      });
      if (res.ok) {
        setShowDisputeModal(false);
        fetchOrder();
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not file return dispute');
      }
    } catch {
      alert('Error submitting inspection dispute');
    } finally {
      setDisputing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <AlertTriangle size={48} color="#DC2626" style={{ margin: '0 auto var(--space-3)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>Order Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error || 'Unable to locate this order. Please verify order ID.'}
          </p>
          <Link to="/explore" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  // Determine current step index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return -1;
      case 'PAYMENT_CONFIRMED': return 0;
      case 'AWAITING_SELLER_CONFIRMATION': return 1;
      case 'PICKUP_SCHEDULED':
      case 'PICKED_UP': return 2;
      case 'IN_TRANSIT': return 3;
      case 'DELIVERED': return 4;
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDisputed = order.status === 'RETURN_REQUESTED' || order.status === 'DISPUTED';
  const canCancel = ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_SELLER_CONFIRMATION'].includes(order.status);
  const canDispute = order.status === 'DELIVERED';

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div>
            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                marginBottom: 'var(--space-2)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Profile & Orders</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0 }}>
                Order #{order.order_number}
              </h1>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isCancelled ? '#FEE2E2' : isDisputed ? '#FEF3C7' : '#DCFCE7',
                color: isCancelled ? '#991B1B' : isDisputed ? '#92400E' : '#166534',
                textTransform: 'uppercase'
              }}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-secondary"
                style={{ borderRadius: 'var(--radius-sm)', color: '#DC2626', borderColor: '#FCA5A5', fontSize: 'var(--text-xs)' }}
              >
                Cancel Order
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="btn btn-secondary"
                style={{ borderRadius: 'var(--radius-sm)', color: '#D97706', borderColor: '#FCD34D', fontSize: 'var(--text-xs)' }}
              >
                Raise Dispute / Return
              </button>
            )}
          </div>
        </div>

        {/* Status Tracker Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {isCancelled ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <XCircle size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 4px 0', color: '#DC2626' }}>
                  Order Cancelled
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Reason: {order.cancellation_reason || 'Buyer requested cancellation.'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: '#166534', fontWeight: 600 }}>
                  Funds held in Escrow have been refunded back to your original payment method. Inventory has been released.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                  Live Delivery & Escrow Progress
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>T+3 Days Buyer Protection Escrow Active</span>
                </div>
              </div>

              {/* Step indicator bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isDone ? 'var(--color-primary)' : 'var(--bg-subtle)',
                        color: isDone ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                          color: isDone ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                            Current Stage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Info: Items & Delivery Address */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-6)' }}>
          {/* Items in this Order */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Package size={18} color="var(--color-primary)" />
              <span>Purchased Books ({order.items.length})</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
                  <img
                    src={item.listing?.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                    alt={item.listing?.title || 'Book'}
                    style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                      {item.listing?.title || 'Book Title'}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      By {item.listing?.authors || 'Author'}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {item.listing?.condition_grade?.replace('_', ' ') || 'Good'}
                      </span>
                      {item.listing?.seller?.seller_profile?.store_name && (
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Seller: {item.listing.seller.seller_profile.store_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Books Subtotal</span>
                <span>₹{order.total_books_amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Doorstep Delivery Fee</span>
                <span>₹{order.delivery_fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Platform Convenience Fee</span>
                <span style={{ color: '#166534', fontWeight: 600 }}>FREE (₹0)</span>
              </div>
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-base)',
                fontWeight: 700
              }}>
                <span>Total Paid (Escrow Held)</span>
                <span style={{ color: 'var(--color-primary)' }}>₹{order.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Escrow Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Delivery Address Card */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-3) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={18} color="var(--color-primary)" />
                <span>Shipping Destination</span>
              </h2>
              {order.delivery_address ? (
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    {order.delivery_address.full_name}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Phone: {order.delivery_address.phone_number}
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {order.delivery_address.address_line1}{order.delivery_address.address_line2 ? `, ${order.delivery_address.address_line2}` : ''}
                    <br />
                    {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Address ID: {order.delivery_address_id}</p>
              )}
            </div>

            {/* Escrow Trust Information */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-3) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck size={18} color="var(--color-primary)" />
                <span>Escrow Trust Protection Guarantee</span>
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your payment of <strong>₹{order.total_amount}</strong> is deposited in a nodal escrow account. The seller will only be paid when:
              </p>
              <ul style={{ margin: 'var(--space-2) 0 0 0', paddingLeft: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <li>Doorstep delivery is verified by courier.</li>
                <li>The 3-day (T+3) inspection window passes with zero condition disputes.</li>
              </ul>
              <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/returns" style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                  View Returns & Inspection Dispute Policy &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
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
          zIndex: 9999,
          padding: 'var(--space-4)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              Confirm Cancellation
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4) 0' }}>
              Are you sure you want to cancel this order? The held escrow funds will be refunded, and the books will be made available to other readers.
            </p>
            <form onSubmit={handleCancelOrder}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Reason for cancellation *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Ordered duplicate copy / Changed mind"
                className="input-field"
                style={{ width: '100%', fontSize: 'var(--text-xs)', padding: '8px', marginBottom: 'var(--space-4)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', backgroundColor: '#DC2626' }}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
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
          zIndex: 9999,
          padding: 'var(--space-4)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              File Inspection Dispute
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4) 0' }}>
              BookLoop T+3 Inspection Guarantee allows returns if condition differs from seller's disclosure (missing pages, severe water damage, wrong edition).
            </p>
            <form onSubmit={handleDisputeOrder}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '4px' }}>
                Describe condition discrepancy in detail *
              </label>
              <textarea
                required
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. 15 pages missing in chapter 3, not disclosed in listing"
                className="input-field"
                style={{ width: '100%', fontSize: 'var(--text-xs)', padding: '8px', marginBottom: 'var(--space-4)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputing}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', backgroundColor: '#D97706' }}
                >
                  {disputing ? 'Submitting...' : 'Submit Return Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
