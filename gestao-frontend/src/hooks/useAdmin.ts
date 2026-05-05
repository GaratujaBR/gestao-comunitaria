import { useAuth } from "@/context/AuthContext"

export function useAdmin() {
  const { role } = useAuth()
  return role === "admin"
}
