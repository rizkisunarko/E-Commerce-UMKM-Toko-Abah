function parseGram(satuan) {
  if (typeof satuan !== 'string') return 0;
  const match = satuan.match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml)?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = (match[2] || 'g').toLowerCase();
  return unit === 'kg' || unit === 'l'
    ? Math.round(value * 1000)
    : Math.round(value);
}

function calculateTotalWeight(products, quantities) {
  let weight = 0;
  for (const product of products) {
    const productId = Number(product.id_produk);
    const itemWeight = parseGram(product.satuan);
    const quantity = quantities.get(productId);
    if (itemWeight < 1 || !Number.isSafeInteger(quantity) || quantity < 1) {
      return { weight: null, invalidProductId: product.id_produk };
    }

    weight += itemWeight * quantity;
    if (!Number.isSafeInteger(weight)) return { weight: null };
  }
  return weight > 0
    ? { weight }
    : { weight: null };
}

module.exports = parseGram;
module.exports.calculateTotalWeight = calculateTotalWeight;
