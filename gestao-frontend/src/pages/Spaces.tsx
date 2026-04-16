import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Space } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Home, DoorOpen } from "lucide-react";

const tipos = ["casa_coletiva", "casa_apoio", "lazer", "obra"];
const statuses = ["ativo", "manutencao", "inativo"];

const emptySpaceForm = {
  slug: "",
  nome: "",
  tipo: "",
  capacidade: "",
  area_m2: "",
  regras_uso: "",
  instrucoes_acesso: "",
  responsavel_slug: "",
  status: "ativo",
};

const emptyRoomForm = {
  slug: "",
  nome: "",
  capacidade: "",
  status: "ativo",
  regras_uso: "",
  instrucoes_acesso: "",
};

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog de espaço (nível superior)
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<string | null>(null);
  const [spaceForm, setSpaceForm] = useState(emptySpaceForm);
  const [spaceError, setSpaceError] = useState("");

  // Dialog de quarto (filho de um espaço)
  const [roomOpen, setRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [roomParent, setRoomParent] = useState<Space | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [copyFromParent, setCopyFromParent] = useState(false);
  const [roomError, setRoomError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setSpaces(await api.get<Space[]>("/api/spaces"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // --- Handlers de Espaço ---
  const openNewSpace = () => {
    setSpaceForm(emptySpaceForm);
    setEditingSpace(null);
    setSpaceError("");
    setSpaceOpen(true);
  };

  const openEditSpace = (s: Space) => {
    setSpaceForm({
      slug: s.slug,
      nome: s.nome,
      tipo: s.tipo || "",
      capacidade: s.capacidade?.toString() || "",
      area_m2: s.area_m2?.toString() || "",
      regras_uso: s.regras_uso || "",
      instrucoes_acesso: s.instrucoes_acesso || "",
      responsavel_slug: s.responsavel_slug || "",
      status: s.status,
    });
    setEditingSpace(s.slug);
    setSpaceError("");
    setSpaceOpen(true);
  };

  const saveSpace = async () => {
    try {
      const payload = {
        ...spaceForm,
        capacidade: spaceForm.capacidade ? parseInt(spaceForm.capacidade) : null,
        area_m2: spaceForm.area_m2 ? parseFloat(spaceForm.area_m2) : null,
        tipo: spaceForm.tipo || null,
        regras_uso: spaceForm.regras_uso || null,
        instrucoes_acesso: spaceForm.instrucoes_acesso || null,
        responsavel_slug: spaceForm.responsavel_slug || null,
        parent_slug: null,
      };
      if (editingSpace) {
        const { slug: _s, ...update } = payload; void _s;
        await api.put(`/api/spaces/${editingSpace}`, update);
      } else {
        await api.post("/api/spaces", payload);
      }
      setSpaceOpen(false);
      load();
    } catch (e: unknown) {
      setSpaceError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  // --- Handlers de Quarto ---
  const openNewRoom = (parent: Space) => {
    setRoomForm(emptyRoomForm);
    setRoomParent(parent);
    setCopyFromParent(false);
    setEditingRoom(null);
    setRoomError("");
    setRoomOpen(true);
  };

  const openEditRoom = (room: Space) => {
    const parent = spaces.find((s) => s.slug === room.parent_slug) || null;
    setRoomForm({
      slug: room.slug,
      nome: room.nome,
      capacidade: room.capacidade?.toString() || "",
      status: room.status,
      regras_uso: room.regras_uso || "",
      instrucoes_acesso: room.instrucoes_acesso || "",
    });
    setRoomParent(parent);
    setCopyFromParent(false);
    setEditingRoom(room.slug);
    setRoomError("");
    setRoomOpen(true);
  };

  const handleCopyFromParent = (checked: boolean) => {
    setCopyFromParent(checked);
    if (checked && roomParent) {
      setRoomForm((f) => ({
        ...f,
        regras_uso: roomParent.regras_uso || "",
        instrucoes_acesso: roomParent.instrucoes_acesso || "",
      }));
    }
  };

  const saveRoom = async () => {
    try {
      const payload = {
        slug: roomForm.slug,
        nome: roomForm.nome,
        capacidade: roomForm.capacidade ? parseInt(roomForm.capacidade) : null,
        status: roomForm.status,
        regras_uso: roomForm.regras_uso || null,
        instrucoes_acesso: roomForm.instrucoes_acesso || null,
        parent_slug: roomParent?.slug || null,
        tipo: null,
        area_m2: null,
        responsavel_slug: null,
      };
      if (editingRoom) {
        const { slug: _s, ...update } = payload; void _s;
        await api.put(`/api/spaces/${editingRoom}`, update);
      } else {
        await api.post("/api/spaces", payload);
      }
      setRoomOpen(false);
      load();
    } catch (e: unknown) {
      setRoomError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("Remover este espaço?")) return;
    await api.del(`/api/spaces/${slug}`);
    load();
  };

  const statusColors: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    manutencao: "bg-yellow-100 text-yellow-700",
    inativo: "bg-gray-100 text-gray-700",
  };

  const tipoLabels: Record<string, string> = {
    casa_coletiva: "Casa Coletiva",
    casa_apoio: "Casa de Apoio",
    lazer: "Lazer",
    obra: "Obra",
  };

  const topLevel = spaces.filter((s) => !s.parent_slug);
  const childrenOf = (slug: string) => spaces.filter((s) => s.parent_slug === slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Espaços</h1>
        <Button onClick={openNewSpace}>
          <Plus className="w-4 h-4 mr-2" /> Novo Espaço
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum espaço cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topLevel.map((s) => {
            const rooms = childrenOf(s.slug);
            return (
              <div key={s.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{s.nome}</h3>
                    <p className="text-sm text-gray-500">{s.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditSpace(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => remove(s.slug)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || ""}`}>
                    {s.status}
                  </span>
                  {s.tipo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {tipoLabels[s.tipo] || s.tipo}
                    </span>
                  )}
                </div>
                {s.capacidade && (
                  <p className="text-sm text-gray-500 mt-2">Capacidade total: {s.capacidade} pessoas</p>
                )}
                {s.area_m2 && (
                  <p className="text-sm text-gray-500">Área: {s.area_m2} m²</p>
                )}

                {/* Quartos */}
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Quartos {rooms.length > 0 && `(${rooms.length})`}
                    </span>
                    <button
                      onClick={() => openNewRoom(s)}
                      className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  {rooms.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhum quarto cadastrado.</p>
                  ) : (
                    <ul className="space-y-1">
                      {rooms.map((r) => (
                        <li key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-gray-50">
                          <div className="flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-700">{r.nome}</span>
                            {r.capacidade && (
                              <span className="text-xs text-gray-400">{r.capacidade} p.</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ""}`}>
                              {r.status}
                            </span>
                            <button onClick={() => openEditRoom(r)} className="p-1 rounded hover:bg-gray-200">
                              <Pencil className="w-3 h-3 text-gray-500" />
                            </button>
                            <button onClick={() => remove(r.slug)} className="p-1 rounded hover:bg-gray-200">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Espaço (nível superior) ── */}
      <Dialog open={spaceOpen} onOpenChange={setSpaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSpace ? "Editar Espaço" : "Novo Espaço"}</DialogTitle>
            <DialogDescription>
              {editingSpace ? "Atualize as informações do espaço." : "Cadastre um novo espaço na comunidade."}
            </DialogDescription>
          </DialogHeader>
          {spaceError && <p className="text-sm text-red-600">{spaceError}</p>}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Slug *</Label>
              <Input value={spaceForm.slug} onChange={(e) => setSpaceForm({ ...spaceForm, slug: e.target.value })} placeholder="casa.sede" disabled={!!editingSpace} />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={spaceForm.nome} onChange={(e) => setSpaceForm({ ...spaceForm, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={spaceForm.tipo} onValueChange={(v) => setSpaceForm({ ...spaceForm, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t}>{tipoLabels[t] || t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={spaceForm.status} onValueChange={(v) => setSpaceForm({ ...spaceForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidade total</Label>
                <Input type="number" value={spaceForm.capacidade} onChange={(e) => setSpaceForm({ ...spaceForm, capacidade: e.target.value })} />
              </div>
              <div>
                <Label>Área (m²)</Label>
                <Input type="number" step="0.1" value={spaceForm.area_m2} onChange={(e) => setSpaceForm({ ...spaceForm, area_m2: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Responsável (slug)</Label>
              <Input value={spaceForm.responsavel_slug} onChange={(e) => setSpaceForm({ ...spaceForm, responsavel_slug: e.target.value })} />
            </div>
            <div>
              <Label>Regras de Uso</Label>
              <Textarea value={spaceForm.regras_uso} onChange={(e) => setSpaceForm({ ...spaceForm, regras_uso: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Instruções de Acesso</Label>
              <Textarea value={spaceForm.instrucoes_acesso} onChange={(e) => setSpaceForm({ ...spaceForm, instrucoes_acesso: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSpaceOpen(false)}>Cancelar</Button>
              <Button onClick={saveSpace}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Quarto (filho de um espaço) ── */}
      <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Editar Quarto" : "Novo Quarto"}</DialogTitle>
            {roomParent && (
              <DialogDescription asChild>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">dentro de</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-800">
                    <Home className="w-3 h-3" />
                    {roomParent.nome}
                  </span>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          {roomError && <p className="text-sm text-red-600">{roomError}</p>}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Slug *</Label>
              <Input
                value={roomForm.slug}
                onChange={(e) => setRoomForm({ ...roomForm, slug: e.target.value })}
                placeholder={roomParent ? `${roomParent.slug}.quarto1` : ""}
                disabled={!!editingRoom}
              />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={roomForm.nome} onChange={(e) => setRoomForm({ ...roomForm, nome: e.target.value })} placeholder="Quarto 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidade</Label>
                <Input type="number" value={roomForm.capacidade} onChange={(e) => setRoomForm({ ...roomForm, capacidade: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={roomForm.status} onValueChange={(v) => setRoomForm({ ...roomForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {roomParent && (roomParent.regras_uso || roomParent.instrucoes_acesso) && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={copyFromParent}
                  onChange={(e) => handleCopyFromParent(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-sm text-gray-600">
                  Repetir regras e instruções de <span className="font-medium">{roomParent.nome}</span>
                </span>
              </label>
            )}
            <div>
              <Label>Regras de Uso</Label>
              <Textarea
                value={roomForm.regras_uso}
                onChange={(e) => setRoomForm({ ...roomForm, regras_uso: e.target.value })}
                rows={2}
                disabled={copyFromParent}
                className={copyFromParent ? "opacity-60 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <Label>Instruções de Acesso</Label>
              <Textarea
                value={roomForm.instrucoes_acesso}
                onChange={(e) => setRoomForm({ ...roomForm, instrucoes_acesso: e.target.value })}
                rows={2}
                disabled={copyFromParent}
                className={copyFromParent ? "opacity-60 cursor-not-allowed" : ""}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRoomOpen(false)}>Cancelar</Button>
              <Button onClick={saveRoom}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
