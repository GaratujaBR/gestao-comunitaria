import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { WikiArticle } from "@/api/types";
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
import { Plus, Pencil, Trash2, BookOpen, Eye } from "lucide-react";

const categorias = ["bioconstrucao", "regras", "sistemas", "manutencao", "historia"];

const emptyForm = {
  slug: "",
  titulo: "",
  categoria: "",
  conteudo: "",
  resumo_ia: "",
  entidades: "",
  dificuldade: "",
  tempo_execucao_horas: "",
  autor_slug: "",
};

export default function Wiki() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<WikiArticle | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const url = catFilter ? `/api/wiki?categoria=${catFilter}` : "/api/wiki";
      setArticles(await api.get<WikiArticle[]>(url));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [catFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (a: WikiArticle) => {
    setForm({
      slug: a.slug,
      titulo: a.titulo,
      categoria: a.categoria || "",
      conteudo: a.conteudo,
      resumo_ia: a.resumo_ia || "",
      entidades: a.entidades?.join(", ") || "",
      dificuldade: a.dificuldade?.toString() || "",
      tempo_execucao_horas: a.tempo_execucao_horas?.toString() || "",
      autor_slug: a.autor_slug || "",
    });
    setEditing(a.slug);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        categoria: form.categoria || null,
        resumo_ia: form.resumo_ia || null,
        entidades: form.entidades ? form.entidades.split(",").map((e) => e.trim()).filter(Boolean) : null,
        dificuldade: form.dificuldade ? parseInt(form.dificuldade) : null,
        tempo_execucao_horas: form.tempo_execucao_horas ? parseInt(form.tempo_execucao_horas) : null,
        autor_slug: form.autor_slug || null,
      };
      if (editing) {
        const { slug: _slug, ...update } = payload;
        await api.put(`/api/wiki/${editing}`, update);
      } else {
        await api.post("/api/wiki", payload);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("Remover este artigo?")) return;
    await api.del(`/api/wiki/${slug}`);
    load();
  };

  const catColors: Record<string, string> = {
    bioconstrucao: "bg-green-100 text-green-700",
    regras: "bg-blue-100 text-blue-700",
    sistemas: "bg-purple-100 text-purple-700",
    manutencao: "bg-orange-100 text-orange-700",
    historia: "bg-amber-100 text-amber-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Wiki</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Artigo
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setCatFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!catFilter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${catFilter === c ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum artigo encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{a.titulo}</h3>
                  <p className="text-sm text-gray-500 mt-1">{a.conteudo.slice(0, 120)}...</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => setViewing(a)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => remove(a.slug)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {a.categoria && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[a.categoria] || "bg-gray-100"}`}>
                    {a.categoria}
                  </span>
                )}
                {a.dificuldade && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Dificuldade: {a.dificuldade}/5
                  </span>
                )}
                {a.validado && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Validado
                  </span>
                )}
              </div>
              {a.autor_slug && (
                <p className="text-xs text-gray-400 mt-2">Por @{a.autor_slug}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.titulo}</DialogTitle>
            <DialogDescription>
              {viewing?.categoria && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[viewing.categoria] || "bg-gray-100"}`}>
                  {viewing.categoria}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
            {viewing?.conteudo}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize o conteúdo do artigo." : "Crie um novo artigo na base de conhecimento."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="como-fazer-taipa" disabled={!!editing} />
              </div>
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dificuldade (1-5)</Label>
                <Input type="number" min="1" max="5" value={form.dificuldade} onChange={(e) => setForm({ ...form, dificuldade: e.target.value })} />
              </div>
              <div>
                <Label>Tempo (horas)</Label>
                <Input type="number" value={form.tempo_execucao_horas} onChange={(e) => setForm({ ...form, tempo_execucao_horas: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={8} />
            </div>
            <div>
              <Label>Entidades (separadas por vírgula)</Label>
              <Input value={form.entidades} onChange={(e) => setForm({ ...form, entidades: e.target.value })} placeholder="cob, taipa, bananeira" />
            </div>
            <div>
              <Label>Autor (slug)</Label>
              <Input value={form.autor_slug} onChange={(e) => setForm({ ...form, autor_slug: e.target.value })} />
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
