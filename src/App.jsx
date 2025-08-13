import { BrowserRouter, Routes, Route } from "react-router-dom";

//IMPORTACION DE COMPONENTES
import Layout from "./components/Layout";

// PAGES IMPORTATION
import Home from "./Pages/Home";

//CRUDS
import ProductsPage from "./Pages/ProductsPage";
import SalePage from "./Pages/SalePage";
import OrdersPage from "./Pages/OrdersPage";

// USER
import SummaryPage from "./Pages/SummaryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="Sales" element={<SalePage />} />
          <Route path="Orders" element={<OrdersPage />} />
          <Route path="summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
