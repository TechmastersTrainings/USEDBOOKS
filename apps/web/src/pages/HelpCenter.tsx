import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does doorstep pickup work for sellers in Bidar?',
      a: 'When an order is confirmed, our local courier partner is dispatched to your registered address in Bidar. Simply wrap the book securely. The courier handles the shipping label and delivers directly to the buyer.'
    },
    {
      q: 'How does BookLoop verify book conditions?',
      a: 'Every listing requires original photos of the actual physical copy, including the cover, spine, and sample pages. Sellers must disclose defects, missing pages, or notes under our 5 standardized condition grades.'
    },
    {
      q: 'When do sellers receive their payment?',
      a: 'Buyer funds are held securely in escrow and released to the seller 3 days after confirmed delivery. Once released, payouts are transferred directly to your UPI ID or bank account.'
    },
    {
      q: 'What happens if a book arrives damaged or with missing pages?',
      a: 'If a book arrives in a condition worse than described or with undisclosed missing pages, you can file a return request within the 3-day inspection window. We review photo evidence and issue a full refund.'
    },
    {
      q: 'What are the courier delivery charges?',
      a: 'Deliveries within Bidar city (PINs 585401, 585402, 585403, 585404) are charged at a transparent flat rate of ₹40 per single parcel. Intercity surface courier rates start from ₹70.'
    }
  ];

  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', maxWidth: '820px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Help Centre &amp; FAQs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Answers to common questions about buying, selling, and door-to-door delivery.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {faqs.map((faq, i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-5)' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <span>{faq.q}</span>
              {openFaq === i ? <ChevronUp size={18} color="var(--color-primary)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </button>
            {openFaq === i && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)', lineHeight: 1.6, paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
