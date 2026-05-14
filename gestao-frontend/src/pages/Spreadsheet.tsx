import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { SheetData } from "@/api/types"
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react"

export default function Spreadsheet() {
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [tipoFilter, setTipoFilter] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("")

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

  const categorias = data
    ? [...new Set(data.rows.map((r) => r.categoria).filter(Boolean) as string[])]
    : []

  const filtered = data
    ? data.rows.filter((r) => {
        if (tipoFilter && r.tipo !== tipoFilter) return false
        if (categoriaFilter && r.categoria !== categoriaFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            (r.descricao?.toLowerCase().includes(q)) ||
            (r.categoria?.toLowerCase().includes(q))
          )
        }
        return true
      })
    : []

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })

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
              <p className="font-medium">Planilha não configurada</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">
                Configure <code className="bg-amber-100 px-1 py-0.5 rounded">GOOGLE_SHEET_CSV_URL</code> no backend.
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

  const saldo = data?.saldo_atual ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finanças</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.count || 0} lançamentos</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo */}
        <div
          className={`rounded-xl border p-4 ${
            saldo > 0 ? "bg-emerald-50 border-emerald-200" :
            saldo < 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className={`text-sm font-medium ${saldo > 0 ? "text-emerald-700" : saldo < 0 ? "text-red-700" : "text-gray-500"}`}>
              Saldo Atual
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              saldo > 0 ? "bg-emerald-100 text-emerald-800" :
              saldo < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
            }`}>
              {saldo > 0 ? <><TrendingUp className="w-3 h-3" /> Positivo</> :
               saldo < 0 ? <><TrendingDown className="w-3 h-3" /> Negativo</> :
               <><Minus className="w-3 h-3" /> Zerado</>}
            </span>
          </div>
          <p className={`text-2xl font-bold ${saldo > 0 ? "text-emerald-800" : saldo < 0 ? "text-red-800" : "text-gray-800"}`}>
            R$ {fmt(saldo)}
          </p>
        </div>

        {/* Entradas do mês */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-emerald-700 mb-1">Entradas do Mês</p>
          <p className="text-2xl font-bold text-emerald-800">
            R$ {fmt(data?.total_entradas_mes ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total: R$ {fmt(data?.total_entradas ?? 0)}
          </p>
        </div>

        {/* Saídas do mês */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-red-600 mb-1">Saídas do Mês</p>
          <p className="text-2xl font-bold text-red-700">
            R$ {fmt(data?.total_saidas_mes ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total: R$ {fmt(data?.total_saidas ?? 0)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar descrição ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Entrada e Saída</option>
          <option value="Entrada">Entradas</option>
          <option value="Saída">Saídas</option>
        </select>
        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Comprov.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {row.data
                      ? new Date(row.data + "T00:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs">
                    {row.descricao || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.categoria || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                    {row.valor != null ? `R$ ${fmt(row.valor)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.tipo && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.tipo === "Entrada"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {row.tipo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.comprovante ? (
                      <a
                        href={row.comprovante}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
