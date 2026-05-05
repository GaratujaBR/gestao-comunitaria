import { useAuth } from "@/context/AuthContext"

export function useAdmin() {
  const { is_admin } = useAuth()
  return is_admin === true
}
