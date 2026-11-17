import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QrisModal from '../components/QrisModal';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';

import berasImg from '../assets/Beras.jpg';
import minyakImg from '../assets/Minyak-Goreng.jpg';
import gulaImg from '../assets/Gula-Pasir.jpg';
import telurImg from '../assets/Telur Ayam.jpg';
import mieImg from '../assets/Mie-Instan.jpg';
import kopiImg from '../assets/Kopi-Sachet.jpg';
import storeBannerImg from '../assets/store-banner.jpg';

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

export default function OrderPage() {
  const { nomor } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(58 * 60 + 42);

  // Ambil data pesanan dari API / mockServer
  useEffect(() => {
    let cancelled = false;
    orderService
      .get(nomor)
      .then((res) => {
        if (!cancelled) {
          setOrder(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback realistis sesuai tampilan template desain
          setOrder({
            id: 1,
            nomor_pesanan: nomor || 'TA-20261112-001',
            status: 'Menunggu Pembayaran',
            tanggal: new Date().toISOString(),
            nama_pemesan: 'Ibu Rahmawati',
            no_hp: '081298765432',
            catatan: 'Tolong bungkus minyaknya rapat ya Abah.',
            metode_penerimaan: 'ambil_di_toko',
            wilayah: 'Telang, Kamal (Radius < 3 km)',
            alamat_lengkap: 'Jl. Raya Telang No. 15, RT 04 / RW 03, Kamal, Bangkalan',
            layanan_kurir: 'Kurir Instan Toko Abah (Motor)',
            items: [
              { product_id: 1, nama: 'Beras Ramos Setra 5 kg', harga: 74000, jumlah: 1, subtotal: 74000, kategori: 'Beras Premium', variasi: '5 kg', catatan: 'Kualitas super, putih bersih, pulen wangi' },
              { product_id: 2, nama: 'Minyak Goreng Sawit 2 L', harga: 36000, jumlah: 1, subtotal: 36000, kategori: 'Minyak & Mentega', variasi: '2 L', catatan: 'Kemasan pouch refill ganda penyaringan' },
              { product_id: 3, nama: 'Gula Pasir Tebu 1 kg', harga: 17500, jumlah: 1, subtotal: 17500, kategori: 'Gula & Pemanis', variasi: '1 kg', catatan: 'Manis alami dari sari tebu pilihan, kristal putih' },
            ],
            subtotal: 127500,
            diskon: 6000,
            ongkir: 0,
            total: 121500,
          });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nomor]);

  // Countdown timer batas pembayaran (58 menit)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleCopyOrderId() {
    if (!order?.nomor_pesanan) return;
    navigator.clipboard.writeText(order.nomor_pesanan).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSendWhatsApp() {
    if (!order) return;
    const phone = '6281288997700';
    const msg = `Halo Toko Abah, saya sudah membuat pesanan nomor ${order.nomor_pesanan} senilai ${formatRupiah(order.total)}. Mohon disiapkan ya. Terima kasih!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (loading) {
    return (
      <div className="ko-order-page-wrapper flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2.5" className="ko-spin">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          </svg>
          <p className="text-on-surface-variant font-medium">Memuat rincian pesanan Anda...</p>
        </div>
      </div>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerStr = secondsLeft > 0 ? `Sisa ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : 'Waktu Habis';

  const orderDate = new Date(order.tanggal || Date.now());
  const dateFormatted = orderDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  const deadlineDate = new Date(orderDate.getTime() + 60 * 60 * 1000);
  const deadlineFormatted = deadlineDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  const deadlineTime = deadlineDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', ':') + ' WIB';

  const isCourier = order.metode_penerimaan === 'kurir';
  const nomorPesanan = order.nomor_pesanan || 'TA-20261112-001';
  const waTotal = formatRupiah(order.total || 121500).replace(/\s+/g, '');
  const waMessage = `Halo Toko Abah, saya sudah membuat pesanan nomor ${nomorPesanan} senilai ${waTotal}. Mohon disiapkan ya.`;
  const waLink = `https://wa.me/6281288997700?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="ko-order-page-wrapper">
      {/* Background Ambient Glow */}
      <div className="ko-ambient-glow" aria-hidden="true" />

      <div className="ko-order-container">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="ko-checkout-nav">
          <Link to="/katalog" className="flex items-center gap-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>Beranda</span>
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link to="/keranjang">Keranjang Belanja</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>Checkout</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="font-bold text-primary">Pesanan Berhasil</span>
        </nav>

        {/* Multi-step Progress Bar (100% Selesai sampai Tahap Bayar) */}
        <div className="ko-order-stepper-card">
          <div className="ko-order-stepper-inner">
            <div className="ko-order-stepper-track" aria-hidden="true">
              <div className="ko-order-stepper-progress" style={{ width: isPaid ? '100%' : '100%' }} />
            </div>

            {/* Step 1: Keranjang (Selesai) */}
            <div className="ko-order-step-col">
              <div className="ko-order-step-circle done">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="ko-order-step-label">1. Keranjang</span>
              <span className="ko-order-step-sub">{order.items?.length || 3} Produk Sembako</span>
            </div>

            {/* Step 2: Checkout (Selesai) */}
            <div className="ko-order-step-col">
              <div className="ko-order-step-circle done">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="ko-order-step-label">2. Checkout</span>
              <span className="ko-order-step-sub">{isCourier ? 'Kurir Pihak Ketiga' : 'Ambil di Toko'}</span>
            </div>

            {/* Step 3: Pembayaran & Selesai */}
            <div className="ko-order-step-col">
              <div className={`ko-order-step-circle ${isPaid ? 'done' : 'active-pulse'}`}>
                {isPaid ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                )}
              </div>
              <span className={`ko-order-step-label ${isPaid ? 'text-primary' : 'text-secondary'}`}>
                3. Pembayaran
              </span>
              <span className={`ko-order-step-sub ${isPaid ? 'text-primary font-bold' : 'text-secondary font-bold'}`}>
                {isPaid ? 'Sudah Dibayar' : 'Menunggu Bayar'}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Success Card */}
        <div className="ko-hero-success-card">
          <div className="ko-hero-success-bg-arc" aria-hidden="true" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="ko-hero-check-circle">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="8 12 11 15 16 9" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="ko-hero-badge-pill">Pesanan Diterima</span>
                  <span className="text-xs text-on-surface-variant font-medium">Sistem Penjualan Langsung Toko Abah</span>
                </div>
                <h1 className="ko-hero-title">Pesanan Anda sudah dibuat</h1>
                <p className="ko-hero-desc">
                  Terima kasih! Pesanan sembako Anda telah tercatat dalam antrean persiapan Toko Abah Telang-Kamal.
                </p>
              </div>
            </div>

            {/* Quick Status & Order ID Pill */}
            <div className="ko-hero-order-pill-box">
              <div>
                <span className="ko-hero-order-no-label">Nomor Pesanan</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="ko-hero-order-id-val">{order.nomor_pesanan}</span>
                  <button
                    type="button"
                    onClick={handleCopyOrderId}
                    className={`ko-btn-copy-id ${copied ? 'copied' : ''}`}
                    title="Salin Nomor Pesanan"
                  >
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                {isPaid ? (
                  <span className="ko-order-status-pill paid">
                    <span className="ko-status-dot-solid" />
                    <span>Sudah Dibayar</span>
                  </span>
                ) : (
                  <span className="ko-order-status-pill pending">
                    <span className="ko-status-dot-pulse" />
                    <span>Menunggu Pembayaran</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Order Metadata & Reminder Bar */}
          <div className="ko-order-meta-grid">
            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <p className="text-xs text-on-surface-variant m-0">Waktu Pemesanan</p>
                <p className="text-sm font-semibold text-on-surface m-0">{dateFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <div>
                <p className="text-xs text-on-surface-variant m-0">Metode Pemenuhan</p>
                <p className="text-sm font-semibold text-on-surface m-0">
                  {isCourier ? 'Kurir Pihak Ketiga' : 'Ambil Mandiri di Toko'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-xs text-on-surface-variant m-0">Batas Akhir Transaksi</p>
                <p className="text-sm font-bold text-secondary m-0">{deadlineFormatted}</p>
              </div>
            </div>
          </div>

          {/* Urgent Countdown Warning Banner */}
          {!isPaid && (
            <div className="ko-urgent-countdown-banner">
              <div className="flex items-center gap-3">
                <div className="ko-hourglass-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#964900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 22h14" />
                    <path d="M5 2h14" />
                    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                  </svg>
                </div>
                <div>
                  <p className="ko-urgent-text-head">
                    Selesaikan pembayaran sebelum batas waktu: {deadlineFormatted}
                  </p>
                  <p className="ko-urgent-text-sub">
                    Stok barang aman dan dipisahkan selama waktu tunggu. Pesanan otomatis dibatalkan jika melebihi batas waktu.
                  </p>
                </div>
              </div>
              <div className="ko-urgent-timer-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{timerStr}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Structured Grid: 2 Columns */}
        <div className="ko-order-main-grid">
          {/* Left/Main Column: Order Details & Pickup Info */}
          <div className="ko-order-left-col">
            {/* Rincian Barang Belanjaan Card */}
            <div className="ko-order-card">
              <div className="ko-order-card-header">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <h2 className="ko-card-title">Rincian Barang Belanjaan</h2>
                </div>
                <span className="ko-card-count-badge">
                  {order.items?.length || 3} Item Sembako
                </span>
              </div>

              {/* Items List */}
              <div className="ko-order-items-list">
                {order.items?.map((it) => {
                  const thumb = getProductThumbnail(it.nama);

                  return (
                    <div key={it.product_id || it.id} className="ko-order-item-row">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="ko-order-thumb-wrapper">
                          {thumb ? (
                            <img src={thumb} alt={it.nama} className="ko-order-thumb-img" />
                          ) : (
                            <div className="ko-order-thumb-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="1.8">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                              </svg>
                            </div>
                          )}
                          {it.variasi && (
                            <span className="ko-order-weight-tag">{it.variasi}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="ko-order-category-tag">{it.kategori || 'Sembako Segar'}</span>
                          <h3 className="ko-order-item-name">{it.nama}</h3>
                          <p className="ko-order-item-desc">{it.catatan || 'Kualitas super, bersih, terjamin segar'}</p>
                          <div className="mt-1">
                            <span className="ko-order-unit-calc">
                              {it.jumlah} {it.nama.toLowerCase().includes('beras') ? 'sak' : it.nama.toLowerCase().includes('minyak') ? 'pouch' : 'bks'} &times; {formatRupiah(it.harga)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs text-on-surface-variant block">Subtotal</span>
                        <span className="font-bold text-on-surface text-base tabular-nums">
                          {formatRupiah(it.subtotal || it.harga * it.jumlah)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculation Breakdown */}
              <div className="ko-order-calc-card">
                <div className="ko-order-calc-line">
                  <span>Subtotal Produk ({order.items?.length || 3} item)</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatRupiah(order.subtotal || 127500)}
                  </span>
                </div>
                <div className="ko-order-calc-line discount">
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    </svg>
                    <span>Diskon Promo Toko Abah</span>
                  </span>
                  <span className="font-bold tabular-nums">
                    {order.diskon ? `- ${formatRupiah(order.diskon)}` : '- Rp 0'}
                  </span>
                </div>
                <div className="ko-order-calc-line">
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>Ongkos Kirim {isCourier ? '(Kurir Pihak Ketiga)' : '(Ambil Mandiri)'}</span>
                  </span>
                  <span className="font-bold text-primary">
                    {isCourier ? formatRupiah(order.ongkir || 15000) : 'Gratis (Rp 0)'}
                  </span>
                </div>

                {/* Total Pembayaran Highlight */}
                <div className="ko-order-total-highlight-row">
                  <div>
                    <span className="ko-order-total-lbl">Total Pembayaran</span>
                    <p className="ko-order-total-sub">Sudah termasuk PPN &amp; potongan promo</p>
                  </div>
                  <div className="text-right">
                    <span className="ko-order-total-kpi">
                      {formatRupiah(order.total || 121500)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Card for Fulfillment & Customer */}
            <div className="ko-order-card">
              <div className="ko-order-card-header">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <div>
                    <h2 className="ko-card-title">
                      {isCourier ? 'Informasi Pengantaran Kurir' : 'Informasi Pengambilan Pesanan'}
                    </h2>
                    <p className="text-xs text-on-surface-variant m-0">
                      {isCourier ? 'Pengantaran instan ke alamat penerima' : 'Pengambilan mandiri di gerai Toko Abah Jl. Raya Telang-Kamal'}
                    </p>
                  </div>
                </div>
                <span className="ko-badge-ready-pill">
                  {isCourier ? 'Siap Diantar' : 'Siap Disiapkan'}
                </span>
              </div>

              {/* Sub-cards: Store Details & Buyer Information */}
              <div className="ko-order-subcards-grid">
                {/* Store Location */}
                <div className="ko-order-subcard">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="ko-subcard-icon-circle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span className="font-bold text-sm text-on-surface">Lokasi Toko Abah</span>
                    </div>
                    <p className="font-semibold text-sm text-on-surface m-0">Toko Abah Sembako Telang-Kamal</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Jl. Raya Telang-Kamal No. 42 (Depan Gerbang Kampus UTM), Kamal, Bangkalan, Madura 69162
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>07:00 - 21:00 WIB</span>
                    </div>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Buka Peta</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Buyer Data & Pickup Note */}
                <div className="ko-order-subcard">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="ko-subcard-icon-circle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <span className="font-bold text-sm text-on-surface">Data Pemesan / Penerima</span>
                    </div>
                    <p className="font-bold text-sm text-on-surface m-0">{order.nama_pemesan || 'Ibu Rahmawati'}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                      <span>{order.no_hp || '0812-9876-5432'}</span>
                    </div>

                    {isCourier && order.alamat_lengkap && (
                      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                        <strong className="text-on-surface">Alamat Antar:</strong> {order.alamat_lengkap} ({order.wilayah || 'Telang, Kamal'})
                      </p>
                    )}

                    <div className="mt-2.5 p-2 bg-surface-container-lowest rounded-lg border border-surface-container-high/60">
                      <div className="flex items-start gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <p className="text-xs text-on-surface-variant m-0 leading-snug">
                          <strong className="text-on-surface">Catatan:</strong> Tunjukkan nomor <strong className="text-primary">{order.nomor_pesanan}</strong> kepada kasir atau kurir.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-surface-container-high/60 flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Bisa diwakilkan keluarga membawa bukti pesanan</span>
                  </div>
                </div>
              </div>

              {/* Visual Map Placeholder Card */}
              <div
                className="ko-visual-map-card"
                style={{
                  backgroundImage: `url(${storeBannerImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="ko-map-overlay" />
                <div className="ko-map-store-badge">
                  <div className="ko-map-badge-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface block">Gerai Toko Abah Telang-Kamal</span>
                    <span className="text-xs text-on-surface-variant">Parkir motor &amp; mobil luas dan gratis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right/Sidebar Column: Payment Action & Instructions (Sticky) */}
          <aside className="ko-order-right-col">
            {/* Payment Action Box */}
            <div className="ko-order-action-card">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/60">
                <div className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fc820c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <h3 className="ko-card-title text-base">Instruksi Pembayaran</h3>
                </div>
                {isPaid ? (
                  <span className="ko-pill-paid-status">Lunas</span>
                ) : (
                  <span className="ko-pill-unpaid-status">Belum Lunas</span>
                )}
              </div>

              {/* Total Box */}
              <div className="ko-order-payment-amount-box">
                <span className="text-xs text-on-surface-variant block uppercase font-medium">Total Tagihan Yang Harus Dibayar</span>
                <div className="ko-order-total-big-num mt-1">
                  {formatRupiah(order.total || 121500)}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary font-medium">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Batas bayar: Hari ini pukul {deadlineTime}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                {/* Primary Button: QRIS */}
                <button
                  type="button"
                  className="ko-btn-pay-qris"
                  onClick={() => setShowQrisModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>{isPaid ? 'Lihat Bukti QRIS' : 'Bayar Sekarang (QRIS / Transfer)'}</span>
                </button>

                {/* Secondary Button: WhatsApp Toko Confirmation */}
                <a
                  className="ko-btn-wa-order"
                  href={waLink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Kirim Ringkasan ke WhatsApp Toko</span>
                </a>

                {/* Tunai di Kasir Note */}
                <div className="ko-tunai-note-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d631b" strokeWidth="2" className="shrink-0 mt-0.5">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <p className="text-xs text-on-surface-variant m-0 leading-snug">
                    <strong className="text-on-surface">Pilihan Bayar di Toko:</strong> Anda juga dapat membayar langsung secara tunai atau debit di kasir saat mengambil barang belanjaan.
                  </p>
                </div>

                {/* Link Kembali ke Katalog */}
                <Link to="/katalog" className="ko-link-back-catalog">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Kembali Belanja di Katalog</span>
                </Link>
              </div>

              {/* Separator */}
              <div className="ko-order-action-divider" />

              {/* Trust Badges */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Jaminan Toko Abah</span>
                <div className="ko-trust-item">
                  <div className="ko-trust-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">Timbangan Pas 100% &amp; Tersegel</span>
                    <span className="text-xs text-on-surface-variant">Ditimbang teliti dengan segel kemasan rapat</span>
                  </div>
                </div>

                <div className="ko-trust-item">
                  <div className="ko-trust-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">Stok Dijamin Tersedia</span>
                    <span className="text-xs text-on-surface-variant">Beras, minyak &amp; gula langsung dikunci</span>
                  </div>
                </div>

                <div className="ko-trust-item">
                  <div className="ko-trust-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">Butuh Bantuan Cepat?</span>
                    <span className="text-xs text-on-surface-variant">Hubungi Abah via WA di 0812-8899-7700</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Banner: Download Receipt / Print */}
            <div className="ko-order-print-card">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#707a6c" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div>
                  <span className="font-bold text-xs text-on-surface block">Cetak Nota Pemesanan</span>
                  <span className="text-xs text-on-surface-variant">Format PDF ringkas untuk pembukuan</span>
                </div>
              </div>
              <button
                type="button"
                className="ko-btn-print"
                onClick={() => window.print()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Cetak</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* QRIS Modal Component */}
      <QrisModal
        isOpen={showQrisModal}
        onClose={() => setShowQrisModal(false)}
        total={order.total || 121500}
        orderId={order.nomor_pesanan}
        onPaymentSuccess={() => {
          setIsPaid(true);
        }}
      />
    </div>
  );
}
