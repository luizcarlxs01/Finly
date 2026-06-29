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
- Status: **pasta criada, sem código ainda — pertence à Fase 7**
- Não iniciar o mobile antes de concluir as Fases 1 a 6

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

**Estrutura funcional atual da Fase 1**
- `FinanceSummaryCard` fica apenas na aba **Lançamentos**, no `aside` da tela.
- O `FinanceSummaryCard` é colapsável: mostra **Saldo Atual** por padrão, permite ocultar todos os valores com o "olhinho" e mantém a **Simulação** visível mesmo colapsado.
- O `AccountAccessCard` é aberto por toggle via ícone no header (`AppFloatingHeader`).
- O FAB `[+]` fixo aparece nas abas **Lançamentos**, **Metas** e **Insights**.

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
Account Access Card, App Floating Header, Login Form

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

## 12. Fase 1 concluída e validada no browser

**UI / UX (web)**
- ✅ Reduzir textos da UI (hero, onboarding, insights)
- ✅ Remover cards decorativos do HeroSection
- ✅ Atalhos Agenda e Extrato na Home
- ✅ Simplificar Saldo Inicial (in-place editing)
- ✅ Remover cards de onboarding da Home
- ✅ Reorganização completa do layout
- ✅ `FinanceSummaryCard` apenas na aba **Lançamentos** (`aside`)
- ✅ Card colapsável: mostra só **Saldo Atual** por padrão
- ✅ "Olhinho" para ocultar todos os valores
- ✅ Simulação sempre visível mesmo colapsado
- ✅ `AccountAccessCard` via ícone no Header (toggle)
- ✅ FAB `[+]` fixo — aparece em **Lançamentos**, **Metas** e **Insights**
- ✅ Cards de onboarding removidos da Home

**Validação**
- Fluxo validado visualmente no browser ao fim da Fase 1.

---

## 13. Dívida técnica conhecida

Erros de TypeScript pré-existentes nos testes, fora do escopo da Fase 1:
- `financial-forecast-card.test.tsx`
- `goal-list.test.tsx`
- `transaction-list.test.tsx`

Esses erros já existiam antes da Fase 1 e precisam ser corrigidos em momento dedicado.

---

## 14. O que está em andamento agora (Fase 2)

**Revisão de segurança da API**
- ✅ Guid.TryParse na base controller — `GetAuthenticatedUserId()` retorna `Unauthorized` em vez de exceção
- ✅ `ApiControllerBase` criado — os 6 controllers herdam, método duplicado removido
- ✅ `[Required]`, `[MaxLength]`, `[EmailAddress]` em todos os DTOs de request
- ✅ SecretKey removida dos appsettings — lida via variável de ambiente `JWT__SecretKey`
- ✅ CORS — `AllowedOrigins` configurado com `https://finly-opal.vercel.app` em produção
- ⚠️ `AllowedHosts` permanece `"*"` — será restringido para `api.finly.com.br` na Fase 5, quando o domínio da VPS estiver definido
- ⏳ Revisar autorização e demais pontos do diagnóstico

**Variáveis de ambiente obrigatórias para rodar a API**

A `SecretKey` do JWT **nunca** deve ser hardcoded. Copie `apps/api/.env.example` para `apps/api/.env` e preencha os valores:

```
JWT__SecretKey=       ← gere com: openssl rand -base64 32
JWT__Issuer=Finly.Api
JWT__Audience=Finly.Web
ConnectionStrings__DefaultConnection=
```

O padrão .NET usa `__` para separar seções (`JWT__SecretKey` → `Jwt:SecretKey`).
O `IConfiguration` do .NET 8 lê env vars automaticamente — nenhuma alteração de código necessária.

Em produção, a guarda em `InfrastructureServiceExtensions` recusa iniciar se `SecretKey` estiver vazio.
Em desenvolvimento, `appsettings.Development.json` tem `"CONFIGURAR_VIA_ENV"` como placeholder.

**Observação de ambiente**
- ⚠️ A API está hospedada na Azure com Free Trial expirado (modo read-only).
- A revisão de segurança deve ser feita localmente e commitada.
- O deploy aguarda a migração para VPS nas fases futuras (Fase 3+).

---

## 15. Plano de infraestrutura — fases futuras (não tocar agora)

> Decisão registrada: não misturar infraestrutura com a fase atual.
> O plano abaixo será executado somente após a apresentação e estabilização do produto.

### Fase 1 — Estabilização UI/UX (CONCLUÍDA)
Objetivo: produto estável para apresentação no front-end.
- UI/UX concluída
- Fluxo validado no browser

### Fase 2 — Revisão de segurança da API (AGORA)
Objetivo: revisar a segurança localmente antes da retomada de deploy.
- Revisar JWT
- Validar proteção dos endpoints
- Revisar validação de usuário
- Revisar CORS
- Revisar autorização

### Fase 3 — Containerização
Objetivo: preparar o Finly para sair da máquina local.
```
/docker
  docker-compose.yml
  /api
  /banco
```
Resultado: `docker compose up -d` sobe tudo.

### Fase 4 — VPS
Contratar servidor:
- 4 GB RAM, 2 vCPU
- Faixa: R$ 40–80/mês
- Ubuntu + Docker + Docker Compose

Resultado: Finly rodando em servidor próprio.

### Fase 5 — HTTPS
- Domínio próprio (`app.finly.com.br`, `api.finly.com.br`)
- Let's Encrypt + Nginx
- SSL configurado

### Fase 6 — Produção
- Migrar banco local → VPS
- Rodar `dotnet ef database update`
- Configurar JWT, Connection String, Backup, Logs
- Sem dependência da Azure

### Fase 7 — Novas funcionalidades
Somente depois de tudo acima estar estável:
- Troca de Perfil Financeiro (Pessoal / Empresa / Família)
- Importação / Exportação
- Notificações
- App Mobile (Flutter)

---

## 16. Funcionalidades e temas adiados — não tocar agora

**Troca de Perfil Financeiro** — adiada para Fase 7. Não sugerir, não implementar, não criar estrutura.

**App Mobile (Flutter)** — `apps/mobile` está vazio intencionalmente. Pertence à Fase 7. Não iniciar.

**Docker / VPS / Nginx / SSL / Deploy** — pertence às Fases 3 a 6. Não sugerir enquanto estiver na Fase 2.

---

## 17. Filosofia de desenvolvimento

1. Implementar
2. Validar manualmente
3. Corrigir bugs encontrados
4. Somente então avançar para a próxima funcionalidade

Nunca acumular pendências. Nunca avançar com bugs conhecidos.

---

## 18. Convenção de commits

```
feat:      nova funcionalidade
fix:       correção de bug
refactor:  refatoração sem mudança de comportamento
docs:      documentação
chore:     tarefa técnica (config, dependências)
style:     formatação, sem alteração de lógica
```

---

## 19. Antes de qualquer implementação — perguntas obrigatórias

1. Isso cria duplicidade (componente local vs API)?
   → Se sim, pare. Refatore para usar o hook unificado.

2. Isso altera alguma regra de negócio existente?
   → Se sim, confirmar com o usuário antes de prosseguir.

3. Qual fase do projeto isso pertence?
   → Não implementar o que pertence a fases futuras.

4. O modo local e o modo API se comportarão exatamente igual?
   → Se não, a implementação está errada.
