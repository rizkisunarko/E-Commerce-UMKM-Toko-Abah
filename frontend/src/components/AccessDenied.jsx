import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon-box">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="access-denied-badge">403 Dilarang</div>
        <h1 className="access-denied-title">Akses ditolak</h1>
        <p className="access-denied-desc">
          Peran Anda tidak diizinkan membuka halaman ini. Halaman ini hanya dapat diakses oleh akun dengan peran Administrator.
        </p>
        <button
          type="button"
          className="btn-access-denied"
          onClick={() => navigate('/kasir')}
        >
          Kembali ke Halaman Kasir
        </button>
      </div>
    </div>
  );
}

