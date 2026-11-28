import { useCallback, useEffect, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { adminOrderService } from '../services/adminOrderService';
import { formatRupiah } from '../utils/format';

const STATUS_TABS = [
  { key: 'Semua', label: 'Semua' },
  { key: 'Menunggu Pembayaran', label: 'Menunggu Pembayaran' },
  { key: 'Dibayar', label: 'Dibayar' },
  { key: 'Diproses', label: 'Diproses' },
  { key: 'Siap Diambil/Dikirim', label: 'Siap Diambil/Dikirim' },
  { key: 'Selesai', label: 'Selesai' },
  { key: 'Dibatalkan', label: 'Dibatalkan' },
];

const formatWibDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart} WIB`;
};

function formatOrderStatusLabel(order) {
  if (order.status === 'Siap Diambil/Dikirim') {
    return order.metode_penerimaan === 'kurir' ? 'Siap Dikirim' : 'Siap Diambil';
  }
  return order.status;
}

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('menunggu')) return 'ord-badge-menunggu';
  if (s === 'dibayar') return 'ord-badge-dibayar';
  if (s === 'diproses') return 'ord-badge-diproses';
  if (s.includes('siap')) return 'ord-badge-siap';
  if (s === 'selesai') return 'ord-badge-selesai';
  if (s.includes('batal')) return 'ord-badge-batal';
  return 'ord-badge-default';
}

function getPaymentBadgeClass(statusBayar) {
  const s = (statusBayar || '').toLowerCase();
  if (s === 'dibayar' || s === 'lunas') return 'ord-pay-success';
  if (s === 'menunggu') return 'ord-pay-pending';
  if (s === 'gagal' || s === 'batal') return 'ord-pay-danger';
  return 'ord-pay-default';
}

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('Semua');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dariDate, setDariDate] = useState('');
  const [sampaiDate, setSampaiDate] = useState('');
  const [appliedDates, setAppliedDates] = useState({ dari: '', sampai: '' });
  const [dateFilterError, setDateFilterError] = useState('');

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverAlert, setServerAlert] = useState(null);

  // Status update & cancel dialog state
  const [updatingNumber, setUpdatingNumber] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogError, setCancelDialogError] = useState('');

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminOrderService.list({
        status: activeTab === 'Semua' ? undefined : activeTab,
        page,
        limit: 20,
        search: appliedSearch || undefined,
        dari: appliedDates.dari || undefined,
        sampai: appliedDates.sampai || undefined,
      });
      setOrders(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      } else {
        setMeta({ page, limit: 20, total: (res.data || []).length });
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar pesanan');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, appliedSearch, appliedDates]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
    setServerAlert(null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
    setServerAlert(null);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
    setServerAlert(null);
  };

  const handleApplyDateFilter = () => {
    if (dariDate && sampaiDate && dariDate > sampaiDate) {
      setDateFilterError('Tanggal mulai tidak boleh melebihi tanggal akhir.');
      return;
    }
    setDateFilterError('');
    setAppliedDates({ dari: dariDate, sampai: sampaiDate });
    setPage(1);
    setServerAlert(null);
  };

  const handleResetDateFilter = () => {
    setDariDate('');
    setSampaiDate('');
    setDateFilterError('');
    setAppliedDates({ dari: '', sampai: '' });
    setPage(1);
    setServerAlert(null);
  };

  const handleTodayFilter = () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    setDariDate(today);
    setSampaiDate(today);
    setDateFilterError('');
    setAppliedDates({ dari: today, sampai: today });
    setPage(1);
    setServerAlert(null);
  };

  const handleOpenDetail = async (order) => {
    setDetailOpen(true);
    setDetailOrder(order);
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await adminOrderService.getDetail(order.nomor_pesanan);
      if (res.data) {
        setDetailOrder(res.data);
      }
    } catch (err) {
      setDetailError(err.message || 'Gagal memuat detail pesanan.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailError('');
  };

  const handleStatusTransition = async (order, targetStatus) => {
    setUpdatingNumber(order.nomor_pesanan);
    setServerAlert(null);
    setDetailError('');
    try {
      const res = await adminOrderService.updateStatus(order.nomor_pesanan, targetStatus);
      // Sukses: perbarui data tanpa reload halaman
      await fetchOrders();
      if (detailOpen && detailOrder?.nomor_pesanan === order.nomor_pesanan) {
        if (res.data) {
          setDetailOrder(res.data);
        } else {
          const detailRes = await adminOrderService.getDetail(order.nomor_pesanan);
          if (detailRes.data) setDetailOrder(detailRes.data);
        }
      }
      setServerAlert({
        type: 'success',
        message: `Status pesanan ${order.nomor_pesanan} berhasil diubah ke ${targetStatus}.`,
      });
    } catch (err) {
      // 403 / 422: tampilkan pesan galat dari server dan muat ulang daftar
      const msg = err.message || 'Gagal mengubah status pesanan.';
      setServerAlert({
        type: 'danger',
        message: msg,
      });
      if (detailOpen && detailOrder?.nomor_pesanan === order.nomor_pesanan) {
        setDetailError(msg);
      }
      await fetchOrders();
    } finally {
      setUpdatingNumber(null);
    }
  };

  const handleOpenCancelDialog = (order) => {
    setCancelTarget(order);
    setCancelDialogError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const cancelledOrderNumber = cancelTarget.nomor_pesanan;
    setIsCancelling(true);
    setCancelDialogError('');
    try {
      const res = await adminOrderService.updateStatus(cancelledOrderNumber, 'Dibatalkan');
      setCancelTarget(null);
      await fetchOrders();
      if (detailOpen && detailOrder?.nomor_pesanan === cancelledOrderNumber) {
        if (res.data) {
          setDetailOrder(res.data);
        } else {
          const detailRes = await adminOrderService.getDetail(cancelledOrderNumber);
          if (detailRes.data) setDetailOrder(detailRes.data);
        }
      }
      setServerAlert({
        type: 'success',
        message: `Pesanan ${cancelledOrderNumber} berhasil dibatalkan.`,
      });
    } catch (err) {
      setCancelDialogError(err.message || 'Gagal membatalkan pesanan.');
      // Jika terjadi galat dari server (misal 403/422), juga sinkronkan daftar
      fetchOrders();
    } finally {
      setIsCancelling(false);
    }
  };

  // Render tombol aksi per pesanan
  const renderActions = (order, { includeDetail = true } = {}) => {
    const rawStatus = (order.status || '').toLowerCase();
    const isBusy = updatingNumber === order.nomor_pesanan;
    const detailBtn = includeDetail ? (
      <button
        type="button"
        className="ord-btn ord-btn-secondary"
        onClick={() => handleOpenDetail(order)}
      >
        Detail
      </button>
    ) : null;

    // Selesai atau Dibatalkan: tidak ada aksi ubah status
    if (rawStatus === 'selesai' || rawStatus.includes('batal')) {
      return detailBtn ? <div className="ord-actions-group">{detailBtn}</div> : <span className="ord-text-muted">-</span>;
    }

    let nextBtn = null;
    let cancelBtn = null;

    if (rawStatus === 'menunggu pembayaran') {
      // Tombol proses nonaktif dengan title/tooltip 'Menunggu pembayaran'
      nextBtn = (
        <button
          type="button"
          disabled
          className="ord-btn ord-btn-secondary ord-btn-disabled"
          title="Menunggu pembayaran"
        >
          Proses
        </button>
      );
    } else if (rawStatus === 'dibayar') {
      // Admin dan pegawai: Proses
      nextBtn = (
        <button
          type="button"
          disabled={isBusy}
          className="ord-btn ord-btn-primary"
          onClick={() => handleStatusTransition(order, 'Diproses')}
        >
          {isBusy ? 'Memproses...' : 'Proses'}
        </button>
      );
    } else if (rawStatus === 'diproses') {
      // Admin dan pegawai: Siap Diambil atau Siap Dikirim
      const isPickup = order.metode_penerimaan === 'ambil_di_toko';
      const targetLabel = isPickup ? 'Siap Diambil' : 'Siap Dikirim';
      nextBtn = (
        <button
          type="button"
          disabled={isBusy}
          className="ord-btn ord-btn-primary"
          onClick={() => handleStatusTransition(order, targetLabel)}
        >
          {isBusy ? 'Menyimpan...' : targetLabel}
        </button>
      );
    } else if (
      rawStatus === 'siap diambil' ||
      rawStatus === 'siap dikirim' ||
      rawStatus === 'siap diambil/dikirim'
    ) {
      // Hanya Admin yang boleh menyelesaikan pesanan
      if (isAdmin) {
        nextBtn = (
          <button
            type="button"
            disabled={isBusy}
            className="ord-btn ord-btn-success"
            onClick={() => handleStatusTransition(order, 'Selesai')}
          >
            {isBusy ? 'Menyimpan...' : 'Selesai'}
          </button>
        );
      }
    }

    // Tombol Batalkan hanya untuk Admin (selama belum selesai / batal)
    if (isAdmin) {
      cancelBtn = (
        <button
          type="button"
          disabled={isBusy}
          className="ord-btn ord-btn-danger"
          onClick={() => handleOpenCancelDialog(order)}
        >
          Batalkan
        </button>
      );
    }

    if (!detailBtn && !nextBtn && !cancelBtn) {
      return <span className="ord-text-muted">-</span>;
    }

    return (
      <div className="ord-actions-group">
        {detailBtn}
        {nextBtn}
        {cancelBtn}
      </div>
    );
  };

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 20)) || 1;

  return (
    <div className="ord-page">
      <div className="ord-header">
        <div>
          <h1 className="ord-title">Daftar Pesanan</h1>
          <p className="ord-subtitle">Kelola dan perbarui status pesanan pelanggan toko.</p>
        </div>
      </div>

      {serverAlert && (
        <div className={`ord-alert ord-alert-${serverAlert.type}`} role="alert">
          <span>{serverAlert.message}</span>
          <button
            type="button"
            className="ord-alert-close"
            onClick={() => setServerAlert(null)}
            aria-label="Tutup notifikasi"
          >
            &times;
          </button>
        </div>
      )}

      {/* Toolbar: Pencarian dan Filter Status */}
      <div className="ord-toolbar-card">
        <form className="ord-search-form" onSubmit={handleSearchSubmit}>
          <div className="ord-search-wrapper">
            <svg
              className="ord-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="ord-search-input"
              placeholder="Cari nomor pesanan atau nama pemesan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="ord-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Hapus pencarian"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="ord-btn ord-btn-primary">
            Cari
          </button>
        </form>

        <div className="ord-date-filter-row">
          <div className="ord-date-inputs">
            <label className="ord-date-label">
              <span>Dari</span>
              <input
                type="date"
                className="ord-date-input"
                value={dariDate}
                onChange={(e) => setDariDate(e.target.value)}
                aria-label="Filter tanggal mulai"
              />
            </label>
            <span className="ord-date-sep">s/d</span>
            <label className="ord-date-label">
              <span>Sampai</span>
              <input
                type="date"
                className="ord-date-input"
                value={sampaiDate}
                onChange={(e) => setSampaiDate(e.target.value)}
                aria-label="Filter tanggal akhir"
              />
            </label>
          </div>

          <div className="ord-date-actions">
            <button
              type="button"
              className="ord-btn ord-btn-secondary"
              onClick={handleTodayFilter}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="ord-btn ord-btn-primary"
              onClick={handleApplyDateFilter}
            >
              Terapkan Tanggal
            </button>
            {(dariDate || sampaiDate || appliedDates.dari || appliedDates.sampai) && (
              <button
                type="button"
                className="ord-btn ord-btn-secondary"
                onClick={handleResetDateFilter}
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {dateFilterError && (
          <p className="ord-date-error" role="alert">
            {dateFilterError}
          </p>
        )}

        <div className="ord-tabs-container">
          <div className="ord-tabs-scroll" role="tablist">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`ord-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tampilan Kondisi: Error, Loading, Kosong, atau Tabel Data */}
      {error ? (
        <div className="ord-state-box ord-error-box">
          <p className="ord-error-msg">{error}</p>
          <button type="button" className="ord-btn ord-btn-primary" onClick={fetchOrders}>
            Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="ord-state-box">
          <div className="ord-spinner" />
          <p className="ord-text-muted">Memuat daftar pesanan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="ord-state-box ord-empty-box">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="ord-empty-icon"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <h3 className="ord-empty-title">Belum ada pesanan</h3>
          <p className="ord-text-muted">
            {appliedSearch || activeTab !== 'Semua'
              ? 'Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian.'
              : 'Belum ada pesanan yang masuk saat ini.'}
          </p>
          {(appliedSearch || activeTab !== 'Semua') && (
            <button
              type="button"
              className="ord-btn ord-btn-secondary"
              onClick={() => {
                setActiveTab('Semua');
                handleClearSearch();
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tampilan Desktop: Tabel */}
          <div className="ord-table-card">
            <table className="ord-table">
              <thead>
                <tr>
                  <th>Nomor Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Tanggal (WIB)</th>
                  <th>Total</th>
                  <th>Metode</th>
                  <th>Pembayaran</th>
                  <th>Status Pesanan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.nomor_pesanan}>
                    <td className="ord-td-code">
                      <strong>{order.nomor_pesanan}</strong>
                    </td>
                    <td>
                      <div className="ord-customer-name">{order.nama_pemesan}</div>
                    </td>
                    <td className="ord-td-date">{formatWibDateTime(order.tanggal)}</td>
                    <td className="ord-td-total">
                      <strong>{formatRupiah(order.total)}</strong>
                    </td>
                    <td>
                      <span
                        className={`ord-method-tag ${
                          order.metode_penerimaan === 'ambil_di_toko' ? 'pickup' : 'delivery'
                        }`}
                      >
                        {order.metode_penerimaan === 'ambil_di_toko' ? 'Ambil di Toko' : 'Kurir'}
                      </span>
                    </td>
                    <td>
                      <div className="ord-pay-cell">
                        <span
                          className={`ord-pay-method ${
                            order.metode_pembayaran === 'cod' ? 'cod' : 'midtrans'
                          }`}
                        >
                          {order.metode_pembayaran === 'cod' ? 'COD' : 'Midtrans (QRIS)'}
                        </span>
                        <span className={`ord-pay-badge ${getPaymentBadgeClass(order.status_pembayaran)}`}>
                          {order.status_pembayaran || 'Menunggu'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`ord-badge ${getStatusBadgeClass(order.status)}`}>
                        {formatOrderStatusLabel(order)}
                      </span>
                    </td>
                    <td className="ord-td-actions">{renderActions(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan Mobile: Kartu per Pesanan */}
          <div className="ord-cards-mobile">
            {orders.map((order) => (
              <div key={order.nomor_pesanan} className="ord-card">
                <div className="ord-card-head">
                  <div className="ord-card-order-num">
                    <strong>{order.nomor_pesanan}</strong>
                  </div>
                  <span className={`ord-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="ord-card-body">
                  <div className="ord-card-row">
                    <span className="ord-card-label">Pelanggan:</span>
                    <span className="ord-card-val">{order.nama_pemesan}</span>
                  </div>
                  <div className="ord-card-row">
                    <span className="ord-card-label">Tanggal:</span>
                    <span className="ord-card-val">{formatWibDateTime(order.tanggal)}</span>
                  </div>
                  <div className="ord-card-row">
                    <span className="ord-card-label">Metode:</span>
                    <span
                      className={`ord-method-tag ${
                        order.metode_penerimaan === 'ambil_di_toko' ? 'pickup' : 'delivery'
                      }`}
                    >
                      {order.metode_penerimaan === 'ambil_di_toko' ? 'Ambil di Toko' : 'Kurir'}
                    </span>
                  </div>
                  <div className="ord-card-row">
                    <span className="ord-card-label">Pembayaran:</span>
                    <div className="ord-pay-cell inline">
                      <span
                        className={`ord-pay-method ${
                          order.metode_pembayaran === 'cod' ? 'cod' : 'midtrans'
                        }`}
                      >
                        {order.metode_pembayaran === 'cod' ? 'COD' : 'Midtrans (QRIS)'}
                      </span>
                      <span className={`ord-pay-badge ${getPaymentBadgeClass(order.status_pembayaran)}`}>
                        {order.status_pembayaran || 'Menunggu'}
                      </span>
                    </div>
                  </div>
                  <div className="ord-card-row ord-card-total-row">
                    <span className="ord-card-label">Total:</span>
                    <strong className="ord-card-total-val">{formatRupiah(order.total)}</strong>
                  </div>
                </div>

                <div className="ord-card-footer">{renderActions(order)}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ord-pagination">
              <span className="ord-pagination-info">
                Halaman {page} dari {totalPages} ({meta.total} pesanan)
              </span>
              <div className="ord-pagination-buttons">
                <button
                  type="button"
                  className="ord-btn ord-btn-secondary"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  className="ord-btn ord-btn-secondary"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Detail Pesanan (Admin & Pegawai) */}
      {detailOpen && detailOrder && (
        <div className="ord-modal-backdrop" onClick={handleCloseDetail}>
          <div
            className="ord-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ord-detail-title"
          >
            <div className="ord-modal-header">
              <div>
                <h2 id="ord-detail-title" className="ord-modal-title">
                  Detail Pesanan {detailOrder.nomor_pesanan}
                </h2>
                <p className="ord-modal-sub">{formatWibDateTime(detailOrder.tanggal)}</p>
              </div>
              <button
                type="button"
                className="ord-alert-close"
                onClick={handleCloseDetail}
                aria-label="Tutup detail pesanan"
              >
                &times;
              </button>
            </div>

            <div className="ord-modal-body">
              <div className="ord-detail-status-strip">
                <div>
                  <span className="ord-detail-lbl">Status Pesanan</span>
                  <div>
                    <span className={`ord-badge ${getStatusBadgeClass(detailOrder.status)}`}>
                      {formatOrderStatusLabel(detailOrder)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="ord-detail-lbl">Metode &amp; Pembayaran</span>
                  <div className="ord-pay-cell inline" style={{ marginTop: 4 }}>
                    <span
                      className={`ord-pay-method ${
                        detailOrder.metode_pembayaran === 'cod' ? 'cod' : 'midtrans'
                      }`}
                    >
                      {detailOrder.metode_pembayaran === 'cod' ? 'COD' : 'Midtrans (QRIS)'}
                    </span>
                    <span className={`ord-pay-badge ${getPaymentBadgeClass(detailOrder.status_pembayaran)}`}>
                      {detailOrder.status_pembayaran || 'Menunggu'}
                    </span>
                  </div>
                </div>
              </div>

              {(detailOrder.status || '').toLowerCase() === 'menunggu pembayaran' && (
                <div className="ord-detail-flow-note">
                  <span className="ord-detail-flow-warn" style={{ marginTop: 0 }}>
                    Pesanan baru dapat diproses setelah berstatus Dibayar.
                  </span>
                </div>
              )}

              {detailError && (
                <div className="ord-alert ord-alert-danger" role="alert" style={{ marginBottom: 12 }}>
                  <span>{detailError}</span>
                </div>
              )}

              <div className="ord-detail-info-grid">
                <div>
                  <span className="ord-detail-lbl">Pelanggan</span>
                  <p className="ord-detail-val">{detailOrder.nama_pemesan || '-'}</p>
                  {detailOrder.no_hp && <p className="ord-detail-sub">{detailOrder.no_hp}</p>}
                </div>
                <div>
                  <span className="ord-detail-lbl">Penerimaan</span>
                  <p className="ord-detail-val">
                    {detailOrder.metode_penerimaan === 'ambil_di_toko' ? 'Ambil di Toko' : 'Kurir'}
                  </p>
                  {(detailOrder.wilayah || detailOrder.alamat_lengkap) && (
                    <p className="ord-detail-sub">
                      {detailOrder.alamat_lengkap || detailOrder.wilayah}
                    </p>
                  )}
                  {detailOrder.layanan_kurir && (
                    <p className="ord-detail-sub">Kurir: {detailOrder.layanan_kurir}</p>
                  )}
                </div>
              </div>

              {detailOrder.catatan && (
                <div className="ord-detail-note">
                  <span className="ord-detail-lbl">Catatan Pelanggan</span>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>{detailOrder.catatan}</p>
                </div>
              )}

              <div className="ord-detail-items">
                <span className="ord-detail-lbl">Daftar Produk</span>
                {detailLoading ? (
                  <p className="ord-text-muted" style={{ margin: '8px 0' }}>Memuat rincian produk...</p>
                ) : Array.isArray(detailOrder.items) && detailOrder.items.length > 0 ? (
                  <table className="ord-detail-table">
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map((it, idx) => (
                        <tr key={it.product_id || idx}>
                          <td>{it.nama}</td>
                          <td style={{ textAlign: 'center' }}>{it.jumlah}</td>
                          <td style={{ textAlign: 'right' }}>{formatRupiah(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="ord-text-muted" style={{ margin: '8px 0' }}>Rincian item tidak tersedia.</p>
                )}
              </div>

              <div className="ord-detail-summary">
                {detailOrder.subtotal !== undefined && (
                  <div className="ord-detail-sum-row">
                    <span>Subtotal</span>
                    <span>{formatRupiah(detailOrder.subtotal)}</span>
                  </div>
                )}
                {detailOrder.ongkir !== undefined && (
                  <div className="ord-detail-sum-row">
                    <span>Ongkos Kirim</span>
                    <span>{formatRupiah(detailOrder.ongkir)}</span>
                  </div>
                )}
                <div className="ord-detail-sum-row total">
                  <span>Total</span>
                  <strong>{formatRupiah(detailOrder.total)}</strong>
                </div>
              </div>
            </div>

            <div className="ord-modal-footer">
              <button type="button" className="ord-btn ord-btn-secondary" onClick={handleCloseDetail}>
                Tutup
              </button>
              {renderActions(detailOrder, { includeDetail: false })}
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog Pembatalan Pesanan (Hanya Admin) */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan Pesanan?"
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        busy={isCancelling}
        error={cancelDialogError}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!isCancelling) setCancelTarget(null);
        }}
      >
        <p style={{ margin: '0 0 8px' }}>
          Apakah Anda yakin ingin membatalkan pesanan{' '}
          <strong>{cancelTarget?.nomor_pesanan}</strong> a.n.{' '}
          <strong>{cancelTarget?.nama_pemesan}</strong>?
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
          Stok barang yang ada dalam pesanan ini akan dikembalikan secara otomatis ke inventaris. Tindakan ini tidak dapat diurungkan.
        </p>
      </ConfirmDialog>
    </div>
  );
}
