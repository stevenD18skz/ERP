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

// Helpers
const currency = (n) => {
  if (typeof n !== "number") return "-";
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
};


export { formatMoneySymbol, formatMoney, currency };
