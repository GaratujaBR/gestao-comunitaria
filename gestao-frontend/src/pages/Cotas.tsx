import { useEffect, useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Cota, Profile } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Landmark, ChevronDown, Mail, Phone } from "lucide-react"
import Avatar from "@/components/Avatar"
import ProfileForm from "@/components/ProfileForm"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuth } from "@/context/AuthContext"

export default function Cotas() {
  const isAdmin = useAdmin()
  const { slug: currentSlug } = useAuth()
  const [cotas, setCotas] = useState<Cota[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)

  // Cota dialog
  const [cotaOpen, setCotaOpen] = useState(false)
  const [cotaEditing, setCotaEditing] = useState<string | null>(null)
  const [cotaForm, setCotaForm] = useState({ slug: "", numero: "", nome: "" })
  const [cotaError, setCotaError] = useState("")

  // Profile dialog (shared)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileEditing, setProfileEditing] = useState<string | null>(null)
  const [profileError, setProfileError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cs, ps] = await Promise.all([
        api.get<Cota[]>("/api/cotas"),
        api.get<Profile[]>("/api/profiles")
      ])
      const hasMembers = (cota: Cota) => ps.some((p) => p.cota_slug === cota.slug)
      setCotas(
        [...cs].sort(
          (a, b) =>
            (hasMembers(b) ? 1 : 0) - (hasMembers(a) ? 1 : 0) || a.numero - b.numero
        )
      )
      setProfiles(ps)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ── Cota handlers ──────────────────────────────────────────
  const openEditCota = (c: Cota) => {
    setCotaForm({ slug: c.slug, numero: c.numero.toString(), nome: c.nome })
    setCotaEditing(c.slug)
    setCotaError("")
    setCotaOpen(true)
  }

  const saveCota = async () => {
    if (!cotaForm.nome) {
      setCotaError("Nome é obrigatório.")
      return
    }
    try {
      await api.put(`/api/cotas/${cotaEditing}`, { nome: cotaForm.nome })
      setCotaOpen(false)
      load()
    } catch (e: unknown) {
      setCotaError(e instanceof Error ? e.message : "Erro ao salvar")
    }
  }

  const removeCota = async (slug: string) => {
    if (!confirm("Remover esta bolinha?")) return
    await api.del(`/api/cotas/${slug}`)
    load()
  }

  // ── Profile handlers ───────────────────────────────────────
  const openNewMember = () => {
    setProfileEditing(null)
    setProfileError("")
    setProfileOpen(true)
  }

  const openEditMember = (p: Profile) => {
    setProfileEditing(p.slug)
    setProfileError("")
    setProfileOpen(true)
  }

  const handleProfileSave = async (payload: Record<string, unknown>) => {
    try {
      if (profileEditing) {
        await api.put(`/api/profiles/${profileEditing}`, payload)
      } else {
        await api.post("/api/profiles", payload)
      }
      setProfileOpen(false)
      load()
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : "Erro ao salvar")
    }
  }

  const handleProfileDelete = async (slug: string) => {
    if (!confirm("Remover este membro?")) return
    await api.del(`/api/profiles/${slug}`)
    setProfileOpen(false)
    load()
  }

  const getProfileInitialData = () => {
    if (!profileEditing) return null
    const p = profiles.find((x) => x.slug === profileEditing)
    return p || null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bolinhas</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
        </div>
      ) : cotas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma bolinha cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cotas.map((c) => {
            const membros = profiles.filter((p) => p.cota_slug === c.slug)
            const isExpanded = expandedSlug === c.slug

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border border-[#E7E5E4] flex flex-col ${membros.length === 0 ? "opacity-60" : ""}`}
              >
                <div
                  className="p-4 flex items-start justify-between cursor-pointer select-none lg:cursor-default"
                  onClick={() => setExpandedSlug(isExpanded ? null : c.slug)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1F6B3A] bg-[#D5E8D4] px-2 py-0.5 rounded-full">
                        #{c.numero}
                      </span>
                      {membros.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                      )}
                      {membros.length === 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          sem membros
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mt-1 truncate">
                      {c.nome}
                    </h3>
                    <p className="text-xs text-[#8A8A8A]">@{c.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditCota(c)
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#4D4D4D]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCota(c.slug)
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#F5F5F4]"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8A8A] ml-1 transition-transform duration-200 lg:hidden ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                <div
                  className={`border-t border-[#F5F5F4] px-4 pb-4 pt-3 ${isExpanded ? "block" : "hidden"} lg:block`}
                >
                  {membros.length === 0 ? (
                    <p className="text-xs text-[#8A8A8A] py-1">Sem membros.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {membros.map((p) => (
                        <button
                          key={p.slug}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isAdmin || currentSlug === p.slug) {
                              openEditMember(p)
                            } else {
                              setViewingProfile(p)
                            }
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#ECF7EE] transition-colors"
                        >
                          <Avatar
                            slug={p.slug}
                            nome={p.nome_completo}
                            foto_url={p.foto_url}
                          />
                          <p className="text-[11px] font-medium text-[#1A1A1A] max-w-[56px] truncate text-center leading-tight">
                            {p.nome_curto || p.nome_completo.split(" ")[0]}
                          </p>
                          <div className="flex gap-0.5">
                            {p.role && (
                              <span className="text-[9px] px-1 py-px rounded-full bg-[#D5E8D4] text-[#1F6B3A]">
                                {p.role}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openNewMember()
                      }}
                      className="mt-3 flex items-center gap-1 text-xs text-[#1F6B3A] hover:text-[#2D5A27] font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Membro
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Profile view dialog (read-only) */}
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
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#D5E8D4] text-[#1F6B3A]">
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

      {/* Cota edit dialog */}
      <Dialog open={cotaOpen} onOpenChange={setCotaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Bolinha</DialogTitle>
            <DialogDescription>Atualize o nome da bolinha.</DialogDescription>
          </DialogHeader>
          {cotaError && <p className="text-sm text-red-600">{cotaError}</p>}
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={cotaForm.nome}
                onChange={(e) =>
                  setCotaForm({ ...cotaForm, nome: e.target.value })
                }
                placeholder="Família Silva"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCotaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCota}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile dialog (shared) */}
      <ProfileForm
        open={profileOpen}
        onOpenChange={(o) => {
          if (!o) setProfileError("")
          setProfileOpen(o)
        }}
        editing={profileEditing}
        initialData={getProfileInitialData()}
        cotas={cotas}
        onSave={handleProfileSave}
        onDelete={
          profileEditing ? () => handleProfileDelete(profileEditing) : undefined
        }
        error={profileError}
      />
    </div>
  )
}
