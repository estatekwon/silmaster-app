export function formatAmount(wonManwon: string | number): string {
  const val = typeof wonManwon === "string"
    ? parseInt(wonManwon.replace(/[^0-9]/g, ""), 10)
    : wonManwon;
  if (isNaN(val)) return "-";
  if (val >= 10000) {
    const eok = Math.floor(val / 10000);
    const man = val % 10000;
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${val.toLocaleString()}만원`;
}

export function formatArea(m2: string | number): string {
  const val = typeof m2 === "string"
    ? parseFloat(m2.replace(/[^0-9.]/g, ""))
    : m2;
  if (isNaN(val)) return "-";
  const pyeong = Math.round(val / 3.3058);
  return `${val.toLocaleString()}㎡ (약 ${pyeong.toLocaleString()}평)`;
}

export function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length < 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

export function calcPricePerM2(amount: string, area: string): string {
  const amt = parseInt(amount.replace(/[^0-9]/g, ""), 10);
  const ar = parseFloat(area.replace(/[^0-9.]/g, ""));
  if (!amt || !ar) return "-";
  const perM2 = Math.round(amt / ar);
  return `${perM2.toLocaleString()}만원/㎡`;
}
