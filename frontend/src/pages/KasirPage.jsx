import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { formatRupiah } from '../utils/format';
import './KasirPage.css';

// Aset gambar produk dari frontend/src/assets
import imgBeras from '../assets/Beras.jpg';
import imgGula from '../assets/Gula-Pasir.jpg';
import imgKopi from '../assets/Kopi-Sachet.jpg';
import imgMie from '../assets/Mie-Instan.jpg';
import imgMinyak from '../assets/Minyak-Goreng.jpg';
import imgTelur from '../assets/Telur Ayam.jpg';

const METHOD_REQUIRED = 'Pilih metode bayar terlebih dahulu';
const INVALID_NUMBER = 'Masukkan angka yang valid';

const PRODUCT_META = {
  beras: {
    displayName: 'Beras Ramos 5 kg',
    subCategory: 'SEMBAKO POKOK',
    subtitle: 'Kemasan Sak 5 Kilogram',
    unit: 'sak',
    posCategory: 'Sembako',
  },
  minyak: {
    displayName: 'Minyak Goreng 1 L',
    subCategory: 'MINYAK & LEMAK',
    subtitle: 'Pouch Refill Higienis',
    unit: 'pouch',
    posCategory: 'Sembako',
  },
  gula: {
    displayName: 'Gula Pasir 1 kg',
    subCategory: 'PEMANIS',
    subtitle: 'Gula Kristal Putih Premium',
    unit: 'bks',
    posCategory: 'Sembako',
  },
  telur: {
    displayName: 'Telur Ayam 1 kg',
    subCategory: 'PROTEIN SEGAR',
    subtitle: 'Telur Negeri Segar Curah',
    unit: 'kg',
    posCategory: 'Sembako',
  },
  mie: {
    displayName: 'Mie Instan',
    subCategory: 'MAKANAN SIAP SAJI',
    subtitle: 'Mie Goreng Spesial 85g',
    unit: 'bks',
    posCategory: 'Mie & Bumbu',
  },
  kopi: {
    displayName: 'Kopi Sachet',
    subCategory: 'MINUMAN HANGAT',
    subtitle: 'Kopi Bubuk Instan + Gula',
    unit: 'sachet',
    posCategory: 'Minuman',
  },
};

function getProductMeta(name = '', category = '') {
  const lower = (name + ' ' + category).toLowerCase();
  for (const [key, meta] of Object.entries(PRODUCT_META)) {
    if (lower.includes(key)) return meta;
  }
  return {
    displayName: name,
    subCategory: (category || 'SEMBAKO POKOK').toUpperCase(),
    subtitle: 'Kebutuhan pokok pilihan Toko Abah',
    unit: 'pcs',
    posCategory: category || 'Sembako',
  };
}

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

function localItemError(item) {
  const qty = Number(item.jumlah);
  if (item.jumlah === '' || !Number.isInteger(qty) || qty < 1) return INVALID_NUMBER;
  if (qty > item.product.stok) return `Stok tidak mencukupi. Stok tersedia: ${item.product.stok}`;
  return '';
}

export default function KasirPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  // Keranjang kasir
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState(''); // Default kosong untuk memicu validasi error jika belum memilih
  const [metodeError, setMetodeError] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [qrisConfirmed, setQrisConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2400);
  };

  // Keyboard shortcut: F2 (Cari), F3 (Katalog), F7 (Cash), F8 (QRIS), F9 (Bayar/Cetak), Space (Transaksi Baru), Esc (Batal)
  useEffect(() => {
    function handleKeyDown(e) {
      if (paymentOpen) {
        if (e.key === 'Escape') {
          setPaymentOpen(false);
          setPaymentError('');
        } else if (e.key === 'F9' && !submitting) {
          e.preventDefault();
          confirmPayment();
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        navigate('/stok');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setMetode('tunai');
        setMetodeError('');
        showToast('Metode Cash / Tunai dipilih');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setMetode('qris');
        setMetodeError('');
        showToast('Metode E-Wallet & QRIS dipilih');
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (receipt) {
          handlePrintReceipt();
        } else if (!submitting && cart.length > 0) {
          handleSubmit();
        }
      } else if (e.code === 'Space' && receipt) {
        e.preventDefault();
        newTransaction();
      } else if (e.key === 'Escape') {
        if (receipt) {
          newTransaction();
        } else if (cart.length > 0) {
          handleResetCart();
        } else if (search) {
          setSearch('');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [receipt, search, submitting, cart, metode, paymentOpen]);

  // Load produk dari API / mock
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .list({ search, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setProducts(data);
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

  // Filter kategori POS
  const filteredProducts = products.filter((p) => {
    if (!selectedCategory) return true;
    const meta = getProductMeta(p.nama, p.kategori);
    return meta.posCategory === selectedCategory || p.kategori === selectedCategory;
  });

  function addProduct(product) {
    if (product.stok <= 0) return;
    setReceipt(null);
    setServerErrors({});

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

  function handlePrintReceipt() {
    if (!receipt) return;
    window.print();
  }

  function handleSendWhatsAppReceipt() {
    if (!receipt) return;

    const noNota = `#TRX-1024-0${receipt.id < 10 ? `0${receipt.id}` : receipt.id}`;
    const tanggalStr = `${new Date(receipt.tanggal || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(receipt.tanggal || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    const kasirNama = user?.nama || 'Abah Rohim';
    const metodeStr = receipt.metode_bayar === 'qris' ? 'QRIS / E-Wallet' : 'Tunai / Cash';

    let itemsList = '';
    if (receipt.items && receipt.items.length > 0) {
      itemsList = receipt.items
        .map(
          (it) =>
            `• *${it.nama}*\n  ${it.jumlah}x @${formatRupiah(it.harga)} = *${formatRupiah(it.subtotal)}*`
        )
        .join('\n');
    } else {
      itemsList = `• Total Belanja = *${formatRupiah(receipt.total)}*`;
    }

    const pesan =
      `🧾 *STRUK BELANJA RESMI - TOKO ABAH SEMBAKO*\n` +
      `_Penyedia Kebutuhan Pokok & Sembako Murah Berkualitas_\n` +
      `📍 Jl. Raya Telang No. 15 Kamal, Bangkalan, Madura\n` +
      `📞 No. WhatsApp Toko: 085708350575\n` +
      `====================================\n` +
      `*No. Nota :* ${noNota}\n` +
      `*Tanggal  :* ${tanggalStr}\n` +
      `*Kasir    :* ${kasirNama}\n` +
      `*Metode   :* ${metodeStr}\n` +
      `====================================\n` +
      `*RINCIAN BARANG:*\n` +
      `${itemsList}\n` +
      `====================================\n` +
      `*TOTAL PEMBAYARAN : ${formatRupiah(receipt.total)}*\n` +
      `*STATUS           : LUNAS*\n` +
      `====================================\n` +
      `Terima kasih banyak telah berbelanja di *Toko Abah Sembako*! Semoga rezeki berkah dan ditunggu belanja berikutnya. 🙏✨`;

    const inputPhone = window.prompt(
      'Masukkan nomor WhatsApp pelanggan (contoh: 085708350575) atau kosongkan untuk memilih kontak manual di WhatsApp:',
      ''
    );

    if (inputPhone === null) return;

    let waUrl = '';
    const cleanPhone = inputPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      const normalizedPhone = cleanPhone.startsWith('0')
        ? '62' + cleanPhone.slice(1)
        : cleanPhone.startsWith('62')
        ? cleanPhone
        : '62' + cleanPhone;
      waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(pesan)}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`;
    }

    window.open(waUrl, '_blank');
    showToast('Membuka WhatsApp untuk mengirimkan struk digital...');
  }

  function handleResetCart() {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua item di keranjang kasir?')) {
      setCart([]);
      setMetode('');
      setMetodeError('');
      setCashReceived('');
      setQrisConfirmed(false);
      setPaymentError('');
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

  const hasItemError = cart.some((it) => localItemError(it) || serverErrors[`items.${it.product.id}`]);

  async function handleSubmit() {
    setServerErrors({});
    setPaymentError('');
    if (!metode) {
      setMetodeError(METHOD_REQUIRED);
      return;
    }
    if (cart.length === 0 || hasItemError) return;

    setCashReceived('');
    setQrisConfirmed(false);
    setPaymentOpen(true);
  }

  async function confirmPayment() {
    setPaymentError('');
    const received = metode === 'tunai' ? Number(cashReceived) : total;
    if (metode === 'tunai' && (!Number.isSafeInteger(received) || received < total)) {
      setPaymentError('Uang diterima harus berupa angka bulat dan minimal sebesar total tagihan');
      return;
    }
    if (metode === 'qris' && !qrisConfirmed) {
      setPaymentError('Konfirmasi pembayaran QRIS setelah pembayaran diterima');
      return;
    }
    if (cart.length === 0 || hasItemError) {
      setPaymentError('Periksa kembali produk dan stok sebelum melanjutkan');
      return;
    }

    setSubmitting(true);
    try {
      const res = await transactionService.create({
        metode_bayar: metode,
        ...(metode === 'tunai' ? { jumlah_diterima: received } : {}),
        items: cart.map((it) => ({ product_id: it.product.id, jumlah: Number(it.jumlah) })),
      });
      setReceipt(res.data);
      setCart([]);
      setMetodeError('');
      setPaymentOpen(false);
      setCashReceived('');
      setQrisConfirmed(false);
      setReload((x) => x + 1);
    } catch (err) {
      if (err.status === 422) {
        setServerErrors(err.errors || {});
        if (err.errors?.metode_bayar) setMetodeError(err.errors.metode_bayar);
        if (err.errors?.jumlah_diterima) setPaymentError(err.errors.jumlah_diterima);
        setReload((x) => x + 1);
      } else {
        setPaymentError(err.message || 'Gagal menyelesaikan transaksi');
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
    setCashReceived('');
    setQrisConfirmed(false);
    setPaymentOpen(false);
    setPaymentError('');
    setCart([]);
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

      {/* 1. TOP NAVBAR PERSIS SEPERTI STITCH */}
      <header className="kasir-top-navbar">
        <div className="kasir-top-left">
          <div className="kasir-status-pill online">
            <span className="kasir-dot-online"></span>
            <span>Toko Buka</span>
          </div>
          <div className="kasir-shift-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Shift Pagi: 07:00 - 15:00 WIB</span>
          </div>
        </div>

        <div className="kasir-top-right">
          <div className="kasir-sync-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
            <span>Tersinkron POS</span>
          </div>

          <div className="kasir-user-profile">
            <div className="kasir-user-text">
              <span className="kasir-user-name">{user?.nama || 'Abah Rohim'}</span>
              <span className="kasir-user-role">{user?.role === 'admin' ? 'Owner / Kasir Utama' : 'Kasir Utama'}</span>
            </div>
            <div className="kasir-user-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER */}
      <div className="kasir-content-wrapper">
        <div className="kasir-header-section">
          <div className="kasir-header-title-col">
            <div className="kasir-title-badge-row">
              <h1 className="kasir-heading">Kasir</h1>
              <span className="kasir-active-pill">
                <span className="dot-online-active">●</span> Kasir Aktif
              </span>
              <span className="kasir-faktur-pill">
                No: #TRX-20241024-0043
              </span>
            </div>
            <p className="kasir-subheading">Pencatatan transaksi penjualan langsung kasir toko</p>
          </div>

          <div className="kasir-header-actions">
            {receipt ? (
              <div className="kasir-shortcut-header-pill">
                <span>⌨ Shortcut: [F2] Cari • [Space] Transaksi Baru • [F9] Cetak</span>
              </div>
            ) : (
              <>
                <div className="kasir-shift-widget">
                  <div className="shift-widget-icon green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <div className="shift-widget-text">
                    <span className="shift-widget-lbl">Item di Kasir</span>
                    <span className="shift-widget-val">{cart.length} Barang ({totalItemsCount} Pcs)</span>
                  </div>
                </div>

                <div className="kasir-shift-widget">
                  <div className="shift-widget-icon orange">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="shift-widget-text">
                    <span className="shift-widget-lbl">Target Shift</span>
                    <span className="shift-widget-val">Rp 3.850.000</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {error && <div className="alert-error" role="alert">{error}</div>}

        {/* 3. WORKSPACE 2 KOLOM */}
        <div className="kasir-pos-workspace">
          {/* KOLOM KIRI: KATALOG PRODUK */}
          <section className="kasir-catalog-section">
            {/* Search Input Bar */}
            <div className="kasir-search-container">
              <div className="kasir-search-box">
                <svg className="kasir-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="kasir-search-input"
                  placeholder="Cari nama produk sembako, barcode, atau SKU."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="kasir-kbd-hint">
                  <kbd>F2</kbd>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="6" y1="8" x2="6" y2="16" />
                    <line x1="10" y1="8" x2="10" y2="16" />
                    <line x1="14" y1="8" x2="14" y2="16" />
                    <line x1="18" y1="8" x2="18" y2="16" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="kasir-cat-nav-row">
              <div className="kasir-cat-buttons">
                <button
                  type="button"
                  className={`kasir-cat-btn${selectedCategory === '' ? ' active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span>Semua</span>
                  <span className="cat-count-badge">{products.length}</span>
                </button>

                <button
                  type="button"
                  className={`kasir-cat-btn${selectedCategory === 'Sembako' ? ' active' : ''}`}
                  onClick={() => setSelectedCategory('Sembako')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a9 9 0 0 1 9 9v1H3v-1a9 9 0 0 1 9-9Z" />
                    <path d="M3 12v6a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-6" />
                  </svg>
                  <span>Sembako</span>
                </button>

                <button
                  type="button"
                  className={`kasir-cat-btn${selectedCategory === 'Minuman' ? ' active' : ''}`}
                  onClick={() => setSelectedCategory('Minuman')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                  <span>Minuman</span>
                </button>

                <button
                  type="button"
                  className={`kasir-cat-btn${selectedCategory === 'Mie & Bumbu' ? ' active' : ''}`}
                  onClick={() => setSelectedCategory('Mie & Bumbu')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 3.9 2.2 7.2 5.5 8.8L8 22h8l.5-1.2C19.8 19.2 22 15.9 22 12c0-5.5-4.5-10-10-10Z" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2v10" />
                  </svg>
                  <span>Mie &amp; Bumbu</span>
                </button>
              </div>
            </div>

            {/* Grid Kartu Produk */}
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
                  const meta = getProductMeta(p.nama, p.kategori);
                  const img = getProductImage(p.nama, p.kategori);
                  const isOutOfStock = p.stok <= 0;
                  const isCritical = p.status_stok === 'Stok Kritis' || p.stok <= (p.batas_stok_kritis ?? 10);

                  return (
                    <div key={p.id} className={`kasir-prod-card${isOutOfStock ? ' out' : ''}`}>
                      <div className="kasir-prod-img-box">
                        {img ? (
                          <img src={img} alt={p.nama} className="kasir-prod-img" />
                        ) : (
                          <div className="kasir-prod-fallback">📦</div>
                        )}
                        <span className={`kasir-stock-pill${isOutOfStock ? ' out' : isCritical ? ' critical' : ' safe'}`}>
                          ● Stok: {p.stok} {meta.unit}
                        </span>
                      </div>

                      <div className="kasir-prod-info">
                        <span className="kasir-prod-subcat">{meta.subCategory}</span>
                        <h3 className="kasir-prod-name" title={meta.displayName}>{meta.displayName}</h3>
                        <p className="kasir-prod-desc">{meta.subtitle}</p>

                        <div className="kasir-prod-bottom-row">
                          <div className="kasir-prod-price-col">
                            <span className="kasir-prod-price-lbl">Harga Jual</span>
                            <span className="kasir-prod-price">{formatRupiah(p.harga)}</span>
                          </div>

                          <button
                            type="button"
                            className="btn-kasir-add-card"
                            onClick={() => addProduct(p)}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? 'Stok Habis' : '+ Tambah'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Help Banner Sesuai Gambar 1 */}
            <div className="kasir-bottom-help-card">
              <div className="kasir-help-left">
                <span className="kasir-info-circle-icon">ℹ</span>
                <span className="kasir-help-text">
                  Tekan <b>F2</b> untuk cari cepat atau hubungkan barcode scanner USB.
                </span>
              </div>
              <span className="kasir-pos-version-tag">
                Toko Sembako Abah POS v2.4
              </span>
            </div>
          </section>

          {/* KOLOM KANAN: KERANJANG KASIR / STRUK RESI */}
          <aside className="kasir-cart-panel">
            {receipt ? (
              /* TAMPILAN RESI TRANSAKSI BERHASIL DISIMPAN PERSIS SEPERTI GAMBAR 2 */
              <div className="kasir-receipt-panel-card">
                <div className="receipt-panel-header">
                  <div className="receipt-check-circle-white">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="receipt-panel-title">Transaksi Berhasil Disimpan!</h2>
                  <p className="receipt-panel-sub">
                    Struk <b>#{receipt.id ? `TRX-20241024-00${receipt.id}` : 'TRX-20241024-0043'}</b> telah dicatat ke sistem dan stok telah dipotong secara otomatis.
                  </p>
                </div>

                <div className="receipt-panel-body">
                  <div className="receipt-meta-box">
                    <div className="receipt-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>
                        {new Date(receipt.tanggal || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(receipt.tanggal || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                    <div className="receipt-meta-item">
                      <span>Kasir: <b>{user?.nama || 'Abah Rohim'}</b></span>
                    </div>
                  </div>

                  <div className="receipt-total-akhir-banner">
                    <div>
                      <span className="total-akhir-lbl">Total Akhir Belanja</span>
                      <span className="total-akhir-val">{formatRupiah(receipt.total)}</span>
                    </div>
                    <div className="receipt-total-right-col">
                      <span className="receipt-lunas-badge">
                        {receipt.metode_bayar === 'qris' ? '📱 QRIS Lunas' : '💵 Tunai Lunas'}
                      </span>
                      <span className="receipt-total-sub-qty">
                        {receipt.items?.length || 0} Jenis Item ({receipt.items?.reduce((s, it) => s + (it.jumlah || 1), 0) || 0} Qty)
                      </span>
                    </div>
                  </div>

                  <div className="receipt-rincian-section">
                    <span className="receipt-rincian-header">RINCIAN BARANG TERJUAL</span>
                    <div className="receipt-rincian-list">
                      {receipt.items?.map((it, idx) => {
                        const meta = getProductMeta(it.nama);
                        return (
                          <div key={idx} className="receipt-rincian-row">
                            <div className="receipt-rincian-left">
                              <span className="receipt-rincian-name">{it.nama}</span>
                              <span className="receipt-rincian-math">
                                {it.jumlah} {meta.unit} × {formatRupiah(it.harga)}
                              </span>
                            </div>
                            <span className="receipt-rincian-subtotal">{formatRupiah(it.subtotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="receipt-cash-calc-box">
                    <div className="cash-calc-line">
                      <span className="calc-lbl">Uang Diterima:</span>
                      <span className="calc-val-dark">{formatRupiah(receipt.jumlah_diterima ?? receipt.total)}</span>
                    </div>
                    <div className="cash-calc-line kembalian">
                      <span className="calc-lbl">Kembalian Konsumen:</span>
                      <span className="calc-val-kembalian">
                        {formatRupiah(receipt.kembalian ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="receipt-actions-group">
                    <button
                      type="button"
                      className="btn-transaksi-baru-main"
                      onClick={newTransaction}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>Transaksi Baru [Space]</span>
                    </button>

                    <div className="receipt-secondary-actions">
                      <button
                        type="button"
                        className="btn-receipt-secondary"
                        onClick={handlePrintReceipt}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>Cetak Struk [F9]</span>
                      </button>

                      <button
                        type="button"
                        className="btn-receipt-secondary"
                        onClick={handleSendWhatsAppReceipt}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span>Kirim WhatsApp</span>
                      </button>
                    </div>

                    <div className="receipt-ready-status-footer">
                      <span className="dot-ready">●</span>
                      <span>Kasir siap melayani transaksi berikutnya</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAMPILAN KERANJANG KASIR */
              <div className="kasir-cart-card">
                {/* Header Keranjang */}
                <div className="kasir-cart-header">
                  <div className="kasir-cart-header-title">
                    <div className="cart-header-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <div>
                      <h2>Keranjang Kasir</h2>
                      <span className="kasir-cart-header-sub">
                        {cart.length === 0 ? 'Penjualan Langsung' : 'Pelanggan Umum / Langsung'}
                      </span>
                    </div>
                  </div>
                  {cart.length === 0 ? (
                    <span className="kasir-cart-empty-pill">0 Item</span>
                  ) : (
                    <span className="kasir-cart-count-pill">{cart.length} Item ({totalItemsCount} Pcs)</span>
                  )}
                </div>

                {/* BANNER VALIDASI ERROR GLOBAL STOK TIDAK MENCUKUPI (PERSIS GAMBAR 1) */}
                {cart.length > 0 && hasItemError && (
                  <div className="kasir-global-stock-error-banner" role="alert">
                    <div className="stock-err-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="stock-err-text-col">
                      <h4 className="stock-err-main-title">Transaksi Tidak Dapat Diproses</h4>
                      <p className="stock-err-sub-msg">
                        Kuantitas pada pesanan melebihi jumlah ketersediaan fisik di gudang. Silakan kurangi kuantitas item berperingkat merah sebelum pembayaran.
                      </p>
                    </div>
                  </div>
                )}

                {cart.length === 0 ? (
                  /* STATE KERANJANG KOSONG */
                  <>
                    <div className="kasir-empty-cart-view">
                      <div className="kasir-empty-bag-wrapper">
                        <div className="kasir-empty-bag-circle">
                          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                            <path d="M3 6h18" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span className="kasir-empty-orange-dot"></span>
                        </div>
                      </div>

                      <h3 className="kasir-empty-title">Belum ada produk dipilih</h3>
                      <p className="kasir-empty-sub">
                        Pilih produk dari daftar di sebelah kiri atau ketik nama produk pada kolom pencarian untuk memulai transaksi.
                      </p>

                      <div className="kasir-empty-hint-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v5Z" />
                        </svg>
                        <span>Klik tombol <b>+ Tambah</b> pada produk</span>
                      </div>
                    </div>

                    <div className="kasir-cart-summary-section empty-mode">
                      <div className="kasir-summary-line">
                        <span className="summary-lbl">Subtotal Barang</span>
                        <span className="summary-val">Rp 0</span>
                      </div>
                      <div className="kasir-summary-line">
                        <span className="summary-lbl">Diskon Toko</span>
                        <span className="summary-val">Rp 0</span>
                      </div>
                    </div>

                    <div className="kasir-total-banner-box empty-mode">
                      <div className="kasir-total-label-area">
                        <span className="total-belanja-title">Total Belanja</span>
                        <span className="total-ppn-sub">Termasuk PPN jika berlaku</span>
                      </div>
                      <span className="total-belanja-zero-val">Rp 0</span>
                    </div>

                    <button
                      type="button"
                      className="btn-selesaikan-transaksi disabled empty-style"
                      disabled
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <span>Selesaikan Transaksi</span>
                    </button>

                    <div className="kasir-empty-footer-hint">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="6" y1="8" x2="6" y2="8" />
                        <line x1="10" y1="8" x2="10" y2="8" />
                        <line x1="14" y1="8" x2="14" y2="8" />
                        <line x1="18" y1="8" x2="18" y2="8" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                      </svg>
                      <span>Tekan <b>F2</b> untuk pencarian cepat, <b>Esc</b> untuk membatalkan</span>
                    </div>
                  </>
                ) : (
                  /* STATE KERANJANG TERISI (DENGAN DUKUNGAN VALIDASI ERROR STOK & METODE BAYAR) */
                  <>
                    <div className="kasir-cart-items-list modern-style">
                      {cart.map((it) => {
                        const meta = getProductMeta(it.product.nama, it.product.kategori);
                        const itemErr = localItemError(it) || serverErrors[`items.${it.product.id}`] || '';
                        const qty = Number(it.jumlah);
                        const subtotal = Number.isInteger(qty) && qty > 0 ? it.product.harga * qty : 0;
                        const isStockExceeded = qty > it.product.stok;

                        return (
                          <div
                            key={it.product.id}
                            className={`kasir-cart-row-modern${isStockExceeded ? ' has-stock-error' : ''}`}
                          >
                            <div className="cart-row-header-line">
                              <div className="cart-row-title-badge-group">
                                <span className="cart-row-title">{it.product.nama}</span>
                                {isStockExceeded && (
                                  <span className="stok-kurang-badge">Stok Kurang</span>
                                )}
                              </div>
                              <div className="cart-row-right-group">
                                <span className="cart-row-price-sub">{formatRupiah(subtotal)}</span>
                                <button
                                  type="button"
                                  className="btn-trash-outline"
                                  onClick={() => removeItem(it.product.id)}
                                  title="Hapus"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <div className="cart-row-rate-line">
                              <span>@ {formatRupiah(it.product.harga)} / {meta.unit}</span>
                            </div>

                            <div className="cart-row-stepper-line">
                              <div className="stepper-with-unit-box">
                                <div className="kasir-stepper-pill">
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    onClick={() => stepQty(it.product.id, -1)}
                                    aria-label="Kurangi"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className="stepper-input"
                                    value={it.jumlah}
                                    onChange={(e) => changeQty(it.product.id, e.target.value)}
                                    aria-label={`Jumlah ${it.product.nama}`}
                                  />
                                  <button
                                    type="button"
                                    className="stepper-btn"
                                    onClick={() => stepQty(it.product.id, 1)}
                                    aria-label="Tambah"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="stepper-unit-lbl">{meta.unit}</span>
                              </div>
                            </div>

                            {/* KOTAK ERROR STOK INTERAKTIF DENGAN TOMBOL "Set ke N" (PERSIS GAMBAR 1) */}
                            {isStockExceeded && (
                              <div className="item-stock-warning-box">
                                <div className="stock-warning-left">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                  <span>Stok tidak mencukupi. Stok tersedia: {it.product.stok}</span>
                                </div>
                                <button
                                  type="button"
                                  className="btn-set-max-stock-red"
                                  onClick={() => changeQty(it.product.id, String(it.product.stok))}
                                >
                                  Set ke {it.product.stok}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Ringkasan Subtotal */}
                    <div className="kasir-cart-summary-section modern">
                      <div className="kasir-summary-line">
                        <span className="summary-lbl">Subtotal ({totalItemsCount} barang)</span>
                        <span className="summary-val">{formatRupiah(total)}</span>
                      </div>
                      <div className="kasir-summary-line">
                        <span className="summary-lbl">Diskon Toko</span>
                        <span className="summary-val">Rp 0</span>
                      </div>
                    </div>

                    {/* Total Tagihan Banner */}
                    <div className="kasir-total-tagihan-banner-g1">
                      <div className="total-tagihan-g1-left">
                        <span className="total-tagihan-g1-lbl">Total Tagihan</span>
                        <span className="total-tagihan-g1-sub-lbl">Termasuk PPN</span>
                      </div>
                      <span className="total-tagihan-g1-val">{formatRupiah(total)}</span>
                    </div>

                    {/* BAGIAN PILIHAN METODE BAYAR: MODE NORMAL ATAU MODE ERROR (PERSIS GAMBAR 2) */}
                    {metodeError ? (
                      /* KOTAK ERROR METODE BAYAR MERAH PERSIS GAMBAR 2 */
                      <div className="kasir-payment-error-container" role="alert">
                        <div className="payment-error-red-banner">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>Pilih metode bayar terlebih dahulu</span>
                        </div>

                        <div className="payment-error-body">
                          <div className="payment-error-header-row">
                            <span className="payment-error-title">Metode Bayar *</span>
                            <span className="payment-error-wajib-badge">Wajib dipilih</span>
                          </div>

                          {/* Opsi Cash / Tunai */}
                          <div
                            className={`payment-error-radio-row${metode === 'tunai' ? ' checked' : ''}`}
                            onClick={() => { setMetode('tunai'); setMetodeError(''); }}
                          >
                            <span className={`custom-radio-circle${metode === 'tunai' ? ' checked' : ''}`} />
                            <div className="payment-error-radio-text-col">
                              <div className="payment-error-radio-label-line">
                                <span className="payment-error-opt-name">Cash / Tunai</span>
                                <span className="kbd-shortcut-badge">F7</span>
                              </div>
                              <span className="payment-error-opt-desc">Complete payment using cash / Uang fisik</span>
                            </div>
                          </div>

                          {/* Opsi E-Wallet & QRIS */}
                          <div
                            className={`payment-error-radio-row${metode === 'qris' ? ' checked' : ''}`}
                            onClick={() => { setMetode('qris'); setMetodeError(''); }}
                          >
                            <span className={`custom-radio-circle${metode === 'qris' ? ' checked' : ''}`} />
                            <div className="payment-error-radio-text-col">
                              <div className="payment-error-radio-label-line">
                                <span className="payment-error-opt-name">E-Wallet &amp; QRIS</span>
                                <span className="kbd-shortcut-badge">F8</span>
                              </div>
                              <span className="payment-error-opt-desc">Bayar dengan QRIS resmi toko</span>
                              <div className="payment-error-pill-badges">
                                <span className="pay-brand-pill">QRIS</span>
                                <span className="pay-brand-pill">GoPay</span>
                                <span className="pay-brand-pill">OVO</span>
                                <span className="pay-brand-pill">Dana</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* MODE NORMAL PILIHAN METODE BAYAR (PERSIS GAMBAR 1) */
                      <div className="kasir-payment-option-section">
                        <div className="payment-option-header-row">
                          <span className="payment-option-title">Select Payment Option *</span>
                          <span className="payment-option-count">
                            {metode ? '1 Metode Dipilih' : 'Pilih Metode'}
                          </span>
                        </div>

                        {/* Option 1: Cash / Tunai */}
                        <div
                          className={`payment-radio-card${metode === 'tunai' ? ' selected' : ''}`}
                          onClick={() => { setMetode('tunai'); setMetodeError(''); }}
                        >
                          <div className="radio-circle-box">
                            <span className={`custom-radio-circle${metode === 'tunai' ? ' checked' : ''}`} />
                          </div>
                          <div className="payment-radio-text">
                            <span className="payment-radio-name">Cash / Tunai</span>
                            <span className="payment-radio-desc">Complete payment using cash / Uang fisik</span>
                          </div>
                        </div>

                        {/* Option 2: QRIS (Pembayaran Non-Tunai / E-Money) */}
                        <div
                          className={`payment-radio-card qris-card${metode === 'qris' ? ' selected' : ''}`}
                          onClick={() => { setMetode('qris'); setMetodeError(''); }}
                        >
                          <div className="qris-card-top-row">
                            <div className="radio-circle-box">
                              <span className={`custom-radio-circle${metode === 'qris' ? ' checked' : ''}`} />
                            </div>
                            <div className="payment-radio-text">
                              <span className="payment-radio-name">QRIS (Pembayaran Non-Tunai / E-Money)</span>
                              <span className="payment-radio-desc">Bayar dengan QRIS resmi toko dari bank atau e-wallet</span>
                            </div>
                          </div>

                          {metode === 'qris' && (
                            <div className="qris-inner-features-box">
                              <div className="qris-inner-badge-box">
                                <span className="qris-bold-label">QRIS</span>
                              </div>
                              <div className="qris-inner-text-col">
                                <div className="qris-inner-title-row">
                                  <span className="qris-inner-main-title">Standar QRIS Nasional</span>
                                  <span className="qris-otomatis-pill">Konfirmasi kasir</span>
                                </div>
                                <span className="qris-inner-sub-text">
                                  Pembayaran diverifikasi manual oleh kasir setelah diterima di aplikasi merchant.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BANNER PERINGATAN METODE DI BAWAH KOTAK MERAH (PERSIS GAMBAR 2) */}
                    {metodeError && (
                      <div className="kasir-mohon-lengkapi-banner">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Mohon lengkapi metode pembayaran</span>
                      </div>
                    )}

                    {/* TOMBOL AKSI SELESAIKAN TRANSAKSI: ORANYE SAAT ERROR METODE BAYAR, ABU-ABU SAAT STOK KURANG, HIJAU SAAT SIAP */}
                    {hasItemError ? (
                      <>
                        <button
                          type="button"
                          className="btn-selesaikan-g1 disabled"
                          disabled
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Selesaikan Transaksi</span>
                        </button>
                        <p className="kasir-stock-error-helper">
                          Perbaiki kuantitas stok sebelum memproses
                        </p>
                      </>
                    ) : metodeError ? (
                      /* TOMBOL ORANYE PERSIS SEPERTI GAMBAR 2 */
                      <button
                        type="button"
                        className="btn-selesaikan-orange-g2"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <span>Selesaikan Transaksi</span>
                        <span className="btn-f9-badge">F9</span>
                      </button>
                    ) : (
                      /* TOMBOL HIJAU READY PERSIS GAMBAR 1 */
                      <button
                        type="button"
                        className={`btn-selesaikan-g1${!metode ? ' disabled' : ' ready'}`}
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <span>Memproses Transaksi...</span>
                        ) : metode === 'qris' ? (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="3" height="3" />
                              <rect x="18" y="14" width="3" height="3" />
                              <rect x="14" y="18" width="3" height="3" />
                              <rect x="18" y="18" width="3" height="3" />
                            </svg>
                            <span>Konfirmasi Pembayaran QRIS [F9]</span>
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="6" width="20" height="12" rx="2" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>Selesaikan Transaksi [F9]</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Tombol Tahan (Hold) & Reset (Esc) Sesuai Gambar 1 & 2 */}
                    <div className="kasir-footer-actions-g1">
                      <button
                        type="button"
                        className="btn-hold-action"
                        onClick={() => showToast('Transaksi berhasil disimpan ke antrean Hold')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="10" y1="15" x2="10" y2="9" />
                          <line x1="14" y1="15" x2="14" y2="9" />
                        </svg>
                        <span>Tahan (Hold)</span>
                      </button>

                      <button
                        type="button"
                        className="btn-reset-action-g1"
                        onClick={handleResetCart}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        <span>{hasItemError ? 'Reset Kasir' : 'Reset (Esc)'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
      {paymentOpen && (
        <div className="kasir-payment-modal-backdrop">
          <section
            className="kasir-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kasir-payment-title"
          >
            <h2 id="kasir-payment-title">
              {metode === 'qris' ? 'Konfirmasi Pembayaran QRIS' : 'Pembayaran Tunai'}
            </h2>
            <div className="kasir-payment-modal-total">
              <span>Total tagihan</span>
              <strong>{formatRupiah(total)}</strong>
            </div>

            {metode === 'tunai' ? (
              <>
                <label className="kasir-payment-field-label" htmlFor="cash-received">
                  Uang Diterima dari Pelanggan
                </label>
                <div className="kasir-payment-input-wrap">
                  <span className="kasir-payment-input-prefix">Rp</span>
                  <input
                    id="cash-received"
                    className="kasir-payment-cash-input"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={cashReceived ? Number(cashReceived).toLocaleString('id-ID') : ''}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/\D/g, '');
                      setCashReceived(raw ? String(Number(raw)) : '');
                      setPaymentError('');
                    }}
                    placeholder="0"
                    aria-invalid={Boolean(paymentError)}
                  />
                </div>

                {/* Tombol Cepat Nominal Uang Pas / Pecahan */}
                <div className="kasir-cash-presets">
                  <button
                    type="button"
                    className="kasir-preset-btn"
                    onClick={() => {
                      setCashReceived(String(total));
                      setPaymentError('');
                    }}
                  >
                    Uang Pas ({formatRupiah(total)})
                  </button>
                  {[20000, 50000, 100000, 200000]
                    .filter((amt) => amt >= total || total > 100000)
                    .slice(0, 3)
                    .map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="kasir-preset-btn"
                        onClick={() => {
                          setCashReceived(String(amt));
                          setPaymentError('');
                        }}
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                </div>

                <div className="kasir-payment-change">
                  <span>Kembalian</span>
                  <strong>
                    {Number.isSafeInteger(Number(cashReceived)) && Number(cashReceived) >= total
                      ? formatRupiah(Number(cashReceived) - total)
                      : formatRupiah(0)}
                  </strong>
                </div>
              </>
            ) : (
              <div className="kasir-qris-confirmation">
                <p>Minta pelanggan membayar menggunakan QRIS resmi toko. QR tidak dibuat oleh aplikasi ini.</p>
                <label>
                  <input
                    type="checkbox"
                    checked={qrisConfirmed}
                    onChange={(event) => {
                      setQrisConfirmed(event.target.checked);
                      setPaymentError('');
                    }}
                  />
                  <span>Saya sudah memastikan pembayaran diterima di aplikasi merchant.</span>
                </label>
              </div>
            )}

            {paymentError && <p className="kasir-payment-error" role="alert">{paymentError}</p>}

            <div className="kasir-payment-modal-actions">
              <button
                type="button"
                className="kasir-payment-cancel"
                onClick={() => {
                  setPaymentOpen(false);
                  setPaymentError('');
                }}
                disabled={submitting}
              >
                Batalkan Pembayaran
              </button>
              <button
                type="button"
                className="kasir-payment-confirm"
                onClick={confirmPayment}
                disabled={submitting}
              >
                {submitting ? 'Memproses...' : 'Konfirmasi & Selesaikan'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Dokumen Cetak Struk Kasir Thermal (Sesuai Desain Referensi plan/struk.png) */}
      {receipt && (
        <div className="kasir-thermal-print-document" aria-hidden="true">
          <div className="receipt-thermal-paper">
            <div className="thermal-header">
              <div className="thermal-store-name">TOKO ABAH SEMBAKO</div>
              <div className="thermal-store-desc">Kebutuhan Pokok &amp; Sembako Murah</div>
              <div className="thermal-store-address">Jl. Raya Telang No. 15 Kamal, Bangkalan</div>
              <div className="thermal-store-phone">Telp/WA: 085708350575</div>
              <div className="thermal-double-line">================================</div>
            </div>

            <div className="thermal-meta">
              <div className="thermal-row">
                <span>No. Trx :</span>
                <span>#TRX-1024-0{receipt.id < 10 ? `0${receipt.id}` : receipt.id}</span>
              </div>
              <div className="thermal-row">
                <span>Tanggal :</span>
                <span>
                  {new Date(receipt.tanggal || Date.now()).toLocaleDateString('id-ID')}{' '}
                  {new Date(receipt.tanggal || Date.now()).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="thermal-row">
                <span>Kasir   :</span>
                <span>{user?.nama || 'Abah Rohim'}</span>
              </div>
              <div className="thermal-row">
                <span>Metode  :</span>
                <span>{receipt.metode_bayar === 'qris' ? 'QRIS INSTAN' : 'TUNAI / CASH'}</span>
              </div>
              <div className="thermal-dash-line">--------------------------------</div>
            </div>

            <div className="thermal-items-list">
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((it, idx) => (
                  <div key={idx} className="thermal-item-entry">
                    <div className="thermal-item-title">{it.nama}</div>
                    <div className="thermal-item-calc">
                      <span>{it.jumlah} x {formatRupiah(it.harga)}</span>
                      <span>{formatRupiah(it.subtotal)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="thermal-item-entry">
                  <div className="thermal-item-title">Total Pembelian Produk Sembako</div>
                  <div className="thermal-item-calc">
                    <span>1 x {formatRupiah(receipt.total)}</span>
                    <span>{formatRupiah(receipt.total)}</span>
                  </div>
                </div>
              )}
              <div className="thermal-dash-line">--------------------------------</div>
            </div>

            <div className="thermal-totals">
              <div className="thermal-row">
                <span>Total Item :</span>
                <span>{receipt.items?.reduce((s, it) => s + (it.jumlah || 1), 0) || 1} Pcs</span>
              </div>
              <div className="thermal-row font-bold">
                <span>SUBTOTAL   :</span>
                <span>{formatRupiah(receipt.total)}</span>
              </div>
              <div className="thermal-row">
                <span>Ongkir     :</span>
                <span>Rp 0</span>
              </div>
              <div className="thermal-dash-line">--------------------------------</div>
              <div className="thermal-row font-bold large">
                <span>TOTAL      :</span>
                <span>{formatRupiah(receipt.total)}</span>
              </div>
              <div className="thermal-row">
                <span>BAYAR ({receipt.metode_bayar === 'qris' ? 'QRIS' : 'TUNAI'}) :</span>
                <span>{formatRupiah(receipt.jumlah_diterima ?? receipt.total)}</span>
              </div>
              <div className="thermal-row font-bold">
                <span>KEMBALI    :</span>
                <span>{formatRupiah(receipt.kembalian ?? 0)}</span>
              </div>
              <div className="thermal-double-line">================================</div>
            </div>

            <div className="thermal-footer">
              <div className="thermal-footer-title">TERIMA KASIH TELAH BERBELANJA</div>
              <div className="thermal-footer-sub">DI TOKO ABAH SEMBAKO</div>
              <div className="thermal-footer-note">Barang yang sudah dibeli tidak dapat</div>
              <div className="thermal-footer-note">ditukar atau dikembalikan</div>
              <div className="thermal-double-line">================================</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
