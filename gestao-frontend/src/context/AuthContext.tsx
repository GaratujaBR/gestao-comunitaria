import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useRef,
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
  const initDoneRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    // Restauração inicial: sempre usa getSession() como fonte primária
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      if (session) {
        localStorage.removeItem("backend_auth_token")
        try {
          const synced = await syncStateFromDb(session.access_token, session.user.user_metadata)
          if (isMounted) setState(synced)
        } catch {
          if (isMounted) {
            setState({
              token: session.access_token,
              slug: (session.user.user_metadata.slug as string) ?? null,
              nome: (session.user.user_metadata.nome as string) ?? (session.user.user_metadata.nome_completo as string) ?? null,
              role: (session.user.user_metadata.role as string) ?? null,
              is_admin: session.user.user_metadata.is_admin === true,
            })
          }
        }
        initDoneRef.current = true
        return
      }

      // Fallback: sessão via backend JWT
      const backendToken = localStorage.getItem("backend_auth_token")
      if (backendToken) {
        try {
          const me = await api.get<{ slug: string; nome: string; role: string | null; is_admin: boolean }>("/api/auth/me")
          if (isMounted) {
            setState({
              token: backendToken,
              slug: me.slug,
              nome: me.nome,
              role: me.role,
              is_admin: me.is_admin,
            })
          }
        } catch {
          if (isMounted) {
            localStorage.removeItem("backend_auth_token")
            setState({ token: null, slug: null, nome: null, role: null, is_admin: false })
          }
        }
      }

      initDoneRef.current = true
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      if (!initDoneRef.current) return // Ignora eventos antes da restauração inicial

      if (session) {
        localStorage.removeItem("backend_auth_token")
        try {
          const synced = await syncStateFromDb(session.access_token, session.user.user_metadata)
          if (isMounted) setState(synced)
        } catch {
          if (isMounted) {
            setState({
              token: session.access_token,
              slug: (session.user.user_metadata.slug as string) ?? null,
              nome: (session.user.user_metadata.nome as string) ?? (session.user.user_metadata.nome_completo as string) ?? null,
              role: (session.user.user_metadata.role as string) ?? null,
              is_admin: session.user.user_metadata.is_admin === true,
            })
          }
        }
      } else {
        localStorage.removeItem("backend_auth_token")
        if (isMounted) setState({ token: null, slug: null, nome: null, role: null, is_admin: false })
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    // Tentar login via Supabase primeiro
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (!supabaseError && supabaseData.session) {
      // Libera a UI imediatamente — não bloqueia esperando o backend
      setState({
        token: supabaseData.session.access_token,
        slug: (supabaseData.user.user_metadata.slug as string) ?? null,
        nome: (supabaseData.user.user_metadata.nome as string) ?? (supabaseData.user.user_metadata.nome_completo as string) ?? null,
        role: (supabaseData.user.user_metadata.role as string) ?? null,
        is_admin: supabaseData.user.user_metadata.is_admin === true,
      })

      // Sincroniza com backend em background (fire-and-forget)
      syncStateFromDb(supabaseData.session.access_token, supabaseData.user.user_metadata)
        .then((synced) => setState(synced))
        .catch(() => {
          // Silencioso: o usuário já tem acesso com os dados do Supabase
        })

      return
    }

    // Fallback: tentar login pelo backend (para usuários criados via backend)
    try {
      const backendRes = await api.post<{
        access_token: string
        nome: string
        slug: string
        role: string | null
        is_admin: boolean
      }>("/api/auth/login", { email, senha })

      if (backendRes.access_token) {
        localStorage.setItem("backend_auth_token", backendRes.access_token)
        setState({
          token: backendRes.access_token,
          slug: backendRes.slug,
          nome: backendRes.nome,
          role: backendRes.role,
          is_admin: backendRes.is_admin,
        })
        return
      }
    } catch (backendErr) {
      console.error("Backend login fallback failed:", backendErr)
    }

    // Se ambos falharam, propagar erro do Supabase (mais informativo)
    throw new Error(supabaseError?.message || "Email ou senha inválidos.")
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("backend_auth_token")
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
