import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { formatRupiah } from '../utils/format';

// Contoh halaman yang sudah tersambung ke service.
// Dasar untuk menyempurnakan "Daftar Produk" sesuai desain PPL-18.
export default function ProductListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .list({ search })
      .then((res) => {
        if (!cancelled) {
          setRows(res.data);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search]);

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

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          placeholder="Cari nama produk"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
                <th>Berat / Satuan</th>
                <th>Stok</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="muted">Produk tidak ditemukan.</td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.nama}</td>
                  <td>{p.kategori}</td>
                  <td>{formatRupiah(p.harga)}</td>
                  <td>{p.satuan ?? (p.berat ? `${p.berat} g` : '—')}</td>
                  <td>{p.stok}</td>
                  {isAdmin && (
                    <td>
                      <Link to={`/produk/${p.id}/ubah`}>Ubah</Link>
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
