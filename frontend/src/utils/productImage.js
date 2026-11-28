import berasImg from '../assets/Beras.jpg';
import minyakImg from '../assets/Minyak-Goreng.jpg';
import gulaImg from '../assets/Gula-Pasir.jpg';
import telurImg from '../assets/Telur Ayam.jpg';
import mieImg from '../assets/Mie-Instan.jpg';
import kopiImg from '../assets/Kopi-Sachet.jpg';
import storeBannerImg from '../assets/store-banner.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveProductPhotoUrl(fotoProduk) {
  if (!fotoProduk || typeof fotoProduk !== 'string') return null;
  const trimmed = fotoProduk.trim();
  if (!trimmed) return null;
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${BACKEND_ORIGIN}${trimmed}`;
  return trimmed;
}

export function getFallbackProductImage(nama = '', kategori = '', defaultImage = null) {
  const text = `${nama || ''} ${kategori || ''}`.toLowerCase();
  if (text.includes('beras') || text.includes('gandum') || text.includes('tepung')) return berasImg;
  if (text.includes('minyak') || text.includes('goreng') || text.includes('mentega') || text.includes('margarin')) return minyakImg;
  if (text.includes('gula') || text.includes('manis') || text.includes('pemanis')) return gulaImg;
  if (text.includes('telur') || text.includes('lauk') || text.includes('protein')) return telurImg;
  if (text.includes('mie') || text.includes('indomie') || text.includes('instan') || text.includes('sedap')) return mieImg;
  if (text.includes('kopi') || text.includes('teh') || text.includes('kapal')) return kopiImg;
  if (text.includes('sabun') || text.includes('kebersihan') || text.includes('rumah')) return storeBannerImg;
  return defaultImage;
}

export function getProductImage(product = {}, { defaultImage = null } = {}) {
  const uploadedUrl = resolveProductPhotoUrl(product?.foto_produk);
  if (uploadedUrl) return uploadedUrl;
  return getFallbackProductImage(product?.nama, product?.kategori, defaultImage);
}

export { berasImg, storeBannerImg };
