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

export { formatMoneySymbol, formatMoney };
