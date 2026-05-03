# Framework Visual de Governança — Sistema de Enquetes
## App de Gestão Comunitária Intencional Sustentável

---

## 1. A Filosofia por Trás

> **O problema:** pedir para um humano preencher "quorum 60%, threshold 66%" é como pedir para um médico prescrever miligramas sem saber o diagnóstico. O número vem antes da intenção.

A proposta aqui é inverter: **o usuário não configura a enquete. Ele posiciona a decisão.**

A interface pergunta: *"O que vocês estão decidindo?"* — e a partir daí, o sistema sugere (ou impõe) o mecanismo de votação mais adequado. O humano pode aceitar, ajustar ou deliberadamente quebrar a regra — mas sempre com consciência do tradeoff.

---

## 2. Os Dois Eixos Fundamentais

Toda decisão comunitária pode ser mapeada em dois eixos:

```
                    IMPACTO / PERMANÊNCIA
                           ALTO
                             │
            ┌────────────────┼────────────────┐
            │   QUADRANTE 2  │   QUADRANTE 1  │
            │   Deliberação  │   Constituição │
            │   Ampliada     │   (Regras      │
            │                │   Fundamentais)│
  CONSENSO  │                │                │  CONSENSO
  BAIXO     ├────────────────┼────────────────┤  ALTO
  NECESSÁRIO│                │                │  NECESSÁRIO
            │   QUADRANTE 3  │   QUADRANTE 4  │
            │   Operação     │   Identidade   │
            │   Cotidiana    │   (Quem Somos) │
            │                │                │
            └────────────────┼────────────────┘
                             │
                           BAIXO
```

### Eixo X: Consenso Necessário
- **Quanto de acordo a comunidade precisa ter?**
- Não é só "quantos votos Sim". É: *"Se 40% discordam fortemente, essa decisão ainda pode seguir?"*

### Eixo Y: Impacto / Permanência
- **Quanto essa decisão muda a trajetória da comunidade? E por quanto tempo ela dura?**
- Uma regra que muda a cada 3 meses tem impacto diferente de uma que muda a cada 10 anos.

---

## 3. Os 4 Quadrantes — Tipos de Decisão

### Quadrante 1: Constituição (Alto Impacto + Alto Consenso)
**O que é:** regras fundamentais, difíceis de reverter, que definem a existência da comunidade.

**Exemplos:**
- Mudança de nome da comunidade
- Alteração da missão/visão
- Admissão ou exclusão de membros
- Venda de ativos imobiliários
- Mudança na estrutura de propriedade (condomínio, usufruto, etc.)

**Mecanismo sugerido:**
- **Quorum:** 75% a 80% (quase todo mundo precisa se posicionar)
- **Threshold:** 75% a 80% de "Sim" (supermaioria qualificada)
- **Tipo:** `binary` (Sim/Não)
- **Fase de discussão:** 7 a 14 dias (obrigatória)
- **Regra especial:** se rejeitada, não pode ser reproposta em 6 meses

**Por quê:**
> Mudar o nome de uma comunidade intencional não é como trocar o nome de um grupo de WhatsApp. É uma decisão que afeta documentos, contratos, identidade externa, história. Se 49% da comunidade ama o nome atual e 51% quer mudar, forçar a mudança cria uma ferida. Precisa de **supermaioria** para garantir que a mudança é verdadeiramente desejada.

**A filosofia do seu exemplo (mudança de nome):**
- Você perguntou: "quorum mínimo alto + maioria simples, ou o contrário?"
- A resposta: **quorum alto + threshold alto também.**
- Por quê? Se só 30% da comunidade vota e 51% deles quer mudar o nome, você mudou o nome com 15% da comunidade. Isso é legítimo? Não.
- Mas se 80% vota e 75% quer mudar — aí é legítimo. O alto quorum garante participação. O alto threshold garante que a mudança tem apoio massivo, não marginal.

---

### Quadrante 2: Deliberação Ampliada (Alto Impacto + Consenso Moderado)
**O que é:** decisões importantes, mas reversíveis ou ajustáveis no médio prazo.

**Exemplos:**
- Compra de terreno adjacente
- Construção de nova infraestrutura (cisterna, energia solar)
- Mudança no sistema financeiro (taxas, fundos)
- Contratação de funcionários fixos

**Mecanismo sugerido:**
- **Quorum:** 60% a 70%
- **Threshold:** 66% (dois terços)
- **Tipo:** `binary` ou `approval` (se hoje múltiplas opções de fornecedor/terreno)
- **Fase de discussão:** 5 a 10 dias
- **Regra especial:** se aprovada, revisão obrigatória em 12 meses

**Por quê:**
> Comprar um terreno é caro e importante, mas é reversível (você pode vender depois). Não precisa de consenso quase unânime, mas precisa de clareza. O threshold de 66% é o "dois terços" clássico da democracia deliberativa — suficiente para legitimar, mas não tão alto que uma minoria bloqueie tudo.

---

### Quadrante 3: Operação Cotidiana (Baixo Impacto + Consenso Baixo)
**O que é:** decisões do dia a dia, fáceis de reverter, que não definem a comunidade.

**Exemplos:**
- Mudança no rodízio de cozinha
- Escolha de fornecedor de hortaliças
- Data da próxima festa
- Cor da tinta da área comum
- Compra de equipamentos menores (até R$ X)

**Mecanismo sugerido:**
- **Quorum:** 30% a 40% (quem se importa, vota)
- **Threshold:** 50% (maioria simples)
- **Tipo:** `approval` (múltiplas opções) ou `scale` (avaliação)
- **Fase de discussão:** opcional, 1 a 3 dias
- **Regra especial:** se ninguém votar em 48h, a proposta passa automaticamente (consentimento tácito)

**Por quê:**
> Não faz sentido exigir que 80% da comunidade vote na cor da parede. Isso gera fadiga democrática. O princípio do **consentimento tácito** ("quem não se opõe, concorda") funciona bem aqui. Se alguém se importa o suficiente para votar contra, aí a discussão começa.

---

### Quadrante 4: Identidade (Baixo Impacto + Alto Consenso)
**O que é:** decisões que definem "quem somos", mas têm baixo impacto prático ou são facilmente reversíveis.

**Exemplos:**
- Adoção de um símbolo, bandeira, hino
- Escolha do nome de uma nova área comum
- Definição de datas comemorativas internas
- Criação de tradições (ex: "todo domingo é café da manhã coletivo")

**Mecanismo sugerido:**
- **Quorum:** 50% a 60%
- **Threshold:** 60% a 66%
- **Tipo:** `approval` (múltiplas opções criativas) ou `binary`
- **Fase de discussão:** 3 a 7 dias
- **Regra especial:** enquetes criativas podem ter votação em 2 turnos (primeiro turno: todas as opções; segundo turno: as 2 mais votadas)

**Por quê:**
> Identidade não é tão permanente quanto a Constituição, mas importa emocionalmente. Uma bandeira que metade da comunidade odeia não funciona. Mas como é reversível, não precisa de 80%. O segundo turno é ótimo aqui: evita que uma opção com 25% vença porque o resto se dividiu.

---

## 4. A Interface Visual: O Espectro de Decisão

### 4.1 Tela de Criação — O Mapa de Posicionamento

Em vez de campos numéricos, o usuário vê um **quadrante interativo**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   O que vocês estão decidindo?                              │
│   [________________________________________]                │
│                                                             │
│   Como você classifica essa decisão?                        │
│                                                             │
│                    ALTO IMPACTO                             │
│                        ▲                                    │
│                        │                                    │
│     Pouco consenso ◄───┼───► Muito consenso necessário     │
│         (operação)     │     (identidade/constituição)      │
│                        │                                    │
│                        ▼                                    │
│                   BAIXO IMPACTO                             │
│                                                             │
│   [●───────────────────────────○]  Arraste para posicionar  │
│                                                             │
│   ┌──────────────────────────────────────────────┐          │
│   │ 💡 SUGESTÃO DO SISTEMA                       │          │
│   │                                              │          │
│   │ Baseado no seu posicionamento:               │          │
│   │ • Quorum: 75%                                │          │
│   │ • Threshold: 75%                             │          │
│   │ • Tipo: Sim/Não                              │          │
│   │ • Discussão: 10 dias                         │          │
│   │ • Regra especial: não reproponha em 6 meses  │          │
│   │                                              │          │
│   │ [✓ Usar sugestão]  [✎ Personalizar]          │          │
│   └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Como funciona:**
1. O usuário arrasta um ponto no quadrante (ou toca numa região).
2. O sistema mapeia a posição para configurações numéricas.
3. O usuário vê a sugestão e pode aceitar ou ajustar manualmente.

**Mapeamento da posição para configurações:**

| Região do Quadrante | Quorum | Threshold | Tipo | Discussão |
|---------------------|--------|-----------|------|-----------|
| Centro (Q1 — Constituição) | 75-80% | 75-80% | binary | 10-14 dias |
| Topo-esquerda (Q2 — Deliberação) | 60-70% | 66% | binary/approval | 5-10 dias |
| Base-esquerda (Q3 — Operação) | 30-40% | 50% | approval/scale | 1-3 dias |
| Base-direita (Q4 — Identidade) | 50-60% | 60-66% | approval/binary | 3-7 dias |

---

### 4.2 Toggle de Espectro — "Peso da Decisão"

Alternativa (ou complemento) ao quadrante: um **slider único** que representa o "peso" da decisão.

```
Leve ◄──────────────────────────────────────────► Pesada

[●────○────○────○────○────○────○────○────○────○]
 │    │    │    │    │    │    │    │    │    │
 │    │    │    │    │    │    │    │    │    └── Constituição
 │    │    │    │    │    │    │    │    │         (quorum 80%, threshold 80%)
 │    │    │    │    │    │    │    │    └─── Deliberação
 │    │    │    │    │    │    │    │              (quorum 70%, threshold 66%)
 │    │    │    │    │    │    │    └──────── Identidade
 │    │    │    │    │    │    │                   (quorum 60%, threshold 60%)
 │    │    │    │    │    │    └───────────── Operação Importante
 │    │    │    │    │    │                        (quorum 50%, threshold 50%)
 │    │    │    │    │    └────────────────── Operação Comum
 │    │    │    │    │                             (quorum 40%, threshold 50%)
 │    │    │    │    └─────────────────────── Rotina
 │    │    │    │                                  (quorum 30%, threshold 50%)
 │    │    │    └──────────────────────────── Preferência
 │    │    │                                       (quorum 20%, scale)
 │    │    └───────────────────────────────── Consulta
 │    │                                            (quorum 0%, scale)
 │    └────────────────────────────────────── Sondagem
 │                                                 (sem quorum, anônimo)
 └─────────────────────────────────────────── Rascunho/Brainstorm
                                                   (sem votação, só discussão)
```

**Cada marca no slider desbloqueia uma "coroa" visual:**
- 🟢 Leve: enquete rápida, verde, leve
- 🟡 Comum: amarelo
- 🟠 Importante: laranja
- 🔴 Pesada: vermelho, com alerta visual
- ⚫ Constituição: preto/dourado, com confirmação extra

---

### 4.3 Visualização da Enquete em Andamento — "Termômetro de Legitimidade"

Durante a votação, os participantes veem não só a contagem de votos, mas **quão legítima a decisão está ficando**:

```
┌─────────────────────────────────────────────┐
│  🗳️  Mudança de nome da comunidade          │
│                                             │
│  Quorum:    [████████████░░░░░░░░] 62% / 75%│
│  Threshold: [████████░░░░░░░░░░░░] 45% / 75%│
│                                             │
│  ⚠️  AINDA NÃO É UMA DECISÃO LEGÍTIMA       │
│                                             │
│  Faltam 3 dias. Faltam 2 votos pro quorum.  │
│                                             │
│  [Ver proposta]  [Votar]  [Comentar]        │
└─────────────────────────────────────────────┘
```

Quando atinge quorum:
```
  Quorum:    [██████████████████] 80% / 75% ✅
  Threshold: [████████████░░░░░░] 60% / 75% ⏳

  ✅ Quorum atingido! Agora falta o consenso.
```

Quando aprovada:
```
  Quorum:    [██████████████████] 80% / 75% ✅
  Threshold: [██████████████████] 82% / 75% ✅

  ✅ DECISÃO LEGÍTIMA — Aprovada por supermaioria
```

---

## 5. A Matriz de Decisão — Guia Rápido

| Decisão | Quadrante | Quorum | Threshold | Tipo | Discussão |
|---------|-----------|--------|-----------|------|-----------|
| Mudança de nome | Q1 Constituição | 75% | 75% | Sim/Não | 14 dias |
| Venda de terra | Q1 Constituição | 80% | 80% | Sim/Não | 14 dias |
| Admissão de membro | Q1 Constituição | 75% | 75% | Sim/Não | 10 dias |
| Compra de terreno | Q2 Deliberação | 70% | 66% | Sim/Não | 7 dias |
| Construção cisterna | Q2 Deliberação | 60% | 66% | Approval | 7 dias |
| Contratar funcionário | Q2 Deliberação | 60% | 66% | Sim/Não | 5 dias |
| Rodízio de cozinha | Q3 Operação | 40% | 50% | Approval | 2 dias |
| Fornecedor de horta | Q3 Operação | 30% | 50% | Approval | 1 dia |
| Cor da parede | Q3 Operação | 30% | 50% | Approval | 1 dia |
| Festa de fim de ano | Q3 Operação | 30% | 50% | Approval | 1 dia |
| Nome da área comum | Q4 Identidade | 60% | 60% | Approval (2 turnos) | 5 dias |
| Bandeira/símbolo | Q4 Identidade | 60% | 66% | Approval (2 turnos) | 5 dias |
| Tradição interna | Q4 Identidade | 50% | 60% | Approval | 3 dias |

---

## 6. O Paradoxo da Mudança de Nome — Resolvido

Vamos destrinchar seu exemplo filosófico:

> "Para mudança de nome, quorum mínimo alto + maioria simples, ou o contrário?"

### Cenário A: Quorum alto (80%) + Maioria simples (50%)
- 80% da comunidade vota. 50% + 1 diz Sim.
- Resultado: aprovado com ~40% da comunidade total.
- **Problema:** quase metade da comunidade não queria, mas a regra permitiu.
- **Risco:** divisão, ressentimento, gente saindo.

### Cenário B: Quorum baixo (30%) + Threshold alto (80%)
- Só 30% vota. 80% deles diz Sim.
- Resultado: aprovado com 24% da comunidade total.
- **Problema:** a maioria silenciosa nem se posicionou. A decisão foi tomada por uma minoria engajada.
- **Risco:** falta de legitimidade, "não sabia que estava em votação".

### Cenário C: Quorum alto (75%) + Threshold alto (75%) ✅
- 75% vota. 75% deles diz Sim.
- Resultado: aprovado com ~56% da comunidade total.
- **Virtude:** quem não votou, não bloqueou (quorum alto exige participação). Quem votou, votou massivamente a favor (threshold alto exige consenso).
- **Legitimidade:** alta. A mudança tem apoio da maioria absoluta da comunidade.

### A regra de ouro:
> **Decisões fundamentais precisam de alta participação E alto consenso.**
> 
> Quorum alto sem threshold alto = tirania da maioria participante.
> Threshold alto sem quorum alto = tirania da minoria engajada.
> Ambos altos = decisão legítima.

---

## 7. Interface Proposta — Tela de Criação (Wireframe Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⬅️  Nova Enquete                                               │
│                                                                 │
│  Título da proposta                                             │
│  [Mudança de nome da comunidade                         ]       │
│                                                                 │
│  Descreva a proposta e o contexto                               │
│  [Após 3 anos como "Terra Caanã", sentimos que o nome     ]     │
│  [não reflete mais nossa identidade. Propomos "Raízes"    ]     │
│  [como novo nome.                                          ]     │
│                                                                 │
│  ──────── Onde essa decisão se encaixa? ────────               │
│                                                                 │
│              ALTO IMPACTO                                       │
│                  ▲                                              │
│     Pouco      ┌─┼─┐   Muito                                   │
│   consenso ◄───┤ ● ├───► consenso                               │
│    necessário  └─┼─┘   necessário                               │
│                  ▼                                              │
│             BAIXO IMPACTO                                       │
│                                                                 │
│  💡 Você posicionou em: QUADRANTE 1 — CONSTITUIÇÃO              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Configuração sugerida                                  │    │
│  │                                                         │    │
│  │  Quorum:        [████████░░] 75%    [✎]                 │    │
│  │  Aprovação:     [████████░░] 75%    [✎]                 │    │
│  │  Tipo:          Sim / Não           [✎]                 │    │
│  │  Discussão:     10 dias             [✎]                 │    │
│  │  Regra esp.:    Não reproponha em 6 meses  [✎]          │    │
│  │                                                         │    │
│  │  [✓ Usar sugestão do sistema]                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Se aprovada, quem lidera a implementação?                      │
│  [João Silva (você)                              ▼]             │
│                                                                 │
│  Prazo para implementação: [30 dias                    ]        │
│                                                                 │
│  [        Publicar para discussão        ]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Regras de "Override" Consciente

O sistema permite que o usuário quebre a sugestão, mas exige **justificativa**:

```
Você alterou o quorum de 75% para 40%.

⚠️  Isso posiciona uma decisão de CONSTITUIÇÃO no nível de OPERAÇÃO.
    A legitimidade da decisão será significativamente menor.

Tem certeza? Explique por que essa configuração é adequada:
[________________________________________]

[Continuar assim mesmo]  [Voltar à sugestão]
```

Isso cria **consciência de governança**. Não impede liberdade, mas educa.

---

## 9. Visualização no Feed — Ícones por Quadrante

Cada enquete no feed da comunidade tem um **emblema visual** que comunica instantaneamente o peso da decisão:

| Quadrante | Emoji | Cor | Label |
|-----------|-------|-----|-------|
| Q1 Constituição | ⚖️ | 🔴 Vermelho escuro | "Decisão Fundamental" |
| Q2 Deliberação | 🏗️ | 🟠 Laranja | "Deliberação Importante" |
| Q3 Operação | ⚙️ | 🟢 Verde | "Operação Cotidiana" |
| Q4 Identidade | 🎭 | 🟡 Amarelo | "Identidade e Cultura" |

Exemplo no feed:
```
┌─────────────────────────────────────────────┐
│ ⚖️  DECISÃO FUNDAMENTAL                     │
│     Mudança de nome da comunidade           │
│     🗳️ Votando · Quorum 62% / 75% · 3 dias  │
│     [Votar] [Comentar]                      │
├─────────────────────────────────────────────┤
│ 🏗️  DELIBERAÇÃO IMPORTANTE                  │
│     Compra do terreno adjacente             │
│     💬 Em discussão · 5 comentários         │
│     [Ver proposta]                          │
├─────────────────────────────────────────────┤
│ ⚙️  OPERAÇÃO COTIDIANA                      │
│     Novo rodízio de cozinha                 │
│     ✅ Aprovada · Implementada em 2 dias    │
├─────────────────────────────────────────────┤
│ 🎭  IDENTIDADE E CULTURA                    │
│     Nome para a nova área comum             │
│     🗳️ 2º Turno · Vote entre as 2 finalistas│
└─────────────────────────────────────────────┘
```

---

## 10. Síntese — O que muda no código

### No schema:
- Adicionar `quadrante` (text: 'constituicao', 'deliberacao', 'operacao', 'identidade') na tabela `polls`.
- Adicionar `weight_level` (int 1-10) para o slider de espectro.
- Adicionar `override_reason` (text) quando o usuário quebrar a sugestão.

### Na UI:
- Componente `DecisionQuadrant` (canvas interativo ou div posicionável).
- Componente `DecisionSpectrum` (slider com marcas contextuais).
- Componente `LegitimacyMeter` (termômetro de quorum + threshold).
- Componente `PollBadge` (emoji + cor + label por quadrante).

### Na lógica:
- Função `suggestConfig(quadrante)` que retorna {quorum, threshold, type, discussionDays}.
- Função `calculateLegitimacy(poll, votes, activeMembers)` que retorna status visual.
- Validação de `override_reason` obrigatória quando config diverge >20% da sugestão.

---

## 11. Última Reflexão

> **A democracia não é só contar votos. É criar condições para que as pessoas votem com consciência do peso do que estão decidindo.**

O sistema de quadrantes não é uma restrição. É um **espelho**. Quando alguém propõe mudar o nome da comunidade e o sistema mostra "⚖️ Decisão Fundamental — Quorum 75%, Aprovação 75%", isso faz a pessoa parar e pensar: *"Será que estou propondo isso no momento certo? Será que já conversei com todo mundo?"*

E se a pessoa quiser mesmo assim publicar com configuração mais leve, ela pode — mas terá que escrever por quê. Esse ato de escrever já é, por si só, um filtro de qualidade.

**A tecnologia aqui não substitui o julgamento humano. Ele o torna visível.**

---

*Framework para implementação no Sistema de Enquetes do App de Gestão Comunitária.*
