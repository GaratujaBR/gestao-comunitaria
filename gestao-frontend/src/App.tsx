import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Profiles from "@/pages/Profiles";
import Spaces from "@/pages/Spaces";
import Items from "@/pages/Items";
import Bookings from "@/pages/Bookings";
import Logs from "@/pages/Logs";
import Wiki from "@/pages/Wiki";
import Alerts from "@/pages/Alerts";
import Planilha from "@/pages/Planilha";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfis" element={<Profiles />} />
          <Route path="/espacos" element={<Spaces />} />
          <Route path="/acervo" element={<Items />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/planilha" element={<Planilha />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
