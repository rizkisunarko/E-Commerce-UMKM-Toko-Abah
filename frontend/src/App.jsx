import { useEffect, useState } from 'react';
import { apiGet } from './services/api';

export default function App() {
  const [status, setStatus] = useState('Memeriksa backend...');

  useEffect(() => {
    apiGet('/health')
      .then((data) => setStatus(`Backend: ${data.status}, database: ${data.db}`))
      .catch((err) => setStatus(`Gagal terhubung: ${err.message}`));
  }, []);

  return (
    <div>
      <h1>Toko Abah</h1>
      <p>{status}</p>
    </div>
  );
}

