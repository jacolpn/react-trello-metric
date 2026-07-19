# Métricas de fluxo do Trello

Dashboard em React (Vite + MUI + styled-components + Recharts) que calcula
**Cycle Time**, **Lead Time**, **Velocity** e **cards por categoria (tag/label)**
direto a partir da API do Trello.

## Como rodar

```bash
yarn install
yarn dev
```

Abra o endereço mostrado no terminal (por padrão `http://localhost:5173`).

Para gerar uma build de produção:

```bash
yarn build
yarn preview
```

## Stack

- React 18 + Vite
- MUI (Material UI) para os componentes de interface
- styled-components para o tema global (`src/styles/GlobalStyles.jsx`), com
  paleta de cores clara/escura via CSS variables
- Recharts para os gráficos (control chart de cycle time, velocity, categorias)

O tema MUI (`src/theme.js`) lê as mesmas CSS variables do `GlobalStyles`, então
qualquer ajuste de cor feito ali se reflete tanto nos componentes MUI quanto no
restante da aplicação. O botão de sol/lua no topo alterna entre os modos claro
e escuro definidos na paleta.

## Navegando entre quadros

O app já vem com 6 quadros mapeados na barra de abas, logo abaixo do
cabeçalho: **FT**, **Banking**, **Backoffice**, **WorkFlow**, **Duplicatas**
e **Arquitetura**. Clique numa aba para trocar de quadro — a URL é
preenchida automaticamente.

Cada quadro guarda sua própria configuração (listas de "em andamento"/
"concluído", quais etiquetas contam como categoria, período de análise) e o
último resultado calculado, então trocar de aba mostra instantaneamente os
últimos números daquele quadro (com um aviso indicando quando foi calculado),
sem precisar recarregar tudo de novo. Clique em **Calcular métricas**
sempre que quiser atualizar com os dados mais recentes do Trello.

A **API Key** e o **Token** são compartilhados entre todos os quadros (mesma
conta do Trello) — só precisa configurar uma vez.

Há também uma aba **"Outro quadro"** para conectar rapidamente em qualquer
quadro do Trello além dos 6 já mapeados, colando a URL manualmente.

## Configuração

1. Gere sua **API Key** em https://trello.com/power-ups/admin/api-key
2. Com a key em mãos, gere um **Token** (o app já monta o link certo assim
   que você preenche a key).
3. Escolha um quadro na barra de abas (a URL já vem preenchida).
4. Clique em **Carregar listas** e marque quais listas representam:
   - **Em andamento** → início do cycle time
   - **Concluído** → fim do lead time e do cycle time
5. Marque quais etiquetas representam **categoria** (bug, melhoria, roadmap...),
   desmarcando as que são time/projeto/contexto.
6. Escolha o período de análise e clique em **Calcular métricas**.

Repita os passos 4–6 para cada quadro que quiser acompanhar — a configuração
fica salva por quadro no `localStorage` do seu navegador.

## Definições usadas

- **Lead time**: da criação do card até ele entrar em uma lista de "concluído".
- **Cycle time**: da entrada em uma lista de "em andamento" até a entrada em
  uma lista de "concluído".
- **Velocity**: quantidade de cards concluídos por semana (semana ISO).
- **Categoria**: a primeira etiqueta do card marcada como "categoria" na
  configuração; etiquetas de time/projeto ficam de fora se você as desmarcar.

## Sobre CORS

A API do Trello aceita chamadas diretas do navegador com `key`/`token` na
query string. Se o seu ambiente bloquear essas chamadas (proxy corporativo,
extensão de navegador, etc.), rode as mesmas requisições atrás de um pequeno
proxy. Exemplo com Cloudflare Workers:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = `https://api.trello.com${url.pathname}${url.search}`;
    const res = await fetch(target);
    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(res.body, { status: res.status, headers });
  },
};
```

Aponte o app para o domínio do Worker trocando `https://api.trello.com` por
`https://seu-worker.workers.dev` em `src/App.jsx` (função `trelloUrl`).

## Prints do projeto
<img width="1638" height="898" alt="image" src="https://github.com/user-attachments/assets/79c0b31f-3192-4f94-aaed-d7da36aab145" />
<img width="1654" height="576" alt="image" src="https://github.com/user-attachments/assets/23fd2cfa-1735-4a49-9007-e6340f7f2b88" />


