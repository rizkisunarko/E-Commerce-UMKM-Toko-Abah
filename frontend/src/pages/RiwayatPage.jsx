import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/transactionService';
import { formatDateWib as formatDate, formatRupiah, formatTimeWib } from '../utils/format';
import './RiwayatPage.css';

const DATE_RANGE_ERROR = 'Tanggal akhir tidak boleh sebelum tanggal awal';

// Tanggal hari ini menurut WIB (UTC+7) dalam bentuk YYYY-MM-DD
const todayWib = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

const daysAgoWib = (d) => {
  const t = new Date(Date.now() + 7 * 3600 * 1000);
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

const formatTime = (iso) => formatTimeWib(iso).replace(/\s*WIB$/, '');

function formatTransactionCode(t) {
  if (!t) return '-';
  if (t.jenis_transaksi === 'online' && t.kode_transaksi) {
    return t.kode_transaksi;
  }
  return `#TRX-1024-0${t.id < 10 ? `0${t.id}` : t.id}`;
}

function formatMethodLabel(metode) {
  if (metode === 'qris') return 'QRIS';
  if (metode === 'cod') return 'COD';
  if (metode === 'debit') return 'Midtrans / Debit';
  return 'Tunai';
}

function MethodBadge({ metode }) {
  if (metode === 'qris' || metode === 'debit') {
    return (
      <span className="riwayat-badge-qris">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" />
        </svg>
        {formatMethodLabel(metode)}
      </span>
    );
  }
  return (
    <span className="riwayat-badge-tunai">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
      {formatMethodLabel(metode)}
    </span>
  );
}

export default function RiwayatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter rentang tanggal: input (belum diterapkan) dan applied (sudah diterapkan)
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [applied, setApplied] = useState({ dari: '', sampai: '' });
  const [filterError, setFilterError] = useState('');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rekap harian
  const [rekapDate, setRekapDate] = useState(todayWib());
  const [rekap, setRekap] = useState(null);
  const [rekapError, setRekapError] = useState('');

  // Detail transaksi
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2400);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    transactionService
      .list(applied)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data || []);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [applied]);

  useEffect(() => {
    if (!rekapDate) return undefined;
    let cancelled = false;
    transactionService
      .rekap(rekapDate)
      .then((res) => {
        if (cancelled) return;
        setRekap(res.data);
        setRekapError('');
      })
      .catch((err) => !cancelled && setRekapError(err.message));
    return () => {
      cancelled = true;
    };
  }, [rekapDate]);

  function applyFilter() {
    if (dari && sampai && dari > sampai) {
      setFilterError(DATE_RANGE_ERROR);
      return;
    }
    setFilterError('');
    setApplied({ dari, sampai });
  }

  function resetFilter() {
    setDari('');
    setSampai('');
    setFilterError('');
    setApplied({ dari: '', sampai: '' });
  }

  function handlePreset(type) {
    const today = todayWib();
    if (type === 'today') {
      setDari(today);
      setSampai(today);
      setFilterError('');
      setApplied({ dari: today, sampai: today });
    } else if (type === 'yesterday') {
      const yesterday = daysAgoWib(1);
      setDari(yesterday);
      setSampai(yesterday);
      setFilterError('');
      setApplied({ dari: yesterday, sampai: yesterday });
    } else if (type === '7days') {
      const sevenDays = daysAgoWib(6);
      setDari(sevenDays);
      setSampai(today);
      setFilterError('');
      setApplied({ dari: sevenDays, sampai: today });
    }
  }

  function openDetail(id) {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    setDetailOpen(true);
    transactionService
      .get(id)
      .then((res) => setDetail(res.data))
      .catch((err) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  }

  function closeDetail() {
    setDetailOpen(false);
  }

  const filtered = Boolean(applied.dari || applied.sampai);

  const mutasiTotals = rows.reduce(
    (acc, t) => {
      const amount = Number(t.total || 0);
      const method = String(t.metode_bayar || '').toLowerCase();
      if (method === 'qris') acc.qris += amount;
      else if (method === 'debit' || method === 'payment_gateway') acc.debit += amount;
      else acc.tunai += amount;
      acc.total += amount;
      return acc;
    },
    { tunai: 0, qris: 0, debit: 0, total: 0 },
  );

  const periodeLabel = applied.dari && applied.sampai
    ? (applied.dari === applied.sampai ? formatDate(`${applied.dari}T00:00:00+07:00`) : `${formatDate(`${applied.dari}T00:00:00+07:00`)} s/d ${formatDate(`${applied.sampai}T00:00:00+07:00`)}`)
    : applied.dari
      ? `Mulai ${formatDate(`${applied.dari}T00:00:00+07:00`)}`
      : applied.sampai
        ? `Sampai ${formatDate(`${applied.sampai}T00:00:00+07:00`)}`
        : 'Semua Tanggal (Terbaru)';

  function handlePrintMutasi() {
    const prevTitle = document.title;
    const dateTag = applied.dari || todayWib();
    document.title = `Mutasi-Riwayat-Transaksi-Toko-Abah-${dateTag}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 300);
  }

  return (
    <div className="riwayat-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="riwayat-toast-banner" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="riwayat-page-header">
        <div className="riwayat-header-info">
          <div className="riwayat-header-eyebrow">
            <span className="eyebrow-text">Rekap Kasir &amp; Laporan</span>
            <span className="eyebrow-dot">●</span>
            <span className="eyebrow-sub">Update Otomatis</span>
          </div>
          <h1 className="riwayat-heading">Riwayat Transaksi</h1>
          <p className="riwayat-subheading">Catatan transaksi penjualan dan rekap kasir Toko Abah</p>
        </div>

        <button
          type="button"
          className="btn-riwayat-print-pdf"
          onClick={handlePrintMutasi}
          disabled={loading}
          title="Cetak atau simpan mutasi riwayat transaksi sebagai PDF"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Cetak PDF Mutasi</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="riwayat-filter-card">
        <div className="riwayat-filter-main-row">
          <div className="riwayat-filter-left-col">
            <div className="riwayat-filter-label-group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="filter-title-label">Rentang Tanggal:</span>
            </div>

            {/* Date Inputs */}
            <div className="riwayat-date-inputs-group">
              <div className="riwayat-date-field">
                <label htmlFor="filter-dari" className="date-field-label">Dari</label>
                <div className="date-input-wrapper">
                  <svg className="date-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    id="filter-dari"
                    type="date"
                    className="riwayat-date-input"
                    value={dari}
                    onChange={(e) => setDari(e.target.value)}
                  />
                </div>
              </div>

              <span className="riwayat-date-separator">s/d</span>

              <div className="riwayat-date-field">
                <label htmlFor="filter-sampai" className="date-field-label">Sampai</label>
                <div className="date-input-wrapper">
                  <svg className="date-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    id="filter-sampai"
                    type="date"
                    className="riwayat-date-input"
                    value={sampai}
                    onChange={(e) => setSampai(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="riwayat-filter-actions">
            <button
              type="button"
              className="btn-riwayat-reset"
              onClick={resetFilter}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="btn-riwayat-apply"
              onClick={applyFilter}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Terapkan</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Presets */}
        <div className="riwayat-quick-presets-row">
          <span className="quick-presets-label">Filter Cepat:</span>
          <button
            type="button"
            className={`btn-preset-pill${applied.dari === todayWib() && applied.sampai === todayWib() ? ' active' : ''}`}
            onClick={() => handlePreset('today')}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className={`btn-preset-pill${applied.dari === daysAgoWib(1) && applied.sampai === daysAgoWib(1) ? ' active' : ''}`}
            onClick={() => handlePreset('yesterday')}
          >
            Kemarin
          </button>
          <button
            type="button"
            className={`btn-preset-pill${applied.dari === daysAgoWib(6) && applied.sampai === todayWib() ? ' active' : ''}`}
            onClick={() => handlePreset('7days')}
          >
            7 Hari Terakhir
          </button>
        </div>

        {filterError && (
          <div className="riwayat-filter-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{filterError}</span>
          </div>
        )}
      </div>

      {error && <div className="alert-error" role="alert">{error}</div>}

      {/* Rekap Harian Section */}
      <section className="riwayat-rekap-section">
        <div className="riwayat-rekap-header-row">
          <div className="rekap-title-group">
            <h2 className="rekap-heading">Rekap Harian</h2>
            <div className="rekap-date-picker-wrapper">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                id="rekap-tanggal"
                type="date"
                className="rekap-date-picker-input"
                value={rekapDate}
                onChange={(e) => setRekapDate(e.target.value)}
              />
            </div>
          </div>
          <span className="rekap-sync-shift-tag">Sinkronisasi Shift: WIB</span>
        </div>

        {rekapError && <div className="alert-error" role="alert">{rekapError}</div>}

        {rekap && (
          <div className="riwayat-kpi-grid">
            {/* Card 1: Tunai */}
            <div className="riwayat-kpi-card">
              <div className="kpi-card-top">
                <div className="kpi-card-text">
                  <span className="kpi-card-label">Tunai</span>
                  <span className="kpi-card-val tabular-nums">{formatRupiah(rekap.tunai)}</span>
                </div>
                <div className="kpi-card-icon-box green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>
              <div className="kpi-card-footer">
                <span className="kpi-count-badge green">
                  {rekap.jumlah_transaksi_tunai ?? rekap.jumlah_transaksi ?? 0}
                </span>
                <span className="kpi-footer-text">transaksi uang tunai</span>
              </div>
            </div>

            {/* Card 2: QRIS */}
            <div className="riwayat-kpi-card">
              <div className="kpi-card-top">
                <div className="kpi-card-text">
                  <span className="kpi-card-label">QRIS</span>
                  <span className="kpi-card-val tabular-nums">{formatRupiah(rekap.qris)}</span>
                </div>
                <div className="kpi-card-icon-box blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="3" height="3" />
                  </svg>
                </div>
              </div>
              <div className="kpi-card-footer">
                <span className="kpi-count-badge blue">
                  {rekap.jumlah_transaksi_qris ?? rekap.jumlah_transaksi ?? 0}
                </span>
                <span className="kpi-footer-text">transaksi e-wallet / QRIS</span>
              </div>
            </div>

            {/* Card 3: Total Omzet */}
            <div className="riwayat-kpi-card total-highlight">
              <div className="kpi-card-top">
                <div className="kpi-card-text">
                  <div className="kpi-total-title-row">
                    <span className="kpi-card-label bold">Total</span>
                    <span className="kpi-today-tag">Hari Ini</span>
                  </div>
                  <span className="kpi-card-val primary-val tabular-nums">{formatRupiah(rekap.total)}</span>
                </div>
                <div className="kpi-card-icon-box solid-green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="16" y1="14" x2="16" y2="18" />
                    <line x1="8" y1="10" x2="8.01" y2="10" />
                    <line x1="12" y1="10" x2="12.01" y2="10" />
                    <line x1="16" y1="10" x2="16.01" y2="10" />
                    <line x1="8" y1="14" x2="8.01" y2="14" />
                    <line x1="12" y1="14" x2="12.01" y2="14" />
                    <line x1="8" y1="18" x2="8.01" y2="18" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
              </div>
              <div className="kpi-card-footer">
                <span className="kpi-count-badge green">{rekap.jumlah_transaksi || 0}</span>
                <span className="kpi-footer-text bold">Total {rekap.jumlah_transaksi || 0} transaksi sukses</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Transactions Table Section */}
      <section className="riwayat-table-card">
        <div className="riwayat-table-header-toolbar">
          <div className="table-header-left">
            <h2 className="table-heading-title">Daftar Transaksi</h2>
            <span className="table-count-tag">
              Menampilkan {rows.length} transaksi terbaru
            </span>
          </div>
        </div>

        {loading ? (
          <div className="riwayat-loading-box">
            <p className="muted">Memuat...</p>
          </div>
        ) : rows.length === 0 ? (
          /* STATE KOSONG PERSIS SEPERTI STITCH */
          <div className="riwayat-empty-state-view">
            <div className="empty-state-icon-circle-wrapper">
              <div className="empty-state-pulse-backdrop"></div>
              <div className="empty-state-icon-box">
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                  <path d="M16 12C16 9.79086 17.7909 8 20 8H44C46.2091 8 48 9.79086 48 12V52L40 48L32 52L24 48L16 52V12Z" fill="#15803d" fillOpacity="0.12" />
                  <path d="M16 12C16 9.79086 17.7909 8 20 8H44C46.2091 8 48 9.79086 48 12V54L40 50L32 54L24 50L16 54V12Z" stroke="#15803d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  <path d="M24 18H40" stroke="#15803d" strokeLinecap="round" strokeWidth="2.5" />
                  <path d="M24 26H40" stroke="#15803d" strokeLinecap="round" strokeWidth="2.5" />
                  <path d="M24 34H34" stroke="#15803d" strokeLinecap="round" strokeWidth="2.5" />
                  <circle cx="44" cy="42" r="10" fill="#FC820C" />
                  <path d="M44 38V42M44 46H44.01" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                </svg>
              </div>
            </div>

            <div className="empty-state-badge">
              <span>Data Kosong</span>
            </div>

            <h3 className="empty-state-title">
              {filtered ? 'Tidak ada transaksi pada rentang tanggal ini' : 'Belum ada transaksi'}
            </h3>

            <p className="empty-state-desc">
              Silakan ubah rentang tanggal filter <b>"Dari"</b> dan <b>"Sampai"</b> di atas atau tekan tombol Reset untuk melihat transaksi terbaru hari ini.
            </p>

            <div className="empty-state-buttons-row">
              <button
                type="button"
                className="btn-empty-reset"
                onClick={resetFilter}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset Filter Tanggal</span>
              </button>

              <button
                type="button"
                className="btn-empty-kasir"
                onClick={() => navigate('/kasir')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Buka Menu Kasir</span>
              </button>
            </div>

            <div className="empty-state-footer-badges">
              <div className="empty-footer-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Database Terkoneksi</span>
              </div>
              <div className="empty-footer-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
                <span>Auto-Backup Aktif</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="riwayat-table-wrap">
            <table className="riwayat-table">
              <thead>
                <tr>
                  <th className="th-trx-id">ID Transaksi</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Metode Bayar</th>
                  <th className="th-total">Total Belanja</th>
                  <th className="th-action">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, idx) => (
                  <tr key={t.id} className="riwayat-tr">
                    <td className="td-trx-id">
                      <div className="trx-id-wrapper">
                        <span className="trx-id-code">{formatTransactionCode(t)}</span>
                        <span className={`trx-source-pill ${t.jenis_transaksi === 'online' ? 'online' : 'kasir'}`}>
                          {t.jenis_transaksi === 'online' ? 'Online' : 'Kasir'}
                        </span>
                        {idx === 0 && <span className="trx-new-dot" title="Transaksi Baru" />}
                      </div>
                    </td>
                    <td className="td-tanggal">{formatDate(t.tanggal)}</td>
                    <td className="td-waktu">{formatTime(t.tanggal)} WIB</td>
                    <td className="td-metode">
                      <MethodBadge metode={t.metode_bayar} />
                    </td>
                    <td className="td-total tabular-nums">
                      {formatRupiah(t.total)}
                    </td>
                    <td className="td-action">
                      <button
                        type="button"
                        className="btn-riwayat-detail"
                        onClick={() => openDetail(t.id)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail Transaksi Modal Dialog Sesuai Stitch */}
      {detailOpen && (
        <div className="riwayat-modal-backdrop" onClick={closeDetail}>
          <div
            className="riwayat-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-detail-title"
          >
            {/* Modal Header */}
            <div className="riwayat-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="modal-title-row">
                    <h2 id="modal-detail-title" className="modal-heading">Detail Transaksi</h2>
                    {detail && (
                      <span className="modal-trx-badge">
                        {formatTransactionCode(detail)}
                      </span>
                    )}
                  </div>
                  <span className="modal-subheading">Struk belanja resmi Toko Abah Sembako</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-modal-close"
                onClick={closeDetail}
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="riwayat-modal-body">
              {detailLoading && <p className="muted">Memuat...</p>}
              {detailError && <div className="alert-error" role="alert">{detailError}</div>}

              {detail && (
                <>
                  {/* Metadata Strip */}
                  <div className="riwayat-metadata-strip">
                    <div className="meta-strip-col">
                      <span className="meta-lbl">Waktu &amp; Tanggal</span>
                      <span className="meta-val-bold">{formatDate(detail.tanggal)}</span>
                      <span className="meta-sub">{formatTime(detail.tanggal)} WIB</span>
                    </div>

                    <div className="meta-strip-col">
                      <span className="meta-lbl">Kasir Bertugas</span>
                      <span className="meta-val-bold">{detail.kasir || user?.nama || '-'}</span>
                      <span className="meta-sub">Kasir</span>
                    </div>

                    <div className="meta-strip-col">
                      <span className="meta-lbl">Status Transaksi</span>
                      <span className="meta-status-pill green">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Selesai / Lunas
                      </span>
                    </div>

                    <div className="meta-strip-col">
                      <span className="meta-lbl">Metode Bayar</span>
                      <MethodBadge metode={detail.metode_bayar} />
                    </div>
                  </div>

                  {/* Items Header */}
                  <div className="modal-items-section-header">
                    <span className="modal-items-title">Daftar Barang Belanja</span>
                    <span className="modal-items-count-tag">
                      {detail.items?.length || 0} Item ({detail.items?.reduce((s, it) => s + (it.jumlah || 1), 0) || 0} Pcs)
                    </span>
                  </div>

                  {/* Items Table */}
                  <div className="modal-items-table-box">
                    <table className="modal-items-table">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th className="text-center">Jumlah</th>
                          <th className="text-right">Harga</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items?.map((it, idx) => (
                          <tr key={it.product_id || idx}>
                            <td className="item-name-cell">
                              <span className="item-product-name">{it.nama}</span>
                            </td>
                            <td className="text-center font-medium">{it.jumlah}</td>
                            <td className="text-right tabular-nums">{formatRupiah(it.harga)}</td>
                            <td className="text-right font-bold tabular-nums">{formatRupiah(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Grand Total Box */}
                  <div className="modal-grand-total-box">
                    <div className="grand-total-text-col">
                      <span className="grand-total-title">Total Tagihan</span>
                      <span className="grand-total-lunas-sub">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Lunas via {formatMethodLabel(detail.metode_bayar)} Toko Abah
                      </span>
                    </div>
                    <span className="grand-total-value tabular-nums">{formatRupiah(detail.total)}</span>
                  </div>

                  <div className="modal-micro-note">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>No. Ref Acuan: <b>TRX-20241024-00{detail.id}</b> • Tanpa biaya admin</span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="riwayat-modal-footer">
              <button
                type="button"
                className="btn-modal-back-close"
                onClick={closeDetail}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dokumen Cetak PDF Mutasi Riwayat Transaksi */}
      <div className="mutasi-print-document" aria-hidden="true">
        <div className="rekap-print-header">
          <h2 className="rekap-print-main-title">MUTASI RIWAYAT TRANSAKSI</h2>
          <p className="rekap-print-store-name">TOKO ABAH — Grosir &amp; Sembako Segar</p>
          <p className="rekap-print-store-address">
            Jalan Raya Telang-Kamal • WhatsApp CS: 0857-0835-0575
          </p>
        </div>
        <div className="rekap-print-divider" />

        <div className="rekap-print-info-grid">
          <div>
            <div className="info-row">
              <span className="info-lbl">Periode Mutasi</span>
              <span className="info-sep">:</span>
              <span className="info-val"><b>{periodeLabel}</b></span>
            </div>
            <div className="info-row">
              <span className="info-lbl">Jumlah Transaksi</span>
              <span className="info-sep">:</span>
              <span className="info-val"><b>{rows.length} transaksi</b></span>
            </div>
          </div>
          <div>
            <div className="info-row">
              <span className="info-lbl">Dicetak Oleh</span>
              <span className="info-sep">:</span>
              <span className="info-val">{user?.nama || user?.username || 'Admin Toko'}</span>
            </div>
            <div className="info-row">
              <span className="info-lbl">Waktu Cetak</span>
              <span className="info-sep">:</span>
              <span className="info-val">
                {formatDate(new Date().toISOString())}, {formatTime(new Date().toISOString())} WIB
              </span>
            </div>
          </div>
        </div>

        <div className="rekap-section-title">Ringkasan Mutasi</div>
        <div className="rekap-saldo-grid">
          <div className="saldo-item">
            <span>Total Tunai / COD</span>
            <strong>{formatRupiah(mutasiTotals.tunai)}</strong>
          </div>
          <div className="saldo-item">
            <span>Total QRIS</span>
            <strong>{formatRupiah(mutasiTotals.qris)}</strong>
          </div>
          <div className="saldo-item">
            <span>Total Midtrans / Debit</span>
            <strong>{formatRupiah(mutasiTotals.debit)}</strong>
          </div>
          <div className="saldo-item highlight">
            <span>Grand Total Mutasi</span>
            <strong>{formatRupiah(mutasiTotals.total)}</strong>
          </div>
        </div>

        <div className="rekap-section-title">Rincian Mutasi Transaksi</div>
        <table className="rekap-print-table">
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>No</th>
              <th>ID Transaksi</th>
              <th>Tanggal</th>
              <th>Waktu</th>
              <th>Metode Bayar</th>
              <th style={{ textAlign: 'right' }}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '14px' }}>
                  Tidak ada transaksi pada periode ini.
                </td>
              </tr>
            ) : (
              rows.map((t, idx) => (
                <tr key={`print-${t.id}`}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <b>{formatTransactionCode(t)}</b>{' '}
                    <span style={{ fontSize: '8pt', color: '#475569' }}>
                      ({t.jenis_transaksi === 'online' ? 'Online' : 'Kasir'})
                    </span>
                  </td>
                  <td>{formatDate(t.tanggal)}</td>
                  <td>{formatTime(t.tanggal)} WIB</td>
                  <td style={{ textTransform: 'uppercase' }}>
                    {formatMethodLabel(t.metode_bayar)}
                  </td>
                  <td style={{ textAlign: 'right' }}><b>{formatRupiah(t.total)}</b></td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="rekap-total-row">
                <td colSpan={5} style={{ textAlign: 'right' }}>
                  <b>TOTAL MUTASI ({rows.length} Transaksi)</b>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <b>{formatRupiah(mutasiTotals.total)}</b>
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        <div className="rekap-signatures-wrap">
          <div className="sig-column">
            <p className="sig-title">Dicetak Oleh,</p>
            <div className="sig-space" />
            <p className="sig-person-name">{user?.nama || user?.username || 'Admin Toko'}</p>
            <p className="sig-sub">Staf / Admin Toko Abah</p>
          </div>
          <div className="sig-column">
            <p className="sig-title">Mengetahui,</p>
            <div className="sig-space" />
            <p className="sig-person-name">Pemilik Toko Abah</p>
            <p className="sig-sub">Dokumen Mutasi Resmi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
