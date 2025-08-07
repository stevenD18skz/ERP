import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ciyktotyhivmoeotatyg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeWt0b3R5aGl2bW9lb3RhdHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNzUzMzMsImV4cCI6MjA1MDY1MTMzM30.UcOjCCnlhJ5IHirzTXW5RY4zHbpeGpR6ZPcOnRWMmpc";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
