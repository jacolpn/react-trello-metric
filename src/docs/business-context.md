# Métricas de Fluxo do Trello — Contexto do Projeto

> Este arquivo existe para dar contexto rápido a qualquer IA (ou pessoa) que
> for mexer neste projeto depois. Ele deve ser mantido atualizado conforme o
> projeto evolui — é a fonte de verdade sobre **por que** as coisas foram
> feitas do jeito que foram, não só **o que** foi feito.

## O que é

Dashboard interno para medir a saúde do fluxo de trabalho de times que usam
Trello. Calcula, direto a partir da API pública do Trello (sem backend
próprio): **Lead Time**, **Cycle Time**, **Velocity** e **distribuição de
cards por categoria (etiqueta)**. Cobre 6 quadros da empresa, navegáveis por
abas.

Não existe servidor: é um SPA que roda 100% no navegador do usuário e fala
direto com `api.trello.com` usando a API key/token que o próprio usuário
fornece.

---

## Regras de negócio

### Definições de métrica

| Métrica | Definição | Como é calculada |
|---|---|---|
| **Lead time** | Tempo entre a criação do card e ele chegar numa lista de "concluído" | `dataConclusão - dataCriação` |
| **Cycle time** | Tempo entre o card entrar numa lista de "em andamento" e chegar numa lista de "concluído" | `dataConclusão - dataEntradaEmAndamento` |
| **Cycle time (mediana)** | Cycle time do card "típico" do período — valor central resistente a outliers | Mediana dos `cycleDays` de todos os cards concluídos |
| **Velocity** | Quantidade de cards concluídos por semana (semana ISO) | Contagem de cards com `doneAt` na mesma semana ISO |
| **Categoria** | A etiqueta do card, restrita às etiquetas marcadas como "categoria" na config | Primeira etiqueta do card que esteja no conjunto `categoryLabelIds` |

Data de criação do card: vem da action `createCard` do histórico do Trello.
Se essa action não estiver dentro da janela de tempo buscada (`rangeDays`),
cai no fallback de decodificar o timestamp embutido nos primeiros 8
caracteres hex do `card.id` (isso é um recurso conhecido do formato de
ObjectId do MongoDB, que o Trello usa como ID de card).

Cards sem lista de "concluído" no histórico **não entram** em nenhuma
métrica de tempo (não têm lead/cycle time, não contam pra velocity) —
só aparecem na contagem de "cards por categoria", que é um snapshot de todos
os cards abertos do quadro, independente de status.

### "Em andamento" x "Concluído" — configurável por quadro

Cada quadro tem listas com nomes diferentes, então o usuário escolhe
manualmente (na tela de Configuração):
- **Listas de "em andamento"**: início do cycle time. Normalmente a
  primeira lista onde alguém realmente começa a trabalhar (ex.:
  "In Development"), **não** Backlog/Ready to Dev — essas são fila, não
  execução.
- **Listas de "concluído"**: fim do lead time e do cycle time (ex.: "Done").

Essa seleção é por quadro (ver seção de storage abaixo), não é global.

### Categoria = etiqueta, mas nem toda etiqueta é categoria

Nos quadros da empresa, o campo "Etiquetas" do Trello mistura conceitos
diferentes: categoria de trabalho (BUG, Evolução, Débito técnico,
Documentação...) e etiquetas de time/projeto/contexto (Projeto, FT,
Backoffice, Apoio...). O dashboard deixa o usuário marcar, por quadro, quais
etiquetas contam como "categoria" pro gráfico — as demais são ignoradas ali
(mas continuam existindo no Trello normalmente).

**Modelo de reconciliação (importante, já causou bugs no passado):**
- Etiqueta que o usuário já viu antes e desmarcou manualmente → continua
  desmarcada.
- Etiqueta nova (nunca vista nesse quadro antes) → entra marcada
  automaticamente (opt-out, não opt-in). Isso evita que uma etiqueta criada
  depois da configuração inicial fique "invisível" silenciosamente.
- Etiqueta apagada do Trello → some da seleção sozinha.
- Isso é rastreado via `knownLabelIds` (todas as etiquetas já vistas) +
  `categoryLabelIds` (as que estão marcadas), por quadro.

### Cache de métricas por quadro

Calcular métricas de um quadro grande pode levar alguns segundos (paginação
de histórico de ações). Por isso, todo cálculo bem-sucedido é guardado em
cache local (por quadro), e trocar de aba mostra instantaneamente o último
resultado calculado daquele quadro — com um aviso indicando quando foi
calculado — em vez de forçar um recálculo. O usuário decide quando quer
atualizar (botão "Calcular métricas").

### Control chart de cycle time: mediana + banda de variação (estilo Jira)

Pedido do gestor: *"Seria legal termos a mediana também, pra tirar os cards
que ficam muito fora da média."* A distribuição de cycle time é tipicamente
assimétrica — uns poucos cards que ficam semanas travados **puxam a média
pra cima** e fazem ela deixar de representar o card típico. A mediana não
sofre essa distorção, então é a referência central mais honesta.

A implementação segue o **Control Chart do Jira** e tem uma decisão de
negócio importante: **nenhum card é removido do cálculo**. "Tirar os cards
muito fora" é resolvido *visualmente* (destacando quem está fora), não
excluindo dado. O control chart de cycle time mostra:

- **Linha da mediana** (cheia, cor primária): a referência central, o card
  "típico". É ela que neutraliza a distorção dos outliers sem excluí-los.
- **Linha da média** (tracejada, discreta): mantida só para comparação —
  quanto mais longe da mediana, mais a média está inflada por outliers.
- **Banda de variação normal** (área sombreada): ±1 desvio padrão em torno
  da média. Pontos **fora da banda** são exatamente "os cards que ficaram
  muito fora do padrão".

Na **Visão geral** há dois tiles lado a lado — "Cycle time médio" e
"Cycle time (mediana)" — justamente para dar um bate-olho de quão distante
a média está do típico.

Cálculo em `App.jsx` (helpers `median()` e `stdev()` dentro do `useMemo`
de métricas): expõe `medianCycle`, `cycleBandLow` e `cycleBandHigh`
(`= média ∓ desvio`, com piso em 0). A banda usa desvio padrão em torno da
**média** (não da mediana) porque é assim que o Jira desenha e é o que a
maioria das pessoas espera de "faixa normal".

**Decisão em aberto (alinhar com o gestor):** hoje os outliers são
*destacados*, não *filtrados*. Se em algum momento o pedido virar excluir
outliers do próprio cálculo (ex.: cortar acima do percentil 85 antes de
tirar média/velocity), isso é uma mudança de escopo separada e ainda **não**
foi feita.

### Quadros mapeados

| Aba | URL |
|---|---|
| FT | https://trello.com/b/qfV4h6W4/cloud-ft |
| Banking | https://trello.com/b/on5ayiTU/cloud-banking |
| Backoffice | https://trello.com/b/7VKlVCzP/cloud-backoffice |
| WorkFlow | https://trello.com/b/uyITbnaR/cloud-workflow |
| Duplicatas | https://trello.com/b/1yNiOyCG/cloud-duplicatas |
| Arquitetura | https://trello.com/b/7qmhFAX3/cloud-arquitetura |

Lista definida em `BOARDS` no topo de `src/App.jsx`. Adicionar um novo
quadro **fixo** é só adicionar uma entrada nesse array (`key`, `label`, `url`).

Além dos 6 quadros fixos, há uma aba **"+ Outro"** no topo que abre um diálogo
onde o usuário cola a URL de qualquer quadro do Trello. Quadros assim ficam
salvos localmente (chave `trello-metrics-custom-boards`), aparecem como abas
extras (com botão "x" pra remover) e usam exatamente o mesmo fluxo de
configuração/cálculo/cache dos quadros fixos. A `key` de um quadro custom é
`custom-{boardId}`, então dá pra distinguir de quadro fixo pelo prefixo. Remover
um quadro custom limpa também a config (`trello-metrics-board:{key}`) e o cache
de métricas dele. Colar a URL de um quadro que já existe (fixo ou custom) só
troca pra ele, não duplica.

---

## Stack técnica

- **React 18 + Vite** — SPA puro, sem backend.
- **Yarn** como gerenciador de pacotes (não usar npm — não há
  `package-lock.json` no repo, só `yarn.lock`).
- **MUI (Material UI)** para todos os componentes de interface
  (`@mui/material`, `@mui/icons-material`, `@emotion/react`,
  `@emotion/styled` como peer deps do MUI).
- **styled-components** só para o `GlobalStyles` (paleta de cores global via
  CSS variables, tema claro/escuro).
- **Recharts** para os gráficos (scatter/control chart, bar charts).
- Sem TypeScript — tudo em `.jsx`/`.js` puro.

### Por que MUI + styled-components juntos

O projeto começou com Tailwind, foi trocado a pedido para MUI (para
consistência com o design system usado em outras telas da empresa). A
paleta de cores (`GlobalStyles.jsx`) veio de outro projeto interno via
styled-components — em vez de reescrever tudo, o tema do MUI
(`src/theme.js`) foi construído para **espelhar os mesmos valores de cor**
dessa paleta, então os dois sistemas ficam visualmente idênticos.

**Detalhe técnico importante:** o tema do MUI **não pode** usar
`var(--css-variable)` como valor de cor de paleta (`palette.primary.main`
etc.), porque o MUI precisa *computar* variações de cor (clarear/escurecer
para hover, contraste de texto) em tempo de JavaScript, e `var()` só é
resolvido pelo navegador em tempo de CSS. Por isso `src/theme.js` mantém um
objeto `palettes` com os valores **literais em hex**, sincronizados
manualmente com os valores em `GlobalStyles.jsx`. Se a paleta em
`GlobalStyles.jsx` mudar, `src/theme.js` precisa ser atualizado junto (não
há uma fonte única de verdade entre os dois ainda — ver "Débitos técnicos
conhecidos" abaixo).

Pelo mesmo motivo, os gráficos (Recharts) também usam cores literais
(`chartPalette(mode)` em `App.jsx`), não `var()`, porque SVG não resolve CSS
variables de forma confiável em todos os contextos usados pela lib.

### Estrutura de arquivos

```
src/
├── App.jsx              # componente principal — toda a lógica de negócio e UI vivem aqui
├── main.jsx              # bootstrap do React
├── theme.js               # paleta literal (hex) + factory do tema MUI por modo
└── styles/
    └── GlobalStyles.jsx   # paleta oficial via CSS variables (styled-components), fonte de design
```

`App.jsx` está grande (single-file). Se crescer muito mais, vale considerar
quebrar em: `api/trello.js` (as funções `trelloUrl`, `fetchAllActions`,
`extractBoardId`), `hooks/useBoardMetrics.js` (o `useMemo` de cálculo de
métricas) e `components/` (StatTile, ReportHeader, etc.) — isso ainda não
foi feito.

### Integração com a API do Trello

Não há backend/proxy — o app chama `api.trello.com` direto do navegador,
passando `key` e `token` como query params (ambos fornecidos pelo próprio
usuário na tela de Configuração, nunca hardcoded).

Endpoints usados:
- `GET /1/boards/{id}/lists` — nomes das listas do quadro.
- `GET /1/boards/{id}/labels` — etiquetas do quadro (`id`, `name`, `color`).
- `GET /1/boards/{id}/cards` — cards abertos, com `fields` explícito
  incluindo **`idLabels`** (não `labels`, ver "Débitos técnicos conhecidos").
- `GET /1/boards/{id}/actions?filter=createCard,updateCard:idList` — histórico
  de movimentação entre listas, paginado (ver abaixo).

**Paginação de actions:** a API do Trello devolve no máximo 1000 actions por
chamada, ordenadas da mais recente pra mais antiga. `fetchAllActions` pagina
usando o parâmetro `before` (data da última action da página anterior),
parando quando uma página vem com menos de 1000 itens ou depois de 20
páginas (proteção contra loop infinito/quadros gigantes).

**CORS:** a API do Trello aceita chamadas diretas do navegador. Se algum
ambiente bloquear isso (proxy corporativo etc.), a solução é rodar as
mesmas chamadas atrás de um proxy simples (exemplo de Cloudflare Worker no
`README.md`), trocando a base URL na função `trelloUrl`.

### Persistência (tudo em `localStorage`, nada em servidor)

| Chave | Conteúdo | Escopo |
|---|---|---|
| `trello-metrics-credentials` | `{ apiKey, token }` | Global (todos os quadros) |
| `trello-metrics-board:{boardKey}` | listas selecionadas, etiquetas de categoria, `rangeDays`, cache de `lists`/`allLabels` | Por quadro |
| `trello-metrics-cache` | Último resultado de métricas calculado por quadro (serializado, datas em ISO string) | Por quadro, dentro de um objeto único |
| `trello-metrics-mode` | `"light"` ou `"dark"` | Global |

Nada disso é sincronizado entre máquinas/usuários — é local ao navegador de
quem está usando.

---

## Débitos técnicos conhecidos / decisões não-óbvias

Esta seção documenta bugs já resolvidos e **por que** a solução é a que é —
para não reintroduzir o mesmo problema depois.

1. **Nunca usar o campo `labels` (objeto completo) do endpoint
   `/boards/{id}/cards`** — na prática ele voltava vazio de forma
   inconsistente. A solução robusta é sempre pedir `idLabels` (array de IDs,
   confiável) e resolver o nome/cor via a lista de `/boards/{id}/labels`
   (`labelById`), nunca confiar em labels embutidas na resposta de cards.

2. **`categoryLabelIds` salvo no localStorage pode ficar "órfão"** se o
   usuário trocar de quadro (IDs de etiqueta são únicos por quadro no
   Trello) ou se etiquetas forem criadas/apagadas depois da configuração
   inicial. É por isso que existe `reconcileCategoryIds` — sempre que as
   etiquetas do quadro são buscadas, a seleção salva é reconciliada contra a
   lista real, descartando IDs que não existem mais e adicionando os que são
   novos (ver "Modelo de reconciliação" acima). **Não simplificar isso para
   um `if (categoryLabelIds.size === 0)` ingênuo** — já causou bug de
   "todo card aparece Sem categoria" duas vezes.

3. **Cards "espelhados" (mirror cards do Trello) já foram investigados como
   possível causa de "Sem categoria" e descartados** — na prática o problema
   real era o item 1 e 2 acima. Se esse sintoma voltar a aparecer, checar
   primeiro `idLabels` vazio genuíno (card sem etiqueta mesmo, comum em
   cards criados colando um link na caixa de "Adicionar cartão") antes de
   assumir que é card espelhado.

4. **Cor de paleta no tema MUI precisa ser hex literal, não `var(--...)`**
   — ver seção "Por que MUI + styled-components juntos" acima. Isso já
   quebrou o app inteiro (`Uncaught Error: MUI: Unsupported color`) uma vez.

5. **Textos que dependem do tema (claro/escuro) devem receber a cor
   explicitamente a partir do objeto `palettes` (`src/theme.js`), não
   confiar cegamente em `color="text.secondary"` do MUI** — houve um caso
   em que a cor não acompanhava a troca de tema corretamente num componente
   (`ReportHeader`); a correção foi resolver a cor manualmente via
   `palettes[mode]` em vez de depender só da resolução interna do tema.

6. **Duas fontes de paleta de cor que precisam ficar sincronizadas
   manualmente**: `src/styles/GlobalStyles.jsx` (CSS variables, a paleta
   "oficial" da empresa) e `src/theme.js` (hex literal, usado pelo MUI e
   pelos gráficos). Se a paleta oficial mudar, atualizar os dois arquivos.
   Isso é um risco de inconsistência — uma melhoria futura seria gerar
   `theme.js` a partir de `GlobalStyles.jsx` em vez de manter os dois na mão.

---

## Ideias para o futuro (não implementadas)

- Quebrar `App.jsx` em múltiplos arquivos (ver "Estrutura de arquivos").
- Permitir conectar via um conector/integração OAuth do Trello em vez de
  pedir API key/token manual.
- Cumulative Flow Diagram (outro relatório clássico de fluxo, parecido com
  o Control Chart que já existe para cycle time).
- Opção de **filtrar** outliers do cálculo (não só destacá-los) — ex.: cortar
  acima de um percentil configurável antes de calcular média/velocity. Hoje
  os outliers só são destacados visualmente (ver "Control chart de cycle
  time" nas regras de negócio). Depende de alinhamento com o gestor.
- ~~Adicionar de volta uma forma de conectar em quadros fora da lista fixa de
  6~~ — **feito**: aba "+ Outro" (ver "Quadros mapeados"). Quadros custom
  ficam só no `localStorage` do navegador, não são compartilhados entre
  usuários.
- Gerar `theme.js` automaticamente a partir de `GlobalStyles.jsx` (ver item 6
  dos débitos técnicos).