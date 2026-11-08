const path = require('node:path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Jalankan perintah ini dari terminal interaktif.'));
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let value = '';
    function finish(error) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }

    function onData(key) {
      if (key === '\u0003') return finish(new Error('Dibatalkan.'));
      if (key === '\r' || key === '\n') return finish();
      if (key === '\u0008' || key === '\u007f') {
        value = value.slice(0, -1);
        return;
      }
      if (!/[\u0000-\u001f\u007f]/.test(key)) value += key;
    }

    process.stdin.on('data', onData);
    process.stdout.on('error', finish);
  });
}

async function resetAdminPassword() {
  const password = await readHidden('Password admin baru: ');
  const confirmation = await readHidden('Ulangi password baru: ');
  if (password.length < 8) throw new Error('Password harus minimal 8 karakter.');
  if (password !== confirmation) throw new Error('Kedua password tidak sama.');

  const database = process.env.DB_NAME;
  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME tidak valid. Periksa konfigurasi backend/.env.');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
  });

  try {
    const [admins] = await connection.query(
      'SELECT id_admin FROM admin WHERE username = ?',
      ['admin'],
    );
    const [employees] = await connection.query(
      'SELECT id_pegawai FROM pegawai WHERE username = ?',
      ['admin'],
    );
    if (admins.length !== 1 || employees.length !== 0) {
      throw new Error('Akun admin "admin" tidak ditemukan atau username-nya bentrok.');
    }

    const hash = await bcrypt.hash(password, 10);
    await connection.query(
      'UPDATE admin SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id_admin = ?',
      [hash, admins[0].id_admin],
    );
    console.log('Password akun admin berhasil diperbarui.');
  } finally {
    await connection.end();
  }
}

resetAdminPassword().catch((error) => {
  console.error(`Reset password gagal: ${error.message}`);
  process.exitCode = 1;
});
