import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Booking, Space, Profile } from "@/api/types"
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
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Home
} from "lucide-react"
import SpaceMap from "@/components/SpaceMap"
import BookingCalendar from "@/components/BookingCalendar"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuth } from "@/context/AuthContext"

const tiposUso = ["hospedagem", "evento", "mutirao", "manutencao"]
const statusList = [
  "pendente",
  "confirmada",
  "em_andamento",
  "concluida",
  "cancelada"
]

const emptyForm = {
  space_slug: "",
  parent_space_slug: "",
  profile_slug: "",
  cota_slug: "",
  data_inicio: "",
  data_fim: "",
  tipo_uso: "",
  finalidade: "",
  numero_pessoas: "",
  status: "pendente",
  observacoes: ""
}

export default function Bookings() {
  const isAdmin = useAdmin()
  const { slug: currentSlug } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [spacesOpen, setSpacesOpen] = useState(false)
  const [spaceEditOpen, setSpaceEditOpen] = useState(false)
  const [spaceEditTarget, setSpaceEditTarget] = useState<Space | null>(null)
  const [spaceEditForm, setSpaceEditForm] = useState({
    nome: "",
    status: "ativo",
    capacidade: ""
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter
        ? `/api/bookings?status=${statusFilter}`
        : "/api/bookings"
      setBookings(await api.get<Booking[]>(url))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    api
      .get<Space[]>("/api/spaces")
      .then(setSpaces)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar espaços."))
    api
      .get<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar perfis."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = (preSelectSlug?: string) => {
    if (preSelectSlug) {
      const hasRooms = spaces.some(
        (s) => s.parent_slug === preSelectSlug && s.status === "ativo"
      )
      setForm({
        ...emptyForm,
        space_slug: hasRooms ? "" : preSelectSlug,
        parent_space_slug: hasRooms ? preSelectSlug : ""
      })
    } else {
      setForm(emptyForm)
    }
    setEditing(null)
    setError("")
    setOpen(true)
  }

  const openEdit = (b: Booking) => {
    const bookedSpace = spaces.find((s) => s.slug === b.space_slug)
    const isRoom = !!bookedSpace?.parent_slug
    setForm({
      space_slug: b.space_slug || "",
      parent_space_slug: isRoom ? bookedSpace!.parent_slug! : "",
      profile_slug: b.profile_slug,
      cota_slug: b.cota_slug || "",
      data_inicio: b.data_inicio ? b.data_inicio.slice(0, 10) : "",
      data_fim: b.data_fim ? b.data_fim.slice(0, 10) : "",
      tipo_uso: b.tipo_uso || "",
      finalidade: b.finalidade || "",
      numero_pessoas: b.numero_pessoas?.toString() || "",
      status: b.status,
      observacoes: b.observacoes || ""
    })
    setEditing(b.id)
    setError("")
    setOpen(true)
  }

  const save = async () => {
    if (!form.space_slug) {
      setError("Selecione um quarto ou espaço.")
      return
    }
    if (!form.profile_slug) {
      setError("Responsável é obrigatório.")
      return
    }
    try {
      const payload = {
        space_slug: form.space_slug,
        profile_slug: form.profile_slug,
        cota_slug: form.cota_slug || null,
        data_inicio: form.data_inicio
          ? new Date(form.data_inicio).toISOString()
          : "",
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : "",
        tipo_uso: form.tipo_uso || null,
        finalidade: form.finalidade || null,
        numero_pessoas: form.numero_pessoas
          ? parseInt(form.numero_pessoas)
          : null,
        status: form.status,
        observacoes: form.observacoes || null
      }
      if (editing) {
        await api.put(`/api/bookings/${editing}`, payload)
      } else {
        await api.post("/api/bookings", payload)
      }
      setOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Remover esta reserva?")) return
    await api.del(`/api/bookings/${id}`)
    load()
  }

  const isOcupado = (roomSlug: string): boolean => {
    if (!form.data_inicio || !form.data_fim) return false
    const inicio = new Date(form.data_inicio)
    const fim = new Date(form.data_fim)
    return bookings.some(
      (bk) =>
        bk.space_slug === roomSlug &&
        bk.id !== editing &&
        ["pendente", "confirmada", "em_andamento"].includes(bk.status) &&
        new Date(bk.data_inicio) < fim &&
        new Date(bk.data_fim) > inicio
    )
  }

  const openEditSpace = (s: Space) => {
    setSpaceEditTarget(s)
    setSpaceEditForm({
      nome: s.nome,
      status: s.status,
      capacidade: s.capacidade?.toString() || ""
    })
    setSpaceEditOpen(true)
  }

  const saveSpace = async () => {
    if (!spaceEditTarget) return
    await api.put(`/api/spaces/${spaceEditTarget.slug}`, {
      nome: spaceEditForm.nome,
      status: spaceEditForm.status,
      capacidade: spaceEditForm.capacidade
        ? parseInt(spaceEditForm.capacidade)
        : null
    })
    setSpaceEditOpen(false)
    api
      .get<Space[]>("/api/spaces")
      .then(setSpaces)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar espaços."))
  }

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluida: "bg-gray-100 text-gray-800",
    cancelada: "bg-red-100 text-red-800"
  }

  const tipoLabels: Record<string, string> = {
    hospedagem: "Hospedagem",
    evento: "Evento",
    mutirao: "Mutirão",
    manutencao: "Manutenção"
  }

  const selectedRoom = spaces.find(
    (s) => s.slug === form.space_slug && s.parent_slug
  )
  const roomsForParent = spaces.filter(
    (s) => s.parent_slug === form.parent_space_slug && s.status === "ativo"
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
          <p className="text-sm text-gray-500 mt-1">Clique no espaço desejado</p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus className="w-4 h-4 mr-2" /> Nova Reserva
        </Button>
      </div>

      <SpaceMap spaces={spaces} onSelect={(slug) => openNew(slug)} />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!statusFilter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Todas
        </button>
        {statusList.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma reserva encontrada.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {bookings.map((b) => {
              const sp = spaces.find((s) => s.slug === b.space_slug)
              const parent = sp?.parent_slug
                ? spaces.find((s) => s.slug === sp.parent_slug)
                : null
              const spaceName = parent
                ? `${parent.nome} › ${sp?.nome}`
                : sp?.nome || b.space_slug || "-"
              const person =
                profiles.find((p) => p.slug === b.profile_slug)?.nome_curto ||
                profiles.find((p) => p.slug === b.profile_slug)
                  ?.nome_completo ||
                b.profile_slug
              return (
                <div
                  key={b.id}
                  className="bg-white border border-[#E7E5E4] rounded-[16px] px-4 py-3"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[b.status] || ""}`}
                    >
                      {b.status}
                    </span>
                    {(isAdmin || b.profile_slug === currentSlug) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#4D4D4D]" />
                        </button>
                        <button
                          onClick={() => remove(b.id)}
                          className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
                    {spaceName}
                  </p>
                  <p className="text-xs text-[#4D4D4D] mt-0.5">
                    {person}
                    {b.tipo_uso
                      ? ` · ${tipoLabels[b.tipo_uso] || b.tipo_uso}`
                      : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8A8A8A]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(b.data_inicio).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit"
                      })}
                      {" → "}
                      {new Date(b.data_fim).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit"
                      })}
                    </span>
                    {b.numero_pessoas && (
                      <span>
                        {b.numero_pessoas} pessoa
                        {b.numero_pessoas !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden md:block bg-white rounded-xl border border-[#E7E5E4] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#F8F7F4] text-left text-[#4D4D4D]">
                  <th className="px-4 py-3 font-medium">Espaço</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Início</th>
                  <th className="px-4 py-3 font-medium">Fim</th>
                  <th className="px-4 py-3 font-medium">Pessoas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b last:border-0 hover:bg-[#F8F7F4]"
                  >
                    <td className="px-4 py-3">
                      {(() => {
                        const sp = spaces.find((s) => s.slug === b.space_slug)
                        const parent = sp?.parent_slug
                          ? spaces.find((s) => s.slug === sp.parent_slug)
                          : null
                        return parent
                          ? `${parent.nome} › ${sp?.nome}`
                          : sp?.nome || b.space_slug || "-"
                      })()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {profiles.find((p) => p.slug === b.profile_slug)
                        ?.nome_curto ||
                        profiles.find((p) => p.slug === b.profile_slug)
                          ?.nome_completo ||
                        b.profile_slug}
                    </td>
                    <td className="px-4 py-3">
                      {b.tipo_uso ? tipoLabels[b.tipo_uso] || b.tipo_uso : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(b.data_inicio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(b.data_fim).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{b.numero_pessoas || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(isAdmin || b.profile_slug === currentSlug) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(b)}
                            className="p-1 rounded hover:bg-[#F5F5F4]"
                          >
                            <Pencil className="w-4 h-4 text-[#4D4D4D]" />
                          </button>
                          <button
                            onClick={() => remove(b.id)}
                            className="p-1 rounded hover:bg-[#F5F5F4]"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Reserva" : "Nova Reserva"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize os dados da reserva."
                : "Crie uma nova reserva de espaço ou quarto."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-3">
              <div>
                <Label>Espaço *</Label>
                <Select
                  value={form.parent_space_slug || form.space_slug}
                  onValueChange={(v) => {
                    const rooms = spaces.filter(
                      (s) => s.parent_slug === v && s.status === "ativo"
                    )
                    setForm({
                      ...form,
                      parent_space_slug: v,
                      space_slug: rooms.length > 0 ? "" : v
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o espaço" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces
                      .filter((s) => !s.parent_slug && s.status === "ativo")
                      .map((s) => (
                        <SelectItem key={s.slug} value={s.slug}>
                          {s.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {form.parent_space_slug && roomsForParent.length > 0 && (
                <div>
                  <Label>Quarto / Cômodo *</Label>
                  <Select
                    value={form.space_slug}
                    onValueChange={(v) => setForm({ ...form, space_slug: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o quarto" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomsForParent.map((s) => {
                        const ocupado = isOcupado(s.slug)
                        return (
                          <SelectItem
                            key={s.slug}
                            value={s.slug}
                            disabled={ocupado}
                          >
                            <span className={ocupado ? "text-gray-400" : ""}>
                              {s.nome}
                              {s.capacidade
                                ? ` — cap. ${s.capacidade} pessoa${s.capacidade !== 1 ? "s" : ""}`
                                : ""}
                              {ocupado ? " — Ocupado" : ""}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {form.data_inicio && form.data_fim && (
                    <p className="text-xs text-gray-400 mt-1">
                      Disponibilidade calculada para o período selecionado.
                    </p>
                  )}
                </div>
              )}

              {selectedRoom?.capacidade && (
                <p className="text-xs text-green-700 bg-green-50 rounded-md px-3 py-1.5">
                  Capacidade do quarto: {selectedRoom.capacidade} pessoa
                  {selectedRoom.capacidade !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {form.space_slug && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Calendário de Disponibilidade
                </Label>
                <BookingCalendar
                  bookings={bookings}
                  spaceSlug={form.space_slug}
                  selectedDateStart={form.data_inicio}
                  selectedDateEnd={form.data_fim}
                  onDateSelect={(start, end) => {
                    const startStr = start.toISOString().slice(0, 10)
                    const endStr = end.toISOString().slice(0, 10)
                    setForm({
                      ...form,
                      data_inicio: startStr,
                      data_fim: endStr
                    })
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.data_inicio}
                  onChange={(e) =>
                    setForm({ ...form, data_inicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.data_fim}
                  onChange={(e) =>
                    setForm({ ...form, data_fim: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Responsável *</Label>
              <Select
                value={form.profile_slug}
                onValueChange={(v) => {
                  const p = profiles.find((pr) => pr.slug === v)
                  setForm({
                    ...form,
                    profile_slug: v,
                    cota_slug: p?.cota_slug || ""
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => p.ativo)
                    .map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.nome_curto || p.nome_completo}
                        {p.cota_slug ? ` (${p.cota_slug})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.cota_slug && (
                <p className="text-xs text-[#1F6B3A] mt-1">
                  Cota: {form.cota_slug}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Uso</Label>
                <Select
                  value={form.tipo_uso}
                  onValueChange={(v) => setForm({ ...form, tipo_uso: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposUso.map((t) => (
                      <SelectItem key={t} value={t}>
                        {tipoLabels[t] || t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº Pessoas</Label>
                <Input
                  type="number"
                  value={form.numero_pessoas}
                  onChange={(e) =>
                    setForm({ ...form, numero_pessoas: e.target.value })
                  }
                />
              </div>
            </div>

            {editing && (
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusList.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Finalidade</Label>
              <Input
                value={form.finalidade}
                onChange={(e) =>
                  setForm({ ...form, finalidade: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isAdmin && (<div className="mt-8 border border-[#E7E5E4] rounded-xl overflow-hidden">
        <button
          onClick={() => setSpacesOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#F8F7F4] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
            <Home className="w-4 h-4 text-[#1F6B3A]" />
            Gerenciar Espaços
          </div>
          {spacesOpen ? (
            <ChevronUp className="w-4 h-4 text-[#8A8A8A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />
          )}
        </button>

        {spacesOpen && (
          <div className="border-t border-[#E7E5E4] bg-white divide-y divide-[#F5F5F4]">
            {spaces.filter((s) => !s.parent_slug).length === 0 ? (
              <p className="px-5 py-4 text-sm text-[#8A8A8A]">
                Nenhum espaço cadastrado.
              </p>
            ) : (
              spaces
                .filter((s) => !s.parent_slug)
                .map((s) => {
                  const rooms = spaces.filter((r) => r.parent_slug === s.slug)
                  return (
                    <div key={s.slug} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {s.nome}
                          </p>
                          <p className="text-xs text-[#8A8A8A]">
                            @{s.slug}
                            {s.capacidade ? ` · cap. ${s.capacidade}` : ""}
                            {rooms.length > 0
                              ? ` · ${rooms.length} cômodo${rooms.length !== 1 ? "s" : ""}`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => openEditSpace(s)}
                          className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                        >
                          <Pencil className="w-4 h-4 text-[#4D4D4D]" />
                        </button>
                      </div>
                      {rooms.length > 0 && (
                        <div className="mt-2 ml-4 space-y-1">
                          {rooms.map((r) => (
                            <div
                              key={r.slug}
                              className="flex items-center justify-between"
                            >
                              <p className="text-xs text-[#4D4D4D]">
                                {r.nome}
                                {r.capacidade ? ` · cap. ${r.capacidade}` : ""}
                              </p>
                              <button
                                onClick={() => openEditSpace(r)}
                                className="p-1 rounded hover:bg-[#F5F5F4]"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#8A8A8A]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>)}

      <Dialog open={spaceEditOpen} onOpenChange={setSpaceEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Espaço</DialogTitle>
            <DialogDescription>@{spaceEditTarget?.slug}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={spaceEditForm.nome}
                onChange={(e) =>
                  setSpaceEditForm({ ...spaceEditForm, nome: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={spaceEditForm.status}
                  onValueChange={(v) =>
                    setSpaceEditForm({ ...spaceEditForm, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  value={spaceEditForm.capacidade}
                  onChange={(e) =>
                    setSpaceEditForm({
                      ...spaceEditForm,
                      capacidade: e.target.value
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSpaceEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveSpace}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
