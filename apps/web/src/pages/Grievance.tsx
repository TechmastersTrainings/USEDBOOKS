import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export const Grievance: React.FC = () => {
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
          <span>Statutory Disclosure • IT Rules 2021 &amp; Consumer Protection 2020</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Grievance Redressal Mechanism</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Designated Resident Grievance Officer details for prompt complaint redressal.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>1. Designated Grievance Officer</h2>
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <div>
              <strong style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>Mr. Vinay K. Kulkarni</strong>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Grievance &amp; Compliance Officer</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span>BookLoop Technologies, Plot No. 12, Guru Nanak Nagar, Bidar, Karnataka - 585401, India</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <Mail size={16} color="var(--color-primary)" />
              <a href="mailto:grievance-officer@bookloop.in" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                grievance-officer@bookloop.in
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <Phone size={16} color="var(--color-primary)" />
              <a href="tel:+918482200111" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                +91 8482 200 111 (Mon - Sat, 10:00 AM - 6:00 PM IST)
              </a>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>2. Resolution Timelines</h2>
          <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-5)' }}>
            <li><strong>Acknowledgment:</strong> Within 24 hours of receiving your written communication.</li>
            <li><strong>Disposal / Resolution:</strong> Within 15 calendar days from acknowledgment.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
