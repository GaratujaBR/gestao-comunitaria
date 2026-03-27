import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Enquete } from "@/api/types";
import { Plus, X, BarChart3, Trash2 } from "lucide-react";

const categoriaColors: Record<string, string> = {
  decisao: "bg-blue-100 text-blue-800",
  feedback: "bg-purple-100 text-purple-800",
  preferencia: "bg-amber-100 text-amber-800",
  aprovacao: "bg-green-100 text-green-800",
};

const categoriaLabels: Record<string, string> = {
  decisao: "Decisao",
  feedback: "Feedback",
  preferencia: "Preferencia",
  aprovacao: "Aprovacao",
};

export default function Enquetes() {
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [votante, setVotante] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "decisao",
    opcoes: ["", ""],
    criador: "",
    multipla_escolha: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.get<Enquete[]>("/api/enquetes");
      setEnquetes(result);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = enquetes.filter((e) => {
    if (categoriaFilter && e.categoria !== categoriaFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const createEnquete = async () => {
    try {
      const opcoes = form.opcoes.filter((o) => o.trim() !== "");
      if (opcoes.length < 2) return;
      await api.post("/api/enquetes", { ...form, opcoes });
      setShowModal(false);
      setForm({
        titulo: "",
        descricao: "",
        categoria: "decisao",
        opcoes: ["", ""],
        criador: "",
        multipla_escolha: false,
      });
      load();
    } catch {
      /* ignore */
    }
  };

  const votar = async (enqueteId: string, opcaoIndex: number) => {
    if (!votante.trim()) return;
    try {
      await api.post(`/api/enquetes/${enqueteId}/votar`, {
        opcao_index: opcaoIndex,
        votante: votante.trim(),
      });
      load();
    } catch {
      /* ignore */
    }
  };

  const encerrar = async (id: string) => {
    try {
      await api.put(`/api/enquetes/${id}`, { status: "encerrada" });
      load();
    } catch {
      /* ignore */
    }
  };

  const deletar = async (id: string) => {
    try {
      await api.del(`/api/enquetes/${id}`);
      load();
    } catch {
      /* ignore */
    }
  };

  const addOpcao = () => {
    setForm({ ...form, opcoes: [...form.opcoes, ""] });
  };

  const updateOpcao = (index: number, value: string) => {
    const opcoes = [...form.opcoes];
    opcoes[index] = value;
    setForm({ ...form, opcoes });
  };

  const removeOpcao = (index: number) => {
    if (form.opcoes.length <= 2) return;
    const opcoes = form.opcoes.filter((_, i) => i !== index);
    setForm({ ...form, opcoes });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Enquetes</h1>
          <p className="text-sm text-gray-500 mt-1">{enquetes.length} enquetes registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Seu nome para votar"
            value={votante}
            onChange={(e) => setVotante(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Nova Enquete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setCategoriaFilter("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!categoriaFilter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Todas
          </button>
          {Object.entries(categoriaLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoriaFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${categoriaFilter === key ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!statusFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter("aberta")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === "aberta" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Abertas
          </button>
          <button
            onClick={() => setStatusFilter("encerrada")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === "encerrada" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Encerradas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((e) => {
          const maxVotos = Math.max(...Object.values(e.votos).map(Number), 1);
          return (
            <div key={e.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${categoriaColors[e.categoria] || "bg-gray-100 text-gray-700"}`}
                    >
                      {categoriaLabels[e.categoria] || e.categoria}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${e.status === "aberta" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {e.status === "aberta" ? "Aberta" : "Encerrada"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{e.titulo}</h3>
                  {e.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{e.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {e.status === "aberta" && (
                    <button
                      onClick={() => encerrar(e.id)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 rounded"
                      title="Encerrar"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deletar(e.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {e.opcoes.map((opcao, idx) => {
                  const count = e.votos[String(idx)] || 0;
                  const pct = e.total_votos > 0 ? (count / e.total_votos) * 100 : 0;
                  const width = maxVotos > 0 ? (count / maxVotos) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2">
                        {e.status === "aberta" && (
                          <button
                            onClick={() => votar(e.id, idx)}
                            disabled={!votante.trim()}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 shrink-0"
                          >
                            Votar
                          </button>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-0.5">
                            <span className="text-gray-700">{opcao}</span>
                            <span className="text-gray-500 text-xs">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-gray-400">
                  {e.total_votos} voto{e.total_votos !== 1 ? "s" : ""}
                  {e.criador && ` - por ${e.criador}`}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(e.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            Nenhuma enquete encontrada
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Nova Enquete</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Titulo da enquete"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                placeholder="Descricao (opcional)"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opcoes</label>
                {form.opcoes.map((opcao, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      placeholder={`Opcao ${idx + 1}`}
                      value={opcao}
                      onChange={(e) => updateOpcao(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {form.opcoes.length > 2 && (
                      <button
                        onClick={() => removeOpcao(idx)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOpcao}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Adicionar opcao
                </button>
              </div>
              <input
                placeholder="Criador"
                value={form.criador}
                onChange={(e) => setForm({ ...form, criador: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.multipla_escolha}
                  onChange={(e) => setForm({ ...form, multipla_escolha: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Permitir multipla escolha
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createEnquete}
                  disabled={!form.titulo || form.opcoes.filter((o) => o.trim()).length < 2}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Criar Enquete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
