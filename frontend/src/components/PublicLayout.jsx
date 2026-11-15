import { Link, Outlet } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import './PublicLayout.css';

function PublicHeader() {
  const { count } = useCart();

  return (
    <>
      {/* 1. Pengumuman / Announcement Strip */}
      <div className="katalog-top-strip">
        <div className="katalog-strip-inner">
          <div className="katalog-strip-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Pengiriman cepat radius 3 km &amp; Buka setiap hari (07.00 - 21.00 WIB)</span>
          </div>
          <div className="katalog-strip-right">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Pasar Minggu, Jaksel
            </span>
            <a
              className="katalog-strip-link"
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              CS WhatsApp: 0812-3456-7890
            </a>
          </div>
        </div>
      </div>

      {/* 2. Header Utama (Sticky) */}
      <header className="katalog-main-header">
        <div className="katalog-header-inner">
          {/* Logo & Identitas Toko */}
          <Link to="/katalog" className="katalog-brand-group">
            <div className="katalog-brand-logo-badge">TA</div>
            <div className="katalog-brand-text">
              <span className="katalog-brand-title">Toko Abah</span>
              <span className="katalog-brand-subtitle">Grosir &amp; Sembako Segar</span>
            </div>
          </Link>

          {/* Navigasi Menu */}
          <nav className="katalog-header-nav" aria-label="Menu Utama">
            <Link to="/katalog" className="katalog-nav-link active">
              Katalog
            </Link>
            <a href="#katalog-grid" className="katalog-nav-link">
              Promo Spesial
            </a>
            <a href="#katalog-grid" className="katalog-nav-link">
              Status Pesanan
            </a>
          </nav>

          {/* Tombol Aksi Kanan */}
          <div className="katalog-header-actions">
            <a
              className="katalog-wa-btn"
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              title="Hubungi CS Toko Abah lewat WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Bantuan WA</span>
            </a>

            {/* Keranjang Belanja */}
            <div
              className="katalog-cart-button"
              aria-label={`Keranjang berisi ${count} barang`}
              title={`Keranjang belanja (${count} barang)`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="katalog-cart-badge">{count}</span>
            </div>

            {/* Tombol Login Staf */}
            <Link
              to="/login"
              className="katalog-login-btn"
              title="Masuk ke Akun Staf / Admin"
              aria-label="Login Staf"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

function PublicFooter() {
  return (
    <footer className="katalog-footer">
      <div className="katalog-footer-inner">
        <div className="katalog-footer-grid">
          {/* Kolom 1: Profil */}
          <div className="katalog-footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="katalog-brand-logo-badge" style={{ width: 34, height: 34, fontSize: 14 }}>TA</div>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#15803d' }}>Toko Abah</span>
            </div>
            <p>
              Penyedia sembako lengkap, segar, dan terjangkau untuk kebutuhan harian keluarga dan usaha warung di lingkungan Anda.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 600, fontSize: 13, marginTop: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Pilihan Utama Warga</span>
            </div>
          </div>

          {/* Kolom 2: Lokasi & Jam Buka */}
          <div className="katalog-footer-col">
            <h3>Lokasi &amp; Jam Buka</h3>
            <div className="katalog-footer-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Jl. Raya Pasar Minggu No. 42, RT 03/RW 01, Jakarta Selatan</span>
            </div>
            <div className="katalog-footer-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Setiap Hari: 07:00 - 21:00 WIB</span>
            </div>
          </div>

          {/* Kolom 3: Metode Pembayaran */}
          <div className="katalog-footer-col">
            <h3>Metode Pembayaran</h3>
            <p>Transaksi aman, mudah, dan fleksibel langsung di tempat atau antar ke rumah:</p>
            <div className="katalog-payment-chips">
              <span className="katalog-payment-chip">QRIS</span>
              <span className="katalog-payment-chip">Tunai / COD</span>
              <span className="katalog-payment-chip">Transfer Bank</span>
            </div>
          </div>

          {/* Kolom 4: Layanan Pelanggan */}
          <div className="katalog-footer-col">
            <h3>Layanan Pelanggan</h3>
            <p>Perlu bantuan pesanan grosir partai besar atau informasi ketersediaan stok?</p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 600, fontSize: 13, textDecoration: 'none', marginTop: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>WhatsApp: 0812-3456-7890</span>
            </a>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Melayani antar jemput pesanan area sekitar pasar</span>
          </div>
        </div>

        <div className="katalog-footer-bottom">
          <p>&copy; 2024 Toko Abah. Grosir &amp; Sembako Segar. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

// Kerangka halaman pelanggan: tanpa sidebar, tanpa login.
export default function PublicLayout() {
  return (
    <CartProvider>
      <div className="katalog-public-wrapper">
        <PublicHeader />
        <main className="katalog-public-main">
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </CartProvider>
  );
}

