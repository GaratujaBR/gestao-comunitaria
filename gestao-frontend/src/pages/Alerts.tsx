import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Alert } from "@/api/types";
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
import { Plus, Bell, Check, Trash2 } from "lucide-react";

const tipos = ["manutencao", "reserva", "sistema"];

const emptyForm = {
  tipo: "",
  profile_slug: "",
  titulo: "",
  mensagem: "",
  data_acao: "",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showRead, setShowRead] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const url = showRead ? "/api/alerts" : "/api/alerts?lido=false";
      setAlerts(await api.get<Alert[]>(url));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [showRead]);

  const openNew = () => {
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        tipo: form.tipo || null,
        profile_slug: form.profile_slug || null,
        mensagem: form.mensagem || null,
        data_acao: form.data_acao ? new Date(form.data_acao).toISOString() : null,
      };
      await api.post("/api/alerts", payload);
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const markRead = async (id: string) => {
    await api.put(`/api/alerts/${id}`, { lido: true });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este alerta?")) return;
    await api.del(`/api/alerts/${id}`);
    load();
  };

  const tipoColors: Record<string, string> = {
    manutencao: "bg-orange-100 text-orange-700",
    reserva: "bg-blue-100 text-blue-700",
    sistema: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alertas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRead(!showRead)}>
            {showRead ? "Apenas Pendentes" : "Mostrar Todos"}
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Novo Alerta
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum alerta encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-xl border p-5 flex items-start gap-4 ${a.lido ? "opacity-60" : ""}`}
            >
              <div className={`p-2 rounded-lg ${a.tipo ? tipoColors[a.tipo] || "bg-gray-100" : "bg-gray-100"}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{a.titulo}</h3>
                  {a.tipo && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoColors[a.tipo] || ""}`}>
                      {a.tipo}
                    </span>
                  )}
                </div>
                {a.mensagem && <p className="text-sm text-gray-600 mt-1">{a.mensagem}</p>}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  {a.profile_slug && <span>Para: @{a.profile_slug}</span>}
                  <span>{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  {a.data_acao && (
                    <span>Ação: {new Date(a.data_acao).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!a.lido && (
                  <button onClick={() => markRead(a.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Marcar como lido">
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Remover">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Alerta</DialogTitle>
            <DialogDescription>Crie uma nova notificação.</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Para (slug)</Label>
                <Input value={form.profile_slug} onChange={(e) => setForm({ ...form, profile_slug: e.target.value })} placeholder="Vazio = todos" />
              </div>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Data de Ação</Label>
              <Input type="datetime-local" value={form.data_acao} onChange={(e) => setForm({ ...form, data_acao: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Criar Alerta</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
