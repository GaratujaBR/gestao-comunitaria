import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import caliandraLogo from "../../imgs/caliandra-logo.png"
import fundoApp from "../../imgs/fundo-appB.png"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmationHint, setShowConfirmationHint] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShowConfirmationHint(false)
    setResent(false)
    setLoading(true)
    try {
      await login(email, senha)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Erro ao entrar."
      if (msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Email ou senha inválidos."
        setShowConfirmationHint(true)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    setResent(false)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) throw error
      setResent(true)
      setError("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar."
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/terradecanaa/definir-senha`,
      })
    } catch {
      /* silencia — mesmo comportamento para email inválido */
    } finally {
      setResetLoading(false)
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundImage: `url(${fundoApp})`, backgroundSize: "550px", backgroundRepeat: "repeat" }}>
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
                {showConfirmationHint && (
                  <div className="text-sm space-y-2">
                    <p className="text-[#8A5C00]">
                      Se você acabou de se cadastrar, talvez precise confirmar seu email primeiro.
                    </p>
                    {resent ? (
                      <p className="text-[#1F6B3A]">Email reenviado! Verifique sua caixa de entrada.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resending}
                        className="text-[#1F6B3A] underline disabled:opacity-50"
                      >
                        {resending ? "Reenviando..." : "Reenviar email de confirmação"}
                      </button>
                    )}
                  </div>
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
                    setShowConfirmationHint(false)
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
