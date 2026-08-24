# Finly Workspace Visual Alignment Design

## Objetivo

Alinhar visualmente as abas internas `Lançamentos`, `Metas` e `Insights` com a identidade premium estabelecida pela nova Home do Finly. A aplicação deve parecer um único produto, preservando integralmente o comportamento financeiro, a navegação, os callbacks e a arquitetura híbrida local/API.

O resultado deve continuar sendo uma aplicação financeira de uso recorrente, não uma extensão da landing. A linguagem cinematográfica será traduzida para um workspace mais sóbrio, legível e eficiente.

## Escopo

Esta etapa inclui toda a área visível das três abas:

1. Cabeçalhos, resumos e métricas.
2. Formulários, filtros, listas e estados vazios.
3. Cards de metas, insights, previsão e regras financeiras.
4. Responsividade e temas light/dark.
5. Microinterações e entradas leves com CSS.

Ficam explicitamente fora desta etapa:

- painel de Conta;
- drawers e speed dial;
- modais de calendário, extrato, edição e progresso;
- componentes da Home/landing;
- hooks, `FinanceSourceProvider`, API, autenticação e origem de dados;
- Occurrences, calendário financeiro, regras e cálculos financeiros;
- `apps/api`, `apps/mobile`, Docker e infraestrutura.

As sobreposições serão refinadas em uma etapa posterior, conforme decisão do usuário.

## Princípios

### Um produto, dois ritmos

A Home apresenta o produto com maior impacto visual. As abas internas reutilizam as mesmas cores, tipografia, gradientes e profundidade, porém com menor intensidade e maior densidade funcional.

### Hierarquia antes de decoração

Gradientes, transparências e sombras só serão usados para separar níveis de informação. Nenhum elemento decorativo novo poderá competir com formulários, valores, ações ou feedback de estado.

### Comportamento intocável

Todos os props, callbacks, eventos, estados locais e condicionais de acesso existentes serão preservados. Não haverá duplicação de componentes para modo local e modo API.

### Mudança isolada

Os componentes-base globais `Card` e `Button` não serão redesenhados nesta etapa. Alterá-los propagaria o novo visual para Conta e sobreposições que estão fora do escopo. O alinhamento será aplicado por composição e classes específicas do workspace.

## Arquitetura Visual Compartilhada

Será criada uma camada pequena e reutilizável para as três abas, composta por:

- um wrapper visual de workspace aplicado ao `PageContainer` padrão;
- um cabeçalho editorial compartilhado com eyebrow, ícone, título e texto curto;
- um componente de métrica compacto para valores reais já disponíveis;
- classes compartilhadas para superfícies principais, superfícies internas e ações rápidas.

A camada deve permanecer apresentacional. Ela receberá conteúdo via props ou `ReactNode` e não conhecerá transações, metas, insights, autenticação ou fonte de dados.

O fundo do workspace usará gradientes radiais Finly discretos e profundidade semelhante à Home, sem perspectiva 3D. O conteúdo continuará limitado à largura de leitura atual. Light e dark terão valores próprios de fundo, borda e sombra para preservar contraste.

## Linguagem Visual

### Fundo

- Light: canvas azul muito claro com áreas brancas translúcidas e brilho azul suave.
- Dark: azul profundo Finly, com superfícies azul-marinho translúcidas e bordas claras de baixa opacidade.
- A textura será construída apenas com CSS e ficará atrás das áreas interativas.

### Tipografia

- Títulos de aba maiores e mais editoriais, sem atingir a escala da Home.
- Textos de apoio curtos, com largura controlada.
- Valores financeiros com números tabulares e contraste elevado.
- Labels pequenos com tracking moderado, usados como eyebrow e contexto.

### Superfícies

- Bordas menos evidentes que as atuais.
- Sombras amplas e suaves, sem elevação excessiva.
- Raio consistente entre `1.5rem` e `2rem` nas superfícies principais.
- Agrupamentos internos diferenciados principalmente por fundo e espaçamento, não por múltiplas bordas empilhadas.

### Movimento

- Entrada curta de cabeçalho e conteúdo ao trocar de aba.
- Hover e foco em ações rápidas e cards interativos.
- Somente `opacity` e `transform`.
- Nenhuma nova timeline GSAP e nenhuma biblioteca adicional.
- `prefers-reduced-motion: reduce` removerá as entradas e transformações.

## Aba Lançamentos

O cabeçalho usará a mensagem de contexto “Seu fluxo financeiro”, mantendo `Lançamentos` como título principal e uma descrição curta sobre registro e acompanhamento.

O `FinanceSummaryCard` será a superfície de maior destaque da coluna lateral. O saldo atual ganhará contraste semelhante ao bloco azul do mockup da Home, enquanto entradas, saídas, projeção, simulação, edição do saldo e ocultação de valores manterão exatamente o comportamento atual.

Calendário e Extrato serão apresentados como ações rápidas compactas e relacionadas, preservando seus callbacks. O link de suporte continuará disponível, porém visualmente secundário.

O `TransactionForm` continuará sendo a principal área de trabalho. Seus grupos terão menos bordas concorrentes, mais respiro e foco visual mais claro. Nenhum campo, validação, tipo de lançamento ou ação será removido.

O controle de expansão da lista será tratado como uma faixa editorial. Quando aberta, filtros avançados, abas, ordenação, edição e remoção continuarão iguais. A lista receberá superfícies mais leves e estados de hover mais consistentes.

## Aba Metas

O cabeçalho combinará o título `Metas` com as três métricas reais existentes:

- metas ativas;
- valor acumulado;
- valor restante.

As métricas serão integradas ao topo em vez de parecerem cards independentes genéricos. Não serão criados números fictícios ou novos cálculos.

Em telas grandes, o formulário continuará à esquerda e a lista à direita. O `GoalForm` terá agrupamentos mais leves e uma CTA de maior clareza. O `GoalList` destacará nome, valor e progresso com barras mais expressivas, preservando atualização, exclusão, estados vazios e ações desabilitadas.

## Aba Insights

O cabeçalho apresentará `Insights` como leitura do momento financeiro. A composição dará maior destaque ao `FinancialForecastCard`, sem alterar seus valores ou tons derivados do saldo projetado.

O `DashboardInsights` deixará de parecer uma grade genérica. As leituras serão organizadas como um feed analítico, com hierarquia entre título, descrição e tom (`positivo`, `atenção` ou `neutro`). Os labels e textos atuais continuarão funcionais e testáveis.

O bloco “Mais contexto, no seu tempo” permanecerá discreto e não ganhará funcionalidades fictícias.

Quando disponível para conta autenticada, o `FinancialRulesManager` continuará abaixo dos insights. Formulário, processamento, edição, exclusão, mensagens e resultados serão preservados; apenas superfícies, hierarquia e espaçamento serão alinhados ao workspace.

## Responsividade

### Desktop

- Manter as grades funcionais existentes.
- Usar sticky apenas onde já ajuda o fluxo e não cobre conteúdo.
- Limitar largura de textos e preservar espaço entre superfícies.

### Tablet

- Reduzir separações laterais e empilhar áreas quando a leitura exigir.
- Métricas devem permanecer em grade fluida sem overflow.

### Mobile

- Uma coluna para todos os fluxos.
- Cabeçalhos e métricas compactados sem ocultar dados essenciais.
- Botões e campos com áreas adequadas para toque.
- Sem blur intenso, perspectiva ou deslocamentos decorativos.
- Nenhum scroll horizontal.

## Acessibilidade

- Preservar a hierarquia correta de headings em cada aba.
- Manter labels associados aos campos e nomes acessíveis das ações.
- Garantir foco visível em botões, links, filtros e controles colapsáveis.
- Não comunicar estados apenas por cor.
- Elementos atmosféricos serão decorativos e não entrarão na árvore de acessibilidade.
- Light e dark devem manter contraste suficiente para textos e valores.

## Estratégia De Implementação

1. Criar a camada visual compartilhada e seu teste estrutural.
2. Aplicar o wrapper de atmosfera apenas ao `PageContainer` padrão.
3. Migrar primeiro as três views, preservando suas interfaces públicas.
4. Refinar os componentes diretamente renderizados em cada aba.
5. Atualizar somente testes afetados por markup ou textos.
6. Validar cada aba antes de avançar para inspeção visual conjunta.

Não serão feitos refactors de lógica durante o refinamento visual. Se um componente revelar dívida fora do escopo, ela será registrada e mantida sem alteração.

## Arquivos Prováveis

Camada compartilhada:

- `apps/web/src/components/dashboard/workspace/` para componentes apresentacionais.
- `apps/web/src/components/layout/page-container.tsx` para a atmosfera do workspace.
- `apps/web/src/app/globals.css` para tokens e fundo compartilhado.

Views:

- `dashboard-transactions-view.tsx`.
- `dashboard-goals-view.tsx`.
- `dashboard-insights-view.tsx`.

Componentes diretamente afetados:

- `finance-summary-card.tsx`.
- `transaction-form.tsx`, `transaction-list.tsx` e filtros.
- `goal-form.tsx` e `goal-list.tsx`.
- `dashboard-insights.tsx`.
- `financial-forecast-card.tsx`.
- `financial-rules-manager.tsx`.

Somente os componentes necessários para aplicar essa linguagem serão editados; componentes já alinhados serão mantidos sem alterações cosméticas redundantes.

## Testes E Verificação

A entrega será considerada pronta quando:

- testes das três views e componentes alterados passarem;
- novos componentes compartilhados tiverem cobertura estrutural;
- `npx tsc --noEmit` terminar sem erros;
- lint focal dos arquivos alterados terminar sem erros;
- build de produção terminar sem erros;
- Lançamentos, Metas e Insights forem inspecionados em desktop e mobile;
- light e dark mantiverem contraste e a mesma identidade;
- formulários, filtros, expansão de lista, ações de metas e regras continuarem respondendo;
- não houver overflow horizontal, erros de console ou regressões de navegação.

O lint global poderá continuar exibindo apenas o débito preexistente já observado fora deste escopo. Nenhum erro novo nos arquivos alterados será aceito.

## Riscos E Mitigações

### Propagação involuntária para sobreposições

Mitigação: não alterar variantes globais de `Card` e `Button`; usar classes e componentes específicos do workspace.

### Perda de legibilidade no dark mode

Mitigação: validar valores financeiros, labels, inputs e estados desabilitados separadamente no tema escuro.

### Excesso de decoração em telas funcionais

Mitigação: limitar gradientes às superfícies principais e priorizar espaço, tipografia e contraste nos componentes densos.

### Regressão de comportamento por mudança de markup

Mitigação: preservar props e handlers, escrever testes antes das mudanças estruturais e executar os testes relacionados após cada aba.
