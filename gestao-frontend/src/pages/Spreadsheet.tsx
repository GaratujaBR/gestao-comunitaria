import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { SheetData } from "@/api/types"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const statusColors: Record<string, string> = {
  Compras: "bg-blue-100 text-blue-800",
  Doação: "bg-green-100 text-green-800",
  Investir: "bg-amber-100 text-amber-800",
  Caixinha: "bg-purple-100 text-purple-800"
}

const areaColors: Record<string, string> = {
  Cozinha: "bg-orange-100 text-orange-800",
  Banheiro: "bg-cyan-100 text-cyan-800",
  Limpeza: "bg-emerald-100 text-emerald-800",
  Lazer: "bg-pink-100 text-pink-800",
  SOS: "bg-red-100 text-red-800"
}

export default function Spreadsheet() {
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    created: number
    updated: number
  } | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [areaFilter, setAreaFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError("")
    try {
      if (forceRefresh) await api.post("/api/sheets/refresh", {})
      const result = await api.get<SheetData>("/api/sheets")
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar planilha")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await api.post<{ created: number; updated: number }>(
        "/api/sheets/sync",
        {}
      )
      setSyncResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  const areas = data ? [...new Set(data.rows.map((r) => r.area))] : []
  const statuses = data ? [...new Set(data.rows.map((r) => r.status))] : []

  const filtered = data
    ? data.rows.filter((r) => {
        if (areaFilter && r.area !== areaFilter) return false
        if (statusFilter && r.status !== statusFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            r.item.toLowerCase().includes(q) ||
            (r.descricao && r.descricao.toLowerCase().includes(q)) ||
            (r.responsavel && r.responsavel.toLowerCase().includes(q))
          )
        }
        return true
      })
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error && !data) {
    const isConfigError = error.includes("não configurada")
    return (
      <div className="p-6">
        <div
          className={`p-4 rounded-lg ${isConfigError ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-700"}`}
        >
          {isConfigError ? (
            <div className="space-y-2">
              <p className="font-medium">⚠️ Planilha não configurada</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">
                Para usar o Financeiro, configure a variável{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded">
                  GOOGLE_SHEET_CSV_URL
                </code>{" "}
                no arquivo{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code>{" "}
                do backend.
              </p>
            </div>
          ) : (
            error
          )}
        </div>
        <button
          onClick={() => load()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestão Financeira
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.count || 0} itens na planilha Google Sheets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Atualizar da Planilha
          </button>
          <button
            onClick={sync}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? "Sincronizando..." : "Sincronizar com Acervo"}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
          Sincronizado: {syncResult.created} criados, {syncResult.updated}{" "}
          atualizados
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Compras</p>
          <p className="text-2xl font-bold text-gray-800">
            R${" "}
            {(data?.total_compras || 0).toLocaleString("pt-BR", {
              minimumFractionDigits: 2
            })}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Itens</p>
          <p className="text-2xl font-bold text-gray-800">{data?.count || 0}</p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            data?.saldo_atual == null
              ? "bg-white border-gray-200"
              : data.saldo_atual > 0
                ? "bg-emerald-50 border-emerald-200"
                : data.saldo_atual < 0
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p
              className={`text-sm font-medium ${
                data?.saldo_atual == null
                  ? "text-gray-500"
                  : data.saldo_atual > 0
                    ? "text-emerald-700"
                    : data.saldo_atual < 0
                      ? "text-red-700"
                      : "text-gray-500"
              }`}
            >
              Saldo Atual
            </p>
            {data?.saldo_atual != null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.saldo_atual > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : data.saldo_atual < 0
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {data.saldo_atual > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" /> Positivo
                  </>
                ) : data.saldo_atual < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" /> Negativo
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3" /> Zerado
                  </>
                )}
              </span>
            )}
          </div>
          <p
            className={`text-2xl font-bold ${
              data?.saldo_atual == null
                ? "text-gray-800"
                : data.saldo_atual > 0
                  ? "text-emerald-800"
                  : data.saldo_atual < 0
                    ? "text-red-800"
                    : "text-gray-800"
            }`}
          >
            {data?.saldo_atual != null
              ? `R$ ${data.saldo_atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Área
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Responsável
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Item
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Descrição
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Qtd
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Valor
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${areaColors[row.area.trim()] || "bg-gray-100 text-gray-800"}`}
                    >
                      {row.area}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[row.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.responsavel || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.item}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {row.descricao || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.quantidade ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.valor ? `R$ ${row.valor.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {row.total ? `R$ ${row.total.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Nenhum item encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        Dados da{" "}
        <a
          href="https://docs.google.com/spreadsheets/d/1Wa5cB_C3ABzE74ozj7l1dLLL3B3wXWVZ/edit?usp=sharing&ouid=111883950513569997124&rtpof=true&sd=true"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          planilha Google Sheets
        </a>
      </div>
    </div>
  )
}
