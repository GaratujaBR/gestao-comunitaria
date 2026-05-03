# Especificação Técnica — Sistema de Enquetes
## App de Gestão Comunitária Intencional Sustentável

---

### 1. Visão Geral

Módulo de enquetes para app de comunidade intencional. Não é um sistema genérico de votação: é uma ferramenta de **deliberação e governança coletiva** com regras de quorum, fases de discussão e vinculação a ações (tarefas).

**Stack:** Supabase (PostgreSQL + RLS + Edge Functions), React/Next.js, TypeScript.
**Autenticação:** JWT via Supabase Auth (usuários vinculados a `community_id`).

---

### 2. Princípios Arquiteturais

1. **Transparência total:** enquetes públicas dentro da comunidade. Quem votou é registrado (não como votou, se anônimo).
2. **Deliberação antes da votação:** fase de comentários/discussão obrigatória (ou recomendada) antes de abrir votação.
3. **Ciclo fechado:** enquete vinculada a uma proposta ou tarefa. Não fica órfã.
4. **Limiares explícitos:** quorum mínimo e % de aprovação configuráveis e visíveis desde o início.
5. **Simplicidade:** 3 tipos de enquete no MVP.

---

### 3. Schema do Banco de Dados (Supabase)

#### 3.1 Tabela: `polls`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `community_id` | `uuid` | FK → `communities.id)`, NOT NULL | Comunidade dona da enquete |
| `created_by` | `uuid` | FK → `auth.users(id)`, NOT NULL | Autor da proposta |
| `title` | `text` | NOT NULL | Título da enquete/proposta |
| `description` | `text` | | Descrição detalhada |
| `type` | `text` | CHECK IN (`'binary'`, `'multiple'`, `'approval'`, `'scale'`) | Tipo de enquete |
| `status` | `text` | CHECK IN (`'draft'`, `'open'`, `'voting'`, `'closed'`, `'implemented'`, `'archived'`), default `'draft'` | Status do ciclo de vida |
| `quorum_required` | `int` | CHECK (0-100), default 60 | % de pessoas ativas da comunidade necessárias |
| `approval_threshold` | `int` | CHECK (0-100), default 66 | % de votos favoráveis para aprovação |
| `anonymous_votes` | `boolean` | default `false` | Se true, não registra `user_id` em `poll_votes` (mas registra hash ou referência interna para evitar duplo voto) |
| `allow_comments` | `boolean` | default `true` | Permite discussão |
| `discussion_starts_at` | `timestamp` | | Quando abre para comentários |
| `voting_starts_at` | `timestamp` | | Quando abre para votos |
| `closes_at` | `timestamp` | | Fim da votação |
| `result_action` | `text` | | Descrição do que acontece se aprovado (ex: "Comprar o terreno adjacente via fundo comunitário") |
| `implementer_id` | `uuid` | FK → `auth.users(id)`, nullable | Responsável pela execução se aprovada |
| `implementation_deadline_days` | `int` | default 30 | Prazo em dias para implementação |
| `created_at` | `timestamp` | default `now()` | |
| `updated_at` | `timestamp` | default `now()` | |

**Índices:**
- `polls_community_id_status_idx` em (`community_id`, `status`) para listagem rápida.
- `polls_closes_at_idx` para queries de enquetes próximas de fechar.

#### 3.2 Tabela: `poll_options`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `uuid` | PK | |
| `poll_id` | `uuid` | FK → `polls(id)`, ON DELETE CASCADE | |
| `label` | `text` | NOT NULL | Texto da opção (ex: "Sim", "Não", "Projeto A") |
| `order` | `int` | default 0 | Ordem de exibição |
| `color` | `text` | | Hex opcional para visualização |

#### 3.3 Tabela: `poll_votes`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `uuid` | PK | |
| `poll_id` | `uuid` | FK → `polls(id)`, ON DELETE CASCADE | |
| `user_id` | `uuid` | FK → `auth.users(id)`, nullable se `anonymous_votes=true` | Quem votou |
| `option_id` | `uuid` | FK → `poll_options(id)`, nullable | Opção escolhida |
| `value` | `int` | CHECK (1-5) | Para tipo `scale` (Likert) |
| `weight` | `int` | default 1 | Peso do voto (futuro: pesos diferenciados) |
| `created_at` | `timestamp` | default `now()` | |

**Restrições únicas:**
- `unique_user_poll_vote`: `UNIQUE(poll_id, user_id)` — um usuário vota uma vez por enquete (exceto `approval` que permite múltiplas opções, ver lógica abaixo).

> **Nota sobre Approval Voting:** para tipo `approval`, a tabela `poll_votes` terá uma linha por opção marcada. A constraint `unique_user_poll_vote` precisa ser relaxada para `(poll_id, user_id, option_id)` quando `type = 'approval'`.

#### 3.4 Tabela: `poll_comments`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `uuid` | PK | |
| `poll_id` | `uuid` | FK → `polls(id)`, ON DELETE CASCADE | |
| `user_id` | `uuid` | FK → `auth.users(id)` | |
| `content` | `text` | NOT NULL | |
| `parent_id` | `uuid` | FK → `poll_comments(id)`, nullable | Respostas aninhadas (thread) |
| `created_at` | `timestamp` | default `now()` | |

#### 3.5 Tabela: `poll_results` (materializada/cache)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `poll_id` | `uuid` | PK, FK → `polls(id)` |
| `total_votes` | `int` | Total de votantes |
| `quorum_percent` | `int` | % atingida do quorum |
| `quorum_met` | `boolean` | Se quorum foi atingido |
| `winning_option_id` | `uuid` | Opção vencedora (se houver) |
| `winning_percent` | `int` | % da opção vencedora |
| `approved` | `boolean` | Se passou no threshold |
| `computed_at` | `timestamp` | Último cálculo |

---

### 4. Row Level Security (RLS) — Supabase

#### `polls`
```sql
-- Leitura: membros da comunidade veem enquetes do seu community_id
CREATE POLICY "polls_select_community" ON polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = polls.community_id
      AND cm.user_id = auth.uid()
    )
  );

-- Inserção: qualquer membro ativo pode criar
CREATE POLICY "polls_insert_community" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = polls.community_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
    )
  );

-- Atualização: apenas criador OU admin da comunidade
CREATE POLICY "polls_update_owner_or_admin" ON polls
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = polls.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );
```

#### `poll_votes`
```sql
-- Inserção: membro ativo da comunidade, enquete aberta para votação
CREATE POLICY "votes_insert_active_member" ON poll_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN community_members cm ON cm.community_id = p.community_id
      WHERE p.id = poll_votes.poll_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND p.status = 'voting'
      AND (p.voting_starts_at IS NULL OR p.voting_starts_at <= now())
      AND (p.closes_at IS NULL OR p.closes_at >= now())
    )
  );

-- Leitura: se anônimo, usuários comuns NÃO veem user_id (mas veem contagem)
-- Se não anônimo, user_id visível para membros da comunidade
```

---

### 5. Tipos de Enquete (MVP)

#### 5.1 `binary` — Sim / Não / Abstenção
- Opções fixas: "Sim", "Não", "Abstenção".
- Cálculo: % de "Sim" sobre total de votos válidos (exclui abstenção).
- Threshold padrão: 66%.
- Casos de uso: aprovação de despesas grandes, mudanças de regra, admissão de novo membro.

#### 5.2 `approval` — Aprovação Múltipla
- Usuário pode marcar quantas opções quiser (ou até N máximo configurável).
- Vencem as opções que atingem quorum individual (ex: 30% da comunidade marcou).
- Não há "vencedor único" necessariamente — pode haver múltiplos projetos aprovados.
- Casos de uso: orçamento participativo, priorização de projetos, escolha de fornecedores.

#### 5.3 `scale` — Escala Likert (1 a 5)
- Média e distribuição visíveis.
- **Regra especial:** se `anonymous_votes = false`, comentário obrigatório para nota 1 ou 5 (extremos).
- Média só exibida após o usuário votar (evita ancoragem).
- Casos de uso: avaliação de rodízios, satisfação com infraestrutura, checagem de temperatura.

---

### 6. Ciclo de Vida da Enquete (State Machine)

```
draft ──► open ──► voting ──► closed ──► implemented
  │        │         │           │
  │        │         │           └──► archived (se rejeitada ou sem quorum)
  │        │         │
  │        │         └──► Se quorum não atingido: closed
  │        │
  │        └──► 48h de discussão (comentários, sem voto)
  │             Criador pode editar descrição e opções
  │
  └──► Pode ser deletado pelo criador ou admin
```

**Transições automáticas (Edge Function cron ou trigger):**
- `open` → `voting`: quando `voting_starts_at` chega.
- `voting` → `closed`: quando `closes_at` chega.
- Ao fechar: calcula resultado, atualiza `poll_results`, verifica quorum e threshold.

**Transições manuais:**
- `draft` → `open`: criador clica "Publicar para discussão".
- `closed` → `implemented`: admin ou implementador marca como implementada (cria task automaticamente).
- Qualquer status → `archived`: admin.

---

### 7. Lógica de Cálculo de Resultado

```typescript
interface PollResult {
  totalVoters: number;
  totalActiveMembers: number;
  quorumPercent: number;
  quorumMet: boolean;
  winningOption?: PollOption;
  winningPercent?: number;
  approved: boolean;
}

function calculatePollResult(poll: Poll, votes: Vote[], activeMembersCount: number): PollResult {
  const totalVoters = new Set(votes.map(v => v.user_id)).size;
  const quorumPercent = Math.round((totalVoters / activeMembersCount) * 100);
  const quorumMet = quorumPercent >= poll.quorum_required;

  // Binary: % de Sim sobre votos válidos (exclui abstenção)
  if (poll.type === 'binary') {
    const validVotes = votes.filter(v => v.option_label !== 'Abstenção');
    const yesVotes = validVotes.filter(v => v.option_label === 'Sim');
    const yesPercent = validVotes.length > 0
      ? Math.round((yesVotes.length / validVotes.length) * 100)
      : 0;
    return {
      totalVoters,
      totalActiveMembers: activeMembersCount,
      quorumPercent,
      quorumMet,
      winningPercent: yesPercent,
      approved: quorumMet && yesPercent >= poll.approval_threshold
    };
  }

  // Approval: cada opção com % de membros que aprovaram
  if (poll.type === 'approval') {
    const optionCounts = {};
    votes.forEach(v => {
      optionCounts[v.option_id] = (optionCounts[v.option_id] || 0) + 1;
    });
    // Retorna array de opções que atingiram threshold individual
    return {
      totalVoters,
      totalActiveMembers: activeMembersCount,
      quorumPercent,
      quorumMet,
      approved: quorumMet // aprovação múltipla não tem threshold global único
    };
  }

  // Scale: média e distribuição
  if (poll.type === 'scale') {
    const avg = votes.reduce((sum, v) => sum + v.value, 0) / votes.length;
    return {
      totalVoters,
      totalActiveMembers: activeMembersCount,
      quorumPercent,
      quorumMet,
      approved: quorumMet // scale é avaliativo, não aprovação
    };
  }
}
```

---

### 8. Edge Functions (Supabase)

#### 8.1 `close-poll-and-calculate`
- **Trigger:** cron job diário OU chamada manual por admin.
- **Ação:** busca enquetes onde `closes_at < now()` e `status = 'voting'`, calcula resultado, atualiza status.
- **Pós-ação:** se `approved = true` e `result_action` preenchido, cria registro na tabela `tasks` vinculado ao `poll_id`.

#### 8.2 `notify-poll-milestones`
- **Trigger:** insert/update em `polls`.
- **Ação:** envia notificações (push/email/in-app) para membros da comunidade.
  - Quando publicada: "Nova proposta para discussão: [título]"
  - 24h antes de fechar: "Enquete '[título]' fecha em 24h. Faltam X votos para quorum."
  - Quando fecha: "Resultado da enquete '[título]': [Aprovada/Rejeitada/Quorum não atingido]"

#### 8.3 `validate-vote`
- **Trigger:** before insert em `poll_votes`.
- **Validações:**
  - Usuário é membro ativo da comunidade.
  - Enquete está em `voting`.
  - Data atual entre `voting_starts_at` e `closes_at`.
  - Usuário ainda não votou (exceto `approval`).
  - Se `scale` e valor 1 ou 5: verifica se usuário tem comentário na enquete (se `anonymous=false`).

---

### 9. API / Endpoints (REST/Supabase Client)

#### Listar enquetes da comunidade
```typescript
supabase
  .from('polls')
  .select('*, poll_options(*), poll_results(*)')
  .eq('community_id', communityId)
  .order('created_at', { ascending: false });
```

#### Criar enquete (com opções)
```typescript
// Transaction via RPC ou duas chamadas com foreign key
const { data: poll } = await supabase
  .from('polls')
  .insert({ title, description, type, community_id, quorum_required, approval_threshold })
  .select()
  .single();

await supabase
  .from('poll_options')
  .insert([
    { poll_id: poll.id, label: 'Sim', order: 1 },
    { poll_id: poll.id, label: 'Não', order: 2 },
    { poll_id: poll.id, label: 'Abstenção', order: 3 }
  ]);
```

#### Votar
```typescript
await supabase
  .from('poll_votes')
  .insert({ poll_id, option_id })
  .single();
```

#### Comentar
```typescript
await supabase
  .from('poll_comments')
  .insert({ poll_id, content, parent_id });
```

---

### 10. Regras de Negócio Críticas

1. **Edição em draft/open:** criador pode editar título, descrição e opções enquanto `status IN ('draft', 'open')`. Quando muda para `voting`, trava.
2. **Deleção:** só em `draft`. Enquetes publicadas não são deletadas, apenas arquivadas.
3. **Anonimato:** quando `anonymous_votes = true`, `poll_votes.user_id` é nulo, mas é gerado um `anonymous_hash` (SHA256 de `user_id + poll_id + secret_salt`) para prevenir duplo voto sem expor identidade.
4. **Quorum:** baseado em `community_members` onde `status = 'active'` na data de fechamento.
5. **Urgência:** campo `is_urgent` (boolean) pode ser marcado, mas exige 2 co-assinaturas (`urgency_endorser_1`, `urgency_endorser_2`) para sair de `draft`.
6. **Implementação:** se aprovada, cria `task` com:
   - `title`: "Implementar: [título da enquete]"
   - `assignee_id`: `polls.implementer_id`
   - `due_date`: `now() + polls.implementation_deadline_days`
   - `source_poll_id`: `polls.id`

---

### 11. MVP — Escopo Inicial

**Entrega mínima funcional:**
- [ ] Tabela `polls`, `poll_options`, `poll_votes`, `poll_comments` com RLS.
- [ ] Tipo `binary` (Sim/Não/Abstenção) funcionando end-to-end.
- [ ] Fluxo: criar em draft → publicar para discussão → abrir votação → fechar automaticamente → mostrar resultado.
- [ ] Cálculo de quorum e threshold automático.
- [ ] Listagem de enquetes por comunidade (feed).
- [ ] Tela de detalhe com abas: Proposta / Discussão / Votar / Resultado.
- [ ] Notificação básica: nova enquete publicada.

**Fora do MVP (roadmap):**
- [ ] Tipos `approval` e `scale`.
- [ ] Comentários aninhados (threads).
- [ ] Anonimato avançado com hash.
- [ ] Notificações de "faltam X votos para quorum".
- [ ] Criação automática de tasks no sistema de gestão.
- [ ] Pesos diferenciados de voto.
- [ ] Histórico de enquetes arquivadas com busca.

---

### 12. Dicionário de Dados

| Termo | Significado |
|-------|-------------|
| **Quorum** | % mínima de membros ativos que precisam votar para a enquete ser válida. |
| **Threshold** | % mínima de votos favoráveis (ex: "Sim") sobre votos válidos para aprovação. |
| **Draft** | Rascunho. Só criador e admins veem. |
| **Open** | Aberta para discussão. Comentários liberados, voto bloqueado. |
| **Voting** | Aberta para votação. Comentários podem continuar (configurável). |
| **Closed** | Encerrada. Resultado calculado. |
| **Implemented** | Aprovada e com tarefa de execução criada. |
| **Approval Voting** | Votação onde se pode marcar múltiplas opções. Vencem as que atingem threshold individual. |

---

### 13. Integrações Futuras

- **Sistema de Tarefas (`tasks`):** quando enquete aprovada, cria task automaticamente.
- **Sistema de Notificações (`notifications`):** feed de atividades da comunidade.
- **Calendário Comunitário:** enquetes de decisão aparecem no calendário como "Assembleia Virtual — Votação X".
- **Financeiro:** enquetes com valor estimado exibem impacto no caixa da comunidade.

---

*Documento gerado para alimentar LLM desenvolvedora. Stack: Supabase + React/TS.*
