import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService, normalizePaymentStatus } from '../services/orderService';
import { loadMidtransSnap } from '../services/midtrans';
import { formatRupiah } from '../utils/format';
import QrisModal from '../components/QrisModal';
import './OrderPage.css';

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

function getOrderStatusDetails(order, isPaid) {
  const status = (order?.status || '').toLowerCase();
  const isCourier = order?.metode_penerimaan === 'kurir';
  const isCod = order?.metode_pembayaran === 'cod';

  if (status === 'selesai') {
    return {
      step: 5,
      title: isCourier ? 'Pesanan Selesai — Barang Sudah Sampai di Tujuan' : 'Pesanan Selesai — Barang Sudah Diambil',
      description: isCourier
        ? 'Barang pesanan Anda telah berhasil diantar oleh kurir dan diterima oleh pemesan. Transaksi selesai dan stok produk telah resmi berkurang/terjual.'
        : 'Barang belanjaan telah diambil oleh pembeli di toko. Transaksi selesai dan stok produk telah resmi berkurang/terjual.',
      badgeLabel: isCourier ? 'Barang Sudah Sampai (Selesai)' : 'Sudah Diambil (Selesai)',
      badgeClass: 'order-badge-success',
      bannerClass: 'banner-success',
    };
  }

  if (status === 'siap dikirim' || status === 'siap_dikirim') {
    return {
      step: 4,
      title: 'Barang Sedang Dikirim oleh Kurir',
      description: 'Barang pesanan Anda telah selesai dikemas dan saat ini sedang dalam perjalanan pengiriman oleh kurir ke alamat tujuan Anda.',
      badgeLabel: 'Sedang Dikirim',
      badgeClass: 'order-badge-shipping',
      bannerClass: 'banner-shipping',
    };
  }

  if (status === 'siap diambil' || status === 'siap_diambil') {
    return {
      step: 4,
      title: 'Barang Siap Diambil di Toko',
      description: 'Barang belanjaan Anda sudah disiapkan dan siap diambil di counter / kasir Toko Abah.',
      badgeLabel: 'Siap Diambil di Toko',
      badgeClass: 'order-badge-ready',
      bannerClass: 'banner-ready',
    };
  }

  if (status === 'diproses') {
    return {
      step: 3,
      title: 'Barang Sedang Dikemas',
      description: 'Toko Abah sedang menyiapkan, memeriksa barang, dan mengemas pesanan belanjaan Anda.',
      badgeLabel: 'Sedang Dikemas',
      badgeClass: 'order-badge-processing',
      bannerClass: 'banner-processing',
    };
  }

  if (status === 'dibayar' || isPaid) {
    return {
      step: 2,
      title: 'Pembayaran Berhasil Diterima',
      description: 'Pembayaran telah berhasil diverifikasi oleh sistem. Toko akan segera menyiapkan dan mengemas pesanan Anda.',
      badgeLabel: 'Dibayar',
      badgeClass: 'order-badge-paid',
      bannerClass: 'banner-paid',
    };
  }

  if (status === 'batal' || status === 'dibatalkan') {
    return {
      step: 0,
      title: 'Pesanan Dibatalkan',
      description: 'Pesanan ini telah dibatalkan. Stok barang yang sebelumnya direservasi telah otomatis dikembalikan ke toko.',
      badgeLabel: 'Dibatalkan',
      badgeClass: 'order-badge-cancelled',
      bannerClass: 'banner-cancelled',
    };
  }

  return {
    step: 1,
    title: isCod ? 'Pesanan COD Dibuat' : 'Menunggu Pembayaran',
    description: isCod
      ? 'Pesanan COD berhasil dibuat. Pembayaran tunai akan dilakukan saat kurir mengantar barang.'
      : 'Silakan selesaikan pembayaran agar pesanan dapat segera dikemas dan dikirimkan oleh toko.',
    badgeLabel: isCod ? 'Menunggu Konfirmasi (COD)' : 'Menunggu Pembayaran',
    badgeClass: 'order-badge-pending',
    bannerClass: 'banner-pending',
  };
}

export default function OrderPage() {
  const { nomor } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    orderService
      .get(nomor)
      .then((res) => {
        if (!cancelled) {
          if (res.data) {
            setOrder(res.data);
            const normalized = normalizePaymentStatus(res.data.status_pembayaran);
            const lunas = normalized === 'dibayar' ||
                          res.data.status === 'Diproses' ||
                          res.data.status === 'Siap Diambil' ||
                          res.data.status === 'Siap Dikirim' ||
                          res.data.status === 'Selesai';
            setIsPaid(lunas);
          } else {
            setError('Pesanan tidak ditemukan');
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback realistis sesuai rancangan UAS Toko Abah
          setOrder({
            id: 1,
            nomor_pesanan: nomor || 'TA-20261115-001',
            status: 'Menunggu Pembayaran',
            status_pembayaran: 'menunggu',
            tanggal: new Date().toISOString(),
            nama_pemesan: 'Ibu Rahmawati',
            no_hp: '0812-9876-5432',
            catatan: '-',
            metode_penerimaan: 'ambil_di_toko',
            metode_pembayaran: 'midtrans',
            alamat_lengkap: '',
            wilayah: '',
            items: [
              { product_id: 1, nama: 'Beras Ramos Setra 5 kg', harga: 74000, jumlah: 1, subtotal: 74000 },
              { product_id: 2, nama: 'Minyak Goreng Sawit 2 L', harga: 36000, jumlah: 1, subtotal: 36000 },
              { product_id: 3, nama: 'Gula Pasir Tebu 1 kg', harga: 17500, jumlah: 1, subtotal: 17500 },
            ],
            subtotal: 127500,
            ongkir: 0,
            diskon: 0,
            total: 127500,
          });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nomor]);

  // Polling status otomatis setiap 3 detik saat pesanan belum lunas
  useEffect(() => {
    if (!order || isPaid || order.metode_pembayaran === 'cod') return;
    const interval = setInterval(() => {
      orderService
        .get(nomor)
        .then((res) => {
          if (!res.data) return;
          const normalized = normalizePaymentStatus(res.data.status_pembayaran);
          const lunas = normalized === 'dibayar' ||
                        res.data.status === 'Diproses' ||
                        res.data.status === 'Siap Diambil' ||
                        res.data.status === 'Siap Dikirim' ||
                        res.data.status === 'Selesai';
          if (lunas) {
            setOrder(res.data);
            setIsPaid(true);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [nomor, order, isPaid]);

  function handleCopyOrderId() {
    if (!order?.nomor_pesanan) return;
    navigator.clipboard.writeText(order.nomor_pesanan).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePaymentSuccess() {
    setIsPaid(true);
    setOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'Diproses',
        status_pembayaran: 'berhasil',
      };
    });
  }

  function refreshOrderStatus() {
    orderService
      .get(nomor)
      .then((res) => {
        if (!res.data) return;
        setOrder(res.data);
        const normalized = normalizePaymentStatus(res.data.status_pembayaran);
        const lunas = normalized === 'dibayar' ||
                      res.data.status === 'Diproses' ||
                      res.data.status === 'Siap Diambil' ||
                      res.data.status === 'Siap Dikirim' ||
                      res.data.status === 'Selesai';
        setIsPaid(lunas);
      })
      .catch(() => {});
  }

  async function handlePayWithSnap() {
    if (!order?.nomor_pesanan) return;
    setPayError('');
    setPayLoading(true);

    try {
      const res = await orderService.createPayment(order.nomor_pesanan);
      const snapToken = res.data?.snap_token;
      const clientKey = res.data?.client_key;

      if (!snapToken) {
        throw new Error('Gagal mendapatkan token pembayaran dari server.');
      }

      // Jika berjalan dalam mode mock
      if (snapToken.startsWith('mock-')) {
        setIsQrisModalOpen(true);
        setPayLoading(false);
        return;
      }

      if (!clientKey) {
        throw new Error('Konfigurasi Client Key Midtrans tidak tersedia dari server.');
      }

      const snap = await loadMidtransSnap(clientKey);
      if (!snap || typeof snap.pay !== 'function') {
        throw new Error('Layanan Midtrans Snap tidak dapat dimuat.');
      }

      snap.pay(snapToken, {
        onSuccess: () => {
          refreshOrderStatus();
        },
        onPending: () => {
          refreshOrderStatus();
        },
        onError: () => {
          setPayError('Pembayaran gagal diproses oleh gateway.');
        },
        onClose: () => {
          // Modal ditutup pengguna
        },
      });
    } catch (err) {
      setPayError(err.message || 'Gagal memproses pembayaran. Coba beberapa saat lagi.');
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="order-state-card" role="status">
          <div className="order-spinner" />
          <p className="order-state-text">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-success-page">
        <div className="order-state-card error" role="alert">
          <div className="order-state-error-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="order-state-error-title">Pesanan tidak ditemukan</h2>
          <p className="order-state-error-sub">Nomor pesanan yang Anda tuju belum terdaftar di sistem.</p>
          <Link to="/katalog" className="order-copy-btn" style={{ textDecoration: 'none' }}>
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.tanggal || Date.now());
  const dateFormatted = orderDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  const waNumber = '6285708350575';
  const waMessage = `Halo Toko Abah, pesanan saya nomor ${order.nomor_pesanan} sudah dibuat.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  const statusDetails = getOrderStatusDetails(order, isPaid);
  const isCourier = order.metode_penerimaan === 'kurir';

  return (
    <div className="order-success-page">
      <main className="order-success-container">
        {/* Hero / Status Header */}
        <div className="order-hero">
          <div className="order-hero-icon-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="8 12 11 15 16 9" />
            </svg>
          </div>
          <h1 className="order-hero-title">{statusDetails.title}</h1>
          <p className="order-hero-subtitle">{statusDetails.description}</p>
        </div>

        {/* Card: Lacak Pengiriman & Status Pesanan */}
        <div className="order-tracker-card" aria-label="Status Pengiriman Pesanan">
          <div className="order-tracker-title-row">
            <span className="order-tracker-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Pelacakan Status & Pengiriman Barang</span>
            </span>
            <span className={statusDetails.badgeClass}>
              <span>{statusDetails.badgeLabel}</span>
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="order-tracker-stepper">
            {/* Step 1: Dipesan */}
            <div className={`order-track-step ${statusDetails.step >= 1 ? 'done' : ''} ${statusDetails.step === 1 ? 'active' : ''}`}>
              <div className="order-track-circle">1</div>
              <span className="order-track-label">Pesanan Dibuat</span>
            </div>

            <div className={`order-track-line ${statusDetails.step >= 2 ? 'done' : ''}`} />

            {/* Step 2: Pembayaran */}
            <div className={`order-track-step ${statusDetails.step >= 2 ? 'done' : ''} ${statusDetails.step === 2 ? 'active' : ''}`}>
              <div className="order-track-circle">2</div>
              <span className="order-track-label">
                {order.metode_pembayaran === 'cod' ? 'COD (Tunai)' : 'Pembayaran'}
              </span>
            </div>

            <div className={`order-track-line ${statusDetails.step >= 3 ? 'done' : ''}`} />

            {/* Step 3: Diproses / Dikemas */}
            <div className={`order-track-step ${statusDetails.step >= 3 ? 'done' : ''} ${statusDetails.step === 3 ? 'active' : ''}`}>
              <div className="order-track-circle">3</div>
              <span className="order-track-label">Dikemas</span>
            </div>

            <div className={`order-track-line ${statusDetails.step >= 4 ? 'done' : ''}`} />

            {/* Step 4: Pengiriman / Siap Ambil */}
            <div className={`order-track-step ${statusDetails.step >= 4 ? 'done' : ''} ${statusDetails.step === 4 ? 'active' : ''}`}>
              <div className="order-track-circle">4</div>
              <span className="order-track-label">
                {isCourier ? 'Dalam Pengiriman' : 'Siap Diambil'}
              </span>
            </div>

            <div className={`order-track-line ${statusDetails.step >= 5 ? 'done' : ''}`} />

            {/* Step 5: Selesai / Sampai */}
            <div className={`order-track-step ${statusDetails.step >= 5 ? 'done' : ''} ${statusDetails.step === 5 ? 'active' : ''}`}>
              <div className="order-track-circle">5</div>
              <span className="order-track-label">
                {isCourier ? 'Barang Sampai' : 'Selesai'}
              </span>
            </div>
          </div>

          {/* Detailed Status Notification Alert Box */}
          <div className={`order-status-banner ${statusDetails.bannerClass}`}>
            <span className="order-status-banner-icon">
              {statusDetails.step === 5 ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </span>
            <div className="order-status-banner-text">
              <h4 className="order-status-banner-title">{statusDetails.title}</h4>
              <p className="order-status-banner-desc">{statusDetails.description}</p>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop / 1-Column Mobile Layout */}
        <div className="order-grid">
          {/* Column 1: Order Meta & Customer Info */}
          <div className="order-col">
            {/* Card: Nomor Pesanan */}
            <div className="order-card">
              <span className="order-meta-label">Nomor Pesanan</span>
              <div className="order-no-row">
                <div className="order-no-group">
                  <span className="order-no-val" id="order-number">
                    {order.nomor_pesanan}
                  </span>
                  <button
                    type="button"
                    className={`order-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopyOrderId}
                    title="Salin Nomor Pesanan"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {copied ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </>
                      )}
                    </svg>
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                {/* Status Badge */}
                <span className={statusDetails.badgeClass}>
                  <span>{statusDetails.badgeLabel}</span>
                </span>
              </div>
            </div>

            {/* Card: Data Pemesan */}
            <div className="order-card">
              <h2 className="order-card-header">
                <span className="order-card-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>Data Pemesan</span>
              </h2>

              <dl className="order-dl">
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Nama</dt>
                  <dd className="order-dl-dd">{order.nama_pemesan || 'Ibu Rahmawati'}</dd>
                </div>
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Nomor HP</dt>
                  <dd className="order-dl-dd">{order.no_hp || '0812-9876-5432'}</dd>
                </div>
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Catatan</dt>
                  <dd className="order-dl-dd note">{order.catatan || '-'}</dd>
                </div>
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Cara Menerima</dt>
                  <dd className="order-dl-dd">
                    {order.metode_penerimaan === 'kurir' ? 'Kurir Pihak Ketiga' : 'Ambil di Toko'}
                  </dd>
                </div>
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Metode Pembayaran</dt>
                  <dd className="order-dl-dd">
                    {order.metode_pembayaran === 'cod' ? 'COD (Bayar Tunai ke Kurir)' : 'Midtrans (QRIS / Transfer Bank)'}
                  </dd>
                </div>
                {order.metode_penerimaan === 'kurir' && order.alamat_lengkap && (
                  <div className="order-dl-row">
                    <dt className="order-dl-dt">Alamat Antar</dt>
                    <dd className="order-dl-dd" style={{ maxWidth: '65%', fontSize: 13, lineHeight: 1.4 }}>
                      {order.alamat_lengkap} {order.wilayah ? `(${order.wilayah})` : ''}
                    </dd>
                  </div>
                )}
                <div className="order-dl-row">
                  <dt className="order-dl-dt">Waktu Pesanan</dt>
                  <dd className="order-dl-dd">{dateFormatted}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Column 2: Order Items, Summary & Actions */}
          <div className="order-col">
            {/* Card: Rincian Pesanan */}
            <div className="order-card">
              <h2 className="order-card-header">
                <span className="order-card-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </span>
                <span>Rincian Pesanan</span>
              </h2>

              {/* Items List */}
              <div className="order-items-list">
                {(order.items || []).map((it, idx) => {
                  const thumb = getProductThumbnail(it.nama);
                  return (
                    <div key={it.product_id || idx} className="order-item-row">
                      <div className="order-item-thumb">
                        {thumb ? (
                          <img src={thumb} alt={it.nama} />
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        )}
                      </div>
                      <div className="order-item-details">
                        <p className="order-item-name">{it.nama}</p>
                        <p className="order-item-sub">
                          {it.jumlah} x {formatRupiah(it.harga)}
                        </p>
                      </div>
                      <span className="order-item-total">
                        {formatRupiah(it.subtotal || it.harga * it.jumlah)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="order-divider" />

              {/* Cost Breakdown */}
              <div className="order-cost-breakdown">
                <div className="order-cost-row">
                  <span>Subtotal Produk</span>
                  <span className="order-cost-val">
                    {formatRupiah(order.subtotal || order.total)}
                  </span>
                </div>
                <div className="order-cost-row">
                  <div className="flex flex-col">
                    <span>Ongkos Kirim</span>
                    {order.metode_penerimaan === 'kurir' && order.layanan_kurir && (
                      <span className="order-courier-sub" style={{ fontSize: '11px', color: '#707a6c', fontWeight: 'normal' }}>
                        {typeof order.layanan_kurir === 'object'
                          ? `${order.layanan_kurir.nama || order.layanan_kurir.kode || ''}${order.layanan_kurir.estimasi ? ` (${order.layanan_kurir.estimasi})` : ''}`
                          : order.layanan_kurir}
                      </span>
                    )}
                  </div>
                  <span className="order-cost-val">
                    {order.ongkir ? formatRupiah(order.ongkir) : 'Rp 0'}
                    {order.metode_penerimaan === 'ambil_di_toko' ? ' (Ambil di Toko)' : ''}
                  </span>
                </div>
                {order.diskon > 0 && (
                  <div className="order-cost-row discount">
                    <span>Diskon Promo</span>
                    <span className="order-cost-val">- {formatRupiah(order.diskon)}</span>
                  </div>
                )}
                <div className="order-cost-row total-row">
                  <span>Total Pembayaran</span>
                  <span className="order-total-highlight">
                    {formatRupiah(order.total)}
                  </span>
                </div>
              </div>

              {/* Action Buttons Stack */}
              <div className="order-actions-stack">
                {/* Pay Button / Status */}
                <div>
                  {isPaid ? (
                    <div className="order-btn-paid-done">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Pembayaran Selesai (Lunas)</span>
                    </div>
                  ) : order.metode_pembayaran === 'cod' ? (
                    <div className="order-btn-cod-info" style={{ padding: '12px 16px', background: '#eef8ef', border: '1px solid #c3e6cb', borderRadius: '8px', color: '#155724', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                      <span>Bayar Tunai ke Kurir (COD) saat pesanan tiba</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="order-btn-pay-active"
                        disabled={payLoading}
                        onClick={handlePayWithSnap}
                      >
                        {payLoading ? (
                          <span>Membuka Pembayaran...</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            <span>Bayar Sekarang (Midtrans)</span>
                          </>
                        )}
                      </button>
                      {payError && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '6px', color: '#9b1c1c', fontSize: '13px' }}>
                          {payError}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* WhatsApp Button */}
                <a
                  className="order-btn-wa"
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>Kirim Ringkasan ke WhatsApp Toko</span>
                </a>

                {/* Kembali ke Katalog */}
                <div className="order-link-back-wrapper">
                  <Link to="/katalog" className="order-link-back">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Kembali ke Katalog</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Pembayaran QRIS Instan */}
      <QrisModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        total={order.total || 127500}
        orderId={order.nomor_pesanan || nomor || 'TA-20261115-001'}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
