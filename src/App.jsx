import { BrowserRouter, Routes, Route } from "react-router-dom";

//IMPORTACION DE COMPONENTES
import Layout from "./Components/Layout";

import Home from "./Pages/Home";

import ProductsPage from "./Pages/ProductsPage";
import SalePage from "./Pages/SalePage";
import OrdersPage from "./Pages/OrdersPage";

import SummaryPage from "./Pages/SummaryPage";
import SettingsPage from "./Pages/SettingsPage";

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
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
