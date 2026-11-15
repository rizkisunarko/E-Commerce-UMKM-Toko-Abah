import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { catalogService } from '../services/catalogService';
import { formatRupiah } from '../utils/format';
import './CatalogPage.css';

// Import aset gambar lokal sesuai instruksi
import berasImg from '../assets/Beras.jpg';
import minyakImg from '../assets/Minyak-Goreng.jpg';
import gulaImg from '../assets/Gula-Pasir.jpg';
import telurImg from '../assets/Telur Ayam.jpg';
import mieImg from '../assets/Mie-Instan.jpg';
import kopiImg from '../assets/Kopi-Sachet.jpg';
import bannerImg from '../assets/store-banner.jpg';
import screenImg from '../assets/screen.png';

const LIMIT = 12;

function getProductImage(product = {}) {
  const text = ((product.nama || '') + ' ' + (product.kategori || '')).toLowerCase();
  if (text.includes('beras')) return berasImg;
  if (text.includes('minyak')) return minyakImg;
  if (text.includes('gula') || text.includes('manis')) return gulaImg;
  if (text.includes('telur') || text.includes('lauk')) return telurImg;
  if (text.includes('mie') || text.includes('indomie') || text.includes('instan')) return mieImg;
  if (text.includes('kopi') || text.includes('teh')) return kopiImg;
  if (text.includes('sabun') || text.includes('rumah')) return bannerImg;
  return berasImg;
}

function getProductUnit(product = {}) {
  const text = (product.nama || '').toLowerCase();
  if (text.includes('beras')) return '/ sak';
  if (text.includes('minyak')) return '/ pouch';
  if (text.includes('gula')) return '/ bks';
  if (text.includes('telur')) return '/ kg';
  if (text.includes('mie')) return text.includes('dus') ? '/ dus' : '/ bks';
  if (text.includes('kopi')) return text.includes('renceng') ? '/ renceng' : '/ bks';
  if (text.includes('teh')) return '/ kotak';
  if (text.includes('sabun')) return '/ batang';
  if (text.includes('kecap')) return '/ botol';
  return '/ item';
}

function getProductDescription(product = {}) {
  const text = (product.nama || '').toLowerCase();
  if (text.includes('beras')) return 'Kualitas super, pulen harum, putih alami';
  if (text.includes('minyak')) return 'Kemasan pouch higienis, jernih 2x penyaringan';
  if (text.includes('gula')) return 'Manis murni alami dari tebu pilihan nusantara';
  if (text.includes('telur')) return 'Kondisi utuh, cangkang tebal, baru masuk kandang';
  if (text.includes('mie')) return 'Paket hemat lezat gurih, pas dinikmati kapan saja';
  if (text.includes('kopi')) return '10 sachet kopi bubuk plus gula mantap';
  if (text.includes('teh')) return 'Aroma wangi melati alami menyegarkan';
  if (text.includes('sabun')) return 'Bahan pembersih wangi dan higienis';
  if (text.includes('kecap')) return 'Kedelai hitam mallika kental dan gurih harum';
  return 'Produk sembako segar dan terpercaya Toko Abah';
}

function getCategoryIcon(catName = '') {
  const c = String(catName).toLowerCase();
  if (!catName || c === 'semua') {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }
  if (c.includes('beras') || c.includes('tepung') || c.includes('sembako')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
        <line x1="6" y1="21" x2="18" y2="21" />
        <line x1="12" y1="16" x2="12" y2="21" />
      </svg>
    );
  }
  if (c.includes('minyak') || c.includes('bumbu')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v4" />
        <path d="M12 18a6 6 0 0 0 6-6c0-4-6-10-6-10S6 8 6 12a6 6 0 0 0 6 6z" />
      </svg>
    );
  }
  if (c.includes('gula') || c.includes('pemanis')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
        <line x1="8" y1="12" x2="8.01" y2="12" />
        <line x1="16" y1="12" x2="16.01" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (c.includes('telur') || c.includes('lauk')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="13" rx="7" ry="9" />
      </svg>
    );
  }
  if (c.includes('instan') || c.includes('mie')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5" />
        <path d="M4 11h16a1 1 0 0 1 1 1c0 5-3.5 8-9 8s-9-3-9-8a1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  if (c.includes('minuman') || c.includes('kopi') || c.includes('teh')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }
  if (c.includes('rumah') || c.includes('sabun')) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 21h10a2 2 0 0 0 2-2V9l-7-7-7 7v10a2 2 0 0 0 2 2z" />
        <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
      </svg>
    );
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function CatalogPage() {
  const { addItem } = useCart();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');

  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // 1. Muat kategori
  useEffect(() => {
    catalogService
      .categories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // 2. Debounce pencarian 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 3. Muat daftar produk
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    catalogService
      .list({ search, kategori, page, limit: LIMIT })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data || []);
        setTotal(res.pagination?.total ?? (res.data || []).length);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, kategori, page]);

  // 4. Timer pesan singkat penambahan ke keranjang
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleAdd(product) {
    const result = addItem(product);
    if (result === 'ok') setNotice(`${product.nama} ditambahkan ke keranjang`);
    else if (result === 'max') setNotice('Jumlah di keranjang sudah mencapai stok tersedia');
    else setNotice('Stok habis');
  }

  function chooseCategory(value) {
    setKategori(value);
    setPage(1);
  }

  // Pengurutan lokal produk
  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.harga || 0) - Number(b.harga || 0);
    if (sortBy === 'price-desc') return Number(b.harga || 0) - Number(a.harga || 0);
    if (sortBy === 'stock-desc') return Number(b.stok || 0) - Number(a.stok || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="katalog-page-container">
      {/* 1. Hero Feature Banner (Kotak Hijau dengan Background Gambar screen.png) */}
      <section className="katalog-hero-banner">
        <div className="katalog-hero-bg-wrapper" aria-hidden="true">
          <img src={screenImg} alt="Sembako Toko Abah" className="katalog-hero-bg-img" />
          <div className="katalog-hero-bg-overlay" />
        </div>

        <div className="katalog-hero-blur-1" aria-hidden="true" />
        <div className="katalog-hero-blur-2" aria-hidden="true" />

        <div className="katalog-hero-content">
          <div className="katalog-hero-pill">
            <span className="katalog-hero-pulse" aria-hidden="true" />
            <span>SEMBAKO PILIHAN KELUARGA &amp; WARUNG</span>
          </div>

          <h1 className="katalog-hero-title">
            Penuhi Kebutuhan Pokok Harian dengan Harga Grosir Terbaik
          </h1>

          <p className="katalog-hero-desc">
            Beras pulen, minyak goreng higienis, gula pasir, dan aneka sembako langsung diantar cepat dan timbangan pas 100% dari Pasar Minggu.
          </p>

          <div className="katalog-hero-price-tag">
            <span style={{ color: 'rgba(209, 250, 229, 0.8)' }}>Mulai</span>
            <span className="katalog-hero-price-val">Rp 74.000 / sak</span>
            <span style={{ color: 'rgba(209, 250, 229, 0.75)', fontSize: 12 }}>(Beras Ramos Setra 5 kg)</span>
          </div>

          <div className="katalog-hero-actions">
            <a href="#katalog-grid" className="katalog-hero-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Belanja Sekarang</span>
            </a>
            <div className="katalog-hero-badge-tag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Timbangan Tersegel &amp; Pas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bar Kategori Bulat (Circular Category Strip) */}
      <section className="katalog-category-card">
        <div className="katalog-category-header">
          <h3>Kategori Belanja</h3>
          <span>Pilih kategori untuk memfilter</span>
        </div>

        <div className="katalog-category-strip" role="group" aria-label="Filter Kategori">
          {/* Chip Semua */}
          <button
            type="button"
            className="katalog-category-chip"
            onClick={() => chooseCategory('')}
            aria-pressed={kategori === ''}
          >
            <div className={`katalog-chip-circle${kategori === '' ? ' active' : ''}`}>
              {getCategoryIcon('semua')}
            </div>
            <span className={`katalog-chip-label${kategori === '' ? ' active' : ''}`}>Semua</span>
          </button>

          {/* Chip Kategori Dinamis */}
          {categories.map((c) => {
            const name = c.nama ?? c;
            const isSelected = kategori === name;
            return (
              <button
                key={name}
                type="button"
                className="katalog-category-chip"
                onClick={() => chooseCategory(name)}
                aria-pressed={isSelected}
              >
                <div className={`katalog-chip-circle${isSelected ? ' active' : ''}`}>
                  {getCategoryIcon(name)}
                </div>
                <span className={`katalog-chip-label${isSelected ? ' active' : ''}`}>{name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Kartu Promo Highlight */}
      <section className="katalog-promo-row">
        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#ea580c' }}>PROMO MINGGU INI</span>
            <h4 className="katalog-promo-title">Hemat Hingga 20%</h4>
            <p className="katalog-promo-desc">Minyak Goreng Sawit 2 L, kemasan pouch higienis.</p>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>Rp 36.000</span>
              <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>Rp 45.000</span>
            </div>
          </div>
          <div className="katalog-promo-img-wrap">
            <img src={minyakImg} alt="Minyak Goreng" className="katalog-promo-img" />
          </div>
        </div>

        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#15803d' }}>KUALITAS TERJAMIN</span>
            <h4 className="katalog-promo-title">Stok Segar Setiap Hari</h4>
            <p className="katalog-promo-desc">Telur Ayam Ras &amp; Beras Setra langsung dari pemasok.</p>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                Grade A Pasar
              </span>
            </div>
          </div>
          <div className="katalog-promo-img-wrap">
            <img src={telurImg} alt="Telur Ayam" className="katalog-promo-img" />
          </div>
        </div>

        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#0284c7' }}>ANTAR CEPAT</span>
            <h4 className="katalog-promo-title">Gratis Ongkir Toko</h4>
            <p className="katalog-promo-desc">Khusus radius 3 km dengan minimal belanja Rp 100.000.</p>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
                Sampai 30 Menit
              </span>
            </div>
          </div>
          <div className="katalog-promo-icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6h4l3 6.5-1.5 1h-2" />
              <path d="M9 17h6" />
              <path d="M12 9l-3 8" />
            </svg>
          </div>
        </div>
      </section>

      {/* 4. Bar Penawaran Hari Ini / Pencarian & Filter */}
      <section className="katalog-filter-header-bar" id="katalog-grid">
        <div className="katalog-deals-title-wrap">
          <h2 className="katalog-deals-title">Katalog Produk</h2>
          <div className="katalog-timer-badge">
            <span>Berakhir dalam:</span>
            <span className="katalog-timer-digits">06:15:48</span>
          </div>
        </div>

        <div className="katalog-search-filter-wrap">
          <div className="katalog-search-box">
            <span className="katalog-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="katalog-search-input"
              placeholder="Cari produk"
              aria-label="Cari produk"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="katalog-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan produk"
          >
            <option value="popular">Urutkan: Paling Populer</option>
            <option value="price-asc">Harga Termurah</option>
            <option value="price-desc">Harga Tertinggi</option>
            <option value="stock-desc">Stok Tersedia</option>
          </select>
        </div>
      </section>

      {/* Toast Notifikasi (Saat Menambah ke Keranjang) */}
      {notice && (
        <div className="katalog-toast" role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{notice}</span>
        </div>
      )}

      {/* Pesan Kesalahan */}
      {error && (
        <div className="katalog-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* 5. Grid Produk */}
      {loading ? (
        <p className="katalog-muted">Memuat...</p>
      ) : sortedRows.length === 0 ? (
        <p className="katalog-muted">Produk tidak ditemukan.</p>
      ) : (
        <>
          <div className="katalog-product-grid">
            {sortedRows.map((p) => {
              const soldOut = p.stok <= 0;
              const productImg = getProductImage(p);

              return (
                <div key={p.id} className={`katalog-product-card${soldOut ? ' sold-out' : ''}`}>
                  {/* Gambar Produk dari assets */}
                  <div className="katalog-image-wrapper">
                    <img
                      src={productImg}
                      alt={p.nama}
                      className={`katalog-product-img${soldOut ? ' grayscale' : ''}`}
                    />
                    <span className="katalog-badge-cat">{p.kategori}</span>
                    <span className={`katalog-badge-stock ${soldOut ? 'sold-out' : 'available'}`}>
                      <span className="katalog-badge-dot" aria-hidden="true" />
                      {soldOut ? 'Stok Habis' : 'Tersedia'}
                    </span>
                  </div>

                  {/* Informasi Produk */}
                  <div className="katalog-card-body">
                    <div className="katalog-card-meta">
                      <h3 className="katalog-card-title">{p.nama}</h3>
                      <p className="katalog-card-desc">{getProductDescription(p)}</p>
                      <div className="katalog-card-price-row">
                        <span className="katalog-card-price">{formatRupiah(p.harga)}</span>
                        <span className="katalog-card-unit">{getProductUnit(p)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`katalog-btn-card${soldOut ? ' disabled' : ''}`}
                      onClick={() => handleAdd(p)}
                      disabled={soldOut}
                    >
                      {soldOut ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Stok Habis</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          <span>+ Tambah ke Keranjang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Paginasi & Statistik */}
          <div className="katalog-pagination-bar">
            <div className="katalog-pagination-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Menampilkan {rows.length} dari {total} produk</span>
            </div>

            <div className="katalog-pagination-controls">
              <button
                type="button"
                className="katalog-page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span className="katalog-page-info">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                className="katalog-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </>
      )}

      {/* 7. WhatsApp Special Order Help Banner */}
      <section className="katalog-help-banner">
        <div className="katalog-help-left">
          <div className="katalog-help-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="katalog-help-text">
            <h2>Tidak menemukan sembako yang dicari?</h2>
            <p>Hubungi Abah via WhatsApp untuk pesan barang khusus partai besar atau pengadaan acara arisan.</p>
          </div>
        </div>
        <a
          className="katalog-help-btn"
          href="https://wa.me/6281234567890?text=Halo%20Abah,%20saya%20mau%20tanya%20produk%20sembako%20khusus"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Hubungi WhatsApp Abah</span>
        </a>
      </section>
    </div>
  );
}
