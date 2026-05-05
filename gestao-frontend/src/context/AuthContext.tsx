import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode
} from "react"
import { api } from "@/api/client"

interface AuthState {
  token: string | null
  slug: string | null
  nome: string | null
  role: string | null
  is_admin: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStorage(): AuthState {
  return {
    token: localStorage.getItem("auth_token"),
    slug: localStorage.getItem("auth_slug"),
    nome: localStorage.getItem("auth_nome"),
    role: localStorage.getItem("auth_role"),
    is_admin: localStorage.getItem("auth_is_admin") === "true"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStorage)

  const login = useCallback(async (email: string, senha: string) => {
    const res = await api.post<{ access_token: string; nome: string; slug: string; role: string | null; is_admin: boolean }>(
      "/api/auth/login",
      { email, senha }
    )
    localStorage.setItem("auth_token", res.access_token)
    localStorage.setItem("auth_slug", res.slug)
    localStorage.setItem("auth_nome", res.nome)
    if (res.role) localStorage.setItem("auth_role", res.role)
    else localStorage.removeItem("auth_role")
    localStorage.setItem("auth_is_admin", String(res.is_admin ?? false))
    setState({ token: res.access_token, slug: res.slug, nome: res.nome, role: res.role ?? null, is_admin: res.is_admin ?? false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_slug")
    localStorage.removeItem("auth_nome")
    localStorage.removeItem("auth_role")
    localStorage.removeItem("auth_is_admin")
    setState({ token: null, slug: null, nome: null, role: null, is_admin: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
