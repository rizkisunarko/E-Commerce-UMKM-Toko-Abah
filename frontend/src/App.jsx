import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ProductListPage from './pages/ProductListPage';
import ProductCreatePage from './pages/ProductCreatePage';
import ProductEditPage from './pages/ProductEditPage';
import StockPage from './pages/StockPage';
import KasirPage from './pages/KasirPage';
import RiwayatPage from './pages/RiwayatPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/produk" replace />} />
        <Route path="produk" element={<ProductListPage />} />

        {/* PPL-01.2: Halaman form tambah produk */}
        <Route
          path="produk/tambah"
          element={
            <ProtectedRoute roles={['admin']}>
              <ProductCreatePage />
            </ProtectedRoute>
          }
        />

        {/* PPL-02.2: Halaman form ubah produk */}
        <Route
          path="produk/:id/ubah"
          element={
            <ProtectedRoute roles={['admin']}>
              <ProductEditPage />
            </ProtectedRoute>
          }
        />

        {/* PPL-03.2: Halaman daftar dan pembaruan stok */}
        <Route path="stok" element={<StockPage />} />

        {/* PPL-05.2: Halaman kasir dan transaksi (admin dan pegawai) */}
        <Route path="kasir" element={<KasirPage />} />

        {/* PPL-06.2: Halaman riwayat transaksi (hanya admin) */}
        <Route
          path="riwayat"
          element={
            <ProtectedRoute roles={['admin']}>
              <RiwayatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
