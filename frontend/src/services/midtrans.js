let snapScriptPromise;

export function loadMidtransSnap(clientKey) {
  if (window.snap) return Promise.resolve(window.snap);
  if (snapScriptPromise) return snapScriptPromise;

  const isProd = import.meta.env?.VITE_MIDTRANS_IS_PRODUCTION === 'true' ||
    (typeof clientKey === 'string' && !clientKey.startsWith('SB-'));

  snapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => {
      if (window.snap) resolve(window.snap);
      else {
        snapScriptPromise = null;
        reject(new Error('Snap Midtrans gagal dimuat.'));
      }
    };
    script.onerror = () => {
      snapScriptPromise = null;
      script.remove();
      reject(new Error('Tidak dapat memuat Snap Midtrans.'));
    };
    document.head.appendChild(script);
  });
  return snapScriptPromise;
}
