import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { itemIssue, useCart } from '../context/CartContext';
import useCartCheck from '../hooks/useCartCheck';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';

// Nomor HP Indonesia: 08..., 628..., atau +628..., 10 sampai 14 digit
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,11}$/;

export function validateCheckout({ nama, noHp }) {
  const errors = {};
  if (!nama.trim()) errors.nama_pemesan = 'Kolom ini wajib diisi';
  const phone = noHp.replace(/[\s-]/g, '');
  if (!phone) errors.no_hp = 'Kolom ini wajib diisi';
  else if (!PHONE_PATTERN.test(phone)) errors.no_hp = 'Masukkan nomor HP yang valid (hanya angka)';
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
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keranjang kosong: kembali ke keranjang (kecuali pesanan baru saja dibuat)
  if (items.length === 0 && !finished.current) {
    return <Navigate to="/keranjang" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateCheckout({ nama, noHp });
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      const res = await orderService.create({
        nama_pemesan: nama.trim(),
        no_hp: noHp.replace(/[\s-]/g, ''),
        catatan: catatan.trim(),
        metode_penerimaan: 'ambil_di_toko',
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
          setFormError('Stok beberapa barang berubah. Periksa keranjang Anda sebelum melanjutkan.');
          recheck();
        }
      } else {
        setFormError(err.message || 'Pesanan gagal dibuat. Coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = submitting || checking || Boolean(checkError) || hasIssue;

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
        <Link to="/keranjang" className="ko-breadcrumb-link">Keranjang Belanja</Link>
        <span className="ko-breadcrumb-separator" aria-hidden="true">/</span>
        <span className="ko-breadcrumb-current">Checkout</span>
      </nav>

      {/* Header & Step Tracker */}
      <div className="ko-checkout-header">
        <div>
          <div className="ko-checkout-pill">
            <span className="ko-checkout-pill-dot" aria-hidden="true" />
            <span>Konfirmasi Belanja Cepat</span>
          </div>
          <h1 className="ko-page-title">Checkout Pesanan Sembako</h1>
          <p className="ko-page-subtitle">Lengkapi data pemesan dan konfirmasi pesanan Anda.</p>
        </div>

        {/* Stepper Indikator Bento */}
        <div className="ko-stepper-tracker" aria-label="Tahapan Belanja">
          {/* Step 1: Keranjang (Selesai) */}
          <div className="ko-step-item done">
            <div className="ko-step-circle done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="ko-step-label">1. Keranjang</span>
          </div>

          <div className="ko-step-line done" aria-hidden="true" />

          {/* Step 2: Checkout (Aktif) */}
          <div className="ko-step-item active">
            <div className="ko-step-circle active">2</div>
            <span className="ko-step-label">2. Checkout</span>
          </div>

          <div className="ko-step-line" aria-hidden="true" />

          {/* Step 3: Pembayaran (Pending) */}
          <div className="ko-step-item">
            <div className="ko-step-circle">3</div>
            <span className="ko-step-label">3. Pembayaran</span>
          </div>
        </div>
      </div>

      {/* Banner Kesalahan Validasi / Stok Berubah */}
      {formError && (
        <div className="ko-alert-warning" role="alert">
          <div className="ko-alert-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="ko-alert-content">
            <p className="ko-alert-desc">
              {formError}{' '}
              <Link to="/keranjang" className="ko-alert-link">Ubah Keranjang</Link>
            </p>
          </div>
        </div>
      )}

      {/* Banner Kesalahan Pemeriksaan Stok API */}
      {checkError && (
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

      {/* Formulir Checkout */}
      <form className="ko-grid" onSubmit={handleSubmit} noValidate>
        {/* Kolom Kiri: Form Data Pemesan & Cara Menerima */}
        <div className="ko-left-col">
          {/* BAGIAN 1: Data Pemesan */}
          <section className="ko-section-card">
            <div className="ko-section-header">
              <span className="ko-section-num">1</span>
              <div>
                <h2 className="ko-section-title">Data Pemesan</h2>
                <p className="ko-section-subtitle">Informasi identitas untuk pengambilan pesanan di kasir</p>
              </div>
            </div>

            <div className="ko-form-fields">
              <TextField
                label="Nama Lengkap *"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                error={errors.nama_pemesan}
                placeholder="Contoh: Ibu Rahmawati"
                autoComplete="name"
              />

              <TextField
                label="Nomor WhatsApp / HP *"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                error={errors.no_hp}
                helper="Pesanan akan dikonfirmasi dan dihubungi ke nomor ini"
                placeholder="Contoh: 0812-3456-7890"
                inputMode="tel"
                autoComplete="tel"
              />

              <div className="field">
                <label htmlFor="catatan" className="ko-field-label">
                  <span>Catatan Tambahan untuk Toko</span>
                  <span className="ko-optional-tag">Opsional</span>
                </label>
                <textarea
                  id="catatan"
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Tolong disiapkan dalam kantong goni rapat ya Abah..."
                  className="ko-textarea"
                />
              </div>
            </div>
          </section>

          {/* BAGIAN 2: Cara Menerima Pesanan */}
          <section className="ko-section-card">
            <div className="ko-section-header">
              <span className="ko-section-num">2</span>
              <div>
                <h2 className="ko-section-title">Cara Menerima Pesanan</h2>
                <p className="ko-section-subtitle">Pilih metode pengambilan kebutuhan belanja Anda</p>
              </div>
            </div>

            <div className="ko-pickup-choice-container" role="radiogroup" aria-label="Cara menerima pesanan">
              {/* Opsi: Ambil di Toko */}
              <label className="ko-pickup-card active">
                <div className="ko-pickup-top">
                  <div className="ko-pickup-radio">
                    <input type="radio" name="metode" checked readOnly aria-label="Ambil di Toko" />
                  </div>
                  <div className="ko-pickup-heading">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="ko-pickup-title">Ambil di Toko</span>
                  </div>
                </div>

                <div className="ko-pickup-badge">
                  <span>Tanpa ongkos kirim (Gratis Rp 0)</span>
                </div>

                <p className="ko-pickup-desc">
                  Ambil belanjaan langsung di kasir Toko Abah Jalan Raya Telang-Kamal tanpa antre. Belanjaan sudah disiapkan dan ditimbang rapi.
                </p>

                <div className="ko-pickup-status">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Pilihan Aktif Saat Ini</span>
                </div>
              </label>

              {/* PPL-09: tambahkan pilihan "Kurir Pihak Ketiga" di sini */}
            </div>
          </section>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan (Sticky) */}
        <aside className="ko-right-col">
          <div className="ko-summary-card">
            <div className="ko-summary-header">
              <h2 className="ko-summary-title">Ringkasan Pesanan</h2>
              <span className="ko-summary-count-badge">{items.length} jenis</span>
            </div>

            {/* Daftar Barang */}
            <div className="ko-checkout-items-list">
              {items.map((it) => {
                const issue = itemIssue(it);
                return (
                  <div key={it.id} className="ko-checkout-item-row">
                    <div className="ko-checkout-item-desc">
                      <span className="ko-checkout-item-name">{it.nama}</span>
                      <span className="ko-checkout-item-qty">x{it.jumlah}</span>
                      {issue && (
                        <span className="ko-item-issue-tag" role="alert">
                          ({issue})
                        </span>
                      )}
                    </div>
                    <span className="ko-checkout-item-subtotal">
                      {formatRupiah(it.harga * it.jumlah)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="ko-summary-divider" />

            <div className="ko-summary-lines">
              <div className="ko-summary-row">
                <span className="ko-summary-label">Ongkos Kirim</span>
                <span className="ko-free-badge">Rp 0 (Ambil di Toko)</span>
              </div>

              <div className="ko-summary-row ko-summary-total-row">
                <span className="ko-total-label">Total Pembayaran</span>
                <strong className="ko-total-val">{formatRupiah(total)}</strong>
              </div>
            </div>

            <p className="ko-summary-note">
              Pesanan akan tercatat di sistem Toko Abah dengan status <strong>Menunggu Pembayaran</strong>.
            </p>

            <Button
              type="submit"
              variant="primary"
              className="ko-btn-checkout"
              disabled={blocked}
            >
              {submitting ? (
                <span>Membuat pesanan...</span>
              ) : (
                <>
                  <span>Buat Pesanan</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
