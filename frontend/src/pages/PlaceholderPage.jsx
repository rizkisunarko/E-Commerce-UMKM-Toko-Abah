// Penanda halaman yang belum dibuat. Ganti dengan halaman asli sesuai kartu.
export default function PlaceholderPage({ title, kartu }) {
  return (
    <div className="card">
      <h1>{title}</h1>
      <p className="muted">Halaman ini belum dikerjakan (kartu {kartu}).</p>
    </div>
  );
}
