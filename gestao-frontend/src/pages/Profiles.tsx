import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import { supabase } from "@/lib/supabase"
import type { Profile, Cota } from "@/api/types"
import { Button } from "@/components/ui/button"
import Avatar from "@/components/Avatar"
import ProfileForm from "@/components/ProfileForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Mail, ToggleLeft, ToggleRight, ShieldCheck, Phone } from "lucide-react"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuth } from "@/context/AuthContext"

const ALL_ROLES = ["fundador", "construtor", "cotista", "visitante", "parceiro"]

const roleColors: Record<string, string> = {
  fundador:   "bg-[#D5E8D4] text-[#1F6B3A]",
  construtor: "bg-blue-100 text-blue-700",
  cotista:    "bg-[#ECF7EE] text-[#2D5A27]",
  visitante:  "bg-gray-100 text-gray-600",
  parceiro:   "bg-[#FEE9B0] text-[#8A5C00]",
}

export default function Profiles() {
  const isAdmin = useAdmin()
  const { slug: currentSlug } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [cotas, setCotas] = useState<Cota[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [invitingSlugs, setInvitingSlugs] = useState<Set<string>>(new Set())
  const [invitedSlugs, setInvitedSlugs] = useState<Set<string>>(new Set())
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ps, cs] = await Promise.all([
        api.get<Profile[]>("/api/profiles"),
        api.get<Cota[]>("/api/cotas")
      ])
      setProfiles(ps)
      setCotas(cs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setError("")
    setOpen(true)
  }

  const openEdit = (p: Profile) => {
    setEditing(p.slug)
    setError("")
    setOpen(true)
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      if (editing) {
        const { slug: _slug, ...update } = payload
        await api.put(`/api/profiles/${editing}`, update)
      } else {
        await api.post("/api/profiles", payload)
      }
      setOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm("Remover este perfil?")) return
    await api.del(`/api/profiles/${slug}`)
    setOpen(false)
    load()
  }

  const sendInvite = async (p: Profile) => {
    if (!p.email) return
    setInvitingSlugs((s) => new Set(s).add(p.slug))
    try {
      await supabase.auth.resetPasswordForEmail(p.email)
      setInvitedSlugs((s) => new Set(s).add(p.slug))
    } catch {
      /* silencia */
    } finally {
      setInvitingSlugs((s) => {
        const n = new Set(s)
        n.delete(p.slug)
        return n
      })
    }
  }

  const toggleAtivo = async (p: Profile) => {
    await api.put(`/api/profiles/${p.slug}`, { ativo: !p.ativo })
    load()
  }

  const toggleAdmin = async (p: Profile) => {
    await api.put(`/api/profiles/${p.slug}`, { is_admin: !p.is_admin })
    load()
  }

  const handleRoleChange = async (slug: string, role: string) => {
    await api.put(`/api/profiles/${slug}`, { role: role || null })
    load()
  }

  const getInitialData = () => {
    if (!editing) return null
    const p = profiles.find((x) => x.slug === editing)
    return p || null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Perfis</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Perfil
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl text-gray-400">👤</span>
          </div>
          <p>Nenhum perfil cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border border-[#E7E5E4] p-5 hover:shadow-md transition-shadow ${!p.ativo ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    slug={p.slug}
                    nome={p.nome_completo}
                    foto_url={p.foto_url}
                    onClick={() => currentSlug === p.slug ? openEdit(p) : setViewingProfile(p)}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {p.nome_completo}
                    </h3>
                    <p className="text-sm text-gray-500">@{p.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isAdmin && p.email && (
                    <button
                      onClick={() => sendInvite(p)}
                      disabled={invitingSlugs.has(p.slug)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={invitedSlugs.has(p.slug) ? "Convite enviado" : "Enviar convite por email"}
                    >
                      <Mail className={`w-4 h-4 ${invitedSlugs.has(p.slug) ? "text-[#1F6B3A]" : "text-gray-400"}`} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => toggleAdmin(p)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={p.is_admin ? "Remover admin" : "Tornar admin"}
                    >
                      <ShieldCheck className={`w-4 h-4 ${p.is_admin ? "text-purple-500" : "text-gray-300"}`} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => toggleAtivo(p)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={p.ativo ? "Desativar perfil" : "Ativar perfil"}
                    >
                      {p.ativo
                        ? <ToggleRight className="w-4 h-4 text-[#1F6B3A]" />
                        : <ToggleLeft className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                  )}
                  {(isAdmin || currentSlug === p.slug) && (
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(p.slug)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {p.role && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[p.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.role}
                  </span>
                )}
                {p.lote && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    bolinha {p.lote}
                  </span>
                )}
              </div>

              {isAdmin && (
                <select
                  value={p.role || ""}
                  onChange={(e) => handleRoleChange(p.slug, e.target.value)}
                  className="mt-3 w-full text-xs px-2 py-1.5 border border-[#E7E5E4] rounded-lg text-gray-600 bg-[#F8F7F4] focus:outline-none focus:border-[#88C9A1]"
                >
                  <option value="">Sem role</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}

              {(p.email || p.telefone) && (
                <div className="mt-2 text-sm text-gray-500 space-y-0.5">
                  {p.email && <p>{p.email}</p>}
                  {p.telefone && <p>{p.telefone}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProfileForm
        open={open}
        onOpenChange={(o) => {
          if (!o) setError("")
          setOpen(o)
        }}
        editing={editing}
        initialData={getInitialData()}
        cotas={cotas}
        onSave={handleSave}
        onDelete={editing ? () => handleDelete(editing) : undefined}
        error={error}
      />

      <Dialog open={!!viewingProfile} onOpenChange={(o) => { if (!o) setViewingProfile(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Perfil</DialogTitle>
          </DialogHeader>
          {viewingProfile && (
            <div className="flex flex-col items-center gap-4 pt-2">
              <Avatar slug={viewingProfile.slug} nome={viewingProfile.nome_completo} foto_url={viewingProfile.foto_url} size="lg" />
              <div className="text-center">
                <p className="text-lg font-bold text-[#1A1A1A]">{viewingProfile.nome_completo}</p>
                {viewingProfile.nome_curto && <p className="text-sm text-[#8A8A8A]">{viewingProfile.nome_curto}</p>}
                <p className="text-xs text-[#8A8A8A] mt-0.5">@{viewingProfile.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {viewingProfile.role && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[viewingProfile.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {viewingProfile.role}
                  </span>
                )}
                {viewingProfile.lote && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    bolinha {viewingProfile.lote}
                  </span>
                )}
              </div>
              {(viewingProfile.email || viewingProfile.telefone) && (
                <div className="w-full border-t border-[#F5F5F4] pt-3 space-y-1.5">
                  {viewingProfile.email && (
                    <a href={`mailto:${viewingProfile.email}`} className="flex items-center gap-2 text-sm text-[#4D4D4D] hover:text-[#1F6B3A]">
                      <Mail className="w-4 h-4 shrink-0" />{viewingProfile.email}
                    </a>
                  )}
                  {viewingProfile.telefone && (
                    <a href={`tel:${viewingProfile.telefone}`} className="flex items-center gap-2 text-sm text-[#4D4D4D] hover:text-[#1F6B3A]">
                      <Phone className="w-4 h-4 shrink-0" />{viewingProfile.telefone}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
