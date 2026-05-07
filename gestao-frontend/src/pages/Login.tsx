import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import caliandraLogo from "../../imgs/caliandra-logo.png"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, senha)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail)
    } catch {
      /* silencia — mesmo comportamento para email inválido */
    } finally {
      setResetLoading(false)
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header verde */}
        <div className="bg-[#D5E8D4] px-8 py-6 flex flex-col items-center gap-2 border-b border-[#88C9A1]/40">
          <img
            src={caliandraLogo}
            alt="Terra de Canaã"
            className="h-14 w-auto object-contain"
            draggable={false}
          />
          <div className="text-center">
            <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#2D5A27]">
              Vilarejo Ecológico
            </div>
            <div className="text-lg font-extrabold text-[#1A1A1A] tracking-[0.02em]">
              Terra de Canaã
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {!showReset ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Email
                  </label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Senha
                  </label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1F6B3A] hover:bg-[#155A2A]"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => navigate("/cadastro", { replace: true })}
                  className="w-full text-center text-sm text-[#1F6B3A] hover:underline"
                >
                  Criar uma conta
                </button>
                <button
                  onClick={() => {
                    setShowReset(true)
                    setError("")
                  }}
                  className="w-full text-center text-sm text-[#8A8A8A] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          ) : resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-[#4D4D4D]">
                Se esse email estiver cadastrado, você receberá um link em
                instantes.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowReset(false)
                  setResetSent(false)
                  setResetEmail("")
                }}
              >
                Voltar ao login
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#4D4D4D] mb-4">
                Digite seu email para receber o link de acesso.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#1F6B3A] hover:bg-[#155A2A]"
                >
                  {resetLoading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
              <button
                onClick={() => setShowReset(false)}
                className="mt-4 w-full text-center text-sm text-[#8A8A8A] hover:underline"
              >
                Voltar ao login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
