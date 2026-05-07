import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from "react"
import { supabase } from "@/lib/supabase"

interface AuthState {
  token: string | null
  slug: string | null
  nome: string | null
  role: string | null
  is_admin: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    slug: null,
    nome: null,
    role: null,
    is_admin: false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata
        setState({
          token: session.access_token,
          slug: meta.slug ?? null,
          nome: meta.nome ?? meta.nome_completo ?? null,
          role: meta.role ?? null,
          is_admin: meta.is_admin === true,
        })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const meta = session.user.user_metadata
        setState({
          token: session.access_token,
          slug: meta.slug ?? null,
          nome: meta.nome ?? meta.nome_completo ?? null,
          role: meta.role ?? null,
          is_admin: meta.is_admin === true,
        })
      } else {
        setState({ token: null, slug: null, nome: null, role: null, is_admin: false })
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) throw new Error(error.message)

    const meta = data.user.user_metadata
    setState({
      token: data.session.access_token,
      slug: meta.slug ?? null,
      nome: meta.nome ?? meta.nome_completo ?? null,
      role: meta.role ?? null,
      is_admin: meta.is_admin === true,
    })
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
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
