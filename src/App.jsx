import { BrowserRouter, Routes, Route } from "react-router-dom";

//IMPORTACION DE COMPONENTES
import Layout from "./components/Layout";

// PAGES IMPORTATION
import Home from "./Pages/Home/Home";
import SettingsPage from "./Pages/SettingsPage";

//CRUDS
import ProductsPage from "./Pages/Products/ProductsPage";
import SalePage from "./Pages/Sales/SalePage";
import OrdersPage from "./Pages/Orders/OrdersPage";

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
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
