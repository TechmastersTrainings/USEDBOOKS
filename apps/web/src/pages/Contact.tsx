import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', maxWidth: '960px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>Contact BookLoop Support</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: '580px', margin: '0 auto' }}>
          Have a question about book delivery in Bidar or need help with a listing? Our team is here to assist.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 'var(--space-6)',
        alignItems: 'start'
      }}>
        {/* Contact Info Card */}
        <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Get in Touch</h2>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <MapPin size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Registered Office</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                BookLoop Technologies Pvt. Ltd.<br />
                Plot No. 12, Guru Nanak Nagar, Bidar,<br />
                Karnataka - 585401, India
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Mail size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Email Inquiries</div>
              <a href="mailto:support@bookloop.in" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                support@bookloop.in
              </a>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Typical response within 2 hours
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Phone size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Customer Care Helpline</div>
              <a href="tel:+918482200110" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                +91 8482 200 110
              </a>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Monday to Saturday, 9:00 AM - 7:00 PM IST
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Send us a Message</h2>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
              <CheckCircle2 size={40} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>Message Received!</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Thank you for reaching out. A support representative will email you back shortly at <strong>{formData.email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="contact-name">Your Full Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="contact-email">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="e.g. ramesh@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="contact-subject">Topic *</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Order Delivery Status in Bidar"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="contact-msg">Message *</label>
                <textarea
                  id="contact-msg"
                  required
                  rows={4}
                  className="input-field"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>
                <Send size={16} />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
