export default function ProductIcon({ nama = '', kategori = '', size = 48, className = '' }) {
  const text = `${nama || ''} ${kategori || ''}`.toLowerCase();

  // 1. Beras & Pokok
  if (text.includes('beras') || text.includes('gandum') || text.includes('tepung')) {
    return (
      <div
        className={`product-icon-box beras ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 20h12a2 2 0 0 0 2-2V9a2 2 0 0 0-1.2-1.85l-6-2.5a2 2 0 0 0-1.6 0l-6 2.5A2 2 0 0 0 4 9v9a2 2 0 0 0 2 2z" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </svg>
      </div>
    );
  }

  // 2. Minyak & Mentega
  if (text.includes('minyak') || text.includes('goreng') || text.includes('mentega') || text.includes('margarin')) {
    return (
      <div
        className={`product-icon-box minyak ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>
    );
  }

  // 3. Gula & Pemanis
  if (text.includes('gula') || text.includes('pemanis') || text.includes('manis')) {
    return (
      <div
        className={`product-icon-box gula ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21 8-9-5-9 5 9 5 9-5z" />
          <path d="m3 8 9 5 9-5" />
          <path d="M12 13v8" />
          <path d="m3 8v8l9 5" />
          <path d="m21 8v8l-9 5" />
        </svg>
      </div>
    );
  }

  // 4. Telur & Protein
  if (text.includes('telur') || text.includes('protein') || text.includes('lauk')) {
    return (
      <div
        className={`product-icon-box telur ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c4.97 0 9-4.03 9-9 0-5.52-4.03-11-9-11S3 7.48 3 13c0 4.97 4.03 9 9 9z" />
        </svg>
      </div>
    );
  }

  // 5. Mie Instan & Makanan
  if (text.includes('mie') || text.includes('indomie') || text.includes('instan') || text.includes('sedap')) {
    return (
      <div
        className={`product-icon-box mie ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11c0 4.418 3.582 8 8 8h2c4.418 0 8-3.582 8-8H3z" />
          <path d="M7 19v2" />
          <path d="M17 19v2" />
          <path d="M8 7v4" />
          <path d="M12 5v6" />
          <path d="M16 7v4" />
        </svg>
      </div>
    );
  }

  // 6. Kopi Sachet
  if (text.includes('kopi') || text.includes('kapal')) {
    return (
      <div
        className={`product-icon-box kopi ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      </div>
    );
  }

  // 7. Sabun Mandi & Kebersihan
  if (text.includes('sabun') || text.includes('kebersihan') || text.includes('shampoo') || text.includes('deterjen')) {
    return (
      <div
        className={`product-icon-box sabun ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
          <path d="m12 3 1.5 2.5L16 6l-2.5 1.5L12 10l-1.5-2.5L8 6l2.5-1.5z" />
        </svg>
      </div>
    );
  }

  // 8. Teh Celup
  if (text.includes('teh')) {
    return (
      <div
        className={`product-icon-box teh ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v7a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V8z" />
          <path d="M10 2v4" />
          <path d="M10 6c0 1.1-.9 2-2 2" />
        </svg>
      </div>
    );
  }

  // 9. Bumbu & Saus
  if (text.includes('kecap') || text.includes('saus') || text.includes('bumbu')) {
    return (
      <div
        className={`product-icon-box bumbu ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2h4" />
          <path d="M10 4h4" />
          <path d="M12 4v3" />
          <rect x="7" y="7" width="10" height="14" rx="2.5" />
          <path d="M12 11c-1.2 1.5-1.8 2.3-1.8 3.2a1.8 1.8 0 0 0 3.6 0c0-.9-.6-1.7-1.8-3.2z" fill="currentColor" />
        </svg>
      </div>
    );
  }

  // 10. Default Sembako / Paket
  return (
    <div
      className={`product-icon-box default ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}
