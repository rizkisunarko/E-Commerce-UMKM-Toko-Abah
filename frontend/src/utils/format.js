// 12500 -> "Rp 12.500"
export function formatRupiah(value) {
  const n = Number(value) || 0;
  return `Rp ${n.toLocaleString('id-ID')}`;
}
