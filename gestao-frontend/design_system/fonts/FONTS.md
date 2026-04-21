# Fonts — Terra de Canaã

**Fonte primária (marca oficial):** Montserrat.
**Fallback:** system-ui → -apple-system → Segoe UI → Roboto → sans-serif.

Os arquivos `.ttf` oficiais estão neste diretório, cobrindo pesos 100 → 900 + itálicos
para todos. O `colors_and_type.css` na raiz já registra todos via `@font-face` com
`font-display: swap` e aponta para `fonts/Montserrat-*.ttf`.

## Pesos em uso

| Peso | Nome           | Uso                                    |
|------|----------------|----------------------------------------|
| 400  | Regular        | Corpo principal, texto longo           |
| 500  | Medium         | Labels, destaques em parágrafo         |
| 600  | SemiBold       | Títulos de card (`h3`)                 |
| 700  | Bold           | Títulos de página / seção (`h1`/`h2`), badges |
| 800  | ExtraBold      | Eyebrows (UPPERCASE tracking alto), branding |
| 900  | Black          | Reservado para marketing / hero        |

Weights leves (100–300) disponíveis mas **não usados** em UI transacional — reservados
para cenários editoriais/marketing, se necessário.

## Nota histórica

A especificação original (`DESIGN_SYSTEM.md` do codebase) indicava **Nunito** via Google
Fonts. A marca decidiu padronizar em **Montserrat** e forneceu os arquivos locais —
toda a documentação, preview e UI kits foram atualizados em conformidade.

Se voltar a Nunito no futuro, basta substituir os `@font-face` em `colors_and_type.css`
pelo `@import` do Google Fonts e atualizar `--cc-font-sans`.
