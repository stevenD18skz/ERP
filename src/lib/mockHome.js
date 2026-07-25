// Mock data (copied + enhanced from your dataset)
const productsHome = [
  {
    id: "1",
    name: "Arroz",
    price: 2.5,
    stock: 100,
    category: "Granos",
    description: "Arroz blanco de grano largo",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "2",
    name: "Leche",
    price: 1.8,
    stock: 50,
    category: "Lácteos",
    description: "Leche entera 1L",
    created_at: "2025-08-02T09:00:00Z",
  },
  {
    id: "3",
    name: "Pan",
    price: 0.75,
    stock: 30,
    category: "Panadería",
    description: "Pan blanco",
    created_at: "2025-08-03T10:00:00Z",
  },
  {
    id: "4",
    name: "Huevos",
    price: 3.2,
    stock: 200,
    category: "Lácteos",
    description: "Docena de huevos frescos",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "5",
    name: "Aceite de Girasol",
    price: 5.5,
    stock: 8,
    category: "Aceites",
    description: "Aceite de girasol 1L",
    created_at: "2025-07-28T11:00:00Z",
  },
  {
    id: "6",
    name: "Azúcar",
    price: 1.2,
    stock: 150,
    category: "Dulces",
    description: "Azúcar refinada 1kg",
    created_at: "2025-07-30T12:00:00Z",
  },
  {
    id: "7",
    name: "Pasta",
    price: 2.0,
    stock: 90,
    category: "Granos",
    description: "Pasta tipo espagueti 500g",
    created_at: "2025-08-04T13:00:00Z",
  },
  {
    id: "8",
    name: "Manzanas",
    price: 0.8,
    stock: 6,
    category: "Frutas",
    description: "Manzanas rojas frescas",
    created_at: "2025-08-05T14:00:00Z",
  },
  {
    id: "9",
    name: "Frijoles",
    price: 2.8,
    stock: 120,
    category: "Granos",
    description: "Frijoles negros 1kg",
    created_at: "2025-08-06T15:00:00Z",
  },
  {
    id: "10",
    name: "Yogur",
    price: 1.5,
    stock: 40,
    category: "Lácteos",
    description: "Yogur natural 500ml",
    created_at: "2025-08-02T16:00:00Z",
  },
  {
    id: "11",
    name: "Bananas",
    price: 0.6,
    stock: 70,
    category: "Frutas",
    description: "Bananas maduras",
    created_at: "2025-08-07T17:00:00Z",
  },
];

const ordersHome = [
  {
    productsHome: [
      { product: "Arroz Blanco 1Kg", quantity: 100, price: 2500 },
      { product: "Azúcar Morena 1Kg", quantity: 50, price: 3000 },
    ],
    total_amount: 100 * 2500 + 50 * 3000,
    order_date: "2025-08-10T09:30:00Z",
  },
  {
    productsHome: [
      { product: "Leche Entera 1L", quantity: 80, price: 1800 },
      { product: "Pan Integral", quantity: 40, price: 1200 },
      { product: "Mantequilla 250g", quantity: 30, price: 4000 },
    ],
    total_amount: 80 * 1800 + 40 * 1200 + 30 * 4000,
    order_date: "2025-08-11T14:00:00Z",
  },
  {
    productsHome: [
      { product: "Aceite de Girasol 900ml", quantity: 25, price: 4500 },
      { product: "Café Molido 500g", quantity: 15, price: 7500 },
    ],
    total_amount: 25 * 4500 + 15 * 7500,
    order_date: "2025-08-12T08:45:00Z",
  },
];

const salesHome = [
  {
    total_amount: 150000,
    sale_date: "2025-08-10T10:30:00Z",
    gain: 50000,
    productsHome: [
      { product: "Camiseta", quantity: 2, sale_price: 30000 },
      { product: "Pantalón", quantity: 1, sale_price: 70000 },
    ],
  },
  {
    total_amount: 260000,
    sale_date: "2025-08-11T15:45:00Z",
    gain: 90000,
    productsHome: [
      { product: "Zapatos", quantity: 2, sale_price: 120000 },
      { product: "Bufanda", quantity: 1, sale_price: 18000 },
    ],
  },
  {
    total_amount: 95000,
    sale_date: "2025-08-12T09:15:00Z",
    gain: 35000,
    productsHome: [{ product: "Bolso", quantity: 1, sale_price: 95000 }],
  },
];

export { productsHome, ordersHome, salesHome };