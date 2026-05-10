import { supabase } from "@/lib/supabase"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || localStorage.getItem("backend_auth_token") || undefined
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeoutId)

    if (res.status === 401) {
      const err = await res.json().catch(() => ({ detail: "Não autorizado" }))
      if (token) {
        await supabase.auth.signOut()
        localStorage.removeItem("backend_auth_token")
        window.location.href = "/terradecanaa/login"
      }
      throw new Error(err.detail || "Credenciais inválidas.")
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Request failed")
    }
    if (res.status === 204) return undefined as T
    return res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name === "AbortError") {
      throw new Error("Timeout: servidor não respondeu em 30 segundos.")
    }
    throw err
  }
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: "DELETE" })
}
