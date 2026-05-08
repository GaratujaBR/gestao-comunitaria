import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { api } from "@/api/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import caliandraLogo from "../../imgs/caliandra-logo.png"
import fundoApp from "../../imgs/fundo-appB.png"

export default function Cadastro() {
  const navigate = useNavigate()

  const [nomeCompleto, setNomeCompleto] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (senha.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres.")
      return
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome_completo: nomeCompleto,
          },
        },
      })
      if (error) throw error

      try {
        await api.post("/api/auth/register", {
          email,
          senha,
          nome_completo: nomeCompleto,
        })
      } catch {
        // Perfil já existe ou backend indisponível — não bloquear o fluxo
      }

      // Verificar se precisa confirmar email
      const isConfirmed = data.user?.email_confirmed_at != null
      setNeedsConfirmation(!isConfirmed)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta."
      if (msg.includes("already registered") || msg.includes("User already registered")) {
        setError("Email já cadastrado.")
      } else {
        setError(msg)
      }
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar email."
      setError(msg)
    } finally {
      setResending(false)
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
          {success ? (
            <div className="text-center space-y-4">
              {needsConfirmation ? (
                <>
                  <p className="text-sm text-[#1F6B3A] font-medium">
                    Conta criada com sucesso!
                  </p>
                  <p className="text-sm text-[#4D4D4D]">
                    Enviamos um link de confirmação para seu email.
                  </p>
                  <p className="text-sm text-[#4D4D4D]">
                    Clique no link antes de fazer login.
                  </p>
                  {resent ? (
                    <p className="text-sm text-[#1F6B3A]">
                      Email reenviado! Verifique sua caixa de entrada.
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                    >
                      {resending ? "Reenviando..." : "Reenviar email de confirmação"}
                    </Button>
                  )}
                  <Button
                    className="w-full bg-[#1F6B3A] hover:bg-[#155A2A]"
                    onClick={() => navigate("/login", { replace: true })}
                  >
                    Ir para o login
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#1F6B3A] font-medium">
                    Conta criada com sucesso!
                  </p>
                  <p className="text-sm text-[#4D4D4D]">
                    Agora você pode fazer login com seu email e senha.
                  </p>
                  <Button
                    className="w-full bg-[#1F6B3A] hover:bg-[#155A2A]"
                    onClick={() => navigate("/login", { replace: true })}
                  >
                    Ir para o login
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Nome Completo *
                  </label>
                  <Input
                    type="text"
                    autoComplete="name"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Email *
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
                    Senha * (mín. 6 caracteres)
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Confirmar Senha *
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
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
                  {loading ? "Criando..." : "Criar Conta"}
                </Button>
              </form>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="mt-4 w-full text-center text-sm text-[#1F6B3A] hover:underline"
              >
                Já tem conta? Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
