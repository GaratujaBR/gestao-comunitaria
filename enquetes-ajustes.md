# Correções — Sistema de Enquetes

## 🔴 Crítico

### 1. Adicionar confirmação antes de deletar enquete

- **Arquivo:** `gestao-frontend/src/pages/Enquetes.tsx`
- **Linha:** ~849 (botão delete do card)
- **Tarefa:** Envolver `deletar(e.id)` em um `window.confirm("Deseja realmente excluir esta enquete?")` ou usar um Dialog de confirmação.

### 2. Isolar `votoError` por contexto

- **Arquivo:** `gestao-frontend/src/pages/Enquetes.tsx`
- **Linhas:** ~634 (estado global), ~982 (passado ao DetailDialog)
- **Tarefa:** Mover `votoError` para dentro de `DetailDialog` como estado local, resetando ao abrir com `detailEnquete`. Alternativa: limpar `setVotoError("")` ao abrir o dialog (na callback `onClose` ou ao setar `detailEnquete`).

---

## 🟠 Médio

### 3. Aguardar promise antes de limpar texto de resposta

- **Arquivo:** `gestao-frontend/src/pages/Enquetes.tsx`
- **Linha:** ~360 (`RespostaAbertaPanel`)
- **Tarefa:** Criar handler async que chama `onResponder`, aguarda sucesso, e só então limpa o texto. Ex:
  ```ts
  const submit = async () => {
    try { await onResponder(enquete.id, texto); setTexto(""); } catch {}
  };
  Mudar onResponder para retornar a promise em vez de void.
  ```

4. Prevenir submissão múltipla (loading states)

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Tarefa: Adicionar estados saving / transitioning / deleting e desabilitar botões correspondentes durante operações assíncronas:
  - Botão "Criar Enquete" (linha ~1142)
  - Botões "Votar" nos cards (linha ~907) e dialog (linha ~537)
  - Botão "Enviar resposta" (linha ~359)
  - Botões "Comentar" (linha ~299)
  - Botões de transição de status (linha ~605)
  - Botão delete (linha ~849)

5. Feedback visual em falhas

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linhas: ~746, 750, 660, 707 (catches silenciosos)
- Tarefa: Adicionar toast ou estado de erro visível nos catch de delete, transition, createEnquete e load.

6. Adicionar "Arquivada" ao filtro de status

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linha: ~816
- Tarefa: Incluir "arquivada" no array de status do filtro: ["rascunho", "aberta", "votacao", "encerrada", "implementada", "arquivada"]

7. Validar título não-vazio (trim)

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linha: ~1144 (disabled condition)
- Tarefa: Trocar !form.titulo por !form.titulo.trim() na condição de disable do botão "Criar".

---

🟡 Menor 8. Desabilitar botão de voto se bolinha já votou

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linhas: ~907 (card), ~537 (dialog)
- Tarefa: Adicionar verificação enquete.votantes com cotaSlug do profile selecionado ao disabled do botão.

9. Tipar canRespond corretamente

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linha: ~65
- Tarefa: Trocar { tipo: string; status: string } por Pick<Enquete, "tipo" | "status">.

10. Adicionar AbortController ao fetch de comentários

- Arquivo: gestao-frontend/src/pages/Enquetes.tsx
- Linha: ~240-244 (DiscussaoSection)
- Tarefa: Criar AbortController no useEffect, abortar no cleanup, e ignorar erro AbortError no catch.

---

Resumo rápido de execução

# Severidade Esforço Impacto

1 Crítico Baixo Evita perda de dados
2 Crítico Baixo Corrige UX de erro
3 Médio Baixo Corrige perda de input
4 Médio Médio Evita requisições duplicadas
5 Médio Médio Feedback ao usuário
6 Médio Baixo Filtro completo
7 Médio Baixo Validação correta
8 Menor Baixo Evita requisições 409
9 Menor Baixo Tipagem correta
10 Menor Baixo Evita warning React

---
