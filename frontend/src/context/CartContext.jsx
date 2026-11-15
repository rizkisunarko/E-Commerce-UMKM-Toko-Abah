import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Keranjang pelanggan. Fondasi untuk PPL-08 (halaman keranjang dan checkout).
// Disimpan di localStorage agar tidak hilang saat halaman dimuat ulang.
const CART_KEY = 'toko_abah_cart';
const CartContext = createContext(null);

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // items: [{ id, nama, harga, stok, jumlah }]
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // penyimpanan browser tidak tersedia: abaikan
    }
  }, [items]);

  // Hasil: 'ok', 'max' (jumlah sudah mencapai stok), atau 'habis' (stok 0)
  const addItem = useCallback(
    (product) => {
      if (product.stok <= 0) return 'habis';
      const found = items.find((it) => it.id === product.id);
      if (found && found.jumlah >= product.stok) return 'max';
      setItems(
        found
          ? items.map((it) =>
              it.id === product.id ? { ...it, stok: product.stok, jumlah: it.jumlah + 1 } : it,
            )
          : [...items, { id: product.id, nama: product.nama, harga: product.harga, stok: product.stok, jumlah: 1 }],
      );
      return 'ok';
    },
    [items],
  );

  const count = items.reduce((sum, it) => sum + it.jumlah, 0);
  const value = useMemo(() => ({ items, count, addItem }), [items, count, addItem]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider');
  return ctx;
}
