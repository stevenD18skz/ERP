"use client";

// Input global para valores monetarios: el usuario escribe "3500" y ve "$3.500"
// mientras escribe. El valor que se reporta por onChange es siempre el número
// crudo (o "" si está vacío), nunca el texto formateado.
const formatDisplay = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return `$${n.toLocaleString("es-CO")}`;
};

export default function MoneyInput({
  value,
  onChange,
  placeholder = "$0",
  className = "",
  disabled = false,
  ...props
}) {
  const handleChange = (e) => {
    const numeric = e.target.value.replace(/[^\d]/g, "");
    onChange(numeric === "" ? "" : numeric);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}
