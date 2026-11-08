import { useEffect, useState } from 'react';
import shelfImage from '../assets/store-banner.jpg';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/stockService';
<<<<<<< HEAD
import { formatStock } from '../utils/format';
=======
import './StockPage.css';

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';
>>>>>>> b8625797fc729a643a19848b54d756a6603f9327

export default function StockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ stok_kritis: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);

  // State Modal Perbarui Stok
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [methodTab, setMethodTab] = useState('opname'); // 'opname' | 'restock'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stockService
      .list({ search, kritis: onlyCritical ? 'true' : '' })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data || []);
        if (res.ringkasan) {
          setSummary(res.ringkasan);
        }
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, onlyCritical, reload]);

  function openModal(product) {
    setEditing(product);
    setNewStock(String(product.stok));
    setFieldError('');
    setMethodTab('opname');
  }

  function closeModal() {
    if (!saving) {
      setEditing(null);
      setFieldError('');
    }
  }

  const handleStepStock = (delta) => {
    const cur = newStock === '' || isNaN(Number(newStock)) ? 0 : Number(newStock);
    const next = Math.max(0, cur + delta);
    setNewStock(String(next));
    setFieldError('');
  };

  async function handleSave(e) {
    e.preventDefault();
    if (newStock.trim() === '') {
      return setFieldError(REQUIRED);
    }
    const n = Number(newStock);
    if (!Number.isFinite(n)) {
      return setFieldError(INVALID_NUMBER);
    }
    if (n < 0) {
      return setFieldError('Jumlah stok tidak boleh negatif');
    }

    setSaving(true);
    setFieldError('');
    try {
      await stockService.update(editing.id, n);
      setMessage(`Stok ${editing.nama} berhasil diperbarui`);
      setEditing(null);
      setReload((x) => x + 1);
    } catch (err) {
      if (err.status === 422) {
        setFieldError(err.errors?.stok || err.message);
      } else {
        setFieldError(err.message || 'Gagal memperbarui stok');
      }
    } finally {
      setSaving(false);
    }
  }

  // Filter kategori lokal jika dipilih
  const displayRows = selectedCategory
    ? rows.filter((r) => r.kategori === selectedCategory)
    : rows;

  const totalSKU = rows.length;
  const criticalCount = summary.stok_kritis;
  const safeCount = Math.max(0, totalSKU - criticalCount);

  // Ambil daftar kategori unik dari data
  const categoriesList = Array.from(new Set(rows.map((r) => r.kategori).filter(Boolean)));

  // Ikon dekoratif berdasarkan kategori / jenis produk
  const getProductIcon = (nama = '', kategori = '') => {
    const lower = (nama + ' ' + kategori).toLowerCase();
    if (lower.includes('beras')) return { icon: '🌾', className: 'rice' };
    if (lower.includes('minyak')) return { icon: '💧', className: 'oil' };
    if (lower.includes('gula')) return { icon: '🍬', className: 'sugar' };
    if (lower.includes('telur')) return { icon: '🥚', className: 'egg' };
    if (lower.includes('mie')) return { icon: '🍜', className: 'rice' };
    if (lower.includes('kopi') || lower.includes('teh')) return { icon: '☕', className: 'oil' };
    return { icon: '📦', className: 'sugar' };
  };

  return (
    <div className="stock-page-container">
      {/* 1. Header Navbar Atas */}
      <header className="stock-top-navbar">
        <div className="stock-navbar-left">
          <div className="stock-navbar-title-row">
            <h2 className="stock-navbar-title">Selamat Datang, Kasir Toko Abah</h2>
            <span className="pill-store-status">
              <span style={{ fontSize: '8px' }}>●</span> Toko Buka
            </span>
          </div>
          <span className="stock-navbar-subtitle">Shift Pagi • Operasional Kasir & Gudang</span>
        </div>

        <div className="stock-navbar-right">
          <div className="date-pill-indicator">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Hari ini</span>
          </div>

          <div className="user-badge-profile">
            <div className="user-avatar-round">
              {user?.nama ? user.nama.charAt(0) : 'PA'}
            </div>
            <div className="user-info-text">
              <span className="user-fullname">{user?.nama || 'Pak Abah'}</span>
              <span className="user-role-label">
                {user?.role === 'admin' ? 'Pemilik Toko' : 'Pegawai Toko'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Judul Halaman dan Aksi Utama */}
      <div className="stock-page-header">
        <div className="stock-page-header-left">
          <h1>Daftar Stok</h1>
          <p>
            Pantau ketersediaan fisik barang dagangan, deteksi dini stok menipis, dan lakukan pembaruan stok kasir.
          </p>
        </div>

        <div className="stock-header-actions">
          <button
            type="button"
            className="btn-print-report"
            onClick={() => window.print()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak Laporan</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn-restock-entry"
              onClick={() => {
                const firstCrit = rows.find((r) => r.status_stok === 'Stok Kritis') || rows[0];
                if (firstCrit) openModal(firstCrit);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Tambah Restock / Masuk Barang</span>
            </button>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {error && <div className="alert-error" role="alert">{error}</div>}
      {loading ? (
        <p className="muted">Memuat stok...</p>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Batas Minimum</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">Produk tidak ditemukan.</td>
                </tr>
              )}
              {rows.map((product) => (
                <tr
                  key={product.id}
                  className={product.status_stok === 'Stok Kritis' ? 'row-critical' : ''}
                >
                  <td>{product.nama}</td>
                  <td>{product.kategori}</td>
                  <td>{formatStock(product.stok)} {product.satuan}</td>
                  <td>{formatStock(product.batas_stok_kritis)}</td>
                  <td><Badge status={product.status_stok} /></td>
                  <td>
                    <Button onClick={() => openUpdate(product)}>
                      {isAdmin ? 'Ubah Stok' : 'Kurangi Stok'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selectedProduct)}
        title={isAdmin ? 'Ubah Stok Produk' : 'Kurangi Stok Produk'}
        onClose={() => !saving && setSelectedProduct(null)}
      >
        {selectedProduct && (
          <form onSubmit={handleSubmit}>
            <p>{selectedProduct.nama}</p>
            <p className="muted">
              Stok saat ini: {formatStock(selectedProduct.stok)} {selectedProduct.satuan}
            </p>
            <TextField
              label="Stok baru"
              type="number"
              min="0"
              max={isAdmin ? undefined : Number(selectedProduct.stok) - 1}
              step="1"
              value={newStock}
              onChange={(event) => setNewStock(event.target.value)}
              helper={!isAdmin ? 'Pegawai hanya dapat mengurangi stok.' : undefined}
              required
            />
            {formError && <div className="alert-error" role="alert">{formError}</div>}
            <div className="toolbar" style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
              <Button variant="secondary" disabled={saving} onClick={() => setSelectedProduct(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
=======
      {/* Pesan Sukses / Error Global */}
      {message && (
        <div className="alert-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {/* 3. Kotak Peringatan Stok Kritis (Danger Banner) */}
      {criticalCount > 0 && (
        <div className="stock-critical-alert">
          <div className="alert-left-content">
            <div className="alert-triangle-icon">⚠</div>
            <div className="alert-text-block">
              <div className="alert-title-row">
                <span className="alert-title-text">
                  Peringatan: {criticalCount} Produk Stok Kritis
                </span>
                <span className="badge-urgent-action">PERLU TINDAKAN CEPAT</span>
              </div>
              <p className="alert-description-text">
                Segera lakukan pemesanan ke agen grosir agar penjualan kasir tidak terganggu dan ketersediaan sembako tetap terjaga.
              </p>
>>>>>>> b8625797fc729a643a19848b54d756a6603f9327
            </div>
          </div>

          <button
            type="button"
            className="btn-view-critical"
            onClick={() => setOnlyCritical((prev) => !prev)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{onlyCritical ? 'Tampilkan Semua Barang' : 'Lihat Barang Kritis'}</span>
          </button>
        </div>
      )}

      {/* 4. Tiga Kartu Ringkasan Metrik */}
      <div className="stock-metrics-grid">
        {/* Card 1: Total SKU Dipantau */}
        <div className="metric-card-box">
          <div className="metric-card-top">
            <span className="metric-card-label">Total SKU Dipantau</span>
            <span className="metric-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
          </div>
          <div className="metric-card-number">{totalSKU} Produk</div>
          <div className="metric-card-footer">
            <span style={{ color: '#15803d' }}>✓</span> Seluruh rak toko & gudang aktif
          </div>
        </div>

        {/* Card 2: Stok Kritis */}
        <div className="metric-card-box critical-state">
          <div className="metric-card-top">
            <span className="metric-card-label">Stok Kritis</span>
            <span className="metric-card-icon">!</span>
          </div>
          <div className="metric-card-number">{criticalCount} Perlu Restock Segera</div>
          <div className="metric-card-footer">
            <span>⏱</span> Di bawah batas minimum harian kasir
          </div>
        </div>

        {/* Card 3: Stok Aman */}
        <div className="metric-card-box safe-state">
          <div className="metric-card-top">
            <span className="metric-card-label">Stok Aman</span>
            <span className="metric-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div className="metric-card-number">{safeCount} Produk Tersedia</div>
          <div className="metric-card-footer">
            <span style={{ color: '#15803d' }}>📈</span>{' '}
            {totalSKU > 0 ? `${Math.round((safeCount / totalSKU) * 100)}%` : '100%'} ketersediaan stok terjaga
          </div>
        </div>
      </div>

      {/* 5. Toolbar Filter & Pencarian */}
      <div className="stock-filter-toolbar">
        <div className="search-input-group">
          <span className="search-input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="stock-search-input"
            placeholder="Cari nama produk, merek, atau..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-actions-right">
          <label className="toggle-critical-switch" onClick={() => setOnlyCritical(!onlyCritical)}>
            <div className={`toggle-switch-pill${onlyCritical ? ' is-active' : ''}`}>
              <div className="toggle-switch-circle" />
            </div>
            <div className="toggle-text-block">
              <span className="toggle-text-main">Tampilkan stok kritis saja</span>
              <span className="toggle-text-sub">
                {onlyCritical ? 'Item kritis aktif' : 'Semua item tampil'}
              </span>
            </div>
          </label>

          {categoriesList.length > 0 && (
            <select
              className="select-filter-dropdown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 6. Tabel Pemantauan Stok Sembako */}
      <div className="stock-table-card">
        <div className="stock-table-card-header">
          <div className="table-header-title-row">
            <span className="table-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </span>
            <span>Tabel Pemantauan Stok Sembako</span>
          </div>
          <span className="table-header-note">Status diperbarui otomatis dari transaksi mesin kasir</span>
        </div>

        {loading ? (
          <p className="muted" style={{ padding: '32px 20px', textAlign: 'center' }}>
            Memuat...
          </p>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-data-table">
              <thead>
                <tr>
                  <th>NAMA PRODUK</th>
                  <th>STOK FISIK</th>
                  <th>BATAS KRITIS</th>
                  <th>STATUS</th>
                  {isAdmin && <th>AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="muted" style={{ textAlign: 'center', padding: '36px 20px' }}>
                      Produk tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((p) => {
                    const isCritical = p.status_stok === 'Stok Kritis';
                    const iconMeta = getProductIcon(p.nama, p.kategori);
                    return (
                      <tr key={p.id} className={isCritical ? 'row-critical' : ''}>
                        {/* Nama Produk */}
                        <td>
                          <div className="product-cell-wrapper">
                            <span className={`product-icon-avatar ${iconMeta.className}`}>
                              {iconMeta.icon}
                            </span>
                            <div className="product-cell-info">
                              <span className="product-cell-name">{p.nama}</span>
                              <span className="product-cell-meta">
                                SKU: BER-ROJO-{p.id}K • {p.kategori}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stok Fisik */}
                        <td>
                          <span className={`stock-value-cell${isCritical ? ' is-critical' : ''}`}>
                            {p.stok} unit
                          </span>
                        </td>

                        {/* Batas Kritis */}
                        <td>
                          <span style={{ color: '#4b5563', fontWeight: 500 }}>
                            {p.batas_stok_kritis} unit
                          </span>
                        </td>

                        {/* Status (Badge) */}
                        <td>
                          <Badge status={p.status_stok} />
                        </td>

                        {/* Aksi (Khusus Admin, Rule A8 & AC-03.1) */}
                        {isAdmin && (
                          <td>
                            <button
                              type="button"
                              className="btn-update-stock-row"
                              onClick={() => openModal(p)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                              </svg>
                              <span>Perbarui Stok</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Info Data */}
        <div className="table-pagination-footer">
          <span>
            Menampilkan {displayRows.length} dari {totalSKU} produk
          </span>
          <div className="pagination-pages-group">
            <button type="button" className="pagination-btn" disabled>
              ‹ Sebelumnya
            </button>
            <button type="button" className="pagination-btn is-active">
              1
            </button>
            <button type="button" className="pagination-btn" disabled>
              Berikutnya ›
            </button>
          </div>
        </div>
      </div>

      {/* 7. Dialog Modal "Perbarui Stok" (Layar 6 Stitch) */}
      {Boolean(editing) && (
        <div
          className="stock-modal-backdrop"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="stock-modal-window"
            role="dialog"
            aria-modal="true"
            aria-label="Perbarui Stok"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="stock-modal-header">
              <div className="stock-modal-header-left">
                <div className="modal-header-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </div>
                <div className="modal-header-title-box">
                  <h3>Perbarui Stok</h3>
                  <p>Perbarui jumlah fisik barang di etalase dan gudang Toko Abah.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-close-modal"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} noValidate>
              {/* Product Summary Box */}
              <div className={`modal-product-summary-card${editing.status_stok === 'Stok Kritis' ? ' is-critical' : ''}`}>
                <div className="summary-card-left">
                  <img
                    src={shelfImage}
                    alt={editing.nama}
                    className="summary-product-thumb"
                  />
                  <div className="summary-details">
                    <div className="summary-name-row">
                      <span className="summary-product-name">{editing.nama}</span>
                      {editing.status_stok === 'Stok Kritis' && (
                        <span className="badge-modal-critical">● Stok Kritis (Segera Restock)</span>
                      )}
                    </div>
                    <span className="summary-sku-text">
                      SKU: BER-ROJO-{editing.id}K • Kategori: {editing.kategori}
                    </span>
                    {editing.status_stok === 'Stok Kritis' && (
                      <span className="summary-warning-subtext">
                        ⚠ Batas Kritis: {editing.batas_stok_kritis} unit (stok sudah berada di bawah ambang aman)
                      </span>
                    )}
                  </div>
                </div>

                <div className="summary-current-stock-box">
                  <span className="current-stock-label">Stok saat ini:</span>
                  <span className={`current-stock-num${editing.status_stok === 'Stok Kritis' ? ' is-critical' : ''}`}>
                    {editing.stok} unit
                  </span>
                </div>
              </div>

              {/* Segmented Control Metode Pembaruan */}
              <div className="modal-method-section">
                <div className="method-label-title">Metode Pembaruan</div>
                <div className="method-tabs-wrap">
                  <button
                    type="button"
                    className={`method-tab-item${methodTab === 'opname' ? ' is-selected' : ''}`}
                    onClick={() => setMethodTab('opname')}
                  >
                    <span>✔</span> Hitung Ulang Fisik (Opname)
                  </button>
                  <button
                    type="button"
                    className={`method-tab-item${methodTab === 'restock' ? ' is-selected' : ''}`}
                    onClick={() => setMethodTab('restock')}
                  >
                    <span>+</span> Tambah Stok Masuk (Restock)
                  </button>
                </div>
                <div className="method-help-desc">
                  Angka yang dimasukkan akan menggantikan stok lama secara langsung.
                </div>
              </div>

              {/* Kolom Jumlah Stok Baru */}
              <div className="modal-input-group">
                <div className="modal-input-label-row">
                  <label htmlFor="new-stock-input" className="input-main-label">
                    Jumlah Stok Baru <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <span className="input-unit-label">Satuan: unit</span>
                </div>

                <div className={`modal-stepper-container${fieldError ? ' has-field-error' : ''}`}>
                  <button
                    type="button"
                    className="modal-stepper-btn"
                    onClick={() => handleStepStock(-1)}
                    aria-label="Kurangi"
                    disabled={saving}
                  >
                    −
                  </button>
                  <input
                    id="new-stock-input"
                    type="text"
                    className="modal-stepper-input"
                    value={newStock}
                    onChange={(e) => {
                      setNewStock(e.target.value);
                      setFieldError('');
                    }}
                    autoFocus
                    placeholder="0"
                    disabled={saving}
                  />
                  {fieldError && (
                    <span className="modal-stepper-error-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  )}
                  <button
                    type="button"
                    className="modal-stepper-btn plus-btn"
                    onClick={() => handleStepStock(1)}
                    aria-label="Tambah"
                    disabled={saving}
                  >
                    +
                  </button>
                </div>

                {fieldError && (
                  <div className="modal-field-error-alert" role="alert">
                    <span>ⓘ</span> {fieldError}
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
