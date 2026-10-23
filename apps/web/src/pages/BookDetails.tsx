import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Check, ShoppingBag, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';

interface ListingDetail {
  id: string;
  seller_id: string;
  custom_title?: string;
  custom_authors?: string;
  asking_price: number;
  condition_grade: string;
  missing_pages_defect: boolean;
  has_annotations_highlighting: boolean;
  defect_description?: string;
  status: string;
  quantity: number;
  pickup_address_id: string;
  book_catalogue?: {
    id: string;
    title: string;
    subtitle?: string;
    authors: string;
    isbn_10?: string;
    isbn_13?: string;
    publisher?: string;
    edition?: string;
    publication_year?: number;
    language: string;
    format: string;
    original_mrp?: number;
    page_count?: number;
    cover_image_url?: string;
    description?: string;
  };
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    caption?: string;
  }>;
}

export const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [pincode, setPincode] = useState('585401');
  const [pincodeStatus, setPincodeStatus] = useState<string>('Serviceable for same-day/next-day delivery in Bidar (₹40 Flat)');
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/listings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setListing(data);
        }
      } catch {
        // Fallback or offline
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (['585401', '585402', '585403', '585404'].includes(pincode.trim())) {
      setPincodeStatus('Serviceable for same-day / next-day doorstep courier delivery in Bidar (₹40 Flat)');
    } else {
      setPincodeStatus('Serviceable via standard regional courier (3–5 business days, ₹70)');
    }
  };

  const handleAddToCart = () => {
    if (!listing) return;
    const title = listing.book_catalogue?.title || listing.custom_title || 'Used Book';
    const authors = listing.book_catalogue?.authors || listing.custom_authors || 'Independent Author';
    const primaryImg = listing.images.find(img => img.is_primary)?.image_url || listing.book_catalogue?.cover_image_url;

    addToCart({
      listingId: listing.id,
      title,
      authors,
      askingPrice: listing.asking_price,
      conditionGrade: listing.condition_grade,
      coverImage: primaryImg,
      missingPagesDefect: listing.missing_pages_defect,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading book listing details...</p>
      </div>
    );
  }

  // Fallback data if listing ID not found in database
  const title = listing?.book_catalogue?.title || listing?.custom_title || 'Indian Polity for Civil Services (6th Edition)';
  const authors = listing?.book_catalogue?.authors || listing?.custom_authors || 'M. Laxmikanth';
  const publisher = listing?.book_catalogue?.publisher || 'McGraw Hill India';
  const isbn = listing?.book_catalogue?.isbn_13 || '9789389538472';
  const askingPrice = listing?.asking_price || 380;
  const originalMrp = listing?.book_catalogue?.original_mrp || 850;
  const condition = listing?.condition_grade || 'very_good';
  const description = listing?.book_catalogue?.description || 'Comprehensive foundational text on the Constitution of India, fundamental rights, and civil administrative institutions.';

  const photos = listing?.images && listing.images.length > 0
    ? listing.images.map(img => img.image_url)
    : [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop&q=80',
      ];

  const savingsPercent = originalMrp ? Math.round(((originalMrp - askingPrice) / originalMrp) * 100) : 0;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-16)' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <nav style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <Link to="/">Home</Link> &gt; <Link to="/explore">Explore</Link> &gt; <span style={{ color: 'var(--text-primary)' }}>{title}</span>
        </nav>
      </div>

      {addedToast && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#166534',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Added to your cart!</span>
          <Link to="/cart" style={{ color: '#166534', fontWeight: 700, fontSize: 'var(--text-sm)', textDecoration: 'underline' }}>
            View Cart &rarr;
          </Link>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 'var(--space-8)',
        alignItems: 'start'
      }}>
        {/* Photo Gallery */}
        <div>
          <div style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
            aspectRatio: '3/4',
            maxHeight: '440px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 'var(--space-3)',
            border: '1px solid var(--border-subtle)'
          }}>
            <img
              src={photos[selectedPhotoIndex] || photos[0]}
              alt={`${title} physical copy view`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: '4px' }}>
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  style={{
                    width: '60px',
                    height: '60px',
                    flexShrink: 0,
                    borderRadius: 'var(--radius-sm)',
                    border: selectedPhotoIndex === idx ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    padding: 0,
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Book Details & Buy Box */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{
              textTransform: 'capitalize',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {condition.replace('_', ' ')} Condition
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              ISBN: {isbn}
            </span>
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.25, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            {title}
          </h1>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            By <strong>{authors}</strong> {publisher && `• Published by ${publisher}`}
          </p>

          {/* Price Box */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                ₹{askingPrice}
              </span>
              {originalMrp > askingPrice && (
                <>
                  <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    MRP ₹{originalMrp}
                  </span>
                  <span style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    Save {savingsPercent}%
                  </span>
                </>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Physical printed books attract 0% GST (HSN 4901). No hidden markup.
            </p>
          </div>

          {/* Condition Disclosures */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-5)'
          }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-3) 0' }}>
              Physical Condition & Defects
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {listing?.missing_pages_defect ? (
                  <>
                    <AlertTriangle size={16} color="#B45309" />
                    <span style={{ color: '#B45309', fontWeight: 600 }}>Missing pages disclosed by seller</span>
                  </>
                ) : (
                  <>
                    <Check size={16} color="#15803D" />
                    <span style={{ color: '#15803D', fontWeight: 600 }}>All pages present and intact (Zero missing pages)</span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {listing?.has_annotations_highlighting ? (
                  <>
                    <AlertTriangle size={16} color="#B45309" />
                    <span style={{ color: '#B45309' }}>Contains highlighting or pen/pencil annotations</span>
                  </>
                ) : (
                  <>
                    <Check size={16} color="#15803D" />
                    <span style={{ color: '#15803D' }}>Clean interior with minimal or no annotations</span>
                  </>
                )}
              </div>

              {listing?.defect_description && (
                <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Seller Notes:</strong> {listing.defect_description}
                </div>
              )}
            </div>
          </div>

          {/* Seller Location & Escrow Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-5)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block' }}>
                  Dispatches from Bidar, Karnataka
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Doorstep courier pickup verified
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>T+3 Escrow Hold</span>
            </div>
          </div>

          {/* PIN Checker */}
          <form onSubmit={checkPincode} style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Delivery PIN Code
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="input-field"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ width: '140px', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 'var(--text-xs)' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
                Check
              </button>
            </div>
            {pincodeStatus && (
              <p style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 600 }}>
                {pincodeStatus}
              </p>
            )}
          </form>

          {/* Desktop Purchase Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleBuyNow}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '160px', borderRadius: 'var(--radius-sm)', padding: '12px', justifyContent: 'center' }}
            >
              <ShoppingBag size={18} />
              <span>Buy This Copy (₹{askingPrice})</span>
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-sm)', padding: '12px 20px', minWidth: '120px' }}
            >
              Add to Cart
            </button>
          </div>

          {/* Description */}
          {description && (
            <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                About this Book
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar on Mobile */}
      <div
        className="show-on-mobile"
        style={{
          position: 'fixed',
          bottom: '56px', /* above bottom navigation bar */
          left: 0,
          right: 0,
          zIndex: 85,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '8px 16px',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
              ₹{askingPrice}
            </div>
            {originalMrp > askingPrice && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                MRP ₹{originalMrp}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-md)' }}
            >
              Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
