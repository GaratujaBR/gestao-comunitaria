#!/usr/bin/env node
/**
 * Script para criar enquetes de teste com diferentes quadrantes
 *
 * Uso: node criar-enquete-teste.mjs [quadrante]
 *
 * Exemplos:
 *   node criar-enquete-teste.mjs constituicao   # cria enquete de constituição
 *   node criar-enquete-teste.mjs deliberacao    # cria enquete de deliberação
 *   node criar-enquete-teste.mjs operacao       # cria enquete operacional
 *   node criar-enquete-teste.mjs identidade     # cria enquete de identidade
 */

const API_URL = process.env.VITE_API_URL || "http://localhost:8000"

const configs = {
  constituicao: {
    titulo: "Mudança de nome da comunidade",
    descricao:
      "Após 3 anos como 'Terra de Canaã', sentimos que o nome não reflete mais nossa identidade. Propomos 'Pequi Baru' como novo nome.",
    categoria: "decisao",
    tipo: "binaria",
    opcoes: ["Sim", "Não", "Abstenção"],
    quorum_required: 75,
    approval_threshold: 75,
    quadrante: "constituicao",
    weight_level: 9
  },
  deliberacao: {
    titulo: "Compra do terreno adjacente",
    descricao:
      "Oportunidade de adquirir 2 hectares ao lado da propriedade atual por R$ 180.000.",
    categoria: "decisao",
    tipo: "binaria",
    opcoes: ["Sim", "Não", "Abstenção"],
    quorum_required: 66,
    approval_threshold: 66,
    quadrante: "deliberacao",
    weight_level: 7
  },
  operacao: {
    titulo: "Novo rodízio de cozinha",
    descricao:
      "Proposta de novo sistema de rodízio semanal para a cozinha comunitária.",
    categoria: "preferencia",
    tipo: "multipla",
    opcoes: ["Semanal fixo", "Quinzenal", "Voluntário", "Manter atual"],
    quorum_required: 40,
    approval_threshold: 50,
    quadrante: "operacao",
    weight_level: 3
  },
  identidade: {
    titulo: "Nome para a nova área comum",
    descricao:
      "A nova área de convivência precisa de um nome. Vote na sua preferida!",
    categoria: "preferencia",
    tipo: "multipla",
    opcoes: [
      "Praça das Palmeiras",
      "Recanto Verde",
      "Ágora",
      "Lar Comunitário"
    ],
    quorum_required: 60,
    approval_threshold: 60,
    quadrante: "identidade",
    weight_level: 5
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

async function criarEnquete(quadrante) {
  const config = configs[quadrante]
  if (!config) {
    console.error(`❌ Quadrante inválido: ${quadrante}`)
    console.error("   Opções: constituicao, deliberacao, operacao, identidade")
    process.exit(1)
  }

  const emoji = {
    constituicao: "⚖️",
    deliberacao: "🏗️",
    operacao: "⚙️",
    identidade: "🎭"
  }[quadrante]

  console.log(`${emoji} Criando enquete de ${quadrante}...\n`)
  console.log(`   Título: ${config.titulo}`)
  console.log(
    `   Quorum: ${config.quorum_required}% | Threshold: ${config.approval_threshold}%`
  )
  console.log(`   Tipo: ${config.tipo}`)
  console.log(`   Opções: ${config.opcoes.join(" | ")}\n`)

  try {
    const enquete = await request("/api/enquetes", {
      method: "POST",
      body: JSON.stringify({
        ...config,
        criador: "Sistema de Teste",
        multipla_escolha: false,
        closes_at: null,
        result_action: null,
        override_reason: null
      })
    })

    console.log("✅ Enquete criada com sucesso!")
    console.log(`   ID: ${enquete.id}`)
    console.log(`   Status: ${enquete.status}`)

    // Mudar para votação
    console.log("\n🔄 Mudando status para 'votacao'...")
    await request(`/api/enquetes/${enquete.id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "votacao" })
    })

    console.log("✅ Enquete pronta para votação!\n")
    console.log("📝 Próximos passos:")
    console.log(`   1. Listar perfis: node scripts/votar.mjs`)
    console.log(
      `   2. Votar: node scripts/votar.mjs ${enquete.id} 0 [COTA_SLUG]`
    )

    return enquete
  } catch (err) {
    console.error("❌ Erro:", err.message)
  }
}

// Main
const [, , quadrante = "constituicao"] = process.argv
criarEnquete(quadrante)
