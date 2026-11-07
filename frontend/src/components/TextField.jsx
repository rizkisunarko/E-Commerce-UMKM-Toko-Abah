import { useId } from 'react';

// Kolom isian dengan label, teks bantuan, dan pesan kesalahan.
// Dipakai di login dan form produk.
export default function TextField({ label, error, helper, ...props }) {
  const id = useId();
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} {...props} />
      {helper && !error && <span className="field-helper">{helper}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
