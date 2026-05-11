# DESIGN_SYSTEM.md

Referência visual: **Intentional Community Hub** — webapp comunitário com estilo flat ilustrado,
cards modulares por feature, paleta verde/creme/rosa, ícones line-art com preenchimento leve.

---

## 1. Paleta de cores

### Backgrounds

| Token                | Hex       | Uso                                        |
| -------------------- | --------- | ------------------------------------------ |
| `--color-bg-primary` | `#4CAF50` | Fundo geral da página                      |
| `--color-bg-surface` | `#F3EFE0` | Fundo dos cards e painéis                  |
| `--color-bg-section` | `#D5E8D4` | Áreas internas de destaque dentro de cards |

### Accents & identidade

| Token                 | Hex       | Uso                                   |
| --------------------- | --------- | ------------------------------------- |
| `--color-accent`      | `#88C9A1` | Ícones, botões primários, badges      |
| `--color-accent-dark` | `#2D5A27` | Fills escuros, ícones de ferramentas  |
| `--color-accent-pink` | `#F8BBD0` | Contraste térmico, ícones de destaque |

### Texto

| Token                    | Hex       | Uso                                    |
| ------------------------ | --------- | -------------------------------------- |
| `--color-text-primary`   | `#1A1A1A` | Títulos e corpo principal              |
| `--color-text-secondary` | `#4D4D4D` | Subtítulos, rodapés, infos secundárias |

### Bordas & detalhes

| Token                 | Hex       | Uso                                       |
| --------------------- | --------- | ----------------------------------------- |
| `--color-border`      | `#6B8E23` | Bordas de cards e linhas divisórias       |
| `--color-border-dark` | `#4A5D23` | Contornos escuros em ilustrações e ícones |

### Status

| Token                    | Hex       | Uso                           |
| ------------------------ | --------- | ----------------------------- |
| `--color-status-success` | `#90EE90` | Voting ativo, ação confirmada |
| `--color-status-alert`   | `#FF80AB` | Voting encerrado, alerta      |

### Escala de verdes

```
--green-100: #D5E8D4   ← fundo sutil
--green-200: #90EE90   ← status / ação
--green-300: #88C9A1   ← identidade visual
--green-500: #4CAF50   ← fundo principal
--green-700: #6B8E23   ← bordas / ênfase
--green-900: #2D5A27   ← contorno escuro
```

---

## 2. Tipografia

- **Família:** `Montserrat`, fallback `Nunito`, fallback `sans-serif`
- **Import Google Fonts:** `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap`

| Token                   | Valor  | Uso                     |
| ----------------------- | ------ | ----------------------- |
| `--font-size-xs`        | `12px` | Labels, rodapés, badges |
| `--font-size-sm`        | `14px` | Corpo secundário        |
| `--font-size-base`      | `16px` | Corpo principal         |
| `--font-size-lg`        | `20px` | Subtítulos de seção     |
| `--font-size-xl`        | `24px` | Títulos de cards        |
| `--font-size-2xl`       | `32px` | Títulos de página       |
| `--font-weight-regular` | `400`  | Texto corrido           |
| `--font-weight-medium`  | `500`  | Destaques e labels      |
| `--font-weight-bold`    | `700`  | Títulos e seção headers |

**Regra:** títulos de seção em `uppercase` + `font-weight: 700`. Corpo em `font-weight: 400`, `line-height: 1.7`.

---

## 3. Espaçamento

Grid base de **8pt**. Nunca usar valores fora desta escala.

| Token         | Valor  |
| ------------- | ------ |
| `--space-xs`  | `4px`  |
| `--space-sm`  | `8px`  |
| `--space-md`  | `16px` |
| `--space-lg`  | `24px` |
| `--space-xl`  | `32px` |
| `--space-2xl` | `48px` |

---

## 4. Border radius

| Token           | Valor    | Uso                      |
| --------------- | -------- | ------------------------ |
| `--radius-sm`   | `6px`    | Tags, badges internas    |
| `--radius-md`   | `12px`   | Botões, inputs           |
| `--radius-lg`   | `20px`   | Cards principais         |
| `--radius-xl`   | `28px`   | Painéis e modais         |
| `--radius-pill` | `9999px` | Botões pill, status tags |

---

## 5. Sombras

```css
--shadow-card: 0 2px 8px rgba(45, 90, 39, 0.1);
--shadow-elevated: 0 4px 16px rgba(45, 90, 39, 0.15);
```

Sombras sempre em tom verde escuro (`#2D5A27`), nunca preto. Opacidade baixa para manter o estilo flat.

---

## 6. Padrões de componentes

### Card de módulo

```
background:    var(--color-bg-surface)      → #F3EFE0
border:        1px solid var(--color-border) → #6B8E23
border-radius: var(--radius-lg)              → 20px
padding:       var(--space-lg)               → 24px
box-shadow:    var(--shadow-card)
```

### Seção interna de card

```
background:    var(--color-bg-section)  → #D5E8D4
border-radius: var(--radius-md)         → 12px
padding:       var(--space-md)          → 16px
```

### Botão primário

```
background:    var(--color-accent)      → #88C9A1
color:         var(--color-accent-dark) → #2D5A27
border-radius: var(--radius-pill)       → 9999px
padding:       8px 20px
font-weight:   var(--font-weight-bold)  → 700
font-size:     var(--font-size-sm)      → 14px
border:        none
```

### Botão secundário / outline

```
background:    transparent
border:        1.5px solid var(--color-accent) → #88C9A1
color:         var(--color-accent-dark)        → #2D5A27
border-radius: var(--radius-pill)
padding:       8px 20px
```

### Badge de status — ativo

```
background:    var(--color-status-success) → #90EE90
color:         var(--color-accent-dark)    → #2D5A27
border-radius: var(--radius-pill)
padding:       4px 12px
font-size:     var(--font-size-xs)         → 12px
font-weight:   var(--font-weight-bold)
```

### Badge de status — encerrado

```
background:    var(--color-status-alert) → #FF80AB
color:         #7A1A3A
border-radius: var(--radius-pill)
padding:       4px 12px
font-size:     var(--font-size-xs)
font-weight:   var(--font-weight-bold)
```

### Input / campo de formulário

```
background:    white
border:        1px solid var(--color-border) → #6B8E23
border-radius: var(--radius-md)              → 12px
padding:       10px var(--space-md)
font-size:     var(--font-size-base)         → 16px
color:         var(--color-text-primary)
```

---

## 7. Layout

- Grid de **3 colunas** em desktop (`repeat(3, 1fr)`), 2 em tablet, 1 em mobile.
- Gap entre cards: `var(--space-lg)` → `24px`
- Padding do container principal: `var(--space-xl)` → `32px`
- Fundo da página: `var(--color-bg-primary)` → `#4CAF50`

---

## 8. Ícones

- Estilo: **line-art** com preenchimento leve
- Cor de linha: `var(--color-accent-dark)` → `#2D5A27`
- Cor de fill: `var(--color-accent)` → `#88C9A1` ou `var(--color-bg-section)` → `#D5E8D4`
- Destaque especial (coração, estrela): `var(--color-accent-pink)` → `#F8BBD0`
- Tamanho padrão: `24px`
- Biblioteca recomendada: **Lucide React** (estilo line-art compatível)

---

## 9. Tokens CSS — arquivo de referência

Ver `src/styles/tokens.css` para todas as variáveis CSS custom properties prontas para uso.

---

## 10. Instruções para o Claude Code

Ao aplicar este design system:

1. **Não altere lógica, rotas ou estrutura de dados** — apenas estilos.
2. Use os tokens via `var(--nome-do-token)` em CSS, ou as classes Tailwind equivalentes se o projeto usar Tailwind.
3. Priorize a ordem: **fundo da página → cards → tipografia → botões → badges**.
4. Importe a fonte Montserrat via Google Fonts no `index.html` ou no CSS global antes de aplicar.
5. Mantenha responsividade — adapte o grid de 3 colunas para 1 coluna em mobile (`max-width: 768px`).
