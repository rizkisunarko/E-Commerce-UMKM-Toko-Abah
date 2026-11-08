import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
import Button from '../components/Button';
=======
import { Link, useLocation } from 'react-router-dom';
>>>>>>> b8625797fc729a643a19848b54d756a6603f9327
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { formatRupiah, formatStock } from '../utils/format';

export default function ProductListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const pesan = location.state?.pesan;

  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingArchiveId, setSavingArchiveId] = useState(null);

  async function loadProducts(cancelled = () => false) {
    setLoading(true);
    try {
      const response = await productService.list({
        search,
        include_archived: isAdmin && includeArchived ? 'true' : '',
      });
      if (cancelled()) return;
      setRows(response.data);
      setError('');
    } catch (err) {
      if (!cancelled()) setError(err.message);
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadProducts(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [search, includeArchived, isAdmin]);

  async function toggleArchive(product) {
    const archived = !product.archived_at;
    const action = archived ? 'arsipkan' : 'pulihkan';
    if (!window.confirm(`Yakin ingin ${action} produk "${product.nama}"?`)) return;
    setSavingArchiveId(product.id);
    setError('');
    try {
      await productService.archive(product.id, archived);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingArchiveId(null);
    }
  }

  return (
    <>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Daftar Produk</h1>
        {isAdmin && (
          <Link to="/produk/tambah" className="btn btn-primary">
            + Tambah Produk
          </Link>
        )}
      </div>

      {pesan && (
        <div className="alert-success" role="status">
          {pesan}
        </div>
      )}

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          placeholder="Cari nama produk"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isAdmin && (
        <label className="archive-filter">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />{' '}
          Tampilkan produk arsip
        </label>
      )}

      {error && <div className="alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Memuat...</p>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Berat (gram)</th>
                <th>Stok</th>
                {isAdmin && <th>Status</th>}
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="muted">Produk tidak ditemukan.</td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className={p.archived_at ? 'row-archived' : ''}>
                  <td>{p.nama}</td>
                  <td>{p.kategori}</td>
                  <td>{formatRupiah(p.harga)}</td>
                  <td>{p.berat}</td>
                  <td>{formatStock(p.stok)}</td>
                  {isAdmin && <td>{p.archived_at ? 'Diarsipkan' : 'Aktif'}</td>}
                  {isAdmin && (
                    <td className="product-actions">
                      <Link to={`/produk/${p.id}/ubah`}>Ubah</Link>
                      <Button
                        variant={p.archived_at ? 'secondary' : 'danger'}
                        disabled={savingArchiveId === p.id}
                        onClick={() => toggleArchive(p)}
                      >
                        {savingArchiveId === p.id
                          ? 'Menyimpan...'
                          : p.archived_at ? 'Pulihkan' : 'Arsipkan'}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
