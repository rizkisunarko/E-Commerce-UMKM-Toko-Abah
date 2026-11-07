import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      <div className="sidebar-brand">Toko Abah</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
      <div className="sidebar-spacer" />
      <div className="sidebar-user">
        {user?.nama} ({user?.role})
      </div>
      <button type="button" className="sidebar-button" onClick={handleLogout}>
        Keluar
      </button>
    </aside>
  );
}
