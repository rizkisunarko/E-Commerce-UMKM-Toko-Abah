import { useEffect, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/stockService';
import { formatStock } from '../utils/format';

export default function StockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stockService
      .list({ search, kritis: criticalOnly ? 'true' : '' })
      .then((response) => {
        if (cancelled) return;
        setRows(response.data);
        setCriticalCount(response.ringkasan.stok_kritis);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, criticalOnly]);

  function openUpdate(product) {
    setSelectedProduct(product);
    setNewStock(String(Number(product.stok)));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const stockValue = Number(newStock);
    const currentStock = Number(selectedProduct.stok);
    if (!Number.isFinite(stockValue) || stockValue < 0) {
      setFormError('Masukkan jumlah stok yang valid.');
      return;
    }
    if (!isAdmin && stockValue >= currentStock) {
      setFormError('Pegawai hanya dapat mengurangi stok.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await stockService.update(selectedProduct.id, stockValue);
      const response = await stockService.list({
        search,
        kritis: criticalOnly ? 'true' : '',
      });
      setRows(response.data);
      setCriticalCount(response.ringkasan.stok_kritis);
      setError('');
      setSelectedProduct(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Daftar Stok</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Produk dengan stok kritis: {criticalCount}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field" style={{ maxWidth: 320, marginBottom: 0 }}>
          <label htmlFor="stock-search">Cari produk</label>
          <input
            id="stock-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama produk"
          />
        </div>
        <label>
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(event) => setCriticalOnly(event.target.checked)}
          />{' '}
          Tampilkan stok kritis saja
        </label>
      </div>

      {error && <div className="alert-error" role="alert">{error}</div>}
      {loading ? (
        <p className="muted">Memuat stok...</p>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Batas Minimum</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">Produk tidak ditemukan.</td>
                </tr>
              )}
              {rows.map((product) => (
                <tr
                  key={product.id}
                  className={product.status_stok === 'Stok Kritis' ? 'row-critical' : ''}
                >
                  <td>{product.nama}</td>
                  <td>{product.kategori}</td>
                  <td>{formatStock(product.stok)} {product.satuan}</td>
                  <td>{formatStock(product.batas_stok_kritis)}</td>
                  <td><Badge status={product.status_stok} /></td>
                  <td>
                    <Button onClick={() => openUpdate(product)}>
                      {isAdmin ? 'Ubah Stok' : 'Kurangi Stok'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selectedProduct)}
        title={isAdmin ? 'Ubah Stok Produk' : 'Kurangi Stok Produk'}
        onClose={() => !saving && setSelectedProduct(null)}
      >
        {selectedProduct && (
          <form onSubmit={handleSubmit}>
            <p>{selectedProduct.nama}</p>
            <p className="muted">
              Stok saat ini: {formatStock(selectedProduct.stok)} {selectedProduct.satuan}
            </p>
            <TextField
              label="Stok baru"
              type="number"
              min="0"
              max={isAdmin ? undefined : Number(selectedProduct.stok) - 1}
              step="1"
              value={newStock}
              onChange={(event) => setNewStock(event.target.value)}
              helper={!isAdmin ? 'Pegawai hanya dapat mengurangi stok.' : undefined}
              required
            />
            {formError && <div className="alert-error" role="alert">{formError}</div>}
            <div className="toolbar" style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
              <Button variant="secondary" disabled={saving} onClick={() => setSelectedProduct(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
