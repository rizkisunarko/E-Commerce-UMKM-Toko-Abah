import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
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

    productService
      .get(id)
      .then((res) => {
        if (res && res.data) {
          setProduct(res.data);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setFormError(err.message || 'Gagal memuat data produk');
        }
      });
  }, [id]);

  async function handleSubmit(values) {
    setSubmitting(true);
    setServerErrors({});
    setFormError('');

    const payload = {
      nama: values.nama.trim(),
      kategori: values.kategori,
      harga: Number(values.harga),
      berat: Number(values.berat),
    };

    if (values.batas_stok_kritis !== '' && values.batas_stok_kritis !== null && values.batas_stok_kritis !== undefined) {
      payload.batas_stok_kritis = Number(values.batas_stok_kritis);
    }

    try {
      const res = await productService.update(id, payload);
      const namaProduk = res?.data?.nama || payload.nama;
      navigate('/produk', {
        state: {
          sukses: true,
          judul: 'Perubahan Produk Berhasil Disimpan!',
          pesan: `Data dan harga produk "${namaProduk}" telah berhasil diperbarui di katalog Toko Abah.`,
        },
      });
    } catch (err) {
      if (err.status === 422) {
        setServerErrors(err.errors || {});
      } else {
        setFormError(err.message || 'Gagal menyimpan perubahan produk');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Produk tidak ditemukan</h1>
        <p className="muted" style={{ marginBottom: '20px' }}>Produk dengan ID {id} tidak ditemukan di katalog Toko Abah.</p>
        <Link to="/produk" className="btn btn-primary">Kembali ke Daftar Produk</Link>
      </div>
    );
  }

  if (!product) {
    return formError ? (
      <div className="alert-error" role="alert" style={{ margin: 24 }}>
        {formError}
      </div>
    ) : (
      <p className="muted" style={{ padding: 24 }}>
        Memuat...
      </p>
    );
  }

  return (
    <ProductForm
      key={product.id}
      categories={categories}
      showStock={false}
      isEdit={true}
      currentStock={product.stok}
      pageTitle={`Ubah Produk: ${product.nama}`}
      pageSubtitle="Perbarui informasi barang, penyesuaian harga jual, dan kontrol stok fisik untuk katalog Toko Abah."
      submitLabel="Simpan Perubahan"
      hargaHelper="Harga baru hanya berlaku untuk transaksi berikutnya."
      initialValues={{
        nama: product.nama,
        kategori: product.kategori,
        harga: String(product.harga),
        berat: String(product.berat),
        stok: String(product.stok),
        batas_stok_kritis:
          product.batas_stok_kritis !== undefined && product.batas_stok_kritis !== null
            ? String(product.batas_stok_kritis)
            : '',
      }}
      errors={serverErrors}
      formError={formError}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/produk')}
      user={user}
    />
  );
}
