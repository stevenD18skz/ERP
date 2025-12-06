const products = [
  {
    id: "1",
    name: "Arroz 1Kg",
    sku: "ARZ-001",
    price: 2500,
    stock: 100,
    category: "Granos",
    description: "Arroz blanco de grano largo",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "2",
    name: "Leche 1L",
    sku: "MLK-001",
    price: 1800,
    stock: 50,
    category: "Lácteos",
    description: "Leche entera 1L",
    created_at: "2025-08-02T09:00:00Z",
  },
  {
    id: "3",
    name: "Pan 500g",
    sku: "PAN-001",
    price: 1200,
    stock: 30,
    category: "Panadería",
    description: "Pan integral",
    created_at: "2025-08-03T10:00:00Z",
  },
  {
    id: "4",
    name: "Aceite 1L",
    sku: "ACE-001",
    price: 5500,
    stock: 8,
    category: "Aceites",
    description: "Aceite de girasol 1L",
    created_at: "2025-07-28T11:00:00Z",
  },
  {
    id: "5",
    name: "Azúcar 1Kg",
    sku: "AZU-001",
    price: 1200,
    stock: 150,
    category: "Dulces",
    description: "Azúcar refinada 1kg",
    created_at: "2025-07-30T12:00:00Z",
  },
  {
    id: "6",
    name: "Manzanas Kg",
    sku: "MAN-001",
    price: 800,
    stock: 6,
    category: "Frutas",
    description: "Manzanas rojas frescas",
    created_at: "2025-08-05T14:00:00Z",
  },
  {
    id: "7",
    name: "Yogur 500ml",
    sku: "YOG-001",
    price: 1500,
    stock: 40,
    category: "Lácteos",
    description: "Yogur natural 500ml",
    created_at: "2025-08-02T16:00:00Z",
  },
];

const orders = [
  {
    products: [
      { product: "Arroz Blanco 1Kg", quantity: 100, price: 2500 },
      { product: "Azúcar Morena 1Kg", quantity: 50, price: 3000 },
    ],
    total_amount: 100 * 2500 + 50 * 3000, // 250000 + 150000 = 400000
    order_date: "2025-08-10T09:30:00Z",
  },
  {
    products: [
      { product: "Leche Entera 1L", quantity: 80, price: 1800 },
      { product: "Pan Integral", quantity: 40, price: 1200 },
      { product: "Mantequilla 250g", quantity: 30, price: 4000 },
    ],
    total_amount: 80 * 1800 + 40 * 1200 + 30 * 4000, // 144000 + 48000 + 120000 = 312000
    order_date: "2025-08-11T14:00:00Z",
  },
  {
    products: [
      { product: "Aceite de Girasol 900ml", quantity: 25, price: 4500 },
      { product: "Café Molido 500g", quantity: 15, price: 7500 },
    ],
    total_amount: 25 * 4500 + 15 * 7500, // 112500 + 112500 = 225000
    order_date: "2025-08-12T08:45:00Z",
  },
];

const sales = [
  {
    total_amount: 150000,
    sale_date: "2025-08-10T10:30:00Z",
    gain: 50000,
    products: [
      { product: "Camiseta", quantity: 2, sale_price: 30000 },
      { product: "Pantalón", quantity: 1, sale_price: 70000 },
    ],
  },
  {
    total_amount: 260000,
    sale_date: "2025-08-11T15:45:00Z",
    gain: 90000,
    products: [
      { product: "Zapatos", quantity: 2, sale_price: 120000 },
      { product: "Bufanda", quantity: 1, sale_price: 18000 },
    ],
  },
  {
    total_amount: 95000,
    sale_date: "2025-08-12T09:15:00Z",
    gain: 35000,
    products: [{ product: "Bolso", quantity: 1, sale_price: 95000 }],
  },
];

export { products, orders, sales };
