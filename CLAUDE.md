# CLAUDE.md — Vilarejo Ecológico Terra de Canaã

Webapp PWA para organização de uma comunidade intencional ecológica.
Funcionalidades: reservas de espaços comuns, divulgação de eventos,
wiki de bioconstrução/ecologia e gestão de conhecimento comunitário.

---

## Estrutura do monorepo

```
/
├── CLAUDE.md
├── DESIGN_SYSTEM.md          ← design system completo — leia antes de qualquer mudança visual
├── gestao-frontend/          ← app React (aqui fica todo o trabalho de UI)
└── gestao-backend/           ← backend Python (não mexer salvo solicitação explícita)
```

---

## Frontend — gestao-frontend/

### Stack
- **Framework:** React 18 + Vite + **TypeScript**
- **Estilo:** Tailwind CSS + `src/index.css`
- **Componentes UI base:** `src/components/ui/` (button, dialog, input, label, select, textarea)
- **API:** cliente em `src/api/client.ts`, tipos em `src/api/types.ts`
- **Utilitários:** `src/lib/utils.ts`

### Páginas existentes
| Arquivo                        | Módulo                        |
|-------------------------------|-------------------------------|
| `src/pages/Dashboard.tsx`     | Visão geral / hub principal   |
| `src/pages/Bookings.tsx`      | Reservas de espaços           |
| `src/pages/Spaces.tsx`        | Gestão de espaços             |
| `src/pages/Wiki.tsx`          | Wiki comunitária              |
| `src/pages/Alerts.tsx`        | Alertas e avisos              |
| `src/pages/Enquetes.tsx`      | Enquetes / votações           |
| `src/pages/Chamados.tsx`      | Chamados / solicitações       |
| `src/pages/Items.tsx`         | Itens / inventário            |
| `src/pages/Profiles.tsx`      | Perfis de membros             |
| `src/pages/Logs.tsx`          | Logs de atividade             |
| `src/pages/Spreadsheet.tsx`   | Planilha / dados tabulares    |

### Componentes existentes
- `src/components/Layout.tsx` — layout base com navegação
- `src/components/ui/` — componentes primitivos (shadcn/ui ou similar)

### Configuração
- `tailwind.config.js` — extender com tokens do design system
- `src/index.css` — importar `tokens.css` aqui
- `src/App.tsx` — rotas principais
- `src/main.tsx` — entry point

---

## Design

**Leia o `DESIGN_SYSTEM.md` antes de qualquer alteração visual.**

Resumo rápido:
- Paleta: verde `#4CAF50` (fundo), creme `#F3EFE0` (cards), verde água `#88C9A1` (accent)
- Fonte: Nunito (Google Fonts) — adicionar no `index.html` se ainda não estiver
- Estilo: flat ilustrado, cards modulares, ícones line-art via **Lucide React**
- Grid: 3 colunas desktop, 2 tablet, 1 mobile — gap 24px
- Tokens CSS em `src/styles/tokens.css` (criar pasta se não existir)

---

## Convenções de código

- **TypeScript** — tipagem obrigatória, sem `any` salvo casos justificados
- Componentes em PascalCase: `ReservaCard.tsx`, `EventosList.tsx`
- Hooks customizados com prefixo `use`: `useBookings.ts`, `useAuth.ts`
- Lógica de API sempre em hooks ou em `src/api/` — nunca diretamente no componente
- Variáveis de ambiente com prefixo `VITE_`
- Formatação via Prettier (`.prettierrc` já configurado) — respeitar as regras existentes
- Pre-commit hook via Husky (`.husky/pre-commit`) — não desabilitar

---

## Backend — gestao-backend/

- Backend Python com ambiente virtual em `.venv`
- **Não alterar** salvo solicitação explícita
- Comunicação com o frontend via `src/api/client.ts`

---

## Instruções para o Claude Code

1. **Antes de qualquer mudança visual**, leia o `DESIGN_SYSTEM.md` integralmente.
2. **O projeto usa TypeScript** — manter tipagem em todos os arquivos novos ou editados.
3. **Ao estilizar**, use tokens via `var(--nome)` em CSS ou classes Tailwind customizadas — nunca cores hardcoded.
4. **Ao adicionar ícones**, use `lucide-react` — já deve estar disponível; se não, instalar com `npm install lucide-react`.
5. **Ao criar componentes novos**, seguir o padrão de `src/components/ui/` para primitivos e `src/components/` para compostos.
6. **Nunca mexer no backend** (`gestao-backend/`) salvo instrução explícita.
7. **Manter responsividade** em toda alteração — mobile first.
8. **Rodar `npm run build`** após mudanças significativas para verificar erros de TypeScript antes de considerar a tarefa concluída.
