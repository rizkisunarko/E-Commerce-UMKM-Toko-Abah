import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { catalogService } from '../services/catalogService';
import { formatRupiah } from '../utils/format';
import './CatalogPage.css';

// Import aset gambar lokal sesuai instruksi
import berasImg from '../assets/Beras.jpg';
import minyakImg from '../assets/Minyak-Goreng.jpg';
import gulaImg from '../assets/Gula-Pasir.jpg';
import telurImg from '../assets/Telur Ayam.jpg';
import mieImg from '../assets/Mie-Instan.jpg';
import kopiImg from '../assets/Kopi-Sachet.jpg';
import bannerImg from '../assets/store-banner.jpg';
import screenImg from '../assets/screen.png';

const LIMIT = 12;

function getProductImage(product = {}) {
  const text = ((product.nama || '') + ' ' + (product.kategori || '')).toLowerCase();
  if (text.includes('beras')) return berasImg;
  if (text.includes('minyak')) return minyakImg;
  if (text.includes('gula') || text.includes('manis')) return gulaImg;
  if (text.includes('telur') || text.includes('lauk')) return telurImg;
  if (text.includes('mie') || text.includes('indomie') || text.includes('instan')) return mieImg;
  if (text.includes('kopi') || text.includes('teh')) return kopiImg;
  if (text.includes('sabun') || text.includes('rumah')) return bannerImg;
  return berasImg;
}

function getProductUnit(product = {}) {
  const text = (product.nama || '').toLowerCase();
  if (text.includes('beras')) return '/ sak';
  if (text.includes('minyak')) return '/ pouch';
  if (text.includes('gula')) return '/ bks';
  if (text.includes('telur')) return '/ kg';
  if (text.includes('mie')) return text.includes('dus') ? '/ dus' : '/ bks';
  if (text.includes('kopi')) return text.includes('renceng') ? '/ renceng' : '/ bks';
  if (text.includes('teh')) return '/ kotak';
  if (text.includes('sabun')) return '/ batang';
  if (text.includes('kecap')) return '/ botol';
  return '/ item';
}

function getProductDescription(product = {}) {
  const text = (product.nama || '').toLowerCase();
  if (text.includes('beras')) return 'Kualitas super, pulen harum, putih alami';
  if (text.includes('minyak')) return 'Kemasan pouch higienis, jernih 2x penyaringan';
  if (text.includes('gula')) return 'Manis murni alami dari tebu pilihan nusantara';
  if (text.includes('telur')) return 'Kondisi utuh, cangkang tebal, baru masuk kandang';
  if (text.includes('mie')) return 'Paket hemat lezat gurih, pas dinikmati kapan saja';
  if (text.includes('kopi')) return '10 sachet kopi bubuk plus gula mantap';
  if (text.includes('teh')) return 'Aroma wangi melati alami menyegarkan';
  if (text.includes('sabun')) return 'Bahan pembersih wangi dan higienis';
  if (text.includes('kecap')) return 'Kedelai hitam mallika kental dan gurih harum';
  return 'Produk sembako segar dan terpercaya Toko Abah';
}

function getProductSold(product = {}) {
  if (product.terjual !== undefined && product.terjual !== null) {
    return product.terjual;
  }
  const seed = (Number(product.id) || 1) * 37 + (product.nama ? product.nama.length * 11 : 13);
  return (seed % 140) + 25;
}

// Helper Social Proof & Price Framing (Step 3)
function getProductSocialProof(product = {}) {
  const text = (product.nama || '').toLowerCase();
  const seed = (Number(product.id) || 1) * 43;

  if (text.includes('beras')) {
    return {
      rating: '4.9',
      reviewText: '1,4 rb ulasan',
      soldBadge: 'Terjual 5 rb+',
    };
  }

  if (text.includes('minyak')) {
    return {
      rating: '4.9',
      reviewText: '2,1 rb ulasan',
      soldBadge: 'Terjual 4,2 rb+',
    };
  }

  const rawSold = getProductSold(product);
  const reviewsCount = ((seed % 15) + 8) * 100;
  const reviewText = `${(reviewsCount / 1000).toFixed(1).replace('.', ',')} rb ulasan`;
  const soldBadge = rawSold > 60 ? `Terjual ${Math.floor(rawSold / 10) * 10}+` : `Terjual ${rawSold}`;

  return {
    rating: '4.9',
    reviewText,
    soldBadge,
  };
}

// Helper Pilihan Varian Kemasan di Tempat (Step 4)
function getProductVariants(product = {}) {
  const text = ((product.nama || '') + ' ' + (product.kategori || '')).toLowerCase();

  if (text.includes('beras')) {
    return [
      { id: '2.5kg', label: '2.5 kg', mult: 0.52, strikeMult: 0.58, unitText: 'Setara Rp 15.000 / kg' },
      { id: '5kg', label: '5 kg', mult: 1.0, strikeMult: 1.076, unitText: 'Setara Rp 14.500 / kg • Beli 3+ lebih hemat', isDefault: true },
      { id: '10kg', label: '10 kg', mult: 1.958, strikeMult: 2.15, unitText: 'Setara Rp 14.200 / kg • Hemat grosir' },
    ];
  }

  if (text.includes('minyak')) {
    return [
      { id: '1L', label: '1 Liter', mult: 0.54, strikeMult: 0.62, unitText: 'Setara Rp 19.500 / L' },
      { id: '2L', label: '2 Liter', mult: 1.0, strikeMult: 1.125, unitText: 'Setara Rp 18.000 / L • Pouch Higienis', isDefault: true },
      { id: '5L', label: '5 L (Jerigen)', mult: 2.45, strikeMult: 2.75, unitText: 'Setara Rp 17.600 / L • Beli banyak lebih untung' },
    ];
  }

  if (text.includes('gula')) {
    return [
      { id: '500g', label: '500 gr', mult: 0.55, strikeMult: 0.65, unitText: 'Setara Rp 17.000 / kg' },
      { id: '1kg', label: '1 kg', mult: 1.0, strikeMult: 1.12, unitText: 'Setara Rp 16.500 / kg • Murni Alami', isDefault: true },
      { id: '2kg', label: '2 kg', mult: 1.94, strikeMult: 2.18, unitText: 'Setara Rp 16.000 / kg • Beli 2+ lebih hemat' },
    ];
  }

  if (text.includes('telur')) {
    return [
      { id: '10btr', label: '10 Butir', mult: 0.38, strikeMult: 0.45, unitText: 'Setara Rp 1.950 / butir' },
      { id: '1tray', label: '1 Tray (~1.8 kg)', mult: 1.0, strikeMult: 1.12, unitText: 'Setara Rp 1.850 / butir • Grade A Panen Baru', isDefault: true },
      { id: '2tray', label: '2 Tray', mult: 1.95, strikeMult: 2.18, unitText: 'Setara Rp 1.800 / butir • Grosir Warung' },
    ];
  }

  if (text.includes('mie')) {
    return [
      { id: '1bks', label: '1 Bks', mult: 0.22, strikeMult: 0.28, unitText: 'Satuan eceran' },
      { id: '5bks', label: '5 Bks', mult: 1.0, strikeMult: 1.15, unitText: 'Setara Rp 3.100 / bks • Paket Keluarga', isDefault: true },
      { id: '1dus', label: '1 Dus (40)', mult: 7.6, strikeMult: 8.8, unitText: 'Setara Rp 2.950 / bks • Dus Segel Pabrik' },
    ];
  }

  if (text.includes('kopi')) {
    return [
      { id: '5sct', label: '5 Sachet', mult: 0.55, strikeMult: 0.65, unitText: 'Kemasan coba' },
      { id: '1renceng', label: '1 Renceng (10)', mult: 1.0, strikeMult: 1.15, unitText: 'Setara Rp 1.400 / sachet • Mantap', isDefault: true },
      { id: '3renceng', label: '3 Renceng', mult: 2.85, strikeMult: 3.3, unitText: 'Setara Rp 1.330 / sachet • Lebih Murah' },
    ];
  }

  return [
    { id: 'reguler', label: '1 Satuan', mult: 1.0, strikeMult: 1.12, unitText: 'Harga eceran resmi', isDefault: true },
    { id: 'paket3', label: 'Beli 3+ (Grosir)', mult: 2.85, strikeMult: 3.25, unitText: 'Paket hemat sembako Toko Abah' },
  ];
}

// Perhitungan Harga Varian, Harga Coret & Nominal Hemat Rupiah (Step 3 & 4)
function calculateVariantPricing(basePrice, variant, productName = '') {
  const name = (productName || '').toLowerCase();
  const numBase = Number(basePrice) || 72500;

  // Kalibrasi Khusus Beras (sesuai contoh prompt: Beras 5 kg Rp 72.500, coret Rp 78.000, Hemat Rp 5.500; 10 kg Rp 142.000, Hemat Rp 14.000)
  if (name.includes('beras')) {
    if (variant?.id === '2.5kg') {
      return {
        currentPrice: 38500,
        strikePrice: 42000,
        savings: 3500,
        unitText: 'Setara Rp 15.400 / kg',
      };
    }
    if (variant?.id === '10kg') {
      return {
        currentPrice: 142000,
        strikePrice: 156000,
        savings: 14000,
        unitText: 'Setara Rp 14.200 / kg • Beli 10 kg lebih hemat',
      };
    }
    // Default 5 kg
    const current = numBase;
    const strike = current + 5500;
    return {
      currentPrice: current,
      strikePrice: strike,
      savings: 5500,
      unitText: 'Setara Rp 14.500 / kg • Beli 3+ lebih hemat',
    };
  }

  // Khusus Minyak Goreng
  if (name.includes('minyak')) {
    if (variant?.id === '1L') {
      const current = Math.round((numBase * 0.54) / 500) * 500;
      return {
        currentPrice: current,
        strikePrice: current + 3500,
        savings: 3500,
        unitText: 'Setara Rp 19.500 / L',
      };
    }
    if (variant?.id === '5L') {
      const current = Math.round((numBase * 2.45) / 500) * 500;
      return {
        currentPrice: current,
        strikePrice: current + 12000,
        savings: 12000,
        unitText: 'Setara Rp 17.600 / L • Jerigen hemat',
      };
    }
    const current = numBase;
    return {
      currentPrice: current,
      strikePrice: current + 4500,
      savings: 4500,
      unitText: 'Setara Rp 18.000 / L • Pouch 2 L higienis',
    };
  }

  // Sembako Umum
  const mult = variant?.mult || 1.0;
  const current = Math.round((numBase * mult) / 500) * 500;
  const strikeMult = variant?.strikeMult || 1.12;
  const strike = Math.round((numBase * strikeMult) / 500) * 500;
  const savings = Math.max(0, strike - current);

  return {
    currentPrice: current,
    strikePrice: strike > current ? strike : null,
    savings: savings >= 1000 ? savings : null,
    unitText: variant?.unitText || 'Timbangan pas terjamin Toko Abah',
  };
}

// Hover Detail Kemasan Belakang & Informasi Nutrisi / Sertifikasi (Step 2)
function getProductNutritionAndCert(product = {}) {
  const text = ((product.nama || '') + ' ' + (product.kategori || '')).toLowerCase();

  if (text.includes('beras')) {
    return {
      cert: 'BPOM RI & Halal MUI',
      highlight: 'Bulir Super Pulen Alami',
      badge: 'Kemasan Belakang & Nutrisi',
      specs: [
        { label: 'Komposisi', val: '100% Beras Kepala Pilihan' },
        { label: 'Energi / 100g', val: '355 kkal' },
        { label: 'Karbohidrat', val: '78.5 g (Serat Alami)' },
        { label: 'Standar Mutu', val: 'Tanpa Pemutih / Pengawet' },
      ],
      sealText: 'Segel Pabrik Utuh & Timbangan Pas',
    };
  }

  if (text.includes('minyak')) {
    return {
      cert: 'SNI Teruji & Halal MUI',
      highlight: '2x Penyaringan Higienis',
      badge: 'Informasi Gizi & Mutu',
      specs: [
        { label: 'Bahan Baku', val: '100% Kelapa Sawit Segar' },
        { label: 'Kandungan', val: 'Kaya Vitamin A & E Alami' },
        { label: 'Kolesterol', val: '0 mg (Bebas Kolesterol)' },
        { label: 'Titik Asap', val: 'Tinggi & Minyak Bening' },
      ],
      sealText: 'Pouch Tebal Food Grade Anti Bocor',
    };
  }

  if (text.includes('gula')) {
    return {
      cert: 'SNI Murni & Halal LPPOM',
      highlight: 'Kristal Tebu Pilihan Nusantara',
      badge: 'Kemurnian & Komposisi',
      specs: [
        { label: 'Komposisi', val: '100% Sari Tebu Murni' },
        { label: 'Energi / 100g', val: '390 kkal' },
        { label: 'Pemanis Buatan', val: '0% (Murni Alami)' },
        { label: 'Standar Mutu', val: 'ICUMSA Food Grade' },
      ],
      sealText: 'Kemasan Rapat Tersegel Kedap Udara',
    };
  }

  if (text.includes('telur')) {
    return {
      cert: 'Veteriner Terverifikasi & Halal',
      highlight: 'Telur Ayam Ras Segar Panen Subuh',
      badge: 'Nutrisi Protein Tinggi',
      specs: [
        { label: 'Grade Kualitas', val: 'Grade A Cangkang Bersih' },
        { label: 'Protein / butir', val: '6.3 gram' },
        { label: 'Kandungan', val: 'Kolin, Zat Besi, Omega 3' },
        { label: 'Penyimpanan', val: 'Sejuk 14 hari / Kulkas 30 hari' },
      ],
      sealText: 'Jaminan Utuh Tanpa Retak Toko Abah',
    };
  }

  if (text.includes('mie')) {
    return {
      cert: 'BPOM RI MD & Halal MUI',
      highlight: 'Rempah Asli Nusantara',
      badge: 'Komposisi & Nilai Gizi',
      specs: [
        { label: 'Komposisi', val: 'Tepung Terigu, Minyak Nabati' },
        { label: 'Energi Total', val: '380 kkal' },
        { label: 'Waktu Masak', val: '3 Menit Air Mendidih' },
        { label: 'Legalitas', val: 'Izin Edar Resmi BPOM RI' },
      ],
      sealText: 'Karton & Bungkus Tersegel Rapih',
    };
  }

  return {
    cert: 'Terverifikasi Halal & BPOM',
    highlight: 'Kualitas Terjamin Toko Abah',
    badge: 'Detail Kemasan & Standar',
    specs: [
      { label: 'Kondisi', val: 'Baru & Tersegel Rapat' },
      { label: 'Kedaluwarsa', val: 'Aman & Terjamin Lama' },
      { label: 'Timbangan', val: 'Akurat 100% Terverifikasi' },
      { label: 'Jaminan', val: 'Garansi Retur Jika Cacat' },
    ],
    sealText: 'Produk Pilihan Keluarga Toko Abah',
  };
}

// Animasi Miniatur Melayang ke Ikon Keranjang (Step 5)
function triggerFlyToCart(sourceEl, imgUrl) {
  try {
    const targetEl =
      document.getElementById('katalog-header-cart-btn') ||
      document.querySelector('a[href*="keranjang"]') ||
      document.querySelector('.header-cart-btn');

    if (!sourceEl || !targetEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const particle = document.createElement('div');
    particle.className = 'katalog-flying-particle';
    particle.style.setProperty('--start-x', `${sourceRect.left + sourceRect.width / 2}px`);
    particle.style.setProperty('--start-y', `${sourceRect.top + sourceRect.height / 2}px`);
    particle.style.setProperty('--target-x', `${targetRect.left + targetRect.width / 2}px`);
    particle.style.setProperty('--target-y', `${targetRect.top + targetRect.height / 2}px`);

    if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = '';
      particle.appendChild(img);
    }

    document.body.appendChild(particle);

    setTimeout(() => {
      targetEl.classList.add('katalog-cart-bounce');
      setTimeout(() => {
        targetEl.classList.remove('katalog-cart-bounce');
      }, 600);
      particle.remove();
    }, 650);
  } catch (err) {
    // Graceful fallback
  }
}

function getProductDetailedDescription(product = {}) {
  const text = (product.nama || '').toLowerCase();
  if (text.includes('beras')) {
    return {
      deskripsi:
        'Beras kualitas super pilihan langsung dari sentra lumbung padi petani binaan Toko Abah. Memiliki bulir utuh, putih bersih alami tanpa pemutih sintetis, beraroma harum alami, dan menghasilkan nasi yang pulen gurih saat dimasak. Sangat cocok untuk kebutuhan konsumsi harian keluarga maupun katering dan warung makan.',
      spesifikasi: [
        { label: 'Berat Bersih', value: '5 kg / sak' },
        { label: 'Kualitas Bulir', value: 'Kepala Super Pulen (Derajat Sosoh 95%)' },
        { label: 'Asal Daerah', value: 'Banyuwangi & Lumajang Pilihan' },
        { label: 'Sertifikasi', value: 'KEMTAN & Bebas Pengawet / Pemutih' },
        { label: 'Penyimpanan', value: 'Simpan di wadah kering, rapat & terlindung dari serangga' },
      ],
    };
  }
  if (text.includes('minyak')) {
    return {
      deskripsi:
        'Minyak goreng sawit kelapa pilihan bermutu premium yang diproses dengan teknologi 2x penyaringan higienis. Menghasilkan warna minyak jernih, tahan panas, tidak mudah menghitam, serta membuat aneka gorengan lebih garing, renyah, dan lezat tanpa kolesterol berlebih.',
      spesifikasi: [
        { label: 'Isi Bersih', value: '2 Liter (Pouch Higienis)' },
        { label: 'Kandungan', value: 'Kaya Vitamin A, D, & Omega 9 Alami' },
        { label: 'Bahan Baku', value: '100% Buah Sawit Kelapa Segar Nusantara' },
        { label: 'Standar Mutu', value: 'SNI Terverifikasi & Halal LPPOM MUI' },
        { label: 'Keunggulan', value: 'Minyak bening, titik asap tinggi, hemat pemakaian' },
      ],
    };
  }
  if (text.includes('gula')) {
    return {
      deskripsi:
        'Gula pasir kristal putih murni higienis yang dihasilkan dari tebu segar pilihan petani Indonesia. Kristal gula halus hingga sedang, mudah larut dalam minuman dingin maupun panas, dan memberikan rasa manis murni alami tanpa aftertaste getir atau pengawet kimia.',
      spesifikasi: [
        { label: 'Berat Bersih', value: '1 kg kemasan pack' },
        { label: 'Bahan Baku', value: '100% Sari Tebu Murni Nusantara' },
        { label: 'Kemasan', value: 'Plastik Polietilena Rapat Food-Grade Tebal' },
        { label: 'Tingkat Kemurnian', value: 'ICUMSA Standard Food Grade' },
        { label: 'Masa Simpan', value: '24 Bulan dalam wadah tertutup' },
      ],
    };
  }
  if (text.includes('telur')) {
    return {
      deskripsi:
        'Telur ayam ras segar pilihan yang dipasok langsung setiap subuh dari peternakan terverifikasi di Jawa Timur. Telur diseleksi ketat satu per satu untuk menjamin cangkang utuh bersih, kuning telur kental bulat, serta bebas bakteri berbahaya demi asupan protein terbaik keluarga.',
      spesifikasi: [
        { label: 'Satuan Jual', value: '1 Tray (~30 butir / berat berkisar 1.8 - 1.9 kg)' },
        { label: 'Kondisi Cangkang', value: 'Cokelat Bersih, Tebal & Tidak Retak' },
        { label: 'Grade Kualitas', value: 'Grade A Segar Panen Hari Ini' },
        { label: 'Kandungan Gizi', value: 'Tinggi Protein, Kolin, Asam Folat & Zat Besi' },
        { label: 'Penyimpanan', value: 'Suhu ruangan 14 hari / Lemari pendingin s/d 30 hari' },
      ],
    };
  }
  if (text.includes('mie')) {
    return {
      deskripsi:
        'Mie instan terfavorit masyarakat Indonesia dengan tekstur mie yang kenyal, gurih, dan dipadukan bumbu rempah otentik pilihan. Praktis dihidangkan hanya dalam waktu 3 menit untuk sarapan kilat, camilan malam, maupun bekal praktis keluarga.',
      spesifikasi: [
        { label: 'Berat Bersih', value: '85 gram / bungkus' },
        { label: 'Komposisi Utama', value: 'Tepung Terigu Pilihan, Minyak Nabati & Rempah' },
        { label: 'Waktu Rebus', value: '3 Menit pada air mendidih' },
        { label: 'Kemasan', value: 'Aluminium Foil Seal Kedap Udara' },
        { label: 'Legalitas', value: 'BPOM RI & Halal MUI' },
      ],
    };
  }
  if (text.includes('kopi')) {
    return {
      deskripsi:
        'Paduan racikan biji kopi robusta pilihan dengan gula pasir alami berpadu pas menghadirkan aroma wangi semerbak dan sensasi rasa mantap. Memberikan suntikan semangat berenergi saat memulai aktivitas di pagi hari.',
      spesifikasi: [
        { label: 'Isi Paket', value: '1 Renceng (10 Sachet @ 25 gram)' },
        { label: 'Komposisi', value: 'Biji Kopi Sangrai Halus + Gula Murni' },
        { label: 'Penyajian', value: 'Seduh dengan 150ml air mendidih' },
        { label: 'Kemasan', value: 'Sachet Praktis Anti Lembab' },
      ],
    };
  }
  return {
    deskripsi:
      product.deskripsi ||
      'Produk sembako segar dan kebutuhan pokok berkualitas terpercaya dari Toko Abah. Selalu diperiksa tanggal kedaluwarsa dan keutuhan kemasan sebelum dikirim ke tangan pelanggan setia kami.',
    spesifikasi: [
      { label: 'Kategori', value: product.kategori || 'Sembako Pokok' },
      { label: 'Kondisi Barang', value: 'Baru, Tersegel Rapih & Bersih' },
      { label: 'Jaminan Toko', value: 'Garansi Timbangan Pas & Barang Segar' },
      { label: 'Lokasi Pengiriman', value: 'Gudang Toko Abah, Jl. Raya Telang-Kamal' },
    ],
  };
}

function getCategoryIcon(catName = '') {
  const c = String(catName).toLowerCase();
  if (!catName || c === 'semua') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="4" y="4" width="4" height="4" rx="1.2" />
        <rect x="10" y="4" width="4" height="4" rx="1.2" />
        <rect x="16" y="4" width="4" height="4" rx="1.2" />
        <rect x="4" y="10" width="4" height="4" rx="1.2" />
        <rect x="10" y="10" width="4" height="4" rx="1.2" />
        <rect x="16" y="10" width="4" height="4" rx="1.2" />
        <rect x="4" y="16" width="4" height="4" rx="1.2" />
        <rect x="10" y="16" width="4" height="4" rx="1.2" />
        <rect x="16" y="16" width="4" height="4" rx="1.2" />
      </svg>
    );
  }
  if (c.includes('beras') || c.includes('tepung') || c.includes('sembako')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20" />
        <path d="M12 5c2-2 5-2 6 1s-2 5-6 4" />
        <path d="M12 5c-2-2-5-2-6 1s2 5 6 4" />
        <path d="M12 10c2-2 5-2 6 1s-2 5-6 4" />
        <path d="M12 10c-2-2-5-2-6 1s2 5 6 4" />
        <path d="M12 15c2-2 5-2 6 1s-2 5-6 4" />
        <path d="M12 15c-2-2-5-2-6 1s2 5 6 4" />
      </svg>
    );
  }
  if (c.includes('minyak') || c.includes('bumbu')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2h4" />
        <path d="M10 4h4" />
        <path d="M12 4v3" />
        <rect x="7" y="7" width="10" height="14" rx="2.5" />
        <path d="M12 11c-1.2 1.5-1.8 2.3-1.8 3.2a1.8 1.8 0 0 0 3.6 0c0-.9-.6-1.7-1.8-3.2z" fill="currentColor" />
      </svg>
    );
  }
  if (c.includes('gula') || c.includes('pemanis')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" />
        <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
        <circle cx="7.5" cy="14" r="1.2" fill="currentColor" />
        <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="12.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (c.includes('telur') || c.includes('lauk')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2C7.5 2 4.5 7.5 4.5 14c0 4.2 3.4 7.5 7.5 7.5s7.5-3.3 7.5-7.5C19.5 7.5 16.5 2 12 2z" />
        <path d="M14.5 8.5a3.5 3.5 0 0 0-3-2.5" />
      </svg>
    );
  }
  if (c.includes('instan') || c.includes('mie')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12h18a1 1 0 0 1 1 1 9 9 0 0 1-9 9 9 9 0 0 1-9-9 1 1 0 0 1 1-1z" />
        <line x1="8" y1="22" x2="16" y2="22" strokeWidth="2.5" />
        <path d="M8 8V4" />
        <path d="M12 7V3" />
        <path d="M16 8V4" />
        <line x1="2" y1="9" x2="22" y2="9" strokeWidth="1.8" />
      </svg>
    );
  }
  if (c.includes('minuman') || c.includes('kopi') || c.includes('teh')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z" />
        <line x1="6" y1="2" x2="6" y2="5" />
        <line x1="10" y1="2" x2="10" y2="5" />
        <line x1="14" y1="2" x2="14" y2="5" />
        <line x1="2" y1="21" x2="18" y2="21" strokeWidth="2" />
      </svg>
    );
  }
  if (c.includes('rumah') || c.includes('sabun')) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="9" width="12" height="12" rx="2.5" />
        <path d="M12 9V5" />
        <path d="M9 5h6" />
        <path d="M15 5l-2-2" />
        <circle cx="12" cy="15" r="1.8" fill="currentColor" />
        <path d="M19 4l.5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5L19 4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function CatalogPage() {
  const { addItem, removeItem, setJumlah, items } = useCart();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');

  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  // States Khusus Makeover Katalog Produk
  const [selectedVariants, setSelectedVariants] = useState({});
  const [addedFeedback, setAddedFeedback] = useState({});
  const [toastUndo, setToastUndo] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('toko_abah_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  // Aksesibilitas: Tutup modal saat tombol ESC ditekan
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
      }
    }
    if (selectedProduct) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  // 1. Muat kategori
  useEffect(() => {
    catalogService
      .categories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // 2. Debounce pencarian 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 3. Muat daftar produk
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    catalogService
      .list({ search, kategori, page, limit: LIMIT })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data || []);
        setTotal(res.pagination?.total ?? (res.data || []).length);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, kategori, page]);

  // Timer auto dismiss Toast Undo
  useEffect(() => {
    if (!toastUndo?.open) return undefined;
    const timer = setTimeout(() => {
      setToastUndo(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastUndo]);

  function handleSelectVariant(e, productId, variantId) {
    e.stopPropagation();
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  }

  function toggleWishlist(e, productId) {
    e.stopPropagation();
    setWishlist((prev) => {
      const isFavorited = prev.includes(productId);
      const updated = isFavorited ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('toko_abah_wishlist', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }

  function handleAddWithVariant(e, product, variant, pricing) {
    if (e) e.stopPropagation();
    if (product.stok <= 0) return;

    // Catat jumlah sebelumnya untuk fitur Undo
    const existingInCart = items.find((it) => it.id === product.id);
    const prevQty = existingInCart ? existingInCart.jumlah : 0;

    const itemToAdd = {
      ...product,
      id: product.id,
      nama: variant?.label ? `${product.nama} (${variant.label})` : product.nama,
      harga: pricing.currentPrice,
      stok: product.stok,
    };

    const res = addItem(itemToAdd, 1);

    if (res === 'ok') {
      // 1. Animasi miniatur melayang ke header cart
      const imgUrl = getProductImage(product);
      triggerFlyToCart(e?.currentTarget, imgUrl);

      // 2. Feedback tombol 'Ditambahkan'
      setAddedFeedback((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedFeedback((prev) => ({ ...prev, [product.id]: false }));
      }, 1800);

      // 3. Tampilkan Toast Undo di bagian bawah
      setToastUndo({
        open: true,
        text: `"${itemToAdd.nama}" ditambahkan ke keranjang`,
        productId: product.id,
        prevQty,
        isCancelled: false,
      });
    } else if (res === 'max') {
      setToastUndo({
        open: true,
        text: 'Jumlah di keranjang sudah mencapai stok maksimum',
        isCancelled: true,
      });
    }
  }

  function handleUndoAdd() {
    if (!toastUndo?.productId) return;
    if (toastUndo.prevQty > 0) {
      setJumlah(toastUndo.productId, toastUndo.prevQty);
    } else {
      removeItem(toastUndo.productId);
    }
    setToastUndo({
      open: true,
      text: 'Penambahan barang berhasil dibatalkan',
      isCancelled: true,
    });
    setTimeout(() => {
      setToastUndo(null);
    }, 2200);
  }

  function chooseCategory(value) {
    setKategori(value);
    setPage(1);
  }

  // Pengurutan lokal produk
  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.harga || 0) - Number(b.harga || 0);
    if (sortBy === 'price-desc') return Number(b.harga || 0) - Number(a.harga || 0);
    if (sortBy === 'stock-desc') return Number(b.stok || 0) - Number(a.stok || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="katalog-page-container">
      {/* 1. Hero Feature Banner */}
      <section className="katalog-hero-banner">
        <div className="katalog-hero-bg-wrapper" aria-hidden="true">
          <img src={screenImg} alt="Sembako Toko Abah" className="katalog-hero-bg-img" />
          <div className="katalog-hero-bg-overlay" />
        </div>

        <div className="katalog-hero-blur-1" aria-hidden="true" />
        <div className="katalog-hero-blur-2" aria-hidden="true" />

        <div className="katalog-hero-content">
          <div className="katalog-hero-pill">
            <span className="katalog-hero-pulse" aria-hidden="true" />
            <span>SEMBAKO PILIHAN KELUARGA &amp; WARUNG</span>
          </div>

          <h1 className="katalog-hero-title">
            Penuhi Kebutuhan Pokok Harian dengan Harga Grosir Terbaik
          </h1>

          <p className="katalog-hero-desc">
            Beras pulen, minyak goreng higienis, gula pasir, dan aneka sembako langsung diantar cepat dan timbangan pas 100% dari Jalan Raya Telang-Kamal.
          </p>

          <div className="katalog-hero-price-tag">
            <span style={{ color: 'rgba(209, 250, 229, 0.8)' }}>Mulai</span>
            <span className="katalog-hero-price-val">Rp 72.500 / sak</span>
            <span style={{ color: 'rgba(209, 250, 229, 0.75)', fontSize: 12 }}>(Beras Premium Pulen 5 kg)</span>
          </div>

          <div className="katalog-hero-actions">
            <a href="#katalog-grid" className="katalog-hero-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Belanja Sekarang</span>
            </a>
            <div className="katalog-hero-badge-tag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Timbangan Tersegel &amp; Pas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bar Kategori Bulat */}
      <section className="katalog-category-card">
        <div className="katalog-category-header">
          <h3>Kategori Belanja</h3>
          <span>Pilih kategori untuk memfilter</span>
        </div>

        <div className="katalog-category-strip-wrapper">
          <div className="katalog-category-strip" role="group" aria-label="Filter Kategori">
            <button
              type="button"
              className="katalog-category-chip"
              onClick={() => chooseCategory('')}
              aria-pressed={kategori === ''}
            >
              <div className={`katalog-chip-circle${kategori === '' ? ' active' : ''}`}>
                {getCategoryIcon('semua')}
              </div>
              <span className={`katalog-chip-label${kategori === '' ? ' active' : ''}`}>Semua</span>
            </button>

            {categories.map((c) => {
              const name = c.nama ?? c;
              const isSelected = kategori === name;
              return (
                <button
                  key={name}
                  type="button"
                  className="katalog-category-chip"
                  onClick={() => chooseCategory(name)}
                  aria-pressed={isSelected}
                >
                  <div className={`katalog-chip-circle${isSelected ? ' active' : ''}`}>
                    {getCategoryIcon(name)}
                  </div>
                  <span className={`katalog-chip-label${isSelected ? ' active' : ''}`}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Kartu Promo Highlight */}
      <section className="katalog-promo-row">
        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#ea580c' }}>PROMO MINGGU INI</span>
            <h4 className="katalog-promo-title">Hemat Hingga 20%</h4>
            <p className="katalog-promo-desc">Minyak Goreng Sawit 2 L, kemasan pouch higienis.</p>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1B5E20' }}>Rp 36.000</span>
              <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>Rp 45.000</span>
            </div>
          </div>
          <div className="katalog-promo-img-wrap">
            <img src={minyakImg} alt="Minyak Goreng" className="katalog-promo-img" />
          </div>
        </div>

        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#1B5E20' }}>KUALITAS TERJAMIN</span>
            <h4 className="katalog-promo-title">Stok Segar Setiap Hari</h4>
            <p className="katalog-promo-desc">Telur Ayam Ras &amp; Beras Setra langsung dari pemasok.</p>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1B5E20', background: '#e8f5e9', padding: '2px 8px', borderRadius: 4 }}>
                Grade A Pasar
              </span>
            </div>
          </div>
          <div className="katalog-promo-img-wrap">
            <img src={telurImg} alt="Telur Ayam" className="katalog-promo-img" />
          </div>
        </div>

        <div className="katalog-promo-card">
          <div className="katalog-promo-info">
            <span className="katalog-promo-tag" style={{ color: '#0284c7' }}>ANTAR CEPAT</span>
            <h4 className="katalog-promo-title">Gratis Ongkir Toko</h4>
            <p className="katalog-promo-desc">Khusus radius 3 km dengan minimal belanja Rp 100.000.</p>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
                Sampai 30 Menit
              </span>
            </div>
          </div>
          <div className="katalog-promo-icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6h4l3 6.5-1.5 1h-2" />
              <path d="M9 17h6" />
              <path d="M12 9l-3 8" />
            </svg>
          </div>
        </div>
      </section>

      {/* 4. Bar Penawaran Hari Ini / Pencarian & Filter */}
      <section className="katalog-filter-header-bar" id="katalog-grid">
        <div className="katalog-deals-title-wrap">
          <h2 className="katalog-deals-title">Katalog Produk Sembako</h2>
          <div className="katalog-timer-badge">
            <span>Harga Promo Berakhir:</span>
            <span className="katalog-timer-digits">06:15:48</span>
          </div>
        </div>

        <div className="katalog-search-filter-wrap">
          <div className="katalog-search-box">
            <span className="katalog-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="katalog-search-input"
              placeholder="Cari beras, minyak, gula..."
              aria-label="Cari produk"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="katalog-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan produk"
          >
            <option value="popular">Urutkan: Paling Populer</option>
            <option value="price-asc">Harga Termurah</option>
            <option value="price-desc">Harga Tertinggi</option>
            <option value="stock-desc">Stok Tersedia</option>
          </select>
        </div>
      </section>

      {/* Toast Feedback Undo di Bawah Layar (Step 5) */}
      {toastUndo?.open && (
        <div className="katalog-toast-undo" role="status" aria-live="polite">
          <div className="katalog-toast-undo-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="katalog-toast-undo-text">{toastUndo.text}</span>
          </div>
          {!toastUndo.isCancelled && (
            <button
              type="button"
              className="katalog-toast-undo-btn"
              onClick={handleUndoAdd}
              aria-label="Batalkan penambahan ke keranjang"
            >
              Batalkan
            </button>
          )}
        </div>
      )}

      {/* Pesan Kesalahan */}
      {error && (
        <div className="katalog-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* 5. Grid Produk dengan Skeleton Loading (Step 6) & Desain Baru */}
      {loading ? (
        <div className="katalog-product-grid" aria-busy="true" aria-label="Memuat katalog sembako...">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="katalog-product-card katalog-skeleton-card">
              <div className="katalog-skeleton-img-box" />
              <div className="katalog-skeleton-body">
                <div className="katalog-skeleton-line short" />
                <div className="katalog-skeleton-line title" />
                <div className="katalog-skeleton-line rating" />
                <div className="katalog-skeleton-pills-row">
                  <div className="katalog-skeleton-pill" />
                  <div className="katalog-skeleton-pill" />
                  <div className="katalog-skeleton-pill" />
                </div>
                <div className="katalog-skeleton-price-row">
                  <div className="katalog-skeleton-line price" />
                  <div className="katalog-skeleton-line savings" />
                </div>
                <div className="katalog-skeleton-btn" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedRows.length === 0 ? (
        <p className="katalog-muted">Produk sembako tidak ditemukan.</p>
      ) : (
        <>
          <div className="katalog-product-grid">
            {sortedRows.map((p) => {
              const soldOut = p.stok <= 0;
              const productImg = getProductImage(p);
              const social = getProductSocialProof(p);
              const variants = getProductVariants(p);
              const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
              const activeVariantId = selectedVariants[p.id] || defaultVariant.id;
              const activeVariant = variants.find((v) => v.id === activeVariantId) || defaultVariant;
              const pricing = calculateVariantPricing(p.harga, activeVariant, p.nama);
              const nutrition = getProductNutritionAndCert(p);
              const isWishlisted = wishlist.includes(p.id);
              const isJustAdded = !!addedFeedback[p.id];

              return (
                <div
                  key={p.id}
                  className={`katalog-product-card${soldOut ? ' sold-out' : ''}`}
                  onClick={() => {
                    setSelectedProduct(p);
                    setModalQty(1);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProduct(p);
                      setModalQty(1);
                    }
                  }}
                  aria-label={`Lihat detail ${p.nama}`}
                >
                  {/* Container Gambar Produk dengan Background Krem Hangat #F7F5F0 (Step 1) */}
                  <div className="katalog-image-wrapper cream-bg">
                    {/* Badge Kategori */}
                    <span className="katalog-badge-cat">{p.kategori || 'Sembako'}</span>

                    {/* Tombol Ikon Wishlist / Favorit (Step 2) */}
                    <button
                      type="button"
                      className={`katalog-wishlist-btn${isWishlisted ? ' active' : ''}`}
                      onClick={(e) => toggleWishlist(e, p.id)}
                      aria-label={isWishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? '#ef4444' : 'none'}
                        stroke={isWishlisted ? '#ef4444' : '#4b5563'}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Gambar Produk */}
                    <img
                      src={productImg}
                      alt={p.nama}
                      className={`katalog-product-img${soldOut ? ' grayscale' : ''}`}
                      loading="lazy"
                    />

                    {/* Status Stok */}
                    <span className={`katalog-badge-stock ${soldOut ? 'sold-out' : 'available'}`}>
                      <span className="katalog-badge-dot" aria-hidden="true" />
                      {soldOut ? 'Stok Habis' : `Tersedia ${p.stok}`}
                    </span>

                    {/* Hover Overlay: Detail Kemasan Belakang & Informasi Nutrisi / Sertifikasi (Step 2) */}
                    <div className="katalog-nutrition-overlay" aria-hidden="true">
                      <div className="katalog-nutri-header">
                        <span className="katalog-nutri-badge">{nutrition.badge}</span>
                        <span className="katalog-nutri-cert">{nutrition.cert}</span>
                      </div>
                      <p className="katalog-nutri-highlight">{nutrition.highlight}</p>
                      <div className="katalog-nutri-specs">
                        {nutrition.specs.map((item, i) => (
                          <div key={i} className="katalog-nutri-spec-row">
                            <span className="katalog-nutri-spec-k">{item.label}</span>
                            <span className="katalog-nutri-spec-v">{item.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="katalog-nutri-footer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>{nutrition.sealText}</span>
                      </div>
                    </div>

                    {/* Quick Button Hover Tambah ke Keranjang Desktop (Step 2) */}
                    {!soldOut && (
                      <div className="katalog-image-hover-action">
                        <button
                          type="button"
                          className={`katalog-quick-hover-btn${isJustAdded ? ' success' : ''}`}
                          onClick={(e) => handleAddWithVariant(e, p, activeVariant, pricing)}
                          aria-label={`Tambah ${p.nama} (${activeVariant.label})`}
                        >
                          {isJustAdded ? (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Ditambahkan</span>
                            </>
                          ) : (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                              <span>+ Cepat ({activeVariant.label})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Kartu Produk */}
                  <div className="katalog-card-body">
                    <div className="katalog-card-meta">
                      {/* Judul Produk Rapi & Berwarna Gelap (Step 1) */}
                      <h3 className="katalog-card-title">{p.nama}</h3>

                      {/* Social Proof: Rating Bintang, Ulasan & Terjual (Step 3) */}
                      <div className="katalog-social-proof-row">
                        <div className="katalog-stars-pill">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" aria-hidden="true">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span className="katalog-stars-score">{social.rating}</span>
                          <span className="katalog-reviews-count">({social.reviewText})</span>
                        </div>
                        <span className="katalog-social-divider">•</span>
                        <span className="katalog-sold-proof">{social.soldBadge}</span>
                      </div>

                      {/* Pilih Varian Kemasan di Tempat berupa Pill Buttons (Step 4) */}
                      <div className="katalog-variant-pills-section" onClick={(e) => e.stopPropagation()}>
                        <span className="katalog-variant-label">Pilih Ukuran:</span>
                        <div className="katalog-variant-pills" role="radiogroup" aria-label="Pilih varian kemasan">
                          {variants.map((v) => {
                            const isSelected = v.id === activeVariant.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                className={`katalog-variant-pill${isSelected ? ' active' : ''}`}
                                onClick={(e) => handleSelectVariant(e, p.id, v.id)}
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={`Varian kemasan ${v.label}`}
                              >
                                {v.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Framing & Visual Hierarchy (Step 1 & Step 3) */}
                      <div className="katalog-price-section">
                        <div className="katalog-price-main-row">
                          {/* Harga Utama Terbesar & Paling Tebal */}
                          <span className="katalog-card-price">
                            {formatRupiah(pricing.currentPrice)}
                          </span>

                          {/* Harga Coret */}
                          {pricing.strikePrice && (
                            <span className="katalog-price-strikethrough">
                              {formatRupiah(pricing.strikePrice)}
                            </span>
                          )}

                          {/* Badge Hemat Nominal Rupiah */}
                          {pricing.savings && (
                            <span className="katalog-savings-badge">
                              Hemat {formatRupiah(pricing.savings)}
                            </span>
                          )}
                        </div>

                        {/* Keterangan Harga Satuan per kg/liter / Grosir */}
                        <div className="katalog-unit-price-note">
                          <span>{pricing.unitText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol CTA Tambah ke Keranjang dengan Warna Zamrud Hangat #1B5E20 (Step 1 & Step 5) */}
                    <button
                      type="button"
                      className={`katalog-btn-card${soldOut ? ' disabled' : ''}${isJustAdded ? ' success' : ''}`}
                      onClick={(e) => handleAddWithVariant(e, p, activeVariant, pricing)}
                      disabled={soldOut}
                      aria-label={
                        isJustAdded
                          ? `${p.nama} ditambahkan`
                          : soldOut
                          ? 'Stok habis'
                          : `Tambah ${p.nama} (${activeVariant.label}) ke keranjang`
                      }
                    >
                      {soldOut ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Stok Habis</span>
                        </>
                      ) : isJustAdded ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Ditambahkan</span>
                        </>
                      ) : (
                        <>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          <span>Tambah ke Keranjang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Paginasi & Statistik */}
          <div className="katalog-pagination-bar">
            <div className="katalog-pagination-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Menampilkan {rows.length} dari {total} produk sembako</span>
            </div>

            <div className="katalog-pagination-controls">
              <button
                type="button"
                className="katalog-page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span className="katalog-page-info">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                className="katalog-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </>
      )}

      {/* 7. WhatsApp Special Order Help Banner */}
      <section className="katalog-help-banner">
        <div className="katalog-help-left">
          <div className="katalog-help-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="katalog-help-text">
            <h2>Tidak menemukan sembako yang dicari?</h2>
            <p>Hubungi Abah via WhatsApp untuk pesan barang khusus partai besar atau pengadaan acara arisan.</p>
          </div>
        </div>
        <a
          className="katalog-help-btn"
          href="https://wa.me/6285708350575?text=Halo%20Abah,%20saya%20mau%20tanya%20produk%20sembako%20khusus"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Hubungi WhatsApp Abah</span>
        </a>
      </section>

      {/* 8. Modal Pop-up Detail & Deskripsi Produk */}
      {selectedProduct && (
        <div
          className="katalog-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
        >
          <div
            className="katalog-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup X */}
            <button
              type="button"
              className="katalog-modal-close-btn"
              onClick={() => setSelectedProduct(null)}
              aria-label="Tutup jendela detail produk"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="katalog-modal-body">
              {/* Kolom Kiri: Gambar & Badge Trust */}
              <div className="katalog-modal-image-col">
                <div className="katalog-modal-img-wrap cream-bg">
                  <img
                    src={getProductImage(selectedProduct)}
                    alt={selectedProduct.nama}
                    className="katalog-modal-img"
                  />
                  <span className="katalog-modal-img-badge">
                    {selectedProduct.kategori || 'Sembako'}
                  </span>
                </div>

                <div className="katalog-modal-trust-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <div>
                    <span className="katalog-modal-trust-title">Jaminan Mutu Toko Abah</span>
                    <span className="katalog-modal-trust-sub">100% Produk Asli &amp; Timbangan Akurat</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Detail, Deskripsi & Interaksi Tambah */}
              <div className="katalog-modal-info-col">
                <div className="katalog-modal-header-meta">
                  <span className="katalog-modal-sku">SKU: TKB-{String(selectedProduct.id).padStart(3, '0')}</span>
                  <span className={`katalog-modal-stock-badge ${selectedProduct.stok > 0 ? 'available' : 'sold-out'}`}>
                    <span className="katalog-badge-dot" aria-hidden="true" />
                    {selectedProduct.stok > 0 ? `Tersedia: ${selectedProduct.stok} unit` : 'Stok Habis'}
                  </span>
                </div>

                <h2 id="modal-product-title" className="katalog-modal-title">
                  {selectedProduct.nama}
                </h2>

                {/* Rating & Terjual */}
                <div className="katalog-modal-rating-row">
                  <div className="katalog-modal-stars" aria-label="Rating 4.9 dari 5 bintang">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="katalog-modal-rating-score">4.9</span>
                  </div>
                  <span className="katalog-modal-divider">•</span>
                  <span className="katalog-modal-sold-text">{getProductSocialProof(selectedProduct).soldBadge}</span>
                </div>

                {/* Harga Resmi & Framing */}
                <div className="katalog-modal-price-box">
                  <div className="katalog-modal-price-row">
                    <span className="katalog-modal-price-val">{formatRupiah(selectedProduct.harga)}</span>
                    <span className="katalog-modal-price-unit">{getProductUnit(selectedProduct)}</span>
                  </div>
                  <p className="katalog-modal-price-note">
                    Harga grosir &amp; eceran terbaik di Telang-Kamal, Bangkalan • Garansi timbangan akurat
                  </p>
                </div>

                {/* Deskripsi Barang Terperinci */}
                <div className="katalog-modal-desc-section">
                  <h4 className="katalog-modal-section-title">Deskripsi Produk</h4>
                  <p className="katalog-modal-desc-p">
                    {getProductDetailedDescription(selectedProduct).deskripsi}
                  </p>
                </div>

                {/* Spesifikasi Teknis */}
                <div className="katalog-modal-specs-section">
                  <h4 className="katalog-modal-section-title">Spesifikasi &amp; Detail Kemasan</h4>
                  <div className="katalog-modal-specs-grid">
                    {getProductDetailedDescription(selectedProduct).spesifikasi.map((spec, i) => (
                      <div key={i} className="katalog-modal-spec-item">
                        <span className="katalog-modal-spec-label">{spec.label}</span>
                        <span className="katalog-modal-spec-val">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengaturan Kuantitas & Tombol Tambah */}
                <div className="katalog-modal-action-box">
                  <div className="katalog-modal-qty-row">
                    <span className="katalog-modal-qty-label">Jumlah Pembelian:</span>
                    <div className="katalog-modal-stepper">
                      <button
                        type="button"
                        className="katalog-modal-step-btn"
                        disabled={modalQty <= 1}
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        aria-label="Kurangi jumlah"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.stok}
                        value={modalQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setModalQty(Math.min(Math.max(1, val), Math.max(1, selectedProduct.stok)));
                          }
                        }}
                        className="katalog-modal-step-input"
                        aria-label="Jumlah beli"
                      />
                      <button
                        type="button"
                        className="katalog-modal-step-btn"
                        disabled={modalQty >= selectedProduct.stok || selectedProduct.stok <= 0}
                        onClick={() => setModalQty((q) => Math.min(selectedProduct.stok, q + 1))}
                        aria-label="Tambah jumlah"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                    <div className="katalog-modal-subtotal-block">
                      <span className="katalog-modal-subtotal-label">Subtotal:</span>
                      <span className="katalog-modal-subtotal-val">
                        {formatRupiah(selectedProduct.harga * modalQty)}
                      </span>
                    </div>
                  </div>

                  <div className="katalog-modal-buttons-row">
                    <button
                      type="button"
                      className="katalog-modal-add-cart-btn"
                      disabled={selectedProduct.stok <= 0}
                      onClick={(e) => {
                        const pricing = { currentPrice: selectedProduct.harga };
                        handleAddWithVariant(e, selectedProduct, null, pricing);
                        setSelectedProduct(null);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      <span>
                        {selectedProduct.stok <= 0
                          ? 'Stok Habis'
                          : `Masukkan Keranjang (${modalQty}) • ${formatRupiah(selectedProduct.harga * modalQty)}`}
                      </span>
                    </button>

                    <a
                      href={`https://wa.me/6285708350575?text=Halo%20Abah,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(selectedProduct.nama)}%20(Harga%20${encodeURIComponent(formatRupiah(selectedProduct.harga))}).%20Apakah%20stok%20masih%20siap%20kirim?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="katalog-modal-wa-btn"
                      aria-label="Tanya produk via WhatsApp"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Tanya WA</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
