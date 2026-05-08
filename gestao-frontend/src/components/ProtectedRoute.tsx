import { Outlet } from "react-router-dom"

// AUTH SUSPENSA — reativar: descomentar bloco abaixo e restaurar imports
// import { Navigate } from "react-router-dom"
// import { useAuth } from "@/context/AuthContext"

export default function ProtectedRoute() {
  // const { token } = useAuth()
  // if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
