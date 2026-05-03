import type { QuadranteType, EnqueteTipo, Enquete } from "@/api/types"

export interface DecisionConfig {
  quadrante: QuadranteType
  quorum_required: number
  approval_threshold: number
  tipo: EnqueteTipo
  discussion_days: number
  regra_especial?: string
}

export interface QuadrantBadge {
  emoji: string
  color: string
  bgColor: string
  label: string
}

export interface LegitimacyStatus {
  quorumStatus: "not_met" | "met"
  approvalStatus: "not_met" | "met"
  isLegitima: boolean
  message: string
}

export function posToQuadrant(x: number, y: number): QuadranteType {
  if (x >= 50 && y >= 50) return "constituicao"
  if (x < 50 && y >= 50) return "deliberacao"
  if (x < 50 && y < 50) return "operacao"
  return "identidade"
}

export function suggestConfig(x: number, y: number): DecisionConfig {
  const quadrante = posToQuadrant(x, y)

  const configs: Record<QuadranteType, DecisionConfig> = {
    constituicao: {
      quadrante: "constituicao",
      quorum_required: 75,
      approval_threshold: 75,
      tipo: "binaria",
      discussion_days: 10,
      regra_especial: "Se rejeitada, não pode ser reproposta em 6 meses"
    },
    deliberacao: {
      quadrante: "deliberacao",
      quorum_required: 66,
      approval_threshold: 66,
      tipo: "binaria",
      discussion_days: 7,
      regra_especial: "Se aprovada, revisão obrigatória em 12 meses"
    },
    operacao: {
      quadrante: "operacao",
      quorum_required: 40,
      approval_threshold: 50,
      tipo: "multipla",
      discussion_days: 2,
      regra_especial:
        "Se ninguém votar em 48h, a proposta passa automaticamente"
    },
    identidade: {
      quadrante: "identidade",
      quorum_required: 60,
      approval_threshold: 60,
      tipo: "multipla",
      discussion_days: 5,
      regra_especial: "Recomendada votação em 2 turnos"
    }
  }

  return configs[quadrante]
}

export function getQuadrantBadge(quadrante: QuadranteType): QuadrantBadge {
  const badges: Record<QuadranteType, QuadrantBadge> = {
    constituicao: {
      emoji: "⚖️",
      color: "text-[#8B2252]",
      bgColor: "bg-[#FDF0F4]",
      label: "Decisão Fundamental"
    },
    deliberacao: {
      emoji: "🏗️",
      color: "text-[#A16207]",
      bgColor: "bg-[#FFF8ED]",
      label: "Deliberação Importante"
    },
    operacao: {
      emoji: "⚙️",
      color: "text-[#166534]",
      bgColor: "bg-[#D5E8D4]",
      label: "Operação Cotidiana"
    },
    identidade: {
      emoji: "🎭",
      color: "text-[#7C6E00]",
      bgColor: "bg-[#FFFBE6]",
      label: "Identidade e Cultura"
    }
  }
  return badges[quadrante]
}

export function quadrantLabel(quadrante: QuadranteType): string {
  const labels: Record<QuadranteType, string> = {
    constituicao: "Constituição",
    deliberacao: "Deliberação",
    operacao: "Operação",
    identidade: "Identidade"
  }
  return labels[quadrante]
}

export function calculateLegitimacy(
  poll: Enquete,
  totalMembers: number
): LegitimacyStatus {
  const quorumPct =
    poll.quorum_percent ??
    (totalMembers > 0 ? (poll.total_votos / totalMembers) * 100 : 0)
  const approvalPct =
    poll.approval_percent ??
    (poll.total_votos > 0
      ? ((poll.votos["0"] ?? 0) / poll.total_votos) * 100
      : 0)

  const quorumMet = quorumPct >= poll.quorum_required
  const approvalMet = approvalPct >= poll.approval_threshold
  const isLegitima = quorumMet && approvalMet

  let message: string
  if (isLegitima) {
    message = "✅ Decisão legítima — aprovada com participação e consenso"
  } else if (quorumMet) {
    message = "✅ Quorum atingido — aguardando consenso mínimo"
  } else {
    message = "⚠️ Quorum ainda não atingido"
  }

  return {
    quorumStatus: quorumMet ? "met" : "not_met",
    approvalStatus: approvalMet ? "met" : "not_met",
    isLegitima,
    message
  }
}

export function getOverrideWarning(
  suggested: Pick<DecisionConfig, "quorum_required" | "approval_threshold">,
  actual: { quorum_required: number; approval_threshold: number }
): string | null {
  const quorumDiff = Math.abs(
    actual.quorum_required - suggested.quorum_required
  )
  const thresholdDiff = Math.abs(
    actual.approval_threshold - suggested.approval_threshold
  )

  if (quorumDiff > 20 || thresholdDiff > 20) {
    return `A configuração diverge significativamente da sugestão (quorum: ${suggested.quorum_required}% → ${actual.quorum_required}%, threshold: ${suggested.approval_threshold}% → ${actual.approval_threshold}%). A legitimidade da decisão pode ser afetada.`
  }
  return null
}
