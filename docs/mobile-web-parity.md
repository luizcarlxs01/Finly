# Paridade mobile × web (v1.00.001)

Base: web publicada em app.finly.systems. Flutter replica estrutura, textos e
fluxos; efeitos que dependem de libs web (Orb WebGL, GSAP, animação de cubo)
são aproximações.

## Alterado no mobile
- **Início:** orb do saldo animado (CustomPainter), troca Saldo/Resultado com
  fade, ícone por categoria, gráfico com eixos e tooltip, "ocultar valores"
  persistido (`core/privacy/value_privacy.dart`, compartilhado com Lançamentos).
- **Lançamentos:** 4 indicadores, calendário compacto, Extrato sempre visível
  com "Novo lançamento", abas, busca, mês, painel de filtros, rodapé com
  "Ver projeção"; linhas no formato do extrato (ícone, status, menu ⋯). FAB removido
  (a web também o oculta nessa aba em telas pequenas).
- **Metas:** resumo, painel com abas/busca/filtros, lista única, paginação.
- **Insights:** perfil de gastos recolhível (Econômico/Padrão/Gastão/Personalizado,
  faixas Ruim/Mediano/Bom), previsão compacta, leituras em cards, painel de
  análise com 5 filtros (pizza, evolução, ranking), regras financeiras, FAB "+"
  (FinlySpeedDial). Filtros/somas da análise em `data/spending_analysis.dart`.
- **Fórum:** moderação antes do formulário, erro/sucesso inline, selos, detalhe
  com "Voltar para o fórum", textos iguais à web.
- **Calendário completo:** respeita ocultar valores; dias vazios selecionáveis.

## Diferenças aceitas
- Navegação por barra inferior (web: header flutuante); sem aba Download.
- Orb não é WebGL; sem animação de cubo em Metas; sem hover.
- Dialogs de criar meta / progresso de meta não foram refeitos.

## Não verificado visualmente
Telas logadas (formulário/detalhe/moderação do Fórum, regras financeiras) só
passaram por widget tests; gráficos só vistos vazios; Conta
(login/registro/verificação) não comparada com a web; modo claro.

## Diferenças que sobraram
Ranking é lista de barras; status admin em português; formulário de regra em
folha; validação do Personalizado ainda diz "Mais ou menos".

## Entrega
APK release 1.00.001 (código 2) assinado com CN=Finly, copiado para
`apps/web/public/downloads/finly.apk`. Publicar exige commit + push.
