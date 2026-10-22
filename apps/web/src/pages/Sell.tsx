import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Address {
  id: string;
  full_name: string;
  address_line1: string;
  city: string;
  pincode: string;
  is_pickup_address: boolean;
  is_default: boolean;
}

export const Sell: React.FC = () => {
  const { token, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [isbnQuery, setIsbnQuery] = useState('');
  const [searchingIsbn, setSearchingIsbn] = useState(false);
  const [isbnFoundMsg, setIsbnFoundMsg] = useState<string | null>(null);

  // Form Fields
  const [bookCatalogueId, setBookCatalogueId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [publisher, setPublisher] = useState('');
  const [originalMrp, setOriginalMrp] = useState<number | ''>('');

  // Condition & Defect disclosures
  const [conditionGrade, setConditionGrade] = useState('very_good');
  const [missingPages, setMissingPages] = useState(false);
  const [annotations, setAnnotations] = useState(false);
  const [defectDescription, setDefectDescription] = useState('');

  // Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80'
  ]);
  const [newPhotoInput, setNewPhotoInput] = useState('');

  // Price & Address
  const [askingPrice, setAskingPrice] = useState<number | ''>(250);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedListingId, setSubmittedListingId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddr = data.find((a: Address) => a.is_default || a.is_pickup_address) || data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleIsbnSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isbnQuery.trim()) return;
    setSearchingIsbn(true);
    setIsbnFoundMsg(null);
    setError(null);

    try {
      const cleanIsbn = isbnQuery.trim().replace(/[-\s]/g, '');
      const res = await fetch(`${API_BASE_URL}/api/v1/catalog/isbn/${cleanIsbn}`);
      if (res.ok) {
        const book = await res.json();
        setBookCatalogueId(book.id || null);
        setTitle(book.title || '');
        setAuthors(book.authors || '');
        setPublisher(book.publisher || '');
        if (book.original_mrp) setOriginalMrp(book.original_mrp);
        if (book.cover_image_url) {
          setPhotoUrls([book.cover_image_url]);
        }
        setIsbnFoundMsg(`Found: "${book.title}" by ${book.authors}`);
      } else {
        setIsbnFoundMsg('ISBN not found in database. Please enter title and author details manually below.');
      }
    } catch {
      setIsbnFoundMsg('Lookup service temporarily offline. Please fill details manually.');
    } finally {
      setSearchingIsbn(false);
    }
  };

  const handleAddPhoto = () => {
    if (newPhotoInput.trim()) {
      setPhotoUrls([...photoUrls, newPhotoInput.trim()]);
      setNewPhotoInput('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== idx));
  };

  // Real-time seller net payout calculation
  const priceNum = typeof askingPrice === 'number' ? askingPrice : 0;
  const platformCommission = Math.round(priceNum * 0.10);
  const gstOnCommission = Math.round(platformCommission * 0.18);
  const estimatedPayout = Math.max(0, priceNum - platformCommission - gstOnCommission);

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !authors.trim()) {
      setError('Please provide book title and author.');
      return;
    }

    if (!askingPrice || askingPrice <= 0) {
      setError('Please provide a valid asking price greater than ₹0.');
      return;
    }

    if (!selectedAddressId && addresses.length === 0) {
      setError('Please select or add a verified pickup address in Bidar.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        book_catalogue_id: bookCatalogueId,
        custom_title: title.trim(),
        custom_authors: authors.trim(),
        asking_price: Number(askingPrice),
        condition_grade: conditionGrade,
        missing_pages_defect: missingPages,
        has_annotations_highlighting: annotations,
        defect_description: defectDescription.trim() || undefined,
        pickup_address_id: selectedAddressId || (addresses[0]?.id || 'addr-default'),
        quantity: 1
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/listings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create listing.');
      }

      const listingId = data.id;

      // Attach photos
      for (let i = 0; i < photoUrls.length; i++) {
        await fetch(`${API_BASE_URL}/api/v1/listings/${listingId}/images?image_url=${encodeURIComponent(photoUrls[i])}&is_primary=${i === 0}&caption=Physical copy photo`, {
          method: 'POST',
          headers
        });
      }

      setSubmittedListingId(listingId);
    } catch (err: any) {
      setError(err.message || 'Error publishing listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <Sparkles size={28} />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Sell Books on BookLoop
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            Please sign in to list your books, track doorstep pickups, and receive direct UPI escrow settlements.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
              Sign In with Mobile OTP
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-sm)' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submittedListingId) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Listing Published Successfully!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            Your copy of <strong>{title}</strong> is now live on the marketplace. When a reader in Bidar or across India purchases it, you will receive an SMS courier pickup notification.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to={`/book/${submittedListingId}`} className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
              View Listing
            </Link>
            <button
              onClick={() => {
                setSubmittedListingId(null);
                setStep(1);
                setTitle('');
                setAuthors('');
                setIsbnQuery('');
              }}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              List Another Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: 'calc(100vh - 72px)', padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            List a Book for Sale
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Doorstep courier pickup from your address in Bidar with direct bank/UPI escrow payout.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-3) var(--space-6)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { num: 1, label: 'Book Details' },
            { num: 2, label: 'Photos & Condition' },
            { num: 3, label: 'Price & Pickup' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: step >= s.num ? 'var(--color-primary)' : 'var(--bg-subtle)',
                color: step >= s.num ? 'var(--text-inverse)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xs)',
                fontWeight: 700
              }}>
                {s.num}
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* STEP 1: ISBN LOOKUP & TITLE */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Step 1: Identify Your Book
              </h2>

              {/* ISBN Search bar */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                border: '1px solid var(--border-subtle)'
              }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Auto-fill via 10 or 13-digit ISBN (Printed on back cover barcode)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 9789389538472 or 9788193328491"
                    value={isbnQuery}
                    onChange={(e) => setIsbnQuery(e.target.value)}
                    style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    type="button"
                    onClick={handleIsbnSearch}
                    disabled={searchingIsbn || !isbnQuery.trim()}
                    className="btn btn-primary"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    <Search size={16} />
                    <span>{searchingIsbn ? 'Looking up...' : 'Lookup'}</span>
                  </button>
                </div>
                {isbnFoundMsg && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: 'var(--space-2)', fontWeight: 600 }}>
                    {isbnFoundMsg}
                  </p>
                )}
              </div>

              {/* Book Info Form */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                  Book Title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Higher Engineering Mathematics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                  Author(s) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. B.S. Grewal"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  required
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    Publisher (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Khanna Publishers"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    Original MRP (Printed on back cover)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 750"
                    value={originalMrp}
                    onChange={(e) => setOriginalMrp(e.target.value ? Number(e.target.value) : '')}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim() || !authors.trim()) {
                      setError('Please enter Title and Authors before proceeding.');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}
                >
                  <span>Photos & Condition</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHOTOS & CONDITION */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Step 2: Condition & Physical Photos
              </h2>

              {/* Condition Grade Selection */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Condition Grade *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
                  {[
                    { grade: 'like_new', label: 'Like New', desc: 'Unread copy, crisp spine' },
                    { grade: 'very_good', label: 'Very Good', desc: 'Minimal signs of wear' },
                    { grade: 'good', label: 'Good', desc: 'Readable with gentle wear' },
                    { grade: 'acceptable', label: 'Acceptable', desc: 'Cover wear, intact text' },
                    { grade: 'heavily_used', label: 'Heavily Used', desc: 'Noticeable wear, intact' },
                  ].map((c) => (
                    <button
                      key={c.grade}
                      type="button"
                      onClick={() => setConditionGrade(c.grade)}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        border: conditionGrade === c.grade ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: conditionGrade === c.grade ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: conditionGrade === c.grade ? 'var(--color-primary)' : 'inherit' }}>
                        {c.label}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {c.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Defect Disclosures */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, display: 'block', marginBottom: 'var(--space-3)' }}>
                  Mandatory Buyer Protection Disclosures
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={missingPages}
                      onChange={(e) => setMissingPages(e.target.checked)}
                    />
                    Are there any torn or missing pages?
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={annotations}
                      onChange={(e) => setAnnotations(e.target.checked)}
                    />
                    Does the book have highlighter markings or pen notes?
                  </label>
                </div>

                <div style={{ marginTop: 'var(--space-3)' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Specific defect notes (e.g. Chapter 3 has light yellow highlighting)"
                    value={defectDescription}
                    onChange={(e) => setDefectDescription(e.target.value)}
                    style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
              </div>

              {/* Photos Manager */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Book Photos (Front Cover, Spine & Defect areas)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                  {photoUrls.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                      <img src={url} alt={`Book view ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="Add Image URL (or use default cover photo)"
                    value={newPhotoInput}
                    onChange={(e) => setNewPhotoInput(e.target.value)}
                    style={{ flex: 1, borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="btn btn-secondary"
                    style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  >
                    Add Photo
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}
                >
                  <span>Pricing & Pickup</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & PICKUP ADDRESS */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Step 3: Pricing & Pickup Address
              </h2>

              {/* Price Calculation Box */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                border: '1px solid var(--border-subtle)'
              }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Your Asking Price (INR) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', maxWidth: '240px' }}>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    className="input-field"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value ? Number(e.target.value) : '')}
                    min={10}
                    required
                    style={{ borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-lg)', fontWeight: 700 }}
                  />
                </div>

                {/* Net Earnings Breakdown */}
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Listing Asking Price:</span>
                    <span>₹{priceNum}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Platform Commission (10%):</span>
                    <span>-₹{platformCommission}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>GST on Commission (18% of fee):</span>
                    <span>-₹{gstOnCommission}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                    <span>Estimated Net Payout (T+3 Escrow):</span>
                    <span>₹{estimatedPayout}</span>
                  </div>
                </div>
              </div>

              {/* Pickup Address Selection */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    Select Doorstep Pickup Address in Bidar *
                  </label>
                  <Link to="/profile" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    + Manage Addresses
                  </Link>
                </div>

                {addresses.length === 0 ? (
                  <div style={{
                    padding: 'var(--space-4)',
                    backgroundColor: '#FEF3C7',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    color: '#92400E'
                  }}>
                    No saved address found. Please add a Bidar pickup address in your <Link to="/profile" style={{ fontWeight: 700, textDecoration: 'underline' }}>Profile</Link> first.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          border: selectedAddressId === addr.id ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                          backgroundColor: selectedAddressId === addr.id ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="pickup_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div style={{ fontSize: 'var(--text-xs)' }}>
                          <strong>{addr.full_name}</strong> — {addr.address_line1}, {addr.city} (PIN {addr.pincode})
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                  style={{ borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitListing}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', padding: '10px 24px' }}
                >
                  {submitting ? 'Publishing Listing...' : 'Publish Listing Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
