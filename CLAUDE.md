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

**Controllers:** Auth, Dashboard, Profiles, Transactions, Occurrences, Goals, FinancialRules, RuleProcessing

**Migrations EF Core:**
- `InitialCreate`
- `AddIsPrimaryToFinancialProfile`
- `AddFinancialRules`
- `AddOccurrencesAndReshapeTransactions` — ver seção 21 (arquitetura Transaction + Occurrence)

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

> ⚠️ No **backend**, a partir da Fase A/B (ver seção 21), o mecanismo mudou: saldo
> atual passou a ser a soma de `Occurrence.Amount` onde `Status = Paid`, em vez de
> filtrar `Transaction.Amount` por `TransactionDate <= hoje`. O invariante acima
> (nunca considerar o futuro) continua valendo, só a implementação é outra. O
> **frontend e o modo local ainda não foram migrados** — continuam no modelo
> antigo descrito aqui. Ver seção 21 antes de mexer em saldo/transações no backend.

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

**Refinamentos pós Fase 1 (validados no browser)**
- ✅ Aba de Lançamentos reorganizada — `FinanceSummaryCard`, Agenda e Extrato aparecem antes do formulário/lista (DOM reordenado; grid de `1.35fr/0.65fr` invertido para `0.65fr/1.35fr`)
- ✅ Lista de transações colapsável — fechada por padrão (`isListOpen = false`), expande via botão "Visualizar lançamentos" com chevron animado
- ✅ FAB evoluído para speed dial — ao clicar em `[+]` (rotaciona 45°), dois mini-botões aparecem com animação CSS (`opacity` + `translate-y`): **Nova Transação** (`ArrowUpDown`) e **Nova Meta** (`Target`); cada opção abre seu próprio drawer; `GoalForm` reaproveitado sem alteração

**Validação**
- Fluxo validado visualmente no browser ao fim da Fase 1 e após refinamentos.

---

## 13. Dívida técnica conhecida

Erros de TypeScript pré-existentes nos testes, fora do escopo da Fase 1:
- `financial-forecast-card.test.tsx`
- `goal-list.test.tsx`
- `transaction-list.test.tsx`

Esses erros já existiam antes da Fase 1 e precisam ser corrigidos em momento dedicado.

---

## 14. O que está em andamento agora (Fase 4)

**Fase 2 — Revisão de segurança da API (CONCLUÍDA)**
- ✅ Guid.TryParse na base controller — `GetAuthenticatedUserId()` retorna `Unauthorized` em vez de exceção
- ✅ `ApiControllerBase` criado — os 6 controllers herdam, método duplicado removido
- ✅ `[Required]`, `[MaxLength]`, `[EmailAddress]` em todos os DTOs de request
- ✅ SecretKey removida dos appsettings — lida via variável de ambiente `JWT__SecretKey`
- ✅ CORS — `AllowedOrigins` configurado com `https://finly-opal.vercel.app` em produção
- ✅ Rate limiting em login/register — 5 req / 15 min por IP, resposta 429 com mensagem clara
- ✅ Senha mínima aumentada de 6 para 8 caracteres
- ✅ Rehash silencioso implementado — `SuccessRehashNeeded` atualiza o hash no banco sem interromper o login
- ✅ Claims JWT enxutas — 4 claims em vez de 6 (`sub`, `email`, `unique_name`, `ClaimTypes.NameIdentifier`)
- ⚠️ `AllowedHosts` permanece `"*"` — será restringido para `api.finly.com.br` na Fase 5, quando o domínio da VPS estiver definido

**Fase 3 — Containerização (CONCLUÍDA e validada em 29/06/2026)**

Arquivos criados/alterados:

- ✅ `docker/docker-compose.yml` — orquestra dois serviços:
  - `banco`: SQL Server 2022 Express com healthcheck (`sqlcmd SELECT 1`) e volume persistente `sqldata`
  - `api`: imagem da API com `depends_on: banco` (condição `service_healthy`), porta 8080, todas as env vars injetadas
- ✅ `docker/api/Dockerfile` — multi-stage build:
  - Stage `build`: `mcr.microsoft.com/dotnet/sdk:8.0` — copia `.sln` e `.csproj`, roda `dotnet restore`, depois copia código e roda `dotnet publish -c Release`
  - Stage `runtime`: `mcr.microsoft.com/dotnet/aspnet:8.0` — copia apenas `/app/publish`, expõe porta 8080
- ✅ `docker/.env.example` — template com `SA_PASSWORD` e `JWT__SecretKey` (sem valores reais)
- ✅ `apps/api/.dockerignore` — exclui recursivamente com `**/bin/`, `**/obj/`, `**/.vs/`, `TestResults/`, `*.user`, `.env`
  - ⚠️ Padrão `obj/` (sem `**/`) só excluiria a raiz — a correção para `**/obj/` foi necessária porque os `project.assets.json` gerados localmente no Windows continham paths absolutos (`C:\Program Files (x86)\Microsoft Visual Studio\Shared\NuGetPackages`) que quebravam o `dotnet restore` dentro do container Linux
- ✅ `apps/api/Finly.Api/Program.cs` — duas alterações:
  - `UseHttpsRedirection` agora é condicional (`if (!IsDevelopment())`) — necessário para o container não redirecionar para HTTPS quando rodando sem certificado
  - `Database.Migrate()` executado no startup via `IServiceScope` — aplica migrations pendentes automaticamente ao subir o container; requerido `using Microsoft.EntityFrameworkCore`

Resultado validado:
- `docker compose up -d --build` executado sem erros
- Container `banco` atingiu status `healthy`
- API respondeu em `http://localhost:8080/swagger` com status 200
- 3 migrations aplicadas automaticamente (`InitialCreate`, `AddIsPrimaryToFinancialProfile`, `AddFinancialRules`)

**Como rodar o ambiente local com Docker**

Pré-requisito: Docker Desktop instalado e rodando.

```bash
# 1. Copiar o template de variáveis
cp docker/.env.example docker/.env

# 2. Editar docker/.env e preencher os dois valores:
#    SA_PASSWORD — senha forte para o SQL Server (ex: Finly@2024!)
#    JWT__SecretKey — chave base64 gerada com um dos comandos abaixo:

# PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))

# ou bash / WSL / Linux / Mac:
openssl rand -base64 32

# 3. Subir os containers (rodar de dentro da pasta docker/)
cd docker
docker compose --env-file .env up -d --build

# 4. Validar
# Swagger:     http://localhost:8080/swagger   → deve retornar 200
# SQL Server:  localhost:1433  (usuário: sa, senha: valor de SA_PASSWORD)
```

**Credenciais e segredos**

- As credenciais reais ficam em `docker/.env`, que **nunca é commitado** (coberto pelo `.gitignore` raiz via padrão `.env`)
- `SA_PASSWORD` e `JWT__SecretKey` são gerados localmente por cada desenvolvedor seguindo o `docker/.env.example`
- Jamais citar o valor real de nenhuma senha ou chave em commits, comentários ou neste arquivo

**Fase 4 — VPS (PRÓXIMA)**
- Contratar servidor: 4 GB RAM, 2 vCPU, Ubuntu + Docker + Docker Compose
- Faixa: R$ 40–80/mês
- Subir o mesmo `docker-compose.yml` na VPS com as credenciais de produção
- Pré-requisito: Fase 3 concluída ✅

---

## 15. Como rodar localmente

### Cenário A — Docker (padrão atual)

```bash
# 1. Subir banco + API
cd docker
docker compose --env-file .env up -d --build

# 2. Subir o frontend
cd apps/web
npm run dev
```

- API disponível em: `http://localhost:8080`
- Frontend disponível em: `http://localhost:3000`
- `apps/web/.env.local` deve ter: `NEXT_PUBLIC_API_URL=http://localhost:8080`

### Cenário B — API local sem Docker (modo antigo, eventual)

```bash
# 1. Subir a API via Kestrel
cd apps/api
dotnet run --project Finly.Api

# 2. Subir o frontend
cd apps/web
npm run dev
```

- API disponível em: `http://localhost:5149`
- Frontend disponível em: `http://localhost:3000`
- `apps/web/.env.local` deve ter: `NEXT_PUBLIC_API_URL=http://localhost:5149`

> Para alternar entre os cenários, basta trocar o valor de `NEXT_PUBLIC_API_URL` no `apps/web/.env.local` e reiniciar o `npm run dev`.

CORS já está configurado para aceitar `http://localhost:3000` em ambos os cenários (`appsettings.Development.json`) — nenhuma alteração necessária.

---

## 16. Plano de infraestrutura — fases futuras (não tocar agora)

> Decisão registrada: não misturar infraestrutura com a fase atual.
> O plano abaixo será executado somente após a apresentação e estabilização do produto.

### Fase 1 — Estabilização UI/UX (CONCLUÍDA)
Objetivo: produto estável para apresentação no front-end.
- UI/UX concluída
- Fluxo validado no browser

### Fase 2 — Revisão de segurança da API (CONCLUÍDA)
Objetivo: revisar a segurança localmente antes da retomada de deploy.
- JWT, endpoints, validação, CORS, rate limiting, rehash, claims — tudo revisado.

### Fase 3 — Containerização (CONCLUÍDA)
Objetivo: preparar o Finly para sair da máquina local.
- `docker compose up -d --build` sobe banco + API sem erros
- Migrations aplicadas automaticamente no startup
- Validado em 29/06/2026

### Fase 4 — VPS (AGORA)
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

## 17. Funcionalidades e temas adiados — não tocar agora

**Troca de Perfil Financeiro** — adiada para Fase 7. Não sugerir, não implementar, não criar estrutura.

**App Mobile (Flutter)** — `apps/mobile` está vazio intencionalmente. Pertence à Fase 7. Não iniciar.

**Docker** — Fase 3 concluída. Não alterar os arquivos em `docker/` sem motivo explícito.

**VPS / Nginx / SSL / Deploy** — pertence às Fases 4 a 6. A Fase 4 (VPS) é o próximo passo.

---

## 18. Filosofia de desenvolvimento

1. Implementar
2. Validar manualmente
3. Corrigir bugs encontrados
4. Somente então avançar para a próxima funcionalidade

Nunca acumular pendências. Nunca avançar com bugs conhecidos.

---

## 19. Convenção de commits

```
feat:      nova funcionalidade
fix:       correção de bug
refactor:  refatoração sem mudança de comportamento
docs:      documentação
chore:     tarefa técnica (config, dependências)
style:     formatação, sem alteração de lógica
```

---

## 20. Antes de qualquer implementação — perguntas obrigatórias

1. Isso cria duplicidade (componente local vs API)?
   → Se sim, pare. Refatore para usar o hook unificado.

2. Isso altera alguma regra de negócio existente?
   → Se sim, confirmar com o usuário antes de prosseguir.

3. Qual fase do projeto isso pertence?
   → Não implementar o que pertence a fases futuras.

4. O modo local e o modo API se comportarão exatamente igual?
   → Se não, a implementação está errada.

---

## 21. Arquitetura de Transações — Transaction + Occurrence (nova)

> Mudança de arquitetura do backend, implementada nas Fases A e B desta sessão.
> Leia esta seção inteira antes de tocar em Transações, Regras Financeiras ou
> Dashboard no backend.

### Contexto do problema resolvido

Antes desta mudança, transações parceladas/recorrentes salvavam apenas **1
registro** no banco. As parcelas futuras eram calculadas em tempo real no
frontend (projeção). Isso impedia editar uma parcela individual (mudar valor
ou data de uma parcela específica) e tornava o comportamento frágil entre modo
local e modo API, já que cada um replicava a mesma lógica de projeção
separadamente.

### Novo modelo de dados

- **Transaction** = o "contrato": título, categoria, valor de referência,
  configuração de parcelamento/recorrência (`TransactionKind`, `InstallmentCount`,
  `RecurrenceMode`, `RecurrenceStartDate`/`EndDate`/`Day`/`Months`).
- **Occurrence** = cada ocorrência REAL da Transaction — 1 para `Single`, N para
  `Installment`/`Recurring`. Campos: `DueDate`, `Amount` (próprio — pode divergir
  do valor de referência da Transaction), `Status` (`Pending`/`Paid`), `PaidAt`,
  `IsCustomized`, `InstallmentIndex`.

### Regras de negócio

- Toda `Transaction` gera pelo menos 1 `Occurrence`.
- **Status automático NA CRIAÇÃO**: `DueDate <= hoje` → `Paid`, `PaidAt = UtcNow`;
  `DueDate > hoje` → `Pending`. **Depois da criação, o status NÃO é recalculado
  automaticamente** — uma Occurrence criada como `Pending` continua `Pending`
  mesmo depois que sua `DueDate` passa, até alguém chamar `mark-paid`
  explicitamente. Não existe job de background para isso ainda.
- **Saldo atual** = soma de `Occurrence.Amount` onde `Status = Paid`
  (`DashboardService`) — não é mais `Transaction.Amount` filtrado por
  `TransactionDate <= hoje`.
- `InstallmentIndex` é **sequencial (1, 2, 3...)** tanto para parcelas quanto
  para recorrências — `null` apenas para transações `Single`. É a chave de
  identidade real de uma ocorrência dentro de uma Transaction (não a `DueDate`,
  que pode ser customizada pelo usuário).
- Editar uma Occurrence (`PUT /api/occurrences/{id}`) seta `IsCustomized = true`.
- Recorrência indefinida (`RecurrenceMode.Indefinite`): horizonte inicial de 12
  meses gerado na criação. Estender quando restar menos de 6 meses futuros é
  **trabalho futuro, ainda não implementado**.
- `RuleProcessingService`: 1 `Transaction` "contrato" por `FinancialRule`
  (`SourceId = rule.Id`), reaproveitada em processamentos subsequentes (nunca
  cria uma segunda Transaction para a mesma regra). Dedup de occurrences por
  `TransactionId + InstallmentIndex` — **não por `DueDate`**, porque a `DueDate`
  pode ter sido customizada pelo usuário, e deduplicar por data geraria uma
  occurrence duplicada na data "original" a cada reprocessamento.
- Deletar uma `Transaction` faz cascade nas `Occurrences` (inclusive as pagas).

### Arquivos-chave (apps/api)

- `Finly.Domain/Entities/Transaction.cs`, `Occurrence.cs`
- `Finly.Domain/Enums/TransactionKind.cs` (`Single`, `Installment`, `Recurring` —
  valores antigos `InstallmentTemplate`/`InstallmentInstance`,
  `RecurringTemplate`/`RecurringInstance` mantidos no enum como deprecated, não
  são mais produzidos), `RecurrenceMode.cs`, `OccurrenceStatus.cs`
- `Finly.Application/Services/OccurrenceGenerationService.cs` — ponto único de
  geração de occurrences, usado por `TransactionService.CreateAsync` e por
  `RuleProcessingService`
- `Finly.Application/Services/OccurrenceService.cs` — GET / PUT / mark-paid /
  mark-pending
- `Finly.Application/Services/RuleProcessingService.cs` — reescrito nas Fases A/B
- `Finly.Api/Controllers/OccurrencesController.cs`
- `Finly.Infrastructure/Data/Configurations/OccurrenceConfiguration.cs`
- Migration: `AddOccurrencesAndReshapeTransactions`

### Status de implementação

- ✅ **Fase A** — Schema, migration, entidade `Occurrence`, `OccurrenceGenerationService`,
  `TransactionService.CreateAsync` gerando occurrences, `DashboardService` somando
  occurrences pagas.
- ✅ **Fase B** — `OccurrencesController` (GET, PUT, mark-paid, mark-pending),
  `TransactionResponseDto` com `Occurrences` embutidos, `RuleProcessingService`
  reescrito (contrato único + occurrences incrementais, idempotente).
- ✅ **Fix** — Dedup de `RuleProcessingService` trocada de `DueDate` para
  `InstallmentIndex` sequencial (evita duplicata ao customizar a data de uma
  occurrence).
- ⏳ **Fase C** — Frontend modo API (pendente).
- ⏳ **Fase D** — Frontend modo local / `localStorage` (pendente).
- ⏳ **Fase E** — Remoção de código morto: `synchronizeInstallmentTransactions`,
  `synchronizeRecurringTransactions`, `createProjectedRecurringItems`,
  `createProjectedInstallmentItems`, `getNextRecurringOccurrenceDate` — esses
  arquivos **ainda existem e ainda são usados pelo frontend**. **NÃO foram
  tocados nesta sessão** — o frontend ainda está 100% no modelo antigo.

### IMPORTANTE para a próxima sessão

**O frontend AINDA NÃO FOI ALTERADO.** Ele continua funcionando com o modelo
antigo (calculando parcelas/recorrências em tempo real no cliente), e o backend
agora tem o modelo novo (Transaction + Occurrence) rodando **em paralelo, sem o
frontend saber disso**. Isso significa que criar uma transação parcelada pelo
formulário hoje ainda funciona visualmente, mas os dados reais de `Occurrence`
gerados pelo backend não são exibidos nem editados pela UI ainda.

Antes de iniciar a Fase C, ler:

- `apps/web/src/hooks/use-finance-data.ts`
- `apps/web/src/hooks/use-local-finance.ts`
- `apps/web/src/types/api-transaction.ts`
- `apps/web/src/types/transaction.ts`
