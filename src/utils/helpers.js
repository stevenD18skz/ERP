const currency = (n) => {
  if (typeof n !== "number") return "-";
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
};

function sparklinePath(values, width = 120, height = 36) {
  if (!values || values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const len = values.length;
  const vRange = max - min || 1;
  const step = width / Math.max(1, len - 1);
  const points = values.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(((max - v) / vRange) * (height - 4)) + 2; // padding
    return `${x},${y}`;
  });
  return `M${points.join(" L")}`;
}

const formatMoneySymbol = (money) => {
  return money
    ? new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      })
        .format(money)
        .replace("COP", "")
        .trim()
    : "";
};

const formatMoney = (money) => {
  return money
    ? new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 0,
      }).format(money)
    : "";
};

export { currency, sparklinePath, formatMoneySymbol, formatMoney };
