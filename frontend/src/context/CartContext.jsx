import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cartService } from '../services/cartService';

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
  if (item.cukup === false) return 'Stok tidak mencukupi';
  if (item.jumlah > item.stok) return `Stok tidak mencukupi (sisa ${item.stok})`;
  return '';
}

export function CartProvider({ children }) {
  // items: [{ id, nama, harga, stok, jumlah }]
  const [items, setItems] = useState(loadCart);
  const [cartReady, setCartReady] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const itemsRef = useRef(items);
  const localChanges = useRef(false);
  const skipNextSave = useRef(false);
  const syncQueue = useRef(Promise.resolve());

  const updateItems = useCallback((update, localChange = true) => {
    const nextItems = update(itemsRef.current);
    itemsRef.current = nextItems;
    if (localChange) localChanges.current = true;
    setItems(nextItems);
  }, []);

  useEffect(() => {
    let active = true;
    cartService.get()
      .then((result) => {
        if (!active) return;
        if (!localChanges.current && result.persisted) {
          skipNextSave.current = true;
          updateItems(() => result.data.map((item) => ({
            id: item.product_id,
            nama: item.nama,
            harga: item.harga,
            stok: item.stok,
            jumlah: item.jumlah,
            cukup: item.cukup,
            ...(item.foto_produk ? { foto_produk: item.foto_produk } : {}),
          })), false);
        } else if (!localChanges.current && itemsRef.current.length === 0) {
          skipNextSave.current = true;
        }
        setCartReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setSyncError(error.message || 'Keranjang belum dapat dimuat dari database.');
        setCartReady(true);
      });

    return () => {
      active = false;
    };
  }, [updateItems]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // penyimpanan browser tidak tersedia: abaikan
    }
  }, [items]);

  useEffect(() => {
    if (!cartReady) return undefined;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return undefined;
    }

    const snapshot = items.map((item) => ({
      product_id: item.id,
      jumlah: item.jumlah,
    }));
    const timer = setTimeout(() => {
      syncQueue.current = syncQueue.current
        .catch(() => {})
        .then(() => cartService.replace(snapshot))
        .then(() => setSyncError(''))
        .catch((error) => {
          setSyncError(error.message || 'Keranjang gagal disimpan ke database.');
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [items, cartReady, syncAttempt]);

  const retrySync = useCallback(() => setSyncAttempt((attempt) => attempt + 1), []);

  // Hasil: 'ok', 'max' (jumlah sudah mencapai stok), atau 'habis' (stok 0)
  const addItem = useCallback(
    (product, quantityToAdd = 1) => {
      if (product.stok <= 0) return 'habis';
      const qty = Math.max(1, Number(quantityToAdd) || 1);
      const currentItems = itemsRef.current;
      const found = currentItems.find((it) => it.id === product.id);
      if (found && found.jumlah >= product.stok) return 'max';
      const targetQty = found ? found.jumlah + qty : qty;
      updateItems(
        () =>
          found
            ? currentItems.map((it) =>
                it.id === product.id
                  ? { ...it, stok: product.stok, jumlah: targetQty, cukup: targetQty <= product.stok }
                  : it,
              )
            : [...currentItems, {
              id: product.id,
              nama: product.nama,
              harga: product.harga,
              stok: product.stok,
              jumlah: targetQty,
              cukup: targetQty <= product.stok,
            }],
      );
      return 'ok';
    },
    [updateItems],
  );

  // Ubah jumlah. Mendukung input manual dan tombol stepper.
  const setJumlah = useCallback((id, jumlah) => {
    updateItems((currentItems) =>
      currentItems.map((it) => {
        if (it.id !== id) return it;
        const nextQuantity = Math.max(1, Number(jumlah) || 1);
        return { ...it, jumlah: nextQuantity, cukup: it.stok > 0 ? nextQuantity <= it.stok : false };
      }),
    );
  }, [updateItems]);

  const removeItem = useCallback(
    (id) => updateItems((currentItems) => currentItems.filter((it) => it.id !== id)),
    [updateItems],
  );
  const clear = useCallback(() => updateItems(() => []), [updateItems]);

  // Perbarui nama, harga, dan stok dari hasil pemeriksaan server. Jumlah pelanggan tidak diubah.
  // Barang yang sudah tidak ada di server dibuang.
  const syncItems = useCallback((rows) => {
    updateItems((currentItems) =>
      currentItems
        .map((it) => {
          const row = rows.find((r) => r.product_id === it.id);
          return row
            ? {
              ...it,
              nama: row.nama,
              harga: row.harga,
              stok: row.stok,
              cukup: row.cukup,
            }
            : null;
        })
        .filter(Boolean),
    );
  }, [updateItems]);

  const count = items.reduce((sum, it) => sum + it.jumlah, 0);
  const total = items.reduce((sum, it) => sum + it.harga * it.jumlah, 0);
  const hasIssue = items.some((it) => itemIssue(it));
  const value = useMemo(
    () => ({
      items,
      cartReady,
      count,
      total,
      hasIssue,
      syncError,
      retrySync,
      addItem,
      setJumlah,
      removeItem,
      clear,
      syncItems,
    }),
    [items, cartReady, count, total, hasIssue, syncError, retrySync, addItem, setJumlah, removeItem, clear, syncItems],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider');
  return ctx;
}
