import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Log } from "@/api/types";
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
import { Plus, ClipboardList } from "lucide-react";

const acoes = ["retirou", "devolveu", "danificou", "manutencao_realizada", "perda"];
const climas = ["ensolarado", "chuvoso", "nublado"];
const estacoes = ["verao", "outono", "inverno", "primavera"];

const emptyForm = {
  item_codigo: "",
  acao: "",
  profile_slug: "",
  local_uso: "",
  condicao_saida: "",
  condicao_retorno: "",
  descricao_incidente: "",
  clima: "",
  sazonalidade: "",
};

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [acaoFilter, setAcaoFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const url = acaoFilter ? `/api/logs?acao=${acaoFilter}` : "/api/logs";
      setLogs(await api.get<Log[]>(url));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [acaoFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        item_codigo: form.item_codigo || null,
        profile_slug: form.profile_slug || null,
        local_uso: form.local_uso || null,
        condicao_saida: form.condicao_saida || null,
        condicao_retorno: form.condicao_retorno || null,
        descricao_incidente: form.descricao_incidente || null,
        clima: form.clima || null,
        sazonalidade: form.sazonalidade || null,
      };
      await api.post("/api/logs", payload);
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const acaoColors: Record<string, string> = {
    retirou: "bg-secondary text-secondary-foreground",
    devolveu: "bg-primary/15 text-primary",
    danificou: "bg-destructive/15 text-destructive",
    manutencao_realizada: "bg-accent/15 text-accent",
    perda: "bg-destructive/20 text-destructive",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-foreground">Logs de Uso</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Log
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setAcaoFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!acaoFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
        >
          Todos
        </button>
        {acoes.map((a) => (
          <button
            key={a}
            onClick={() => setAcaoFilter(a)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${acaoFilter === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
          >
            {a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Pessoa</th>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3 font-medium">Clima</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs">
                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acaoColors[log.acao] || ""}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.item_codigo || "-"}</td>
                  <td className="px-4 py-3">{log.profile_slug || "-"}</td>
                  <td className="px-4 py-3">{log.local_uso || "-"}</td>
                  <td className="px-4 py-3">{log.clima || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Log de Uso</DialogTitle>
            <DialogDescription>Registre uma ação de uso de item.</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Ação *</Label>
              <Select value={form.acao} onValueChange={(v) => setForm({ ...form, acao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {acoes.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item (código)</Label>
                <Input value={form.item_codigo} onChange={(e) => setForm({ ...form, item_codigo: e.target.value })} />
              </div>
              <div>
                <Label>Pessoa (slug)</Label>
                <Input value={form.profile_slug} onChange={(e) => setForm({ ...form, profile_slug: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Local de Uso</Label>
              <Input value={form.local_uso} onChange={(e) => setForm({ ...form, local_uso: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Condição Saída</Label>
                <Input value={form.condicao_saida} onChange={(e) => setForm({ ...form, condicao_saida: e.target.value })} />
              </div>
              <div>
                <Label>Condição Retorno</Label>
                <Input value={form.condicao_retorno} onChange={(e) => setForm({ ...form, condicao_retorno: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição do Incidente</Label>
              <Textarea value={form.descricao_incidente} onChange={(e) => setForm({ ...form, descricao_incidente: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Clima</Label>
                <Select value={form.clima} onValueChange={(v) => setForm({ ...form, clima: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {climas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estação</Label>
                <Select value={form.sazonalidade} onValueChange={(v) => setForm({ ...form, sazonalidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {estacoes.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
