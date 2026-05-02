import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Enquete, Profile } from "@/api/types";
import { Plus, X, BarChart3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoriaColors: Record<string, string> = {
  decisao:    "bg-blue-50 text-blue-700",
  feedback:   "bg-purple-50 text-purple-700",
  preferencia:"bg-amber-50 text-amber-700",
  aprovacao:  "bg-[#D5E8D4] text-[#1F6B3A]",
};

const categoriaLabels: Record<string, string> = {
  decisao:    "Decisão",
  feedback:   "Feedback",
  preferencia:"Preferência",
  aprovacao:  "Aprovação",
};

export default function Enquetes() {
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [votoError, setVotoError] = useState("");
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
      const [es, ps] = await Promise.all([
        api.get<Enquete[]>("/api/enquetes"),
        api.get<Profile[]>("/api/profiles"),
      ]);
      setEnquetes(es);
      setProfiles(ps);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = enquetes.filter((e) => {
    if (categoriaFilter && e.categoria !== categoriaFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const createEnquete = async () => {
    const opcoes = form.opcoes.filter((o) => o.trim() !== "");
    if (opcoes.length < 2) return;
    try {
      await api.post("/api/enquetes", { ...form, opcoes });
      setShowModal(false);
      setForm({ titulo: "", descricao: "", categoria: "decisao", opcoes: ["", ""], criador: "", multipla_escolha: false });
      load();
    } catch { /* ignore */ }
  };

  const votar = async (enqueteId: string, opcaoIndex: number) => {
    if (!selectedProfile) return;
    const profile = profiles.find((p) => p.slug === selectedProfile);
    if (!profile?.cota_slug) { setVotoError("Perfil não pertence a uma bolinha."); return; }
    setVotoError("");
    try {
      await api.post(`/api/enquetes/${enqueteId}/votar`, { opcao_index: opcaoIndex, cota_slug: profile.cota_slug });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setVotoError(msg.includes("409") || msg.toLowerCase().includes("cota") ? "Sua bolinha já votou nesta enquete." : msg || "Erro ao votar.");
    }
  };

  const encerrar = async (id: string) => {
    try { await api.put(`/api/enquetes/${id}`, { status: "encerrada" }); load(); } catch { /* ignore */ }
  };

  const deletar = async (id: string) => {
    try { await api.del(`/api/enquetes/${id}`); load(); } catch { /* ignore */ }
  };

  const addOpcao = () => setForm({ ...form, opcoes: [...form.opcoes, ""] });

  const updateOpcao = (index: number, value: string) => {
    const opcoes = [...form.opcoes];
    opcoes[index] = value;
    setForm({ ...form, opcoes });
  };

  const removeOpcao = (index: number) => {
    if (form.opcoes.length <= 2) return;
    setForm({ ...form, opcoes: form.opcoes.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
      </div>
    );
  }

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#1F6B3A] text-white" : "bg-[#F8F7F4] text-[#4D4D4D] hover:bg-[#E7E5E4]"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Enquetes</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">{enquetes.length} enquetes registradas</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <select
              value={selectedProfile}
              onChange={(e) => { setSelectedProfile(e.target.value); setVotoError(""); }}
              className="px-3 py-2 border border-[#E7E5E4] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6B3A]/20 focus:border-[#1F6B3A] text-[#1A1A1A]"
            >
              <option value="">Quem está votando?</option>
              {profiles.filter((p) => p.ativo && p.cota_slug).map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nome_curto || p.nome_completo} ({p.cota_slug})
                </option>
              ))}
            </select>
            {votoError && <span className="text-xs text-red-500">{votoError}</span>}
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1F6B3A] hover:bg-[#155A2A]">
            <Plus className="w-4 h-4" />
            Nova Enquete
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2">
          <button onClick={() => setCategoriaFilter("")} className={filterBtn(!categoriaFilter)}>Todas</button>
          {Object.entries(categoriaLabels).map(([key, label]) => (
            <button key={key} onClick={() => setCategoriaFilter(key)} className={filterBtn(categoriaFilter === key)}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-4">
          <button onClick={() => setStatusFilter("")} className={filterBtn(!statusFilter)}>Todos</button>
          <button onClick={() => setStatusFilter("aberta")} className={filterBtn(statusFilter === "aberta")}>Abertas</button>
          <button onClick={() => setStatusFilter("encerrada")} className={filterBtn(statusFilter === "encerrada")}>Encerradas</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((e) => {
          const maxVotos = Math.max(...Object.values(e.votos).map(Number), 1);
          return (
            <div key={e.id} className="bg-white rounded-xl border border-[#E7E5E4] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColors[e.categoria] || "bg-[#F8F7F4] text-[#4D4D4D]"}`}>
                      {categoriaLabels[e.categoria] || e.categoria}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === "aberta" ? "bg-[#D5E8D4] text-[#1F6B3A]" : "bg-[#F8F7F4] text-[#8A8A8A]"}`}>
                      {e.status === "aberta" ? "Aberta" : "Encerrada"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A]">{e.titulo}</h3>
                  {e.descricao && <p className="text-sm text-[#4D4D4D] mt-1">{e.descricao}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {e.status === "aberta" && (
                    <button onClick={() => encerrar(e.id)} className="p-1.5 text-[#8A8A8A] hover:text-amber-600 rounded-lg hover:bg-[#F8F7F4]" title="Encerrar">
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deletar(e.id)} className="p-1.5 text-[#8A8A8A] hover:text-red-600 rounded-lg hover:bg-[#F8F7F4]" title="Excluir">
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
                            disabled={!selectedProfile}
                            className="px-2 py-1 text-xs bg-[#D5E8D4] text-[#1F6B3A] rounded-lg hover:bg-[#88C9A1]/30 disabled:opacity-40 shrink-0 font-medium"
                          >
                            Votar
                          </button>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-0.5">
                            <span className="text-[#1A1A1A]">{opcao}</span>
                            <span className="text-[#8A8A8A] text-xs">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-[#F8F7F4] rounded-full h-2">
                            <div className="bg-[#1F6B3A] h-2 rounded-full transition-all" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F4]">
                <span className="text-xs text-[#8A8A8A]">
                  {e.total_votos} voto{e.total_votos !== 1 ? "s" : ""}
                  {e.criador && ` · ${e.criador}`}
                </span>
                <span className="text-xs text-[#8A8A8A]">
                  {new Date(e.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-[#8A8A8A]">
            Nenhuma enquete encontrada.
          </div>
        )}
      </div>

      {/* Dialog: Nova Enquete */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Enquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Título *</Label>
              <Input
                placeholder="Título da enquete"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição (opcional)"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-[#E7E5E4] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6B3A]/20 focus:border-[#1F6B3A]"
              >
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Opções *</Label>
              <div className="space-y-2 mt-1">
                {form.opcoes.map((opcao, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder={`Opção ${idx + 1}`}
                      value={opcao}
                      onChange={(e) => updateOpcao(idx, e.target.value)}
                    />
                    {form.opcoes.length > 2 && (
                      <button onClick={() => removeOpcao(idx)} className="p-1.5 text-[#8A8A8A] hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addOpcao} className="text-sm text-[#1F6B3A] hover:text-[#155A2A] font-medium">
                  + Adicionar opção
                </button>
              </div>
            </div>
            <div>
              <Label>Criador</Label>
              <Input
                placeholder="Nome do criador"
                value={form.criador}
                onChange={(e) => setForm({ ...form, criador: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#4D4D4D] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.multipla_escolha}
                onChange={(e) => setForm({ ...form, multipla_escolha: e.target.checked })}
                className="w-4 h-4 accent-[#1F6B3A]"
              />
              Permitir múltipla escolha
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button
                onClick={createEnquete}
                disabled={!form.titulo || form.opcoes.filter((o) => o.trim()).length < 2}
                className="bg-[#1F6B3A] hover:bg-[#155A2A]"
              >
                Criar Enquete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
