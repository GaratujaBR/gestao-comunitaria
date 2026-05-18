# Changelog — Sessão de desenvolvimento (maio 2026)

## Reservas

1. **Datas passadas bloqueadas** — inputs `data_inicio` e `data_fim` com `min` na data de hoje; FullCalendar com `validRange={{ start: new Date() }}`.
2. **Gerenciar Espaços restrito ao admin** — seção "Gerenciar Espaços" visível apenas para administradores.
3. **Subtitle "Clique no espaço desejado"** — adicionado abaixo do título "Reservas".
4. **Edit/delete restrito ao criador ou admin** — botões de editar e excluir reservas visíveis apenas para quem criou ou para o admin.

## Eventos

5. **Datas passadas bloqueadas** — inputs `datetime-local` com `min` no momento atual; FullCalendar com `validRange`.

## Wiki

6. **Edição e exclusão restritas ao autor ou admin** — botões de editar/excluir visíveis e funcionais apenas para quem escreveu o artigo ou para o admin. Campo `autor_slug` preenchido automaticamente e desabilitado no form.

## Perfis / Bolinhas

7. **Cotistas podem salvar a própria bolinha** — removida restrição de backend que bloqueava `cota_slug` para não-admins.
8. **Seletor de bolinha exibe grade 0–44** — substituído loop sobre cotas existentes por grade fixa de 45 posições; bolinhas sem cadastro aparecem desabilitadas.
9. **Perfis antes de Bolinhas no menu lateral** — reordenação: Painel → Perfis → Bolinhas → …

## Enquetes

10. **Quorum removido** — componente `QuorumBar` e lógica de quorum removidos da UI.
11. **Threshold de aprovação removido** — componente `ResultBadge` e lógica de aprovação removidos da UI.
12. **Avatar do criador** — payload de criação envia `criador: currentSlug`; avatar individual aparece no card ao lado do título.
13. **Avatares de votantes por bolinha** — substituídos avatares de perfis individuais por círculos verdes numerados com o número de cada bolinha que votou.
14. **Status inicial escolhido na criação** — toggle "Abrir direto para votação" no modal; enquete nasce em `aberta` (Discussão) por padrão ou em `votacao` se marcado. Backend aceita `status` no payload de criação.
15. **Criador pode editar a própria enquete** — novo botão de lápis e dialog de edição (título, descrição, prazo) visível para criador e admin.
16. **Criador pode excluir a própria enquete** — botão de lixeira restrito a criador ou admin (frontend + backend 403).
17. **Transições de status restritas ao criador ou admin** — botões "Iniciar Votação", "Encerrar", etc. ocultos para outros usuários.
18. **Backend: PUT/DELETE protegidos** — endpoints retornam 403 se o usuário não for criador nem admin.
19. **Log ao criar enquete** — backend insere `Log(acao="enquete_criada")` após cada nova enquete.
20. **Alertas ao criar enquete** — backend cria um `Alert` para cada perfil ativo ao publicar uma enquete.
21. **Filtro de logs inclui `enquete_criada`** — adicionado à lista de ações na página Logs.

## Alertas

22. **Alertas filtrados por usuário** — GET `/api/alerts` usa `profile_slug` do usuário logado; cada um vê apenas os próprios alertas.

## Pendente (aguardando deploy)

- Merge `minha-feature` → `main` no GitHub
- Redeploy Render (backend) — manual no dashboard
- Vercel redeploy automático no merge
- SQL migration no Supabase para popular `cota_slug` de perfis com `lote` preenchido:

```sql
UPDATE profiles
SET cota_slug = (SELECT slug FROM cotas WHERE numero::text = profiles.lote)
WHERE cota_slug IS NULL AND lote IS NOT NULL AND lote != '';
```
