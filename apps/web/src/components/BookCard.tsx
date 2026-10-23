import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck } from 'lucide-react';

export interface BookCardProps {
  id: string;
  title: string;
  authors: string;
  price: number;
  originalMrp?: number;
  conditionGrade: 'like_new' | 'very_good' | 'good' | 'acceptable' | 'heavily_used';
  coverImageUrl?: string;
  sellerCity: string;
  categoryName?: string;
  savingsPercent?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  authors,
  price,
  originalMrp,
  conditionGrade,
  coverImageUrl,
  sellerCity,
  categoryName
}) => {
  const getConditionBadge = (grade: string) => {
    switch (grade) {
      case 'like_new':
        return <span className="badge badge-like-new">Like New</span>;
      case 'very_good':
        return <span className="badge badge-very-good">Very Good</span>;
      case 'good':
        return <span className="badge badge-good">Good</span>;
      case 'acceptable':
        return <span className="badge badge-acceptable">Acceptable</span>;
      case 'heavily_used':
        return <span className="badge badge-heavily-used">Heavily Used</span>;
      default:
        return <span className="badge badge-good">Pre-loved</span>;
    }
  };

  const discount = originalMrp && originalMrp > price
    ? Math.round(((originalMrp - price) / originalMrp) * 100)
    : null;

  return (
    <Link to={`/book/${id}`} className="card card-hover book-card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      textDecoration: 'none',
      color: 'inherit'
    }}>
      {/* Book Cover Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-subtle)',
        marginBottom: 'var(--space-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loading="lazy"
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            textAlign: 'center',
            height: '100%',
            background: 'linear-gradient(145deg, #F6F3ED 0%, #EFEBE4 100%)',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 'var(--text-base)', lineHeight: 1.3 }}>
              {title}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              {authors}
            </span>
          </div>
        )}

        {/* Condition Badge Overlay */}
        <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
          {getConditionBadge(conditionGrade)}
        </div>

        {/* Discount Badge */}
        {discount && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--text-inverse)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Book Details */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {categoryName && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
            {categoryName}
          </span>
        )}
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 'var(--space-1)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-3)'
        }}>
          By {authors}
        </p>

        {/* Pricing & Location */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 'var(--text-lg)',
                color: 'var(--text-primary)'
              }}>
                ₹{price}
              </span>
              {originalMrp && (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through'
                }}>
                  ₹{originalMrp}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <MapPin size={11} />
              <span>{sellerCity}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-primary)',
            fontWeight: 500
          }}>
            <ShieldCheck size={14} />
            <span>Verified</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
