#!/usr/bin/env node
/**
 * Script para votar em lote com múltiplas cotas
 *
 * Uso: node votar-lote.mjs [enquete_id] [opcao_index] [num_votos]
 *
 * Exemplo:
 *   node votar-lote.mjs abc123 0 15  # vota "Sim" 15 vezes
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

async function votarLote(enqueteId, opcaoIndex, numVotos) {
  console.log(`🗳️  Votando ${numVotos} vezes na enquete ${enqueteId}...\n`)

  try {
    // Buscar cotas
    const cotas = await request("/api/cotas")
    const cotasAtivas = cotas.filter((c) => c.ativo).slice(0, numVotos)

    if (cotasAtivas.length === 0) {
      console.error("❌ Nenhuma cota ativa encontrada.")
      return
    }

    console.log(`👥 Cotas disponíveis: ${cotasAtivas.length}\n`)

    let sucessos = 0
    let falhas = 0

    for (let i = 0; i < cotasAtivas.length; i++) {
      const cota = cotasAtivas[i]
      try {
        await request(`/api/enquetes/${enqueteId}/votar`, {
          method: "POST",
          body: JSON.stringify({
            opcao_index: parseInt(opcaoIndex),
            cota_slug: cota.slug
          })
        })
        sucessos++
        process.stdout.write(`✅`)
      } catch (err) {
        falhas++
        process.stdout.write(`❌`)
      }

      if ((i + 1) % 10 === 0) process.stdout.write(` ${i + 1}\n`)
    }

    console.log(`\n\n📊 Resultado:`)
    console.log(`   ✅ Sucessos: ${sucessos}`)
    console.log(`   ❌ Falhas: ${falhas}`)

    // Buscar resultado final
    const enquete = await request(`/api/enquetes/${enqueteId}`)
    console.log(`\n📈 Status final:`)
    console.log(`   Total votos: ${enquete.total_votos}`)
    console.log(
      `   Quorum: ${enquete.quorum_percent?.toFixed(1) || 0}% ${enquete.quorum_met ? "✅" : "❌"} (meta: ${enquete.quorum_required}%)`
    )
    console.log(
      `   Aprovação: ${enquete.approval_percent?.toFixed(1) || 0}% ${enquete.approved ? "✅" : "❌"} (meta: ${enquete.approval_threshold}%)`
    )

    console.log(`\n🗳️  Distribuição:`)
    enquete.opcoes.forEach((opcao, idx) => {
      const count = enquete.votos[String(idx)] || 0
      const pct =
        enquete.total_votos > 0
          ? ((count / enquete.total_votos) * 100).toFixed(1)
          : 0
      console.log(`   [${idx}] ${opcao}: ${count} votos (${pct}%)`)
    })
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

// Main
const [, , enqueteId, opcaoIndex = "0", numVotos = "15"] = process.argv

if (!enqueteId) {
  console.error("❌ ID da enquete não informado.")
  console.error(
    "   Uso: node votar-lote.mjs [ENQUETE_ID] [OPCAO_INDEX] [NUM_VOTOS]"
  )
  process.exit(1)
}

votarLote(enqueteId, opcaoIndex, parseInt(numVotos))
