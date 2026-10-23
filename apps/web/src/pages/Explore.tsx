import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookCard } from '../components/BookCard';
import { SlidersHorizontal, ArrowUpDown, MapPin, X, Check } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const query = searchParams.get('q') || '';

  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState<boolean>(false);
  const [books, setBooks] = useState<any[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const categories = [
    { slug: 'all', name: 'All Categories' },
    { slug: 'competitive-examinations', name: 'Competitive Exams (UPSC, KPSC)' },
    { slug: 'engineering-and-technology', name: 'Engineering & Tech' },
    { slug: 'medicine-and-health-sciences', name: 'Medicine & Health' },
    { slug: 'academic-textbooks', name: 'Academic & School' },
    { slug: 'fiction-and-literature', name: 'Fiction & Literature' },
    { slug: 'non-fiction', name: 'Non-Fiction & Self Help' },
    { slug: 'regional-indian-literature', name: 'Kannada & Regional' },
  ];

  const FALLBACK_CATALOG = [
    {
      id: '1',
      title: 'Indian Polity for Civil Services',
      authors: 'M. Laxmikanth',
      price: 380,
      originalMrp: 850,
      conditionGrade: 'very_good',
      sellerCity: 'Bidar (Gandhi Gunj)',
      categorySlug: 'competitive-examinations',
      categoryName: 'Competitive Exams',
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '2',
      title: 'Higher Engineering Mathematics',
      authors: 'Dr. B.S. Grewal',
      price: 420,
      originalMrp: 995,
      conditionGrade: 'like_new',
      sellerCity: 'Bidar (Naubad)',
      categorySlug: 'engineering-and-technology',
      categoryName: 'Engineering',
      coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '3',
      title: 'Atomic Habits',
      authors: 'James Clear',
      price: 260,
      originalMrp: 599,
      conditionGrade: 'good',
      sellerCity: 'Bidar (Old City)',
      categorySlug: 'non-fiction',
      categoryName: 'Self-Help',
      coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '4',
      title: 'Karvalo & Other Stories (Kannada)',
      authors: 'K.P. Poornachandra Tejaswi',
      price: 180,
      originalMrp: 350,
      conditionGrade: 'very_good',
      sellerCity: 'Bidar (Mailoor)',
      categorySlug: 'regional-indian-literature',
      categoryName: 'Kannada Literature',
      coverImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '5',
      title: "Gray's Anatomy for Students",
      authors: 'Richard Drake, A. Wayne Vogl',
      price: 850,
      originalMrp: 2200,
      conditionGrade: 'good',
      sellerCity: 'Bidar (BRIMS Campus)',
      categorySlug: 'medicine-and-health-sciences',
      categoryName: 'Medicine & Health',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '6',
      title: 'NCERT Class 12 Physics (Part 1 & 2)',
      authors: 'NCERT Editorial Board',
      price: 190,
      originalMrp: 450,
      conditionGrade: 'acceptable',
      sellerCity: 'Bidar (Adarsh Nagar)',
      categorySlug: 'academic-textbooks',
      categoryName: 'Academic & School',
      coverImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '7',
      title: 'The Guide',
      authors: 'R.K. Narayan',
      price: 150,
      originalMrp: 299,
      conditionGrade: 'very_good',
      sellerCity: 'Bidar (Chidri Road)',
      categorySlug: 'fiction-and-literature',
      categoryName: 'Fiction & Literature',
      coverImageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: '8',
      title: 'Modern Indian History',
      authors: 'Bipin Chandra',
      price: 240,
      originalMrp: 495,
      conditionGrade: 'like_new',
      sellerCity: 'Bidar (Shivaji Nagar)',
      categorySlug: 'competitive-examinations',
      categoryName: 'Competitive Exams',
      coverImageUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=600&auto=format&fit=crop&q=80'
    }
  ];

  const getFilteredFallback = () => {
    let list = FALLBACK_CATALOG.filter(b => {
      if (currentCategory !== 'all' && b.categorySlug !== currentCategory) return false;
      if (selectedCondition !== 'all' && b.conditionGrade !== selectedCondition) return false;
      if (priceFilter === 'under_199' && b.price >= 200) return false;
      if (priceFilter === '200_499' && (b.price < 200 || b.price > 499)) return false;
      if (priceFilter === 'above_500' && b.price < 500) return false;
      if (query) {
        const q = query.toLowerCase();
        const match = b.title.toLowerCase().includes(q) ||
                      b.authors.toLowerCase().includes(q) ||
                      b.categoryName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (sortBy === 'price_low') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  };

  React.useEffect(() => {
    let url = `${API_BASE_URL}/api/v1/listings?sort=${sortBy}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (selectedCondition !== 'all') url += `&condition=${selectedCondition}`;
    if (priceFilter === 'under_199') url += `&max_price=199`;
    if (priceFilter === '200_499') url += `&min_price=200&max_price=499`;
    if (priceFilter === 'above_500') url += `&min_price=500`;

    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
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
          setBooks(getFilteredFallback());
        }
      })
      .catch(() => {
        setBooks(getFilteredFallback());
      })
      .finally(() => setLoading(false));
  }, [query, selectedCondition, priceFilter, sortBy, currentCategory]);

  const activeFilterCount = (currentCategory !== 'all' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setSearchParams({});
    setSelectedCondition('all');
    setPriceFilter('all');
  };

  const FilterContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SlidersHorizontal size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>Filters</h3>
          {activeFilterCount > 0 && (
            <span style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              padding: '1px 7px',
              fontWeight: 700
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Category
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
      <div style={{ marginBottom: 'var(--space-5)' }}>
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
      <div style={{ marginBottom: 'var(--space-5)' }}>
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
        <strong>Bidar Doorstep Delivery</strong>: Flat ₹40 courier rate across Bidar City.
      </div>
    </>
  );

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Header & Search summary */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '4px' }}>
          {query ? `Search: "${query}"` : 'Browse Used Books'}
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Verified listings in Bidar (PINs 585401, 585403) with doorstep delivery & escrow protection.
        </p>
      </div>

      {/* Mobile Filters & Sort Bar */}
      <div className="flex-show-on-mobile" style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        gap: 'var(--space-2)'
      }}>
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="btn btn-secondary"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 'var(--text-xs)',
            borderRadius: 'var(--radius-md)',
            justifyContent: 'center',
            borderColor: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--border-subtle)'
          }}
        >
          <SlidersHorizontal size={14} color={activeFilterCount > 0 ? 'var(--color-primary)' : 'inherit'} />
          <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          <select
            className="input-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-md)' }}
          >
            <option value="newest">Newest First</option>
            <option value="relevance">Most Relevant</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 'var(--space-6)',
        alignItems: 'start'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Desktop Filters Sidebar */}
          <aside className="card hide-on-mobile" style={{
            width: '260px',
            flexShrink: 0,
            padding: 'var(--space-5)',
            position: 'sticky',
            top: '80px'
          }}>
            <FilterContent />
          </aside>

          {/* Product Grid Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Desktop Sort & Count Bar */}
            <div className="hide-on-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Showing <strong>{books.length}</strong> available {books.length === 1 ? 'copy' : 'copies'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ArrowUpDown size={14} color="var(--text-muted)" />
                <select
                  className="input-field"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="relevance">Most Relevant</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Loading verified listings in Bidar...
              </div>
            ) : books.length === 0 ? (
              <div style={{
                padding: 'var(--space-12) var(--space-4)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>No books match your filters</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  Try removing some filters or search for another title or subject.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="books-responsive-grid">
                {books.map(book => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal / Bottom Sheet */}
      {mobileFilterOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }} onClick={() => setMobileFilterOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden'
            }}
          >
            {/* Sheet Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Filters & Refinements</div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sheet Body */}
            <div style={{ padding: 'var(--space-4)', overflowY: 'auto', flex: 1 }}>
              <FilterContent />
            </div>

            {/* Sheet Footer Button */}
            <div style={{
              padding: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)'
            }}>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                <span>Show {books.length} Available Books</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
