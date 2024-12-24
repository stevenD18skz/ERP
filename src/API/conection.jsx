import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tesuaclpbjkxuqudjchh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3VhY2xwYmpreHVxdWRqY2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzMDk3NzAsImV4cCI6MjA0NDg4NTc3MH0.CWaUgdD2bdMB2gbug8FzqQQKc-8q5ouGociSzqOVxeA";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

// Ejemplo: Obtener todos los productos
const fetchProducts = async () => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) console.error(error);
  return data;
};
