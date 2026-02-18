import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Profile } from "@/api/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react";

const roles = ["fundador", "construtor", "cotista", "visitante"];

const emptyForm = {
  slug: "",
  nome_completo: "",
  nome_curto: "",
  email: "",
  telefone: "",
  role: "",
  lote: "",
};

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setProfiles(await api.get<Profile[]>("/api/profiles"));
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

  const openEdit = (p: Profile) => {
    setForm({
      slug: p.slug,
      nome_completo: p.nome_completo,
      nome_curto: p.nome_curto || "",
      email: p.email || "",
      telefone: p.telefone || "",
      role: p.role || "",
      lote: p.lote || "",
    });
    setEditing(p.slug);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        const { slug: _slug, ...update } = form;
        await api.put(`/api/profiles/${editing}`, update);
      } else {
        await api.post("/api/profiles", form);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("Remover este perfil?")) return;
    await api.del(`/api/profiles/${slug}`);
    load();
  };

  const roleColors: Record<string, string> = {
    fundador: "bg-accent/15 text-accent",
    construtor: "bg-primary/15 text-primary",
    cotista: "bg-secondary text-secondary-foreground",
    visitante: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-foreground">Perfis</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Perfil
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum perfil cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{p.nome_completo}</h3>
                  <p className="text-sm text-muted-foreground">@{p.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => remove(p.slug)} className="p-1.5 rounded-lg hover:bg-secondary">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              {p.role && (
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[p.role] || "bg-muted"}`}>
                  {p.role}
                </span>
              )}
              {p.email && <p className="text-sm text-muted-foreground mt-2">{p.email}</p>}
              {p.telefone && <p className="text-sm text-muted-foreground">{p.telefone}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize as informações do membro." : "Adicione um novo membro à comunidade."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-4">
            <div>
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="joao.silva"
                disabled={!!editing}
              />
            </div>
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={form.nome_completo}
                onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Curto</Label>
                <Input
                  value={form.nome_curto}
                  onChange={(e) => setForm({ ...form, nome_curto: e.target.value })}
                />
              </div>
              <div>
                <Label>Papel</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Lote</Label>
              <Input
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
              />
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
