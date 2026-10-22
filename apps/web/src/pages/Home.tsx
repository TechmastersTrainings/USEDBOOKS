import React from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '../components/BookCard';
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Award, Compass, Cpu } from 'lucide-react';

export const Home: React.FC = () => {
  const featuredCategories = [
    { name: 'UPSC & KPSC Prep', slug: 'competitive-examinations', icon: <Award size={20} />, count: '140+ books' },
    { name: 'Engineering & Tech', slug: 'engineering-and-technology', icon: <Cpu size={20} />, count: '280+ books' },
    { name: 'Academic Textbooks', slug: 'academic-textbooks', icon: <GraduationCap size={20} />, count: '310+ books' },
    { name: 'Fiction & Literature', slug: 'fiction-and-literature', icon: <BookOpen size={20} />, count: '190+ books' },
    { name: 'Non-Fiction & Self Help', slug: 'non-fiction', icon: <Compass size={20} />, count: '160+ books' },
  ];

  const sampleBooks = [
    {
      id: '1',
      title: 'Indian Polity for Civil Services',
      authors: 'M. Laxmikanth',
      price: 380,
      originalMrp: 850,
      conditionGrade: 'very_good' as const,
      sellerCity: 'Bidar (Gandhi Gunj)',
      categoryName: 'Competitive Exams',
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '2',
      title: 'Higher Engineering Mathematics',
      authors: 'Dr. B.S. Grewal',
      price: 420,
      originalMrp: 995,
      conditionGrade: 'like_new' as const,
      sellerCity: 'Bidar (Naubad)',
      categoryName: 'Engineering',
      coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '3',
      title: 'Atomic Habits',
      authors: 'James Clear',
      price: 260,
      originalMrp: 599,
      conditionGrade: 'good' as const,
      sellerCity: 'Bidar (Old City)',
      categoryName: 'Self-Help',
      coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '4',
      title: 'Karvalo & Other Stories (Kannada)',
      authors: 'K.P. Poornachandra Tejaswi',
      price: 180,
      originalMrp: 350,
      conditionGrade: 'very_good' as const,
      sellerCity: 'Bidar (Mailoor)',
      categoryName: 'Kannada Literature',
      coverImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-16)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-10)',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              marginBottom: 'var(--space-4)'
            }}>
              <Sparkles size={14} />
              <span>Now Live in Bidar, Karnataka</span>
            </div>

            <h1 style={{
              fontSize: 'var(--text-4xl)',
              lineHeight: 1.15,
              marginBottom: 'var(--space-4)',
              color: 'var(--text-primary)'
            }}>
              Give your read books a second life. Buy pre-loved books at fair prices.
            </h1>

            <p style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.6
            }}>
              Connect directly with verified readers and students across Bidar. We pick up from the seller's doorstep and deliver straight to the buyer with secure payment protection.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Link to="/explore" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: 'var(--text-base)' }}>
                Find Books in Bidar
                <ArrowRight size={18} />
              </Link>
              <Link to="/sell" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: 'var(--text-base)' }}>
                Sell Your Books
              </Link>
            </div>
          </div>

          {/* Hero Decorative Card Stack */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div className="card" style={{
              width: '100%',
              maxWidth: '380px',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-lg)',
              backgroundColor: 'var(--bg-surface)',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <span className="badge badge-like-new">Verified Copy</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Seller: Rahul M. • Bidar</span>
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
                General Studies Manual 2025
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                UPSC Civil Services Prelims • Pristine condition, unmarked pages.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>₹450</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>MRP ₹1,299 (65% OFF)</div>
                </div>
                <Link to="/explore" className="btn btn-accent">
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="container" style={{ padding: 'var(--space-12) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Popular in Bidar</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Explore academic textbooks, competitive exam guides, and regional literature.
            </p>
          </div>
          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {featuredCategories.map((cat, i) => (
            <Link key={i} to={`/explore?category=${cat.slug}`} className="card card-hover" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: 'var(--space-5)',
              color: 'inherit'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)'
              }}>
                {cat.icon}
              </div>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>{cat.name}</h4>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Listings Shelf */}
      <section className="container" style={{ paddingBottom: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Recently Listed Books</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Genuine copies listed by readers in Bidar (585401 / 585403).
            </p>
          </div>
          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
            <span>Browse More</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 'var(--space-5)'
        }}>
          {sampleBooks.map(book => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        backgroundColor: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'var(--space-16) 0'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--space-12)' }}>
            <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
              How BookLoop Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              Simple, transparent peer-to-peer selling with door-to-door courier service.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>1.</div>
              <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>List in 2 Minutes</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter the book details, snap real photos of the copy, select the condition, and set your asking price.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>2.</div>
              <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Doorstep Pickup</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                When someone buys, pack the book. Our courier partner picks it up directly from your address in Bidar.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>3.</div>
              <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Direct Settlement</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Once delivered and inspected, your earnings are deposited directly into your verified bank account or UPI.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
