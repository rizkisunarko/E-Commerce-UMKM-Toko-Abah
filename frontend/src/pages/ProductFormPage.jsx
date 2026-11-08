import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { productService } from '../services/productService';

const EMPTY_FORM = {
  nama: '',
  kategori: '',
  harga: '',
  harga_beli: '',
  berat: '',
  stok: '',
  batas_stok_kritis: '5',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [originalStock, setOriginalStock] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      productService.categories(),
      isEditing ? productService.get(id) : Promise.resolve(null),
    ])
      .then(([categoryResponse, productResponse]) => {
        if (cancelled) return;
        setCategories(categoryResponse.data);
        if (productResponse) {
          const product = productResponse.data;
          setOriginalStock(Number(product.stok));
          setForm({
            nama: product.nama,
            kategori: product.kategori,
            harga: String(Number(product.harga)),
            harga_beli: String(Number(product.harga_beli || 0)),
            berat: String(product.berat),
            stok: String(Number(product.stok)),
            batas_stok_kritis: String(Number(product.batas_stok_kritis)),
          });
        } else if (categoryResponse.data.length) {
          setForm((current) => ({ ...current, kategori: categoryResponse.data[0] }));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});
    const data = {
      nama: form.nama,
      kategori: form.kategori,
      harga: form.harga,
      harga_beli: form.harga_beli,
      berat: form.berat,
      stok: form.stok,
      batas_stok_kritis: form.batas_stok_kritis,
    };
    try {
      if (isEditing) await productService.update(id, data);
      else await productService.create(data);
      const stockChanged = !isEditing || Number(form.stok) !== originalStock;
      navigate(stockChanged ? '/stok' : '/produk', { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Memuat formulir produk...</p>;

  return (
    <div className="card product-form">
      <h1>{isEditing ? 'Ubah Produk dan Harga' : 'Tambah Produk'}</h1>
      <p className="muted">
        Hanya admin yang dapat menambah dan mengubah informasi produk.
      </p>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nama produk"
          name="nama"
          value={form.nama}
          onChange={updateField}
          error={errors.nama}
          required
        />
        <div className={`field${errors.kategori ? ' has-error' : ''}`}>
          <label htmlFor="product-category">Kategori</label>
          <select
            id="product-category"
            name="kategori"
            value={form.kategori}
            onChange={updateField}
            aria-invalid={Boolean(errors.kategori)}
            required
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.kategori && <span className="field-error">{errors.kategori}</span>}
        </div>
        <TextField
          label="Harga jual (Rp)"
          name="harga"
          type="number"
          min="1"
          step="1"
          value={form.harga}
          onChange={updateField}
          error={errors.harga}
          required
        />
        <TextField
          label="Harga beli (Rp)"
          name="harga_beli"
          type="number"
          min="0"
          step="1"
          value={form.harga_beli}
          onChange={updateField}
          error={errors.harga_beli}
        />
        <TextField
          label="Berat (gram)"
          name="berat"
          type="number"
          min="1"
          step="1"
          value={form.berat}
          onChange={updateField}
          error={errors.berat}
          required
        />
        <TextField
          label={isEditing ? 'Jumlah stok' : 'Stok awal'}
          name="stok"
          type="number"
          min="0"
          step="1"
          value={form.stok}
          onChange={updateField}
          error={errors.stok}
          helper="Setelah disimpan, perubahan stok akan terlihat di halaman Daftar Stok."
          required
        />
        <TextField
          label="Batas stok kritis"
          name="batas_stok_kritis"
          type="number"
          min="0"
          step="1"
          value={form.batas_stok_kritis}
          onChange={updateField}
          error={errors.batas_stok_kritis}
          required
        />
        <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
          <Link to="/produk" className="btn btn-secondary">Batal</Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
