export interface Cota {
  id: string
  slug: string
  numero: number
  nome: string
  ativo: boolean
  created_at: string
}

export interface Profile {
  id: string
  slug: string
  nome_completo: string
  nome_curto: string | null
  email: string | null
  telefone: string | null
  role: string | null
  lote: string | null
  cota_slug: string | null
  foto_url: string | null
  ativo: boolean
  created_at: string
}

export interface Space {
  id: string
  slug: string
  nome: string
  tipo: string | null
  capacidade: number | null
  area_m2: number | null
  caracteristicas: Record<string, unknown> | null
  regras_uso: string | null
  instrucoes_acesso: string | null
  fotos: string[] | null
  responsavel_slug: string | null
  parent_slug: string | null
  status: string
  created_at: string
}

export interface Item {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  space_slug: string | null
  container_especifico: string | null
  categoria: string | null
  estado: string
  manual_cuidados: string | null
  ciclo_manutencao: string | null
  ultima_manutencao: string | null
  proxima_manutencao: string | null
  vezes_usado: number
  tags: string[] | null
  fotos: string[] | null
  qr_code_url: string | null
  created_at: string
}

export interface Booking {
  id: string
  space_slug: string | null
  item_codigos: string[] | null
  profile_slug: string
  cota_slug: string | null
  data_inicio: string
  data_fim: string
  tipo_uso: string | null
  finalidade: string | null
  numero_pessoas: number | null
  status: string
  checkin_itens: string | null
  checkout_itens: string | null
  checklist_entrada: Record<string, unknown> | null
  checklist_saida: Record<string, unknown> | null
  observacoes: string | null
  evento_id: string | null
  created_at: string
}

export interface Log {
  id: string
  item_codigo: string | null
  acao: string
  profile_slug: string | null
  booking_id: string | null
  timestamp: string
  local_uso: string | null
  condicao_saida: string | null
  condicao_retorno: string | null
  descricao_incidente: string | null
  fotos_evidencia: string[] | null
  clima: string | null
  sazonalidade: string | null
}

export interface WikiArticle {
  id: string
  slug: string
  titulo: string
  categoria: string | null
  conteudo: string
  resumo_ia: string | null
  entidades: string[] | null
  materiais: Array<Record<string, unknown>> | null
  dificuldade: number | null
  tempo_execucao_horas: number | null
  autor_slug: string | null
  validado: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  tipo: string | null
  profile_slug: string | null
  titulo: string
  mensagem: string | null
  dados_json: Record<string, unknown> | null
  lido: boolean
  data_acao: string | null
  created_at: string
}

export interface SheetRow {
  id: string
  area: string
  status: string
  responsavel: string | null
  item: string
  descricao: string | null
  quantidade: number | null
  valor: number | null
  total: number | null
  created_at: string
}

export interface SheetData {
  rows: SheetRow[]
  count: number
  total_compras: number
  saldo_atual: number | null
}

export interface Chamado {
  id: string
  numero: number
  estrutura: string
  area: string | null
  descricao: string
  prioridade: string
  tipo: string
  status: string
  prestador_id: string | null
  prestador_nome: string | null
  prestador_telefone: string | null
  solicitante: string | null
  resolucao: string | null
  created_at: string
}

export interface Prestador {
  id: string
  nome: string
  telefone: string
  especialidade: string | null
  empresa: string | null
  notas: string | null
  created_at: string
}

export interface Evento {
  id: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string
  tipo: string | null
  local_slug: string | null
  criador_slug: string | null
  cor: string | null
  publico: boolean
  created_at: string
}

export type EnqueteStatus =
  | "rascunho"
  | "aberta"
  | "votacao"
  | "encerrada"
  | "implementada"
  | "arquivada"

export type EnqueteTipo = "binaria" | "multipla" | "escala" | "texto"

export type QuadranteType =
  | "constituicao"
  | "deliberacao"
  | "operacao"
  | "identidade"

export interface Enquete {
  id: string
  titulo: string
  descricao: string | null
  categoria: string
  tipo: EnqueteTipo
  opcoes: string[]
  votos: Record<string, number>
  votantes: Record<string, number[]>
  total_votos: number
  criador: string | null
  multipla_escolha: boolean
  anonima?: boolean
  status: EnqueteStatus
  quorum_required: number
  approval_threshold: number
  closes_at: string | null
  voting_starts_at: string | null
  result_action: string | null
  respostas: Record<string, string>
  created_at: string
  // computed by backend
  quorum_percent: number | null
  quorum_met: boolean | null
  approval_percent: number | null
  approved: boolean | null
  // framework visual decision
  quadrante?: QuadranteType
  weight_level?: number
  override_reason?: string
}

export interface EnqueteComentario {
  id: string
  enquete_id: string
  autor: string
  conteudo: string
  created_at: string
}
