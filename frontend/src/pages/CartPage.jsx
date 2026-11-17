import { useEffect, useState } from 'react';
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

const RECOMMENDED_PRODUCTS = [
  {
    id: 1,
    nama: 'Beras Ramos Super 5 kg',
    kategori: 'Beras & Gandum',
    desc: 'Pulen murni tanpa pemutih sintetis, aroma wangi alami untuk konsumsi harian keluarga.',
    badge: 'Paling Laris',
    badgeType: 'laris',
    stockText: 'Stok: 42 Sak',
    hargaCoret: 74000,
    harga: 69500,
    saveText: 'Hemat Rp 4.500',
    image: berasImg,
    stok: 42,
  },
  {
    id: 2,
    nama: 'Minyak Goreng Refill 2 Liter',
    kategori: 'Minyak & Lemak',
    desc: 'Penyaringan ganda bermutu tinggi, hasil gorengan lebih renyah dan tidak cepat hitam.',
    badge: 'Promo Pekan Ini',
    badgeType: 'promo',
    stockText: 'Stok: 85 Pouch',
    hargaCoret: 37000,
    harga: 33900,
    saveText: '-8%',
    image: minyakImg,
    stok: 85,
  },
  {
    id: 3,
    nama: 'Gula Pasir Kristal Putih 1 kg',
    kategori: 'Gula & Pemanis',
    desc: 'Dari tebu pilihan alami, butiran kristal bersih tanpa ampas, manis pas untuk teh dan kopi.',
    badge: 'Kebutuhan Harian',
    badgeType: 'harian',
    stockText: 'Stok: 60 Pack',
    hargaCoret: 18000,
    harga: 16500,
    saveText: 'Kemasan 1 kg',
    image: gulaImg,
    stok: 60,
  },
  {
    id: 4,
    nama: 'Telur Ayam Negeri Segar 1 kg',
    kategori: 'Hasil Ternak',
    desc: 'Cangkang tebal bersih, kuning telur utuh kental, pasokan baru datang setiap pagi.',
    badge: 'Segar Tiap Pagi',
    badgeType: 'segar',
    stockText: 'Stok: 30 Tray',
    hargaCoret: 29500,
    harga: 27000,
    saveText: 'Grosir Hemat',
    image: telurImg,
    stok: 30,
  },
];

function CartQuantityInput({ item, setJumlah, isError }) {
  const [val, setVal] = useState(String(item.jumlah));

  useEffect(() => {
    setVal(String(item.jumlah));
  }, [item.jumlah]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setVal(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setJumlah(item.id, parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      setVal('1');
      setJumlah(item.id, 1);
    } else {
      setVal(String(parsed));
      setJumlah(item.id, parsed);
    }
  };

  return (
    <input
      type="number"
      min="1"
      className={`ko-stepper-input${isError ? ' error' : ''}`}
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={`Jumlah saat ini ${item.jumlah}`}
    />
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    count,
    total,
    hasIssue,
    syncError,
    retrySync,
    addItem,
    setJumlah,
    removeItem,
    clear,
  } = useCart();
  const { checking, error, recheck } = useCartCheck();

  const [toastMsg, setToastMsg] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  function handleQuickAdd(prod) {
    setAddingId(prod.id);
    setToastMsg(`${prod.nama} berhasil dimasukkan ke keranjang!`);
    setTimeout(() => {
      setAddingId(null);
      setSavedId(prod.id);
      setTimeout(() => {
        addItem({
          id: prod.id,
          nama: prod.nama,
          harga: prod.harga,
          stok: prod.stok,
        });
        setSavedId(null);
        setToastMsg('');
      }, 700);
    }, 400);
  }

  // =========================================================================
  // 1. TAMPILAN KERANJANG KOSONG (Persis Desain Stitch)
  // =========================================================================
  if (items.length === 0) {
    return (
      <div className="ko-empty-wrapper">
        {syncError && (
          <div className="ko-alert-warning" role="alert">
            <p className="ko-alert-desc">
              {syncError}{' '}
              <button type="button" className="ko-link-retry" onClick={retrySync}>Coba lagi</button>
            </p>
          </div>
        )}
        {/* Top Breadcrumb & Context Bar */}
        <section className="ko-empty-top-bar">
          <div className="ko-empty-top-inner">
            <nav aria-label="Breadcrumb" className="ko-empty-breadcrumb">
              <Link to="/katalog" className="ko-empty-bc-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Beranda</span>
              </Link>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ko-empty-bc-sep" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="ko-empty-bc-active">Keranjang Belanja</span>
            </nav>

            <div className="ko-empty-loc-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Pengiriman Cepat Daerah Jalan Raya Telang-Kamal &amp; Sekitarnya</span>
            </div>
          </div>
        </section>

        {/* Empty State Hero Card Section */}
        <section className="ko-empty-hero-section">
          <div className="ko-empty-card">
            {/* Ambient Decorative Blurs */}
            <div className="ko-empty-halo-1" aria-hidden="true" />
            <div className="ko-empty-halo-2" aria-hidden="true" />

            {/* Empty Basket Visual Motif */}
            <div className="ko-empty-motif-wrapper">
              <div className="ko-empty-animated-ring" aria-hidden="true" />
              <div className="ko-empty-cart-box">
                <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                  <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" stroke="#ba1a1a" />
                </svg>
              </div>
              <div className="ko-empty-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                <span>0 Item</span>
              </div>
            </div>

            {/* Copy Block */}
            <div className="ko-empty-copy">
              <div className="ko-empty-pill">
                <span className="ko-empty-pill-dot" aria-hidden="true" />
                <span>Daftar Belanja Anda</span>
              </div>

              <h1 className="ko-empty-title">Keranjang Belanja Masih Kosong</h1>

              <p className="ko-empty-desc">
                Wah, belum ada sembako atau kebutuhan dapur yang Anda masukkan ke keranjang belanja. Yuk, penuhi kebutuhan dapur keluarga dari <span className="ko-highlight-green">Toko Abah</span> dengan harga grosir!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="ko-empty-actions">
              <Link to="/katalog" className="ko-empty-btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Lihat Katalog Sembako</span>
              </Link>

              <Link to="/katalog" className="ko-empty-btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>Lihat Promo Pekan Ini</span>
              </Link>
            </div>

            {/* 3 Value Props Badges inside empty card */}
            <div className="ko-empty-features-grid">
              <div className="ko-empty-feature-card">
                <div className="ko-feature-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h4 className="ko-feature-title">Jaminan Mutu</h4>
                  <p className="ko-feature-subtitle">Beras pulen &amp; higienis</p>
                </div>
              </div>

              <div className="ko-empty-feature-card">
                <div className="ko-feature-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h4 className="ko-feature-title">Harga Pasar</h4>
                  <p className="ko-feature-subtitle">Tarif grosir hemat</p>
                </div>
              </div>

              <div className="ko-empty-feature-card">
                <div className="ko-feature-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00569f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <circle cx="15" cy="5" r="1" />
                    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                  </svg>
                </div>
                <div>
                  <h4 className="ko-feature-title">Antar Cepat</h4>
                  <p className="ko-feature-subtitle">Bisa bayar tunai (COD)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommendation Section: Produk Sembako Paling Banyak Dicari */}
        <section className="ko-recom-section">
          <div className="ko-recom-header">
            <div>
              <div className="ko-recom-tag">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span>Pilihan Ibu Rumah Tangga &amp; Warung</span>
              </div>
              <h2 className="ko-recom-title">Produk Sembako Paling Banyak Dicari</h2>
              <p className="ko-recom-subtitle">
                Paling sering dibeli kembali setiap pekan. Tambahkan langsung ke keranjang dengan satu klik.
              </p>
            </div>

            <Link to="/katalog" className="ko-recom-link">
              <span>Katalog Lengkap</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Product Grid: 4 Items */}
          <div className="ko-recom-grid">
            {RECOMMENDED_PRODUCTS.map((prod) => {
              const isAdding = addingId === prod.id;
              const isSaved = savedId === prod.id;

              return (
                <article key={prod.id} className="ko-recom-card">
                  <div className="ko-recom-thumb-box">
                    <img src={prod.image} alt={prod.nama} className="ko-recom-img" />
                    <span className={`ko-recom-badge-top ${prod.badgeType}`}>
                      {prod.badge}
                    </span>
                    <span className="ko-recom-badge-stock">
                      {prod.stockText}
                    </span>
                  </div>

                  <div className="ko-recom-card-body">
                    <span className="ko-recom-cat">{prod.kategori}</span>
                    <h3 className="ko-recom-card-title">{prod.nama}</h3>
                    <p className="ko-recom-desc">{prod.desc}</p>

                    <div className="ko-recom-pricing">
                      <div>
                        <span className="ko-recom-strike">{formatRupiah(prod.hargaCoret)}</span>
                        <div className="ko-recom-price">{formatRupiah(prod.harga)}</div>
                      </div>
                      <span className="ko-recom-save-pill">{prod.saveText}</span>
                    </div>

                    <button
                      type="button"
                      className={`ko-recom-btn${isSaved ? ' saved' : ''}`}
                      disabled={isAdding || isSaved}
                      onClick={() => handleQuickAdd(prod)}
                    >
                      {isAdding ? (
                        <>
                          <svg className="ko-spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                          <span>Menambahkan...</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-green-bold">Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="12" y1="11" x2="12" y2="17" />
                            <line x1="9" y1="14" x2="15" y2="14" />
                          </svg>
                          <span>+ Keranjang</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Toast Notifikasi Feedback */}
        {toastMsg && (
          <div className="ko-toast" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3f69c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. TAMPILAN KERANJANG BERISI (Persis Desain Stitch)
  // =========================================================================
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Area Antar: Jalan Raya Telang-Kamal &amp; sekitarnya (Radius 3 km)</span>
        </div>
      </div>

      {/* Banner Peringatan Stok Bermasalah */}
      {issueCount > 0 && (
        <div className="ko-alert-warning" role="alert">
          <div className="ko-alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      {syncError && (
        <div className="ko-alert-warning" role="alert">
          <p className="ko-alert-desc">
            {syncError}{' '}
            <button type="button" className="ko-link-retry" onClick={retrySync}>Coba lagi</button>
          </p>
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
              const sku = it.sku || `TKB-${String(it.id).padStart(3, '0')}`;
              const badgeText = it.badge || (it.nama.toLowerCase().includes('beras') ? 'Paling Laris' : it.nama.toLowerCase().includes('minyak') ? 'Promo Pekan Ini' : 'Sembako Pilihan');
              const itemDesc = it.desc || (it.nama.toLowerCase().includes('beras') ? 'Kualitas super pulen, putih alami tanpa pemutih' : it.nama.toLowerCase().includes('minyak') ? 'Penyaringan ganda higienis, jernih & tidak cepat beku' : 'Kebutuhan dapur pokok keluarga dengan mutu terjamin');
              const unitText = it.nama.toLowerCase().includes('beras') ? '/ sak' : it.nama.toLowerCase().includes('minyak') ? '/ pouch' : it.nama.toLowerCase().includes('telur') ? '/ tray' : '/ bks';

              return (
                <div key={it.id} className={`ko-item-card${issue ? ' ko-item-error' : ''}`}>
                  <div className="ko-item-row">
                    {/* Sisi Kiri: Thumbnail & Info */}
                    <div className="ko-item-left">
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
                        {issue && (
                          <div className="ko-item-thumb-overlay" aria-hidden="true">
                            <span className="ko-item-thumb-overlay-badge">!</span>
                          </div>
                        )}
                      </div>

                      <div className="ko-item-info">
                        <div className="ko-item-badge-row">
                          <span className={`ko-item-top-badge${issue ? ' error' : ''}`}>
                            {issue ? 'Stok Terbatas' : badgeText}
                          </span>
                          <span className="ko-item-sku">SKU: {sku}</span>
                        </div>
                        <h3 className="ko-item-name">{it.nama}</h3>
                        <p className="ko-item-desc">{itemDesc}</p>
                        {issue && (
                          <div className="ko-item-issue-pill" role="alert">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{issue} (Sisa gudang: {it.stok} item)</span>
                          </div>
                        )}
                        <p className={`ko-item-price-unit${issue ? ' text-error' : ''}`}>
                          {formatRupiah(it.harga)} <span className="ko-item-unit-label">{unitText}</span>
                        </p>
                      </div>
                    </div>

                    {/* Sisi Kanan: Stepper, Subtotal, dan Aksi */}
                    <div className="ko-item-controls">
                      {/* Stepper Jumlah */}
                      <div className="ko-item-stepper-wrap" role="group" aria-label={`Jumlah ${it.nama}`}>
                        <button
                          type="button"
                          className="ko-stepper-btn"
                          aria-label={`Kurangi jumlah ${it.nama}`}
                          disabled={it.jumlah <= 1}
                          onClick={() => setJumlah(it.id, it.jumlah - 1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>

                        <CartQuantityInput
                          item={it}
                          setJumlah={setJumlah}
                          isError={Boolean(issue)}
                        />

                        <button
                          type="button"
                          className="ko-stepper-btn"
                          aria-label={`Tambah jumlah ${it.nama}`}
                          disabled={it.jumlah >= it.stok}
                          onClick={() => setJumlah(it.id, it.jumlah + 1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="ko-subtotal-block">
                        <span className="ko-subtotal-label">Subtotal</span>
                        <span className={`ko-subtotal-val${issue ? ' error' : ''}`}>
                          {formatRupiah(it.harga * it.jumlah)}
                        </span>
                      </div>

                      {/* Baris Tombol Aksi */}
                      <div className="ko-item-action-btns">
                        {issue && (
                          <button
                            type="button"
                            className="ko-btn-fix-action"
                            onClick={() => fixItem(it)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>{it.stok <= 0 ? 'Hapus barang' : `Ubah ke ${it.stok} Item`}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="ko-btn-remove-action"
                          onClick={() => removeItem(it.id)}
                          aria-label={`Hapus ${it.nama} dari keranjang`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            <Link to="/katalog" className="ko-btn-continue-shopping">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Lanjut Belanja Sembako Lainnya</span>
            </Link>

            <button type="button" className="ko-btn-empty-cart" onClick={clear}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Kosongkan Keranjang</span>
            </button>
          </div>

          {/* Callout Grosir Toko Abah */}
          <div className="ko-grosir-callout">
            <div className="ko-grosir-left">
              <div className="ko-grosir-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.77L12 20.66l7.65-7.66.77-.77a5.4 5.4 0 0 0 0-7.65z" />
                </svg>
              </div>
              <div>
                <h4 className="ko-grosir-title">Butuh Pasokan Grosir untuk Warung?</h4>
                <p className="ko-grosir-desc">
                  Harga khusus partai besar sak-sakan dan kardusan. Bisa langsung koordinasi via WhatsApp Abah.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="ko-grosir-btn"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Hubungi Grosir</span>
            </a>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Belanja (Sticky) */}
        <aside className="ko-right-col">
          <div className="ko-summary-card">
            <div className="ko-summary-header">
              <h2 className="ko-summary-title">Ringkasan Belanja</h2>
              <span className="ko-summary-badge">{count} Produk</span>
            </div>

            <div className="ko-summary-calcs">
              <div className="ko-summary-row">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-on-surface">{formatRupiah(total)}</span>
              </div>
              <div className="ko-summary-row promo">
                <span className="flex items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Diskon Promo Toko</span>
                </span>
                <span className="font-semibold">- Rp 0</span>
              </div>
              <div className="ko-summary-row">
                <div>
                  <span className="block">Estimasi Ongkir (Radius 3 km)</span>
                  <span className="ko-promo-sub">Promo Belanja &gt; Rp 100rb</span>
                </div>
                <div className="text-right">
                  <span className="ko-free-tag">Gratis / Rp 0</span>
                </div>
              </div>
            </div>

            <div className="ko-summary-divider" />

            <div className="ko-summary-total-box">
              <div className="flex flex-col">
                <span className="ko-total-label">Total Belanja</span>
                <span className="ko-total-subtext">Termasuk biaya kemasan rapi</span>
              </div>
              <div className="ko-total-big-price">{formatRupiah(total)}</div>
            </div>

            {hasIssue && (
              <div className="ko-summary-lock-box" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>
                  Checkout terkunci sementara. Selesaikan penyesuaian stok barang untuk melanjutkan pembelian.
                </p>
              </div>
            )}

            <button
              type="button"
              className="ko-btn-checkout-primary"
              disabled={blocked}
              onClick={() => navigate('/checkout')}
            >
              {checking ? (
                <span>Memeriksa stok...</span>
              ) : blocked ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Lanjut ke Checkout</span>
                </>
              ) : (
                <>
                  <span>Lanjut ke Checkout</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
            <p className="ko-summary-footer-note">
              {blocked ? 'Tombol aktif otomatis setelah stok disesuaikan' : 'Pesanan siap disiapkan di kasir Toko Abah'}
            </p>

            <div className="ko-trust-badges-box">
              <strong className="block text-on-surface">Jaminan Layanan Toko Abah:</strong>
              <div className="ko-trust-badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Timbangan pasti pas, higienis &amp; tersegel</span>
              </div>
              <div className="ko-trust-badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Bisa bayar di rumah (COD) atau QRIS saat tiba</span>
              </div>
              <div className="ko-trust-badge-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Pesanan disiapkan dalam waktu &lt; 45 menit</span>
              </div>
            </div>
          </div>

          <div className="ko-help-card">
            <div className="ko-help-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <p className="ko-help-title">Ada kendala pesanan?</p>
                <p className="ko-help-desc">Kasir Abah siap bantu cek gudang fisik</p>
              </div>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="ko-help-link"
            >
              Tanya Kasir
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
