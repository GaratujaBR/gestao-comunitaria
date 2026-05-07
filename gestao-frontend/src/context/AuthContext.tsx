import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from "react"
import { supabase } from "@/lib/supabase"
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
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function syncStateFromDb(sessionToken: string | null, meta: Record<string, unknown>): Promise<AuthState> {
  const baseState: AuthState = {
    token: sessionToken,
    slug: (meta.slug as string) ?? null,
    nome: (meta.nome as string) ?? (meta.nome_completo as string) ?? null,
    role: (meta.role as string) ?? null,
    is_admin: meta.is_admin === true,
  }

  if (!sessionToken) return baseState

  try {
    const me = await api.get<{ slug: string; nome: string; role: string | null; is_admin: boolean }>(
      "/api/auth/me"
    )
    return {
      ...baseState,
      slug: me.slug ?? baseState.slug,
      nome: me.nome ?? baseState.nome,
      role: me.role ?? baseState.role,
      is_admin: me.is_admin ?? baseState.is_admin,
    }
  } catch {
    return baseState
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    slug: null,
    nome: null,
    role: null,
    is_admin: false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const synced = await syncStateFromDb(session.access_token, session.user.user_metadata)
        setState(synced)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const synced = await syncStateFromDb(session.access_token, session.user.user_metadata)
        setState(synced)
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

    const synced = await syncStateFromDb(data.session.access_token, data.user.user_metadata)
    setState(synced)
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
