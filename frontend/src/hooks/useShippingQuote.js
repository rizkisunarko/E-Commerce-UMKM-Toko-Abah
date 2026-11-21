import { useCallback, useEffect, useRef, useState } from 'react';
import { shippingService } from '../services/shippingService';

function normalizeRate(rate) {
  if (!rate) return null;
  const kode = rate.kode || rate.id;
  const kurir = rate.kurir || rate.courier_name || 'Kurir';
  const layanan = rate.layanan || rate.service || 'Reguler';
  const biaya = Number(rate.biaya ?? rate.cost ?? 0);
  const estimasi = rate.estimasi || rate.etd || rate.description || '2 - 3 hari';
  const label = `${kurir} ${layanan}`;

  return {
    id: kode,
    kode,
    kurir,
    courier_name: kurir,
    layanan,
    service: layanan,
    biaya,
    cost: biaya,
    estimasi,
    etd: estimasi,
    description: `Estimasi: ${estimasi}`,
    label,
  };
}

export function useShippingQuote({ destinationId, items = [] } = {}) {
  const [quoteState, setQuoteState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'empty' | 'error'
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [shippingWeight, setShippingWeight] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  const requestIdRef = useRef(0);
  const lastQuotedParamsRef = useRef(null);

  // Serialized representation of items for dependency tracking
  const itemsKey = JSON.stringify(
    (items || []).map((it) => ({ id: it.id || it.product_id, jumlah: it.jumlah }))
  );

  // Reset quote when destination or items change
  useEffect(() => {
    if (lastQuotedParamsRef.current !== null) {
      const isDestinationChanged = lastQuotedParamsRef.current.destinationId !== destinationId;
      const isItemsChanged = lastQuotedParamsRef.current.itemsKey !== itemsKey;

      if (isDestinationChanged || isItemsChanged) {
        setQuoteState('idle');
        setRates([]);
        setSelectedRate(null);
        setShippingWeight(null);
        setErrorMessage('');
        setWarningMessage('Tujuan atau isi pesanan berubah. Hitung ulang ongkos kirim.');
        lastQuotedParamsRef.current = null;
      }
    }
  }, [destinationId, itemsKey]);

  const calculateQuote = useCallback(async (targetDestinationId, targetItems) => {
    const destId = targetDestinationId ?? destinationId;
    const currentItems = targetItems ?? items;

    if (!destId) {
      setQuoteState('idle');
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setQuoteState('loading');
    setErrorMessage('');
    setWarningMessage('');
    setSelectedRate(null);
    setShippingWeight(null);

    try {
      const res = await shippingService.calculateCost(destId, currentItems);
      if (currentReqId !== requestIdRef.current) return;

      const rawRates = res?.data?.layanan || (Array.isArray(res?.data) ? res.data : []);
      const normalized = rawRates.map(normalizeRate).filter(Boolean);
      const totalWeight = res?.weight ?? res?.data?.berat_gram ?? res?.berat_gram ?? null;
      setShippingWeight(totalWeight);

      if (normalized.length === 0) {
        setQuoteState('empty');
        setRates([]);
        setSelectedRate(null);
      } else {
        setQuoteState('success');
        setRates(normalized);
        setSelectedRate(null); // No rate selected automatically per plan
      }

      lastQuotedParamsRef.current = {
        destinationId: destId,
        itemsKey: JSON.stringify(
          (currentItems || []).map((it) => ({ id: it.id || it.product_id, jumlah: it.jumlah }))
        ),
      };
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;

      setQuoteState('error');
      setRates([]);
      setSelectedRate(null);
      setShippingWeight(null);
      setErrorMessage(
        err.message || 'Ongkos kirim tidak dapat dihitung. Coba lagi atau pilih Ambil di Toko.'
      );
    }
  }, [destinationId, items]);

  const selectRate = useCallback((rateOrId) => {
    if (!rateOrId) {
      setSelectedRate(null);
      return;
    }
    if (typeof rateOrId === 'object') {
      setSelectedRate(rateOrId);
    } else {
      const found = rates.find((r) => r.id === rateOrId || r.kode === rateOrId);
      setSelectedRate(found || null);
    }
  }, [rates]);

  const resetQuote = useCallback((customWarning = '') => {
    setQuoteState('idle');
    setRates([]);
    setSelectedRate(null);
    setShippingWeight(null);
    setErrorMessage('');
    setWarningMessage(customWarning);
    lastQuotedParamsRef.current = null;
  }, []);

  return {
    quoteState,
    rates,
    selectedRate,
    shippingWeight,
    errorMessage,
    warningMessage,
    calculateQuote,
    selectRate,
    resetQuote,
  };
}

export default useShippingQuote;
