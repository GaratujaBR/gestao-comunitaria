# Tudoteca — Sistema de Empréstimo para Comunidade Intencional

## 1. Visão

A **Tudoteca** é o sistema de empréstimo e acervo da nossa comunidade intencional. Funciona como uma "biblioteca de tudo": ferramentas, equipamentos, jogos, livros, instrumentos, máquinas e qualquer objeto útil que possa ser compartilhado entre os cotistas.

O objetivo é simples: **saber o que temos, onde está e quem está usando** — eliminando a perda, o esquecimento e a compra desnecessária de itens que já existem na comunidade.

> **Nota sobre escopo (MVP):** Esta versão inicial foca exclusivamente no sistema de empréstimo, catalogação e localização. Funcionalidades como moeda interna, créditos de círculo, gamificação e integração com sistemas externos serão avaliadas e implementadas em fases futuras, conforme a comunidade amadurecer seu uso.

---

## 2. Princípios Operativos

1. **Transparência total:** Todo item catalogado é visível a todos os cotistas.
2. **Autonomia na busca:** Qualquer pessoa deve conseguir encontrar e retirar um item sozinha, sem depender de perguntar a outra pessoa.
3. **Responsabilidade compartilhada:** quem pega, cuida. quem devolve, avisa.
4. **Fallback offline:** etiquetas físicas legíveis garantem que o sistema funcione mesmo sem internet.
5. **Simplicidade:** menos regras, mais confiança. O app é uma ferramenta de apoio, não um controle rígido.

---

## 3. Tipos de Acervo

O sistema reconhece duas formas de custódia. Essa distinção é essencial para definir regras de empréstimo, manutenção e responsabilidade.

### 3.1 Acervo Comum (Coletivo)

| Aspecto | Definição |
|---------|-----------|
| **Proprietário** | A comunidade (coletivo / associação) |
| **Aquisição** | Comprado com fundos comuns, doado explicitamente ao coletivo, ou construído coletivamente |
| **Localização** | Zonas comunitárias definidas (depósitos, oficina, casa comum, barracão) |
| **Empréstimo** | Livre, mediante reserva ou retirada direta no espaço físico |
| **Saída da propriedade** | **Não permitido.** Itens do Acervo Comum não saem da área da comunidade sem decisão coletiva |
| **Manutenção** | Responsabilidade da comunidade (mutirões + fundos comuns) |
| **Perda / Dano** | Avaliado coletivamente. O cotista responsável pode ser convidado a repor o item ou contribuir com trabalho equivalente |

**Exemplos:** ferramentas da oficina, jogos da casa comum, equipamentos de jardinagem, livros da biblioteca, utensílios de cozinha da área comum.

### 3.2 Acervo Solidário (Individual Compartilhado)

| Aspecto | Definição |
|---------|-----------|
| **Proprietário** | Cotista específico (nome visível no sistema) |
| **Aquisição** | Item particular que o cotista escolhe disponibilizar para a comunidade |
| **Localização** | Geralmente na casa/quarto do cotista, ou em zona comum designada por acordo |
| **Empréstimo** | Mediante reserva com antecedência e combinação com o dono |
| **Saída da propriedade** | **Pode sair**, conforme regras definidas pelo próprio dono no cadastro do item |
| **Retirada do acervo** | O dono pode retirar o item a qualquer momento, com aviso de **7 dias** para não prejudicar reservas ativas |
| **Manutenção** | Se desgaste natural: negociável. Se dano por uso indevido: responsabilidade de quem pegou emprestado |
| **Perda / Dano** | Acordo direto entre dono e usuário. A comunidade media, se necessário |

**Exemplos:** violão de um cotista, furadeira particular, câmera fotográfica, equipamento de camping, livros raros, instrumentos de costura.

---

## 4. Zonas Físicas

Como os itens estão dispersos em diferentes casas, depósitos e espaços comuns, o sistema organiza o acervo por **Zonas** — cada uma com localização, tipo de acesso e responsável.

| Zona | Tipo | Acesso | Responsável |
|------|------|--------|-------------|
| **Casa Comum** | Espaço coletivo já ativo | Livre (chave coletiva) | Comunidade |
| **Oficina** | Depósito técnico | Livre durante o dia; fechado à noite | Comunidade |
| **Barracão / Zona Verde** | Área externa | Livre | Comunidade |
| **Casa do [Nome]** | Residência de cotista | Agendado com o dono | Cotista proprietário |

**Regra de etiquetagem:** Todo item do Acervo Comum recebe etiqueta física com **código único + nome da Zona + localização exata** (ex: `OFI-042 | Oficina | Prateleira B3`).

---

## 5. Status dos Itens

Cada item no sistema possui um status em tempo real:

| Status | Significado | Quem pode alterar |
|--------|-------------|-------------------|
| **Disponível** | Item na prateleira, pronto para empréstimo | Sistema (automático ao devolver) |
| **Emprestado** | Item retirado, em posse de um cotista | Usuário que fez o empréstimo |
| **Reservado** | Item bloqueado para uso futuro por um cotista | Qualquer cotista (via app) |
| **Em Manutenção** | Item com defeito, sendo consertado ou avaliado | Qualquer cotista (ao reportar) |
| **Indisponível** | Item fora de circulação por decisão do dono (apenas Acervo Solidário) | Dono do item |

---

## 6. Fluxo de Empréstimo

### 6.1 Acervo Comum — Retirada Direta

```
1. Cotista consulta o app → vê item Disponível na Zona X
2. Vai até a Zona X → localiza pelo código e etiqueta física
3. Retira o item
4. No app, clica em "Pegar Emprestado" → escaneia QR code ou digita código
5. Sistema registra: quem pegou, quando, prazo de devolução
6. Cotista usa o item
7. Devolve na mesma Zona X → marca como "Devolvido" no app
8. Sistema volta status para Disponível
```

### 6.2 Acervo Solidário — Reserva com Agendamento

```
1. Cotista consulta o app → vê item Disponível na Casa do João
2. Faz reserva: escolhe data/hora de retirada e devolução
3. Dono (João) recebe notificação → aprova ou propõe outro horário
4. No dia combinado, cotista vai até a Casa do João
5. Retira o item → ambos confirmam no app (ou apenas o cotista, se previamente acordado)
6. Usa o item dentro do prazo
7. Devolve na Casa do João → marca como "Devolvido"
8. Dono confirma recebimento e estado do item
```

---

## 7. Taxonomia de Classificação

Itens são organizados por **contexto de uso**, facilitando a descoberta:

```
DOMÉSTICO
  ├─ Cozinha
  ├─ Limpeza
  └─ Organização

CONSTRUÇÃO & MANUTENÇÃO
  ├─ Elétrica
  ├─ Hidráulica
  ├─ Carpintaria
  └─ Jardinagem

PRODUÇÃO & OFÍCIO
  ├─ Costura
  ├─ Cerâmica
  ├─ Marcenaria
  ├─ Multimídia
  └─ Eletrônica

LAZER & EVENTOS
  ├─ Camping
  ├─ Esportes
  ├─ Festas / Decoração
  └─ Jogos / Brinquedos

SAÚDE & BEM-ESTAR
  ├─ Fisioterapia
  ├─ Equipamentos médicos leves
  └─ Terapias

INFRAESTRUTURA COMUNITÁRIA
  ├─ Ferramentas pesadas
  ├─ Transporte (carrinhos, bicicletas utilitárias)
  └─ Comunicação / Eventos (projetor, som, telão)
```

---

## 8. Metadados do Item

Cada item cadastrado no sistema deve conter:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `nome` | Sim | Nome legível do item |
| `categoria` | Sim | Taxonomia funcional (ex: "Construção & Manutenção > Carpintaria") |
| `tipo_custodia` | Sim | `comum` ou `solidario` |
| `proprietario` | Sim | "Comunidade" ou nome do cotista |
| `zona` | Sim | Zona física onde está |
| `localizacao_exata` | Sim | "Prateleira B3", "Gaveta 2", "Quarto fundos" |
| `codigo_unico` | Sim | Código alfanumérico para etiqueta física (ex: `OFI-042`) |
| `estado` | Sim | `nova` / `boa` / `regular` / `precisa_reparo` |
| `status` | Sim | `disponivel` / `emprestado` / `reservado` / `manutencao` / `indisponivel` |
| `foto` | Sim | Foto atual do item (mínimo 1) |
| `descricao` | Não | Detalhes, especificações técnicas |
| `prazo_maximo` | Sim | Dias máximos de empréstimo |
| `requer_treinamento` | Não | Sim/Não — para itens perigosos ou complexos |
| `valor_reposicao` | Não | Valor estimado para reposição (referência futura) |
| `observacoes` | Não | Notas do dono ou da comunidade |

---

## 9. Modelo de Dados (Simplificado)

Estrutura relacional para implementação em banco de dados (ex: Supabase / PostgreSQL):

### Tabelas

```sql
-- Zonas físicas do terreno
zonas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,           -- ex: "Casa Comum", "Oficina"
  tipo TEXT NOT NULL,           -- "coletiva" | "residencia"
  localizacao TEXT,             -- descrição física
  responsavel_id UUID REFERENCES cotistas(id)
)

-- Cotistas (membros da comunidade)
cotistas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  telefone TEXT,
  data_entrada DATE,
  ativo BOOLEAN DEFAULT true
)

-- Itens do acervo
itens (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,

  -- Custódia
  tipo_custodia TEXT NOT NULL CHECK (tipo_custodia IN ('comum', 'solidario')),
  proprietario_id UUID REFERENCES cotistas(id),  -- NULL se comum

  -- Localização
  zona_id UUID NOT NULL REFERENCES zonas(id),
  localizacao_exata TEXT NOT NULL,  -- ex: "Prateleira B3"
  codigo_unico TEXT UNIQUE NOT NULL, -- ex: "OFI-042"

  -- Estado e status
  estado TEXT CHECK (estado IN ('nova', 'boa', 'regular', 'precisa_reparo')),
  status TEXT NOT NULL DEFAULT 'disponivel' 
    CHECK (status IN ('disponivel', 'emprestado', 'reservado', 'manutencao', 'indisponivel')),

  -- Regras de empréstimo
  prazo_maximo_dias INTEGER NOT NULL DEFAULT 7,
  requer_treinamento BOOLEAN DEFAULT false,

  -- Referência
  valor_reposicao DECIMAL(10,2),
  foto_url TEXT,
  observacoes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Empréstimos
emprestimos (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES itens(id),
  cotista_id UUID NOT NULL REFERENCES cotistas(id),

  data_retirada TIMESTAMP NOT NULL DEFAULT NOW(),
  data_prevista_devolucao TIMESTAMP NOT NULL,
  data_devolucao TIMESTAMP,

  status TEXT NOT NULL DEFAULT 'ativo' 
    CHECK (status IN ('ativo', 'devolvido', 'atrasado', 'danificado')),

  observacoes_devolucao TEXT,
  danificado BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
)

-- Reservas (especialmente para Acervo Solidário)
reservas (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES itens(id),
  solicitante_id UUID NOT NULL REFERENCES cotistas(id),

  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,

  status TEXT NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'aprovada', 'negada', 'cancelada', 'concluida')),

  resposta_dono TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Histórico de manutenção
manutencoes (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES itens(id),
  reportado_por UUID REFERENCES cotistas(id),

  problema TEXT NOT NULL,
  data_reporte TIMESTAMP DEFAULT NOW(),
  data_resolucao TIMESTAMP,
  resolucao TEXT,
  custo DECIMAL(10,2),

  status TEXT DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'em_andamento', 'resolvido', 'descartado'))
)
```

---

## 10. Roadmap de Implementação

### Fase 1 — Levantamento Bruto (agora)
- Inventário físico: cada cotista lista o que tem em casa/depósito.
- Planilha simples (Google Sheets ou Airtable) com: nome, onde está, de quem é, estado.
- Reunião de consolidação: decidir o que entra no Acervo Comum.

### Fase 2 — Catalogação Digital (Tudoteca v1.0)
- Definir Zonas físicas e responsáveis.
- Etiquetar todos os itens do Acervo Comum com código único + QR code.
- Fotografar itens e cadastrar no app.
- Treinamento dos cotistas no fluxo de empréstimo/devolução.

### Fase 3 — Acervo Solidário
- Cotistas cadastram itens pessoais que desejam compartilhar.
- Definem regras pessoais (prazo, necessidade de treinamento, etc).
- Sistema de reserva com notificação ao dono.

### Fase 4 — Melhorias Futuras (pós-MVP)
> **Avaliar conforme maturidade do uso:**
- Moeda interna / Créditos de Círculo
- Gamificação (reconhecimento por cuidado, devolução no prazo, manutenção)
- Sistema de fila de espera para itens disputados
- Relatórios de uso (quais itens mais emprestados, quais estão parados)
- Empréstimo para não-cotistas (vizinhança, parceiros)
- Integração com lista de compras coletiva ("comprar o que falta no acervo")

---

## 11. Glossário

| Termo | Significado |
|-------|-------------|
| **Tudoteca** | Nome do sistema de acervo e empréstimo da comunidade |
| **Acervo Comum** | Itens de propriedade coletiva, disponíveis para todos |
| **Acervo Solidário** | Itens de propriedade individual, disponibilizados voluntariamente |
| **Zona** | Espaço físico definido (casa, depósito, oficina) onde itens estão localizados |
| **Código Único** | Identificador alfanumérico de cada item (ex: `OFI-042`) usado na etiqueta física |
| **Cotista** | Membro da comunidade com direitos e deveres no sistema |

---

*Documento v0.1 — Abril/2026*
*Comunidade Intencional [Nome da Comunidade]*
