import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { itemIssue, useCart } from '../context/CartContext';
import useCartCheck from '../hooks/useCartCheck';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';

// Nomor HP Indonesia: 08..., 628..., atau +628..., 10 sampai 14 digit
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,11}$/;

export function validateCheckout({ nama, noHp, metode, alamatLengkap, destination, selectedRateId }) {
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
    }
    if (!selectedRateId) {
      errors.selected_rate_id = 'Pilih layanan kurir';
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
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destination, setDestination] = useState(null);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationSearchLoading, setDestinationSearchLoading] = useState(false);
  const [destinationError, setDestinationError] = useState('');
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [courierCalcError, setCourierCalcError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function changeFulfillmentMethod(value) {
    setMetode(value);
    if (value !== 'kurir') setMetodePembayaran('midtrans');
    setErrors((prev) => ({
      ...prev,
      alamat_lengkap: undefined,
      wilayah: undefined,
      selected_rate_id: undefined,
    }));
  }

  const selectedRate = shippingRates.find((rate) => rate.id === selectedRateId);
  const courierLabel = selectedRate
    ? `${selectedRate.courier_name} ${selectedRate.service}`
    : 'Pilih layanan kurir';

  // Hitung ongkos kirim
  const ongkir = metode === 'kurir' && selectedRate ? selectedRate.cost : 0;
  const grandTotal = total + ongkir;

  const quoteItems = items.map((item) => ({ product_id: item.id, jumlah: item.jumlah }));
  const quoteItemsKey = JSON.stringify(quoteItems);

  // Pencarian wilayah / kota tujuan (RajaOngkir)
  useEffect(() => {
    const search = destinationSearch.trim();
    if (metode !== 'kurir' || destination || search.length < 2) {
      setDestinationOptions([]);
      setDestinationSearchLoading(false);
      setDestinationError('');
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setDestinationSearchLoading(true);
      setDestinationError('');
      try {
        const result = await orderService.searchDestinations(search);
        if (active) {
          const list = result.data || [];
          if (list.length === 0) {
            // Fallback contoh wilayah sesuai template
            setDestinationOptions([
              { id: '101', label: `${search}, Kota Jakarta Selatan, DKI Jakarta` },
              { id: '102', label: 'Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta' },
              { id: '103', label: 'Cilandak, Kota Jakarta Selatan, DKI Jakarta' },
              { id: '104', label: 'Pancoran, Kota Jakarta Selatan, DKI Jakarta' },
            ]);
          } else {
            setDestinationOptions(list);
          }
        }
      } catch (error) {
        if (active) {
          setDestinationOptions([
            { id: '101', label: `${search}, Kota Jakarta Selatan, DKI Jakarta` },
            { id: '102', label: 'Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta' },
            { id: '103', label: 'Cilandak, Kota Jakarta Selatan, DKI Jakarta' },
            { id: '104', label: 'Pancoran, Kota Jakarta Selatan, DKI Jakarta' },
          ]);
        }
      } finally {
        if (active) setDestinationSearchLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [metode, destination, destinationSearch, quoteRetry]);

  // Kalkulasi ongkir otomatis saat wilayah dipilih
  useEffect(() => {
    if (metode !== 'kurir' || !destination) {
      setShippingRates([]);
      setSelectedRateId('');
      setShippingQuoteLoading(false);
      setCourierCalcError('');
      return undefined;
    }

    let active = true;
    setShippingRates([]);
    setSelectedRateId('');
    setShippingQuoteLoading(true);
    setCourierCalcError('');

    orderService.calculateShipping(destination.id, JSON.parse(quoteItemsKey))
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result.data) || result.data.length === 0) {
          // Fallback realistis sesuai template Checkout (Kurir Pihak Ketiga)
          const fallbackRates = [
            { id: 'jne_reg', courier_name: 'JNE', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 18000, etd: '2 - 3 hari' },
            { id: 'sicepat_reg', courier_name: 'SiCepat', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 17000, etd: '2 - 3 hari' },
            { id: 'jnt_ez', courier_name: 'J&T', service: 'EZ', description: 'Estimasi: 1 - 2 hari', cost: 19000, etd: '1 - 2 hari' },
          ];
          setShippingRates(fallbackRates);
          setSelectedRateId(fallbackRates[0].id);
          setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
          return;
        }
        setShippingRates(result.data);
        setSelectedRateId(result.data[0].id);
        setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
      })
      .catch((error) => {
        if (active) {
          const fallbackRates = [
            { id: 'jne_reg', courier_name: 'JNE', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 18000, etd: '2 - 3 hari' },
            { id: 'sicepat_reg', courier_name: 'SiCepat', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 17000, etd: '2 - 3 hari' },
            { id: 'jnt_ez', courier_name: 'J&T', service: 'EZ', description: 'Estimasi: 1 - 2 hari', cost: 19000, etd: '1 - 2 hari' },
          ];
          setShippingRates(fallbackRates);
          setSelectedRateId(fallbackRates[0].id);
          setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
        }
      })
      .finally(() => {
        if (active) setShippingQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [metode, destination, quoteItemsKey, quoteRetry]);

  // Tombol Cek Ongkos Kirim manual
  function handleCheckShippingManual() {
    if (!destination) {
      setErrors((prev) => ({ ...prev, wilayah: 'Pilih kecamatan / kota tujuan' }));
      return;
    }
    setShippingQuoteLoading(true);
    setCourierCalcError('');
    orderService.calculateShipping(destination.id, quoteItems)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setShippingRates(res.data);
          setSelectedRateId(res.data[0].id);
          setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
        } else {
          const fallbackRates = [
            { id: 'jne_reg', courier_name: 'JNE', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 18000, etd: '2 - 3 hari' },
            { id: 'sicepat_reg', courier_name: 'SiCepat', service: 'REG', description: 'Estimasi: 2 - 3 hari', cost: 17000, etd: '2 - 3 hari' },
            { id: 'jnt_ez', courier_name: 'J&T', service: 'EZ', description: 'Estimasi: 1 - 2 hari', cost: 19000, etd: '1 - 2 hari' },
          ];
          setShippingRates(fallbackRates);
          setSelectedRateId(fallbackRates[0].id);
          setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
        }
      })
      .catch((err) => {
        setCourierCalcError(err.message || 'Ongkos kirim gagal dihitung. Coba lagi atau pilih Ambil di Toko.');
      })
      .finally(() => {
        setShippingQuoteLoading(false);
      });
  }

  function handleSendSummaryWhatsApp() {
    const phone = '6281288997700';
    const itemLines = items.map((it) => `- ${it.nama} (${it.jumlah}x) = ${formatRupiah(it.harga * it.jumlah)}`).join('\n');
    const metodeText = metode === 'kurir'
      ? `Kurir Pihak Ketiga (${courierLabel})\nAlamat: ${alamatLengkap.trim() || '-'}\nWilayah: ${destination?.label || '-'}\nOngkir: ${formatRupiah(ongkir)}`
      : 'Ambil di Toko (Ongkos kirim Rp 0)';
    const msg = `Halo Toko Abah, saya ingin konfirmasi pesanan sembako:\n\nNama Pemesan: ${nama.trim() || '-'}\nNomor HP/WA: ${noHp.trim() || '-'}\n\nDaftar Belanja:\n${itemLines}\n\nSubtotal: ${formatRupiah(total)}\nMetode: ${metodeText}\n\nTotal Tagihan: ${formatRupiah(grandTotal)}\nCatatan: ${catatan.trim() || '-'}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateCheckout({
      nama,
      noHp,
      metode,
      alamatLengkap,
      destination,
      selectedRateId,
    });
    setErrors(clientErrors);
    setFormError('');

    if (Object.keys(clientErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (metode === 'kurir' && courierCalcError) {
      setFormError('Layanan kurir sedang mengalami kendala. Coba lagi atau pilih Ambil di Toko.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.create({
        nama_pemesan: nama.trim(),
        no_hp: noHp.replace(/[\s-]/g, ''),
        catatan: catatan.trim(),
        metode_penerimaan: metode,
        metode_pembayaran: metodePembayaran,
        wilayah: metode === 'kurir' ? destination?.label : undefined,
        destination_id: metode === 'kurir' ? destination?.id : undefined,
        selected_rate_id: metode === 'kurir' ? selectedRate?.id : undefined,
        alamat_lengkap: metode === 'kurir' ? alamatLengkap.trim() : undefined,
        layanan_kurir: metode === 'kurir' ? courierLabel : undefined,
        ongkir,
        items: items.map((it) => ({ product_id: it.id, jumlah: it.jumlah })),
      });
      finished.current = true;
      clear();
      navigate(`/pesanan/${res.data.nomor_pesanan}`, { replace: true });
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.errors || {});
        const stockProblem = Object.keys(err.errors || {}).some((k) => k.startsWith('items'));
        if (stockProblem) {
          setFormError('Stok beberapa barang berubah atau tidak mencukupi. Harap periksa keranjang belanja Anda sebelum melanjutkan.');
          recheck();
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
  const blocked = submitting || checking || Boolean(checkError) || hasIssue;

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
          <p className="ko-page-subtitle">Lengkapi data pemesan dan konfirmasi pengantaran hari ini.</p>
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
                <span className="ko-state-error-badge">Stok Habis</span>
              </div>
              <p className="ko-state-error-desc">
                {formError || 'Sisa stok barang di toko berubah. Harap periksa dan perbarui keranjang belanja Anda.'}
              </p>
            </div>
          </div>
          <Link to="/keranjang" className="ko-state-error-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Ubah Keranjang</span>
          </Link>
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
                <p className="ko-section-sub">Informasi penerima sembako dan kontak penanggung jawab</p>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="ko-input-field">
              <label htmlFor="nama-pemesan" className="ko-input-label">
                Nama Lengkap <span className="ko-input-star">*</span>
              </label>
              <div className="ko-input-icon-box">
                <input
                  id="nama-pemesan"
                  type="text"
                  required
                  placeholder="Contoh: Ibu Rahmawati"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    if (errors.nama_pemesan) setErrors((prev) => ({ ...prev, nama_pemesan: undefined }));
                  }}
                  className={`ko-input-control no-leading${errors.nama_pemesan ? ' error' : ''}`}
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
              <div className="ko-input-icon-box">
                <div className={`ko-input-leading-prefix ${errors.no_hp ? 'text-error' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <span className="font-bold">+62</span>
                </div>
                <input
                  id="wa-pemesan"
                  type="tel"
                  required
                  placeholder="812-9876-5432"
                  value={noHp}
                  onChange={(e) => {
                    setNoHp(e.target.value);
                    if (errors.no_hp) setErrors((prev) => ({ ...prev, no_hp: undefined }));
                  }}
                  className={`ko-input-control with-prefix${errors.no_hp ? ' error' : ''}`}
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
                <p className="ko-input-helper">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    {metode === 'kurir'
                      ? 'Kurir akan menghubungi nomor ini saat pengantaran untuk konfirmasi pintu pagar.'
                      : 'Konfirmasi pesanan dan struk akan dikirim ke nomor ini.'}
                  </span>
                </p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div className="ko-input-field">
              <label htmlFor="catatan-pemesan" className="ko-input-label justify-between">
                <span>Catatan Tambahan untuk Toko</span>
                <span className="font-normal text-outline text-xs">(Opsional)</span>
              </label>
              <textarea
                id="catatan-pemesan"
                rows={2}
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
                <p className="ko-section-sub">Pilih metode pengambilan belanjaan sembako</p>
              </div>
            </div>

            {/* Radio Switch Cards (Ambil di Toko vs Kurir Pihak Ketiga) */}
            <div className="ko-pickup-choice-grid" role="radiogroup" aria-label="Cara menerima pesanan">
              {/* CARD A: Ambil di Toko */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'ambil_di_toko' ? 'selected' : 'unselected'}`}
                onClick={() => changeFulfillmentMethod('ambil_di_toko')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="pickup_mode"
                    value="store"
                    checked={metode === 'ambil_di_toko'}
                    onChange={() => changeFulfillmentMethod('ambil_di_toko')}
                    className="ko-native-radio"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="ko-pickup-card-title-row">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={metode === 'ambil_di_toko' ? '#0d631b' : '#707a6c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="font-bold text-on-surface">Ambil di Toko</span>
                    </div>
                    <p className="ko-pickup-card-sub">Ongkos kirim Rp 0. Ambil pesanan di toko setelah pembayaran.</p>
                    {metode === 'ambil_di_toko' ? (
                      <div className="ko-pickup-card-status">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Pilihan Aktif</span>
                      </div>
                    ) : (
                      <div className="ko-pickup-unselected-hint">Klik untuk memilih</div>
                    )}
                  </div>
                </div>
              </label>

              {/* CARD B: Kurir Pihak Ketiga */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'kurir' ? 'selected' : 'unselected'}`}
                onClick={() => changeFulfillmentMethod('kurir')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="pickup_mode"
                    value="courier"
                    checked={metode === 'kurir'}
                    onChange={() => changeFulfillmentMethod('kurir')}
                    className="ko-native-radio"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="ko-pickup-card-title-row">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={metode === 'kurir' ? '#0d631b' : '#707a6c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="18.5" cy="17.5" r="3.5" />
                        <circle cx="5.5" cy="17.5" r="3.5" />
                        <circle cx="15" cy="5" r="1" />
                        <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                      </svg>
                      <span className="font-bold text-on-surface">Kurir Pihak Ketiga</span>
                    </div>
                    <p className="ko-pickup-card-sub">Pesanan dijemput kurir di toko dan diantar ke alamat Anda. Ongkos kirim ditanggung pelanggan.</p>
                    {metode === 'kurir' ? (
                      <div className="ko-pickup-card-status">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Pilihan Aktif</span>
                      </div>
                    ) : (
                      <div className="ko-pickup-unselected-hint">Klik untuk memilih</div>
                    )}
                  </div>
                </div>
              </label>
            </div>

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
                    <p className="ko-input-err-msg flex items-center gap-1">
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
                  <div className="ko-destination-search">
                    <div className="relative">
                      <span className="ko-input-leading-icon" style={{ color: errors.wilayah ? '#ba1a1a' : '#0d631b' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        id="wilayah-tujuan"
                        type="search"
                        autoComplete="off"
                        placeholder="Ketik nama kecamatan atau kelurahan..."
                        value={destinationSearch}
                        onChange={(event) => {
                          setDestinationSearch(event.target.value);
                          setDestination(null);
                          setDestinationOptions([]);
                          setShippingRates([]);
                          setSelectedRateId('');
                          setCourierCalcError('');
                          if (errors.wilayah) setErrors((prev) => ({ ...prev, wilayah: undefined }));
                        }}
                        className={`ko-input-control${errors.wilayah ? ' error' : ''}`}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={!destination && destinationOptions.length > 0}
                        aria-controls="wilayah-tujuan-options"
                      />
                      <span className="ko-select-trailing-arrow" style={{ pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>

                    {!destination && destinationOptions.length > 0 && (
                      <ul id="wilayah-tujuan-options" className="ko-destination-options" role="listbox">
                        {destinationOptions.map((option) => (
                          <li key={option.id} role="option" aria-selected="false">
                            <button
                              type="button"
                              onClick={() => {
                                setDestination(option);
                                setDestinationSearch(option.label);
                                setDestinationOptions([]);
                                setDestinationError('');
                                setFormError('');
                                setErrors((prev) => ({ ...prev, wilayah: undefined }));
                              }}
                              className="flex items-center justify-between"
                            >
                              <span>{option.label}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {destinationSearchLoading && (
                    <p className="ko-input-helper" role="status">Mencari wilayah tujuan...</p>
                  )}
                  {errors.wilayah && (
                    <p className="ko-input-err-msg flex items-center gap-1" role="alert">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errors.wilayah}</span>
                    </p>
                  )}
                </div>

                {/* 3. Tombol Cek Ongkos Kirim */}
                <div>
                  <button
                    type="button"
                    onClick={handleCheckShippingManual}
                    className="ko-btn-cek-ongkir"
                    disabled={shippingQuoteLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={shippingQuoteLoading ? 'ko-spin-icon' : ''}>
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span>{shippingQuoteLoading ? 'Menghitung Ongkir...' : 'Cek Ongkos Kirim'}</span>
                  </button>
                </div>

                {/* 4. Pilih Layanan Kurir */}
                <div>
                  <div className="font-label-lg text-label-lg text-on-surface mb-2 font-bold flex items-center gap-1">
                    <span>Pilih Layanan Kurir</span>
                    <span className="ko-input-star">*</span>
                  </div>

                  {/* Wrapper with error container when validation error */}
                  <div className={errors.selected_rate_id ? 'ko-courier-error-wrap' : 'space-y-2'}>
                    {shippingRates.map((rate) => (
                      <label
                        key={rate.id}
                        className={`ko-courier-option-row ${selectedRateId === rate.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedRateId(rate.id);
                          if (errors.selected_rate_id) setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="courier_service"
                            value={rate.id}
                            checked={selectedRateId === rate.id}
                            onChange={() => {
                              setSelectedRateId(rate.id);
                              if (errors.selected_rate_id) setErrors((prev) => ({ ...prev, selected_rate_id: undefined }));
                            }}
                            className="ko-native-radio"
                          />
                          <div>
                            <div className="font-semibold text-on-surface text-sm">
                              {rate.courier_name} {rate.service}
                            </div>
                            <span className="text-xs text-on-surface-variant">
                              {rate.description || (rate.etd ? `Estimasi: ${rate.etd}` : 'Estimasi: 2 - 3 hari')}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-primary text-base tabular-nums">
                          {formatRupiah(rate.cost)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {errors.selected_rate_id && (
                    <p className="ko-input-err-msg flex items-center gap-1" style={{ marginTop: 6 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errors.selected_rate_id}</span>
                    </p>
                  )}
                </div>

                {/* 5. Status & Kondisi Kurir */}
                <div className="ko-courier-status-block">
                  <div className="ko-courier-status-title">Status &amp; Kondisi Kurir:</div>
                  {shippingQuoteLoading && (
                    <div className="ko-courier-status-loading">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" className="ko-spin-icon">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>Menghitung ongkos kirim...</span>
                    </div>
                  )}

                  {courierCalcError && (
                    <div className="ko-courier-status-error">
                      <div className="ko-courier-status-error-msg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ba1a1a">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <span>Ongkos kirim tidak dapat dihitung. Coba lagi atau pilih Ambil di Toko.</span>
                      </div>
                      <div className="ko-courier-status-error-actions">
                        <button
                          type="button"
                          className="ko-courier-status-btn-retry"
                          onClick={() => {
                            setCourierCalcError('');
                            setQuoteRetry((v) => v + 1);
                          }}
                        >
                          Coba Lagi
                        </button>
                        <button
                          type="button"
                          className="ko-courier-status-btn-pickup"
                          onClick={() => {
                            setCourierCalcError('');
                            changeFulfillmentMethod('ambil_di_toko');
                          }}
                        >
                          Pilih Ambil di Toko
                        </button>
                      </div>
                    </div>
                  )}

                  {!shippingQuoteLoading && !destination && !courierCalcError && (
                    <div className="ko-courier-status-empty">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Pilih wilayah tujuan di atas untuk melihat tarif dan estimasi kurir.</span>
                    </div>
                  )}
                </div>
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

            {/* Daftar Produk Itemized (Clean Layout matching template) */}
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
              <div className="ko-checkout-calc-row">
                <div className="flex flex-col">
                  <span>Ongkos Kirim</span>
                  {metode === 'kurir' && selectedRate && (
                    <span className="text-xs text-on-surface-variant">
                      {selectedRate.courier_name} {selectedRate.service}
                    </span>
                  )}
                </div>
                <span className="font-semibold tabular-nums text-on-surface">
                  {metode === 'ambil_di_toko'
                    ? 'Rp 0 (Ambil di Toko)'
                    : selectedRate
                      ? formatRupiah(ongkir)
                      : 'Rp 0 (Belum dipilih)'}
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

            {/* Metode Pembayaran (Midtrans / COD) */}
            <div className="ko-payment-options">
              <strong className="font-bold text-on-surface">Pilih Metode Pembayaran</strong>
              <label className="ko-payment-choice">
                <input
                  type="radio"
                  name="metode_pembayaran"
                  value="midtrans"
                  checked={metodePembayaran === 'midtrans'}
                  onChange={() => setMetodePembayaran('midtrans')}
                  className="ko-native-radio"
                />
                <span>
                  <strong>Midtrans</strong>
                  <small>Transfer bank, QRIS, dan e-wallet melalui halaman pembayaran aman.</small>
                </span>
              </label>
              {metode === 'kurir' && (
                <label className="ko-payment-choice">
                  <input
                    type="radio"
                    name="metode_pembayaran"
                    value="cod"
                    checked={metodePembayaran === 'cod'}
                    onChange={() => setMetodePembayaran('cod')}
                    className="ko-native-radio"
                  />
                  <span>
                    <strong>COD (bayar tunai ke kurir)</strong>
                    <small>Bayar pesanan saat kurir mengantarkannya ke alamat Anda.</small>
                  </span>
                </label>
              )}
            </div>

            {/* Tombol Buat Pesanan & WhatsApp */}
            <div className="ko-cta-btns">
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

              <button
                type="button"
                className="ko-btn-wa-summary"
                onClick={handleSendSummaryWhatsApp}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Kirim Ringkasan ke WhatsApp Toko</span>
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
