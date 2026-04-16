import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Booking, Space, Profile } from "@/api/types";
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
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

const tiposUso = ["hospedagem", "evento", "mutirao", "manutencao"];
const statusList = ["pendente", "confirmada", "em_andamento", "concluida", "cancelada"];

const emptyForm = {
  space_slug: "",
  parent_space_slug: "", // apenas para UI, não enviado ao backend
  profile_slug: "",
  data_inicio: "",
  data_fim: "",
  tipo_uso: "",
  finalidade: "",
  numero_pessoas: "",
  status: "pendente",
  observacoes: "",
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/bookings?status=${statusFilter}` : "/api/bookings";
      setBookings(await api.get<Booking[]>(url));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Space[]>("/api/spaces").then(setSpaces).catch(() => {});
    api.get<Profile[]>("/api/profiles").then(setProfiles).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [statusFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (b: Booking) => {
    const bookedSpace = spaces.find((s) => s.slug === b.space_slug);
    const isRoom = !!bookedSpace?.parent_slug;
    setForm({
      space_slug: b.space_slug || "",
      parent_space_slug: isRoom ? bookedSpace!.parent_slug! : "",
      profile_slug: b.profile_slug,
      data_inicio: b.data_inicio ? b.data_inicio.slice(0, 16) : "",
      data_fim: b.data_fim ? b.data_fim.slice(0, 16) : "",
      tipo_uso: b.tipo_uso || "",
      finalidade: b.finalidade || "",
      numero_pessoas: b.numero_pessoas?.toString() || "",
      status: b.status,
      observacoes: b.observacoes || "",
    });
    setEditing(b.id);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    if (!form.space_slug) {
      setError("Selecione um quarto ou espaço.");
      return;
    }
    if (!form.profile_slug) {
      setError("Responsável é obrigatório.");
      return;
    }
    try {
      const payload = {
        space_slug: form.space_slug,
        profile_slug: form.profile_slug,
        data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : "",
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : "",
        tipo_uso: form.tipo_uso || null,
        finalidade: form.finalidade || null,
        numero_pessoas: form.numero_pessoas ? parseInt(form.numero_pessoas) : null,
        status: form.status,
        observacoes: form.observacoes || null,
      };
      if (editing) {
        await api.put(`/api/bookings/${editing}`, payload);
      } else {
        await api.post("/api/bookings", payload);
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta reserva?")) return;
    await api.del(`/api/bookings/${id}`);
    load();
  };

  // Verifica se um quarto está ocupado no período selecionado
  const isOcupado = (roomSlug: string): boolean => {
    if (!form.data_inicio || !form.data_fim) return false;
    const inicio = new Date(form.data_inicio);
    const fim = new Date(form.data_fim);
    return bookings.some(
      (bk) =>
        bk.space_slug === roomSlug &&
        bk.id !== editing &&
        ["pendente", "confirmada", "em_andamento"].includes(bk.status) &&
        new Date(bk.data_inicio) < fim &&
        new Date(bk.data_fim) > inicio
    );
  };

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluida: "bg-gray-100 text-gray-800",
    cancelada: "bg-red-100 text-red-800",
  };

  const tipoLabels: Record<string, string> = {
    hospedagem: "Hospedagem",
    evento: "Evento",
    mutirao: "Mutirão",
    manutencao: "Manutenção",
  };

  const selectedRoom = spaces.find((s) => s.slug === form.space_slug && s.parent_slug);
  const roomsForParent = spaces.filter(
    (s) => s.parent_slug === form.parent_space_slug && s.status === "ativo"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Reserva
        </Button>
      </div>

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
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
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
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {(() => {
                      const sp = spaces.find((s) => s.slug === b.space_slug);
                      const parent = sp?.parent_slug ? spaces.find((s) => s.slug === sp.parent_slug) : null;
                      return parent ? `${parent.nome} › ${sp?.nome}` : (sp?.nome || b.space_slug || "-");
                    })()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {profiles.find((p) => p.slug === b.profile_slug)?.nome_curto ||
                      profiles.find((p) => p.slug === b.profile_slug)?.nome_completo ||
                      b.profile_slug}
                  </td>
                  <td className="px-4 py-3">{b.tipo_uso ? tipoLabels[b.tipo_uso] || b.tipo_uso : "-"}</td>
                  <td className="px-4 py-3">{new Date(b.data_inicio).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{new Date(b.data_fim).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{b.numero_pessoas || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="p-1 rounded hover:bg-gray-100">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => remove(b.id)} className="p-1 rounded hover:bg-gray-100">
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
            <DialogTitle>{editing ? "Editar Reserva" : "Nova Reserva"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados da reserva." : "Crie uma nova reserva de espaço ou quarto."}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            {/* Seletor de espaço em dois níveis */}
            <div className="space-y-3">
              <div>
                <Label>Espaço *</Label>
                <Select
                  value={form.parent_space_slug || form.space_slug}
                  onValueChange={(v) => {
                    const rooms = spaces.filter((s) => s.parent_slug === v && s.status === "ativo");
                    setForm({
                      ...form,
                      parent_space_slug: v,
                      space_slug: rooms.length > 0 ? "" : v,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o espaço" /></SelectTrigger>
                  <SelectContent>
                    {spaces.filter((s) => !s.parent_slug && s.status === "ativo").map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown de quartos — só aparece se o espaço pai tem filhos */}
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
                        const ocupado = isOcupado(s.slug);
                        return (
                          <SelectItem key={s.slug} value={s.slug} disabled={ocupado}>
                            <span className={ocupado ? "text-gray-400" : ""}>
                              {s.nome}
                              {s.capacidade ? ` — cap. ${s.capacidade} pessoa${s.capacidade !== 1 ? "s" : ""}` : ""}
                              {ocupado ? " — Ocupado" : ""}
                            </span>
                          </SelectItem>
                        );
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

              {/* Dica de capacidade do quarto selecionado */}
              {selectedRoom?.capacidade && (
                <p className="text-xs text-green-700 bg-green-50 rounded-md px-3 py-1.5">
                  Capacidade do quarto: {selectedRoom.capacidade} pessoa{selectedRoom.capacidade !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="datetime-local"
                  value={form.data_inicio}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="datetime-local"
                  value={form.data_fim}
                  onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                />
              </div>
            </div>

            {/* Responsável — dropdown de perfis */}
            <div>
              <Label>Responsável *</Label>
              <Select
                value={form.profile_slug}
                onValueChange={(v) => setForm({ ...form, profile_slug: v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {profiles.filter((p) => p.ativo).map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.nome_curto || p.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo e pessoas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Uso</Label>
                <Select value={form.tipo_uso} onValueChange={(v) => setForm({ ...form, tipo_uso: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tiposUso.map((t) => (
                      <SelectItem key={t} value={t}>{tipoLabels[t] || t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº Pessoas</Label>
                <Input
                  type="number"
                  value={form.numero_pessoas}
                  onChange={(e) => setForm({ ...form, numero_pessoas: e.target.value })}
                />
              </div>
            </div>

            {/* Status (só em edição) */}
            {editing && (
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusList.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Finalidade</Label>
              <Input value={form.finalidade} onChange={(e) => setForm({ ...form, finalidade: e.target.value })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
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
