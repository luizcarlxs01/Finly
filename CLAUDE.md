# CLAUDE.md — Finly

Este arquivo é o briefing permanente do projeto para o Claude Code.
Leia tudo antes de qualquer ação. Não pule seções.

---

## 1. O que é o Finly

Aplicativo de controle financeiro com arquitetura híbrida:

- **Usuário deslogado** → dados no `localStorage` (modo local)
- **Usuário autenticado** → dados na API + SQL Server (modo API)

A interface é **exatamente a mesma** nos dois modos.
A aplicação decide o modo automaticamente — nunca o usuário.
Não existe botão de troca, não existe tela separada, não existe componente duplicado.

---

## 2. Regra absoluta — nunca violar

> Jamais criar componentes, hooks, formulários ou telas separadas para modo local e modo API.
> Toda a diferença de origem de dados é resolvida nos hooks e no `FinanceSourceProvider`.
> A UI nunca sabe de onde o dado veio.

---

## 3. Estrutura do monorepo

```
Finly/
├── apps/
│   ├── web/        → Next.js + React + TypeScript + TailwindCSS (Vercel)
│   ├── api/        → ASP.NET Core .NET 8 (Azure App Service)
│   └── mobile/     → Flutter (em desenvolvimento)
├── docs/           → documentação do projeto
└── .github/
    └── workflows/  → GitHub Actions
```

Branches principais: `main`, `luiz`, `leo`

---

## 4. Stack por app

### web (Next.js)
- Next.js + React + TypeScript
- TailwindCSS + shadcn/ui
- Deploy: Vercel → https://finly-opal.vercel.app

### api (.NET 8)
- ASP.NET Core Web API
- Entity Framework Core
- JWT Authentication
- Deploy atual: Azure App Service (⚠️ Free Trial expirado — modo read-only)
- Banco: Azure SQL Database

### mobile (Flutter)
- Flutter + Dart
- Stack planejada: Riverpod (estado), GoRouter (navegação), Dio + flutter_secure_storage
- Status: **pasta criada, sem código ainda — pertence à Fase 6**
- Não iniciar o mobile antes de concluir as Fases 1 a 5

---

## 5. Arquitetura do front-end (apps/web)

```
src/
├── app/
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   └── ui/
├── contexts/           → FinanceSourceProvider (decide local vs API)
├── hooks/              → todos os hooks unificados
├── lib/
│   └── api/            → toda comunicação HTTP centralizada aqui
│       ├── auth
│       ├── client
│       ├── dashboard
│       ├── profiles
│       ├── transactions
│       ├── goals
│       ├── financial-rules
│       └── rule-processing
├── services/
├── types/
└── utils/
```

---

## 6. Hooks existentes (web)

**Autenticação**
- `use-auth-session`

**Dados**
- `use-finance-data`
- `use-goals-data`
- `use-financial-rules-data`

**CRUD Transações**
- `use-create-transaction`
- `use-update-transaction`
- `use-delete-transaction`

**CRUD Metas**
- `use-create-goal`
- `use-update-goal-progress`
- `use-delete-goal`

**Outros**
- `use-impact-simulation`
- `use-update-initial-balance`
- `use-local-finance`
- `use-local-goals`

---

## 7. Arquitetura do back-end (apps/api)

```
Finly.Api/            → controllers, configuração, Program.cs
Finly.Application/    → DTOs, interfaces, serviços, regras de negócio
Finly.Domain/         → entidades, contratos de domínio
Finly.Infrastructure/ → EF Core, repositórios, migrations
```

**Controllers:** Auth, Dashboard, Profiles, Transactions, Goals, FinancialRules, RuleProcessing

**Migrations EF Core:**
- `InitialCreate`
- `AddIsPrimaryToFinancialProfile`
- `AddFinancialRules`

---

## 8. Componentes principais (web)

Dashboard Home, Dashboard Transactions, Dashboard Goals, Dashboard Insights,
Finance Summary Card, Financial Forecast Card, Financial Rules Manager,
Transaction Form, Transaction List, Transaction Edit Modal,
Goal Form, Goal List, Goal Progress Modal,
Upcoming Transactions, Schedule Modal, Statement Projection Modal,
Account Access Card, Login Form

---

## 9. Sistema de eventos (web)

| Evento | Atualiza |
|---|---|
| `TRANSACTION_WRITE_COMPLETED_EVENT` | Dashboard, Transações, Insights |
| `GOAL_WRITE_COMPLETED_EVENT` | Metas, Dashboard |
| `FINANCIAL_RULE_WRITE_COMPLETED_EVENT` | Regras |
| `RULE_PROCESSING_COMPLETED_EVENT` | Dashboard, Transações, Regras, Insights |

---

## 10. Regras de negócio críticas

**Saldo atual** — nunca considera transações futuras. Apenas `TransactionDate <= hoje` entra nos cálculos.

**Parcelamentos** — parcelas futuras não alteram saldo atual.

**Recorrências** — ocorrências futuras não alteram saldo atual.

**Modo local** — possui exatamente as mesmas regras da API. `transactions ≠ postedTransactions`.

---

## 11. O que já está implementado

✅ Login / Logout / JWT  
✅ Dashboard  
✅ Saldo Inicial  
✅ Criar / Editar / Excluir Transação  
✅ Parcelamento  
✅ Recorrência  
✅ Simular Impacto  
✅ Agenda  
✅ Extrato  
✅ Projeção  
✅ Criar / Atualizar / Excluir Meta  
✅ Criar / Editar / Excluir Regra Financeira  
✅ Processar Regras  
✅ Modo Sem Conta (Local)  
✅ Modo Com Conta (API)  
✅ Hooks Unificados  
✅ Refresh Automático  

---

## 12. O que está em andamento agora (Fase 1)

**UI / UX (web)**
- Reorganizar layout do Dashboard
- Mover Resumo Financeiro
- Remover Resumo Rápido
- Agenda como atalho
- Extrato como atalho
- Integrar Simulação ao Resumo Financeiro
- Simplificar Saldo Inicial
- Reduzir textos
- Melhorar responsividade
- Adicionar botão "Reportar Problema"
- Nenhuma regra funcional será alterada nessa fase

**Revisão de segurança (api)**
- JWT (payload, claims)
- Proteção dos endpoints
- Validação de usuário
- CORS
- Autorização
- Revisão final ainda pendente

**Deploy**
- ⚠️ Azure Free Trial expirado → API e banco em modo read-only
- Não é possível fazer deploy, restart ou alterações na Azure agora
- A API está sem deploy ativo no momento — o front-end funciona em modo local (localStorage)
- Não sugerir nenhuma solução envolvendo Azure, Docker ou VPS agora — isso pertence às fases 2 a 5
- **Foco atual exclusivo: UI/UX + correções + apresentação**

---

## 13. Plano de infraestrutura — fases futuras (não tocar agora)

> Decisão registrada: não misturar infraestrutura com a fase atual.
> O plano abaixo será executado somente após a apresentação e estabilização do produto.

### Fase 1 — Estabilização (AGORA)
Objetivo: produto estável para apresentação.
- Finalizar UI/UX
- Corrigir bugs encontrados
- Revisar segurança
- Validar modo sem conta
- Validar modo com conta

### Fase 2 — Containerização
Objetivo: preparar o Finly para sair da máquina local.
```
/docker
  docker-compose.yml
  /api
  /banco
```
Resultado: `docker compose up -d` sobe tudo.

### Fase 3 — VPS
Contratar servidor:
- 4 GB RAM, 2 vCPU
- Faixa: R$ 40–80/mês
- Ubuntu + Docker + Docker Compose

Resultado: Finly rodando em servidor próprio.

### Fase 4 — HTTPS
- Domínio próprio (`app.finly.com.br`, `api.finly.com.br`)
- Let's Encrypt + Nginx
- SSL configurado

### Fase 5 — Produção
- Migrar banco local → VPS
- Rodar `dotnet ef database update`
- Configurar JWT, Connection String, Backup, Logs
- Sem dependência da Azure

### Fase 6 — Novas funcionalidades
Somente depois de tudo acima estar estável:
- Troca de Perfil Financeiro (Pessoal / Empresa / Família)
- Importação / Exportação
- Notificações
- App Mobile (Flutter)

---

## 14. Funcionalidades e temas adiados — não tocar agora

**Troca de Perfil Financeiro** — adiada para Fase 6. Não sugerir, não implementar, não criar estrutura.

**App Mobile (Flutter)** — `apps/mobile` está vazio intencionalmente. Pertence à Fase 6. Não iniciar.

**Docker / VPS / Nginx / SSL / Deploy** — pertence às Fases 2 a 5. Não sugerir enquanto estiver na Fase 1.

---

## 15. Filosofia de desenvolvimento

1. Implementar
2. Validar manualmente
3. Corrigir bugs encontrados
4. Somente então avançar para a próxima funcionalidade

Nunca acumular pendências. Nunca avançar com bugs conhecidos.

---

## 16. Convenção de commits

```
feat:      nova funcionalidade
fix:       correção de bug
refactor:  refatoração sem mudança de comportamento
docs:      documentação
chore:     tarefa técnica (config, dependências)
style:     formatação, sem alteração de lógica
```

---

## 17. Antes de qualquer implementação — perguntas obrigatórias

1. Isso cria duplicidade (componente local vs API)?
   → Se sim, pare. Refatore para usar o hook unificado.

2. Isso altera alguma regra de negócio existente?
   → Se sim, confirmar com o usuário antes de prosseguir.

3. Qual fase do projeto isso pertence?
   → Não implementar o que pertence a fases futuras.

4. O modo local e o modo API se comportarão exatamente igual?
   → Se não, a implementação está errada.
