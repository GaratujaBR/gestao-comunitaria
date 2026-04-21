import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { Evento } from "@/api/types";
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
import { Trash2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";

const tipos = ["assembleia", "mutirao", "evento", "manutencao", "celebracao"];

const tipoCores: Record<string, string> = {
  assembleia: "#1F6B3A",
  mutirao: "#D97706",
  evento: "#2563EB",
  manutencao: "#7C3AED",
  celebracao: "#DB2777",
};

const emptyForm = {
  titulo: "",
  descricao: "",
  tipo: "",
  local_slug: "",
  criador_slug: "",
  data_inicio: "",
  data_fim: "",
};

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const calendarRef = useRef<FullCalendar>(null);

  const load = async () => {
    try {
      setEventos(await api.get<Evento[]>("/api/eventos"));
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const calendarEvents = eventos.map((e) => ({
    id: e.id,
    title: e.titulo,
    start: e.data_inicio,
    end: e.data_fim,
    backgroundColor: e.cor || tipoCores[e.tipo || ""] || "#88C9A1",
    borderColor: "transparent",
    extendedProps: { evento: e },
  }));

  const handleDateSelect = (arg: DateSelectArg) => {
    setForm({
      ...emptyForm,
      data_inicio: arg.startStr.slice(0, 16),
      data_fim: arg.endStr.slice(0, 16),
    });
    setEditing(null);
    setError("");
    setOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const e: Evento = arg.event.extendedProps.evento;
    setForm({
      titulo: e.titulo,
      descricao: e.descricao || "",
      tipo: e.tipo || "",
      local_slug: e.local_slug || "",
      criador_slug: e.criador_slug || "",
      data_inicio: e.data_inicio.slice(0, 16),
      data_fim: e.data_fim.slice(0, 16),
    });
    setEditing(e.id);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    if (!form.titulo || !form.data_inicio || !form.data_fim) {
      setError("Título e datas são obrigatórios.");
      return;
    }
    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        tipo: form.tipo || null,
        local_slug: form.local_slug || null,
        criador_slug: form.criador_slug || null,
        data_inicio: new Date(form.data_inicio).toISOString(),
        data_fim: new Date(form.data_fim).toISOString(),
        cor: tipoCores[form.tipo] || null,
      };
      if (editing) {
        await api.put(`/api/eventos/${editing}`, payload);
      } else {
        await api.post("/api/eventos", payload);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Remover este evento?")) return;
    await api.del(`/api/eventos/${editing}`);
    setOpen(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
        <Button onClick={() => { setForm(emptyForm); setEditing(null); setError(""); setOpen(true); }}>
          + Novo Evento
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E7E5E4] p-4 [&_.fc-button]:rounded-full [&_.fc-button]:border-[#E7E5E4] [&_.fc-button-primary]:bg-[#1F6B3A] [&_.fc-button-primary]:border-[#1F6B3A] [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-[#1A1A1A]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          locale="pt-br"
          events={calendarEvents}
          selectable
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          buttonText={{ today: "Hoje", month: "Mês", week: "Semana" }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {tipos.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-[#4D4D4D]">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: tipoCores[t] }} />
            {t}
          </span>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do evento." : "Adicione um evento ao calendário da comunidade."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
              </div>
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
                <Label>Local (slug)</Label>
                <Input value={form.local_slug} onChange={(e) => setForm({ ...form, local_slug: e.target.value })} placeholder="churrasqueira" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Criador (slug)</Label>
              <Input value={form.criador_slug} onChange={(e) => setForm({ ...form, criador_slug: e.target.value })} />
            </div>
            <div className="flex justify-between pt-2">
              {editing && (
                <Button variant="outline" onClick={remove} className="text-red-500 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" /> Remover
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
