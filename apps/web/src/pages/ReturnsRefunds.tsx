import React from 'react';
import { RotateCcw } from 'lucide-react';

export const ReturnsRefunds: React.FC = () => {
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
          <RotateCcw size={14} />
          <span>Buyer Protection Guarantee</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Returns &amp; Refund Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          How our escrow settlement protects buyers against undisclosed damage or wrong editions.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. 3-Day Inspection Window</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Because BookLoop is a peer-to-peer used book marketplace, seller payouts are placed on a <strong>3-day hold window</strong> following confirmed delivery by our courier partner. This allows you to verify that the physical book matches the seller's photos and condition disclosures.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Eligible Return Grounds</h2>
          <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-5)' }}>
            <li>Undisclosed missing pages or detached binding.</li>
            <li>Book received is a different edition or ISBN than listed.</li>
            <li>Severe damage (water stains, torn cover) not disclosed in seller photos.</li>
            <li>Book copy is counterfeit, unauthorized reprint, or photocopy.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>3. Non-Eligible Reasons</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Normal wear, mild pencil markings, or shelf wear that was accurately disclosed in the listing's photos and condition notes does not qualify for return. "Change of mind" after delivery is not eligible in peer-to-peer sales.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>4. Refund Processing Time</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Approved refunds are credited directly back to the original source payment method (UPI / Bank Account) within <strong>3 to 5 business days</strong> through our payment gateway provider.
          </p>
        </section>
      </div>
    </div>
  );
};
