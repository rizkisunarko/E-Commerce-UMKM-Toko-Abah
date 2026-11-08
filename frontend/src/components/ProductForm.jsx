import { useState } from 'react';
import shelfImage from '../assets/store-banner.jpg';
import { formatRupiah } from '../utils/format';
import './ProductForm.css';

const EMPTY = {
  nama: '',
  kategori: '',
  harga: '',
  berat: '',
  stok: '',
  batas_stok_kritis: '',
};

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';

function validate(values, showStock) {
  const e = {};
  if (!values.nama || !values.nama.trim()) {
    e.nama = REQUIRED;
  }

  if (!values.kategori) {
    e.kategori = REQUIRED;
  }

  if (values.harga === '' || values.harga === null || values.harga === undefined) {
    e.harga = REQUIRED;
  } else {
    const harga = Number(values.harga);
    if (!Number.isFinite(harga) || harga <= 0) {
      e.harga = INVALID_NUMBER;
    }
  }

  if (values.berat === '' || values.berat === null || values.berat === undefined) {
    e.berat = REQUIRED;
  } else {
    const berat = Number(values.berat);
    if (!Number.isFinite(berat) || berat <= 0) {
      e.berat = INVALID_NUMBER;
    }
  }

  if (showStock) {
    if (values.stok === '' || values.stok === null || values.stok === undefined) {
      e.stok = REQUIRED;
    } else {
      const stok = Number(values.stok);
      if (!Number.isFinite(stok)) {
        e.stok = INVALID_NUMBER;
      } else if (stok < 0) {
        e.stok = 'Jumlah stok tidak boleh negatif';
      }
    }
  }

  if (values.batas_stok_kritis !== '' && values.batas_stok_kritis !== null && values.batas_stok_kritis !== undefined) {
    const b = Number(values.batas_stok_kritis);
    if (!Number.isFinite(b) || b < 0) {
      e.batas_stok_kritis = INVALID_NUMBER;
    }
  }

  return e;
}

export default function ProductForm({
  categories = [],
  initialValues,
  errors = {},
  formError = '',
  submitting = false,
  submitLabel = 'Simpan Produk',
  showStock = true,
  hargaHelper,
  isEdit = false,
  currentStock,
  pageTitle,
  pageSubtitle,
  lastUpdatedText,
  onSubmit,
  onCancel,
  user,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [clientErrors, setClientErrors] = useState({});
  const [showTips, setShowTips] = useState(true);
  const [skuCode, setSkuCode] = useState(isEdit ? '8991002104509' : '899276100123');
  const [activeChips, setActiveChips] = useState(['Produk Terlaris']);
  const [testErrorMode, setTestErrorMode] = useState(false);

  // Gabungkan error: error lokal/klien menimpa error dari server jika kolom diubah
  const shown = { ...errors, ...clientErrors };
  const errorCount = Object.keys(shown).filter((k) => Boolean(shown[k])).length;
  const hasErrors = errorCount > 0 || Boolean(formError);

  const change = (field) => (e) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));
    setClientErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleStep = (field, delta, min = 0, defaultVal = 0) => {
    setValues((prev) => {
      const raw = prev[field];
      const cur = raw === '' || isNaN(Number(raw)) ? defaultVal : Number(raw);
      const next = Math.max(min, cur + delta);
      return { ...prev, [field]: String(next) };
    });
    setClientErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleRandomizeSKU = () => {
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    setSkuCode(`899${randomSuffix}`);
  };

  const toggleChip = (chipLabel) => {
    setActiveChips((prev) =>
      prev.includes(chipLabel) ? prev.filter((c) => c !== chipLabel) : [...prev, chipLabel]
    );
  };

  const handleReset = () => {
    setValues({ ...EMPTY, ...initialValues });
    setClientErrors({});
    setTestErrorMode(false);
  };

  // Toggle mode uji validasi error vs mode normal untuk keperluan review desain Stitch
  const handleToggleTestMode = () => {
    if (!testErrorMode) {
      setTestErrorMode(true);
      setValues({
        nama: '',
        kategori: '',
        harga: 'abc',
        berat: '-200',
        stok: showStock ? '0' : values.stok,
        batas_stok_kritis: '5',
      });
      const testErrs = {
        nama: REQUIRED,
        kategori: REQUIRED,
        harga: INVALID_NUMBER,
        berat: INVALID_NUMBER,
      };
      if (showStock) {
        testErrs.stok = REQUIRED;
      }
      setClientErrors(testErrs);
    } else {
      setTestErrorMode(false);
      handleReset();
    }
  };

  // Tombol "Isi Data Contoh yang Benar" dari panel koreksi cepat di sisi kanan
  const handleFillValidSample = () => {
    setTestErrorMode(false);
    setValues({
      nama: isEdit ? 'Beras Ramos Wangi 5 kg' : 'Beras Ramos Premium 5 Kg',
      kategori: categories[0] || 'Beras & Pokok',
      harga: isEdit ? '72000' : '65000',
      berat: '5000',
      stok: isEdit ? (currentStock !== undefined ? String(currentStock) : '42') : '50',
      batas_stok_kritis: '10',
    });
    setClientErrors({});
  };

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values, showStock);
    setClientErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit(values);
  }

  const effectiveStock = currentStock !== undefined ? currentStock : (values.stok !== '' && !isNaN(Number(values.stok)) ? Number(values.stok) : 42);

  return (
    <div className="product-create-container">
      {/* 1. Header Bagian Atas (Welcome bar & Info Toko) */}
      <header className="product-top-navbar">
        <div className="top-navbar-left">
          <div className="top-navbar-title-row">
            <h2 className="top-navbar-title">Selamat Datang, Kasir Toko Abah</h2>
            <span className="pill-store-open">
              <span style={{ fontSize: '8px' }}>●</span> Toko Buka
            </span>
          </div>
          <span className="top-navbar-subtitle">Shift Pagi • Operasional Kasir & Gudang</span>
        </div>

        <div className="top-navbar-right">
          <div className="date-indicator-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Hari ini</span>
          </div>

          <div className="user-profile-badge">
            <div className="user-avatar-circle">
              {user?.nama ? user.nama.charAt(0) : 'PA'}
            </div>
            <div className="user-profile-info">
              <span className="user-name-text">{user?.nama || 'Pak Abah'}</span>
              <span className="user-role-text">
                {user?.role === 'admin' ? 'Pemilik Toko' : 'Pegawai Toko'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Breadcrumb & Action Mode */}
      <div className="breadcrumb-action-bar">
        <div className="breadcrumb-left">
          <button type="button" className="btn-breadcrumb-back" onClick={onCancel}>
            ← Kembali ke Daftar Produk
          </button>
          {!isEdit && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-trail-title">KATALOG SEMBAKO</span>
            </>
          )}
        </div>

        <div className="breadcrumb-right">
          {isEdit ? (
            <>
              <span className="badge-sku-code"># SKU: BER-ROJO-5K</span>
              <span className="badge-active-sale">
                <span style={{ fontSize: '7px' }}>●</span> Aktif Dijual
              </span>
            </>
          ) : hasErrors || testErrorMode ? (
            <div className="badge-status-catalog error-state">
              <span>●</span> State: Validasi Gagal (Form Error)
            </div>
          ) : (
            <div className="badge-status-catalog">
              <span style={{ color: '#16a34a' }}>●</span> Katalog Aktif Toko
            </div>
          )}

          <button
            type="button"
            className={`btn-toggle-mode${testErrorMode ? ' normal-mode' : ''}`}
            onClick={handleToggleTestMode}
            title="Klik untuk beralih mode tampilan sesuai screenshot desain"
          >
            {testErrorMode ? (
              'Alihkan ke Normal'
            ) : (
              <>
                <span>⚙</span> Uji Mode Validasi Error
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Judul Halaman */}
      <div className="page-title-section">
        <div className="page-title-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>{pageTitle || (isEdit ? `Ubah Produk: ${values.nama || 'Produk'}` : 'Tambah Produk Baru')}</h1>
            {(hasErrors || testErrorMode) && (
              <span className="badge-error-counter">
                {Math.max(errorCount, 3)} GALAT DITEMUKAN
              </span>
            )}
          </div>

          {isEdit && (
            <div className="time-updated-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{lastUpdatedText || 'Terakhir diperbarui: Hari ini, 09:30 WIB oleh Pak Abah'}</span>
            </div>
          )}
        </div>
        <p className="page-title-desc">
          {pageSubtitle ||
            (isEdit
              ? 'Perbarui informasi barang, penyesuaian harga jual, dan kontrol stok fisik untuk katalog Toko Abah.'
              : 'Masukkan rincian informasi barang dagangan baru untuk ditambahkan ke katalog & inventaris Toko Abah.')}
        </p>
      </div>

      {/* 4. Alert Banner (Tips atau Error) */}
      {hasErrors || testErrorMode ? (
        <div className="alert-error-banner" role="alert">
          <div className="error-banner-icon">!</div>
          <div>
            <h3 className="error-banner-title">Gagal Menyimpan Produk</h3>
            <p className="error-banner-desc">
              {formError ||
                'Terdapat kolom wajib yang belum diisi atau berisi nilai tidak valid. Mohon periksa kembali kolom yang ditandai merah di bawah.'}
            </p>
          </div>
        </div>
      ) : showTips && !isEdit ? (
        <div className="alert-tips-banner">
          <div className="tips-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
            </svg>
          </div>
          <div className="tips-content-wrap">
            <div className="tips-title-row">
              <span className="tips-title">Tips Kasir & Pengemasan</span>
              <span className="tag-badge-important">PENTING</span>
            </div>
            <p className="tips-desc">
              Pastikan berat barang akurat untuk estimasi ongkir pengiriman pesanan warga via kurir lokal dan pengemasan kardus sembako.
            </p>
          </div>
          <button
            type="button"
            className="btn-close-tips"
            onClick={() => setShowTips(false)}
            aria-label="Tutup tips"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* 5. Konten Utama: 2 Kolom (Form di Kiri, Preview di Kanan) */}
      <div className="product-content-grid">
        {/* Kolom Kiri: Form */}
        <form className="product-form-column" onSubmit={handleSubmit} noValidate>
          {/* Card 1: Informasi Pokok Barang */}
          <div className="form-card-panel">
            <div className="form-card-header">
              <div className="form-card-header-left">
                <span className="form-card-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
                <div>
                  <h3 className="form-card-header-title">
                    {isEdit ? 'Informasi Pokok Barang' : 'Informasi & Detail Produk'}
                  </h3>
                  {isEdit && (
                    <div className="card-header-subtitle">
                      Identitas utama sembako di kasir & pencarian POS
                    </div>
                  )}
                </div>
              </div>
              {!isEdit && <span className="form-card-header-note">Tanda (*) wajib diisi</span>}
            </div>

            {/* Kolom: Nama Produk */}
            <div className="form-group-item">
              <div className="form-label-row">
                <label htmlFor="nama" className="form-field-label">
                  Nama Produk <span className="required-asterisk">*</span>
                </label>
                {shown.nama ? (
                  <span className="label-error-badge">ⓘ Wajib Diisi</span>
                ) : (
                  <span className="label-extra-info">{isEdit ? 'Maks. 60 Karakter' : 'Maks. 80 karakter'}</span>
                )}
              </div>
              <div className="input-with-addons">
                <input
                  id="nama"
                  type="text"
                  maxLength={80}
                  className={`form-text-input${shown.nama ? ' is-error' : ''}`}
                  placeholder="Contoh: Minyak Goreng Bimoli 2L / Beras Ramos 5kg"
                  value={values.nama}
                  onChange={change('nama')}
                  aria-invalid={Boolean(shown.nama)}
                />
                {shown.nama && (
                  <span className="input-error-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                )}
              </div>
              {shown.nama ? (
                <span className="field-error-message">ⓘ {shown.nama}</span>
              ) : !isEdit ? (
                <span className="field-helper-message">
                  Sertakan merek, varian, dan ukuran kemasan agar memudahkan pencarian kasir.
                </span>
              ) : null}
            </div>

            {/* Dua Kolom: Kategori & Barcode/SKU */}
            <div className="form-grid-columns" style={{ marginTop: '16px' }}>
              <div className="form-group-item">
                <div className="form-label-row">
                  <label htmlFor="kategori" className="form-field-label">
                    Kategori Sembako <span className="required-asterisk">*</span>
                  </label>
                </div>
                <div className="input-with-addons">
                  <select
                    id="kategori"
                    className={`form-select-input${shown.kategori ? ' is-error' : ''}`}
                    value={values.kategori}
                    onChange={change('kategori')}
                    aria-invalid={Boolean(shown.kategori)}
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {shown.kategori && (
                    <span className="input-error-icon" style={{ right: '28px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  )}
                </div>
                {shown.kategori && (
                  <span className="field-error-message">ⓘ {shown.kategori}</span>
                )}
              </div>

              {/* Barcode / Kode SKU (Static helper sesuai batasan B1) */}
              <div className="form-group-item">
                <div className="form-label-row">
                  <label htmlFor="barcode_sku" className="form-field-label">
                    Kode Barcode / SKU
                  </label>
                  {!isEdit ? (
                    <button type="button" className="label-action-btn" onClick={handleRandomizeSKU}>
                      ↻ Acak SKU
                    </button>
                  ) : (
                    <span className="label-extra-info">Opsional</span>
                  )}
                </div>
                <div className="input-with-addons">
                  <input
                    id="barcode_sku"
                    type="text"
                    className="form-text-input"
                    placeholder="Contoh: 8991002104509"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                  />
                  <span className="input-icon-prefix" style={{ left: 'auto', right: '12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="5" x2="3" y2="19" />
                      <line x1="7" y1="5" x2="7" y2="19" />
                      <line x1="10" y1="5" x2="10" y2="19" />
                      <line x1="14" y1="5" x2="14" y2="19" />
                      <line x1="17" y1="5" x2="17" y2="19" />
                      <line x1="21" y1="5" x2="21" y2="19" />
                    </svg>
                  </span>
                </div>
                {!isEdit && (
                  <span className="field-helper-message">
                    Opsional. Gunakan scanner barcode kasir atau biarkan kosong.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Harga Jual & Bobot Kemasan */}
          <div className="form-card-panel">
            <div className="form-card-header">
              <div className="form-card-header-left">
                <span className="form-card-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <div>
                  <h3 className="form-card-header-title">
                    {isEdit ? 'Harga Jual & Bobot Kemasan' : 'Penetapan Harga & Bobot Barang'}
                  </h3>
                  {isEdit && (
                    <div className="card-header-subtitle">
                      Penetapan harga kasir dan penimbangan kurir lokal
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-grid-columns">
              {/* Harga Jual */}
              <div className="form-group-item">
                <div className="form-label-row">
                  <label htmlFor="harga" className="form-field-label">
                    {isEdit ? 'Harga Jual Satuan (Rp)' : 'Harga Jual (Rp)'} <span className="required-asterisk">*</span>
                  </label>
                </div>
                <div className="input-with-addons">
                  <span className="input-addon-prefix">Rp</span>
                  <input
                    id="harga"
                    type="text"
                    className={`form-text-input has-prefix${shown.harga ? ' is-error' : ''}`}
                    placeholder="18500"
                    value={values.harga}
                    onChange={change('harga')}
                    aria-invalid={Boolean(shown.harga)}
                  />
                  {shown.harga && (
                    <span className="input-error-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  )}
                </div>
                {shown.harga ? (
                  <span className="field-error-message">ⓘ {shown.harga}</span>
                ) : hargaHelper ? (
                  <div className="price-info-note">ⓘ {hargaHelper}</div>
                ) : (
                  <span className="field-helper-message">
                    Harga jual eceran resmi ke pembeli / warga.
                  </span>
                )}
              </div>

              {/* Berat (gram) */}
              <div className="form-group-item">
                <div className="form-label-row">
                  <label htmlFor="berat" className="form-field-label">
                    Berat (gram) <span className="required-asterisk">*</span>
                  </label>
                </div>
                <div className="input-with-addons">
                  <input
                    id="berat"
                    type="text"
                    className={`form-text-input has-suffix${shown.berat ? ' is-error' : ''}`}
                    placeholder="1000"
                    value={values.berat}
                    onChange={change('berat')}
                    aria-invalid={Boolean(shown.berat)}
                  />
                  <span className="input-addon-suffix">gram</span>
                  {shown.berat && (
                    <span className="input-error-icon" style={{ right: '54px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  )}
                </div>
                {shown.berat ? (
                  <span className="field-error-message">ⓘ {shown.berat}</span>
                ) : (
                  <span className="field-helper-message">
                    {isEdit
                      ? 'Dipakai untuk menghitung ongkos kirim pesanan antar toko & kurir becak/motor.'
                      : 'Dipakai untuk menghitung ongkos kirim pesanan antar.'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Kontrol Stok Gudang & Rak */}
          <div className="form-card-panel">
            <div className="form-card-header">
              <div className="form-card-header-left">
                <span className="form-card-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v18H3z" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                  </svg>
                </span>
                <div>
                  <h3 className="form-card-header-title">
                    {isEdit ? 'Kontrol Stok Gudang & Rak' : 'Manajemen & Kontrol Stok Fisik'}
                  </h3>
                  {isEdit && (
                    <div className="card-header-subtitle">
                      Penghitungan fisik real-time rak toko
                    </div>
                  )}
                </div>
              </div>
              {isEdit && <span className="status-pill-safe">Status: Cukup Aman</span>}
            </div>

            <div className="form-grid-columns">
              {/* Stok Field */}
              {showStock ? (
                /* Mode Tambah: Stok Awal Dapat Diinput */
                <div className="form-group-item">
                  <div className="form-label-row">
                    <label htmlFor="stok" className="form-field-label">
                      Stok Awal <span className="required-asterisk">*</span>
                    </label>
                  </div>
                  <div className={`stepper-container${shown.stok ? ' is-error' : ''}`}>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => handleStep('stok', -1, 0, 0)}
                      aria-label="Kurangi stok"
                    >
                      −
                    </button>
                    <input
                      id="stok"
                      type="text"
                      className="stepper-number-input"
                      value={values.stok}
                      onChange={change('stok')}
                      placeholder="0"
                      aria-invalid={Boolean(shown.stok)}
                    />
                    <button
                      type="button"
                      className="stepper-btn btn-plus"
                      onClick={() => handleStep('stok', 1, 0, 0)}
                      aria-label="Tambah stok"
                    >
                      +
                    </button>
                  </div>
                  {shown.stok ? (
                    <span className="field-error-message">ⓘ {shown.stok}</span>
                  ) : (
                    <span className="field-helper-message">
                      Jumlah fisik unit saat barang pertama kali dibongkar ke rak toko.
                    </span>
                  )}
                </div>
              ) : (
                /* Mode Ubah: Stok Saat Ini Tampil Sebagai Informasi (Rule A14 & B2) */
                <div className="form-group-item">
                  <div className="form-label-row">
                    <label className="form-field-label">
                      Stok Saat Ini (Sak / Karung) <span className="required-asterisk">*</span>
                    </label>
                  </div>
                  <div className="stepper-container" style={{ background: '#f8fafc' }}>
                    <button
                      type="button"
                      className="stepper-btn"
                      style={{ cursor: 'not-allowed', color: '#9ca3af' }}
                      disabled
                      title="Pengubahan stok dilakukan di halaman Stok"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      className="stepper-number-input"
                      readOnly
                      value={effectiveStock}
                      style={{ cursor: 'default' }}
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      style={{ cursor: 'not-allowed', color: '#9ca3af' }}
                      disabled
                      title="Pengubahan stok dilakukan di halaman Stok"
                    >
                      +
                    </button>
                  </div>
                  <span className="field-helper-message">
                    {effectiveStock} sak tersedia di rak depan dan gudang belakang.
                  </span>
                </div>
              )}

              {/* Batas Stok Kritis */}
              <div className="form-group-item">
                <div className="form-label-row">
                  <label htmlFor="batas_stok_kritis" className="form-field-label">
                    {isEdit ? 'Batas Stok Kritis (Alert)' : 'Batas Stok Kritis'}
                  </label>
                  {values.batas_stok_kritis === '' || values.batas_stok_kritis === '5' ? (
                    <span className="label-valid-badge">✓ Valid (Default)</span>
                  ) : (
                    <span className="label-extra-info" style={{ color: '#d97706', fontWeight: 600 }}>
                      Peringatan Menipis
                    </span>
                  )}
                </div>
                <div className={`stepper-container${shown.batas_stok_kritis ? ' is-error' : ''}`}>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleStep('batas_stok_kritis', -1, 0, 5)}
                    aria-label="Kurangi batas stok kritis"
                  >
                    −
                  </button>
                  <input
                    id="batas_stok_kritis"
                    type="text"
                    className="stepper-number-input"
                    value={values.batas_stok_kritis}
                    onChange={change('batas_stok_kritis')}
                    placeholder="5"
                    aria-invalid={Boolean(shown.batas_stok_kritis)}
                  />
                  <button
                    type="button"
                    className="stepper-btn btn-plus"
                    onClick={() => handleStep('batas_stok_kritis', 1, 0, 5)}
                    aria-label="Tambah batas stok kritis"
                  >
                    +
                  </button>
                </div>
                {shown.batas_stok_kritis ? (
                  <span className="field-error-message">ⓘ {shown.batas_stok_kritis}</span>
                ) : (
                  <span className="field-helper-message">
                    {isEdit
                      ? 'Kosongkan untuk memakai nilai bawaan 5. Disarankan 10 untuk barang cepat habis seperti beras.'
                      : 'Kosongkan untuk memakai nilai bawaan 5. Disarankan 10 untuk barang cepat habis.'}
                  </span>
                )}
              </div>
            </div>

            {/* Label Cepat Toko (Opsional untuk Tambah Produk) */}
            {showStock && (
              <div className="quick-tags-section">
                <div className="quick-tags-title">Label Cepat Toko (Opsional):</div>
                <div className="quick-tags-wrapper">
                  {[
                    { label: '☆ Produk Terlaris' },
                    { label: '🚚 Bisa Diantar Kurir' },
                    { label: '❄ Simpan di Chiller/Es' },
                    { label: '✓ Halal MUI' },
                  ].map((chip) => {
                    const isActive = activeChips.includes(chip.label);
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        className={`quick-tag-chip${isActive ? ' active' : ''}`}
                        onClick={() => toggleChip(chip.label)}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions Bar Footer */}
          <div className="form-actions-bar">
            <div className="actions-left-group">
              {isEdit ? (
                <div className="offline-sync-text">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  <span>Data tersinkron otomatis ke mesin kasir toko offline</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-form-cancel"
                    onClick={onCancel}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn-form-reset"
                    onClick={handleReset}
                    disabled={submitting}
                  >
                    Reset Isian
                  </button>
                </>
              )}
            </div>

            <div className="actions-right-group">
              {hasErrors && (
                <span className="error-summary-inline">
                  ⓘ Perbaiki kesalahan sebelum menyimpan ke katalog
                </span>
              )}
              {isEdit && (
                <button
                  type="button"
                  className="btn-form-cancel"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="btn-form-submit"
                disabled={submitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {submitting ? 'Menyimpan...' : submitLabel}
              </button>
            </div>
          </div>
        </form>

        {/* Kolom Kanan: Pratinjau Rak & Panduan/Riwayat */}
        <aside className="sidebar-right-column">
          {/* Card: Pratinjau Kartu Rak */}
          <div className="rack-preview-card">
            <div className="rack-preview-header">
              <span className="rack-preview-title">
                {isEdit ? 'Pratinjau Kartu Rak Toko' : 'PRATINJAU KARTU RAK'}
              </span>
              {isEdit ? (
                <span className="badge-pos-live">POS LIVE</span>
              ) : (
                <span className="badge-rack-available">
                  <span style={{ fontSize: '7px' }}>●</span> Tersedia
                </span>
              )}
            </div>

            <div className="rack-image-container">
              <img
                src={shelfImage}
                alt="Pratinjau Rak Sembako"
                className="rack-preview-image"
              />
              <div className="rack-image-badges">
                {isEdit ? (
                  <span className="badge-rack-available" style={{ background: '#dcfce7', color: '#15803d' }}>
                    Tersedia di Rak
                  </span>
                ) : (
                  <span className="rack-sku-badge">SKU: {skuCode ? 'AUTO-GEN' : 'NONE'}</span>
                )}
                <span className="rack-weight-badge">
                  Berat: {values.berat ? Number(values.berat).toLocaleString('id-ID') : '0'} gr
                </span>
              </div>
            </div>

            <div className="rack-body-content">
              <div className="rack-category-label">
                {values.kategori
                  ? `${values.kategori} • ${isEdit ? 'Karung Plastik 5kg' : 'Katalog'}`
                  : 'KATEGORI BELUM DIPILIH'}
              </div>
              <h4 className="rack-product-name">
                {values.nama.trim() || 'Nama Produk Baru'}
              </h4>

              {isEdit && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                  Barcode: {skuCode}
                </div>
              )}

              <div className="rack-stats-grid">
                <div className="rack-stat-block">
                  <span className="rack-stat-title">{isEdit ? 'Harga Eceran' : 'Harga Jual'}</span>
                  <span className="rack-stat-price">
                    {formatRupiah(values.harga || 0)}
                  </span>
                </div>
                <div className="rack-stat-block">
                  <span className="rack-stat-title">{isEdit ? 'Sisa Rak' : 'Stok Gudang'}</span>
                  <span className="rack-stat-stock">
                    {effectiveStock} sak
                  </span>
                </div>
              </div>

              {isEdit ? (
                <>
                  <div className="shelf-capacity-section">
                    <div className="capacity-label-row">
                      <span>Kapasitas Rak (Maks 50 sak)</span>
                      <span style={{ fontWeight: 700, color: '#15803d' }}>84% Penuh</span>
                    </div>
                    <div className="capacity-progress-track">
                      <div className="capacity-progress-fill" style={{ width: '84%' }} />
                    </div>
                  </div>

                  <div className="print-label-bar">
                    <div className="print-label-title">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      <span>Cetak Label Rak / Harga</span>
                    </div>
                    <button type="button" className="btn-print-f9">
                      Cetak (F9)
                    </button>
                  </div>
                </>
              ) : (
                <div className="rack-pos-notice">
                  <div className="pos-notice-header">
                    <span className="pos-notice-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </span>
                    <span>Siap masuk ke Mesin Kasir Toko</span>
                  </div>
                  <p className="pos-notice-text">
                    Segera setelah disimpan, nama produk ini langsung dapat dicari oleh kasir shift pagi & malam.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Jika dalam state error: Tampilkan "Daftar Koreksi Cepat" */}
          {hasErrors || testErrorMode ? (
            <div className="quick-corrections-card">
              <div className="corrections-header">
                <h4 className="corrections-title">Daftar Koreksi Cepat</h4>
                <span className="badge-action-count">
                  {Math.max(errorCount, 3)} Perlu Aksi
                </span>
              </div>

              <div className="corrections-list">
                {/* Item 1: Nama Produk */}
                <div className={`correction-item-row${shown.nama ? ' is-error' : ' is-valid'}`}>
                  <span className={`correction-item-icon${shown.nama ? ' error' : ' valid'}`}>
                    {shown.nama ? '⊗' : '✓'}
                  </span>
                  <div className="correction-item-content">
                    <span className="correction-item-heading">
                      {shown.nama ? 'Nama Produk Kosong' : 'Nama Produk'}
                    </span>
                    <span className="correction-item-desc">
                      {shown.nama
                        ? 'Masukkan nama dagang lengkap beserta takaran.'
                        : 'Nama dagang telah diisi dengan benar.'}
                    </span>
                  </div>
                </div>

                {/* Item 2: Kategori */}
                <div className={`correction-item-row${shown.kategori ? ' is-error' : ' is-valid'}`}>
                  <span className={`correction-item-icon${shown.kategori ? ' error' : ' valid'}`}>
                    {shown.kategori ? '⊗' : '✓'}
                  </span>
                  <div className="correction-item-content">
                    <span className="correction-item-heading">
                      {shown.kategori ? 'Kategori Belum Dipilih' : 'Kategori Terpilih'}
                    </span>
                    <span className="correction-item-desc">
                      {shown.kategori
                        ? 'Wajib dikelompokkan agar kasir mudah mencari.'
                        : `Kategori: ${values.kategori}`}
                    </span>
                  </div>
                </div>

                {/* Item 3: Format Angka */}
                <div
                  className={`correction-item-row${
                    shown.harga || shown.berat ? ' is-error' : ' is-valid'
                  }`}
                >
                  <span
                    className={`correction-item-icon${
                      shown.harga || shown.berat ? ' error' : ' valid'
                    }`}
                  >
                    {shown.harga || shown.berat ? '⊗' : '✓'}
                  </span>
                  <div className="correction-item-content">
                    <span className="correction-item-heading">
                      {shown.harga || shown.berat ? 'Format Angka Salah' : 'Harga & Berat Valid'}
                    </span>
                    <span className="correction-item-desc">
                      {shown.harga || shown.berat
                        ? 'Harga dan berat harus berupa angka positif.'
                        : 'Nilai nominal harga dan bobot gram sudah valid.'}
                    </span>
                  </div>
                </div>

                {/* Item 4: Batas Stok Kritis */}
                <div className="correction-item-row is-valid">
                  <span className="correction-item-icon valid">✓</span>
                  <div className="correction-item-content">
                    <span className="correction-item-heading">Batas Stok Kritis</span>
                    <span className="correction-item-desc">
                      Default 5 unit siap digunakan jika dikosongkan.
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-fill-valid-data"
                onClick={handleFillValidSample}
              >
                <span>🪄</span> Isi Data Contoh yang Benar
              </button>
            </div>
          ) : isEdit ? (
            /* Jika dalam state normal mode Ubah: Tampilkan "Riwayat Pembelian Grosir" */
            <div className="wholesale-history-card">
              <div className="wholesale-header">
                <div className="wholesale-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Riwayat Pembelian Grosir</span>
                </div>
                <a href="#riwayat" className="wholesale-link-more" onClick={(e) => e.preventDefault()}>
                  Selengkapnya
                </a>
              </div>

              <div className="wholesale-list">
                <div className="wholesale-item">
                  <div className="wholesale-item-top">
                    <span>Restock 50 Sak</span>
                    <span className="wholesale-item-time">3 hari lalu</span>
                  </div>
                  <div className="wholesale-item-desc">Dari: Agen Beras Berkah Cipinang</div>
                  <div className="wholesale-item-desc">Modal: Rp 67.500 / sak</div>
                </div>

                <div className="wholesale-item" style={{ borderBottom: 'none' }}>
                  <div className="wholesale-item-top">
                    <span>Penyesuaian Fisik (-8 Sak)</span>
                    <span className="wholesale-item-time">Kemarin</span>
                  </div>
                  <div className="wholesale-item-desc">Penjualan POS Shift Siang</div>
                </div>
              </div>

              <div className="wholesale-margin-box">
                <span className="margin-label">Margin Keuntungan Toko</span>
                <span className="margin-value">
                  Rp 4.500 / sak (6.25%)
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
              </div>
            </div>
          ) : (
            /* Jika dalam state normal mode Tambah: Tampilkan "Panduan Cepat Toko Abah" */
            <div className="quick-guide-card">
              <div className="guide-card-header">
                <span className="guide-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <h4 className="guide-card-title">Panduan Cepat Toko Abah</h4>
              </div>

              <ul className="guide-tips-list">
                <li className="guide-tip-item">
                  <span className="guide-tip-check">✓</span>
                  <span>
                    Untuk beras curah / gula timbang, tuliskan takaran standar per 1 kg atau per 500 gram.
                  </span>
                </li>
                <li className="guide-tip-item">
                  <span className="guide-tip-check">✓</span>
                  <span>
                    Barang promo dapat ditandai dengan badge "Produk Terlaris" di bawah formulir.
                  </span>
                </li>
                <li className="guide-tip-item">
                  <span className="guide-tip-check">✓</span>
                  <span>
                    Perubahan harga dapat diperbarui kapan saja dari menu utama inventaris.
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Standar Toko Sembako */}
          <div className="quick-guide-card">
            <div className="guide-card-header">
              <span className="guide-card-icon" style={{ color: '#15803d' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <h4 className="guide-card-title">Standar Toko Sembako</h4>
            </div>
            <p className="field-helper-message" style={{ margin: 0 }}>
              Format nama barang disarankan menyertakan merk, jenis, dan bobot kemasan (Contoh: Minyak Goreng Bimoli Spesial 2 Liter). Ini mempercepat pencarian barang di meja kasir saat toko sedang ramai.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
