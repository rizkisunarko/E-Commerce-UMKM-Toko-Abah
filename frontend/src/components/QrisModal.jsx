import { useEffect, useState } from 'react';
import { formatRupiah } from '../utils/format';

export default function QrisModal({ isOpen, onClose, total = 121500, orderId = 'TA-20261112-001', onPaymentSuccess }) {
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59);
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'success'
  const [toastMsg, setToastMsg] = useState('');

  // Countdown timer 15 menit
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset status saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setToastMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  function handleCheckPayment() {
    setStatus('checking');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1200);
    }, 1500);
  }

  function handleDownloadQr() {
    setToastMsg('Gambar QRIS berhasil diunduh ke perangkat Anda.');
    setTimeout(() => setToastMsg(''), 3000);
  }

  return (
    <div
      className="ko-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-qris-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== 'checking') onClose();
      }}
    >
      <div className="ko-qris-modal-card">
        {/* Toast Notifikasi Unduh */}
        {toastMsg && (
          <div className="ko-modal-toast" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="ko-qris-header">
          <div className="ko-qris-title-group">
            <div className="ko-qris-badge-box">
              <span className="ko-qris-brand-text">QRIS</span>
            </div>
            <div>
              <h3 id="modal-qris-title" className="ko-qris-title">
                Pembayaran QRIS Instan
              </h3>
              <p className="ko-qris-sub">Toko Abah Sembako - Telang Kamal</p>
            </div>
          </div>
          <button
            type="button"
            className="ko-qris-close-btn"
            onClick={onClose}
            aria-label="Tutup Modal"
            disabled={status === 'checking'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="ko-qris-body">
          {/* Total Tagihan & Timer Banner */}
          <div className="ko-qris-amount-card">
            <span className="ko-qris-amount-label">Total Tagihan</span>
            <div className="ko-qris-amount-val">{formatRupiah(total)}</div>
            <div className="ko-qris-meta-row">
              <span className="ko-qris-order-no">
                No. Pesanan: <strong>{orderId}</strong>
              </span>
              <div className="ko-qris-timer-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ko-spin-slow">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{timeFormatted}</span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="ko-qris-qr-box">
            <div className="ko-qris-svg-wrapper">
              <svg className="ko-qris-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR Code Toko Abah">
                {/* QR Positioning Corner Marks */}
                {/* Top Left */}
                <rect fill="black" height="48" rx="4" width="48" x="10" y="10" />
                <rect fill="white" height="36" rx="2" width="36" x="16" y="16" />
                <rect fill="black" height="24" rx="2" width="24" x="22" y="22" />
                {/* Top Right */}
                <rect fill="black" height="48" rx="4" width="48" x="142" y="10" />
                <rect fill="white" height="36" rx="2" width="36" x="148" y="16" />
                <rect fill="black" height="24" rx="2" width="24" x="154" y="22" />
                {/* Bottom Left */}
                <rect fill="black" height="48" rx="4" width="48" x="10" y="142" />
                <rect fill="white" height="36" rx="2" width="36" x="16" y="148" />
                <rect fill="black" height="24" rx="2" width="24" x="22" y="154" />
                {/* Timing Patterns */}
                <rect fill="black" height="6" width="6" x="64" y="30" />
                <rect fill="black" height="6" width="6" x="76" y="30" />
                <rect fill="black" height="6" width="6" x="88" y="30" />
                <rect fill="black" height="6" width="6" x="100" y="30" />
                <rect fill="black" height="6" width="6" x="112" y="30" />
                <rect fill="black" height="6" width="6" x="124" y="30" />
                <rect fill="black" height="6" width="6" x="30" y="64" />
                <rect fill="black" height="6" width="6" x="30" y="76" />
                <rect fill="black" height="6" width="6" x="30" y="88" />
                <rect fill="black" height="6" width="6" x="30" y="100" />
                <rect fill="black" height="6" width="6" x="30" y="112" />
                <rect fill="black" height="6" width="6" x="30" y="124" />
                {/* QR Data Blocks */}
                <rect fill="black" height="8" width="8" x="64" y="12" />
                <rect fill="black" height="8" width="12" x="80" y="16" />
                <rect fill="black" height="12" width="8" x="102" y="12" />
                <rect fill="black" height="8" width="14" x="120" y="14" />
                <rect fill="black" height="8" width="10" x="12" y="64" />
                <rect fill="black" height="12" width="8" x="14" y="82" />
                <rect fill="black" height="8" width="12" x="12" y="104" />
                <rect fill="black" height="12" width="8" x="14" y="122" />
                <rect fill="black" height="10" width="10" x="64" y="64" />
                <rect fill="black" height="8" width="12" x="80" y="64" />
                <rect fill="black" height="14" width="8" x="100" y="60" />
                <rect fill="black" height="8" width="14" x="118" y="66" />
                <rect fill="black" height="12" width="8" x="140" y="64" />
                <rect fill="black" height="10" width="14" x="156" y="62" />
                <rect fill="black" height="8" width="10" x="178" y="66" />
                <rect fill="black" height="12" width="8" x="66" y="82" />
                <rect fill="black" height="10" width="10" x="124" y="82" />
                <rect fill="black" height="8" width="14" x="142" y="84" />
                <rect fill="black" height="12" width="12" x="164" y="80" />
                <rect fill="black" height="10" width="8" x="182" y="84" />
                <rect fill="black" height="10" width="12" x="62" y="102" />
                <rect fill="black" height="14" width="10" x="122" y="100" />
                <rect fill="black" height="8" width="12" x="140" y="104" />
                <rect fill="black" height="10" width="16" x="160" y="102" />
                <rect fill="black" height="8" width="8" x="182" y="106" />
                <rect fill="black" height="10" width="12" x="64" y="120" />
                <rect fill="black" height="12" width="8" x="84" y="124" />
                <rect fill="black" height="10" width="14" x="100" y="120" />
                <rect fill="black" height="10" width="12" x="122" y="122" />
                <rect fill="black" height="14" width="10" x="144" y="120" />
                <rect fill="black" height="10" width="14" x="162" y="122" />
                <rect fill="black" height="12" width="10" x="180" y="120" />
                <rect fill="black" height="14" width="10" x="64" y="140" />
                <rect fill="black" height="10" width="14" x="82" y="144" />
                <rect fill="black" height="12" width="12" x="104" y="140" />
                <rect fill="black" height="14" width="10" x="124" y="142" />
                <rect fill="black" height="10" width="14" x="142" y="140" />
                <rect fill="black" height="12" width="12" x="164" y="144" />
                <rect fill="black" height="12" width="8" x="182" y="140" />
                <rect fill="black" height="10" width="12" x="66" y="162" />
                <rect fill="black" height="12" width="10" x="86" y="160" />
                <rect fill="black" height="10" width="14" x="102" y="164" />
                <rect fill="black" height="12" width="12" x="122" y="160" />
                <rect fill="black" height="10" width="10" x="140" y="164" />
                <rect fill="black" height="14" width="14" x="158" y="160" />
                <rect fill="black" height="10" width="12" x="178" y="162" />
                <rect fill="black" height="8" width="14" x="64" y="180" />
                <rect fill="black" height="8" width="10" x="88" y="182" />
                <rect fill="black" height="10" width="12" x="106" y="180" />
                <rect fill="black" height="8" width="14" x="126" y="182" />
                <rect fill="black" height="10" width="12" x="148" y="180" />
                <rect fill="black" height="8" width="10" x="168" y="182" />
                <rect fill="black" height="10" width="6" x="184" y="180" />
                {/* Center Badge for QRIS Emblem */}
                <rect fill="white" height="50" rx="6" stroke="#ba1a1a" strokeWidth="2" width="50" x="75" y="75" />
                <text fill="#ba1a1a" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="900" textAnchor="middle" x="100" y="97">
                  QRIS
                </text>
                <text fill="#121d26" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" textAnchor="middle" x="100" y="112">
                  NASIONAL
                </text>
              </svg>
            </div>
            <div className="ko-qris-id-text">
              <span className="ko-qris-nmid">NMID: ID1020261112001</span>
              <span className="ko-qris-an">A/N: TOKO ABAH SEMBAKO</span>
            </div>
          </div>

          {/* Instruksi & Supported Wallets */}
          <div className="ko-qris-instructions">
            <p className="ko-qris-instruction-text">
              Buka aplikasi <strong>BCA Mobile, Livin', GoPay, OVO, Dana, ShopeePay</strong>, atau m-Banking Anda, lalu scan QR di atas.
            </p>
            <div className="ko-qris-badges-row">
              <span className="ko-qris-bank-pill">BCA</span>
              <span className="ko-qris-bank-pill">Mandiri</span>
              <span className="ko-qris-bank-pill">BRI</span>
              <span className="ko-qris-bank-pill">BNI</span>
              <span className="ko-qris-bank-pill brand-gopay">GoPay</span>
              <span className="ko-qris-bank-pill brand-shopee">ShopeePay</span>
              <span className="ko-qris-bank-pill brand-dana">DANA</span>
              <span className="ko-qris-bank-pill brand-ovo">OVO</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ko-qris-actions">
            <button
              type="button"
              className={`ko-qris-primary-btn ${status}`}
              onClick={handleCheckPayment}
              disabled={status !== 'idle'}
            >
              {status === 'checking' && (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ko-spin">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                  <span>Memeriksa Status...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Pembayaran Diterima!</span>
                </>
              )}
              {status === 'idle' && (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Saya Sudah Bayar</span>
                </>
              )}
            </button>

            <div className="ko-qris-sub-actions">
              <button
                type="button"
                className="ko-qris-secondary-btn"
                onClick={handleDownloadQr}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Unduh QR</span>
              </button>
              <button
                type="button"
                className="ko-qris-tertiary-btn"
                onClick={onClose}
              >
                Batal &amp; Bayar di Kasir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

