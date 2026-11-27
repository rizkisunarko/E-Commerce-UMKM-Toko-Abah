import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AUTH_MESSAGE_KEY } from '../services/api';
import storeBanner from '../assets/store-banner.jpg';
import './LoginPage.css';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/produk';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(() => {
    try {
      const msg = sessionStorage.getItem(AUTH_MESSAGE_KEY);
      if (msg) {
        sessionStorage.removeItem(AUTH_MESSAGE_KEY);
        return msg;
      }
    } catch {
      // abaikan
    }
    return location.state?.authMessage || '';
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.authMessage) {
      setFormError(location.state.authMessage);
    }
  }, [location.state]);

  // Jika pengguna sudah login, langsung alihkan
  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi sebelum kirim: periksa kolom kosong
    const nextErrors = {};
    if (!username.trim()) {
      nextErrors.username = 'Kolom ini wajib diisi';
    }
    if (!password) {
      nextErrors.password = 'Kolom ini wajib diisi';
    }

    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setFormError('Nama pengguna atau kata sandi salah. Periksa kembali huruf besar, kecil, atau spasi.');
      } else {
        setFormError(err.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isUsernameValid = username.trim().length > 0 && !errors.username;

  return (
    <div className="login-wrapper">
      {/* Ambient organic gradient blobs */}
      <div className="login-ambient-blob-1" aria-hidden="true" />
      <div className="login-ambient-blob-2" aria-hidden="true" />

      {/* Main Container */}
      <div className="login-main-container">
        {/* Toko Abah Header Branding */}
        <div className="login-header-branding">
          <div className="login-brand-icon-box">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 4h16v2H4V4zm16 3H4l-1 5v2h1v6h16v-6h1v-2l-1-5zM6 18v-4h12v4H6zm11-6H7l.6-3h8.8l.6 3z" />
            </svg>
          </div>
          <div className="login-brand-title-line">
            <span className="login-brand-title">Toko Abah</span>
            <span className="login-brand-tag">POS v2.4</span>
          </div>
          <p className="login-brand-desc">Sembako &amp; Kebutuhan Harian Grosir</p>
        </div>

        {/* Auth Card */}
        <div className="login-auth-card">
          {/* Top Decorative Micro-Accent Line */}
          <div className="login-top-accent-line" />

          {/* Card Banner Header */}
          <div className="login-card-banner-wrap">
            <img src={storeBanner} alt="Toko Abah Banner" className="login-card-banner-img" />
            <div className="login-card-banner-overlay">
              <div className="login-card-banner-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="login-banner-store-icon">
                  <path d="M4 4h16v2H4V4zm16 3H4l-1 5v2h1v6h16v-6h1v-2l-1-5zM6 18v-4h12v4H6zm11-6H7l.6-3h8.8l.6 3z" />
                </svg>
                <span>Cabang Utama • Siap Melayani</span>
              </div>
            </div>
          </div>

          {/* Card Title & Context */}
          <div className="login-card-intro">
            <h1 className="login-card-main-heading">Masuk ke Toko Abah</h1>
            <p className="login-card-sub-text">
              {submitting
                ? 'Kredensial terverifikasi. Menyiapkan sesi kasir & menyelaraskan data transaksi...'
                : 'Portal akses aman khusus Admin Gudang & Kasir Toko Abah.'}
            </p>
          </div>

          {/* Login Form */}
          <form className="login-actual-form" onSubmit={handleSubmit} noValidate>
            {/* Field 1: Email / Username */}
            <div className="login-form-field">
              <div className="login-field-label-row">
                <label htmlFor="usernameInput" className="login-field-label">
                  Email atau Nama Pengguna
                </label>
                <span className="login-wajib-badge">Wajib</span>
              </div>
              <div className={`login-input-shell${errors.username ? ' error' : ''}`}>
                <span className="login-input-left-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="usernameInput"
                  type="text"
                  autoComplete="username"
                  className="login-text-input"
                  placeholder="admin@tokoabah.id atau pakabah"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  aria-invalid={Boolean(errors.username)}
                />
                {isUsernameValid && (
                  <span className="login-input-valid-icon" title="Format valid">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d631b">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.username && (
                <span className="login-field-error-msg">{errors.username}</span>
              )}
            </div>

            {/* Field 2: Password */}
            <div className="login-form-field">
              <div className="login-field-label-row">
                <label htmlFor="passwordInput" className="login-field-label">
                  Kata Sandi
                </label>
                <span className="login-forgot-help" style={{ fontSize: '12px', color: '#6b7280' }}>
                  Hubungi admin toko untuk mengatur ulang kata sandi.
                </span>
              </div>
              <div className={`login-input-shell${errors.password ? ' error' : ''}`}>
                <span className="login-input-left-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="login-text-input"
                  placeholder="Masukkan kata sandi kasir"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="login-toggle-pw-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="login-field-error-msg">{errors.password}</span>
              )}
            </div>

            {/* Error Alert Banner */}
            {formError && (
              <div className="login-alert-box error" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ba1a1a" className="login-alert-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <div className="login-alert-text">
                  <span className="login-alert-title">Gagal Masuk</span>
                  <span className="login-alert-desc">{formError}</span>
                </div>
              </div>
            )}

            {/* Success Alert Banner during submitting */}
            {submitting && (
              <div className="login-alert-box success" role="status">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d631b" className="login-alert-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <div className="login-alert-text">
                  <span className="login-alert-title">Autentikasi Berhasil</span>
                  <span className="login-alert-desc">Kredensial valid. Memuat data sesi kasir dan mengalihkan ke dashboard...</span>
                </div>
              </div>
            )}

            {/* Active Session Row */}
            <div className="login-options-bar" style={{ justifyContent: 'flex-end' }}>
              <div className="login-active-session-tag">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>Sesi Kasir Aktif</span>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="login-primary-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="login-spin-svg" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                  </svg>
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Kasir</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </>
              )}
            </button>

            {/* Progress Bar when submitting */}
            {submitting && (
              <div className="login-submit-progress-block">
                <div className="login-progress-text-row">
                  <span className="login-progress-msg">
                    <span className="login-pulse-dot" /> Mengalihkan ke Dashboard Stok...
                  </span>
                  <span className="login-progress-pct">85%</span>
                </div>
                <div className="login-progress-track">
                  <div className="login-progress-fill" style={{ width: '85%' }} />
                </div>
              </div>
            )}
          </form>

          {/* Quick Terminal Shift Info Box */}
          <div className="login-terminal-shift-box">
            <div className="login-terminal-shift-left">
              <span className="login-terminal-live-dot" />
              <div className="login-terminal-text-col">
                <span className="login-terminal-heading">Terminal POS 01 - Beras &amp; Minyak</span>
                <span className="login-terminal-time">Shift Siang: 12.00 - 21.00 WIB</span>
              </div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="login-terminal-pos-icon">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="login-page-footer">
          <div className="login-footer-security-row">
            <span className="login-footer-bold">Toko Abah Sistem Inventaris &amp; Kasir</span>
            <span>•</span>
            <span>Versi 2.4.2-prod</span>
            <span>•</span>
            <span className="login-footer-ssl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Keamanan Terenkripsi SSL 256-bit
            </span>
          </div>
          <p className="login-footer-copyright">
            © 2024 Toko Abah Nusantara. Hak cipta dilindungi undang-undang.
          </p>
        </footer>

        {/* Mock Credential Hint if enabled */}
        {USE_MOCK && (
          <div className="login-mock-credential-box">
            Mode data tiruan (Mock Server). Akun uji: <strong>admin</strong> / admin123, <strong>pegawai</strong> / pegawai123
          </div>
        )}
      </div>
    </div>
  );
}
