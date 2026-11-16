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

module.exports = parseGram;
