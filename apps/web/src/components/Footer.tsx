import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      marginTop: 'var(--space-12)',
      paddingTop: 'var(--space-10)',
      paddingBottom: 'calc(var(--space-10) + 40px)'
    }}>
      <div className="container">
        {/* Value Propositions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-5)',
          paddingBottom: 'var(--space-8)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-8)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-primary)' }}><ShieldCheck size={24} /></div>
            <div>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>Verified Physical Copies</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Real photos and condition disclosure for every listed book. No stock image surprises.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-primary)' }}><Truck size={24} /></div>
            <div>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>Doorstep Pickup & Delivery</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Courier partner collects directly from seller and delivers to buyer's door in Bidar & beyond.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-primary)' }}><RefreshCw size={24} /></div>
            <div>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>Buyer Escrow Protection</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Funds are released to the seller only after confirmed physical delivery and inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <BookOpen size={20} color="var(--color-primary)" />
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                BookLoop
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-2)' }}>
              India's dedicated peer-to-peer marketplace for pre-loved books. Giving every story a second life.
            </p>
            <Link to="/about" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
              Learn more about our mission &rarr;
            </Link>
          </div>

          <div>
            <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Explore
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <li><Link to="/explore?category=competitive-examinations">Competitive Exams (UPSC/KPSC)</Link></li>
              <li><Link to="/explore?category=engineering-and-technology">Engineering & Tech</Link></li>
              <li><Link to="/explore?category=medicine-and-health-sciences">Medicine & Health</Link></li>
              <li><Link to="/explore?category=fiction-and-literature">Fiction & Classics</Link></li>
              <li><Link to="/explore?category=regional-indian-literature">Kannada & Indian Lit</Link></li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Customer Support
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <li><Link to="/help">Help Centre & FAQs</Link></li>
              <li><Link to="/delivery-policy">Delivery & Shipping Policy</Link></li>
              <li><Link to="/returns">Returns & Refund Policy</Link></li>
              <li><Link to="/seller-policy">Seller Guidelines</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Governance & Legal
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/grievance">Grievance Redressal Officer</Link></li>
              <li><span style={{ color: 'var(--text-muted)' }}>GST Compliance: India HSN 4901</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div style={{
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)'
        }}>
          <div>
            © {new Date().getFullYear()} BookLoop Technologies Pvt. Ltd. Initial pilot operating in Bidar, Karnataka.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built with care for book lovers <Heart size={12} color="var(--color-accent)" fill="var(--color-accent)" />
          </div>
        </div>
      </div>
    </footer>
  );
};
