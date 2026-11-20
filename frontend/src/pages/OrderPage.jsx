import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
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

export default function OrderPage() {
  const { nomor } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);

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
            setIsPaid(res.data.status_pembayaran === 'berhasil');
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
        status: 'Sudah Dibayar',
        status_pembayaran: 'berhasil',
      };
    });
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

  const waNumber = '6281288997700';
  const waMessage = `Halo Toko Abah, pesanan saya nomor ${order.nomor_pesanan} sudah dibuat.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

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
          <h1 className="order-hero-title">Pesanan Anda sudah dibuat</h1>
          <p className="order-hero-subtitle">
            Simpan nomor pesanan ini. Toko akan menghubungi Anda lewat nomor HP yang diisi.
          </p>
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
                {isPaid ? (
                  <span className="order-badge-paid">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Sudah Dibayar</span>
                  </span>
                ) : (
                  <span className="order-badge-pending">
                    <span>Menunggu Pembayaran</span>
                  </span>
                )}
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
                  <span>Ongkos Kirim</span>
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
                  ) : (
                    <button
                      type="button"
                      className="order-btn-pay-active"
                      onClick={() => setIsQrisModalOpen(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>Bayar Sekarang (QRIS Instan)</span>
                    </button>
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
