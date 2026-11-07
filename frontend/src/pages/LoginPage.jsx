import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/produk';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'Kolom ini wajib diisi';
    if (!password) nextErrors.password = 'Kolom ini wajib diisi';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.status === 401 ? 'Nama pengguna atau kata sandi salah' : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit} noValidate>
        <h1>Masuk ke Toko Abah</h1>
        {formError && <div className="alert-error" role="alert">{formError}</div>}

        <TextField
          label="Nama Pengguna"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          autoComplete="username"
        />

        <div className={`field${errors.password ? ' has-error' : ''}`}>
          <label htmlFor="password">Kata Sandi</label>
          <div className="password-row">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Memproses...' : 'Masuk'}
        </Button>

        {USE_MOCK && (
          <div className="hint">
            Mode data tiruan. Akun uji: <b>admin</b> / admin123, <b>pegawai</b> / pegawai123
          </div>
        )}
      </form>
    </div>
  );
}
