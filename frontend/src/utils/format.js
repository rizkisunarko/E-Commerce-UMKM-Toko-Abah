// 12500 -> "Rp 12.500"
export function formatRupiah(value) {
  const n = Number(value) || 0;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatDateWib(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeWib(iso) {
  if (!iso) return '-';
  return `${new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })} WIB`;
}

export function formatDateTimeWib(iso) {
  if (!iso) return '-';
  return `${formatDateWib(iso)}, ${formatTimeWib(iso)}`;
}
