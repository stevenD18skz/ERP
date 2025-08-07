import supabase from "./api";

export const getSales = async () => {
  const { data: sales, error } = await supabase.from("sales").select("*");
  if (error) throw error;

  const salesWithDetails = await Promise.all(
    sales.map(async (sale) => {
      const { data: saleDetails, error: errorDetails } = await supabase
        .from("saleDetails")
        .select("*")
        .eq("sale_id", sale.id);
      if (errorDetails) throw errorDetails;

      const productsWithDetails = await Promise.all(
        saleDetails.map(async (product) => {
          const { data: productData, error: errorProduct } = await supabase
            .from("products")
            .select("*")
            .eq("id", product.product_id)
            .single();
          if (errorProduct) throw errorProduct;

          return {
            ...product,
            product: productData.name,
            price: productData.price,
          };
        }),
      );

      return {
        ...sale,
        products: productsWithDetails,
      };
    }),
  );

  // Sort sales by date, most recent first
  salesWithDetails.sort(
    (a, b) => new Date(b.sale_date) - new Date(a.sale_date),
  );

  return salesWithDetails;
};

export const getSaleById = async (id) => {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const createSale = async (sale) => {
  const { data, error } = await supabase.from("sales").insert([sale]);
  if (error) throw error;
  return data;
};

export const createSaleWithDetails = async (sale, saleDetails) => {
  const { data: saleData, error: saleError } = await supabase
    .from("sales")
    .insert([sale])
    .select();

  if (saleError) throw saleError;

  console.log(saleData);

  const saleId = saleData[0].id;

  const saleDetailsWithSaleId = saleDetails.map((detail) => ({
    ...detail,
    sale_id: saleId,
  }));

  const { data: saleDetailsData, error: saleDetailsError } = await supabase
    .from("saleDetails")
    .insert(saleDetailsWithSaleId);
  if (saleDetailsError) throw saleDetailsError;

  return { sale: saleData[0], saleDetails: saleDetailsData };
};

export const updateSale = async (id, sale) => {
  const { data, error } = await supabase
    .from("sales")
    .update(sale)
    .eq("id", id);
  if (error) throw error;
  return data;
};

export const deleteSale = async (id) => {
  const { data, error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
  return data;
};
