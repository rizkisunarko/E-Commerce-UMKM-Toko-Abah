import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    <div className="login-container">
      {/* Header Brand di Atas Kartu */}
      <div className="login-brand-header">
        <div className="login-brand-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l2-5h14l2 5" />
            <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
            <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
            <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          </svg>
        </div>
        <div className="login-brand-title-row">
          <span className="login-brand-name">Toko Abah</span>
          <span className="login-brand-badge">POS v2.4</span>
        </div>
        <div className="login-brand-subtitle">Sembako & Kebutuhan Harian Grosir</div>
      </div>

      {/* Kartu Utama Login */}
      <div className="login-card-wrapper">
        {/* Garis Aksen Ganda (Hijau & Oranye) */}
        <div className="login-card-top-stripe" />

        <div className="login-card-body">
          {/* Foto Banner Toko */}
          <div className="login-store-banner">
            <img src={storeBanner} alt="Toko Abah Warung Sembako" />
            <div className="login-banner-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l2-5h14l2 5" />
                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
              </svg>
              <span>
                {submitting ? 'Cabang Utama • Siap Melayani' : 'Toko Abah • Sembako & Kebutuhan Harian'}
              </span>
            </div>
          </div>

          {/* Judul & Keterangan Kartu */}
          <div className="login-card-header">
            <h1 className="login-card-title">Masuk ke Toko Abah</h1>
            <p className="login-card-description">
              {submitting
                ? 'Kredensial terverifikasi. Menyiapkan sesi kasir & menyelaraskan data transaksi...'
                : 'Portal akses aman khusus Admin Gudang & Kasir Toko.'}
            </p>
          </div>

          {/* Form Login */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Kolom 1: Email atau Nama Pengguna */}
            <div className="login-form-group">
              <div className="login-form-group-header">
                <label htmlFor="username-input" className="login-label">
                  Email atau Nama Pengguna
                </label>
                <span className="login-badge-required">Wajib</span>
              </div>
              <div className={`login-input-box${errors.username ? ' has-error' : ''}`}>
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="username-input"
                  type="text"
                  className="login-input"
                  placeholder="pakabah"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) {
                      setErrors((prev) => ({ ...prev, username: '' }));
                    }
                  }}
                  autoComplete="username"
                  aria-invalid={Boolean(errors.username)}
                />
                {isUsernameValid && (
                  <span className="login-input-action-btn" title="Format valid">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.username && (
                <span className="login-field-error-text">{errors.username}</span>
              )}
            </div>

            {/* Kolom 2: Kata Sandi */}
            <div className="login-form-group">
              <div className="login-form-group-header">
                <label htmlFor="password-input" className="login-label">
                  Kata Sandi
                </label>
                <a
                  href="#lupa-sandi"
                  className="login-forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Silakan hubungi administrator toko untuk mereset kata sandi Anda.');
                  }}
                >
                  Lupa Kata Sandi?
                </a>
              </div>
              <div className={`login-input-box${errors.password ? ' has-error' : ''}`}>
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="login-input-action-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="login-field-error-text">{errors.password}</span>
              )}
            </div>

            {/* Pesan Kesalahan Form (Error Alert) */}
            {formError && (
              <div className="login-alert login-alert-error" role="alert">
                <span className="login-alert-error-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </span>
                <div className="login-alert-content">
                  <div className="login-alert-title">Gagal Masuk</div>
                  <p className="login-alert-desc">{formError}</p>
                </div>
              </div>
            )}

            {/* Alert Sukses Saat Submitting */}
            {submitting && (
              <div className="login-alert login-alert-success" role="status">
                <span className="login-alert-success-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
                <div className="login-alert-content">
                  <div className="login-alert-title">Autentikasi Berhasil</div>
                  <p className="login-alert-desc">Kredensial valid. Memuat data sesi kasir dan mengalihkan ke dashboard...</p>
                </div>
              </div>
            )}

            {/* Baris Opsi "Ingat saya" & "Sesi Kasir Aktif" */}
            <div className="login-options-row">
              <label className="login-remember-label">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
              <div className="login-session-active">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>Sesi Kasir Aktif</span>
              </div>
            </div>

            {/* Tombol Submit Masuk */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="login-spinner" />
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

            {/* Indikator Progress Saat Submitting */}
            {submitting && (
              <div className="login-progress-section">
                <div className="login-progress-header">
                  <span className="login-progress-text">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    Mengalihkan ke Dashboard Stok...
                  </span>
                  <span className="login-progress-percent">85%</span>
                </div>
                <div className="login-progress-track">
                  <div className="login-progress-bar" style={{ width: '85%' }} />
                </div>
              </div>
            )}
          </form>

          {/* Kotak Info Terminal POS Bawah */}
          <div className="login-terminal-box">
            <div className="login-terminal-left">
              <span className="login-terminal-dot" />
              <div className="login-terminal-info">
                <span className="login-terminal-title">Terminal POS 01 - Beras & Minyak</span>
                <span className="login-terminal-subtitle">Shift Siang: 12.00 - 21.00 WIB</span>
              </div>
            </div>
            <span className="login-terminal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="6" y1="8" x2="6" y2="8" />
                <line x1="10" y1="8" x2="10" y2="8" />
                <line x1="14" y1="8" x2="14" y2="8" />
                <line x1="18" y1="8" x2="18" y2="8" />
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Petunjuk Akun Uji Mode Mock */}
      {USE_MOCK && (
        <div className="login-mock-hint">
          Mode data tiruan (Mock Server). Akun uji: <strong>admin</strong> / admin123, <strong>pegawai</strong> / pegawai123
        </div>
      )}
    </div>
  );
}
