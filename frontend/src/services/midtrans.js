let snapScriptPromise;

export function loadMidtransSnap(clientKey) {
  if (window.snap) return Promise.resolve(window.snap);
  if (snapScriptPromise) return snapScriptPromise;

  snapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
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
