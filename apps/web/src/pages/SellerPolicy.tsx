import React from 'react';
import { Award } from 'lucide-react';

export const SellerPolicy: React.FC = () => {
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
          <Award size={14} />
          <span>Seller Studio Guidelines</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Seller Guidelines &amp; Policies</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Standards for listing, condition integrity, packaging, and timely payouts.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. Photographic Evidence Mandatory</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            All listings must feature clear, original photographs of the actual physical copy you own. Stock photos taken from publisher websites or internet searches are strictly prohibited.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Dispatch Timeframe (24-48 Hours)</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Upon receiving an order notification, you have <strong>24 hours</strong> to confirm book availability and package the parcel. The courier will be scheduled for pickup within 48 hours from your registered address in Bidar.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>3. Marketplace Settlement &amp; Commission</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            BookLoop deducts a standard 10% platform fee plus applicable 18% GST on the fee. For example, if you sell a textbook for ₹500, the platform fee is ₹50 + ₹9 GST, leaving a net payout of ₹441 credited to your UPI ID or bank account 3 days after verified buyer delivery. Doorstep pickup is completely free for sellers.
          </p>
        </section>
      </div>
    </div>
  );
};
