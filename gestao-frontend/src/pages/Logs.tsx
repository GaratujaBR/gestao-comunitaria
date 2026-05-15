import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Log } from "@/api/types"
import { ClipboardList } from "lucide-react"

const acoes = [
  "reserva_criada",
  "chamado_aberto",
  "compra_realizada",
  "doacao_recebida",
  "investimento_planejado",
  "reposicao_caixinha",
  "retirou",
  "devolveu",
  "danificou",
  "manutencao_realizada",
  "perda"
]

const acaoColors: Record<string, string> = {
  reserva_criada: "bg-[#D5E8D4] text-[#1F6B3A]",
  chamado_aberto: "bg-orange-100 text-orange-700",
  compra_realizada: "bg-blue-100 text-blue-700",
  doacao_recebida: "bg-green-100 text-green-700",
  investimento_planejado: "bg-amber-100 text-amber-700",
  reposicao_caixinha: "bg-purple-100 text-purple-700",
  retirou: "bg-blue-100 text-blue-700",
  devolveu: "bg-green-100 text-green-700",
  danificou: "bg-red-100 text-red-700",
  manutencao_realizada: "bg-purple-100 text-purple-700",
  perda: "bg-red-200 text-red-800"
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [acaoFilter, setAcaoFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = acaoFilter ? `/api/logs?acao=${acaoFilter}` : "/api/logs"
      setLogs(await api.get<Log[]>(url))
    } finally {
      setLoading(false)
    }
  }, [acaoFilter])

  useEffect(() => {
    load()
  }, [load, acaoFilter])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Logs de Atividade</h1>
        <p className="text-sm text-[#4D4D4D] mt-1">
          Registros gerados automaticamente pelas ações no sistema.
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setAcaoFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!acaoFilter ? "bg-[#1F6B3A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todos
        </button>
        {acoes.map((a) => (
          <button
            key={a}
            onClick={() => setAcaoFilter(a)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${acaoFilter === a ? "bg-[#1F6B3A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E7E5E4] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#F8F7F4] text-left text-[#4D4D4D]">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Pessoa</th>
                <th className="px-4 py-3 font-medium">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b last:border-0 hover:bg-[#F8F7F4]"
                >
                  <td className="px-4 py-3 text-xs text-[#8A8A8A]">
                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${acaoColors[log.acao] || "bg-gray-100 text-gray-600"}`}
                    >
                      {log.acao.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.item_codigo || log.local_uso || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.profile_slug || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4D4D4D] max-w-[200px] truncate">
                    {log.descricao_incidente || log.condicao_saida || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
