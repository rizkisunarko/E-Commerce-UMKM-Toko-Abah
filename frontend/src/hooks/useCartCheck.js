import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';

// Memeriksa harga dan stok keranjang ke server saat halaman dibuka, lalu menyalinnya ke keranjang.
export default function useCartCheck() {
  const { items, syncItems } = useCart();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [checking, setChecking] = useState(itemsRef.current.length > 0);
  const [error, setError] = useState('');

  const recheck = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0) {
      setChecking(false);
      return;
    }
    setChecking(true);
    setError('');
    try {
      const res = await orderService.checkCart(current.map((it) => ({ product_id: it.id, jumlah: it.jumlah })));
      syncItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Gagal memeriksa stok');
    } finally {
      setChecking(false);
    }
  }, [syncItems]);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return { checking, error, recheck };
}

