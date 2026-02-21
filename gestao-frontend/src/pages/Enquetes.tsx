import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Vote, Plus, X, BarChart3, CheckCircle, Clock, Lock, Users } from "lucide-react";

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  opcoes: string[];
  votos: Record<string, number>;
  votantes: Record<string, number[]>;
  criador: string | null;
  status: string;
  multipla_escolha: boolean;
  total_votos: number;
  data_encerramento: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  decisao: "Decisão",
  prioridade: "Prioridade",
  opiniao: "Opinião",
  data: "Data/Agenda",
  compras: "Compras",
};

const CATEGORIA_COLORS: Record<string, string> = {
  decisao: "bg-blue-100 text-blue-800",
  prioridade: "bg-orange-100 text-orange-800",
  opiniao: "bg-purple-100 text-purple-800",
  data: "bg-pink-100 text-pink-800",
  compras: "bg-emerald-100 text-emerald-800",
};

export default function Enquetes() {
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [votante, setVotante] = useState("");
  const [showVotantePrompt, setShowVotantePrompt] = useState<{ enqueteId: string; opcaoIndex: number } | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "decisao",
    opcoes: ["", ""],
    criador: "",
    multipla_escolha: false,
  });

  const fetchEnquetes = async () => {
    setLoading(true);
    try {
      const data = await api.get<Enquete[]>("/api/enquetes");
      setEnquetes(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquetes();
  }, []);

  const handleCreate = async () => {
    const validOpcoes = form.opcoes.filter((o) => o.trim());
    if (!form.titulo || validOpcoes.length < 2) return;
    try {
      const enquete = await api.post<Enquete>("/api/enquetes", {
        titulo: form.titulo,
        descricao: form.descricao || null,
        categoria: form.categoria,
        opcoes: validOpcoes,
        criador: form.criador || null,
        multipla_escolha: form.multipla_escolha,
      });
      setEnquetes([enquete, ...enquetes]);
      setShowNew(false);
      setForm({ titulo: "", descricao: "", categoria: "decisao", opcoes: ["", ""], criador: "", multipla_escolha: false });
    } catch {
      /* ignore */
    }
  };

  const handleVote = async (enqueteId: string, opcaoIndex: number) => {
    if (!votante.trim()) {
      setShowVotantePrompt({ enqueteId, opcaoIndex });
      return;
    }
    try {
      const updated = await api.post<Enquete>(`/api/enquetes/${enqueteId}/votar`, {
        opcao_index: opcaoIndex,
        votante: votante.trim(),
      });
      setEnquetes(enquetes.map((e) => (e.id === enqueteId ? updated : e)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao votar");
    }
  };

  const confirmVote = async () => {
    if (!showVotantePrompt || !votante.trim()) return;
    setShowVotantePrompt(null);
    await handleVote(showVotantePrompt.enqueteId, showVotantePrompt.opcaoIndex);
  };

  const handleEncerrar = async (enqueteId: string) => {
    try {
      const updated = await api.put<Enquete>(`/api/enquetes/${enqueteId}`, { status: "encerrada" });
      setEnquetes(enquetes.map((e) => (e.id === enqueteId ? updated : e)));
    } catch {
      /* ignore */
    }
  };

  const handleReabrir = async (enqueteId: string) => {
    try {
      const updated = await api.put<Enquete>(`/api/enquetes/${enqueteId}`, { status: "aberta" });
      setEnquetes(enquetes.map((e) => (e.id === enqueteId ? updated : e)));
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (enqueteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta enquete?")) return;
    try {
      await api.del(`/api/enquetes/${enqueteId}`);
      setEnquetes(enquetes.filter((e) => e.id !== enqueteId));
    } catch {
      /* ignore */
    }
  };

  const addOpcao = () => {
    setForm({ ...form, opcoes: [...form.opcoes, ""] });
  };

  const removeOpcao = (index: number) => {
    if (form.opcoes.length <= 2) return;
    setForm({ ...form, opcoes: form.opcoes.filter((_, i) => i !== index) });
  };

  const updateOpcao = (index: number, value: string) => {
    const newOpcoes = [...form.opcoes];
    newOpcoes[index] = value;
    setForm({ ...form, opcoes: newOpcoes });
  };

  const filtered = enquetes.filter((e) => {
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterCategoria && e.categoria !== filterCategoria) return false;
    return true;
  });

  const stats = {
    abertas: enquetes.filter((e) => e.status === "aberta").length,
    encerradas: enquetes.filter((e) => e.status === "encerrada").length,
    total_votos: enquetes.reduce((acc, e) => acc + e.total_votos, 0),
    total: enquetes.length,
  };

  const getPercentage = (votos: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votos / total) * 100);
  };

  const getWinnerIndex = (enquete: Enquete) => {
    let maxVotes = 0;
    let winnerIdx = -1;
    for (const [idx, count] of Object.entries(enquete.votos)) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerIdx = parseInt(idx);
      }
    }
    return maxVotes > 0 ? winnerIdx : -1;
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
          <p className="text-sm text-gray-500 mt-1">Vote e decida junto com a comunidade</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Enquete
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm text-gray-500">Abertas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.abertas}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Lock className="w-4 h-4" />
            <span className="text-sm text-gray-500">Encerradas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.encerradas}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm text-gray-500">Total Enquetes</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm text-gray-500">Total Votos</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total_votos}</p>
        </div>
      </div>

      {votante && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 flex items-center justify-between">
          <span>Votando como: <strong>{votante}</strong></span>
          <button onClick={() => setVotante("")} className="text-green-600 hover:text-green-800 text-xs underline">Trocar</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2">
          {["", "aberta", "encerrada"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s ? "bg-green-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "" ? "Todas" : s === "aberta" ? "Abertas" : "Encerradas"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["", "decisao", "prioridade", "opiniao", "data", "compras"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategoria(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCategoria === c ? "bg-green-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c === "" ? "Todas" : CATEGORIA_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((enquete) => {
          const winnerIdx = getWinnerIndex(enquete);
          return (
            <div key={enquete.id} className="bg-white rounded-lg border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      enquete.status === "aberta" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {enquete.status === "aberta" ? "Aberta" : "Encerrada"}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORIA_COLORS[enquete.categoria] || "bg-gray-100"}`}>
                      {CATEGORIA_LABELS[enquete.categoria] || enquete.categoria}
                    </span>
                    {enquete.multipla_escolha && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Múltipla escolha</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{enquete.titulo}</h3>
                  {enquete.descricao && <p className="text-sm text-gray-500 mt-1">{enquete.descricao}</p>}
                  {enquete.criador && <p className="text-xs text-gray-400 mt-1">Criado por: {enquete.criador}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{enquete.total_votos} voto{enquete.total_votos !== 1 ? "s" : ""}</span>
                  {enquete.status === "aberta" ? (
                    <button
                      onClick={() => handleEncerrar(enquete.id)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> Encerrar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReabrir(enquete.id)}
                      className="px-3 py-1.5 border border-green-300 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> Reabrir
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(enquete.id)}
                    className="px-2 py-1.5 text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {enquete.opcoes.map((opcao, idx) => {
                  const voteCount = enquete.votos[String(idx)] || 0;
                  const pct = getPercentage(voteCount, enquete.total_votos);
                  const isWinner = idx === winnerIdx && enquete.total_votos > 0;
                  const hasVoted = votante && enquete.votantes[votante]?.includes(idx);

                  return (
                    <div key={idx} className="relative">
                      <div
                        className={`relative flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isWinner ? "border-green-300 bg-green-50" : "border-gray-200"
                        } ${enquete.status === "aberta" && !hasVoted ? "cursor-pointer hover:border-green-400 hover:bg-green-50/50" : ""}`}
                        onClick={() => enquete.status === "aberta" && !hasVoted && handleVote(enquete.id, idx)}
                      >
                        <div
                          className={`absolute inset-0 rounded-lg ${isWinner ? "bg-green-100" : "bg-gray-100"} opacity-30`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center gap-3 flex-1">
                          {enquete.status === "aberta" && !hasVoted && (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          {hasVoted && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                          {enquete.status === "encerrada" && !hasVoted && isWinner && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isWinner ? "font-semibold text-gray-800" : "text-gray-700"}`}>{opcao}</span>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">{voteCount}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                {new Date(enquete.created_at).toLocaleDateString("pt-BR")} às{" "}
                {new Date(enquete.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Vote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma enquete encontrada</p>
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Nova Enquete</h2>
              <button onClick={() => setShowNew(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta *</label>
                <input
                  type="text"
                  placeholder="Ex: O que devemos comprar agora?"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Contexto adicional..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="decisao">Decisão</option>
                    <option value="prioridade">Prioridade</option>
                    <option value="opiniao">Opinião</option>
                    <option value="data">Data/Agenda</option>
                    <option value="compras">Compras</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Criado por</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={form.criador}
                    onChange={(e) => setForm({ ...form, criador: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opções *</label>
                <div className="space-y-2">
                  {form.opcoes.map((opcao, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Opção ${idx + 1}`}
                        value={opcao}
                        onChange={(e) => updateOpcao(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {form.opcoes.length > 2 && (
                        <button onClick={() => removeOpcao(idx)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addOpcao}
                  className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar opção
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multipla"
                  checked={form.multipla_escolha}
                  onChange={(e) => setForm({ ...form, multipla_escolha: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="multipla" className="text-sm text-gray-700">Permitir múltipla escolha</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.titulo || form.opcoes.filter((o) => o.trim()).length < 2}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Enquete
              </button>
            </div>
          </div>
        </div>
      )}

      {showVotantePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Identificação</h2>
              <button onClick={() => setShowVotantePrompt(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">Informe seu nome para votar:</p>
              <input
                type="text"
                placeholder="Seu nome"
                value={votante}
                onChange={(e) => setVotante(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmVote()}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowVotantePrompt(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmVote}
                disabled={!votante.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Votar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
