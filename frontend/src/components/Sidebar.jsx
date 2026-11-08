import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

// Menu per peran (lihat dokumen desain PPL-18)
const MENU = {
  admin: [
    { to: '/produk', label: 'Produk' },
    { to: '/stok', label: 'Stok' },
  ],
  pegawai: [
    { to: '/stok', label: 'Stok' },
    { to: '/produk', label: 'Produk' },
  ],
};

function getMenuIcon(label) {
  if (label === 'Produk') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sidebar-icon"
      >
        <rect width="20" height="14" x="2" y="7" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (label === 'Stok') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sidebar-icon"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  return null;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = MENU[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      {/* Header Logo & Brand Toko Abah */}
      <div className="sidebar-brand-container">
        <div className="sidebar-brand-logo">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l2-5h14l2 5" />
            <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
            <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
            <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">Toko Abah</span>
          <span className="sidebar-brand-subtitle">Sembako &amp; Kebutuhan Harian</span>
        </div>
      </div>

      {/* Menu Navigasi Produk & Stok */}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {getMenuIcon(item.label)}
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="sidebar-spacer" />

      {/* Info Pengguna */}
      <div className="sidebar-user">
        {user?.nama} ({user?.role})
      </div>

      {/* Tombol Keluar dengan Ikon */}
      <button type="button" className="sidebar-button" onClick={handleLogout}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sidebar-icon"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Keluar</span>
      </button>

      {/* Informasi Sistem Inventaris di Pojok Kiri Bawah */}
      <div className="sidebar-version-card">
        <span className="version-title">Sistem Inventaris</span>
        <span className="version-tag">v2.4 Aktif</span>
      </div>
    </aside>
  );
}
