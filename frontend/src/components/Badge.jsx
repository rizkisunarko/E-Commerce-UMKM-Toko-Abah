// Lencana status stok: "Stok Kritis" (merah) dan "Stok Aman" (hijau)
export default function Badge({ status }) {
  const critical = status === 'Stok Kritis';
  return <span className={`badge ${critical ? 'badge-danger' : 'badge-success'}`}>{status}</span>;
}
