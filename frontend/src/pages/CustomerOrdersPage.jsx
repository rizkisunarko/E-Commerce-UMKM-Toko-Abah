import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';
import {
  getSavedOrderHistory,
  removeOrderFromHistory,
  saveOrderToHistory,
} from '../utils/orderHistory';
import './CustomerOrdersPage.css';

function formatOrderDate(iso) {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'dibayar') return 'cop-badge-dibayar';
  if (s === 'diproses') return 'cop-badge-diproses';
  if (s.includes('siap')) return 'cop-badge-siap';
  if (s === 'selesai') return 'cop-badge-selesai';
  if (s.includes('batal')) return 'cop-badge-batal';
  return 'cop-badge-pending';
}

function OrderSummaryCard({ order, onRemove }) {
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, it) => sum + Number(it.jumlah || 1), 0)
    : Number(order.jumlah_item || 0);

  return (
    <article className="cop-order-card">
      <div className="cop-order-card-top">
        <div>
          <span className="cop-order-number">{order.nomor_pesanan}</span>
          <span className="cop-order-date">{formatOrderDate(order.tanggal)}</span>
        </div>
        <span className={`cop-status-badge ${getStatusClass(order.status)}`}>
          {order.status || 'Menunggu Pembayaran'}
        </span>
      </div>

      <div className="cop-order-card-meta">
        <span>
          {order.metode_pembayaran === 'cod' ? 'COD (Bayar di Tempat)' : 'QRIS / Transfer'}
        </span>
        <span>•</span>
        <span>
          {order.metode_penerimaan === 'kurir' ? 'Diantar Kurir' : 'Ambil di Toko'}
        </span>
        {itemCount > 0 && (
          <>
            <span>•</span>
            <span>{itemCount} barang</span>
          </>
        )}
      </div>

      <div className="cop-order-card-bottom">
        <div className="cop-order-total">
          <span className="cop-order-total-label">Total</span>
          <strong>{formatRupiah(order.total || 0)}</strong>
        </div>

        <div className="cop-order-actions">
          {onRemove && (
            <button
              type="button"
              className="cop-btn-remove"
              onClick={() => onRemove(order.nomor_pesanan)}
              title="Hapus dari daftar browser ini"
            >
              Hapus
            </button>
          )}
          <Link
            to={`/pesanan/${encodeURIComponent(order.nomor_pesanan)}`}
            className="cop-btn-detail"
          >
            Lihat Detail →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function CustomerOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const [savedOrders, setSavedOrders] = useState(() => getSavedOrderHistory());
  const [syncingLocal, setSyncingLocal] = useState(false);

  useEffect(() => {
    const initial = getSavedOrderHistory();
    if (!initial.length) return;

    let cancelled = false;
    setSyncingLocal(true);

    Promise.allSettled(initial.map((item) => orderService.get(item.nomor_pesanan)))
      .then((results) => {
        if (cancelled) return;
        const merged = initial.map((cached, idx) => {
          const outcome = results[idx];
          if (outcome.status === 'fulfilled' && outcome.value?.data) {
            saveOrderToHistory(outcome.value.data);
            return outcome.value.data;
          }
          return cached;
        });
        setSavedOrders(merged);
      })
      .finally(() => {
        if (!cancelled) setSyncingLocal(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 4) {
      setSearchError('Masukkan minimal 4 karakter (Nomor Pesanan atau Nomor HP).');
      return;
    }

    setSearching(true);
    setSearchError('');
    try {
      const res = await orderService.searchHistory(trimmed);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSearchError(err.message || 'Gagal mencari pesanan. Coba lagi.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery('');
    setSearchError('');
    setSearchResults(null);
  }

  function handleRemoveLocal(nomorPesanan) {
    removeOrderFromHistory(nomorPesanan);
    setSavedOrders((prev) => prev.filter((item) => item.nomor_pesanan !== nomorPesanan));
  }

  return (
    <div className="cop-container">
      <div className="cop-header">
        <div>
          <h1 className="cop-title">Pesanan Saya</h1>
          <p className="cop-subtitle">
            Pantau status pesanan, pembayaran QRIS 24 jam, atau beri ulasan produk tanpa perlu login.
          </p>
        </div>
        <Link to="/katalog" className="cop-back-link">
          ← Kembali ke Katalog
        </Link>
      </div>

      {/* Bagian 1: Lacak Pesanan */}
      <section className="cop-search-card">
        <h2 className="cop-section-title">Lacak Pesanan</h2>
        <p className="cop-section-desc">
          Lacak status pesanan Anda berdasarkan <strong>Nomor Pesanan</strong> (contoh:{' '}
          <code>TA-20261128-0001</code>) atau <strong>Nomor HP</strong> yang digunakan saat checkout.
        </p>

        <form className="cop-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="cop-search-input"
            placeholder="Contoh: TA-20261128-0001 atau 081234567890"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Nomor Pesanan atau Nomor HP"
          />
          <button type="submit" className="cop-search-btn" disabled={searching}>
            {searching ? 'Mencari...' : 'Cari Pesanan'}
          </button>
          {searchResults !== null && (
            <button type="button" className="cop-reset-btn" onClick={handleClearSearch}>
              Reset
            </button>
          )}
        </form>

        {searchError && (
          <div className="cop-alert-error" role="alert">
            {searchError}
          </div>
        )}

        {searchResults !== null && (
          <div className="cop-search-results">
            <div className="cop-results-header">
              <span>Hasil Pencarian ({searchResults.length})</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="cop-empty-box">
                Pesanan tidak ditemukan untuk kata kunci tersebut. Periksa kembali Nomor Pesanan atau Nomor HP Anda.
              </div>
            ) : (
              <div className="cop-order-list">
                {searchResults.map((order) => (
                  <OrderSummaryCard key={order.nomor_pesanan} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bagian 2: Riwayat Otomatis di Browser Ini */}
      <section className="cop-local-section">
        <div className="cop-local-header">
          <div>
            <h2 className="cop-section-title">Riwayat di Perangkat Ini</h2>
            <p className="cop-section-desc">
              Tersimpan otomatis di browser ini agar mudah dibuka kembali.
              {syncingLocal ? ' Memperbarui status terbaru...' : ''}
            </p>
          </div>
        </div>

        {savedOrders.length === 0 ? (
          <div className="cop-empty-box">
            Belum ada riwayat pesanan yang tersimpan di browser ini. Anda tetap bisa melacak pesanan menggunakan kolom pencarian di atas, atau{' '}
            <Link to="/katalog" style={{ color: '#15803d', fontWeight: 600 }}>
              mulai belanja di katalog
            </Link>
            .
          </div>
        ) : (
          <div className="cop-order-list">
            {savedOrders.map((order) => (
              <OrderSummaryCard
                key={order.nomor_pesanan}
                order={order}
                onRemove={handleRemoveLocal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
