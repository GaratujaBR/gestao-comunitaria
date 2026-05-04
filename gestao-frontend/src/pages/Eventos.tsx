import { useEffect, useRef, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Evento } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Trash2, Plus, MapPin, Clock } from "lucide-react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core"

const tipos = ["assembleia", "mutirao", "evento", "oficina", "manutencao", "celebracao"]

const tipoCores: Record<string, string> = {
  assembleia: "#1F6B3A",
  mutirao: "#D97706",
  evento: "#2563EB",
  oficina: "#0891B2",
  manutencao: "#7C3AED",
  celebracao: "#DB2777"
}

const tipoLabels: Record<string, string> = {
  assembleia: "Assembleia",
  mutirao: "Mutirão",
  evento: "Evento Particular",
  oficina: "Oficina",
  manutencao: "Manutenção",
  celebracao: "Celebração"
}

const ONLINE_SENTINEL = "__online__"

const locais = [
  { value: "churrasqueira-piscina", label: "Churrasqueira + Piscina" },
  { value: "casa-apoio-1", label: "Casa de Apoio 1", disabled: true },
  { value: "casa-apoio-2", label: "Casa de Apoio 2 (Toda a Casa)" },
  { value: "casa-apoio-2-quarto1", label: "Casa de Apoio 2 - Quarto 1" },
  { value: "casa-apoio-2-quarto2", label: "Casa de Apoio 2 - Quarto 2" },
  { value: "casa-apoio-2-casa3", label: "Casa de Apoio 2 - Casa 3" },
  { value: ONLINE_SENTINEL, label: "Evento Online" }
]

const localLabelMap: Record<string, string> = {
  ...Object.fromEntries(locais.map((l) => [l.value, l.label])),
  "": "Evento Online"
}

const emptyForm = {
  titulo: "",
  descricao: "",
  tipo: "",
  local_slug: "",
  criador_slug: "",
  data_inicio: "",
  data_fim: "",
  publico: true
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const calendarRef = useRef<FullCalendar>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    handler()
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  const load = useCallback(async () => {
    try {
      setEventos(await api.get<Evento[]>("/api/eventos"))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const calendarEvents = eventos.map((e) => ({
    id: e.id,
    title: e.titulo,
    start: e.data_inicio,
    end: e.data_fim,
    backgroundColor: e.cor || tipoCores[e.tipo || ""] || "#88C9A1",
    borderColor: "transparent",
    extendedProps: { evento: e }
  }))

  const handleDateSelect = (arg: DateSelectArg) => {
    setForm({
      ...emptyForm,
      data_inicio: arg.startStr.slice(0, 16),
      data_fim: arg.endStr.slice(0, 16),
      publico: true
    })
    setEditing(null)
    setError("")
    setOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
    const e: Evento = arg.event.extendedProps.evento
    setForm({
      titulo: e.titulo,
      descricao: e.descricao || "",
      tipo: e.tipo || "",
      local_slug: e.local_slug || "",
      criador_slug: e.criador_slug || "",
      data_inicio: e.data_inicio.slice(0, 16),
      data_fim: e.data_fim.slice(0, 16),
      publico: e.publico
    })
    setEditing(e.id)
    setError("")
    setOpen(true)
  }

  const save = async () => {
    if (!form.titulo || !form.data_inicio || !form.data_fim) {
      setError("Título e datas são obrigatórios.")
      return
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
        publico: form.publico
      }
      if (editing) {
        await api.put(`/api/eventos/${editing}`, payload)
      } else {
        await api.post("/api/eventos", payload)
      }
      setOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    }
  }

  const remove = async () => {
    if (!editing) return
    if (!confirm("Remover este evento?")) return
    await api.del(`/api/eventos/${editing}`)
    setOpen(false)
    load()
  }

  const proximosEventos = eventos
    .filter((e) => new Date(e.data_inicio) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
    )
    .slice(0, 6)

  const formatarData = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Eventos</h1>
        <Button
          onClick={() => {
            setForm(emptyForm)
            setEditing(null)
            setError("")
            setOpen(true)
          }}
          className="flex items-center gap-2 bg-[#1F6B3A] hover:bg-[#155A2A]"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">
        <div className="overflow-hidden">
          <FullCalendar
            key={isMobile ? "mobile" : "desktop"}
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin
            ]}
            initialView={isMobile ? "listMonth" : "dayGridMonth"}
            headerToolbar={
              isMobile
                ? {
                    left: "prev,next",
                    center: "title",
                    right: "listMonth,dayGridMonth"
                  }
                : {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek"
                  }
            }
            locale="pt-br"
            events={calendarEvents}
            selectable
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            buttonText={
              isMobile
                ? { list: "Lista", month: "Mês" }
                : { today: "Hoje", month: "Mês", week: "Semana" }
            }
          />
        </div>
      </div>

      {/* Upcoming Events */}
      {proximosEventos.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
            Próximos Eventos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proximosEventos.map((e) => (
              <div
                key={e.id}
                onClick={() => {
                  setForm({
                    titulo: e.titulo,
                    descricao: e.descricao || "",
                    tipo: e.tipo || "",
                    local_slug: e.local_slug || "",
                    criador_slug: e.criador_slug || "",
                    data_inicio: e.data_inicio.slice(0, 16),
                    data_fim: e.data_fim.slice(0, 16),
                    publico: e.publico
                  })
                  setEditing(e.id)
                  setError("")
                  setOpen(true)
                }}
                className="bg-white rounded-xl border border-[#E7E5E4] p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1.5"
                    style={{
                      background: e.cor || tipoCores[e.tipo || ""] || "#88C9A1"
                    }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A] truncate">
                      {e.titulo}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-[#4D4D4D]">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {formatarData(e.data_inicio)}
                    </div>
                    {e.local_slug && (
                      <div className="flex items-center gap-1 mt-0.5 text-sm text-[#4D4D4D]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {localLabelMap[e.local_slug] || e.local_slug}
                      </div>
                    )}
                    {e.tipo && (
                      <span
                        className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background:
                            (e.cor || tipoCores[e.tipo] || "#88C9A1") + "20",
                          color: e.cor || tipoCores[e.tipo] || "#2D5A27"
                        }}
                      >
                        {tipoLabels[e.tipo] || e.tipo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {tipos.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F8F7F4] text-[#4D4D4D]"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: tipoCores[t] }}
            />
            {tipoLabels[t]}
          </span>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">
              {editing ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
            <DialogDescription className="text-[#4D4D4D]">
              {editing
                ? "Atualize os dados do evento."
                : "Adicione um evento ao calendário da comunidade."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="rounded-[12px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início *</Label>
                <Input
                  type="datetime-local"
                  value={form.data_inicio}
                  onChange={(e) =>
                    setForm({ ...form, data_inicio: e.target.value })
                  }
                  className="rounded-[12px]"
                />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input
                  type="datetime-local"
                  value={form.data_fim}
                  onChange={(e) =>
                    setForm({ ...form, data_fim: e.target.value })
                  }
                  className="rounded-[12px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger className="border-[#6B8E23] rounded-[12px]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {tipoLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Local</Label>
                <Select
                  value={form.local_slug || ONLINE_SENTINEL}
                  onValueChange={(v) => setForm({ ...form, local_slug: v === ONLINE_SENTINEL ? "" : v })}
                >
                  <SelectTrigger className="border-[#6B8E23] rounded-[12px]">
                    <SelectValue placeholder="Selecione um espaço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {locais.map((l) => (
                      <SelectItem
                        key={l.value}
                        value={l.value}
                        disabled={l.disabled}
                        className={
                          l.disabled ? "text-gray-400 cursor-not-allowed" : ""
                        }
                      >
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publico"
                checked={form.publico}
                onChange={(e) =>
                  setForm({ ...form, publico: e.target.checked })
                }
                className="w-4 h-4 rounded border-[#6B8E23] text-[#1F6B3A] focus:ring-[#1F6B3A]"
              />
              <Label htmlFor="publico" className="text-sm cursor-pointer">
                Evento público (visível no painel)
              </Label>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                rows={2}
                className="rounded-[12px]"
              />
            </div>
            <div>
              <Label>Criador (slug)</Label>
              <Input
                value={form.criador_slug}
                onChange={(e) =>
                  setForm({ ...form, criador_slug: e.target.value })
                }
                className="rounded-[12px]"
              />
            </div>
            <div className="flex justify-between pt-2">
              {editing && (
                <Button
                  variant="outline"
                  onClick={remove}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remover
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={save}
                  className="bg-[#1F6B3A] hover:bg-[#155A2A]"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
