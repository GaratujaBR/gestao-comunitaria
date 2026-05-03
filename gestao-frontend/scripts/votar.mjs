#!/usr/bin/env node
/**
 * Script para votar em enquetes via API
 *
 * Uso: node votar.mjs [enquete_id] [opcao_index] [cota_slug]
 *
 * Exemplos:
 *   node votar.mjs                    # lista enquetes e perfis
 *   node votar.mjs abc123 0 cota-01   # vota "Sim" (opção 0) como cota-01
 *   node votar.mjs abc123 1 cota-02   # vota "Não" (opção 1) como cota-02
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

async function listar() {
  console.log("📋 Buscando dados...\n")

  try {
    const [enquetes, profiles] = await Promise.all([
      request("/api/enquetes"),
      request("/api/profiles")
    ])

    const emVotacao = enquetes.filter((e) => e.status === "votacao")
    const votantes = profiles.filter((p) => p.ativo && p.cota_slug)

    console.log("🗳️  ENQUETES EM VOTAÇÃO:\n")
    if (emVotacao.length === 0) {
      console.log("   Nenhuma enquete em votação.")
      console.log("   Crie uma enquete e mude o status para 'votacao'.")
    } else {
      emVotacao.forEach((e) => {
        const q = e.quadrante || "N/A"
        const emoji =
          {
            constituicao: "⚖️",
            deliberacao: "🏗️",
            operacao: "⚙️",
            identidade: "🎭"
          }[q] || "❓"
        console.log(`   ${emoji} ${e.titulo}`)
        console.log(`      ID: ${e.id}`)
        console.log(
          `      Quadrante: ${q} | Quorum: ${e.quorum_required}% | Threshold: ${e.approval_threshold}%`
        )
        console.log(
          `      Opções: ${e.opcoes.map((o, i) => `[${i}] ${o}`).join(" | ")}`
        )
        console.log(
          `      Votos: ${e.total_votos} | Votantes: ${Object.keys(e.votantes).length}`
        )
        console.log()
      })
    }

    console.log("👥 PERFIS DISPONÍVEIS PARA VOTAR:\n")
    votantes.forEach((p) => {
      console.log(
        `   ${p.nome_curto || p.nome_completo} (cota: ${p.cota_slug})`
      )
    })

    console.log("\n📝 USO:")
    console.log("   node votar.mjs [ENQUETE_ID] [OPCAO_INDEX] [COTA_SLUG]")
    console.log("\n   Exemplo:")
    if (emVotacao.length > 0 && votantes.length > 0) {
      console.log(
        `   node votar.mjs ${emVotacao[0].id} 0 ${votantes[0].cota_slug}`
      )
    }
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

async function votar(enqueteId, opcaoIndex, cotaSlug) {
  console.log(`🗳️  Votando na enquete ${enqueteId}...\n`)

  try {
    const body = {
      opcao_index: parseInt(opcaoIndex),
      cota_slug: cotaSlug
    }

    console.log("📤 Enviando:", JSON.stringify(body, null, 2))

    const resultado = await request(`/api/enquetes/${enqueteId}/votar`, {
      method: "POST",
      body: JSON.stringify(body)
    })

    console.log("\n✅ Voto registrado com sucesso!")
    console.log("📊 Resultado:", JSON.stringify(resultado, null, 2))

    // Buscar enquete atualizada
    const enquete = await request(`/api/enquetes/${enqueteId}`)
    console.log("\n📈 Status atual:")
    console.log(`   Total de votos: ${enquete.total_votos}`)
    console.log(
      `   Quorum: ${enquete.quorum_percent?.toFixed(1) || 0}% ${enquete.quorum_met ? "✅" : "❌"}`
    )
    console.log(
      `   Aprovação: ${enquete.approval_percent?.toFixed(1) || 0}% ${enquete.approved ? "✅" : "❌"}`
    )

    console.log("\n🗳️  Distribuição dos votos:")
    enquete.opcoes.forEach((opcao, idx) => {
      const count = enquete.votos[String(idx)] || 0
      const pct =
        enquete.total_votos > 0
          ? ((count / enquete.total_votos) * 100).toFixed(1)
          : 0
      console.log(`   [${idx}] ${opcao}: ${count} votos (${pct}%)`)
    })
  } catch (err) {
    console.error("❌ Erro ao votar:", err.message)
    if (err.message.includes("409") || err.message.includes("já votou")) {
      console.error("   💡 Esta cota já votou nesta enquete.")
    }
  }
}

// Main
const [, , enqueteId, opcaoIndex, cotaSlug] = process.argv

if (!enqueteId) {
  listar()
} else if (!opcaoIndex || !cotaSlug) {
  console.error("❌ Parâmetros incompletos.")
  console.error("   Uso: node votar.mjs [ENQUETE_ID] [OPCAO_INDEX] [COTA_SLUG]")
  console.error("   Exemplo: node votar.mjs abc123 0 cota-01")
  process.exit(1)
} else {
  votar(enqueteId, opcaoIndex, cotaSlug)
}
