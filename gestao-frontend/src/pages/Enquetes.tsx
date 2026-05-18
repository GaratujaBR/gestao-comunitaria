import { useEffect, useState } from "react"
import { api } from "@/api/client"
import type {
  Enquete,
  EnqueteComentario,
  EnqueteStatus,
  EnqueteTipo,
  Profile
} from "@/api/types"
import {
  Plus,
  X,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import PollBadge from "@/components/PollBadge"
import LegitimacyMeter from "@/components/LegitimacyMeter"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuth } from "@/context/AuthContext"
import Avatar from "@/components/Avatar"
// ── constants ────────────────────────────────────────────────────────────────

const categoriaColors: Record<string, string> = {
  decisao: "bg-blue-50 text-blue-700",
  feedback: "bg-purple-50 text-purple-700",
  preferencia: "bg-amber-50 text-amber-700",
  aprovacao: "bg-[#D5E8D4] text-[#1F6B3A]"
}

const categoriaLabels: Record<string, string> = {
  decisao: "Decisão",
  feedback: "Feedback",
  preferencia: "Preferência",
  aprovacao: "Aprovação"
}

const tipoLabels: Record<EnqueteTipo, string> = {
  binaria: "Binária (Sim/Não)",
  multipla: "Múltipla escolha",
  escala: "Avaliação (1–5)",
  texto: "Resposta Aberta"
}

const statusLabels: Record<EnqueteStatus, string> = {
  rascunho: "Rascunho",
  aberta: "Discussão",
  votacao: "Votação",
  encerrada: "Encerrada",
  implementada: "Implementada",
  arquivada: "Arquivada"
}

const statusColors: Record<EnqueteStatus, string> = {
  rascunho: "bg-[#F8F7F4] text-[#8A8A8A]",
  aberta: "bg-blue-50 text-blue-700",
  votacao: "bg-[#D5E8D4] text-[#1F6B3A]",
  encerrada: "bg-[#F8F7F4] text-[#4D4D4D]",
  implementada: "bg-[#D5E8D4] text-[#1F6B3A]",
  arquivada: "bg-red-50 text-red-700"
}

// ── helpers ───────────────────────────────────────────────────────────────────

function canVote(status: EnqueteStatus): boolean {
  return status === "votacao" || status === "aberta" // "aberta" = legacy
}

function canRespond(enquete: Pick<Enquete, "tipo" | "status">): boolean {
  return (
    enquete.tipo === "texto" &&
    (enquete.status === "votacao" || enquete.status === "aberta")
  )
}

function nextTransitions(
  status: EnqueteStatus
): { label: string; next: EnqueteStatus }[] {
  switch (status) {
    case "rascunho":
      return [{ label: "Publicar para Discussão", next: "aberta" }]
    case "aberta":
      return [{ label: "Iniciar Votação", next: "votacao" }]
    case "votacao":
      return [{ label: "Encerrar Votação", next: "encerrada" }]
    case "encerrada":
      return [
        { label: "Marcar Implementada", next: "implementada" },
        { label: "Arquivar", next: "arquivada" }
      ]
    default:
      return []
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function ResultBadge({
  approved,
  approvalPercent,
  threshold
}: {
  approved: boolean | null
  approvalPercent: number | null
  threshold: number
}) {
  if (approved === null) return null
  if (approved)
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D5E8D4] text-[#1F6B3A] text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Aprovada{" "}
        {approvalPercent != null ? `(${approvalPercent}% ≥ ${threshold}%)` : ""}
      </div>
    )
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      Rejeitada{" "}
      {approvalPercent != null
        ? `(${approvalPercent}% &lt; ${threshold}%)`
        : ""}
    </div>
  )
}

// ── escala voting panel ───────────────────────────────────────────────────────

function VotarEscalaPanel({
  enquete,
  currentCotaSlug,
  onVotar,
  votoError
}: {
  enquete: Enquete
  currentCotaSlug: string | null
  onVotar: (enqueteId: string, opcaoIndex: number, melhoria?: string) => void
  votoError: string
}) {
  const [melhoria, setMelhoria] = useState("")
  const jaVotou = currentCotaSlug
    ? Object.keys(enquete.votantes ?? {}).includes(currentCotaSlug)
    : false

  // compute avg
  const total = enquete.total_votos
  const avg =
    total > 0
      ? (
          Object.entries(enquete.votos).reduce(
            (sum, [idx, count]) => sum + (Number(idx) + 1) * Number(count),
            0
          ) / total
        ).toFixed(1)
      : null

  const melhorias = Object.entries(enquete.respostas ?? {})

  return (
    <div className="space-y-4">
      {/* rating buttons */}
      {!jaVotou && (
        <div className="space-y-3">
          {votoError && <p className="text-xs text-red-500">{votoError}</p>}
          <div>
            <p className="text-xs text-[#8A8A8A] mb-2">Sua nota:</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  disabled={!currentCotaSlug}
                  onClick={() =>
                    onVotar(enquete.id, n - 1, melhoria || undefined)
                  }
                  className="w-10 h-10 rounded-xl border-2 border-[#E7E5E4] text-sm font-bold text-[#4D4D4D] hover:border-[#1F6B3A] hover:text-[#1F6B3A] hover:bg-[#D5E8D4] disabled:opacity-40 transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-[#8A8A8A] mb-1">
              O que pode melhorar? (opcional)
            </p>
            <Textarea
              placeholder="Sugestão de melhoria..."
              value={melhoria}
              onChange={(e) => setMelhoria(e.target.value.slice(0, 300))}
              rows={2}
            />
            <p className="text-xs text-[#8A8A8A] text-right mt-0.5">
              {melhoria.length}/300
            </p>
          </div>
        </div>
      )}
      {jaVotou && (
        <p className="text-xs text-[#1F6B3A] font-medium">
          ✓ Sua bolinha já votou.
        </p>
      )}

      {/* distribution */}
      <div className="space-y-1.5">
        {avg !== null && (
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Média: {avg} / 5
          </p>
        )}
        {[1, 2, 3, 4, 5].map((n) => {
          const count = Number(enquete.votos[String(n - 1)] ?? 0)
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={n} className="flex items-center gap-2">
              <span className="w-4 text-xs text-[#4D4D4D] text-right">{n}</span>
              <div className="flex-1 bg-[#F8F7F4] rounded-full h-2">
                <div
                  className="bg-[#1F6B3A] h-2 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#8A8A8A] w-8">{count}</span>
            </div>
          )
        })}
      </div>

      {/* melhorias */}
      {melhorias.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#4D4D4D]">
            Sugestões de melhoria:
          </p>
          {melhorias.map(([cota, texto]) => (
            <div key={cota} className="bg-[#F8F7F4] rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-[#1A1A1A]">
                {cota}
              </span>
              <p className="text-sm text-[#4D4D4D] mt-0.5">{texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── discussion section ────────────────────────────────────────────────────────

function DiscussaoSection({
  enqueteId,
  profiles
}: {
  enqueteId: string
  profiles: Profile[]
}) {
  const [comentarios, setComentarios] = useState<EnqueteComentario[]>([])
  const [autor, setAutor] = useState("")
  const [texto, setTexto] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    api
      .get<EnqueteComentario[]>(`/api/enquetes/${enqueteId}/comentarios`, {
        signal: ctrl.signal
      })
      .then(setComentarios)
      .catch((e) => {
        if (e.name === "AbortError") return
      })
    return () => ctrl.abort()
  }, [enqueteId])

  const submit = async () => {
    if (!autor.trim() || !texto.trim()) return
    setSaving(true)
    try {
      const novo = await api.post<EnqueteComentario>(
        `/api/enquetes/${enqueteId}/comentarios`,
        {
          autor: autor.trim(),
          conteudo: texto.trim()
        }
      )
      setComentarios((prev) => [...prev, novo])
      setTexto("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comentarios.length === 0 ? (
          <p className="text-xs text-[#8A8A8A] italic">
            Sem comentários ainda.
          </p>
        ) : (
          comentarios.map((c) => (
            <div key={c.id} className="bg-[#F8F7F4] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  {c.autor}
                </span>
                <span className="text-xs text-[#8A8A8A]">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="text-sm text-[#4D4D4D]">{c.conteudo}</p>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2 pt-2 border-t border-[#F5F5F4]">
        <select
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          className="w-full px-3 py-1.5 border border-[#E7E5E4] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6B3A]/20 focus:border-[#1F6B3A]"
        >
          <option value="">Quem está comentando?</option>
          {profiles
            .filter((p) => p.ativo)
            .map((p) => (
              <option key={p.slug} value={p.nome_curto || p.nome_completo}>
                {p.nome_curto || p.nome_completo}
              </option>
            ))}
        </select>
        <Textarea
          placeholder="Seu comentário..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={!autor || !texto.trim() || saving}
          className="bg-[#1F6B3A] hover:bg-[#155A2A] w-full"
        >
          Comentar
        </Button>
      </div>
    </div>
  )
}

// ── resposta aberta panel ─────────────────────────────────────────────────────

function RespostaAbertaPanel({
  enquete,
  currentCotaSlug,
  onResponder,
  votoError
}: {
  enquete: Enquete
  currentCotaSlug: string | null
  onResponder: (enqueteId: string, texto: string) => void
  votoError: string
}) {
  const [texto, setTexto] = useState("")
  const [saving, setSaving] = useState(false)
  const jaRespondeu = currentCotaSlug ? currentCotaSlug in (enquete.respostas ?? {}) : false
  const respostas = Object.entries(enquete.respostas ?? {})

  const handleSubmit = async () => {
    if (!texto.trim()) return
    setSaving(true)
    try {
      await onResponder(enquete.id, texto)
      setTexto("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* existing responses */}
      {respostas.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {respostas.map(([cota, resp]) => (
            <div key={cota} className="bg-[#F8F7F4] rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-[#1A1A1A]">
                {cota}
              </span>
              <p className="text-sm text-[#4D4D4D] mt-0.5">{resp}</p>
            </div>
          ))}
        </div>
      )}
      {respostas.length === 0 && (
        <p className="text-xs text-[#8A8A8A] italic">Nenhuma resposta ainda.</p>
      )}
      {/* input */}
      {!jaRespondeu && (
        <div className="space-y-2 pt-2 border-t border-[#F5F5F4]">
          {votoError && <p className="text-xs text-red-500">{votoError}</p>}
          {!currentCotaSlug && (
            <p className="text-xs text-amber-600">
              Você não pertence a uma bolinha e não pode responder.
            </p>
          )}
          <Textarea
            placeholder="Sua resposta (máx. 300 caracteres)"
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 300))}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8A8A]">{texto.length}/300</span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!currentCotaSlug || !texto.trim() || saving}
              className="bg-[#1F6B3A] hover:bg-[#155A2A]"
            >
              {saving ? "Enviando..." : "Enviar resposta"}
            </Button>
          </div>
        </div>
      )}
      {jaRespondeu && (
        <p className="text-xs text-[#1F6B3A] font-medium">
          ✓ Sua bolinha já respondeu.
        </p>
      )}
    </div>
  )
}

// ── detail dialog ─────────────────────────────────────────────────────────────

type Tab = "proposta" | "discussao" | "votar" | "resultado"

function DetailDialog({
  enquete,
  profiles,
  currentCotaSlug,
  onVotar,
  onResponder,
  onTransition,
  onClose,
  votoError,
  transitioningId
}: {
  enquete: Enquete
  profiles: Profile[]
  currentCotaSlug: string | null
  onVotar: (enqueteId: string, opcaoIndex: number, melhoria?: string) => void
  onResponder: (enqueteId: string, texto: string) => void
  onTransition: (enqueteId: string, status: EnqueteStatus) => void
  onClose: () => void
  votoError: string
  transitioningId: string | null
}) {
  const showResult = ["encerrada", "implementada", "arquivada"].includes(
    enquete.status
  )
  const isTexto = enquete.tipo === "texto"
  const defaultTab: Tab = showResult
    ? "resultado"
    : canVote(enquete.status) || canRespond(enquete)
      ? "votar"
      : "proposta"
  const [tab, setTab] = useState<Tab>(defaultTab)

  const transitions = nextTransitions(enquete.status as EnqueteStatus)
  const maxVotos = Math.max(...Object.values(enquete.votos).map(Number), 1)
  const votantesCount = Object.keys(enquete.votantes).length

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        tab === t
          ? "border-[#1F6B3A] text-[#1F6B3A]"
          : "border-transparent text-[#8A8A8A] hover:text-[#4D4D4D]"
      }`}
    >
      {label}
    </button>
  )

  const activeMembers = profiles.filter((p) => p.ativo && p.cota_slug).length

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">
            {enquete.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* status + categoria + quadrante badges */}
        <div className="flex flex-wrap gap-2 -mt-1">
          {enquete.quadrante && <PollBadge quadrante={enquete.quadrante} />}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColors[enquete.categoria] || "bg-[#F8F7F4] text-[#4D4D4D]"}`}
          >
            {categoriaLabels[enquete.categoria] || enquete.categoria}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[enquete.status as EnqueteStatus] || "bg-[#F8F7F4] text-[#4D4D4D]"}`}
          >
            {statusLabels[enquete.status as EnqueteStatus] || enquete.status}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F8F7F4] text-[#4D4D4D]">
            {tipoLabels[enquete.tipo] || enquete.tipo}
          </span>
        </div>

        {/* tabs */}
        <div className="flex gap-0 border-b border-[#E7E5E4] -mx-1">
          {tabBtn("proposta", "Proposta")}
          {tabBtn("discussao", "Discussão")}
          {(canVote(enquete.status) || canRespond(enquete)) &&
            tabBtn("votar", isTexto ? "Respostas" : "Votar")}
          {showResult && tabBtn("resultado", "Resultado")}
        </div>

        <div className="max-h-[55vh] overflow-y-auto space-y-4 pt-1">
          {/* ── PROPOSTA ── */}
          {tab === "proposta" && (
            <div className="space-y-3">
              {enquete.descricao && (
                <p className="text-sm text-[#4D4D4D] leading-relaxed">
                  {enquete.descricao}
                </p>
              )}
              {enquete.result_action && (
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">
                    Se aprovada:
                  </p>
                  <p className="text-sm text-blue-700">
                    {enquete.result_action}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#4D4D4D]">
                <div>
                  <span className="font-medium">Threshold:</span>{" "}
                  {enquete.approval_threshold}%
                </div>
                {enquete.closes_at && (
                  <div>
                    <span className="font-medium">Encerra em:</span>{" "}
                    {new Date(enquete.closes_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                {enquete.criador && (
                  <div>
                    <span className="font-medium">Criador:</span>{" "}
                    {enquete.criador}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DISCUSSÃO ── */}
          {tab === "discussao" && (
            <DiscussaoSection enqueteId={enquete.id} profiles={profiles} />
          )}

          {/* ── VOTAR / RESPOSTAS / AVALIAÇÃO ── */}
          {tab === "votar" && (
            <div className="space-y-3">
              {!currentCotaSlug && canVote(enquete.status) && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Você não pertence a uma bolinha e não pode votar.
                </p>
              )}
              {currentCotaSlug && Object.keys(enquete.votantes ?? {}).includes(currentCotaSlug) && canVote(enquete.status) && (
                <p className="text-xs text-[#1F6B3A] bg-[#D5E8D4]/30 rounded-lg px-3 py-2">
                  ✓ Sua bolinha já votou nesta enquete.
                </p>
              )}
              {isTexto ? (
                <RespostaAbertaPanel
                  enquete={enquete}
                  currentCotaSlug={currentCotaSlug}
                  onResponder={onResponder}
                  votoError={votoError}
                />
              ) : enquete.tipo === "escala" ? (
                <VotarEscalaPanel
                  enquete={enquete}
                  currentCotaSlug={currentCotaSlug}
                  onVotar={onVotar}
                  votoError={votoError}
                />
              ) : (
                <div className="space-y-2">
                  {votoError && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                      {votoError}
                    </p>
                  )}
                  <div className="space-y-2">
                    {enquete.opcoes.map((opcao, idx) => {
                      const count = enquete.votos[String(idx)] || 0
                      const pct =
                        enquete.total_votos > 0
                          ? (count / enquete.total_votos) * 100
                          : 0
                      const width = maxVotos > 0 ? (count / maxVotos) * 100 : 0
                      const jaVotou = currentCotaSlug
                        ? Object.keys(enquete.votantes).includes(currentCotaSlug)
                        : false
                      return (
                        <div key={idx}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onVotar(enquete.id, idx)}
                              disabled={!currentCotaSlug || jaVotou}
                              className="px-3 py-1.5 text-xs bg-[#D5E8D4] text-[#1F6B3A] rounded-lg hover:bg-[#88C9A1]/30 disabled:opacity-40 shrink-0 font-medium"
                            >
                              {jaVotou ? "Votado" : "Votar"}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-0.5">
                                <span className="text-[#1A1A1A]">{opcao}</span>
                                <span className="text-[#8A8A8A] text-xs">
                                  {count} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-[#F8F7F4] rounded-full h-2">
                                <div
                                  className="bg-[#1F6B3A] h-2 rounded-full transition-all"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-[#8A8A8A] pt-1">
                    {votantesCount} bolinha{votantesCount !== 1 ? "s" : ""}{" "}
                    votou
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTADO ── */}
          {tab === "resultado" && (
            <div className="space-y-4">
              <ResultBadge
                approved={enquete.approved}
                approvalPercent={enquete.approval_percent}
                threshold={enquete.approval_threshold}
              />
              <LegitimacyMeter enquete={enquete} totalMembers={activeMembers} />
              <div className="space-y-2">
                {enquete.opcoes.map((opcao, idx) => {
                  const count = enquete.votos[String(idx)] || 0
                  const pct =
                    enquete.total_votos > 0
                      ? (count / enquete.total_votos) * 100
                      : 0
                  const width = maxVotos > 0 ? (count / maxVotos) * 100 : 0
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-0.5">
                        <span className="text-[#1A1A1A]">{opcao}</span>
                        <span className="text-[#8A8A8A] text-xs">
                          {count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F8F7F4] rounded-full h-2.5">
                        <div
                          className="bg-[#1F6B3A] h-2.5 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* state machine actions */}
        {transitions.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-[#F5F5F4] flex-wrap">
            {transitions.map((t) => (
              <Button
                key={t.next}
                variant={t.next === "arquivada" ? "outline" : "default"}
                size="sm"
                onClick={() => onTransition(enquete.id, t.next)}
                disabled={transitioningId === enquete.id}
                className={
                  t.next !== "arquivada"
                    ? "bg-[#1F6B3A] hover:bg-[#155A2A]"
                    : ""
                }
              >
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Enquetes() {
  const isAdmin = useAdmin()
  const { slug: currentSlug } = useAuth()
  const [enquetes, setEnquetes] = useState<Enquete[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detailEnquete, setDetailEnquete] = useState<Enquete | null>(null)
  const [categoriaFilter, setCategoriaFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [votoError, setVotoError] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  )
  const [globalError, setGlobalError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transitioningId, setTransitioningId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [form, setForm] = useState({
    titulo: "",
    tipo: "" as "" | EnqueteTipo,
    multipla_escolha: false,
    opcoes: ["", ""] as string[],
    anonima: false,
    prazo_dias: "" as number | ""
  })

  const load = async () => {
    setLoading(true)
    try {
      const [es, ps] = await Promise.all([
        api.get<Enquete[]>("/api/enquetes"),
        api.get<Profile[]>("/api/profiles")
      ])
      setEnquetes(es)
      setProfiles(ps)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar enquetes."
      setGlobalError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // keep detail dialog in sync with fresh data
  useEffect(() => {
    if (detailEnquete) {
      const fresh = enquetes.find((e) => e.id === detailEnquete.id)
      if (fresh) setDetailEnquete(fresh)
    }
  }, [enquetes]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = enquetes.filter((e) => {
    if (categoriaFilter && e.categoria !== categoriaFilter) return false
    if (statusFilter && e.status !== statusFilter) return false
    return true
  })

  const createEnquete = async () => {
    if (!form.titulo.trim() || !form.tipo) return
    const opcoes =
      form.tipo === "binaria"
        ? ["Sim", "Não", "Abstenção"]
        : form.tipo === "escala"
          ? ["1", "2", "3", "4", "5"]
          : form.opcoes.filter((o) => o.trim() !== "")
    if (form.tipo === "multipla" && opcoes.length < 2) return
    const closes_at =
      form.prazo_dias !== "" && Number(form.prazo_dias) > 0
        ? new Date(Date.now() + Number(form.prazo_dias) * 86400000).toISOString()
        : null
    setSaving(true)
    try {
      await api.post("/api/enquetes", {
        titulo: form.titulo,
        categoria: "decisao",
        tipo: form.tipo,
        opcoes,
        multipla_escolha: form.tipo === "multipla" && form.multipla_escolha,
        anonima: form.anonima,
        closes_at
      })
      setShowModal(false)
      setForm({ titulo: "", tipo: "", multipla_escolha: false, opcoes: ["", ""], anonima: false, prazo_dias: "" })
      load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar enquete."
      setGlobalError(msg)
    } finally {
      setSaving(false)
    }
  }

  const currentUserProfile = profiles.find((p) => p.slug === currentSlug)
  const currentCotaSlug = currentUserProfile?.cota_slug ?? null

  const votar = async (
    enqueteId: string,
    opcaoIndex: number,
    melhoria?: string
  ) => {
    if (!currentCotaSlug) {
      setVotoError("Você não pertence a uma bolinha.")
      return
    }
    setVotoError("")
    try {
      await api.post(`/api/enquetes/${enqueteId}/votar`, {
        opcao_index: opcaoIndex,
        ...(melhoria ? { melhoria } : {})
      })
      load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      setVotoError(
        msg.includes("409") || msg.toLowerCase().includes("bolinha")
          ? "Sua bolinha já votou nesta enquete."
          : msg || "Erro ao votar."
      )
    }
  }

  const responder = async (enqueteId: string, texto: string) => {
    if (!currentCotaSlug) {
      setVotoError("Você não pertence a uma bolinha.")
      return
    }
    setVotoError("")
    try {
      await api.post(`/api/enquetes/${enqueteId}/responder`, {
        texto
      })
      load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      setVotoError(
        msg.includes("409")
          ? "Sua bolinha já respondeu esta enquete."
          : msg || "Erro ao responder."
      )
    }
  }

  const transition = async (enqueteId: string, status: EnqueteStatus) => {
    setTransitioningId(enqueteId)
    try {
      await api.put(`/api/enquetes/${enqueteId}`, { status })
      load()
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Erro ao transicionar status."
      setGlobalError(msg)
    } finally {
      setTransitioningId(null)
    }
  }

  const deletar = async (id: string) => {
    setDeletingId(id)
    try {
      await api.del(`/api/enquetes/${id}`)
      load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao excluir enquete."
      setGlobalError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const addOpcao = () => setForm({ ...form, opcoes: [...form.opcoes, ""] })
  const updateOpcao = (index: number, value: string) => {
    const opcoes = [...form.opcoes]
    opcoes[index] = value
    setForm({ ...form, opcoes })
  }
  const removeOpcao = (index: number) => {
    if (form.opcoes.length <= 2) return
    setForm({ ...form, opcoes: form.opcoes.filter((_, i) => i !== index) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F6B3A]" />
      </div>
    )
  }

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#1F6B3A] text-white" : "bg-[#F8F7F4] text-[#4D4D4D] hover:bg-[#E7E5E4]"}`

  const clearGlobalError = () => setGlobalError("")

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Enquetes</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">
            {enquetes.length} enquete{enquetes.length !== 1 ? "s" : ""}{" "}
            registradas
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {votoError && (
            <span className="text-xs text-red-500">{votoError}</span>
          )}
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1F6B3A] hover:bg-[#155A2A]"
          >
            <Plus className="w-4 h-4" />
            Nova Enquete
          </Button>
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{globalError}</span>
          <button
            onClick={clearGlobalError}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      )}

      {/* filters — mobile: collapsed button; desktop: inline */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            categoriaFilter || statusFilter
              ? "bg-[#1F6B3A] text-white"
              : "bg-[#F8F7F4] text-[#4D4D4D] hover:bg-[#E7E5E4]"
          }`}
        >
          <Filter className="w-4 h-4" />
          {categoriaFilter
            ? categoriaLabels[categoriaFilter]
            : statusFilter
              ? statusLabels[statusFilter as EnqueteStatus]
              : "Todos"}
          {showFilters ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        {showFilters && (
          <div className="mt-2 p-3 bg-white rounded-xl border border-[#E7E5E4] space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide mb-2">Categoria</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCategoriaFilter("")} className={filterBtn(!categoriaFilter)}>Todas</button>
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <button key={key} onClick={() => setCategoriaFilter(key)} className={filterBtn(categoriaFilter === key)}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStatusFilter("")} className={filterBtn(!statusFilter)}>Todos</button>
                {(["rascunho","aberta","votacao","encerrada","implementada","arquivada"] as EnqueteStatus[]).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={filterBtn(statusFilter === s)}>{statusLabels[s]}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:flex flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoriaFilter("")} className={filterBtn(!categoriaFilter)}>Todas</button>
          {Object.entries(categoriaLabels).map(([key, label]) => (
            <button key={key} onClick={() => setCategoriaFilter(key)} className={filterBtn(categoriaFilter === key)}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-4 flex-wrap">
          <button onClick={() => setStatusFilter("")} className={filterBtn(!statusFilter)}>Todos status</button>
          {(["rascunho","aberta","votacao","encerrada","implementada","arquivada"] as EnqueteStatus[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={filterBtn(statusFilter === s)}>{statusLabels[s]}</button>
          ))}
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((e) => {
          const maxVotos = Math.max(...Object.values(e.votos).map(Number), 1)
          const votantesCount = Object.keys(e.votantes).length
          const showResult = [
            "encerrada",
            "implementada",
            "arquivada"
          ].includes(e.status)
          const showComments = expandedComments.has(e.id)
          const criadorProfile = profiles.find((p) => p.slug === e.criador) ?? null
          const participantCotaSlugs = new Set(Object.keys(e.votantes ?? {}))
          const participantProfiles = profiles.filter(
            (p) => p.cota_slug && participantCotaSlugs.has(p.cota_slug)
          )

          return (
            <div
              key={e.id}
              className={`bg-white rounded-xl border border-[#E7E5E4] p-5 space-y-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                e.quadrante
                  ? {
                      constituicao: "border-t-2 border-t-[#8B2252]",
                      deliberacao: "border-t-2 border-t-[#A16207]",
                      operacao: "border-t-2 border-t-[#166534]",
                      identidade: "border-t-2 border-t-[#7C6E00]"
                    }[e.quadrante]
                  : ""
              }`}
            >
              {/* card header */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setDetailEnquete(e)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {e.quadrante && <PollBadge quadrante={e.quadrante} />}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColors[e.categoria] || "bg-[#F8F7F4] text-[#4D4D4D]"}`}
                    >
                      {categoriaLabels[e.categoria] || e.categoria}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status as EnqueteStatus] || "bg-[#F8F7F4] text-[#4D4D4D]"}`}
                    >
                      {statusLabels[e.status as EnqueteStatus] || e.status}
                    </span>
                  </div>

                  {/* título com criador à esquerda e participantes à direita */}
                  <div className="flex items-center gap-2">
                    {criadorProfile && (
                      <Avatar
                        slug={criadorProfile.slug}
                        nome={criadorProfile.nome_completo}
                        foto_url={criadorProfile.foto_url}
                        size="sm"
                        className="shrink-0"
                      />
                    )}
                    <h3 className="font-semibold text-[#1A1A1A] hover:text-[#1F6B3A] transition-colors flex-1 min-w-0">
                      {e.titulo}
                    </h3>
                    {participantProfiles.length > 0 && (
                      <div className="flex items-center shrink-0">
                        {participantProfiles.slice(0, 6).map((p, i) => (
                          <div
                            key={p.slug}
                            className={i > 0 ? "-ml-2" : ""}
                            style={{ zIndex: 10 - i }}
                            title={p.nome_curto || p.nome_completo}
                          >
                            <Avatar
                              slug={p.slug}
                              nome={p.nome_completo}
                              foto_url={p.foto_url}
                              size="sm"
                              className="ring-2 ring-white"
                            />
                          </div>
                        ))}
                        {participantProfiles.length > 6 && (
                          <div
                            className="-ml-2 w-8 h-8 rounded-xl bg-[#E7E5E4] text-[#4D4D4D] text-xs font-semibold flex items-center justify-center ring-2 ring-white"
                            style={{ zIndex: 1 }}
                          >
                            +{participantProfiles.length - 6}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {e.descricao && (
                    <p className="text-sm text-[#4D4D4D] mt-1 line-clamp-2">
                      {e.descricao}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm("Deseja realmente excluir esta enquete?")
                      ) {
                        deletar(e.id)
                      }
                    }}
                    disabled={deletingId === e.id}
                    className="p-1.5 text-[#8A8A8A] hover:text-red-600 rounded-lg hover:bg-[#F8F7F4] shrink-0 ml-2 disabled:opacity-40"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* result badge */}
              {showResult && (
                <ResultBadge
                  approved={e.approved}
                  approvalPercent={e.approval_percent}
                  threshold={e.approval_threshold}
                />
              )}

              {/* tipo texto/escala: count + call to action */}
              {(e.tipo === "texto" || e.tipo === "escala") && (
                <p className="text-xs text-[#8A8A8A]">
                  {e.tipo === "texto"
                    ? `${Object.keys(e.respostas ?? {}).length} resposta${Object.keys(e.respostas ?? {}).length !== 1 ? "s" : ""}`
                    : `${e.total_votos} avaliação${e.total_votos !== 1 ? "ões" : ""}`}
                  {canVote(e.status) && " · clique em Detalhe para participar"}
                </p>
              )}

              {/* escala mini-distribution on card */}
              {e.tipo === "escala" &&
                canVote(e.status) &&
                e.total_votos > 0 && (
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const count = Number(e.votos[String(n - 1)] ?? 0)
                      const pct =
                        e.total_votos > 0 ? (count / e.total_votos) * 100 : 0
                      return (
                        <div key={n} className="flex items-center gap-1.5">
                          <span className="w-3 text-xs text-[#4D4D4D]">
                            {n}
                          </span>
                          <div className="flex-1 bg-[#F8F7F4] rounded-full h-1.5">
                            <div
                              className="bg-[#1F6B3A] h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#8A8A8A] w-5">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

              {/* vote bars */}
              {e.tipo !== "texto" &&
                e.tipo !== "escala" &&
                canVote(e.status) && (
                  <div className="space-y-2">
                    {e.opcoes.map((opcao, idx) => {
                      const count = e.votos[String(idx)] || 0
                      const pct =
                        e.total_votos > 0 ? (count / e.total_votos) * 100 : 0
                      const width = maxVotos > 0 ? (count / maxVotos) * 100 : 0
                      const jaVotou = currentCotaSlug
                        ? Object.keys(e.votantes).includes(currentCotaSlug)
                        : false
                      return (
                        <div key={idx}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => votar(e.id, idx)}
                              disabled={!currentCotaSlug || jaVotou}
                              className="px-2 py-1 text-xs bg-[#D5E8D4] text-[#1F6B3A] rounded-lg hover:bg-[#88C9A1]/30 disabled:opacity-40 shrink-0 font-medium"
                            >
                              {jaVotou ? "Votado" : "Votar"}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-0.5">
                                <span className="text-[#1A1A1A]">{opcao}</span>
                                <span className="text-[#8A8A8A] text-xs">
                                  {count} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-[#F8F7F4] rounded-full h-2">
                                <div
                                  className="bg-[#1F6B3A] h-2 rounded-full transition-all"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

              {/* card footer */}
              <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F4] gap-2">
                <span className="text-xs text-[#8A8A8A]">
                  {votantesCount} votante{votantesCount !== 1 ? "s" : ""}
                  {e.criador && ` · ${e.criador}`}
                  {" · "}
                  {new Date(e.created_at).toLocaleDateString("pt-BR")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setExpandedComments((prev) => {
                        const next = new Set(prev)
                        if (next.has(e.id)) {
                          next.delete(e.id)
                        } else {
                          next.add(e.id)
                        }
                        return next
                      })
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#8A8A8A] hover:text-[#4D4D4D] hover:bg-[#F8F7F4] rounded-lg"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {showComments ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setVotoError("")
                      setDetailEnquete(e)
                    }}
                    className="px-2 py-1 text-xs text-[#1F6B3A] hover:text-[#155A2A] hover:bg-[#D5E8D4] rounded-lg font-medium"
                  >
                    Detalhe
                  </button>
                </div>
              </div>

              {/* inline comments toggle */}
              {showComments && (
                <div className="pt-2 border-t border-[#F5F5F4]">
                  <DiscussaoSection enqueteId={e.id} profiles={profiles} />
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-[#8A8A8A]">
            Nenhuma enquete encontrada.
          </div>
        )}
      </div>

      {/* detail dialog */}
      {detailEnquete && (
        <DetailDialog
          enquete={detailEnquete}
          profiles={profiles}
          currentCotaSlug={currentCotaSlug}
          onVotar={votar}
          onResponder={responder}
          onTransition={transition}
          onClose={() => setDetailEnquete(null)}
          votoError={votoError}
          transitioningId={transitioningId}
        />
      )}

      {/* create dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Enquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">

            {/* Passo 1 */}
            <div>
              <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wide mb-1.5">Passo 1 — Pergunta</p>
              <Input
                placeholder="Escreva a pergunta..."
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Passo 2 */}
            <div>
              <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wide mb-2">Passo 2 — Tipo</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: "Escolha Única", tipo: "multipla" as const, multi: false },
                  { label: "Múltipla",      tipo: "multipla" as const, multi: true  },
                  { label: "Sim / Não",     tipo: "binaria"  as const, multi: false },
                  { label: "Escala 1–5",   tipo: "escala"   as const, multi: false },
                ] as const).map((opt) => {
                  const active = form.tipo === opt.tipo && form.multipla_escolha === opt.multi
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setForm({ ...form, tipo: opt.tipo, multipla_escolha: opt.multi, opcoes: ["", ""] })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        active
                          ? "bg-[#1F6B3A] text-white border-[#1F6B3A]"
                          : "bg-white text-[#1A1A1A] border-[#E7E5E4] hover:border-[#88C9A1]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Passo 3 — opções (só multipla) */}
            {form.tipo === "multipla" && (
              <div>
                <p className="text-xs font-semibold text-[#4D4D4D] uppercase tracking-wide mb-2">Passo 3 — Opções</p>
                <div className="space-y-2">
                  {form.opcoes.map((opcao, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={`Opção ${idx + 1}`}
                        value={opcao}
                        onChange={(e) => updateOpcao(idx, e.target.value)}
                        className="rounded-xl"
                      />
                      {form.opcoes.length > 2 && (
                        <button onClick={() => removeOpcao(idx)} className="p-1.5 text-[#8A8A8A] hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addOpcao} className="text-sm text-[#1F6B3A] hover:text-[#155A2A] font-medium">
                    + Adicionar opção
                  </button>
                </div>
              </div>
            )}

            {/* Footer: anônima + prazo */}
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.anonima}
                  onChange={(e) => setForm({ ...form, anonima: e.target.checked })}
                  className="w-4 h-4 rounded border-[#E7E5E4] text-[#1F6B3A] focus:ring-[#1F6B3A]"
                />
                <span className="text-sm text-[#1A1A1A]">Anônima</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm text-[#1A1A1A]">Prazo:</span>
                <Input
                  type="number"
                  min={1}
                  placeholder="dias"
                  value={form.prazo_dias}
                  onChange={(e) => setForm({ ...form, prazo_dias: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-20 rounded-xl text-sm"
                />
                <span className="text-sm text-[#8A8A8A]">dias</span>
              </label>
            </div>

            <Button
              onClick={createEnquete}
              disabled={
                saving ||
                !form.titulo.trim() ||
                !form.tipo ||
                (form.tipo === "multipla" && form.opcoes.filter((o) => o.trim()).length < 2)
              }
              className="w-full bg-[#1F6B3A] hover:bg-[#155A2A] rounded-xl"
            >
              {saving ? "Publicando..." : "Publicar Enquete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
