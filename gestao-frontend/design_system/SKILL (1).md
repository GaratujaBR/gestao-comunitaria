# SKILL — Terra de Canaã Design System

## Quando usar
Invoque este design system sempre que for **desenhar, mockar ou iterar sobre qualquer
tela, peça ou página** do webapp **Terra de Canaã** (vilarejo ecológico / gestão de
comunidade intencional). Também usar para material de marketing, onboarding e slides
da comunidade.

## Contrato

1. Linke `colors_and_type.css` da raiz em qualquer HTML novo:
   ```html
   <link rel="stylesheet" href="<caminho-relativo>/colors_and_type.css">
   ```
   Isso traz **Montserrat** (arquivos locais em `fonts/`) + todos os tokens `--cc-*`
   (cores, espaçamentos, radii, sombras).

2. Use as **paletas certas para o contexto certo**:
   - **App transacional** (Painel, Perfis, Reservas, etc.): fundo `#F8F7F4`
     (`--cc-app-bg`), cards brancos, borda `#E7E5E4`, primário `#1F6B3A`. Sombras
     tingidas de verde (`--cc-shadow-card`), **nunca pretas**.
   - **Promo / marketing / onboarding:** fundo verde chapado `#4CAF50` ou cards
     creme `#F3EFE0` com borda oliva `#6B8E23`. Eyebrow em verde água `#88C9A1`.
   - **Rosa pastel `#F8BBD0`** é reservado para toques humanos (Time Bank, arquivados).

3. **Tipografia:**
   - Títulos de página: 28–32 px, weight 700.
   - Títulos de card: 20 px, weight 600–700.
   - Eyebrows: 10–12 px, weight 800, tracking 0.08–0.2em, UPPERCASE.
   - Corpo: 16 px / line-height 1.6.
   - Labels / meta: 12–14 px.

4. **Ícones:** line-art 1.5–2 px stroke, `currentColor`. Vocabulário `lucide-react`
   no código real; em mocks HTML, SVGs inline seguindo o mesmo estilo.
   **Zero emoji.**

5. **Conteúdo:**
   - 100% português do Brasil, sem anglicismos (`reservas`, não `booking`).
   - Status em snake_case minúsculo (`ativo`, `em_andamento`, `manutencao`) — é a
     linguagem do backend, não traduzir nem title-case.
   - Tom acolhedor, imperativo curto em botões (`Salvar`, `Criar Enquete`).
   - Rodapé da marca: *"Crescendo juntos"* em itálico.

6. **Componentes:** use os previews em `preview/` como referência viva. Botão pill
   arredondado (`border-radius: 9999px`), card `radius: 16–20px`, modal `28px`.
   Borda `1px solid`, nunca `2px+` exceto em cards promo com oliva.

7. **Anti-padrões a evitar:**
   - Left-border accent em cards genéricos (só em NavLink ativo).
   - Gradientes em superfícies (única exceção: header do sidebar).
   - Sombras pretas — sempre tingidas de verde-floresta em baixa opacidade.
   - Emoji decorativo. Jargão técnico (`Erro 401`) em mensagens de usuário.
   - Humor forçado ("oops!") em empty states.

## Assets
- Tokens e tipografia: `colors_and_type.css`
- Fontes: `fonts/Montserrat-*.ttf` (+ `fonts/FONTS.md`)
- Logo placeholder: `assets/logo-leaf.svg`
- Foto-marca: `assets/cafuringa.jpg` (referência de mood)
- UI kit vivo: `ui_kits/community-hub/Dashboard.html`
- Preview cards: `preview/*.html` (20 cards cobrindo cores, type, spacing,
  componentes, marca)

## Caveats
- **Não há logotipo finalizado** — o ícone folha em `assets/logo-leaf.svg` é
  placeholder. Peça um logo oficial ao usuário se o artefato final exigir.
- **Ilustrações estilo Community Hub** (pastéis, personagens) existem só como
  referência em `gestao-frontend/imgs/ref-template.png` do codebase original;
  não há SVGs no design system. Use placeholders até receber assets nativos.
- Paleta promo (verde chapado) e paleta do app (stone-50) **convivem** — use a
  que combina com o contexto, não tente unificar sem avisar.
