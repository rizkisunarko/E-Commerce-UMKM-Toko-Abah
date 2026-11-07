import { mockRequest } from '../mocks/mockServer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TOKEN_KEY = 'toko_abah_token';

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
export async function request(method, path, body) {
  const token = getToken();

  if (USE_MOCK) {
    const res = await mockRequest(method, path, body, token);
    if (res.status >= 400) throw new ApiError(res.status, res.body.message, res.body.errors);
    return res.body;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.message || 'Terjadi kesalahan', data.errors);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};
