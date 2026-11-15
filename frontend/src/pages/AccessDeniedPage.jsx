import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AccessDeniedPage.css';

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleName = user?.role === 'admin'
    ? 'Admin'
    : user?.role === 'pegawai'
      ? 'Pegawai'
      : (user?.role || 'Pengguna');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="akses-page-wrapper">
      <main className="akses-main-container">
        <div className="akses-card">
          {/* Decorative blur spots */}
          <div className="akses-blur-top" aria-hidden="true" />
          <div className="akses-blur-bottom" aria-hidden="true" />

          {/* Lencana atas */}
          <div className="akses-top-badge">
            <svg
              className="akses-top-badge-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="akses-top-badge-brand">TOKO ABAH</span>
            <span className="akses-top-badge-dot" aria-hidden="true" />
            <span className="akses-top-badge-sub">Sistem POS &amp; Inventaris</span>
          </div>

          {/* Ikon perisai dengan gembok kecil */}
          <div className="akses-icon-container">
            <div className="akses-shield-outer">
              <div className="akses-shield-inner">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <div className="akses-lock-circle">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {/* Judul & label merah */}
          <h1 className="akses-heading">Akses Ditolak</h1>

          <div className="akses-warning-pill">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            <span>Halaman ini hanya dapat dibuka oleh admin</span>
          </div>

          {/* Kotak info */}
          <div className="akses-info-box">
            <div className="akses-info-content">
              <svg
                className="akses-info-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div className="akses-info-text-col">
                <p className="akses-status-line">
                  Status Akun: <span className="akses-status-role">{roleName}</span>
                </p>
                <p className="akses-status-desc">
                  Akun Anda saat ini memiliki peran sebagai {roleName}. Fitur laporan keuangan, riwayat transaksi lengkap, dan konfigurasi toko memerlukan izin akun Admin.
                </p>
              </div>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="akses-actions-group">
            <button
              type="button"
              className="akses-btn-primary"
              onClick={() => navigate('/kasir')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="7" cy="15" r="1" />
                <circle cx="12" cy="15" r="1" />
              </svg>
              <span>Kembali ke Kasir</span>
            </button>
          </div>

          {/* Tautan keluar akun */}
          <div className="akses-logout-row">
            <button
              type="button"
              className="akses-btn-logout"
              onClick={handleLogout}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
