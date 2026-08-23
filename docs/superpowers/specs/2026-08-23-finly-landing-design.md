# Finly Landing Page Design

## Objetivo

Criar uma primeira versão pública, apresentável e visualmente premium da landing page do Finly em uma nova aplicação `apps/landing`. A aplicação deve permanecer isolada de `apps/web`, preservar o funcionamento atual do monorepo e estar pronta para ser conectada futuramente a um segundo projeto da Vercel no domínio `landing.finly.systems`.

## Escopo

A entrega será uma página única, estática e responsiva com quatro áreas:

1. Hero com proposta de valor e dois CTAs.
2. Showcase do produto com dashboard financeiro fictício construído em HTML e CSS.
3. Diferencial sobre uso sem conta e sincronização opcional.
4. CTA final direcionando para a aplicação existente.

Não fazem parte desta etapa: alterações em `apps/web`, `apps/api`, `apps/mobile`, Docker, infraestrutura, VPS, Traefik, banco de dados, autenticação, regras financeiras ou configuração de deploy na Vercel.

## Arquitetura

`apps/landing` será uma aplicação Next.js independente com App Router, React, TypeScript e Tailwind CSS, usando versões compatíveis com `apps/web`. Ela terá seus próprios arquivos de configuração, manifesto de dependências e lockfile, sem importar código, estado ou lógica da aplicação interna.

A página será renderizada majoritariamente como Server Component. O scroll suave do CTA secundário será feito por âncora e CSS, eliminando JavaScript de cliente desnecessário. Lucide React será usado apenas para ícones pequenos e sem importações agregadas.

Estrutura prevista:

- `apps/landing/src/app/layout.tsx`: metadados, fontes e estrutura HTML global.
- `apps/landing/src/app/page.tsx`: composição das quatro áreas da página.
- `apps/landing/src/app/globals.css`: tokens visuais, Tailwind, fundos, animações e responsividade específica.
- `apps/landing/src/components/landing-header.tsx`: navegação compacta e ações principais.
- `apps/landing/src/components/product-dashboard.tsx`: mockup visual do produto.
- `apps/landing/src/components/product-showcase.tsx`: narrativa e composição do showcase.
- `apps/landing/src/components/sync-feature.tsx`: diferencial local-first e sincronização opcional.
- `apps/landing/src/components/final-cta.tsx`: encerramento e chamada para ação.
- `apps/landing/src/components/finly-mark.tsx`: marca tipográfica simples reutilizada no cabeçalho e rodapé.

## Direção Visual

A direção combina precisão de produto financeiro com uma apresentação editorial e cinematográfica. O layout terá muito espaço negativo, tipografia de alto contraste, grandes áreas claras e uma composição assimétrica controlada para evitar aparência de template genérico.

A identidade parte dos tokens atuais de `apps/web/src/app/globals.css`:

- Azul principal: `#1a75ff`.
- Azul profundo: `#031533`.
- Azul secundário: `#7eb0f2`.
- Fundo claro: `#f4f7fb`.
- Bordas: `#d0dff2`.
- Texto secundário: `#4f698d`.

Essas cores serão expandidas somente com transparências, branco e tons derivados para gradientes, brilhos e sombras. O fundo usará gradientes radiais discretos e uma textura CSS leve; não haverá imagens externas, SVGs autorais, vídeo ou canvas.

A tipografia usará uma família sans expressiva fornecida por `next/font`, com pesos cuidadosamente limitados. Números do dashboard usarão alinhamento tabular para reforçar clareza financeira.

## Conteúdo e Interações

### Hero

O hero exibirá exatamente:

- Headline: “Seu dinheiro. Finalmente claro.”
- Texto de apoio: “Organize, planeje e entenda suas finanças em um único lugar.”
- CTA principal: “Começar agora”, apontando para `https://app.finly.systems`.
- CTA secundário: “Conhecer o Finly”, apontando para `#produto`.

O primeiro viewport combinará a mensagem com o mockup do dashboard em perspectiva suave. Em telas menores, conteúdo e mockup serão empilhados sem perder a hierarquia do CTA principal.

### Showcase do produto

A seção terá o identificador `produto` e apresentará o Finly como uma visão única das finanças. O dashboard fictício mostrará saldo atual, entradas, saídas, saldo projetado, meta financeira e pequenos indicadores. Os números serão claramente demonstrativos e não executarão cálculos ou regras financeiras reais.

O mockup será semântico e inteiramente construído com elementos HTML, CSS e ícones Lucide. Barras, linha de tendência, progresso e profundidade serão formas CSS, sem bibliotecas de gráficos.

### Uso sem conta e sincronização

A narrativa explicará que o usuário pode começar sem criar conta e decidir sincronizar posteriormente. A composição visual usará dois estados conectados, “No seu dispositivo” e “Sincronizado quando quiser”, sem sugerir implementação técnica além do comportamento já comunicado pelo produto.

### CTA final

O fechamento repetirá a promessa de clareza financeira e terá um botão “Começar agora” para `https://app.finly.systems`. Um rodapé mínimo exibirá a marca Finly e o ano corrente de forma estática, evitando JavaScript apenas para essa informação.

## Movimento

As animações serão limitadas a CSS:

- Entrada suave de texto e mockup no carregamento.
- Flutuação quase imperceptível em um ou dois elementos decorativos.
- Transições de hover e focus nos CTAs.
- Revelação visual simples suportada por CSS, sem esconder conteúdo essencial quando JavaScript estiver indisponível.

`prefers-reduced-motion: reduce` removerá movimentos e scroll animado. Não serão instalados GSAP, Three.js, Framer Motion ou bibliotecas equivalentes.

## Responsividade e Acessibilidade

O layout será validado em desktop, tablet e mobile. Os pontos principais de adaptação serão:

- Navegação simplificada em telas estreitas.
- Hero em uma coluna no mobile.
- Mockup sem overflow horizontal e com redução controlada de detalhes secundários.
- Cards em grade fluida, passando para uma coluna quando necessário.
- Áreas clicáveis adequadas para toque.

A página terá estrutura semântica, um único `h1`, headings hierárquicos, links com foco visível, contraste suficiente e rótulos acessíveis nos ícones decorativos ou funcionais. Elementos puramente decorativos ficarão ocultos da árvore de acessibilidade.

## Desempenho

A landing não fará chamadas à API nem carregará dados de usuário. A maior parte da interface será renderizada no servidor e estilizada com CSS. Não serão usados assets genéricos, bibliotecas de animação, gráficos pesados ou dependências que não contribuam diretamente para a página.

## Validação

A entrega será considerada pronta quando:

- `apps/landing` funcionar de forma independente e não alterar arquivos das aplicações existentes.
- Os textos e destinos de CTA corresponderem exatamente ao solicitado.
- O CTA secundário levar à seção `#produto` com scroll suave quando movimento for permitido.
- As quatro áreas estiverem presentes e legíveis em desktop, tablet e mobile.
- O dashboard fictício for construído somente com HTML, CSS e Lucide React.
- A página respeitar `prefers-reduced-motion` e navegação por teclado.
- A checagem TypeScript, o lint e o build de produção terminarem sem erros.
- Uma inspeção visual local confirmar ausência de overflow, erros de renderização e quebras nos principais tamanhos de tela.

## Restrições

- Não modificar a Home interna do Finly.
- Não compartilhar código executável ou estado com `apps/web` nesta primeira versão.
- Não instalar GSAP, Three.js, Framer Motion ou bibliotecas de animação.
- Não usar banco de imagens, vídeo, WebGL, canvas ou pipelines externos de mídia.
- Não configurar domínio, projeto Vercel ou infraestrutura nesta etapa.
