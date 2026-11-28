import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const CustomerOrdersPage = lazy(() => import('./pages/CustomerOrdersPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductCreatePage = lazy(() => import('./pages/ProductCreatePage'));
const ProductEditPage = lazy(() => import('./pages/ProductEditPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const KasirPage = lazy(() => import('./pages/KasirPage'));
const RiwayatPage = lazy(() => import('./pages/RiwayatPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Halaman awal: pelanggan ke katalog, staf yang sudah login ke daftar produk
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted" style={{ padding: 24 }}>Memuat...</p>;
  return <Navigate to={user ? '/produk' : '/katalog'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 24 }}>Memuat...</p>}>
      <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Halaman pelanggan: tanpa login */}
      <Route element={<PublicLayout />}>
        <Route path="/katalog" element={<CatalogPage />} />
        <Route path="/keranjang" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pesanan" element={<CustomerOrdersPage />} />
        {/* PPL-08.3: ganti OrderPage dengan halaman Pesanan Berhasil */}
        <Route path="/pesanan/:nomor" element={<OrderPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="produk" element={<ProductListPage />} />

        {/* PPL-12.2: Halaman daftar dan status pesanan (admin dan pegawai) */}
        <Route path="admin/pesanan" element={<AdminOrdersPage />} />

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

        {/* PPL-13.2: Halaman laporan penjualan (hanya admin) */}
        <Route
          path="admin/laporan"
          element={
            <ProtectedRoute roles={['admin']}>
              <ReportPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
