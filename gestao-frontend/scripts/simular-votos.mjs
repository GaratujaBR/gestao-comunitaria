#!/usr/bin/env node
/**
 * Script para simular múltiplos votos em sequência
 * Útil para testar o LegitimacyMeter em diferentes cenários
 *
 * Uso: node simular-votos.mjs [enquete_id] [cenario]
 *
 * Cenários:
 *   sem-votos        - nenhum voto
 *   quorum-baixo     - poucos votos, abaixo do quorum
 *   quorum-ok        - quorum atingido, mas threshold não
 *   aprovada         - quorum e threshold atingidos
 *   unanimidade      - todos votam sim
 *
 * Exemplo:
 *   node simular-votos.mjs abc123 aprovada
 */

const API_URL = process.env.VITE_API_URL || "http://localhost:8000"

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined
  return res.json()
}

async function simular(enqueteId, cenario) {
  console.log(`🎭 Simulando cenário: ${cenario}\n`)

  try {
    // Buscar dados
    const [enquete, profiles] = await Promise.all([
      request(`/api/enquetes/${enqueteId}`),
      request("/api/profiles")
    ])

    const votantes = profiles.filter((p) => p.ativo && p.cota_slug)
    const totalMembros = votantes.length

    console.log(`📋 Enquete: ${enquete.titulo}`)
    console.log(
      `📊 Quorum: ${enquete.quorum_required}% | Threshold: ${enquete.approval_threshold}%`
    )
    console.log(`👥 Total de membros: ${totalMembros}`)
    console.log(`🗳️  Opções: ${enquete.opcoes.join(" | ")}\n`)

    // Definir cenário
    let votosSim = 0
    let totalVotos = 0

    switch (cenario) {
      case "sem-votos":
        votosSim = 0
        totalVotos = 0
        break
      case "quorum-baixo":
        totalVotos = Math.floor(totalMembros * 0.2)
        votosSim = Math.floor(totalVotos * 0.6)
        break
      case "quorum-ok":
        totalVotos = Math.ceil(totalMembros * (enquete.quorum_required / 100))
        votosSim = Math.floor(totalVotos * 0.4) // abaixo do threshold
        break
      case "aprovada":
        totalVotos =
          Math.ceil(totalMembros * (enquete.quorum_required / 100)) + 2
        votosSim =
          Math.ceil(totalVotos * (enquete.approval_threshold / 100)) + 1
        break
      case "unanimidade":
        totalVotos = totalMembros
        votosSim = totalMembros
        break
      default:
        console.error(`❌ Cenário inválido: ${cenario}`)
        console.error(
          "   Opções: sem-votos, quorum-baixo, quorum-ok, aprovada, unanimidade"
        )
        process.exit(1)
    }

    console.log(`🎯 Cenário: ${cenario}`)
    console.log(`   Votos Sim: ${votosSim} | Total votos: ${totalVotos}\n`)

    // Calcular resultado esperado
    const quorumPct = (totalVotos / totalMembros) * 100
    const approvalPct = totalVotos > 0 ? (votosSim / totalVotos) * 100 : 0
    const quorumMet = quorumPct >= enquete.quorum_required
    const approvalMet = approvalPct >= enquete.approval_threshold
    const isLegitima = quorumMet && approvalMet

    console.log("📊 Resultado esperado:")
    console.log(
      `   Quorum: ${quorumPct.toFixed(1)}% ${quorumMet ? "✅" : "❌"}`
    )
    console.log(
      `   Aprovação: ${approvalPct.toFixed(1)}% ${approvalMet ? "✅" : "❌"}`
    )
    console.log(`   Legítima: ${isLegitima ? "✅ SIM" : "❌ NÃO"}\n`)

    // Mostrar como ficaria o LegitimacyMeter
    console.log("🎨 Visualização do LegitimacyMeter:")
    const quorumBar =
      "█".repeat(Math.min(Math.round(quorumPct / 5), 20)) +
      "░".repeat(Math.max(20 - Math.round(quorumPct / 5), 0))
    const approvalBar =
      "█".repeat(Math.min(Math.round(approvalPct / 5), 20)) +
      "░".repeat(Math.max(20 - Math.round(approvalPct / 5), 0))

    console.log(`   Quorum    [${quorumBar}] ${quorumPct.toFixed(0)}%`)
    console.log(`   Aprovação [${approvalBar}] ${approvalPct.toFixed(0)}%`)

    if (isLegitima) {
      console.log(
        "\n   ✅ Decisão legítima — aprovada com participação e consenso"
      )
    } else if (quorumMet) {
      console.log("\n   ✅ Quorum atingido — aguardando consenso mínimo")
    } else {
      console.log("\n   ⚠️ Quorum ainda não atingido")
    }

    console.log("\n💡 Para aplicar esses votos na API, use:")
    console.log(`   node scripts/votar.mjs ${enqueteId} 0 [COTA_SLUG]`)
    console.log("\n   Ou vote manualmente pela interface web.")
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

// Main
const [, , enqueteId, cenario = "aprovada"] = process.argv

if (!enqueteId) {
  console.error("❌ ID da enquete não informado.")
  console.error("   Uso: node simular-votos.mjs [ENQUETE_ID] [CENARIO]")
  console.error("   Exemplo: node simular-votos.mjs abc123 aprovada")
  process.exit(1)
}

simular(enqueteId, cenario)
