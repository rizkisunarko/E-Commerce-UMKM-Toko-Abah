import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Keranjang pelanggan (PPL-07 dan PPL-08). Disimpan di localStorage agar tidak hilang
// saat halaman dimuat ulang. Harga dan stok di sini hanya salinan: server yang menentukan.
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

// Masalah stok pada satu barang di keranjang, atau '' bila aman
export function itemIssue(item) {
  if (item.stok <= 0) return 'Stok habis';
  if (item.jumlah > item.stok) return `Stok tidak mencukupi (sisa ${item.stok})`;
  return '';
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

  // Ubah jumlah. Tombol plus tidak melewati stok, tombol minus berhenti di 1.
  const setJumlah = useCallback((id, jumlah) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const max = it.stok > 0 ? it.stok : it.jumlah;
        return { ...it, jumlah: Math.max(1, Math.min(jumlah, max)) };
      }),
    );
  }, []);

  const removeItem = useCallback((id) => setItems((prev) => prev.filter((it) => it.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  // Perbarui nama, harga, dan stok dari hasil pemeriksaan server. Jumlah pelanggan tidak diubah.
  // Barang yang sudah tidak ada di server dibuang.
  const syncItems = useCallback((rows) => {
    setItems((prev) =>
      prev
        .map((it) => {
          const row = rows.find((r) => r.product_id === it.id);
          return row ? { ...it, nama: row.nama, harga: row.harga, stok: row.stok } : null;
        })
        .filter(Boolean),
    );
  }, []);

  const count = items.reduce((sum, it) => sum + it.jumlah, 0);
  const total = items.reduce((sum, it) => sum + it.harga * it.jumlah, 0);
  const hasIssue = items.some((it) => itemIssue(it));
  const value = useMemo(
    () => ({ items, count, total, hasIssue, addItem, setJumlah, removeItem, clear, syncItems }),
    [items, count, total, hasIssue, addItem, setJumlah, removeItem, clear, syncItems],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider');
  return ctx;
}
