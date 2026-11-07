import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>Halaman tidak ditemukan</h1>
        <Link to="/produk">Kembali ke Daftar Produk</Link>
      </div>
    </div>
  );
}
