import React from 'react';
import { Scale } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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
          <Scale size={14} />
          <span>Intermediary Guidelines • Information Technology Act 2000</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Last Updated: October 2026
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. Marketplace Model</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            BookLoop is an online marketplace facilitator connecting independent sellers of used physical books with prospective buyers. BookLoop does not purchase, stock, or own the listed books. The legal contract of sale is strictly between the buyer and the seller.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Strict Anti-Piracy &amp; Copyright Policy</h2>
          <div style={{ backgroundColor: 'var(--color-error-bg)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)', fontWeight: 600 }}>
              Zero Tolerance for Unauthorized Materials:
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
              Sellers are strictly prohibited from listing photocopied books, unauthorized reprints, spiral-bound scans, pirated textbooks, or digital PDFs. Only legitimate, previously owned physical books published by authorized publishers may be listed. Violations result in immediate account termination.
            </p>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>3. Condition Grading &amp; Mandatory Disclosure</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Sellers must accurately disclose the physical condition of their book according to our 5 grading tiers (Like New, Very Good, Good, Acceptable, Heavily Used). Any missing pages, detached covers, or heavy annotations must be explicitly stated. Undisclosed damage entitles the buyer to a full refund.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>4. Platform Fees &amp; Taxes</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Physical book sales are categorized under HSN 4901 (historically nil-rated under Indian GST). BookLoop charges a configurable marketplace commission (default 10%) on completed orders to cover technology, catalog curation, and payment operations. Applicable GST (18%) is levied on the marketplace commission fee.
          </p>
        </section>
      </div>
    </div>
  );
};
