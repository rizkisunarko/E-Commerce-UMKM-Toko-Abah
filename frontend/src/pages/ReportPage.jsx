import { useCallback, useEffect, useState } from 'react';
import { reportService } from '../services/reportService';

const todayWib = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const daysAgoWib = (d) => {
  const t = new Date(Date.now() + 7 * 3600 * 1000);
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

function formatPeriodeDisplay(fromIso, toIso, period) {
  if (!fromIso || !toIso) return '';
  const formatDateWib = (iso) =>
    new Date(iso).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const formatTimeWib = (iso) =>
    new Date(iso).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (period === '24h') {
    return `${formatDateWib(fromIso)}, ${formatTimeWib(fromIso)} WIB - ${formatDateWib(toIso)}, ${formatTimeWib(toIso)} WIB`;
  }
  return `${formatDateWib(fromIso)} - ${formatDateWib(toIso)} WIB`;
}

export default function ReportPage() {
  const [periodType, setPeriodType] = useState('7d'); // '24h' | '7d' | 'custom'
  const [customFrom, setCustomFrom] = useState(daysAgoWib(6));
  const [customTo, setCustomTo] = useState(todayWib());
  const [appliedCustom, setAppliedCustom] = useState(null);

  const [products, setProducts] = useState([]);
  const [periodeInfo, setPeriodeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = { period: periodType };
    if (periodType === 'custom') {
      if (!appliedCustom?.from || !appliedCustom?.to) {
        setLoading(false);
        return;
      }
      params.from = appliedCustom.from;
      params.to = appliedCustom.to;
    }

    try {
      const res = await reportService.topProducts(params);
      setProducts(res.data || []);
      setPeriodeInfo(res.periode || null);
    } catch (err) {
      setError(err.message || 'Gagal memuat laporan produk terlaris');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [periodType, appliedCustom]);

  useEffect(() => {
    if (periodType !== 'custom' || appliedCustom) {
      fetchReport();
    }
  }, [fetchReport, periodType, appliedCustom]);

  const handlePeriodChange = (type) => {
    setPeriodType(type);
    setValidationError('');
    setError('');
    if (type === 'custom') {
      // Pasang tanggal awal default jika belum ada
      const from = customFrom || daysAgoWib(6);
      const to = customTo || todayWib();
      setCustomFrom(from);
      setCustomTo(to);
      setAppliedCustom({ from, to });
    } else {
      setAppliedCustom(null);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    setError('');

    // Validasi sebelum memanggil API (L4: Dari setelah Sampai, atau tanggal kosong)
    if (!customFrom || !customTo) {
      setValidationError('Tanggal Dari dan Sampai wajib diisi.');
      return;
    }

    if (customFrom > customTo) {
      setValidationError('Tanggal Dari tidak boleh setelah Sampai.');
      return;
    }

    setAppliedCustom({ from: customFrom, to: customTo });
  };

  return (
    <div className="rep-page">
      <div className="rep-header">
        <div>
          <h1 className="rep-title">Laporan Produk Terlaris</h1>
          <p className="rep-subtitle">
            Ringkasan peringkat produk dengan kuantitas penjualan terbanyak per periode.
          </p>
        </div>
      </div>

      {/* Pilihan Periode */}
      <div className="rep-filter-card">
        <div className="rep-period-tabs">
          <button
            type="button"
            className={`rep-period-btn ${periodType === '24h' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('24h')}
          >
            24 jam terakhir
          </button>
          <button
            type="button"
            className={`rep-period-btn ${periodType === '7d' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('7d')}
          >
            7 hari terakhir
          </button>
          <button
            type="button"
            className={`rep-period-btn ${periodType === 'custom' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('custom')}
          >
            Rentang tanggal
          </button>
        </div>

        {periodType === 'custom' && (
          <form className="rep-custom-form" onSubmit={handleCustomSubmit}>
            <div className="rep-date-inputs">
              <div className="rep-date-group">
                <label htmlFor="rep-from" className="rep-date-label">
                  Dari
                </label>
                <input
                  id="rep-from"
                  type="date"
                  className="rep-date-input"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="rep-date-group">
                <label htmlFor="rep-to" className="rep-date-label">
                  Sampai
                </label>
                <input
                  id="rep-to"
                  type="date"
                  className="rep-date-input"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="rep-btn rep-btn-primary">
              Tampilkan
            </button>
          </form>
        )}

        {validationError && (
          <div className="rep-alert rep-alert-danger" role="alert">
            {validationError}
          </div>
        )}
      </div>

      {/* Tampilan Status: Error, Loading, Kosong, atau Tabel Data */}
      {error ? (
        <div className="rep-state-box rep-error-box">
          <p className="rep-error-msg">{error}</p>
          <button type="button" className="rep-btn rep-btn-primary" onClick={fetchReport}>
            Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="rep-state-box">
          <div className="rep-spinner" />
          <p className="rep-text-muted">Memuat data produk terlaris...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rep-state-box rep-empty-box">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="rep-empty-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <h3 className="rep-empty-title">Tidak ada data penjualan pada periode ini</h3>
          <p className="rep-text-muted">
            Belum terdapat transaksi kasir maupun pesanan online berhasil pada rentang waktu yang
            dipilih.
          </p>
        </div>
      ) : (
        <div className="rep-table-card">
          {/* Teks Periode di Atas Tabel */}
          <div className="rep-period-banner">
            <span className="rep-period-label">Periode Penjualan:</span>
            <strong className="rep-period-val">
              {formatPeriodeDisplay(periodeInfo?.from, periodeInfo?.to, periodType)}
            </strong>
          </div>

          <table className="rep-table">
            <thead>
              <tr>
                <th className="rep-th rep-th-rank">No</th>
                <th className="rep-th">Produk</th>
                <th className="rep-th rep-th-qty">Jumlah Terjual</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={item.product_id || item.nama} className="rep-tr">
                    <td className="rep-td rep-td-rank">
                      <span className={`rep-rank-badge ${rank <= 3 ? `rank-${rank}` : ''}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="rep-td rep-td-name">
                      <strong>{item.nama}</strong>
                    </td>
                    <td className="rep-td rep-td-qty">
                      <span className="rep-qty-val">{item.jumlah_terjual}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
