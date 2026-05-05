import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Chamado, Prestador } from "@/api/types"
import { Plus, Phone, X, Trash2 } from "lucide-react"
import { useAdmin } from "@/hooks/useAdmin"

const statusColors: Record<string, string> = {
  aberto: "bg-yellow-100 text-yellow-800",
  em_andamento: "bg-blue-100 text-blue-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800"
}

const prioridadeColors: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700"
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado"
}

export default function Chamados() {
  const isAdmin = useAdmin()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showPrestadorModal, setShowPrestadorModal] = useState(false)
  const [form, setForm] = useState({
    estrutura: "",
    area: "",
    descricao: "",
    prioridade: "normal",
    tipo: "corretiva",
    prestador_id: "",
    solicitante: ""
  })
  const [prestadorForm, setPrestadorForm] = useState({
    nome: "",
    telefone: "",
    especialidade: "",
    empresa: ""
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, p] = await Promise.all([
        api.get<Chamado[]>("/api/chamados"),
        api.get<Prestador[]>("/api/prestadores")
      ])
      setChamados(c)
      setPrestadores(p)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = statusFilter
    ? chamados.filter((c) => c.status === statusFilter)
    : chamados

  const createChamado = async () => {
    try {
      await api.post("/api/chamados", form)
      setShowModal(false)
      setForm({
        estrutura: "",
        area: "",
        descricao: "",
        prioridade: "normal",
        tipo: "corretiva",
        prestador_id: "",
        solicitante: ""
      })
      load()
    } catch {
      /* ignore */
    }
  }

  const createPrestador = async () => {
    try {
      await api.post("/api/prestadores", prestadorForm)
      setShowPrestadorModal(false)
      setPrestadorForm({
        nome: "",
        telefone: "",
        especialidade: "",
        empresa: ""
      })
      load()
    } catch {
      /* ignore */
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/chamados/${id}`, { status })
      load()
    } catch {
      /* ignore */
    }
  }

  const deleteChamado = async (id: string) => {
    if (!confirm("Remover este chamado?")) return
    try {
      await api.del(`/api/chamados/${id}`)
      load()
    } catch {
      /* ignore */
    }
  }

  const openWhatsApp = async (id: string) => {
    try {
      const result = await api.get<{ url: string }>(
        `/api/chamados/${id}/whatsapp`
      )
      window.open(result.url, "_blank")
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Chamados de Manutenção
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {chamados.length} chamados registrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrestadorModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Prestadores ({prestadores.length})
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Novo Chamado
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!statusFilter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todos
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === key ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-gray-400">
                    #{c.numero}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {statusLabels[c.status] || c.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${prioridadeColors[c.prioridade] || "bg-gray-100 text-gray-700"}`}
                  >
                    {c.prioridade}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {c.tipo}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">{c.estrutura}</h3>
                <p className="text-sm text-gray-600 mt-1">{c.descricao}</p>
                {c.prestador_nome && (
                  <p className="text-sm text-gray-500 mt-2">
                    Prestador:{" "}
                    <span className="font-medium">{c.prestador_nome}</span>
                    {c.prestador_telefone && ` (${c.prestador_telefone})`}
                  </p>
                )}
                {c.solicitante && (
                  <p className="text-xs text-gray-400 mt-1">
                    Solicitante: {c.solicitante}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {c.prestador_telefone && (
                  <button
                    onClick={() => openWhatsApp(c.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="WhatsApp"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                {c.status === "aberto" && (
                  <button
                    onClick={() => updateStatus(c.id, "em_andamento")}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    Iniciar
                  </button>
                )}
                {c.status === "em_andamento" && (
                  <button
                    onClick={() => updateStatus(c.id, "concluido")}
                    className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    Concluir
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => deleteChamado(c.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum chamado encontrado
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Novo Chamado</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Estrutura (ex: Telhado, Encanamento)"
                value={form.estrutura}
                onChange={(e) =>
                  setForm({ ...form, estrutura: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Área"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                placeholder="Descrição do problema"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.prioridade}
                  onChange={(e) =>
                    setForm({ ...form, prioridade: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="corretiva">Corretiva</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="melhoria">Melhoria</option>
                </select>
              </div>
              <select
                value={form.prestador_id}
                onChange={(e) =>
                  setForm({ ...form, prestador_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecione um prestador</option>
                {prestadores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.especialidade || "Geral"}
                  </option>
                ))}
              </select>
              <input
                placeholder="Solicitante"
                value={form.solicitante}
                onChange={(e) =>
                  setForm({ ...form, solicitante: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createChamado}
                  disabled={!form.estrutura || !form.descricao}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Criar Chamado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrestadorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Prestadores de Serviço
              </h2>
              <button
                onClick={() => setShowPrestadorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {prestadores.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{p.nome}</p>
                    <p className="text-xs text-gray-500">
                      {p.especialidade || "Geral"}{" "}
                      {p.empresa && `- ${p.empresa}`}
                    </p>
                    <p className="text-xs text-gray-400">{p.telefone}</p>
                  </div>
                </div>
              ))}
              {prestadores.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">
                  Nenhum prestador cadastrado
                </p>
              )}
            </div>
            <hr className="my-4" />
            <h3 className="font-medium text-sm text-gray-700 mb-3">
              Adicionar Prestador
            </h3>
            <div className="space-y-3">
              <input
                placeholder="Nome"
                value={prestadorForm.nome}
                onChange={(e) =>
                  setPrestadorForm({ ...prestadorForm, nome: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Telefone"
                value={prestadorForm.telefone}
                onChange={(e) =>
                  setPrestadorForm({
                    ...prestadorForm,
                    telefone: e.target.value
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Especialidade"
                value={prestadorForm.especialidade}
                onChange={(e) =>
                  setPrestadorForm({
                    ...prestadorForm,
                    especialidade: e.target.value
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                placeholder="Empresa"
                value={prestadorForm.empresa}
                onChange={(e) =>
                  setPrestadorForm({
                    ...prestadorForm,
                    empresa: e.target.value
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={createPrestador}
                disabled={!prestadorForm.nome || !prestadorForm.telefone}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
