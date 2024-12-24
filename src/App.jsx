import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

//IMPORTACION DE COMPONENTES
import Layout from "./Components/Layout";
import Home from "./Pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {
            //<Route path="categories" element={<Categories />} />
          }
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
