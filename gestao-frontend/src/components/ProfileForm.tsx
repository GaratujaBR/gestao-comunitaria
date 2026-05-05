import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Camera, Trash2 } from "lucide-react"
import type { Profile, Cota } from "@/api/types"

const roles = ["fundador", "construtor", "cotista", "visitante", "parceiro"]

const emptyForm = {
  slug: "",
  nome_completo: "",
  nome_curto: "",
  email: "",
  telefone: "",
  role: "",
  lote: "",
  cota_slug: "",
  foto_url: ""
}

function resizeToBase64(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

interface ProfileFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: string | null
  initialData: Partial<Profile> | null
  cotas: Cota[]
  onSave: (payload: Record<string, unknown>) => void
  onDelete?: () => void
  error: string
}

export default function ProfileForm({
  open,
  onOpenChange,
  editing,
  initialData,
  cotas,
  onSave,
  onDelete,
  error
}: ProfileFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [localError, setLocalError] = useState("")

  useEffect(() => {
    if (initialData) {
      setForm({
        slug: initialData.slug || "",
        nome_completo: initialData.nome_completo || "",
        nome_curto: initialData.nome_curto || "",
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        role: initialData.role || "",
        lote: initialData.lote || "",
        cota_slug: initialData.cota_slug || "",
        foto_url: initialData.foto_url || ""
      })
    } else {
      setForm(emptyForm)
    }
    setLocalError("")
  }, [initialData, open])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const base64 = await resizeToBase64(file)
      setForm((f) => ({ ...f, foto_url: base64 }))
      e.target.value = ""
    },
    []
  )

  const generateSlug = (nome: string) =>
    nome
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

  const handleSubmit = () => {
    if (!form.nome_completo) {
      setLocalError("Nome completo é obrigatório.")
      return
    }
    const slug =
      form.slug || generateSlug(form.nome_completo) || generateSlug("")
    const payload: Record<string, unknown> = {
      nome_completo: form.nome_completo,
      nome_curto: form.nome_curto || null,
      email: form.email || null,
      telefone: form.telefone || null,
      role: form.role || null,
      lote: form.lote || null,
      cota_slug: form.cota_slug || null,
      foto_url: form.foto_url || null
    }
    if (!editing) {
      payload.slug = slug
    }
    onSave(payload)
  }

  const displaySlug =
    form.slug || (form.nome_completo ? generateSlug(form.nome_completo) : "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize as informações do perfil."
              : "Adicione um novo perfil à comunidade."}
          </DialogDescription>
        </DialogHeader>

        {(error || localError) && (
          <p className="text-sm text-red-600">{error || localError}</p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-[#88C9A1] hover:border-[#1F6B3A] transition-colors flex items-center justify-center bg-[#F8F7F4] shrink-0"
            >
              {form.foto_url ? (
                <img
                  src={form.foto_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-[#88C9A1]" />
              )}
            </button>
            <div className="text-sm text-[#4D4D4D]">
              <p className="font-medium">Foto</p>
              <p className="text-xs text-[#8A8A8A]">
                Clique para escolher uma imagem
              </p>
              {form.foto_url && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, foto_url: "" }))}
                  className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label>Nome Completo *</Label>
            <Input
              value={form.nome_completo}
              onChange={(e) => {
                const v = e.target.value
                setForm((f) => ({
                  ...f,
                  nome_completo: v,
                  slug: f.slug || generateSlug(v)
                }))
              }}
              placeholder="Maria da Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome Curto</Label>
              <Input
                value={form.nome_curto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome_curto: e.target.value }))
                }
                placeholder="Maria"
              />
            </div>
            {!editing && (
              <div>
                <Label>Slug (editável)</Label>
                <Input
                  value={displaySlug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="maria-silva"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefone: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Papel</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.role === "cotista" && (
            <>
              <div>
                <Label>Nº da Bolinha</Label>
                <Input
                  value={form.lote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lote: e.target.value }))
                  }
                  placeholder="ex: 7"
                />
              </div>

              <div>
                <Label>Bolinha</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {cotas.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, cota_slug: c.slug }))}
                      className={`w-8 h-8 rounded-full border text-xs font-semibold transition-colors flex items-center justify-center shrink-0 ${
                        form.cota_slug === c.slug
                          ? "bg-[#1F6B3A] text-white border-[#1F6B3A]"
                          : "border-[#E7E5E4] text-[#4D4D4D] hover:border-[#88C9A1] hover:text-[#1F6B3A]"
                      }`}
                    >
                      {c.numero}
                    </button>
                  ))}
                </div>
                {form.cota_slug && (
                  <p className="text-xs text-[#1F6B3A] mt-1 font-medium">
                    {cotas.find((c) => c.slug === form.cota_slug)?.nome}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            {editing && onDelete && (
              <Button
                variant="outline"
                onClick={onDelete}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Salvar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
