import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { itemIssue, useCart } from '../context/CartContext';
import useCartCheck from '../hooks/useCartCheck';
import { orderService } from '../services/orderService';
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

// Nomor HP Indonesia: 08..., 628..., atau +628..., 10 sampai 14 digit
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,11}$/;

export function validateCheckout({ nama, noHp, metode, alamatLengkap }) {
  const errors = {};
  if (!nama.trim()) errors.nama_pemesan = 'Kolom ini wajib diisi';
  const phone = noHp.replace(/[\s-]/g, '');
  if (!phone) errors.no_hp = 'Kolom ini wajib diisi';
  else if (!PHONE_PATTERN.test(phone)) errors.no_hp = 'Masukkan nomor HP yang valid (hanya angka)';

  if (metode === 'kurir' && !alamatLengkap.trim()) {
    errors.alamat_lengkap = 'Kolom ini wajib diisi';
  }

  return errors;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, hasIssue, clear } = useCart();
  const { checking, error: checkError, recheck } = useCartCheck();
  const finished = useRef(false);

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [catatan, setCatatan] = useState('');

  // Metode Penerimaan: 'ambil_di_toko' | 'kurir'
  const [metode, setMetode] = useState('ambil_di_toko');
  const [wilayah, setWilayah] = useState('Telang, Kamal (Radius < 3 km)');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [layananKurir, setLayananKurir] = useState('kurir_abah'); // 'kurir_abah' | 'grab_gosend'
  const [courierCalcError, setCourierCalcError] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keranjang kosong: kembali ke keranjang (kecuali pesanan baru saja dibuat)
  if (items.length === 0 && !finished.current) {
    return <Navigate to="/keranjang" replace />;
  }

  // Hitung ongkos kirim & diskon
  const diskon = total >= 100000 ? 6000 : 0;
  const ongkir = metode === 'kurir' ? (layananKurir === 'grab_gosend' ? 18000 : 15000) : 0;
  const grandTotal = Math.max(0, total - diskon + ongkir);

  function handleSendSummaryWhatsApp() {
    const phone = '6281288997700';
    const itemLines = items.map((it) => `- ${it.nama} (${it.jumlah}x) = ${formatRupiah(it.harga * it.jumlah)}`).join('\n');
    const metodeText = metode === 'kurir'
      ? `Kurir Pihak Ketiga (${layananKurir === 'grab_gosend' ? 'Grab/GoSend' : 'Kurir Toko'})\nAlamat: ${alamatLengkap.trim() || '-'}\nWilayah: ${wilayah}\nOngkir: ${formatRupiah(ongkir)}`
      : 'Ambil Mandiri di Toko Abah (Jl. Raya Telang-Kamal)';
    const msg = `Halo Toko Abah, saya ingin konfirmasi pesanan sembako:\n\nNama Pemesan: ${nama.trim() || '-'}\nNomor HP/WA: ${noHp.trim() || '-'}\n\nDaftar Belanja:\n${itemLines}\n\nSubtotal: ${formatRupiah(total)}\nDiskon: -${formatRupiah(diskon)}\nMetode: ${metodeText}\n\nTotal Tagihan: ${formatRupiah(grandTotal)}\nCatatan: ${catatan.trim() || '-'}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateCheckout({ nama, noHp, metode, alamatLengkap });
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (metode === 'kurir' && courierCalcError) {
      setFormError('Layanan kurir sedang mengalami kendala. Harap pilih Ambil di Toko atau coba lagi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.create({
        nama_pemesan: nama.trim(),
        no_hp: noHp.replace(/[\s-]/g, ''),
        catatan: catatan.trim(),
        metode_penerimaan: metode,
        wilayah: metode === 'kurir' ? wilayah : undefined,
        alamat_lengkap: metode === 'kurir' ? alamatLengkap.trim() : undefined,
        layanan_kurir: metode === 'kurir' ? (layananKurir === 'grab_gosend' ? 'GrabExpress / GoSend Sameday' : 'Kurir Instan Toko Abah (Motor)') : undefined,
        ongkir,
        diskon,
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

  return (
    <div className="ko-checkout-wrapper">
      {/* Breadcrumb Bar */}
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
          <h1 className="ko-page-title">Checkout Pesanan Sembako</h1>
          <p className="ko-page-subtitle">Lengkapi data pemesan dan konfirmasi pengantaran hari ini.</p>
        </div>

        {/* Stepper Indikator */}
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

      {/* Banner Error Validasi / Stok Habis (Matching Checkout State Error & Validasi) */}
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
                {formError || `Sisa stok di toko hanya 0 sak. Harap perbarui keranjang belanja Anda sebelum melanjutkan.`}
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
                {errors.nama_pemesan && (
                  <span className="ko-input-trailing-icon error" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ba1a1a">
                      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
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
                  <span>{metode === 'kurir' ? 'Kurir akan menghubungi nomor ini saat pengantaran untuk konfirmasi pintu pagar.' : 'Konfirmasi pesanan dan struk akan dikirim ke nomor ini.'}</span>
                </p>
              )}
            </div>

            <div className="ko-input-field">
              <label htmlFor="catatan-pemesan" className="ko-input-label justify-between">
                <span>Catatan Tambahan untuk Toko</span>
                <span className="font-normal text-outline text-xs">Opsional</span>
              </label>
              <textarea
                id="catatan-pemesan"
                rows={2}
                placeholder="Tolong bungkus minyaknya rapat ya Abah."
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

            {/* Radio Switch Cards Bento */}
            <div className="ko-pickup-choice-grid" role="radiogroup" aria-label="Cara menerima pesanan">
              {/* CARD A: Ambil di Toko */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'ambil_di_toko' ? 'selected' : 'unselected'}`}
                onClick={() => setMetode('ambil_di_toko')}
              >
                {metode === 'ambil_di_toko' && (
                  <div className="ko-pickup-active-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Pilihan Aktif</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="pickup_mode"
                    value="store"
                    checked={metode === 'ambil_di_toko'}
                    onChange={() => setMetode('ambil_di_toko')}
                    className="ko-native-radio"
                  />
                  <div className="flex flex-col">
                    <div className="ko-pickup-card-title-row">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={metode === 'ambil_di_toko' ? '#0d631b' : '#707a6c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="font-bold text-on-surface">Ambil di Toko</span>
                    </div>
                    <span className="ko-pickup-card-sub">Ambil mandiri di Toko Abah (Jl. Raya Telang-Kamal)</span>
                    <span className="ko-pickup-free-tag">Tanpa ongkos kirim</span>
                  </div>
                </div>
              </label>

              {/* CARD B: Kurir Pihak Ketiga */}
              <label
                className={`ko-pickup-selectable-card ${metode === 'kurir' ? 'selected' : 'unselected'}`}
                onClick={() => setMetode('kurir')}
              >
                {metode === 'kurir' && (
                  <div className="ko-pickup-active-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Pilihan Aktif</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="pickup_mode"
                    value="courier"
                    checked={metode === 'kurir'}
                    onChange={() => setMetode('kurir')}
                    className="ko-native-radio"
                  />
                  <div className="flex flex-col">
                    <div className="ko-pickup-card-title-row">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={metode === 'kurir' ? '#0d631b' : '#707a6c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="18.5" cy="17.5" r="3.5" />
                        <circle cx="5.5" cy="17.5" r="3.5" />
                        <circle cx="15" cy="5" r="1" />
                        <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                      </svg>
                      <span className="font-bold text-on-surface">Kurir Pihak Ketiga</span>
                    </div>
                    <span className="ko-pickup-card-sub">Diantar instan langsung ke depan pintu</span>
                    <span className="ko-pickup-delivery-tag">Diantar langsung ke rumah</span>
                  </div>
                </div>
              </label>
            </div>

            {/* DETAIL KONTEN AMBIL DI TOKO */}
            {metode === 'ambil_di_toko' && (
              <>
                <div className="ko-eco-banner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                  <div>
                    <strong className="text-primary font-bold">Hemat Pengeluaran!</strong> Anda memilih ambil sendiri di toko. Tidak ada biaya pengiriman <span className="text-primary font-bold underline decoration-primary/40">(Ongkir Rp 0)</span>.
                  </div>
                </div>

                <div className="ko-pickup-details-box">
                  <div className="ko-box-head">
                    <span className="ko-box-head-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Titik Pengambilan &amp; Prosedur Toko</span>
                    </span>
                    <span className="ko-box-badge-ready">Siap 30-45 Menit</span>
                  </div>

                  <div className="ko-pickup-2col">
                    <div className="ko-pickup-info-item">
                      <span className="ko-info-meta-label">Alamat Fisik Toko:</span>
                      <p className="ko-info-meta-val">Jl. Raya Telang-Kamal, Bangkalan, Madura</p>
                      <span className="ko-info-meta-sub">Patokan: Depan Gerbang Kampus UTM / Toko Abah</span>
                    </div>
                    <div className="ko-pickup-info-item">
                      <span className="ko-info-meta-label">Waktu Operasional:</span>
                      <p className="ko-info-meta-val flex items-center gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Setiap Hari: 07:00 - 21:00 WIB</span>
                      </p>
                      <span className="ko-info-meta-sub">Pesanan masuk setelah jam 20:30 WIB siap esok pagi</span>
                    </div>
                  </div>

                  <div className="ko-kasir-instruction">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <p>
                      <strong className="text-on-surface">Instruksi Kasir:</strong> Pesanan siap diambil dalam <strong>30-45 menit</strong> setelah pesanan dibuat. Tunjukkan nama pemesan <strong className="text-primary">({nama.trim() || 'Ibu Rahmawati'})</strong> atau nomor pesanan kepada petugas kasir saat mengambil.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* DETAIL KONTEN KURIR PIHAK KETIGA */}
            {metode === 'kurir' && (
              <div className="ko-courier-fields-container">
                {/* Delivery Notice Banner */}
                <div className="ko-courier-notice-card">
                  <div className="ko-courier-notice-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#005312" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className="ko-courier-notice-content">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Pengiriman dari Gudang Jl. Raya Telang-Kamal</span>
                      <span className="ko-courier-stock-badge">Stok Siap</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Sembako dipacking aman kardus tebal dan plastik anti-bocor.</p>
                  </div>
                </div>

                {/* Field: Wilayah Tujuan */}
                <div className="ko-input-field">
                  <label htmlFor="wilayah-tujuan" className="ko-input-label">
                    Wilayah Pengiriman / Kecamatan <span className="ko-input-star">*</span>
                  </label>
                  <div className="ko-select-wrapper">
                    <span className="ko-select-leading-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <select
                      id="wilayah-tujuan"
                      value={wilayah}
                      onChange={(e) => setWilayah(e.target.value)}
                      className="ko-select-control"
                    >
                      <option value="Telang, Kamal (Radius < 3 km)">Telang, Kamal (Radius &lt; 3 km)</option>
                      <option value="Kamal Barat, Bangkalan (Radius 3 - 5 km)">Kamal Barat, Bangkalan (Radius 3 - 5 km)</option>
                      <option value="Kamal Timur, Bangkalan (Radius 4 - 6 km)">Kamal Timur, Bangkalan (Radius 4 - 6 km)</option>
                      <option value="Labang, Bangkalan (Radius 5 - 8 km)">Labang, Bangkalan (Radius 5 - 8 km)</option>
                    </select>
                    <span className="ko-select-trailing-arrow" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5 px-0.5">
                    <span className="text-primary font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                      <span>Area layanan antar aktif &amp; didukung</span>
                    </span>
                    <span className="text-on-surface-variant font-medium">Estimasi jarak: ~1.8 km</span>
                  </div>
                </div>

                {/* Field: Alamat Lengkap & Patokan Rumah */}
                <div className="ko-input-field">
                  <label htmlFor="alamat-lengkap" className="ko-input-label">
                    Alamat Lengkap &amp; Patokan Rumah <span className="ko-input-star">*</span>
                  </label>
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
                  {errors.alamat_lengkap ? (
                    <p className="ko-input-err-msg flex items-center gap-1">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ba1a1a" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errors.alamat_lengkap}</span>
                    </p>
                  ) : (
                    <p className="ko-input-helper">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Cantumkan patokan atau nomor rumah agar kurir mudah menemukan lokasi pengantaran.</span>
                    </p>
                  )}
                </div>

                {/* Delivery Cost Highlight Card OR Courier Error State Card */}
                {courierCalcError ? (
                  <div className="ko-courier-error-card" role="alert">
                    <div className="flex items-start gap-3">
                      <div className="ko-courier-error-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </div>
                      <div>
                        <span className="ko-courier-error-tag">Gangguan Layanan Kurir</span>
                        <h4 className="ko-courier-error-title">Ongkos kirim tidak dapat dihitung</h4>
                        <p className="ko-courier-error-sub">Gagal menghubungkan sistem tarif kurir. Coba lagi atau pilih metode Ambil di Toko.</p>
                      </div>
                    </div>
                    <div className="ko-courier-error-btns">
                      <button
                        type="button"
                        className="ko-btn-retry-courier"
                        onClick={() => setCourierCalcError(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Coba Lagi</span>
                      </button>
                      <button
                        type="button"
                        className="ko-btn-switch-store"
                        onClick={() => {
                          setCourierCalcError(false);
                          setMetode('ambil_di_toko');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                        <span>Pilih Ambil di Toko</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ko-courier-highlight-card">
                    <div className="flex items-center gap-3">
                      <div className="ko-moped-icon-box">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18.5" cy="17.5" r="3.5" />
                          <circle cx="5.5" cy="17.5" r="3.5" />
                          <circle cx="15" cy="5" r="1" />
                          <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                        </svg>
                      </div>
                      <div>
                        <span className="ko-highlight-small-title">Biaya Pengiriman Terpilih</span>
                        <div className="ko-highlight-big-rate">Ongkos Kirim {formatRupiah(ongkir)}</div>
                        <p className="ko-highlight-desc">
                          {layananKurir === 'grab_gosend' ? 'Pengiriman via mitra GrabExpress / GoSend' : 'Pengiriman langsung oleh armada kurir internal Toko Abah'}
                        </p>
                      </div>
                    </div>
                    <div className="self-end sm:self-center">
                      <span className="ko-priority-pill">Prioritas Pagi Ini</span>
                    </div>
                  </div>
                )}

                {/* Field: Pilih Layanan Kurir */}
                <div className="ko-courier-options-group">
                  <span className="ko-input-label font-bold text-on-surface">Pilih Layanan Kurir</span>
                  <div className="space-y-2 mt-2">
                    {/* Option 1: Kurir Abah */}
                    <label
                      className={`ko-courier-option-row ${layananKurir === 'kurir_abah' ? 'selected' : ''}`}
                      onClick={() => setLayananKurir('kurir_abah')}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selected_courier"
                          value="kurir_abah"
                          checked={layananKurir === 'kurir_abah'}
                          onChange={() => setLayananKurir('kurir_abah')}
                          className="ko-native-radio"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface text-sm">Kurir Instan Toko Abah (Motor)</span>
                            <span className="ko-badge-recommend">Rekomendasi</span>
                          </div>
                          <span className="text-xs text-on-surface-variant">Estimasi tiba: 45 - 60 menit • Driver internal toko</span>
                        </div>
                      </div>
                      <span className="font-bold text-primary text-base tabular-nums">Rp 15.000</span>
                    </label>

                    {/* Option 2: Sameday */}
                    <label
                      className={`ko-courier-option-row ${layananKurir === 'grab_gosend' ? 'selected' : ''}`}
                      onClick={() => setLayananKurir('grab_gosend')}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selected_courier"
                          value="grab_gosend"
                          checked={layananKurir === 'grab_gosend'}
                          onChange={() => setLayananKurir('grab_gosend')}
                          className="ko-native-radio"
                        />
                        <div>
                          <div className="font-semibold text-on-surface text-sm">GrabExpress / GoSend Sameday</div>
                          <span className="text-xs text-on-surface-variant">Estimasi tiba: 2 - 4 jam • Kurir pihak ketiga reguler</span>
                        </div>
                      </div>
                      <span className="font-semibold text-on-surface-variant text-base tabular-nums">Rp 18.000</span>
                    </label>
                  </div>
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

            {/* Daftar Produk Itemized */}
            <div className="ko-itemized-list">
              {items.map((it) => {
                const thumb = getProductThumbnail(it.nama);
                const issue = itemIssue(it);

                return (
                  <div key={it.id} className="ko-itemized-row">
                    {thumb ? (
                      <img src={thumb} alt={it.nama} className="ko-itemized-thumb" />
                    ) : (
                      <div className="ko-itemized-thumb flex items-center justify-center text-outline">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        </svg>
                      </div>
                    )}
                    <div className="ko-itemized-center">
                      <h3 className="ko-itemized-name">{it.nama}</h3>
                      <p className="ko-itemized-qty">
                        Kuantitas: {it.jumlah}x {issue && <span className="text-error font-semibold">({issue})</span>}
                      </p>
                    </div>
                    <div className="ko-itemized-price">
                      {formatRupiah(it.harga * it.jumlah)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rincian Perhitungan Harga */}
            <div className="ko-checkout-calc-box">
              <div className="ko-checkout-calc-row">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-on-surface">{formatRupiah(total)}</span>
              </div>
              <div className="ko-checkout-calc-row promo">
                <span className="flex items-center gap-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Diskon Promo Toko</span>
                </span>
                <span className="font-bold tabular-nums">{diskon > 0 ? `- ${formatRupiah(diskon)}` : 'Rp 0'}</span>
              </div>
              <div className="ko-checkout-calc-row">
                <div className="flex flex-col">
                  <span>Ongkos Kirim</span>
                  <span className="text-xs text-primary font-semibold">
                    {metode === 'kurir' ? (layananKurir === 'grab_gosend' ? 'Grab/GoSend Sameday' : 'Kurir Pihak Ketiga (Motor)') : 'Ambil Mandiri di Toko'}
                  </span>
                </div>
                <span className="font-bold text-primary tabular-nums">
                  {metode === 'kurir' ? formatRupiah(ongkir) : 'Gratis (Rp 0)'}
                </span>
              </div>

              <div className="ko-calc-divider">
                <div className="ko-total-row-checkout">
                  <div className="ko-total-label-box">
                    <span className="ko-total-text">Total Tagihan</span>
                    <span className="ko-ppn-sub">Termasuk PPN &amp; Packing</span>
                  </div>
                  <span className="ko-total-big-val">{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Petunjuk Metode Pembayaran */}
            <div className="ko-payment-preview-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <div>
                <strong className="block font-bold text-on-surface">Pilihan Pembayaran Fleksibel:</strong>
                <span className="text-xs text-on-surface-variant">
                  {metode === 'kurir'
                    ? 'Transfer Bank BCA/Mandiri, QRIS instan, atau bayar tunai (COD) saat kurir tiba di rumah.'
                    : 'Transfer Bank BCA/Mandiri, QRIS instan, atau bayar tunai di kasir saat mengambil sembako.'}
                </span>
              </div>
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
                    <span>Buat Pesanan Sekarang</span>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Kirim Ringkasan ke WhatsApp Toko</span>
              </button>
            </div>

            {/* Jaminan Toko Abah */}
            <div className="ko-checkout-trust-row">
              <div className="ko-trust-check-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Pengiriman Aman Tersegel</span>
              </div>
              <div className="ko-trust-check-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                </svg>
                <span>Garansi Sembako Segar</span>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
