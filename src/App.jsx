import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

//IMPORTACION DE COMPONENTES
import Layout from "./Components/Layout";
import Home from "./Pages/Home";
import SalePage from "./Pages/SalePage";
import OrdersPage from "./Pages/OrdersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="Sales" element={<SalePage />} />
          <Route path="Orders" element={<OrdersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
