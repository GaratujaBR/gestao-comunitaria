-- Gestão Comunitária - Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists profiles (
  id text primary key default uuid_generate_v4()::text,
  slug text unique not null,
  nome_completo text not null,
  nome_curto text,
  email text unique,
  telefone text,
  role text,
  lote text,
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Allow all access to profiles" on profiles for all using (true) with check (true);

-- ============================================
-- SPACES
-- ============================================
create table if not exists spaces (
  id text primary key default uuid_generate_v4()::text,
  slug text unique not null,
  nome text not null,
  tipo text,
  capacidade integer,
  area_m2 real,
  caracteristicas jsonb default '{}',
  regras_uso text,
  instrucoes_acesso text,
  fotos jsonb default '[]',
  responsavel_slug text,
  status text default 'ativo',
  created_at timestamptz default now()
);
alter table spaces enable row level security;
create policy "Allow all access to spaces" on spaces for all using (true) with check (true);

-- ============================================
-- ITEMS
-- ============================================
create table if not exists items (
  id text primary key default uuid_generate_v4()::text,
  codigo text unique not null,
  nome text not null,
  descricao text,
  space_slug text,
  container_especifico text,
  categoria text,
  estado text default 'bom',
  manual_cuidados text,
  ciclo_manutencao text,
  ultima_manutencao date,
  proxima_manutencao date,
  vezes_usado integer default 0,
  tags jsonb default '[]',
  fotos jsonb default '[]',
  qr_code_url text,
  created_at timestamptz default now()
);
alter table items enable row level security;
create policy "Allow all access to items" on items for all using (true) with check (true);

-- ============================================
-- BOOKINGS
-- ============================================
create table if not exists bookings (
  id text primary key default uuid_generate_v4()::text,
  space_slug text,
  item_codigos jsonb default '[]',
  profile_slug text not null,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  tipo_uso text,
  finalidade text,
  numero_pessoas integer,
  status text default 'pendente',
  checkin_itens timestamptz,
  checkout_itens timestamptz,
  checklist_entrada jsonb default '{}',
  checklist_saida jsonb default '{}',
  observacoes text,
  created_at timestamptz default now()
);
alter table bookings enable row level security;
create policy "Allow all access to bookings" on bookings for all using (true) with check (true);

-- ============================================
-- LOGS
-- ============================================
create table if not exists logs (
  id text primary key default uuid_generate_v4()::text,
  item_codigo text,
  acao text not null,
  profile_slug text,
  booking_id text,
  "timestamp" timestamptz default now(),
  local_uso text,
  condicao_saida text,
  condicao_retorno text,
  descricao_incidente text,
  fotos_evidencia jsonb default '[]',
  clima text,
  sazonalidade text
);
alter table logs enable row level security;
create policy "Allow all access to logs" on logs for all using (true) with check (true);

-- ============================================
-- WIKI ARTICLES
-- ============================================
create table if not exists wiki_articles (
  id text primary key default uuid_generate_v4()::text,
  slug text unique not null,
  titulo text not null,
  categoria text,
  conteudo text not null,
  resumo_ia text,
  entidades jsonb default '[]',
  materiais jsonb default '[]',
  dificuldade integer,
  tempo_execucao_horas integer,
  autor_slug text,
  validado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table wiki_articles enable row level security;
create policy "Allow all access to wiki_articles" on wiki_articles for all using (true) with check (true);

-- ============================================
-- ALERTS
-- ============================================
create table if not exists alerts (
  id text primary key default uuid_generate_v4()::text,
  tipo text,
  profile_slug text,
  titulo text not null,
  mensagem text,
  dados_json jsonb default '{}',
  lido boolean default false,
  data_acao timestamptz,
  created_at timestamptz default now()
);
alter table alerts enable row level security;
create policy "Allow all access to alerts" on alerts for all using (true) with check (true);

-- ============================================
-- SHEET ROWS
-- ============================================
create table if not exists sheet_rows (
  id text primary key default uuid_generate_v4()::text,
  area text not null,
  status text not null,
  responsavel text,
  item text not null,
  descricao text,
  quantidade integer,
  valor real,
  total real,
  created_at timestamptz default now()
);
alter table sheet_rows enable row level security;
create policy "Allow all access to sheet_rows" on sheet_rows for all using (true) with check (true);

-- ============================================
-- CHAMADOS
-- ============================================
create table if not exists chamados (
  id text primary key default uuid_generate_v4()::text,
  numero serial,
  estrutura text not null,
  area text,
  descricao text not null,
  prioridade text default 'normal',
  tipo text default 'corretiva',
  status text default 'aberto',
  prestador_id text,
  prestador_nome text,
  prestador_telefone text,
  solicitante text,
  resolucao text,
  created_at timestamptz default now()
);
alter table chamados enable row level security;
create policy "Allow all access to chamados" on chamados for all using (true) with check (true);

-- ============================================
-- PRESTADORES
-- ============================================
create table if not exists prestadores (
  id text primary key default uuid_generate_v4()::text,
  nome text not null,
  telefone text not null,
  especialidade text,
  empresa text,
  notas text,
  created_at timestamptz default now()
);
alter table prestadores enable row level security;
create policy "Allow all access to prestadores" on prestadores for all using (true) with check (true);

-- ============================================
-- ENQUETES
-- ============================================
create table if not exists enquetes (
  id text primary key default uuid_generate_v4()::text,
  titulo text not null,
  descricao text,
  categoria text default 'decisao',
  opcoes jsonb not null,
  votos jsonb default '{}',
  votantes jsonb default '{}',
  total_votos integer default 0,
  criador text,
  multipla_escolha boolean default false,
  status text default 'aberta',
  created_at timestamptz default now()
);
alter table enquetes enable row level security;
create policy "Allow all access to enquetes" on enquetes for all using (true) with check (true);
