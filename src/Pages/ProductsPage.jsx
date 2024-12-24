//IMPORTACION DE COMPONENTES
import Table from "../Components/Table";

const productos = [
  {
    id: 1,
    nombre: "Camiseta básica",
    precio: 19.99,
    categoria: "Ropa",
    stock: 50,
    enOferta: false,
  },
  {
    id: 2,
    nombre: "Pantalón jeans",
    precio: 39.99,
    categoria: "Ropa",
    stock: 30,
    enOferta: true,
  },
  {
    id: 3,
    nombre: "Zapatillas deportivas",
    precio: 59.99,
    categoria: "Calzado",
    stock: 20,
    enOferta: false,
  },
  {
    id: 4,
    nombre: "Bolso de cuero",
    precio: 89.99,
    categoria: "Accesorios",
    stock: 15,
    enOferta: true,
  },
  {
    id: 5,
    nombre: "Reloj digital",
    precio: 49.99,
    categoria: "Tecnología",
    stock: 10,
    enOferta: false,
  },
  {
    id: 6,
    nombre: "Auriculares Bluetooth",
    precio: 29.99,
    categoria: "Tecnología",
    stock: 25,
    enOferta: true,
  },
  {
    id: 7,
    nombre: "Gorra",
    precio: 14.99,
    categoria: "Accesorios",
    stock: 40,
    enOferta: false,
  },
  {
    id: 8,
    nombre: "Camiseta edición limitada",
    precio: 24.99,
    categoria: "Ropa",
    stock: 10,
    enOferta: true,
  },
];

export default function ProductsPage() {
  return <Table data_list={productos} />;
}
