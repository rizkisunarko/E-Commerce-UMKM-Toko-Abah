import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { itemIssue, useCart } from '../context/CartContext';
import useCartCheck from '../hooks/useCartCheck';
import { formatRupiah } from '../utils/format';

import berasImg from '../assets/Beras.jpg';
import minyakImg from '../assets/Minyak-Goreng.jpg';
import gulaImg from '../assets/Gula-Pasir.jpg';
import telurImg from '../assets/Telur Ayam.jpg';
import mieImg from '../assets/Mie-Instan.jpg';
import kopiImg from '../assets/Kopi-Sachet.jpg';

function getProductThumbnail(nama = '') {
  const n = (nama || '').toLowerCase();
  if (n.includes('beras')) return berasImg;
  if (n.includes('minyak')) return minyakImg;
  if (n.includes('gula')) return gulaImg;
  if (n.includes('telur')) return telurImg;
  if (n.includes('mie') || n.includes('sedap') || n.includes('indomie')) return mieImg;
  if (n.includes('kopi') || n.includes('kapal')) return kopiImg;
  return null;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, count, total, hasIssue, setJumlah, removeItem, clear } = useCart();
  const { checking, error, recheck } = useCartCheck();

  // 1. TAMPILAN KERANJANG KOSONG
  if (items.length === 0) {
    return (
      <div className="ko-page-container">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="ko-breadcrumb">
          <Link to="/katalog" className="ko-breadcrumb-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Beranda</span>
          </Link>
          <span className="ko-breadcrumb-separator" aria-hidden="true">/</span>
          <span className="ko-breadcrumb-current">Keranjang Belanja</span>
        </nav>

        {/* Empty State Card */}
        <div className="ko-empty-card">
          <div className="ko-empty-visual-motif">
            <div className="ko-empty-icon-circle">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
                <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
              </svg>
            </div>
            <span className="ko-empty-badge">0 Item</span>
          </div>

          <div className="ko-empty-pill">
            <span className="ko-empty-pill-dot" aria-hidden="true" />
            <span>Daftar Belanja Anda</span>
          </div>

          <h1 className="ko-empty-title">Keranjang Belanja Masih Kosong</h1>

          <p className="ko-empty-desc">
            Wah, belum ada sembako atau kebutuhan dapur yang Anda masukkan ke keranjang belanja.
            Yuk, penuhi kebutuhan dapur keluarga dari <strong>Toko Abah</strong> dengan harga grosir!
          </p>

          <div className="ko-empty-actions">
            <Link to="/katalog" className="ko-btn ko-btn-primary ko-btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Lihat Katalog Sembako</span>
            </Link>
          </div>

          {/* Value Props */}
          <div className="ko-empty-features">
            <div className="ko-empty-feature-item">
              <div className="ko-feature-icon-box text-green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="ko-feature-text">
                <span className="ko-feature-title">Jaminan Mutu</span>
                <span className="ko-feature-sub">Beras pulen &amp; higienis</span>
              </div>
            </div>

            <div className="ko-empty-feature-item">
              <div className="ko-feature-icon-box text-orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="ko-feature-text">
                <span className="ko-feature-title">Harga Pasar</span>
                <span className="ko-feature-sub">Tarif grosir hemat</span>
              </div>
            </div>

            <div className="ko-empty-feature-item">
              <div className="ko-feature-icon-box text-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="ko-feature-text">
                <span className="ko-feature-title">Ambil di Toko</span>
                <span className="ko-feature-sub">Tanpa antre &amp; Rp 0 ongkir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. TAMPILAN KERANJANG BERISI
  const issueCount = items.filter((it) => itemIssue(it)).length;
  const blocked = checking || Boolean(error) || hasIssue;

  // Sesuaikan jumlah ke stok yang tersedia, atau hapus bila stok habis
  function fixItem(it) {
    if (it.stok <= 0) removeItem(it.id);
    else setJumlah(it.id, it.stok);
  }

  return (
    <div className="ko-page-container">
      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="ko-breadcrumb">
        <Link to="/katalog" className="ko-breadcrumb-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Beranda</span>
        </Link>
        <span className="ko-breadcrumb-separator" aria-hidden="true">/</span>
        <span className="ko-breadcrumb-current">Keranjang Belanja</span>
      </nav>

      {/* Header Meta */}
      <div className="ko-header-meta">
        <div>
          <h1 className="ko-page-title">Keranjang Belanja Anda</h1>
          <p className="ko-page-subtitle">{items.length} jenis produk sembako siap dicheckout</p>
        </div>
        <div className="ko-location-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Ambil di Toko: Jalan Raya Telang-Kamal</span>
        </div>
      </div>

      {/* Banner Peringatan Stok Bermasalah */}
      {issueCount > 0 && (
        <div className="ko-alert-warning" role="alert">
          <div className="ko-alert-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="ko-alert-content">
            <div className="ko-alert-title-row">
              <h2 className="ko-alert-title">Perhatian: Ketersediaan Stok Berubah</h2>
              <span className="ko-alert-tag">Perlu Tindakan</span>
            </div>
            <p className="ko-alert-desc">
              {issueCount} barang melebihi stok yang tersedia di rak Toko Abah. Harap sesuaikan jumlah barang sebelum melanjutkan ke proses checkout.
            </p>
          </div>
        </div>
      )}

      {/* Banner Kesalahan Pemeriksaan API */}
      {error && (
        <div className="ko-alert-warning" role="alert">
          <div className="ko-alert-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="ko-alert-content">
            <p className="ko-alert-desc">
              {error}{' '}
              <button type="button" className="ko-link-retry" onClick={recheck}>Coba lagi</button>
            </p>
          </div>
        </div>
      )}

      {/* Grid 2-Kolom: Daftar Produk (Kiri) & Ringkasan (Kanan) */}
      <div className="ko-grid">
        {/* Kolom Kiri: Daftar Produk */}
        <div className="ko-left-col">
          <div className="ko-items-container">
            {items.map((it) => {
              const issue = itemIssue(it);
              const thumb = getProductThumbnail(it.nama);

              return (
                <div key={it.id} className={`ko-item-card${issue ? ' ko-item-error' : ''}`}>
                  <div className="ko-item-row">
                    {/* Thumbnail Produk */}
                    <div className="ko-item-thumb-wrapper">
                      {thumb ? (
                        <img src={thumb} alt={it.nama} className="ko-item-img" />
                      ) : (
                        <div className="ko-thumb" aria-hidden="true">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info Produk */}
                    <div className="ko-item-info">
                      <h3 className="ko-item-name">{it.nama}</h3>
                      <p className="ko-item-price">{formatRupiah(it.harga)}</p>

                      {/* Penanda Masalah Stok */}
                      {issue && (
                        <div className="ko-item-issue-badge" role="alert">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{issue}</span>
                        </div>
                      )}
                    </div>

                    {/* Subtotal & Stepper */}
                    <div className="ko-item-controls">
                      {/* Stepper Jumlah */}
                      <div className="ko-stepper" role="group" aria-label={`Jumlah ${it.nama}`}>
                        <button
                          type="button"
                          className="ko-stepper-btn"
                          aria-label={`Kurangi jumlah ${it.nama}`}
                          disabled={it.jumlah <= 1}
                          onClick={() => setJumlah(it.id, it.jumlah - 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>

                        <span className="ko-stepper-val" aria-label={`Jumlah saat ini ${it.jumlah}`}>
                          {it.jumlah}
                        </span>

                        <button
                          type="button"
                          className="ko-stepper-btn"
                          aria-label={`Tambah jumlah ${it.nama}`}
                          disabled={it.jumlah >= it.stok}
                          onClick={() => setJumlah(it.id, it.jumlah + 1)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="ko-item-subtotal-block">
                        <span className="ko-subtotal-label">Subtotal</span>
                        <span className={`ko-subtotal-val${issue ? ' text-error' : ''}`}>
                          {formatRupiah(it.harga * it.jumlah)}
                        </span>
                      </div>

                      {/* Aksi Baris: Tombol Sesuaikan & Hapus */}
                      <div className="ko-item-actions-row">
                        {issue && (
                          <button
                            type="button"
                            className="ko-btn-fix"
                            onClick={() => fixItem(it)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>{it.stok <= 0 ? 'Hapus barang habis' : `Ubah ke ${it.stok}`}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="ko-btn-remove"
                          onClick={() => removeItem(it.id)}
                          aria-label={`Hapus ${it.nama} dari keranjang`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tombol Aksi di Bawah Daftar Item */}
          <div className="ko-cart-bottom-actions">
            <Link to="/katalog" className="ko-btn-back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Lanjut Belanja Sembako Lainnya</span>
            </Link>

            <button type="button" className="ko-btn-clear" onClick={clear}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Kosongkan Keranjang</span>
            </button>
          </div>

          {/* Kartu Komitmen Layanan Toko Abah */}
          <div className="ko-trust-card">
            <div className="ko-trust-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                <path d="M7 21h10a2 2 0 0 0 2-2V9l-7-7-7 7v10a2 2 0 0 0 2 2z" />
              </svg>
            </div>
            <div className="ko-trust-info">
              <h4 className="ko-trust-title">Kebutuhan Grosir untuk Usaha Warung?</h4>
              <p className="ko-trust-desc">
                Pemesanan partai besar sak-sakan dan kardusan dapat langsung dikoordinasikan dengan Abah melalui WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Belanja (Sticky) */}
        <aside className="ko-right-col">
          <div className="ko-summary-card">
            <div className="ko-summary-header">
              <h2 className="ko-summary-title">Ringkasan Belanja</h2>
              <span className="ko-summary-count-badge">{count} barang</span>
            </div>

            <div className="ko-summary-lines">
              <div className="ko-summary-row">
                <span className="ko-summary-label">Subtotal Produk</span>
                <span className="ko-summary-val">{formatRupiah(total)}</span>
              </div>

              <div className="ko-summary-row">
                <span className="ko-summary-label">Ongkos Kirim</span>
                <span className="ko-free-badge">Rp 0 (Ambil di Toko)</span>
              </div>

              <div className="ko-summary-divider" />

              <div className="ko-summary-row ko-summary-total-row">
                <span className="ko-total-label">Total Belanja</span>
                <strong className="ko-total-val">{formatRupiah(total)}</strong>
              </div>
            </div>

            <p className="ko-summary-note">
              Pesanan disiapkan langsung di meja kasir Toko Abah. Bebas antre dan timbangan tersegel pas.
            </p>

            {/* Pesan Kesalahan Stok Terkunci */}
            {hasIssue && (
              <div className="ko-summary-lock-alert" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Checkout terkunci sementara. Sesuaikan stok barang yang bermasalah.</span>
              </div>
            )}

            <Button
              variant="primary"
              className="ko-btn-checkout"
              disabled={blocked}
              onClick={() => navigate('/checkout')}
            >
              {checking ? (
                <span>Memeriksa stok...</span>
              ) : (
                <>
                  <span>Lanjut ke Checkout</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
