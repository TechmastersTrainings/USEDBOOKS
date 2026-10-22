import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
          <ShieldCheck size={14} />
          <span>Statutory Compliance • Digital Personal Data Protection Act (DPDPA 2023)</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Effective Date: October 2026 • Last Reviewed: October 2026
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. Purpose &amp; Scope</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            BookLoop Technologies Pvt. Ltd. operates a peer-to-peer used-book marketplace. This policy governs how we collect, store, handle, and protect personal data from buyers and sellers across India, starting in our initial launch city of Bidar, Karnataka.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Personal Data We Collect</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            In accordance with data minimisation principles, we only collect information necessary to fulfill book transactions and door-to-door courier deliveries:
          </p>
          <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-5)' }}>
            <li><strong>Identity &amp; Contact:</strong> Full name, verified mobile phone number, email address.</li>
            <li><strong>Logistics Data:</strong> Pickup address (for sellers) and delivery address (for buyers) with PIN codes.</li>
            <li><strong>Payment &amp; Settlement Data:</strong> Virtual Payment Address (UPI ID) or masked bank account details for seller disbursement. We do not store full credit/debit card numbers.</li>
            <li><strong>Book Condition Disclosures:</strong> Photographs, damage annotations, and condition notes submitted for listings.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>3. Private Address Protection</h2>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
              Sellers' full residential addresses are never displayed publicly on marketplace search or product pages.
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Pickup address details are disclosed exclusively to contracted logistics partners (couriers/riders) upon order confirmation and scheduled parcel dispatch.
            </p>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>4. Data Subject Rights &amp; Deletion</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            You possess the right to access, rectify, or request deletion of your personal account data, subject to statutory record retention for taxation (GST audit records must be retained for 72 months). Submit deletion requests to our Grievance Officer at <a href="mailto:privacy@bookloop.in" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>privacy@bookloop.in</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
