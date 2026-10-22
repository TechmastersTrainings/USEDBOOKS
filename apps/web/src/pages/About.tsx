import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', maxWidth: '820px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>About BookLoop</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '640px', margin: '0 auto' }}>
          Democratizing access to books by connecting genuine readers and students across India.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Our Story &amp; Mission</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Every year, millions of high-quality textbooks and literature books gather dust on shelves while aspiring students and avid readers struggle with steep book costs. BookLoop was founded to solve this problem through a pure peer-to-peer used-book marketplace.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Why We Started in Bidar</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Bidar is home to premier engineering colleges, medical institutes, and civil services coaching hubs. Starting as a city-first pilot allows us to perfect hyper-local doorstep courier fulfillment, build community trust, and guarantee fair prices before scaling statewide across Karnataka and India.
          </p>
        </section>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-4)'
        }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>C2C Peer-to-Peer</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Independent readers own and list their own books. We do not operate an inventory bookstore.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>Real Photo Verification</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Stock images are strictly rejected. Buyers see the exact book and condition they are ordering.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>Escrow Protection</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Funds are released only after verified delivery and a 3-day inspection window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
