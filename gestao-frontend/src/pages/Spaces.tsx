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
import { Plus, Pencil, Trash2, Home } from "lucide-react";

const tipos = ["casa_coletiva", "casa_apoio", "lazer", "obra"];
const statuses = ["ativo", "manutencao", "inativo"];

const emptyForm = {
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

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setSpaces(await api.get<Space[]>("/api/spaces"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (s: Space) => {
    setForm({
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
    setEditing(s.slug);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        capacidade: form.capacidade ? parseInt(form.capacidade) : null,
        area_m2: form.area_m2 ? parseFloat(form.area_m2) : null,
        tipo: form.tipo || null,
        regras_uso: form.regras_uso || null,
        instrucoes_acesso: form.instrucoes_acesso || null,
        responsavel_slug: form.responsavel_slug || null,
      };
      if (editing) {
        const { slug: _slug, ...update } = payload;
        await api.put(`/api/spaces/${editing}`, update);
      } else {
        await api.post("/api/spaces", payload);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Espaços</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Espaço
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum espaço cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{s.nome}</h3>
                  <p className="text-sm text-gray-500">{s.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
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
                <p className="text-sm text-gray-500 mt-2">Capacidade: {s.capacidade} pessoas</p>
              )}
              {s.area_m2 && (
                <p className="text-sm text-gray-500">Área: {s.area_m2} m²</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Espaço" : "Novo Espaço"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize as informações do espaço." : "Cadastre um novo espaço na comunidade."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="casa.sede" disabled={!!editing} />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
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
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
                <Label>Capacidade</Label>
                <Input type="number" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
              </div>
              <div>
                <Label>Área (m²)</Label>
                <Input type="number" step="0.1" value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Responsável (slug)</Label>
              <Input value={form.responsavel_slug} onChange={(e) => setForm({ ...form, responsavel_slug: e.target.value })} />
            </div>
            <div>
              <Label>Regras de Uso</Label>
              <Textarea value={form.regras_uso} onChange={(e) => setForm({ ...form, regras_uso: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Instruções de Acesso</Label>
              <Textarea value={form.instrucoes_acesso} onChange={(e) => setForm({ ...form, instrucoes_acesso: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
