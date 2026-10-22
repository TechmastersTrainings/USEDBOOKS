import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookCard } from '../components/BookCard';
import { SlidersHorizontal, ArrowUpDown, MapPin } from 'lucide-react';

export const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const query = searchParams.get('q') || '';

  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState<boolean>(false);
  const [books, setBooks] = useState<any[]>([]);

  const categories = [
    { slug: 'all', name: 'All Categories' },
    { slug: 'competitive-examinations', name: 'Competitive Exams (UPSC, KPSC, GATE)' },
    { slug: 'engineering-and-technology', name: 'Engineering & Technology' },
    { slug: 'medicine-and-health-sciences', name: 'Medicine & Health Sciences' },
    { slug: 'academic-textbooks', name: 'Academic & School Textbooks' },
    { slug: 'fiction-and-literature', name: 'Fiction & Literature' },
    { slug: 'non-fiction', name: 'Non-Fiction & Self Help' },
    { slug: 'regional-indian-literature', name: 'Kannada & Indian Languages' },
  ];

  React.useEffect(() => {
    let url = `http://localhost:8000/api/v1/listings?sort=${sortBy}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (selectedCondition !== 'all') url += `&condition=${selectedCondition}`;
    if (priceFilter === 'under_199') url += `&max_price=199`;
    if (priceFilter === '200_499') url += `&min_price=200&max_price=499`;
    if (priceFilter === 'above_500') url += `&min_price=500`;

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            id: item.id,
            title: item.book_catalogue?.title || item.custom_title || 'Untitled',
            authors: item.book_catalogue?.authors || item.custom_authors || 'Unknown',
            price: item.asking_price,
            originalMrp: item.book_catalogue?.original_mrp,
            conditionGrade: item.condition_grade,
            sellerCity: 'Bidar',
            categoryName: item.book_catalogue?.category_id ? 'Textbook' : 'Verified',
            coverImageUrl: item.images?.[0]?.image_url || item.book_catalogue?.cover_image_url
          }));
          setBooks(mapped);
        } else {
          setBooks([]);
        }
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => setLoading(false));
  }, [query, selectedCondition, priceFilter, sortBy, currentCategory]);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Header & Search summary */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-1)' }}>
          {query ? `Search Results for "${query}"` : 'Browse Used Books'}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Showing verified reader listings available for doorstep delivery across Bidar (PINs 585401, 585403).
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-8)',
        alignItems: 'start'
      }}>
        {/* Filters Sidebar */}
        <aside className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
            <SlidersHorizontal size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--text-base)' }}>Filters</h3>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Category
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSearchParams({ category: c.slug })}
                  style={{
                    textAlign: 'left',
                    background: currentCategory === c.slug ? 'var(--color-primary-subtle)' : 'transparent',
                    color: currentCategory === c.slug ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: currentCategory === c.slug ? 600 : 400,
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Condition
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {['all', 'like_new', 'very_good', 'good', 'acceptable'].map(cond => (
                <label key={cond} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="condition"
                    checked={selectedCondition === cond}
                    onChange={() => setSelectedCondition(cond)}
                  />
                  <span>{cond === 'all' ? 'All Conditions' : cond.replace('_', ' ').toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Price Range
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under_199', label: 'Under ₹199' },
                { id: '200_499', label: '₹200 to ₹499' },
                { id: 'above_500', label: '₹500 & Above' },
              ].map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="price"
                    checked={priceFilter === p.id}
                    onChange={() => setPriceFilter(p.id)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pilot Service Area Notice */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)'
          }}>
            <MapPin size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: 'var(--color-primary)' }} />
            <strong>Local Delivery</strong>: Available for all addresses in Bidar City with flat ₹40 courier rate.
          </div>
        </aside>

        {/* Product Grid Area */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Showing <strong>{books.length}</strong> available copies
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
              >
                <option value="relevance">Most Relevant</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading verified listings in Bidar...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-5)'
            }}>
              {books.map(book => (
                <BookCard key={book.id} {...book} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
