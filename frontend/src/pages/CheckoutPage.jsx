import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import DestinationSelect from '../components/DestinationSelect';
import { itemIssue, useCart } from '../context/CartContext';
import useCartCheck from '../hooks/useCartCheck';
import useShippingQuote from '../hooks/useShippingQuote';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';

// Nomor HP Indonesia: 08..., 628..., atau +628..., 10 sampai 14 digit
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,11}$/;

function formatWeight(grams) {
  if (grams === null || grams === undefined) return 'Belum dihitung';
  return `${(grams / 1000).toLocaleString('id-ID', { maximumFractionDigits: 3 })} kg`;
}

export function validateCheckout({ nama, noHp, metode, alamatLengkap, destination, selectedRate, selectedRateId }) {
  const errors = {};
  if (!nama || !nama.trim()) errors.nama_pemesan = 'Kolom ini wajib diisi';
  const phone = (noHp || '').replace(/[\s-]/g, '');
  if (!phone) errors.no_hp = 'Kolom ini wajib diisi';
  else if (!PHONE_PATTERN.test(phone)) errors.no_hp = 'Masukkan nomor HP yang valid (hanya angka)';

  if (metode === 'kurir') {
    if (!alamatLengkap || !alamatLengkap.trim()) {
      errors.alamat_lengkap = 'Kolom ini wajib diisi';
    }
    if (!destination || !destination.label || !destination.label.trim()) {
      errors.wilayah = 'Pilih kecamatan / kota tujuan';
      errors.tujuan = 'Pilih kecamatan / kota tujuan';
    }
    const hasRate = Boolean(selectedRate || selectedRateId);
    if (!hasRate) {
      errors.layanan_kurir = 'Pilih layanan kurir terlebih dahulu';
      errors.selected_rate_id = 'Pilih layanan kurir terlebih dahulu';
    }
  }

  return errors;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, cartReady, total, hasIssue, syncError, retrySync, clear } = useCart();
  const { checking, error: checkError, recheck } = useCartCheck();
  const finished = useRef(false);

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [catatan, setCatatan] = useState('');

  // Metode Penerimaan: 'ambil_di_toko' | 'kurir'
  const [metode, setMetode] = useState('ambil_di_toko');
  const [metodePembayaran, setMetodePembayaran] = useState('midtrans');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [destination, setDestination] = useState(null);

  const {
    quoteState,
    rates: shippingRates,
    selectedRate,
    shippingWeight,
    errorMessage: courierCalcError,
    warningMessage: courierWarning,
    calculateQuote,
    selectRate,
    resetQuote,
  } = useShippingQuote({ destinationId: destination?.id, items });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function changeFulfillmentMethod(value) {
    setMetode(value);
    if (value !== 'kurir') setMetodePembayaran('midtrans');
    if (value !== 'kurir') resetQuote();
    setErrors((prev) => ({
      ...prev,
      alamat_lengkap: undefined,
      wilayah: undefined,
      tujuan: undefined,
      layanan_kurir: undefined,
      selected_rate_id: undefined,
    }));
  }

  const courierLabel = selectedRate
    ? `${selectedRate.courier_name} ${selectedRate.service}`
    : 'Pilih layanan kurir';

  // Hitung ongkos kirim
  const ongkir = metode === 'kurir' && selectedRate ? selectedRate.cost : 0;
  const grandTotal = total + ongkir;

  function handleCheckShippingManual() {
    if (!destination) {
      setErrors((prev) => ({ ...prev, wilayah: 'Pilih kecamatan / kota tujuan', tujuan: 'Pilih kecamatan / kota tujuan' }));
      return;
    }
    calculateQuote(destination.id, items);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateCheckout({
      nama,
      noHp,
      metode,
      alamatLengkap,
      destination,
      selectedRate,
      selectedRateId: selectedRate?.id,
    });
    setErrors(clientErrors);
    setFormError('');

    if (Object.keys(clientErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nama_pemesan: nama.trim(),
        no_hp: noHp.replace(/[\s-]/g, ''),
        catatan: catatan.trim(),
        metode_penerimaan: metode,
        metode_pembayaran: metodePembayaran,
        items: items.map((it) => ({ product_id: it.id, jumlah: it.jumlah })),
      };

      if (metode === 'kurir') {
        payload.alamat_pengiriman = alamatLengkap.trim();
        payload.alamat_lengkap = alamatLengkap.trim();
        payload.tujuan = destination.label;
        payload.wilayah = destination.label;
        payload.tujuan_id = destination.id;
        payload.destination_id = String(destination.id);
        payload.layanan_kurir = selectedRate.kode || selectedRate.id;
        payload.selected_rate_id = selectedRate.id || selectedRate.kode;
      }

      const res = await orderService.create(payload);
      finished.current = true;
      clear();
      navigate(`/pesanan/${res.data.nomor_pesanan}`, { replace: true });
    } catch (err) {
      if (err.status === 422) {
        const rawErrors = err.errors || {};
        const mappedErrors = { ...rawErrors };
        if (rawErrors.destination_id && !mappedErrors.wilayah) {
          mappedErrors.wilayah = rawErrors.destination_id;
        }
        if (rawErrors.selected_rate_id && !mappedErrors.layanan_kurir) {
          mappedErrors.layanan_kurir = rawErrors.selected_rate_id;
        }
        setErrors(mappedErrors);
        const stockProblem = Object.keys(rawErrors).some((k) => k.startsWith('items'));
        if (stockProblem) {
          setFormError('Stok beberapa barang berubah atau tidak mencukupi. Harap periksa keranjang belanja Anda sebelum melanjutkan.');
          recheck();
        }
        if (rawErrors.tujuan_id || rawErrors.destination_id || rawErrors.layanan_kurir || rawErrors.selected_rate_id || rawErrors.ongkir) {
          resetQuote('Data ongkos kirim perlu diperbarui. Hitung ulang ongkos kirim.');
        }
      } else {
        setFormError(err.message || 'Pesanan gagal dibuat. Coba lagi.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  // Cari item pertama yang memiliki masalah stok untuk banner error
  const firstIssueItem = items.find((it) => itemIssue(it));
  const blocked = submitting || checking || Boolean(checkError) || hasIssue || (metode === 'kurir' && quoteState === 'loading');

  if (!cartReady) {
    return <div className="ko-checkout-wrapper" role="status">Memuat keranjang...</div>;
  }
  if (items.length === 0 && !finished.current) {
    return <Navigate to="/keranjang" replace />;
  }

  const isNamaValid = Boolean(nama.trim()) && !errors.nama_pemesan;
  const isHpValid = Boolean(noHp.trim()) && PHONE_PATTERN.test(noHp.replace(/[\s-]/g, '')) && !errors.no_hp;

  return (
    <div className="ko-checkout-wrapper">
      {/* Top Utility Context Bar: Breadcrumb + Stepper */}
      <nav aria-label="Breadcrumb" className="ko-checkout-nav">
        <Link to="/katalog">Beranda</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link to="/keranjang">Keranjang Belanja</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="font-semibold text-primary">Checkout</span>
      </nav>

      {/* Header & Step Tracker Bento Layout */}
      <div className="ko-checkout-header-row">
        <div>
          <div className="ko-checkout-pill">
            <span className="ko-pulse-dot" />
            <span>Konfirmasi Belanja Cepat</span>
          </div>
          <h1 className="ko-page-title">Checkout Pesanan Sembako</h1>
          <p className="ko-page-subtitle">Lengkapi data pemesan dan konfirmasi pesanan Anda.</p>
        </div>

        {/* Stepper Indikator (1. Keranjang -> 2. Checkout -> 3. Pembayaran) */}
        <div className="ko-bento-stepper" aria-label="Tahapan Belanja">
          {/* Step 1: Keranjang (Done) */}
          <div className="ko-bento-step done">
            <div className="ko-bento-circle done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="hidden sm:inline">1. Keranjang</span>
          </div>

          <div className="ko-bento-line done" aria-hidden="true" />

          {/* Step 2: Checkout (Active) */}
          <div className="ko-bento-step active">
            <div className="ko-bento-circle active">2</div>
            <span className="font-bold text-primary">2. Checkout</span>
          </div>

          <div className="ko-bento-line" aria-hidden="true" />

          {/* Step 3: Pembayaran (Pending) */}
          <div className="ko-bento-step">
            <div className="ko-bento-circle">3</div>
            <span className="hidden sm:inline">3. Pembayaran</span>
          </div>
        </div>
      </div>

      {/* Banner Error Validasi / Stok Habis */}
      {(firstIssueItem || formError) && (
        <div className="ko-state-error-banner" role="alert">
          <div className="ko-state-error-left">
            <span className="ko-state-error-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ba1a1a">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </span>
            <div className="ko-state-error-text">
              <div className="ko-state-error-title-row">
                <span className="ko-state-error-title">
                  {firstIssueItem ? `Stok tidak mencukupi untuk ${firstIssueItem.nama}` : 'Terjadi Kesalahan pada Checkout'}
                </span>
                <span className="ko-state-error-badge">
                  {firstIssueItem || (formError && formError.toLowerCase().includes('stok')) ? 'Stok Habis' : 'Gagal'}
                </span>
              </div>
              <p className="ko-state-error-desc">
                {formError || 'Sisa stok barang di toko berubah. Harap periksa dan perbarui keranjang belanja Anda.'}
              </p>
            </div>
          </div>
          {(firstIssueItem || (formError && formError.toLowerCase().includes('stok'))) && (
            <Link to="/keranjang" className="ko-state-error-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Ubah Keranjang</span>
            </Link>
          )}
        </div>
      )}

      {/* Banner Kesalahan Pemeriksaan API */}
      {checkError && !firstIssueItem && (
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
              {checkError}{' '}
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

      {/* Main Checkout Grid Work Area */}
      <form className="ko-checkout-grid" onSubmit={handleSubmit} noValidate>
        {/* Kolom Kiri: Form & Delivery Methods */}
        <div className="ko-left-col">
          {/* SECTION 1: DATA PEMESAN */}
          <section className="ko-checkout-section">
            <div className="ko-section-head">
              <span className="ko-section-badge-num">1</span>
              <div>
                <h2 className="ko-section-title">Data Pemesan</h2>
                <p className="ko-section-sub">
                  {metode === 'ambil_di_toko'
                    ? 'Informasi identitas untuk pengambilan pesanan di counter'
                    : 'Informasi penerima sembako dan kontak penanggung jawab'}
                </p>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="ko-input-field">
              <label htmlFor="nama-pemesan" className="ko-input-label">
                Nama Lengkap <span className="ko-input-star">*</span>
              </label>
              <div className="ko-input-icon-box relative">
                <span className="ko-input-leading-icon" style={{ left: 14, color: errors.nama_pemesan ? '#ba1a1a' : '#707a6c' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="nama-pemesan"
                  type="text"
                  required
                  placeholder="Ibu Rahmawati"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    if (errors.nama_pemesan) setErrors((prev) => ({ ...prev, nama_pemesan: undefined }));
                  }}
                  className={`ko-input-control${errors.nama_pemesan ? ' error' : ''}`}
                  style={{ paddingLeft: 44 }}
                />
                {isNamaValid && (
                  <span className="ko-input-trailing-icon" title="Format valid">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d631b">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
                {errors.nama_pemesan && (
                  <span className="ko-input-trailing-icon error" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ba1a1a">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.nama_pemesan && (
                <p className="ko-input-err-msg flex items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{errors.nama_pemesan}</span>
                </p>
              )}
            </div>

            {/* Nomor WhatsApp / HP */}
            <div className="ko-input-field">
              <label htmlFor="wa-pemesan" className="ko-input-label">
                Nomor WhatsApp / HP <span className="ko-input-star">*</span>
              </label>
              <div className="ko-input-icon-box relative">
                <span className="ko-input-leading-icon" style={{ left: 14, color: errors.no_hp ? '#ba1a1a' : '#707a6c' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </span>
                <input
                  id="wa-pemesan"
                  type="tel"
                  required
                  placeholder="0812-9876-5432"
                  value={noHp}
                  onChange={(e) => {
                    setNoHp(e.target.value);
                    if (errors.no_hp) setErrors((prev) => ({ ...prev, no_hp: undefined }));
                  }}
                  className={`ko-input-control${errors.no_hp ? ' error' : ''}`}
                  style={{ paddingLeft: 44 }}
                />
                {isHpValid && (
                  <span className="ko-input-trailing-icon" title="Format valid">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d631b">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
                {errors.no_hp && (
                  <span className="ko-input-trailing-icon error" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ba1a1a">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.no_hp ? (
                <p className="ko-input-err-msg flex items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{errors.no_hp}</span>
                </p>
              ) : (
                <p className="ko-input-helper flex items-center gap-1 mt-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span>Konfirmasi pesanan dan struk akan dikirim ke nomor ini</span>
                </p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div className="ko-input-field">
              <label htmlFor="catatan-pemesan" className="ko-input-label justify-between">
                <span>Catatan Tambahan untuk Toko</span>
                <span className="font-normal text-outline text-xs">Opsional</span>
              </label>
              <textarea
                id="catatan-pemesan"
                rows={3}
                placeholder="Contoh: Beras minta disatukan dalam karung goni kecil..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="ko-textarea-control"
              />
            </div>
          </section>

          {/* SECTION 2: CARA MENERIMA PESANAN */}
          <section className="ko-checkout-section">
            <div className="ko-section-head">
              <span className="ko-section-badge-num">2</span>
              <div>
                <h2 className="ko-section-title">Cara Menerima Pesanan</h2>
                <p className="ko-section-sub">Pilih metode pengambilan kebutuhan belanja Anda</p>
              </div>
            </div>

            {/* Radio Switch Cards (Ambil di Toko vs Kurir Pihak Ketiga) */}
            <div className="ko-pickup-choice-grid" role="radiogroup" aria-label="Cara menerima pesanan">
              {/* CARD A: Ambil di Toko */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'ambil_di_toko' ? 'selected' : 'unselected'}`}
                onClick={() => changeFulfillmentMethod('ambil_di_toko')}
              >
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${metode === 'ambil_di_toko' ? 'bg-primary ring-2 ring-primary-fixed' : 'border-2 border-outline'}`}>
                        {metode === 'ambil_di_toko' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="font-bold text-on-surface text-base">Ambil di Toko</div>
                    </div>
                    <p className="ko-pickup-card-sub">
                      Ongkos kirim Rp 0. Ambil pesanan di toko setelah pembayaran.
                    </p>
                  </div>
                  {metode === 'ambil_di_toko' ? (
                    <div className="ko-pickup-card-status flex items-center gap-1 text-primary font-semibold text-xs mt-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>Pilihan Aktif</span>
                    </div>
                  ) : (
                    <div className="ko-pickup-unselected-hint text-xs text-outline mt-3">Klik untuk memilih</div>
                  )}
                </div>
              </label>

              {/* CARD B: Kurir Pihak Ketiga */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'kurir' ? 'selected' : 'unselected'}`}
                onClick={() => changeFulfillmentMethod('kurir')}
              >
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${metode === 'kurir' ? 'bg-primary ring-2 ring-primary-fixed' : 'border-2 border-outline'}`}>
                        {metode === 'kurir' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="font-bold text-on-surface text-base">Kurir Pihak Ketiga</div>
                    </div>
                    <p className="ko-pickup-card-sub">
                      Pesanan dijemput kurir di toko dan diantar ke alamat Anda. Ongkos kirim ditanggung pelanggan.
                    </p>
                  </div>
                  {metode === 'kurir' ? (
                    <div className="ko-pickup-card-status flex items-center gap-1 text-primary font-semibold text-xs mt-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>Pilihan Aktif</span>
                    </div>
                  ) : (
                    <div className="ko-pickup-unselected-hint text-xs text-outline mt-3">Klik untuk memilih</div>
                  )}
                </div>
              </label>
            </div>

            {metode === 'kurir' && (
              <div className="ko-input-field" style={{ marginTop: 16 }}>
                <div className="ko-input-label">
                  Metode Pembayaran <span className="ko-input-star">*</span>
                </div>
                <div className="ko-pickup-choice-grid" role="radiogroup" aria-label="Metode pembayaran">
                  <label
                    className={`ko-pickup-selectable-card ${metodePembayaran === 'midtrans' ? 'selected' : 'unselected'}`}
                    onClick={() => setMetodePembayaran('midtrans')}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${metodePembayaran === 'midtrans' ? 'bg-primary ring-2 ring-primary-fixed' : 'border-2 border-outline'}`}>
                        {metodePembayaran === 'midtrans' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface text-base">Midtrans Snap</div>
                        <p className="ko-pickup-card-sub">QRIS, transfer bank, dan metode online lainnya.</p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`ko-pickup-selectable-card ${metodePembayaran === 'cod' ? 'selected' : 'unselected'}`}
                    onClick={() => setMetodePembayaran('cod')}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${metodePembayaran === 'cod' ? 'bg-primary ring-2 ring-primary-fixed' : 'border-2 border-outline'}`}>
                        {metodePembayaran === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface text-base">COD</div>
                        <p className="ko-pickup-card-sub">Bayar tunai langsung kepada kurir saat pesanan tiba.</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* FORM KURIR PIHAK KETIGA */}
            {metode === 'kurir' && (
              <div className="ko-courier-fields-container" style={{ marginTop: 16 }}>
                {/* 1. Alamat Lengkap */}
                <div className="ko-input-field">
                  <label htmlFor="alamat-lengkap" className="ko-input-label">
                    Alamat Lengkap <span className="ko-input-star">*</span>
                  </label>
                  <p className="ko-input-helper" style={{ margin: '0 0 6px 0', color: '#40493d' }}>
                    Cantumkan nama jalan, nomor rumah, dan patokan.
                  </p>
                  <div className="relative">
                    <textarea
                      id="alamat-lengkap"
                      rows={3}
                      required
                      placeholder="Tulis nama jalan, nomor rumah, RT/RW, dan patokan..."
                      value={alamatLengkap}
                      onChange={(e) => {
                        setAlamatLengkap(e.target.value);
                        if (errors.alamat_lengkap) setErrors((prev) => ({ ...prev, alamat_lengkap: undefined }));
                      }}
                      className={`ko-textarea-control${errors.alamat_lengkap ? ' error' : ''}`}
                    />
                    {errors.alamat_lengkap && (
                      <span className="ko-textarea-error-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ba1a1a">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {errors.alamat_lengkap && (
                    <p className="ko-input-err-msg flex items-center gap-1" role="alert">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errors.alamat_lengkap}</span>
                    </p>
                  )}
                </div>

                {/* 2. Kecamatan / Kota Tujuan */}
                <div className="ko-input-field">
                  <label htmlFor="wilayah-tujuan" className="ko-input-label">
                    Kecamatan / Kota Tujuan <span className="ko-input-star">*</span>
                  </label>
                  <DestinationSelect
                    id="wilayah-tujuan"
                    value={destination}
                    onChange={(val) => {
                      setDestination(val);
                      resetQuote();
                      if (errors.wilayah || errors.tujuan) {
                        setErrors((prev) => ({ ...prev, wilayah: undefined, tujuan: undefined }));
                      }
                    }}
                    error={errors.wilayah || errors.tujuan}
                  />
                  {(errors.wilayah || errors.tujuan) && (
                    <p className="ko-input-err-msg flex items-center gap-1" role="alert">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errors.wilayah || errors.tujuan}</span>
                    </p>
                  )}
                </div>

                {/* 3. Tombol Cek Ongkos Kirim */}
                <div>
                  <button
                    type="button"
                    onClick={handleCheckShippingManual}
                    className="ko-btn-cek-ongkir"
                    disabled={!alamatLengkap.trim() || !destination || quoteState === 'loading' || submitting}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={quoteState === 'loading' ? 'ko-spin-icon' : ''}>
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span>{quoteState === 'loading' ? 'Menghitung ongkir...' : 'Cek Ongkos Kirim'}</span>
                  </button>
                </div>

                {/* 4. Bagian Status & Pilihan Layanan Kurir */}
                <div className="ko-courier-status-block">
                  <div className="ko-courier-status-title">Status &amp; Kondisi Kurir:</div>

                  {/* State: Loading */}
                  {quoteState === 'loading' && (
                    <div className="ko-courier-status-loading" role="status">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" className="ko-spin-icon">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>Menghitung ongkir...</span>
                    </div>
                  )}

                  {/* State: Empty */}
                  {quoteState === 'empty' && (
                    <div className="ko-courier-status-empty" role="status">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Tidak ada layanan kurir untuk tujuan ini</span>
                    </div>
                  )}

                  {/* State: Error */}
                  {quoteState === 'error' && (
                    <div className="ko-courier-status-error" role="alert">
                      <div className="ko-courier-status-error-msg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ba1a1a">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <span>{courierCalcError || 'Ongkos kirim tidak dapat dihitung. Coba lagi atau pilih Ambil di Toko.'}</span>
                      </div>
                      <div className="ko-courier-status-error-actions">
                        <button
                          type="button"
                          className="ko-courier-status-btn-retry"
                          onClick={() => calculateQuote(destination?.id, items)}
                        >
                          Coba Lagi
                        </button>
                        <button
                          type="button"
                          className="ko-courier-status-btn-pickup"
                          onClick={() => changeFulfillmentMethod('ambil_di_toko')}
                        >
                          Pilih Ambil di Toko
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State: Idle with warning */}
                  {quoteState === 'idle' && courierWarning && (
                    <div className="ko-courier-status-warning" role="alert" style={{ padding: '10px 14px', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#b78103' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#b78103">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{courierWarning}</span>
                    </div>
                  )}

                  {/* State: Idle default */}
                  {quoteState === 'idle' && !courierWarning && !destination && (
                    <div className="ko-courier-status-empty">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Pilih wilayah tujuan dan isi alamat, lalu tekan Cek Ongkos Kirim.</span>
                    </div>
                  )}
                </div>

                {/* 5. Daftar Layanan Kurir (Saat Sukses) */}
                {quoteState === 'success' && shippingRates.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="font-label-lg text-label-lg text-on-surface mb-2 font-bold flex items-center gap-1">
                      <span>Pilih Layanan Kurir</span>
                      <span className="ko-input-star">*</span>
                    </div>

                    <div className={errors.layanan_kurir || errors.selected_rate_id ? 'ko-courier-error-wrap' : 'space-y-2'}>
                      {shippingRates.map((rate) => {
                        const isSelected = selectedRate?.id === rate.id || selectedRate?.kode === rate.kode;
                        return (
                          <label
                            key={rate.id || rate.kode}
                            className={`ko-courier-option-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              selectRate(rate);
                              if (errors.layanan_kurir || errors.selected_rate_id) {
                                setErrors((prev) => ({
                                  ...prev,
                                  layanan_kurir: undefined,
                                  selected_rate_id: undefined,
                                }));
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="courier_service"
                                value={rate.id || rate.kode}
                                checked={isSelected}
                                onChange={() => {
                                  selectRate(rate);
                                  if (errors.layanan_kurir || errors.selected_rate_id) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      layanan_kurir: undefined,
                                      selected_rate_id: undefined,
                                    }));
                                  }
                                }}
                                className="ko-native-radio"
                              />
                              <div>
                                <div className="font-semibold text-on-surface text-sm">
                                  {rate.kurir} {rate.layanan}
                                </div>
                                <span className="text-xs text-on-surface-variant">
                                  Estimasi: {rate.estimasi}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-primary text-base tabular-nums">
                              {formatRupiah(rate.cost)}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {(errors.layanan_kurir || errors.selected_rate_id) && (
                      <p className="ko-input-err-msg flex items-center gap-1" style={{ marginTop: 6 }} role="alert">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <span>{errors.layanan_kurir || errors.selected_rate_id}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan (Sticky) */}
        <aside className="ko-right-col">
          <div className="ko-checkout-summary-card">
            <div className="ko-summary-head-row">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <h2 className="ko-section-title">Ringkasan Pesanan</h2>
              </div>
              <span className="ko-summary-badge">{items.length} Item</span>
            </div>

            {/* Daftar Produk Itemized */}
            <div className="ko-itemized-list">
              {items.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between gap-3 border-b border-surface-container-high/40 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-on-surface text-sm truncate block">
                      {it.nama} <span className="text-on-surface-variant font-medium">({it.jumlah}x)</span>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-on-surface text-sm tabular-nums">
                      {formatRupiah(it.harga * it.jumlah)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Perhitungan Biaya */}
            <div className="ko-checkout-calc-box">
              <div className="ko-checkout-calc-row">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-on-surface">{formatRupiah(total)}</span>
              </div>
              {metode === 'kurir' && (
                <div className="ko-checkout-calc-row">
                  <div className="flex flex-col">
                    <span>Berat Total Pesanan</span>
                    <span className="text-xs text-on-surface-variant" style={{ fontSize: 11, color: '#707a6c' }}>
                      Berat produk dikalikan jumlah
                    </span>
                  </div>
                  <span className="font-semibold text-on-surface">
                    {shippingWeight === null
                      ? quoteState === 'loading' ? 'Menghitung...' : 'Belum dihitung'
                      : formatWeight(shippingWeight)}
                  </span>
                </div>
              )}
              <div className="ko-checkout-calc-row">
                <div className="flex flex-col">
                  <span>Ongkos Kirim</span>
                  {metode === 'kurir' && selectedRate && (
                    <span className="text-xs text-on-surface-variant" style={{ fontSize: 11, color: '#707a6c' }}>
                      {selectedRate.kurir} {selectedRate.layanan} ({selectedRate.estimasi})
                    </span>
                  )}
                </div>
                <span className="font-semibold tabular-nums text-on-surface">
                  {metode === 'ambil_di_toko'
                    ? 'Rp 0 (Ambil di Toko)'
                    : selectedRate
                      ? formatRupiah(ongkir)
                      : 'Belum dihitung'}
                </span>
              </div>

              <div className="ko-calc-divider">
                <div className="ko-total-row-checkout">
                  <div className="ko-total-label-box">
                    <span className="ko-total-text">Total Pembayaran</span>
                  </div>
                  <span className="ko-total-big-val">{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Tombol Buat Pesanan */}
            <div className="ko-cta-btns" style={{ paddingTop: 8 }}>
              <button
                type="submit"
                className="ko-btn-create-order"
                disabled={blocked}
              >
                {submitting ? (
                  <span>Membuat Pesanan...</span>
                ) : (
                  <>
                    <span>Buat Pesanan</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
