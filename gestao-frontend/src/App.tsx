import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import Layout from "@/components/Layout"
import ProtectedRoute from "@/components/ProtectedRoute"
import Login from "@/pages/Login"
import Cadastro from "@/pages/Cadastro"
import DefinirSenha from "@/pages/DefinirSenha"
import Dashboard from "@/pages/Dashboard"
import Spaces from "@/pages/Spaces"
import Items from "@/pages/Items"
import Bookings from "@/pages/Bookings"
import Logs from "@/pages/Logs"
import Wiki from "@/pages/Wiki"
import Alerts from "@/pages/Alerts"
import Spreadsheet from "@/pages/Spreadsheet"
import Chamados from "@/pages/Chamados"
import Enquetes from "@/pages/Enquetes"
import Cotas from "@/pages/Cotas"
import Eventos from "@/pages/Eventos"
import Profiles from "@/pages/Profiles"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/terradecanaa">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/definir-senha" element={<DefinirSenha />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/espacos" element={<Spaces />} />
              <Route path="/acervo" element={<Items />} />
              <Route path="/reservas" element={<Bookings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/wiki" element={<Wiki />} />
              <Route path="/alertas" element={<Alerts />} />
              <Route path="/financeiro" element={<Spreadsheet />} />
              <Route path="/chamados" element={<Chamados />} />
              <Route path="/enquetes" element={<Enquetes />} />
              <Route path="/cotas" element={<Cotas />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/perfis" element={<Profiles />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
