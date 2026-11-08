import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    productService
      .categories()
      .then((res) => {
        if (res && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        setFormError(err.message || 'Gagal memuat daftar kategori');
      });
  }, []);

  async function handleSubmit(values) {
    setSubmitting(true);
    setServerErrors({});
    setFormError('');

    const payload = {
      nama: values.nama.trim(),
      kategori: values.kategori,
      harga: Number(values.harga),
      berat: Number(values.berat),
      stok: Number(values.stok),
    };

    if (values.batas_stok_kritis !== '' && values.batas_stok_kritis !== null && values.batas_stok_kritis !== undefined) {
      payload.batas_stok_kritis = Number(values.batas_stok_kritis);
    }

    try {
      await productService.create(payload);
      navigate('/produk', { state: { pesan: 'Produk berhasil ditambahkan' } });
    } catch (err) {
      if (err.status === 422) {
        setServerErrors(err.errors || {});
      } else {
        setFormError(err.message || 'Terjadi kesalahan saat menyimpan produk');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProductForm
      categories={categories}
      errors={serverErrors}
      formError={formError}
      submitting={submitting}
      showStock={true}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/produk')}
      user={user}
    />
  );
}
