import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah } from '../utils/format';

// Halaman sementara setelah pesanan dibuat. PPL-08.3 menggantinya dengan halaman
// "Pesanan Berhasil" lengkap beserta tombol kirim ringkasan ke WhatsApp toko.
export default function OrderPage() {
  const { nomor } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    orderService
      .get(nomor)
      .then((res) => !cancelled && setOrder(res.data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [nomor]);

  if (error) return <div className="alert-error" role="alert">{error}</div>;
  if (!order) return <p className="muted" style={{ padding: 24 }}>Memuat...</p>;

  return (
    <div className="card" style={{ maxWidth: 600, margin: '24px auto', padding: 24 }}>
      <h1>Pesanan Anda sudah dibuat</h1>
      <p>Nomor Pesanan: <strong>{order.nomor_pesanan}</strong></p>
      <p>Status: <span className="badge">{order.status}</span></p>
      <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {order.items.map((it) => (
          <div key={it.product_id} style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
            <span>{it.nama} x{it.jumlah}</span>
            <span>{formatRupiah(it.subtotal)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 16 }}>
        <span>Total</span>
        <strong>{formatRupiah(order.total)}</strong>
      </div>
      <Link to="/katalog">Kembali ke Katalog</Link>
    </div>
  );
}
