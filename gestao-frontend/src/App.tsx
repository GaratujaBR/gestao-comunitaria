import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Spaces from "@/pages/Spaces";
import Items from "@/pages/Items";
import Bookings from "@/pages/Bookings";
import Logs from "@/pages/Logs";
import Wiki from "@/pages/Wiki";
import Alerts from "@/pages/Alerts";
import Spreadsheet from "@/pages/Spreadsheet";
import Chamados from "@/pages/Chamados";
import Enquetes from "@/pages/Enquetes";
import Cotas from "@/pages/Cotas";
import Eventos from "@/pages/Eventos";

function App() {
  return (
    <BrowserRouter basename="/terradecanaa">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/espacos" element={<Spaces />} />
          <Route path="/acervo" element={<Items />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/planilha" element={<Spreadsheet />} />
          <Route path="/chamados" element={<Chamados />} />
          <Route path="/enquetes" element={<Enquetes />} />
          <Route path="/cotas" element={<Cotas />} />
          <Route path="/eventos" element={<Eventos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
