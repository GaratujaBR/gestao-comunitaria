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
    nome: localStorage.getItem("auth_nome")
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStorage)

  const login = useCallback(async (email: string, senha: string) => {
    const res = await api.post<{ access_token: string; nome: string; slug: string }>(
      "/api/auth/login",
      { email, senha }
    )
    localStorage.setItem("auth_token", res.access_token)
    localStorage.setItem("auth_slug", res.slug)
    localStorage.setItem("auth_nome", res.nome)
    setState({ token: res.access_token, slug: res.slug, nome: res.nome })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_slug")
    localStorage.removeItem("auth_nome")
    setState({ token: null, slug: null, nome: null })
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
