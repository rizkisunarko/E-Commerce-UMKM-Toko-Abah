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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminOrderService.list({
        status: activeTab === 'Semua' ? undefined : activeTab,
        page,
        limit: 20,
        search: appliedSearch || undefined,
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
  }, [activeTab, page, appliedSearch]);

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

  const handleStatusTransition = async (order, targetStatus) => {
    setUpdatingNumber(order.nomor_pesanan);
    setServerAlert(null);
    try {
      await adminOrderService.updateStatus(order.nomor_pesanan, targetStatus);
      // Sukses: perbarui data tanpa reload halaman
      await fetchOrders();
      setServerAlert({
        type: 'success',
        message: `Status pesanan ${order.nomor_pesanan} berhasil diubah ke ${targetStatus}.`,
      });
    } catch (err) {
      // 403 / 422: tampilkan pesan galat dari server dan muat ulang daftar
      setServerAlert({
        type: 'danger',
        message: err.message || 'Gagal mengubah status pesanan.',
      });
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
    setIsCancelling(true);
    setCancelDialogError('');
    try {
      await adminOrderService.updateStatus(cancelTarget.nomor_pesanan, 'Dibatalkan');
      setCancelTarget(null);
      await fetchOrders();
      setServerAlert({
        type: 'success',
        message: `Pesanan ${cancelTarget.nomor_pesanan} berhasil dibatalkan.`,
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
  const renderActions = (order) => {
    const rawStatus = (order.status || '').toLowerCase();
    const isBusy = updatingNumber === order.nomor_pesanan;

    // Selesai atau Dibatalkan: tidak ada aksi
    if (rawStatus === 'selesai' || rawStatus.includes('batal')) {
      return <span className="ord-text-muted">-</span>;
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

    if (!nextBtn && !cancelBtn) {
      return <span className="ord-text-muted">-</span>;
    }

    return (
      <div className="ord-actions-group">
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
                      <span className={`ord-pay-badge ${getPaymentBadgeClass(order.status_pembayaran)}`}>
                        {order.status_pembayaran || 'Menunggu'}
                      </span>
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
                    <span className={`ord-pay-badge ${getPaymentBadgeClass(order.status_pembayaran)}`}>
                      {order.status_pembayaran || 'Menunggu'}
                    </span>
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
