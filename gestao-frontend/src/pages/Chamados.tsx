import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Chamado, Prestador, MensagemPreview } from "@/api/types";
import { MessageSquare, Plus, Phone, CheckCircle, Clock, AlertTriangle, Wrench, X } from "lucide-react";

const PRIORIDADE_COLORS: Record<string, string> = {
  urgente: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  normal: "bg-blue-100 text-blue-800",
  baixa: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-yellow-100 text-yellow-800",
  em_andamento: "bg-blue-100 text-blue-800",
  resolvido: "bg-green-100 text-green-800",
  cancelado: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  cancelado: "Cancelado",
};

const TIPO_LABELS: Record<string, string> = {
  corretiva: "Corretiva",
  preventiva: "Preventiva",
  orcamento: "Orçamento",
  urgente: "Urgente",
};

const AREAS = ["Piscina", "Cozinha", "Banheiro", "Elétrica", "Hidráulica", "Estrutural", "Lazer", "Jardim", "Telhado", "Outro"];

export default function Chamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChamado, setShowNewChamado] = useState(false);
  const [showNewPrestador, setShowNewPrestador] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState<MensagemPreview | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showResolve, setShowResolve] = useState<string | null>(null);
  const [resolucao, setResolucao] = useState("");

  const [form, setForm] = useState({
    estrutura: "",
    area: "",
    descricao: "",
    prioridade: "normal",
    tipo: "corretiva",
    prestador_id: "",
    solicitante: "",
  });

  const [prestadorForm, setPrestadorForm] = useState({
    nome: "",
    telefone: "",
    especialidade: "",
    empresa: "",
    notas: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get<Chamado[]>("/api/chamados"),
        api.get<Prestador[]>("/api/prestadores"),
      ]);
      setChamados(c);
      setPrestadores(p);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateChamado = async () => {
    if (!form.estrutura || !form.descricao) return;
    try {
      const chamado = await api.post<Chamado>("/api/chamados", {
        ...form,
        prestador_id: form.prestador_id || null,
        solicitante: form.solicitante || null,
        area: form.area || null,
      });
      setChamados([chamado, ...chamados]);
      setShowNewChamado(false);
      setForm({ estrutura: "", area: "", descricao: "", prioridade: "normal", tipo: "corretiva", prestador_id: "", solicitante: "" });

      if (chamado.prestador_telefone) {
        const preview = await api.get<MensagemPreview>(`/api/chamados/${chamado.id}/whatsapp`);
        setShowWhatsApp(preview);
      }
    } catch {
      /* ignore */
    }
  };

  const handleCreatePrestador = async () => {
    if (!prestadorForm.nome || !prestadorForm.telefone) return;
    try {
      const p = await api.post<Prestador>("/api/prestadores", {
        ...prestadorForm,
        especialidade: prestadorForm.especialidade || null,
        empresa: prestadorForm.empresa || null,
        notas: prestadorForm.notas || null,
      });
      setPrestadores([...prestadores, p]);
      setShowNewPrestador(false);
      setPrestadorForm({ nome: "", telefone: "", especialidade: "", empresa: "", notas: "" });
    } catch {
      /* ignore */
    }
  };

  const handleWhatsApp = async (chamadoId: string) => {
    try {
      const preview = await api.get<MensagemPreview>(`/api/chamados/${chamadoId}/whatsapp`);
      setShowWhatsApp(preview);
    } catch {
      /* ignore */
    }
  };

  const handleResolve = async (chamadoId: string) => {
    try {
      const updated = await api.put<Chamado>(`/api/chamados/${chamadoId}`, {
        status: "resolvido",
        resolucao: resolucao || null,
      });
      setChamados(chamados.map((c) => (c.id === chamadoId ? updated : c)));
      setShowResolve(null);
      setResolucao("");
    } catch {
      /* ignore */
    }
  };

  const handleStatusChange = async (chamadoId: string, status: string) => {
    try {
      const updated = await api.put<Chamado>(`/api/chamados/${chamadoId}`, { status });
      setChamados(chamados.map((c) => (c.id === chamadoId ? updated : c)));
    } catch {
      /* ignore */
    }
  };

  const filtered = chamados.filter((c) => !filterStatus || c.status === filterStatus);

  const stats = {
    abertos: chamados.filter((c) => c.status === "aberto").length,
    em_andamento: chamados.filter((c) => c.status === "em_andamento").length,
    resolvidos: chamados.filter((c) => c.status === "resolvido").length,
    total: chamados.length,
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
          <h1 className="text-2xl font-bold text-gray-800">Chamados de Manutenção</h1>
          <p className="text-sm text-gray-500 mt-1">Acione responsáveis e acompanhe manutenções</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewPrestador(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" /> Prestador
          </button>
          <button
            onClick={() => setShowNewChamado(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Chamado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm text-gray-500">Abertos</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.abertos}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Wrench className="w-4 h-4" />
            <span className="text-sm text-gray-500">Em andamento</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.em_andamento}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm text-gray-500">Resolvidos</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.resolvidos}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm text-gray-500">Prestadores</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{prestadores.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "aberto", "em_andamento", "resolvido", "cancelado"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-green-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Todos"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((chamado) => (
          <div key={chamado.id} className="bg-white rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono text-gray-400">#{String(chamado.numero).padStart(3, "0")}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[chamado.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[chamado.status] || chamado.status}
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PRIORIDADE_COLORS[chamado.prioridade] || "bg-gray-100"}`}>
                    {chamado.prioridade}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {TIPO_LABELS[chamado.tipo] || chamado.tipo}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-800 mt-1">{chamado.estrutura}</h3>
                {chamado.area && <p className="text-xs text-gray-400">{chamado.area}</p>}
                <p className="text-sm text-gray-600 mt-1">{chamado.descricao}</p>
                {chamado.prestador_nome && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Responsável:</span> {chamado.prestador_nome}
                    {chamado.prestador_telefone && ` (${chamado.prestador_telefone})`}
                  </p>
                )}
                {chamado.solicitante && (
                  <p className="text-xs text-gray-400 mt-1">Solicitante: {chamado.solicitante}</p>
                )}
                {chamado.resolucao && (
                  <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded">
                    <span className="font-medium">Resolução:</span> {chamado.resolucao}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(chamado.created_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(chamado.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2">
                {chamado.prestador_telefone && (
                  <button
                    onClick={() => handleWhatsApp(chamado.id)}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> WhatsApp
                  </button>
                )}
                {chamado.status === "aberto" && (
                  <button
                    onClick={() => handleStatusChange(chamado.id, "em_andamento")}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" /> Iniciar
                  </button>
                )}
                {(chamado.status === "aberto" || chamado.status === "em_andamento") && (
                  <button
                    onClick={() => setShowResolve(chamado.id)}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Resolver
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum chamado encontrado</p>
          </div>
        )}
      </div>

      {showNewChamado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Novo Chamado</h2>
              <button onClick={() => setShowNewChamado(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estrutura / Equipamento *</label>
                <input
                  type="text"
                  placeholder="Ex: Bomba da piscina, Encanamento banheiro..."
                  value={form.estrutura}
                  onChange={(e) => setForm({ ...form, estrutura: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do problema *</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que está acontecendo..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="corretiva">Corretiva</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="orcamento">Orçamento</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável / Prestador</label>
                <select
                  value={form.prestador_id}
                  onChange={(e) => setForm({ ...form, prestador_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sem prestador vinculado</option>
                  {prestadores.filter((p) => p.ativo).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.especialidade ? `(${p.especialidade})` : ""} - {p.telefone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                <input
                  type="text"
                  placeholder="Quem está solicitando?"
                  value={form.solicitante}
                  onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleCreateChamado}
                disabled={!form.estrutura || !form.descricao}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Chamado
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewPrestador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Novo Prestador</h2>
              <button onClick={() => setShowNewPrestador(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  placeholder="Nome do prestador"
                  value={prestadorForm.nome}
                  onChange={(e) => setPrestadorForm({ ...prestadorForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp) *</label>
                <input
                  type="text"
                  placeholder="(XX) XXXXX-XXXX"
                  value={prestadorForm.telefone}
                  onChange={(e) => setPrestadorForm({ ...prestadorForm, telefone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                <input
                  type="text"
                  placeholder="Ex: Eletricista, Encanador, Piscineiro..."
                  value={prestadorForm.especialidade}
                  onChange={(e) => setPrestadorForm({ ...prestadorForm, especialidade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <input
                  type="text"
                  placeholder="Nome da empresa (opcional)"
                  value={prestadorForm.empresa}
                  onChange={(e) => setPrestadorForm({ ...prestadorForm, empresa: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  placeholder="Observações sobre o prestador..."
                  value={prestadorForm.notas}
                  onChange={(e) => setPrestadorForm({ ...prestadorForm, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleCreatePrestador}
                disabled={!prestadorForm.nome || !prestadorForm.telefone}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cadastrar Prestador
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" /> Mensagem WhatsApp
              </h2>
              <button onClick={() => setShowWhatsApp(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{showWhatsApp.mensagem}</p>
              </div>
              <a
                href={showWhatsApp.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Enviar via WhatsApp
              </a>
              <p className="text-xs text-gray-400 text-center">
                Clique para abrir o WhatsApp com a mensagem pronta
              </p>
            </div>
          </div>
        </div>
      )}

      {showResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Resolver Chamado</h2>
              <button onClick={() => { setShowResolve(null); setResolucao(""); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O que foi feito?</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a resolução..."
                  value={resolucao}
                  onChange={(e) => setResolucao(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={() => handleResolve(showResolve)}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
              >
                Marcar como Resolvido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
