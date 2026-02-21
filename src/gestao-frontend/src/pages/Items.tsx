import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Item } from "@/api/types";
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
  SelectItem as SelectOpt,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const categorias = ["cozinha", "jardim", "construcao", "limpeza", "lazer"];
const estados = ["novo", "bom", "regular", "manutencao", "indisponivel"];

const emptyForm = {
  codigo: "",
  nome: "",
  descricao: "",
  space_slug: "",
  container_especifico: "",
  categoria: "",
  estado: "bom",
  manual_cuidados: "",
  ciclo_manutencao: "",
  tags: "",
};

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/items?categoria=${filter}` : "/api/items";
      setItems(await api.get<Item[]>(url));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (item: Item) => {
    setForm({
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao || "",
      space_slug: item.space_slug || "",
      container_especifico: item.container_especifico || "",
      categoria: item.categoria || "",
      estado: item.estado,
      manual_cuidados: item.manual_cuidados || "",
      ciclo_manutencao: item.ciclo_manutencao || "",
      tags: item.tags?.join(", ") || "",
    });
    setEditing(item.codigo);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        descricao: form.descricao || null,
        space_slug: form.space_slug || null,
        container_especifico: form.container_especifico || null,
        categoria: form.categoria || null,
        manual_cuidados: form.manual_cuidados || null,
        ciclo_manutencao: form.ciclo_manutencao || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      };
      if (editing) {
        const { codigo: _codigo, ...update } = payload;
        await api.put(`/api/items/${editing}`, update);
      } else {
        await api.post("/api/items", payload);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (codigo: string) => {
    if (!confirm("Remover este item?")) return;
    await api.del(`/api/items/${codigo}`);
    load();
  };

  const estadoColors: Record<string, string> = {
    novo: "bg-green-100 text-green-700",
    bom: "bg-blue-100 text-blue-700",
    regular: "bg-yellow-100 text-yellow-700",
    manutencao: "bg-orange-100 text-orange-700",
    indisponivel: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Acervo</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Item
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!filter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === c ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Usos</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.codigo}</td>
                  <td className="px-4 py-3 font-medium">{item.nome}</td>
                  <td className="px-4 py-3">{item.categoria || "-"}</td>
                  <td className="px-4 py-3">{item.space_slug || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColors[item.estado] || ""}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.vezes_usado}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-gray-100">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => remove(item.codigo)} className="p-1 rounded hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize as informações do item." : "Adicione um novo item ao acervo."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="cozinha.panela.ferro_01" disabled={!!editing} />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectOpt key={c} value={c}>{c}</SelectOpt>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estados.map((e) => (
                      <SelectOpt key={e} value={e}>{e}</SelectOpt>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Espaço (slug)</Label>
                <Input value={form.space_slug} onChange={(e) => setForm({ ...form, space_slug: e.target.value })} />
              </div>
              <div>
                <Label>Container</Label>
                <Input value={form.container_especifico} onChange={(e) => setForm({ ...form, container_especifico: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Manual de Cuidados</Label>
              <Textarea value={form.manual_cuidados} onChange={(e) => setForm({ ...form, manual_cuidados: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ferro_fundido, pesado" />
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
