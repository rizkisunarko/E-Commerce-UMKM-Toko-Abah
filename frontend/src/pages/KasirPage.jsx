import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { formatRupiah } from '../utils/format';
import './KasirPage.css';

// Gambar aset produk
import imgBeras from '../assets/Beras.jpg';
import imgGula from '../assets/Gula-Pasir.jpg';
import imgKopi from '../assets/Kopi-Sachet.jpg';
import imgMie from '../assets/Mie-Instan.jpg';
import imgMinyak from '../assets/Minyak-Goreng.jpg';
import imgTelur from '../assets/Telur Ayam.jpg';

const METHODS = [
  { value: 'tunai', label: 'Tunai', icon: 'payments', desc: 'Pembayaran tunai di kasir' },
  { value: 'qris', label: 'QRIS', icon: 'qr_code_2', desc: 'Scan QRIS e-wallet / m-banking' },
];

const METHOD_REQUIRED = 'Pilih metode bayar terlebih dahulu';
const INVALID_NUMBER = 'Masukkan angka yang valid';

function getProductImage(productName = '', category = '') {
  const lower = (productName + ' ' + category).toLowerCase();
  if (lower.includes('beras')) return imgBeras;
  if (lower.includes('gula')) return imgGula;
  if (lower.includes('kopi')) return imgKopi;
  if (lower.includes('mie')) return imgMie;
  if (lower.includes('minyak')) return imgMinyak;
  if (lower.includes('telur')) return imgTelur;
  return null;
}

// Kesalahan jumlah yang dapat diketahui di sisi klien (AC-05.3)
function localItemError(item) {
  const qty = Number(item.jumlah);
  if (item.jumlah === '' || !Number.isInteger(qty) || qty < 1) return INVALID_NUMBER;
  if (qty > item.product.stok) return `Stok tidak mencukupi. Stok tersedia: ${item.product.stok}`;
  return '';
}

export default function KasirPage() {
  const { user } = useAuth();
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  // cart: [{ product, jumlah }], jumlah berupa teks agar kolom bisa dikosongkan saat mengetik
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState('');
  const [metodeError, setMetodeError] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Shortcut keyboard F2 (fokus cari) & Esc (batal / tutup)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'Escape') {
        if (receipt) {
          setReceipt(null);
        } else if (search) {
          setSearch('');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [receipt, search]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2400);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .list({ search, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setProducts(data);
        // Segarkan stok produk yang sudah ada di keranjang
        setCart((prev) =>
          prev.map((it) => {
            const fresh = data.find((p) => p.id === it.product.id);
            return fresh ? { ...it, product: fresh } : it;
          }),
        );
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Gagal memuat produk');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, reload]);

  // Ekstrak kategori unik dari produk
  const categories = Array.from(new Set(products.map((p) => p.kategori).filter(Boolean)));
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.kategori === selectedCategory)
    : products;

  function addProduct(product) {
    if (product.stok <= 0) return;
    setReceipt(null);
    setServerErrors({});
    setMetodeError('');

    setCart((prev) => {
      const found = prev.find((it) => it.product.id === product.id);
      if (found) {
        const nextQty = (Number(found.jumlah) || 0) + 1;
        showToast(`${product.nama} (${nextQty}x) ditambahkan`);
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, jumlah: String(nextQty) } : it,
        );
      }
      showToast(`${product.nama} ditambahkan ke keranjang`);
      return [...prev, { product, jumlah: '1' }];
    });
  }

  function changeQty(id, value) {
    setServerErrors({});
    setCart((prev) => prev.map((it) => (it.product.id === id ? { ...it, jumlah: value } : it)));
  }

  function stepQty(id, delta) {
    setServerErrors({});
    setCart((prev) =>
      prev.flatMap((it) => {
        if (it.product.id !== id) return [it];
        const next = (Number(it.jumlah) || 0) + delta;
        return next < 1 ? [] : [{ ...it, jumlah: String(next) }];
      }),
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((it) => it.product.id !== id));
  }

  function handleResetCart() {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua item di keranjang kasir?')) {
      setCart([]);
      setMetode('');
      setMetodeError('');
      setServerErrors({});
      showToast('Keranjang telah direset');
    }
  }

  const total = cart.reduce((sum, it) => {
    const qty = Number(it.jumlah);
    return Number.isInteger(qty) && qty > 0 ? sum + it.product.harga * qty : sum;
  }, 0);

  const totalItemsCount = cart.reduce((sum, it) => {
    const qty = Number(it.jumlah);
    return Number.isInteger(qty) && qty > 0 ? sum + qty : sum;
  }, 0);

  const hasItemError = cart.some((it) => localItemError(it));

  async function handleSubmit() {
    setServerErrors({});
    if (!metode) {
      setMetodeError(METHOD_REQUIRED);
      return;
    }
    if (cart.length === 0 || hasItemError) return;

    setSubmitting(true);
    try {
      const res = await transactionService.create({
        metode_bayar: metode,
        items: cart.map((it) => ({ product_id: it.product.id, jumlah: Number(it.jumlah) })),
      });
      setReceipt(res.data);
      setCart([]);
      setMetode('');
      setMetodeError('');
      setReload((x) => x + 1);
    } catch (err) {
      if (err.status === 422) {
        setServerErrors(err.errors || {});
        if (err.errors?.metode_bayar) setMetodeError(err.errors.metode_bayar);
        setReload((x) => x + 1);
      } else {
        setError(err.message || 'Gagal menyelesaikan transaksi');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function newTransaction() {
    setReceipt(null);
    setServerErrors({});
    setMetode('');
    setMetodeError('');
  }

  return (
    <div className="kasir-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="kasir-toast-banner" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Section */}
      <header className="kasir-header-banner">
        <div className="kasir-header-left">
          <div className="kasir-badge-row">
            <span className="kasir-terminal-tag">TERMINAL KASIR POS</span>
            <span className="kasir-terminal-sep">•</span>
            <span className="kasir-terminal-status">
              <span className="pulse-dot"></span> Kasir Aktif #01
            </span>
          </div>
          <h1 className="kasir-main-title">Kasir</h1>
          <p className="kasir-main-subtitle">
            Pencatatan transaksi penjualan langsung kasir toko
          </p>
        </div>

        <div className="kasir-header-right">
          <div className="kasir-info-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Shift Kasir: <b>{user?.nama || 'Petugas'}</b></span>
          </div>
          <div className="kasir-info-pill secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Hari Ini</span>
          </div>
        </div>
      </header>

      {error && <div className="alert-error" role="alert">{error}</div>}

      {/* 2-Column POS Layout */}
      <div className="kasir-pos-workspace">
        {/* KOLOM KIRI: Katalog & Pemilihan Produk */}
        <section className="kasir-catalog-section">
          {/* Search Bar & Category Tabs */}
          <div className="kasir-search-filter-card">
            <div className="kasir-search-input-wrapper">
              <span className="kasir-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                className="kasir-search-field"
                placeholder="Cari nama produk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="kasir-search-shortcut">
                <kbd>F2</kbd>
                <span>Cari</span>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="kasir-category-pills-row">
              <button
                type="button"
                className={`kasir-cat-pill${selectedCategory === '' ? ' is-active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`kasir-cat-pill${selectedCategory === cat ? ' is-active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
              <span className="kasir-product-count-label">
                Total {filteredProducts.length} Produk
              </span>
            </div>
          </div>

          {/* Grid Produk */}
          {loading ? (
            <div className="kasir-loading-state">
              <p>Memuat katalog produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="kasir-empty-catalog">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="kasir-empty-title">Produk tidak ditemukan.</p>
              <span className="kasir-empty-sub">Coba ubah kata kunci pencarian atau kategori</span>
            </div>
          ) : (
            <div className="kasir-product-grid">
              {filteredProducts.map((p) => {
                const img = getProductImage(p.nama, p.kategori);
                const isOutOfStock = p.stok <= 0;
                const isCritical = p.status_stok === 'Stok Kritis' || p.stok <= (p.batas_stok_kritis ?? 10);

                return (
                  <div key={p.id} className={`kasir-product-card${isOutOfStock ? ' is-out-of-stock' : ''}`}>
                    <div className="kasir-product-image-box">
                      {img ? (
                        <img src={img} alt={p.nama} className="kasir-product-img" />
                      ) : (
                        <div className="kasir-product-img-fallback">
                          <span>📦</span>
                        </div>
                      )}
                      <span className={`kasir-stock-badge${isOutOfStock ? ' out' : isCritical ? ' critical' : ' safe'}`}>
                        {isOutOfStock ? 'Habis' : `Stok: ${p.stok}`}
                      </span>
                    </div>

                    <div className="kasir-product-content">
                      <span className="kasir-product-category">{p.kategori}</span>
                      <h3 className="kasir-product-name" title={p.nama}>{p.nama}</h3>
                      <div className="kasir-product-price-row">
                        <span className="kasir-product-price">{formatRupiah(p.harga)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-kasir-add"
                      onClick={() => addProduct(p)}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? (
                        <span>Stok Habis</span>
                      ) : (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>+ Tambah</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* KOLOM KANAN: Keranjang Kasir */}
        <aside className="kasir-cart-section">
          <div className="kasir-cart-card">
            {/* Header Keranjang */}
            <div className="kasir-cart-header">
              <div className="kasir-cart-header-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <h2>Keranjang Kasir</h2>
              </div>
              <span className="kasir-cart-badge">
                {cart.length} Jenis Item
              </span>
            </div>

            {/* Daftar Item di Keranjang */}
            <div className="kasir-cart-items-container">
              {cart.length === 0 ? (
                <div className="kasir-cart-empty-view">
                  <div className="kasir-cart-empty-icon">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <h3 className="kasir-empty-cart-title">Belum ada produk dipilih</h3>
                  <p className="kasir-empty-cart-sub">
                    Klik tombol <strong>+ Tambah</strong> pada produk
                  </p>
                </div>
              ) : (
                cart.map((it) => {
                  const itemErr = localItemError(it) || serverErrors[`items.${it.product.id}`] || '';
                  const qty = Number(it.jumlah);
                  const subtotal = Number.isInteger(qty) && qty > 0 ? it.product.harga * qty : 0;
                  const isStockExceeded = qty > it.product.stok;

                  return (
                    <div
                      key={it.product.id}
                      className={`kasir-cart-item-row${itemErr ? ' has-error' : ''}`}
                    >
                      <div className="kasir-cart-item-top">
                        <div className="kasir-cart-item-info">
                          <span className="kasir-cart-item-name">{it.product.nama}</span>
                          <span className="kasir-cart-item-unitprice">@ {formatRupiah(it.product.harga)}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-kasir-cart-remove"
                          onClick={() => removeItem(it.product.id)}
                          title="Hapus"
                          aria-label={`Hapus ${it.product.nama}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>

                      <div className="kasir-cart-item-bottom">
                        {/* Stepper Jumlah */}
                        <div className="kasir-stepper-control">
                          <button
                            type="button"
                            className="kasir-stepper-btn minus"
                            onClick={() => stepQty(it.product.id, -1)}
                            aria-label="Kurangi"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="kasir-stepper-input"
                            aria-label={`Jumlah ${it.product.nama}`}
                            aria-invalid={Boolean(itemErr)}
                            value={it.jumlah}
                            onChange={(e) => changeQty(it.product.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="kasir-stepper-btn plus"
                            onClick={() => stepQty(it.product.id, 1)}
                            aria-label="Tambah"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal Item */}
                        <span className="kasir-cart-item-subtotal">
                          {formatRupiah(subtotal)}
                        </span>
                      </div>

                      {/* Notifikasi Error Khusus Item (AC-05.3, Screen 4) */}
                      {itemErr && (
                        <div className="kasir-cart-item-error-box">
                          <div className="kasir-item-error-text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{itemErr}</span>
                          </div>
                          {isStockExceeded && it.product.stok > 0 && (
                            <button
                              type="button"
                              className="btn-set-max-stock"
                              onClick={() => changeQty(it.product.id, String(it.product.stok))}
                            >
                              Set ke {it.product.stok}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Total Belanja & Pilihan Pembayaran */}
            <div className="kasir-cart-footer">
              <div className="kasir-subtotal-breakdown">
                <span className="kasir-breakdown-label">Subtotal ({totalItemsCount} barang)</span>
                <span className="kasir-breakdown-value">{formatRupiah(total)}</span>
              </div>

              {/* Total Belanja */}
              <div className="kasir-total-block">
                <div className="kasir-total-label-col">
                  <span className="kasir-total-tag">TOTAL TAGIHAN</span>
                  <span className="kasir-total-main-text">Total Belanja</span>
                </div>
                <span className="kasir-total-amount">
                  {formatRupiah(total)}
                </span>
              </div>

              {/* Pilihan Metode Bayar (AC-05.2, Screen 3) */}
              <div className={`kasir-payment-methods-box${metodeError ? ' has-error' : ''}`}>
                <div className="kasir-payment-header">
                  <label className="kasir-payment-title">Metode Bayar</label>
                  {metode && (
                    <span className="kasir-payment-chosen-badge">
                      {metode === 'tunai' ? 'Tunai Dipilih' : 'QRIS Dipilih'}
                    </span>
                  )}
                </div>

                <div className="kasir-payment-grid">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      className={`btn-payment-option${metode === m.value ? ' is-selected' : ''}`}
                      onClick={() => {
                        setMetode(m.value);
                        setMetodeError('');
                      }}
                      aria-pressed={metode === m.value}
                    >
                      <div className="payment-opt-top">
                        <span className="payment-icon">
                          {m.value === 'tunai' ? '💵' : '📱'}
                        </span>
                        <span className="payment-opt-label">{m.label}</span>
                      </div>
                      <span className="payment-opt-sub">{m.desc}</span>
                    </button>
                  ))}
                </div>

                {metodeError && (
                  <div className="kasir-payment-error-msg" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{metodeError}</span>
                  </div>
                )}
              </div>

              {/* Tombol Selesaikan Transaksi */}
              <button
                type="button"
                className="btn-checkout-finish"
                onClick={handleSubmit}
                disabled={cart.length === 0 || hasItemError || submitting}
              >
                {submitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Selesaikan Transaksi</span>
                  </>
                )}
              </button>

              {/* Footer Tombol Reset */}
              <div className="kasir-cart-footer-actions">
                {cart.length > 0 && (
                  <button
                    type="button"
                    className="btn-cart-reset-action"
                    onClick={handleResetCart}
                  >
                    Reset Keranjang
                  </button>
                )}
                <span className="kasir-shortcut-hint">
                  Shortcut: <kbd>F2</kbd> Cari
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL TRANSAKSI BERHASIL (Screen 6) */}
      {receipt && (
        <div className="kasir-modal-backdrop" role="dialog" aria-modal="true">
          <div className="kasir-receipt-card">
            <div className="kasir-receipt-header">
              <div className="kasir-receipt-check-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="kasir-receipt-title">Transaksi berhasil disimpan</h2>
              <p className="kasir-receipt-desc">
                Struk <strong>#{receipt.id || 'TRX-001'}</strong> telah dicatat ke sistem dan stok telah dipotong secara otomatis.
              </p>
            </div>

            <div className="kasir-receipt-body">
              <div className="kasir-receipt-meta-box">
                <span className="kasir-receipt-time">
                  {new Date(receipt.tanggal || Date.now()).toLocaleString('id-ID')}
                </span>
                <span className="kasir-receipt-cashier">
                  Kasir: {user?.nama || 'Petugas Toko'}
                </span>
              </div>

              <div className="kasir-receipt-total-banner">
                <div>
                  <span className="receipt-total-sublabel">Total Belanja</span>
                  <span className="receipt-total-val">{formatRupiah(receipt.total)}</span>
                </div>
                <div className="receipt-method-pill">
                  <span>Metode: {receipt.metode_bayar === 'qris' ? 'QRIS' : 'Tunai'}</span>
                </div>
              </div>

              {/* Rincian Produk */}
              {Array.isArray(receipt.items) && receipt.items.length > 0 && (
                <div className="kasir-receipt-items-list">
                  <span className="receipt-items-header">RINCIAN BARANG TERJUAL</span>
                  <div className="receipt-items-scroll">
                    {receipt.items.map((it, idx) => (
                      <div key={idx} className="receipt-item-row">
                        <div className="receipt-item-name-col">
                          <span className="receipt-item-name">{it.nama}</span>
                          <span className="receipt-item-qty">{it.jumlah} × {formatRupiah(it.harga)}</span>
                        </div>
                        <span className="receipt-item-subtotal">{formatRupiah(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="kasir-receipt-footer">
              <button
                type="button"
                className="btn-new-transaction"
                onClick={newTransaction}
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
