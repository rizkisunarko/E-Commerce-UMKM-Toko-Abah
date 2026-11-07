const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

const backendDirectory = path.resolve(__dirname, '..');
const envPath = path.join(backendDirectory, '.env');

function replaceEnvValue(contents, key, value) {
  const expression = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  if (expression.test(contents)) {
    return contents.replace(expression, `${key}=${value}`);
  }
  return `${contents.trimEnd()}\n${key}=${value}\n`;
}

async function ensureLocalEnv() {
  const examplePath = path.join(backendDirectory, '.env.example');
  let contents;

  try {
    contents = await fs.readFile(envPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    contents = await fs.readFile(examplePath, 'utf8');
    console.log('File backend/.env dibuat dari .env.example dengan JWT_SECRET acak.');
  }

  const example = dotenv.parse(await fs.readFile(examplePath, 'utf8'));
  const current = dotenv.parse(contents);
  let updated = contents;
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (current[key] === undefined && example[key] !== undefined) {
      updated = replaceEnvValue(updated, key, example[key]);
    }
  }

  const configuredSecret = dotenv.parse(updated).JWT_SECRET;
  if (!configuredSecret || configuredSecret === 'ganti_dengan_string_acak') {
    updated = replaceEnvValue(updated, 'JWT_SECRET', randomBytes(32).toString('hex'));
    console.log('JWT_SECRET kosong atau masih placeholder; nilai acak dibuat di backend/.env.');
  }

  if (updated !== contents) await fs.writeFile(envPath, updated, 'utf8');
  const result = dotenv.config({ path: envPath, override: true });
  if (result.error) {
    throw new Error(`Tidak bisa membaca backend/.env: ${result.error.message}`);
  }
  console.log('Periksa DB_USER dan DB_PASSWORD di backend/.env sebelum melanjutkan.');
}

async function setupDatabase() {
  await ensureLocalEnv();

  const database = process.env.DB_NAME;
  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error(
      'DB_NAME tidak ditemukan di backend/.env. Tambahkan baris DB_NAME=toko_abah, lalu ulangi.',
    );
  }

  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT tidak valid.');
  }

  const dumpPath = path.join(backendDirectory, 'database', 'toko_abah.sql');
  const dump = await fs.readFile(dumpPath, 'utf8');
  const seedPath = path.join(backendDirectory, 'database', 'seed.sql');
  const seed = await fs.readFile(seedPath, 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.changeUser({ database });

    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length > 0) {
      throw new Error(
        `Database "${database}" sudah memiliki tabel. Setup dibatalkan agar data tidak tertimpa.`,
      );
    }

    await connection.query(dump);
    await connection.query(seed);
    const [createdTables] = await connection.query('SHOW TABLES');
    console.log(`Database "${database}" berhasil disiapkan (${createdTables.length} tabel) beserta data contoh.`);
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error) => {
  console.error(`Setup database gagal: ${error.message}`);
  if (error.code === 'ECONNREFUSED') {
    console.error('Pastikan layanan MySQL aktif dan DB_HOST/DB_PORT di backend/.env benar.');
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Periksa DB_USER dan DB_PASSWORD di backend/.env.');
  } else if (error.code === 'ER_DB_CREATE_EXISTS' || error.code === 'ER_TABLE_EXISTS_ERROR') {
    console.error('Database atau tabel sudah ada. Perintah ini hanya untuk database kosong.');
  }
  process.exitCode = 1;
});
