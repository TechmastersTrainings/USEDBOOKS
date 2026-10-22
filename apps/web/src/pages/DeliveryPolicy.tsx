import React from 'react';
import { Truck } from 'lucide-react';

export const DeliveryPolicy: React.FC = () => {
  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', maxWidth: '820px' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-primary-subtle)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          marginBottom: 'var(--space-3)'
        }}>
          <Truck size={14} />
          <span>Doorstep Logistics Guide</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Delivery &amp; Shipping Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Transparent door-to-door courier fulfillment across Bidar and regional pincodes.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. Launch City Operations (Bidar, Karnataka)</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            BookLoop operates door-to-door pickup and delivery across all major localities in Bidar (PIN codes 585401, 585402, 585403, and 585404), covering Gandhi Gunj, Naubad, Old City, Chidri Road, and university campuses.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Transparent Delivery Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', margin: 'var(--space-3) 0' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Local Delivery (Bidar)</h3>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>₹40</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Flat rate per single parcel order. Same-day or next-day turnaround.</p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>Regional Surface Shipping</h3>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>From ₹70</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Intercity courier via surface logistics (2-4 business days).</p>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>3. Packaging Guidelines for Sellers</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Sellers must package books securely in moisture-resistant envelopes or recycled cardboard wrapping before handing over to the courier partner. The courier will apply the barcoded AWB shipping label during pickup.
          </p>
        </section>
      </div>
    </div>
  );
};
