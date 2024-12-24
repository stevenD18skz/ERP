import React, { useState, useEffect } from "react";
import Table from "../Components/Table";
import { getProducts } from "../services/portProducts";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="mt-10 text-center">Cargando...</div>;
  }

  return <Table data_list={products} />;
};

export default ProductsPage;
