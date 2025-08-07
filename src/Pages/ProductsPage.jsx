import { useState, useEffect } from "react";
import Table from "../components/Table";
import { getProducts } from "../services/portProducts";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const result = await getProducts();
      setProducts(result);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="mt-10 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-dvh bg-slate-200">
      <Table data_list={products} onDataUpdate={fetchProducts} />
    </div>
  );
};

export default ProductsPage;
