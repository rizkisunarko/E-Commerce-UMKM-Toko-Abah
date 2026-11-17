import { api } from './api';

const GUEST_CART_TOKEN_KEY = 'toko_abah_guest_cart_token';
const TOKEN_PATTERN = /^[\da-f]{64}$/i;
let memoryToken;

function createGuestCartToken() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Browser tidak mendukung token keranjang yang aman.');
  }
  const bytes = cryptoApi.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getGuestCartToken() {
  let storedToken;
  try {
    storedToken = localStorage.getItem(GUEST_CART_TOKEN_KEY);
  } catch {
    memoryToken ||= createGuestCartToken();
    return memoryToken;
  }
  if (storedToken && TOKEN_PATTERN.test(storedToken)) return storedToken;

  const token = createGuestCartToken();
  try {
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  } catch {
    memoryToken = token;
  }
  return token;
}

function guestCartHeaders() {
  return { 'X-Guest-Cart-Token': getGuestCartToken() };
}

export const cartService = {
  get: () => api.get('/cart', guestCartHeaders()),
  replace: (items) => api.put('/cart', { items }, guestCartHeaders()),
};
