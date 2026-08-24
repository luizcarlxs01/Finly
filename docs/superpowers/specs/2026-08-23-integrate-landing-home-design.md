# Integrar a landing à Home do Finly

## Objetivo

Transformar a aba Início de `apps/web` na experiência visual completa criada em
`apps/landing`, mantendo a aplicação financeira como único produto publicado em
`app.finly.systems`. Ao final, `apps/landing` e a worktree temporária deixam de
existir.

## Limites

- Preservar `AppFloatingHeader`, navegação, autenticação e todos os callbacks.
- Não alterar hooks, `FinanceSourceProvider`, API, Occurrences, calendário,
  regras financeiras, Docker, VPS ou mobile.
- Não introduzir regras diferentes para modo local e modo API.
- Não importar os estilos globais da landing diretamente em `apps/web`.
- Não manter uma segunda aplicação, iframe ou dependência entre apps.

## Experiência da Home

A Home mantém o shell e o header flutuante da aplicação. Dentro da área de
conteúdo, ela passa a renderizar quatro blocos:

1. Hero cinematográfico com o dashboard financeiro 3D.
2. Showcase do produto.
3. Diferencial de uso sem conta e sincronização opcional.
4. CTA final e rodapé da experiência.

O Hero da landing substitui o Hero interno atual. Ele incorpora a mensagem
aprovada na aplicação: "Seu dinheiro. Mais claro todos os dias." e o supporting
text "Acompanhe o que importa e registre seus lançamentos em poucos passos.".

O header próprio de `apps/landing` não será migrado, porque o
`AppFloatingHeader` já cumpre essa função. O CTA principal do Hero e o CTA final
chamam o callback existente que abre a aba Lançamentos. O CTA secundário faz
scroll suave para o showcase.

## Arquitetura de componentes

Os componentes migrados ficam em
`apps/web/src/components/dashboard/home-landing/`:

- `home-landing.tsx`: composição das quatro áreas e contrato de navegação.
- `landing-hero.tsx`: mensagem, CTAs e cena do dashboard.
- `product-dashboard.tsx`: mockup financeiro estático.
- `product-showcase.tsx`: benefícios e leitura do produto.
- `sync-feature.tsx`: modo local e sincronização opcional.
- `final-cta.tsx`: chamada final e rodapé.
- `scroll-reveal.tsx`: `IntersectionObserver` reutilizável e isolado no cliente.
- `home-landing.module.css`: estilos escopados, responsividade, animações e
  `prefers-reduced-motion`.

`DashboardHomeView` continua recebendo os mesmos callbacks públicos e passa
`onGoToTransactions` para `HomeLanding`. `HeroSection` e
`DashboardEntryHeader` serão removidos quando ficarem sem consumidores. A
mensagem e o tratamento visual recém-aprovados serão preservados no novo Hero,
sem manter dois Heroes concorrentes.

## Estilos e responsividade

O CSS da landing será adaptado para um CSS Module, evitando colisões com nomes
genéricos como `button`, `dashboard`, `eyebrow` e `content-width`. A composição
respeita a largura do shell interno em vez de criar uma nova página raiz.

Desktop mantém perspectiva, camadas e indicadores flutuantes. Tablet reduz
ângulos e deslocamentos. Mobile remove os elementos que competem com o conteúdo,
desativa o float contínuo do painel e reduz blur. Em
`prefers-reduced-motion: reduce`, reveals e transformações ficam estáticos.

## Comportamento e dados

Todo o dashboard mostrado no Hero permanece fictício e puramente visual. Ele
não acessa hooks, API, contexto financeiro ou `localStorage`. O único fluxo da
Home para a aplicação é o callback já existente de navegação para Lançamentos.

O `ScrollReveal` manipula apenas atributos do próprio elemento observado. Se
`IntersectionObserver` não estiver disponível, o conteúdo fica visível.

## Testes e validação

- Testar a mensagem e a estrutura semântica da nova Home.
- Testar que os dois CTAs funcionais chamam `onGoToTransactions`.
- Testar que o CTA secundário aponta para o showcase.
- Testar o reveal com um `IntersectionObserver` controlado.
- Executar os testes diretamente relacionados.
- Executar TypeScript, lint e build de `apps/web`.
- Comparar qualquer falha global com o baseline preexistente, sem corrigir
  arquivos fora do escopo.
- Validar no navegador desktop e mobile: navegação, overflow, console e
  preferência de movimento reduzido.

## Migração e limpeza Git

1. Implementar e validar a Home ainda na branch `codex/finly-landing`.
2. Remover `apps/landing` somente depois que a versão integrada estiver verde.
3. Commitar a migração completa.
4. Integrar a branch em `main` sem modificar nem descartar as alterações mobile
   já presentes no working tree principal.
5. Revalidar o resultado em `main`.
6. Remover a worktree com `git worktree remove` e então excluir a branch já
   integrada.

Se a suíte global continuar com falhas do baseline, a integração e a limpeza
param antes de qualquer remoção destrutiva. Os arquivos permanecem preservados
até a situação ser apresentada ao usuário.
