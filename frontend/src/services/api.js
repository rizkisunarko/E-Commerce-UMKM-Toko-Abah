import { mockRequest } from '../mocks/mockServer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TOKEN_KEY = 'toko_abah_token';
export const AUTH_MESSAGE_KEY = 'toko_abah_auth_msg';

let unauthorizedHandler = null;
let redirectingOn401 = false;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function handleUnauthorized(path) {
  if (path.startsWith('/auth/login')) return;
  setToken(null);
  try {
    sessionStorage.setItem(AUTH_MESSAGE_KEY, 'Sesi berakhir. Silakan masuk lagi.');
  } catch {
    // abaikan bila sessionStorage tidak tersedia
  }
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }
  if (!redirectingOn401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    redirectingOn401 = true;
    window.location.replace('/login');
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // penyimpanan browser tidak tersedia: abaikan
  }
}

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

// Satu pintu untuk semua panggilan ke backend.
// Mode mock (VITE_USE_MOCK=true) memakai data tiruan di browser.
export async function request(method, path, body, extraHeaders = {}) {
  const token = getToken();

  if (USE_MOCK && !path.startsWith('/shipping/')) {
    const res = await mockRequest(method, path, body, token, extraHeaders);
    if (res.status === 401) handleUnauthorized(path);
    if (res.status >= 400) throw new ApiError(res.status, res.body.message, res.body.errors);
    return res.body;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) handleUnauthorized(path);
  if (!res.ok) throw new ApiError(res.status, data.message || 'Terjadi kesalahan', data.errors);
  return data;
}

export async function uploadProductPhoto(file) {
  const token = getToken();

  if (USE_MOCK) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new ApiError(400, 'Gagal membaca file foto'));
      reader.readAsDataURL(file);
    });
    const res = await mockRequest('POST', '/products/photo', { url: dataUrl }, token);
    if (res.status >= 400) throw new ApiError(res.status, res.body.message, res.body.errors);
    return res.body;
  }

  const res = await fetch(`${API_URL}/products/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.message || 'Gagal mengunggah foto produk', data.errors);
  return data;
}

export const api = {
  get: (path, headers) => request('GET', path, undefined, headers),
  post: (path, body, headers) => request('POST', path, body, headers),
  put: (path, body, headers) => request('PUT', path, body, headers),
  patch: (path, body, headers) => request('PATCH', path, body, headers),
  del: (path, headers) => request('DELETE', path, undefined, headers),
};
