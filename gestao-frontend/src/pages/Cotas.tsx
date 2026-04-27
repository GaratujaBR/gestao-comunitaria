import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Cota, Profile } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Landmark, Users, ChevronDown } from "lucide-react";

const emptyCotaForm = { slug: "", numero: "", nome: "" };
const emptyProfileForm = {
  slug: "",
  nome_completo: "",
  nome_curto: "",
  email: "",
  telefone: "",
  role: "",
  lote: "",
};

export default function Cotas() {
  const [cotas, setCotas] = useState<Cota[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Cota dialog
  const [cotaOpen, setCotaOpen] = useState(false);
  const [cotaEditing, setCotaEditing] = useState<string | null>(null);
  const [cotaForm, setCotaForm] = useState(emptyCotaForm);
  const [cotaError, setCotaError] = useState("");

  // Member dialog
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEditing, setMemberEditing] = useState<string | null>(null);
  const [memberCotaSlug, setMemberCotaSlug] = useState("");
  const [memberForm, setMemberForm] = useState(emptyProfileForm);
  const [memberError, setMemberError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        api.get<Cota[]>("/api/cotas"),
        api.get<Profile[]>("/api/profiles"),
      ]);
      setCotas(cs);
      setProfiles(ps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Cota handlers ──────────────────────────────────────────
  const openEditCota = (c: Cota) => {
    setCotaForm({ slug: c.slug, numero: c.numero.toString(), nome: c.nome });
    setCotaEditing(c.slug);
    setCotaError("");
    setCotaOpen(true);
  };

  const saveCota = async () => {
    if (!cotaForm.nome) {
      setCotaError("Nome é obrigatório.");
      return;
    }
    try {
      await api.put(`/api/cotas/${cotaEditing}`, { nome: cotaForm.nome });
      setCotaOpen(false);
      load();
    } catch (e: unknown) {
      setCotaError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const removeCota = async (slug: string) => {
    if (!confirm("Remover esta bolinha?")) return;
    await api.del(`/api/cotas/${slug}`);
    load();
  };

  // ── Member handlers ────────────────────────────────────────
  const openNewMember = (cotaSlug: string) => {
    setMemberForm(emptyProfileForm);
    setMemberEditing(null);
    setMemberCotaSlug(cotaSlug);
    setMemberError("");
    setMemberOpen(true);
  };

  const openEditMember = (p: Profile) => {
    setMemberForm({
      slug: p.slug,
      nome_completo: p.nome_completo,
      nome_curto: p.nome_curto || "",
      email: p.email || "",
      telefone: p.telefone || "",
      role: p.role || "",
      lote: p.lote || "",
    });
    setMemberEditing(p.slug);
    setMemberCotaSlug(p.cota_slug || "");
    setMemberError("");
    setMemberOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.nome_completo) {
      setMemberError("Nome completo é obrigatório.");
      return;
    }
    try {
      const payload = {
        nome_completo: memberForm.nome_completo,
        nome_curto: memberForm.nome_curto || null,
        email: memberForm.email || null,
        telefone: memberForm.telefone || null,
        role: memberForm.role || null,
        lote: memberForm.lote || null,
        cota_slug: memberCotaSlug || null,
      };
      if (memberEditing) {
        await api.put(`/api/profiles/${memberEditing}`, payload);
      } else {
        await api.post("/api/profiles", {
          ...payload,
          slug: memberForm.slug || memberForm.nome_completo.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        });
      }
      setMemberOpen(false);
      load();
    } catch (e: unknown) {
      setMemberError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const removeMember = async () => {
    if (!memberEditing) return;
    if (!confirm("Remover este membro?")) return;
    await api.del(`/api/profiles/${memberEditing}`);
    setMemberOpen(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bolinhas</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
        </div>
      ) : cotas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma bolinha cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cotas.map((c) => {
            const membros = profiles.filter((p) => p.cota_slug === c.slug);
            const isExpanded = expandedSlug === c.slug;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-[#E7E5E4]">
                {/* Card header — clickable to toggle accordion */}
                <div
                  className="p-5 cursor-pointer select-none"
                  onClick={() => setExpandedSlug(isExpanded ? null : c.slug)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1F6B3A] bg-[#D5E8D4] px-2 py-0.5 rounded-full">
                          #{c.numero}
                        </span>
                        {!c.ativo && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            inativa
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#1A1A1A] mt-1">{c.nome}</h3>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">@{c.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditCota(c); }}
                        className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                      >
                        <Pencil className="w-4 h-4 text-[#4D4D4D]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCota(c.slug); }}
                        className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8A8A] ml-1 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#4D4D4D] mt-2">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {membros.length} membro{membros.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Accordion body */}
                {isExpanded && (
                  <div className="border-t border-[#F5F5F4] px-5 pb-4 pt-3">
                    <div className="space-y-2">
                      {membros.map((p) => (
                        <button
                          key={p.slug}
                          onClick={() => openEditMember(p)}
                          className="w-full text-left p-3 rounded-lg bg-[#F8F7F4] hover:bg-[#ECF7EE] border border-[#E7E5E4] hover:border-[#88C9A1] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1A1A1A]">
                                {p.nome_completo}
                              </p>
                              {(p.email || p.telefone) && (
                                <p className="text-xs text-[#8A8A8A] mt-0.5 truncate">
                                  {p.email || p.telefone}
                                </p>
                              )}
                            </div>
                            {p.role && (
                              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#D5E8D4] text-[#1F6B3A] font-medium">
                                {p.role}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      {membros.length === 0 && (
                        <p className="text-sm text-[#8A8A8A] py-1">Nenhum membro cadastrado.</p>
                      )}
                    </div>
                    <button
                      onClick={() => openNewMember(c.slug)}
                      className="mt-3 flex items-center gap-1.5 text-sm text-[#1F6B3A] hover:text-[#2D5A27] font-medium"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Membro
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cota edit dialog */}
      <Dialog open={cotaOpen} onOpenChange={setCotaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Bolinha</DialogTitle>
            <DialogDescription>Atualize o nome da bolinha.</DialogDescription>
          </DialogHeader>
          {cotaError && <p className="text-sm text-red-600">{cotaError}</p>}
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={cotaForm.nome}
                onChange={(e) => setCotaForm({ ...cotaForm, nome: e.target.value })}
                placeholder="Família Silva"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCotaOpen(false)}>Cancelar</Button>
              <Button onClick={saveCota}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member dialog */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{memberEditing ? "Editar Membro" : "Adicionar Membro"}</DialogTitle>
            <DialogDescription>
              {memberEditing
                ? "Atualize os dados do membro."
                : `Novo membro para a bolinha @${memberCotaSlug}.`}
            </DialogDescription>
          </DialogHeader>
          {memberError && <p className="text-sm text-red-600">{memberError}</p>}
          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={memberForm.nome_completo}
                onChange={(e) => setMemberForm({ ...memberForm, nome_completo: e.target.value })}
                placeholder="Maria da Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Curto</Label>
                <Input
                  value={memberForm.nome_curto}
                  onChange={(e) => setMemberForm({ ...memberForm, nome_curto: e.target.value })}
                  placeholder="Maria"
                />
              </div>
              {!memberEditing && (
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={memberForm.slug}
                    onChange={(e) => setMemberForm({ ...memberForm, slug: e.target.value })}
                    placeholder="maria-silva"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={memberForm.telefone}
                  onChange={(e) => setMemberForm({ ...memberForm, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lote</Label>
                <Input
                  value={memberForm.lote}
                  onChange={(e) => setMemberForm({ ...memberForm, lote: e.target.value })}
                  placeholder="A1"
                />
              </div>
              <div>
                <Label>Papel</Label>
                <Input
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  placeholder="morador"
                />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              {memberEditing && (
                <Button variant="outline" onClick={removeMember} className="text-red-500 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" /> Remover
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancelar</Button>
                <Button onClick={saveMember}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
