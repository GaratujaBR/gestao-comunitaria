import { useEffect, useRef, useState } from "react";
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
import { Plus, Pencil, Trash2, Landmark, ChevronDown, Camera } from "lucide-react";

const AVATAR_COLORS = [
  "bg-green-200 text-green-800",
  "bg-blue-200 text-blue-800",
  "bg-purple-200 text-purple-800",
  "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800",
  "bg-cyan-200 text-cyan-800",
  "bg-indigo-200 text-indigo-800",
  "bg-teal-200 text-teal-800",
];

function avatarColor(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function resizeToBase64(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const emptyCotaForm = { slug: "", numero: "", nome: "" };
const emptyProfileForm = {
  slug: "",
  nome_completo: "",
  nome_curto: "",
  email: "",
  telefone: "",
  lote: "",
  foto_url: "",
};

export default function Cotas() {
  const [cotas, setCotas] = useState<Cota[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

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

  // ── Photo upload ───────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeToBase64(file);
    setMemberForm((f) => ({ ...f, foto_url: base64 }));
    e.target.value = "";
  };

  // ── Cota handlers ──────────────────────────────────────────
  const openEditCota = (c: Cota) => {
    setCotaForm({ slug: c.slug, numero: c.numero.toString(), nome: c.nome });
    setCotaEditing(c.slug);
    setCotaError("");
    setCotaOpen(true);
  };

  const saveCota = async () => {
    if (!cotaForm.nome) { setCotaError("Nome é obrigatório."); return; }
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
      lote: p.lote || "",
      foto_url: p.foto_url || "",
    });
    setMemberEditing(p.slug);
    setMemberCotaSlug(p.cota_slug || "");
    setMemberError("");
    setMemberOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.nome_completo) { setMemberError("Nome completo é obrigatório."); return; }
    try {
      const payload = {
        nome_completo: memberForm.nome_completo,
        nome_curto: memberForm.nome_curto || null,
        email: memberForm.email || null,
        telefone: memberForm.telefone || null,
        lote: memberForm.lote || null,
        foto_url: memberForm.foto_url || null,
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
              <div key={c.id} className="bg-white rounded-xl border border-[#E7E5E4] flex flex-col">
                {/* Card header */}
                <div
                  className="p-4 flex items-start justify-between cursor-pointer select-none lg:cursor-default"
                  onClick={() => setExpandedSlug(isExpanded ? null : c.slug)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1F6B3A] bg-[#D5E8D4] px-2 py-0.5 rounded-full">
                        #{c.numero}
                      </span>
                      {!c.ativo && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">inativa</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mt-1 truncate">{c.nome}</h3>
                    <p className="text-xs text-[#8A8A8A]">@{c.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditCota(c); }}
                      className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#4D4D4D]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCota(c.slug); }}
                      className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8A8A] ml-1 transition-transform duration-200 lg:hidden ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Members: accordion mobile, always visible desktop */}
                <div className={`border-t border-[#F5F5F4] px-4 pb-4 pt-3 ${isExpanded ? "block" : "hidden"} lg:block`}>
                  {membros.length === 0 ? (
                    <p className="text-xs text-[#8A8A8A] py-1">Sem membros.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {membros.map((p) => (
                        <button
                          key={p.slug}
                          onClick={(e) => { e.stopPropagation(); openEditMember(p); }}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#ECF7EE] transition-colors"
                        >
                          {p.foto_url ? (
                            <img
                              src={p.foto_url}
                              alt={p.nome_completo}
                              className="w-11 h-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(p.slug)}`}>
                              {initials(p.nome_completo)}
                            </div>
                          )}
                          <p className="text-[11px] font-medium text-[#1A1A1A] max-w-[56px] truncate text-center leading-tight">
                            {p.nome_curto || p.nome_completo.split(" ")[0]}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openNewMember(c.slug); }}
                    className="mt-3 flex items-center gap-1 text-xs text-[#1F6B3A] hover:text-[#2D5A27] font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Membro
                  </button>
                </div>
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
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{memberEditing ? "Editar Membro" : "Adicionar Membro"}</DialogTitle>
            <DialogDescription>
              {memberEditing ? "Atualize os dados do membro." : `Novo membro para a bolinha @${memberCotaSlug}.`}
            </DialogDescription>
          </DialogHeader>
          {memberError && <p className="text-sm text-red-600">{memberError}</p>}
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-[#88C9A1] hover:border-[#1F6B3A] transition-colors flex items-center justify-center bg-[#F8F7F4] shrink-0"
              >
                {memberForm.foto_url ? (
                  <img src={memberForm.foto_url} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#88C9A1]" />
                )}
              </button>
              <div className="text-sm text-[#4D4D4D]">
                <p className="font-medium">Foto do membro</p>
                <p className="text-xs text-[#8A8A8A]">Clique para escolher uma imagem</p>
                {memberForm.foto_url && (
                  <button
                    type="button"
                    onClick={() => setMemberForm((f) => ({ ...f, foto_url: "" }))}
                    className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>

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
            <div>
              <Label>Lote</Label>
              <Input
                value={memberForm.lote}
                onChange={(e) => setMemberForm({ ...memberForm, lote: e.target.value })}
                placeholder="A1"
              />
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
