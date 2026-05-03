# Sistema de Enquetes — Estado Atual e Plano de Evolução

> Documento de referência para permitir trabalho externo sobre o sistema de enquetes.
> Inclui: arquitetura atual, tipos, endpoints, UI, tokens de design disponíveis,
> e o framework visual de 4 quadrantes a ser integrado.

---

## 1. Arquitetura Atual

### Estrutura de arquivos relevante

```
gestao-frontend/src/
├── api/
│   ├── client.ts          ← REST client (api.get/post/put/del)
│   └── types.ts           ← todos os tipos (inclui Enquete)
├── components/
│   ├── Layout.tsx         ← sidebar + shell
│   └── ui/
│       ├── button.tsx     ← Button (variants: default/outline/destructive/secondary/ghost/link)
│       ├── dialog.tsx     ← Dialog, DialogContent, DialogHeader, DialogTitle
│       ├── input.tsx      ← Input (rounded-[12px], green focus ring)
│       ├── label.tsx      ← Label (text-sm font-medium)
│       ├── select.tsx     ← Radix Select (NÃO usado nas enquetes hoje)
│       └── textarea.tsx   ← Textarea (rounded-md)
├── lib/
│   └── utils.ts           ← utilitários (cn, etc.)
├── pages/
│   └── Enquetes.tsx       ← 1564 linhas, TUDO inline
├── styles/
│   └── tokens.css         ← CSS custom properties
├── index.css              ← Tailwind + Montserrat + shadcn
└── tailwind.config.js     ← design tokens mapeados
```

### Enquetes.tsx — Visão geral (1564 linhas)

**Estado (17 variáveis de useState):**

| Variável           | Tipo              | Descrição                                        |
| ------------------ | ----------------- | ------------------------------------------------ |
| `enquetes`         | `Enquete[]`       | Todas as enquetes da API                         |
| `profiles`         | `Profile[]`       | Membros da comunidade (para dropdown de votação) |
| `loading`          | `boolean`         | Carga inicial                                    |
| `showModal`        | `boolean`         | Diálogo de criação aberto/fechado                |
| `detailEnquete`    | `Enquete \| null` | Enquete selecionada para visualização detalhada  |
| `categoriaFilter`  | `string`          | Filtro por categoria                             |
| `statusFilter`     | `string`          | Filtro por status                                |
| `selectedProfile`  | `string`          | Perfil ("bolinha") que está votando/comentando   |
| `votoError`        | `string`          | Mensagem de erro na votação                      |
| `expandedComments` | `Set<string>`     | Quais cards têm comentários expandidos           |
| `globalError`      | `string`          | Banner de erro no topo da página                 |
| `saving`           | `boolean`         | Loading de criação                               |
| `deletingId`       | `string \| null`  | Loading de exclusão                              |
| `transitioningId`  | `string \| null`  | Loading de transição de status                   |
| `form`             | objeto            | Campos do formulário de criação (ver abaixo)     |

**Formulário de criação (objeto `form`):**

```typescript
{
  titulo: string
  descricao: string
  categoria: "decisao" | "feedback" | "preferencia" | "aprovacao"
  tipo: "binaria" | "multipla" | "escala" | "texto"
  opcoes: string[]          // ["", ""] inicial
  criador: string
  multipla_escolha: boolean
  quorum_required: number   // default 60
  approval_threshold: number // default 66
  closes_at: string
  result_action: string
}
```

**Chamadas à API:**

| Operação            | Método | Endpoint                        | Body                                                                                                                                     |
| ------------------- | ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Carregar enquetes   | GET    | `/api/enquetes`                 | —                                                                                                                                        |
| Carregar perfis     | GET    | `/api/profiles`                 | —                                                                                                                                        |
| Criar enquete       | POST   | `/api/enquetes`                 | `{titulo, descricao, categoria, tipo, opcoes, criador, multipla_escolha, quorum_required, approval_threshold, closes_at, result_action}` |
| Votar               | POST   | `/api/enquetes/:id/votar`       | `{opcao_index, cota_slug, melhoria?}`                                                                                                    |
| Responder (texto)   | POST   | `/api/enquetes/:id/responder`   | `{cota_slug, texto}`                                                                                                                     |
| Transição de status | PUT    | `/api/enquetes/:id`             | `{status}`                                                                                                                               |
| Excluir             | DELETE | `/api/enquetes/:id`             | —                                                                                                                                        |
| Comentários (load)  | GET    | `/api/enquetes/:id/comentarios` | —                                                                                                                                        |
| Comentários (post)  | POST   | `/api/enquetes/:id/comentarios` | `{autor, conteudo}`                                                                                                                      |

**Máquina de status:**

```
rascunho → aberta → votacao → encerrada → implementada
                                       ↘ arquivada
```

**Constantes de UI:**

```typescript
categoriaColors = {
  decisao: "bg-blue-50 text-blue-700",
  feedback: "bg-purple-50 text-purple-700",
  preferencia: "bg-amber-50 text-amber-700",
  aprovacao: "bg-[#D5E8D4] text-[#1F6B3A]"
}

statusColors = {
  rascunho: "bg-[#F8F7F4] text-[#8A8A8A]",
  aberta: "bg-blue-50 text-blue-700",
  votacao: "bg-[#D5E8D4] text-[#1F6B3A]",
  encerrada: "bg-[#F8F7F4] text-[#4D4D4D]",
  implementada: "bg-[#D5E8D4] text-[#1F6B3A]",
  arquivada: "bg-red-50 text-red-700"
}
```

### Tipos de dados (de `api/types.ts`)

```typescript
type EnqueteStatus =
  | "rascunho"
  | "aberta"
  | "votacao"
  | "encerrada"
  | "implementada"
  | "arquivada"
type EnqueteTipo = "binaria" | "multipla" | "escala" | "texto"

interface Enquete {
  id: string
  titulo: string
  descricao: string | null
  categoria: string // "decisao" | "feedback" | "preferencia" | "aprovacao"
  tipo: EnqueteTipo
  opcoes: string[]
  votos: Record<string, number> // opcao_idx -> count
  votantes: Record<string, number[]> // cota_slug -> [voted_option_indices]
  total_votos: number
  criador: string | null
  multipla_escolha: boolean
  status: EnqueteStatus
  quorum_required: number
  approval_threshold: number
  closes_at: string | null
  voting_starts_at: string | null
  result_action: string | null
  respostas: Record<string, string> // cota_slug -> resposta (texto type)
  created_at: string
  // computed by backend:
  quorum_percent: number | null
  quorum_met: boolean | null
  approval_percent: number | null
  approved: boolean | null
}

interface EnqueteComentario {
  id: string
  enquete_id: string
  autor: string
  conteudo: string
  created_at: string
}

interface Profile {
  id: string
  slug: string
  nome_completo: string
  nome_curto: string | null
  cota_slug: string | null
  // ... outros campos
}
```

---

## 2. Tokens de Design Disponíveis

(Fonte: `src/styles/tokens.css` e `tailwind.config.js`)

### CSS Custom Properties (disponíveis como `var(--token)`)

```
--cc-app-bg:           #F8F7F4    (fundo do app)
--cc-primary:          #1F6B3A    (verde primário)
--cc-primary-dark:     #154B28    (hover/pressed)
--cc-border-app:       #E7E5E4    (bordas de cards/inputs)
--cc-nav-active-bg:    #ECF7EE
--color-accent:        #88C9A1    (verde água)
--color-accent-dark:   #2D5A27
--color-accent-pink:   #F8BBD0
--color-text-primary:  #1A1A1A
--color-text-secondary:#4D4D4D
--color-border:        #6B8E23    (verde oliva)
--color-status-success:#90EE90
--color-status-alert:  #FF80AB
--radius-sm:           6px
--radius-md:           12px
--radius-lg:           20px
--radius-xl:           28px
--radius-pill:         9999px
--shadow-card:         0 2px 8px rgba(45, 90, 39, 0.08)
--shadow-elevated:     0 4px 16px rgba(45, 90, 39, 0.15)
--font-size-xs:        12px
--font-size-sm:        14px
--font-size-base:      16px
--font-size-lg:        20px
```

### Classes Tailwind customizadas

```
app-bg              → #F8F7F4
ds-primary          → #1F6B3A
ds-primary-dk       → #154B28
ds-border           → #E7E5E4
ds-nav-active       → #ECF7EE

canaa-bg-primary    → #4CAF50    (verde vibrante promo)
canaa-bg-surface    → #F3EFE0    (creme — cards promo)
canaa-bg-section    → #D5E8D4    (verde pálido)
canaa-accent        → #88C9A1    (verde água)
canaa-accent-dark   → #2D5A27
canaa-accent-pink   → #F8BBD0
canaa-text          → #1A1A1A
canaa-text-muted    → #4D4D4D
canaa-border        → #6B8E23
canaa-border-dark   → #4A5D23
canaa-success       → #90EE90
canaa-alert         → #FF80AB

green-100           → #D5E8D4
green-200           → #90EE90
green-300           → #88C9A1
green-500           → #4CAF50
green-700           → #6B8E23
green-900           → #2D5A27

rounded-card        → border-radius: 20px
rounded-panel       → border-radius: 28px
shadow-card         → green-tinted box-shadow
shadow-elevated     → green-tinted elevated
font-montserrat     → font-family: Montserrat
```

### Primitivos shadcn/ui disponíveis

- **Button** — `variant`: default (green bg), outline (green border), destructive, secondary, ghost, link
- **Dialog / DialogContent / DialogHeader / DialogTitle** — Radix-based modal
- **Input** — `rounded-[12px]`, focus border `#1F6B3A`, focus ring `#1F6B3A`/15
- **Label** — `text-sm font-medium`
- **Select** — Radix Select (NÃO usado nas enquetes hoje — usam `<select>` nativo)
- **Textarea** — `rounded-md`, `min-h-[60px]`
- Ícones via **lucide-react** (já instalado, importar do pacote)

### Convenções de estilo no Enquetes.tsx

- Cores hardcoded em Tailwind (ex: `text-[#1F6B3A]`, `bg-[#D5E8D4]`, `border-[#E7E5E4]`)
- Cards com `rounded-[20px]`, `border border-[#E7E5E4]`, `bg-white`, `shadow-sm`
- Botões pill `rounded-full`
- Grid responsiva: `md:grid-cols-2` para cards

---

## 3. Estrutura Visual do Enquetes.tsx

```
┌─ Header ──────────────────────────────────────────────────┐
│  [Seu perfil: ▼]                    [＋ Nova Enquete]     │
├─ Error Banner (condicional, vermelho, dismissível) ───────┤
├─ Filters ─────────────────────────────────────────────────┤
│  Categoria: [Todos] [Decisão] [Feedback] [Preferência]    │
│  Status:    [Todos] [Rascunho] [Discussão] [Votação] ...  │
├─ Card Grid (md:grid-cols-2) ──────────────────────────────┤
│  ┌─ Card ──────────────────────────┐ ┌─ Card ──────────── │
│  │ [categoria badge] [status badge]│ │                    │
│  │ Título                          │ │                    │
│  │ Descrição (clamped 3 linhas)    │ │                    │
│  │ ────────                        │ │                    │
│  │ Barras de votos (binary/        │ │                    │
│  │   multiple) ou escala           │ │                    │
│  │ Quorum bar                      │ │                    │
│  │ Result badge (se encerrada)     │ │                    │
│  │ ────────                        │ │                    │
│  │ Footer: votos · criador · data  │ │                    │
│  │         💬 · 👁 [Ver Detalhes]  │ │                    │
│  └─────────────────────────────────┘ └──────────────────── │
└────────────────────────────────────────────────────────────┘
```

### Diálogo de Criação (formulário)

```
┌─ Nova Enquete ────────────────────────────────────────────┐
│  Título                    [___________________________]  │
│  Descrição                 [___________________________]  │
│  Categoria ▼ (decisao/feedback/preferencia/aprovacao)     │
│  Tipo ▼ (binaria/multipla/escala/texto)                   │
│  Opções (se multipla)     [Opção 1] [Opção 2] [+Adicionar]│
│  Múltipla escolha         [☐]  (checkbox)                 │
│  Quorum (%)               [───●─────────] input range     │
│  Aprovação (%)            [───●─────────] input range     │
│  Encerra em               [datetime-local]                │
│  Resultado (ação)          [___________________________]  │
│  Criador ▼ (dropdown de profiles)                         │
│  [Cancelar]  [Criar Enquete]                              │
└───────────────────────────────────────────────────────────┘
```

### Diálogo de Detalhes (tabs)

```
┌─ Detalhes ────────────────────────────────────────────────┐
│  Título · [status badge] · [status transições]            │
│                                                           │
│  [Proposta] [Discussão] [Votar/Responder] [Resultado]     │
│                                                           │
│  (conteúdo da tab selecionada)                            │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Sub-Componentes Internos do Enquetes.tsx

Todos estão dentro do mesmo arquivo, exportados localmente:

| Linhas  | Nome                  | Props                                                                                                                   | Descrição                       |
| ------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 108-142 | `QuorumBar`           | `quorumPercent, quorumRequired, totalVotantes`                                                                          | Barra de progresso do quorum    |
| 144-180 | `ResultBadge`         | `approved, approvalPercent, approvalThreshold`                                                                          | Badge Aprovada/Rejeitada        |
| 184-306 | `VotarEscalaPanel`    | `enquete, onVotar, votoError`                                                                                           | Interface de votação escala 1-5 |
| 310-408 | `DiscussaoSection`    | `enqueteId, profiles, replayKey, open`                                                                                  | Seção de comentários (GET/POST) |
| 412-496 | `RespostaAbertaPanel` | `enquete, onResponder, votoError`                                                                                       | Painel de resposta aberta       |
| 500-803 | `DetailDialog`        | `enquete, profiles, selectedProfile, votoError, transitioningId, onVotar, onResponder, onTransition, onClose, onDelete` | Diálogo de detalhes com tabs    |

---

## 5. Framework Visual de 4 Quadrantes (a ser integrado)

Fonte: `enquetes-framework-visual.md`

### Os 4 quadrantes e suas configurações sugeridas

| Quadrante             | Descrição                             | Quorum | Threshold | Tipo            | Discussão  |
| --------------------- | ------------------------------------- | ------ | --------- | --------------- | ---------- |
| **Q1 — Constituição** | Regras fundamentais, difícil reverter | 75-80% | 75-80%    | binary          | 10-14 dias |
| **Q2 — Deliberação**  | Importante mas reversível             | 60-70% | 66%       | binary/approval | 5-10 dias  |
| **Q3 — Operação**     | Dia a dia, fácil reverter             | 30-40% | 50%       | approval/scale  | 1-3 dias   |
| **Q4 — Identidade**   | "Quem somos", baixo impacto           | 50-60% | 60-66%    | approval/binary | 3-7 dias   |

### Mapeamento visual (eixos)

```
     EIXO Y: IMPACTO / PERMANÊNCIA
              ▲ ALTO
              │
    Q2 ┌──────┼──────┐ Q1
    Deliberação  │   Constituição
       │         │         │
       │         │         │
  CONSENSO ◄─────┼─────────► CONSENSO
  BAIXO    │     │     │   ALTO
  NECESSÁRIO     │         NECESSÁRIO
       │         │         │
    Q3 └──────┼──────┘ Q4
    Operação  │   Identidade
              │
              ▼ BAIXO
```

### Emblemas visuais para cada quadrante

| Quadrante | Emoji | Cor Proposta    | Label                    |
| --------- | ----- | --------------- | ------------------------ |
| Q1        | ⚖️    | Vinho escuro    | "Decisão Fundamental"    |
| Q2        | 🏗️    | Laranja terroso | "Deliberação Importante" |
| Q3        | ⚙️    | Verde           | "Operação Cotidiana"     |
| Q4        | 🎭    | Amarelo/Dourado | "Identidade e Cultura"   |

### Funcionalidades a implementar

1. **`DecisionQuadrant`** — Grid 2D interativo no formulário de criação
   - Eixo X: "Pouco consenso necessário" → "Muito consenso necessário"
   - Eixo Y: "Alto impacto/permanência" → "Baixo impacto/permanência"
   - O usuário clica/arrasta um ponto para posicionar a decisão
   - O quadrante ativo é destacado com cor

2. **Painel de Sugestão** — Abaixo do quadrante
   - Mostra `suggestConfig(quadrante)` automático: quorum, threshold, tipo, dias de discussão
   - Botões: "✓ Usar sugestão" / "✎ Personalizar"
   - Se personalizar com divergência >20%: exige `override_reason` com justificativa

3. **`PollBadge`** — Emblema nos cards da listagem
   - Mostra emoji + cor + label do quadrante
   - Substitui ou complementa o badge de categoria

4. **`LegitimacyMeter`** — Termômetro na aba de Resultado
   - Barras de quorum e threshold lado a lado
   - Estados: "Ainda não atingido" / "Quorum ok, falta consenso" / "Decisão legítima"

5. **`DecisionSpectrum` (alternativo)** — Slider único com marcas contextuais
   - Range de "Leve" (rascunho) até "Pesada" (constituição)
   - Oito marcas: Rascunho/Brainstorm → Sondagem → Consulta → Preferência → Rotina → Operação → Deliberação → Identidade → Constituição

### Lógica (novo arquivo `src/lib/decisionFramework.ts`)

```typescript
type QuadranteType = "constituicao" | "deliberacao" | "operacao" | "identidade"

interface DecisionConfig {
  quadrante: QuadranteType
  quorum_required: number
  approval_threshold: number
  tipo: EnqueteTipo
  discussion_days: [number, number] // [min, max]
  regra_especial?: string
}

function suggestConfig(posX: number, posY: number): DecisionConfig
// posX (0-100): 0 = pouco consenso, 100 = muito consenso
// posY (0-100): 0 = baixo impacto, 100 = alto impacto
// Mapeia coordenadas para o quadrante e retorna config

function getQuadrantBadge(quadrante: QuadranteType): {
  emoji: string
  color: string
  label: string
}

function calculateLegitimacy(
  poll: Enquete,
  totalMembers: number
): {
  quorumStatus: "not_met" | "met"
  approvalStatus: "not_met" | "met"
  isLegitima: boolean
  message: string
  quorumPercent: number
  approvalPercent: number
}
```

### Mudanças no schema (backend — NÃO MEXER sem autorização)

Campos a adicionar na tabela `polls` (opcionais no POST/PUT):

- `quadrante`: text — `'constituicao' | 'deliberacao' | 'operacao' | 'identidade'`
- `weight_level`: int 1-10 — peso da decisão no slider
- `override_reason`: text — justificativa quando usuário quebra a sugestão

### Mudanças na interface `Enquete` (frontend)

Campos opcionais a adicionar:

```typescript
interface Enquete {
  // ... campos existentes ...
  quadrante?: QuadranteType
  weight_level?: number
  override_reason?: string
}
```

---

## 6. Plano de Implementação Sugerido

### Fase 1 — Tipos e Lógica (zero impacto visual)

1. Adicionar `QuadranteType` e campos opcionais em `api/types.ts`
2. Criar `src/lib/decisionFramework.ts` com:
   - `suggestConfig(posX, posY)` → `DecisionConfig`
   - `getQuadrantBadge(quadrante)` → `{emoji, color, label}`
   - `calculateLegitimacy(poll, totalMembers)` → status visual

### Fase 2 — Componentes Novos (isolados, testáveis)

3. Criar `src/components/DecisionQuadrant.tsx`
   - Grid 2D com click/drag
   - Props: `onChange(posX, posY, quadrante)`
   - Estilo: `bg-canaa-bg-surface`, `border-canaa-border`, `rounded-card`
4. Criar `src/components/PollBadge.tsx`
   - Props: `quadrante: QuadranteType`
   - Renderiza emoji + label com cor do quadrante
5. Criar `src/components/LegitimacyMeter.tsx`
   - Props: `poll: Enquete, totalMembers: number`
   - Duas barras de progresso + mensagem contextual

### Fase 3 — Integração no Enquetes.tsx

6. No formulário de criação:
   - Adicionar `DecisionQuadrant` ANTES das configs numéricas
   - Mostrar painel de sugestão baseado no posicionamento
   - Permitir override com justificativa
   - Enviar `quadrante`, `weight_level`, `override_reason` no payload (opcionais)
7. Nos cards da listagem:
   - Adicionar `PollBadge` ao lado dos badges de categoria/status
8. No DetailDialog (aba Resultado):
   - Adicionar `LegitimacyMeter`

### Cores sugeridas para cada quadrante (alinhadas ao design system)

| Quadrante       | Cor de fundo            | Cor texto                | Hex               |
| --------------- | ----------------------- | ------------------------ | ----------------- |
| Q1 Constituição | `#F8BBD0` + 20%         | `#4A1A2E`                | Rosa escuro/vinho |
| Q2 Deliberação  | Amber/terra             | `#7C4A00`                | Laranja queimado  |
| Q3 Operação     | `#D5E8D4` (`green-100`) | `#1F6B3A` (`ds-primary`) | Verde existente   |
| Q4 Identidade   | Dourado claro           | `#7C6E00`                | Amarelo terroso   |

---

## 7. Checklist

- [ ] `src/api/types.ts` — adicionar `QuadranteType`, campos opcionais no `Enquete`
- [ ] `src/lib/decisionFramework.ts` — criar com `suggestConfig`, `getQuadrantBadge`, `calculateLegitimacy`
- [ ] `src/components/DecisionQuadrant.tsx` — criar grid interativo
- [ ] `src/components/PollBadge.tsx` — criar emblema de quadrante
- [ ] `src/components/LegitimacyMeter.tsx` — criar termômetro
- [ ] `src/pages/Enquetes.tsx` — integrar quadrant na criação
- [ ] `src/pages/Enquetes.tsx` — adicionar PollBadge nos cards
- [ ] `src/pages/Enquetes.tsx` — adicionar LegitimacyMeter no DetailDialog
- [ ] `npm run build` — verificar TypeScript sem erros
