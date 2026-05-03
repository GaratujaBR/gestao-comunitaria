#!/usr/bin/env node
/**
 * Script de teste para simular votações em enquetes
 *
 * Uso: node test-votacao.mjs [enquete_id] [quadrante]
 *
 * Exemplos:
 *   node test-votacao.mjs                    # lista enquetes abertas
 *   node test-votacao.mjs abc123 constituicao  # simula votação de enquete constitucional
 *   node test-votacao.mjs abc123 deliberacao   # simula votação de enquete de deliberação
 *   node test-votacao.mjs abc123 operacao      # simula votação de enquete operacional
 *   node test-votacao.mjs abc123 identidade    # simula votação de enquete de identidade
 */

const API_URL = process.env.VITE_API_URL || "http://localhost:8000"

// Configurações por quadrante
const configs = {
  constituicao: {
    quorum: 75,
    threshold: 75,
    totalMembros: 20,
    descricao: "Decisão Fundamental (Quorum 75%, Threshold 75%)"
  },
  deliberacao: {
    quorum: 66,
    threshold: 66,
    totalMembros: 20,
    descricao: "Deliberação Importante (Quorum 66%, Threshold 66%)"
  },
  operacao: {
    quorum: 40,
    threshold: 50,
    totalMembros: 20,
    descricao: "Operação Cotidiana (Quorum 40%, Threshold 50%)"
  },
  identidade: {
    quorum: 60,
    threshold: 60,
    totalMembros: 20,
    descricao: "Identidade e Cultura (Quorum 60%, Threshold 60%)"
  }
}

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

async function listarEnquetes() {
  console.log("📋 Listando enquetes em votação...\n")
  try {
    const enquetes = await request("/api/enquetes")
    const emVotacao = enquetes.filter((e) => e.status === "votacao")

    if (emVotacao.length === 0) {
      console.log("❌ Nenhuma enquete em votação encontrada.")
      console.log(
        "\n💡 Crie uma enquete primeiro ou mude o status para 'votacao'."
      )
      return
    }

    console.log(`Encontradas ${emVotacao.length} enquete(s) em votação:\n`)
    emVotacao.forEach((e) => {
      const q = e.quadrante || "N/A"
      const badge =
        {
          constituicao: "⚖️",
          deliberacao: "🏗️",
          operacao: "⚙️",
          identidade: "🎭"
        }[q] || "❓"

      console.log(`  ID: ${e.id}`)
      console.log(`  ${badge} ${e.titulo}`)
      console.log(`  Quadrante: ${q}`)
      console.log(
        `  Quorum: ${e.quorum_required}% | Threshold: ${e.approval_threshold}%`
      )
      console.log(`  Votos: ${e.total_votos} | Status: ${e.status}`)
      console.log(`  ---`)
    })

    console.log("\n📝 Uso: node test-votacao.mjs [ID] [quadrante]")
    console.log(
      "   Exemplo: node test-votacao.mjs",
      emVotacao[0].id,
      emVotacao[0].quadrante || "constituicao"
    )
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

async function simularVotacao(enqueteId, quadrante) {
  const config = configs[quadrante]
  if (!config) {
    console.error(`❌ Quadrante inválido: ${quadrante}`)
    console.error("   Opções: constituicao, deliberacao, operacao, identidade")
    process.exit(1)
  }

  console.log(`🗳️  Simulando votação: ${config.descricao}\n`)

  try {
    // Buscar perfis disponíveis
    const profiles = await request("/api/profiles")
    const votantes = profiles.filter((p) => p.ativo && p.cota_slug)

    if (votantes.length === 0) {
      console.error("❌ Nenhum perfil com cota_slug encontrado.")
      return
    }

    console.log(`👥 Total de membros ativos: ${votantes.length}`)
    console.log(
      `📊 Quorum necessário: ${config.quorum}% (${Math.ceil((votantes.length * config.quorum) / 100)} votos)`
    )
    console.log(`🎯 Threshold necessário: ${config.threshold}%\n`)

    // Buscar enquete
    const enquete = await request(`/api/enquetes/${enqueteId}`)
    console.log(`📋 Enquete: ${enquete.titulo}`)
    console.log(`📝 Opções: ${enquete.opcoes.join(" | ")}\n`)

    // Simular cenários
    const cenarios = [
      { nome: "Sem votos", votosSim: 0, totalVotos: 0 },
      { nome: "Quorum baixo", votosSim: 2, totalVotos: 3 },
      { nome: "Quorum atingido, threshold não", votosSim: 5, totalVotos: 14 },
      { nome: "Quorum e threshold atingidos", votosSim: 12, totalVotos: 16 },
      { nome: "Unanimidade", votosSim: 18, totalVotos: 18 }
    ]

    for (const cenario of cenarios) {
      console.log(`\n${"=".repeat(50)}`)
      console.log(`📊 Cenário: ${cenario.nome}`)
      console.log(`${"=".repeat(50)}`)
      console.log(
        `🗳️  Votos Sim: ${cenario.votosSim} | Total votos: ${cenario.totalVotos}`
      )

      const quorumPct = (cenario.totalVotos / votantes.length) * 100
      const approvalPct =
        cenario.totalVotos > 0
          ? (cenario.votosSim / cenario.totalVotos) * 100
          : 0

      const quorumMet = quorumPct >= config.quorum
      const approvalMet = approvalPct >= config.threshold
      const isLegitima = quorumMet && approvalMet

      console.log(
        `📈 Quorum: ${quorumPct.toFixed(1)}% ${quorumMet ? "✅" : "❌"} (meta: ${config.quorum}%)`
      )
      console.log(
        `📈 Aprovação: ${approvalPct.toFixed(1)}% ${approvalMet ? "✅" : "❌"} (meta: ${config.threshold}%)`
      )

      if (isLegitima) {
        console.log(`✅ RESULTADO: Decisão LEGÍTIMA`)
      } else if (quorumMet) {
        console.log(`⏳ RESULTADO: Quorum OK, aguardando consenso`)
      } else {
        console.log(`⚠️  RESULTADO: Quorum insuficiente`)
      }

      // Mostrar como ficaria o LegitimacyMeter
      console.log(`\n🎨 Visualização do LegitimacyMeter:`)
      const quorumBar =
        "█".repeat(Math.round(quorumPct / 5)) +
        "░".repeat(20 - Math.round(quorumPct / 5))
      const approvalBar =
        "█".repeat(Math.round(approvalPct / 5)) +
        "░".repeat(20 - Math.round(approvalPct / 5))
      console.log(`   Quorum    [${quorumBar}] ${quorumPct.toFixed(0)}%`)
      console.log(`   Aprovação [${approvalBar}] ${approvalPct.toFixed(0)}%`)
    }

    console.log(`\n${"=".repeat(50)}`)
    console.log("✨ Simulação concluída!")
    console.log(`${"=".repeat(50)}`)
    console.log("\n💡 Para votar de verdade, use a interface web.")
    console.log("   Cada bolinha (cota_slug) pode votar uma única vez.")
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

// Main
const [, , enqueteId, quadrante] = process.argv

if (!enqueteId) {
  listarEnquetes()
} else {
  simularVotacao(enqueteId, quadrante || "constituicao")
}
