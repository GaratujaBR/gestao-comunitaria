import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import caliandraLogo from "../../imgs/caliandra-logo.png"

export default function DefinirSenha() {
  const navigate = useNavigate()

  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha !== confirmar) {
      setError("As senhas não coincidem.")
      return
    }
    if (senha.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) throw error
      setDone(true)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Link inválido ou expirado."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
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
          {checking ? (
            <p className="text-sm text-gray-500">Verificando link...</p>
          ) : !hasSession ? (
            <p className="text-sm text-red-500">Link inválido ou expirado.</p>
          ) : done ? (
            <div className="text-center space-y-4">
              <p className="text-[#1F6B3A] font-medium">
                Senha definida com sucesso!
              </p>
              <Button
                className="w-full bg-[#1F6B3A] hover:bg-[#155A2A]"
                onClick={() => navigate("/login", { replace: true })}
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold text-[#1A1A1A] mb-4">
                Definir senha de acesso
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Nova senha
                  </label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Confirmar senha
                  </label>
                  <Input
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="repita a senha"
                    autoComplete="new-password"
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
                  {loading ? "Salvando..." : "Definir senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
