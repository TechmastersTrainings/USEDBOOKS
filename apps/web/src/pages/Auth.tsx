import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>(initialMode === 'register' ? 'password' : 'otp');
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  
  // OTP states
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [fullNameForOtp, setFullNameForOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);

  // Password login/reg states
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  // Status & errors
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send OTP.');
      }
      setOtpSent(true);
      setCooldown(data.cooldown_seconds || 60);
      if (data.sandbox_otp) {
        setSandboxOtp(data.sandbox_otp);
        setOtpCode(data.sandbox_otp); // Auto-fill in development for fast testing
      }
      setSuccess('OTP sent via SMS. Enter the 6-digit code below.');
    } catch (err: any) {
      setError(err.message || 'Error sending OTP. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          otp: otpCode.trim(),
          full_name: fullNameForOtp.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Incorrect or expired OTP.');
      }
      login(data.access_token, data.user);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const payload: any = {
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          password: password,
          role: role,
        };
        if (identifier && /^[6-9]\d{9}$/.test(identifier.trim())) {
          payload.phone_number = identifier.trim();
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Registration failed.');
        }
        login(data.access_token, data.user);
        navigate('/profile');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Invalid email/phone or password.');
        }
        login(data.access_token, data.user);
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

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
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        {/* Header Banner */}
        <div style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--text-inverse)',
          padding: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'var(--text-2xl)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            marginBottom: 'var(--space-2)'
          }}>
            {isRegistering ? 'Join BookLoop' : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>
            India&apos;s verified peer-to-peer used book community
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('otp'); setError(null); }}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              border: 'none',
              background: activeTab === 'otp' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'otp' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              borderBottom: activeTab === 'otp' ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            Mobile OTP Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setError(null); }}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              border: 'none',
              background: activeTab === 'password' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'password' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              borderBottom: activeTab === 'password' ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer'
            }}
          >
            {isRegistering ? 'Register with Email' : 'Email & Password'}
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: 'var(--space-6)' }}>
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

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              backgroundColor: '#F0FDF4',
              color: '#166534',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-sm)'
            }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'otp' ? (
            /* OTP Form */
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      Mobile Phone Number
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                      }}>
                        +91
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        className="input-field"
                        placeholder="10-digit number (e.g. 9876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
                      />
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      We will dispatch an SMS with a 6-digit verification code.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || phone.length !== 10}
                    style={{ width: '100%', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}
                  >
                    {loading ? 'Sending Code...' : 'Request OTP'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      Enter 6-Digit OTP sent to +91 {phone}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="input-field"
                      placeholder="6-digit OTP (e.g. 123456)"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xl)',
                        letterSpacing: '0.25em',
                        textAlign: 'center'
                      }}
                    />
                    {sandboxOtp && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        [Sandbox Mode]: Test OTP is {sandboxOtp}
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      Your Full Name (If first-time reader)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ramesh Kulkarni"
                      value={fullNameForOtp}
                      onChange={(e) => setFullNameForOtp(e.target.value)}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || otpCode.length < 4}
                    style={{ width: '100%', borderRadius: 'var(--radius-sm)', justifyContent: 'center', marginBottom: 'var(--space-3)' }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Change Phone Number
                    </button>
                    {cooldown > 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>Resend in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Password / Email Form */
            <form onSubmit={handlePasswordAuth}>
              {isRegistering && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Anjali Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isRegistering}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {isRegistering ? 'Email Address' : 'Email or Mobile Phone'}
                </label>
                <input
                  type={isRegistering ? 'email' : 'text'}
                  className="input-field"
                  placeholder={isRegistering ? 'reader@example.com' : 'Email or 10-digit phone number'}
                  value={isRegistering ? email : identifier}
                  onChange={(e) => isRegistering ? setEmail(e.target.value) : setIdentifier(e.target.value)}
                  required
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              {isRegistering && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    Mobile Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="10-digit number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              {isRegistering && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    Account Intent
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="account_role"
                        value="buyer"
                        checked={role === 'buyer'}
                        onChange={() => setRole('buyer')}
                      />
                      Buyer (Buy used books)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="account_role"
                        value="seller"
                        checked={role === 'seller'}
                        onChange={() => setRole('seller')}
                      />
                      Seller (Declutter & sell)
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', borderRadius: 'var(--radius-sm)', justifyContent: 'center', marginBottom: 'var(--space-3)' }}
              >
                {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                {isRegistering ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegistering(false); setError(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New to BookLoop?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegistering(true); setError(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Create Free Account
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Privacy & Trust Safeguards */}
          <div style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} color="var(--color-primary)" />
            <span>DPDPA 2023 protected. We never sell or spam your phone number.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
