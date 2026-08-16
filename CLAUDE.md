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
Financial Calendar Modal (+ Grid e Day Panel), Statement Projection Modal,
Account Access Card, App Floating Header, Login Form, Register Form, Password Strength Bar

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

> ⚠️ A partir da Fase A/B (backend) e das Fases C/D (frontend — ver seção 21), o
> mecanismo mudou nos três: saldo atual passou a ser a soma de `Occurrence.Amount`
> (ou `occurrence.amount` no modo local) onde `Status/status = Paid/"paid"`, em vez
> de filtrar `Transaction.Amount` por `TransactionDate <= hoje`. O invariante acima
> (nunca considerar o futuro) continua valendo, só a implementação é outra. Backend,
> frontend modo API e frontend modo local estão **todos migrados** para o modelo
> Transaction + Occurrence. Ver seção 21 antes de mexer em saldo/transações.

---

## 11. O que já está implementado

✅ Login / Logout / JWT  
✅ Cadastro de usuários com validação de domínio MX  
✅ Dashboard  
✅ Saldo Inicial  
✅ Criar / Editar / Excluir Transação  
✅ Parcelamento  
✅ Recorrência  
✅ Simular Impacto  
✅ Calendário Financeiro (substituiu a Agenda — ver seção 22)  
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
- ✅ Atalhos Agenda e Extrato na Home (a Agenda virou **Calendário** — ver seção 22)
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

**Resolvida em 15/08/2026** — 162/162 testes passando, `npx tsc --noEmit` limpo.

Correções aplicadas (commit `18ad2fc`):
- **Erros de TypeScript** (Category 1): anotações de tipo em callbacks `getByText`/`getAllByText`; casts `as HTMLElement` nos `within()` — em `financial-forecast-card.test.tsx`, `goal-list.test.tsx`, `transaction-list.test.tsx`
- **Assertions obsoletas** (Category 2): textos alinhados à UI atual em todos os 8 arquivos afetados; lógica de estado colapsado do `FinanceSummaryCard`; remoção de `StatementProjectionModal` de `DashboardTransactionsView` (movido para `page.tsx`); `page.test.tsx` corrigido com mock de `useFinanceSource`, `cancelOccurrence`, e `NEXT_PUBLIC_API_URL` em `setup.ts`

Não há dívida técnica de testes remanescente.

---

## 14. O que está em andamento agora (Fase 4)

**Fase 2 — Revisão de segurança da API (CONCLUÍDA)**
- ✅ Guid.TryParse na base controller — `GetAuthenticatedUserId()` retorna `Unauthorized` em vez de exceção
- ✅ `ApiControllerBase` criado — os 6 controllers herdam, método duplicado removido
- ✅ `[Required]`, `[MaxLength]`, `[EmailAddress]` em todos os DTOs de request
- ✅ SecretKey removida dos appsettings — lida via variável de ambiente `JWT__SecretKey`
- ✅ CORS — `AllowedOrigins` configurado com `https://finly-opal.vercel.app` em produção
- ✅ Rate limiting em login/register — 5 req / 15 min **por IP**, resposta 429 com mensagem clara
  - ⚠️ **Correção em 15/08/2026:** esta linha esteve **errada** desde a Fase 2. O código
    usava `options.AddFixedWindowLimiter("auth", ...)`, overload que cria **um balde
    único global** para a policy inteira — sem partição por IP nem por nada. Na prática
    eram 5 tentativas de login a cada 15 min **no sistema todo, somando todos os
    usuários**: o sexto usuário legítimo levaria 429. Autobloqueio, não proteção.
  - Corrigido na preparação do Traefik: agora é `options.AddPolicy("auth", ...)` com
    `RateLimitPartition.GetFixedWindowLimiter` chaveado em
    `httpContext.Connection.RemoteIpAddress`. Cada IP tem seu próprio balde.
  - Depende de `UseForwardedHeaders` rodar antes do `UseRateLimiter` — atrás do Traefik,
    sem isso o `RemoteIpAddress` seria o IP do proxy e todos os clientes cairiam na
    mesma partição, reproduzindo o balde global. Ver seção 23.
- ✅ Senha mínima aumentada de 6 para 8 caracteres
- ✅ Rehash silencioso implementado — `SuccessRehashNeeded` atualiza o hash no banco sem interromper o login
- ✅ Claims JWT enxutas — 4 claims em vez de 6 (`sub`, `email`, `unique_name`, `ClaimTypes.NameIdentifier`)
- ✅ `AllowedHosts` **restringido em 15/08/2026** (antecipado da Fase 5, já que o domínio
  foi definido): `appsettings.json` (Production) usa `"api.finly.systems"`;
  `appsettings.Development.json` sobrescreve com `"*"`.
  - O override em Development é **obrigatório**, não cosmético: `Development.json` não
    declarava `AllowedHosts`, então herdaria o domínio do arquivo base e o
    `HostFilteringMiddleware` passaria a devolver **400 em todo request para
    `localhost`**, quebrando o dev local.

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

**Fase F — Cadastro de usuários (CONCLUÍDA)**

Implementação do formulário de registro com validação de domínio e indicador visual de força de senha.

**Backend (apps/api)**
- ✅ `IEmailDomainValidationService` + `EmailDomainValidationService` — checagem de registro MX via [DnsClient.NET](https://github.com/MichaCo/DnsClient.NET)
  - Detecta domínios inexistentes ou sem suporte a e-mail
  - Consulta DNS sem fazer conexão real (sem custo, sem infraestrutura extra)
  - Integrado ao `AuthService.RegisterAsync` como validação anterior ao duplo check
- ✅ `AuthService.RegisterAsync` — chama validação de domínio, rejeita com mensagem clara se domínio inválido
- ✅ Senha mínima mantida em 8 caracteres (seção 2 da Fase 2)
- ✅ JWT retornado automaticamente após criar a conta

**Frontend (apps/web)**
- ✅ `utils/password-strength.ts` — heurística minimalista (comprimento 8+, maiúsc/minúsc, número, símbolo)
  - `weak`: 0-2 critérios
  - `medium`: 3 critérios
  - `strong`: 4+ critérios
- ✅ `components/auth/password-strength-bar.tsx` — barra visual (vermelho/amarelo/verde), só aparece com input
- ✅ `components/auth/register-form.tsx` — formulário de cadastro (nome, e-mail, senha)
  - Mesmo padrão visual do `LoginForm`
  - Inclui `PasswordStrengthBar` integrado
- ✅ `hooks/use-auth-session.ts` — ganhou método `register()` que salva a sessão automaticamente
- ✅ `components/auth/account-access-card.tsx` — placeholder "em breve" removido
  - Agora alterna entre `LoginForm` e `RegisterForm` conforme a intenção (`activeIntent`)
  - Sem duplicação de componentes, sem branches locale/API

**Validado**
- Registro com Gmail (domínio válido) → conta criada, login automático, sessão persistida
- Registro com domínio inexistente → rejeitado pelo backend, mensagem exibida na UI
- Barra de senha reage em tempo real: "Senha fraca" → "Senha forte"
- Zero erros de console, fluxo end-to-end validado no browser com API rodando via Docker

**Fase 4/5 — VPS + Traefik (arquivos PREPARADOS, deploy PENDENTE)**

VPS já contratada: Ubuntu 24.04 LTS, com Docker e **Traefik pré-instalados pelo
provedor** (Hostinger). Fases 4 e 5 foram fundidas e antecipadas porque o Traefik
já resolve proxy reverso e SSL automático.

Configuração do Traefik na VPS (confirmada por inspeção do container):
- Container `traefik-traefik-1`, imagem `traefik:latest`, **`NetworkMode: host`**
- `--providers.docker=true` e `--providers.docker.exposedbydefault=false`
  → detecta containers pelo socket do Docker; **não precisa de rede externa
  customizada**, mas exige `traefik.enable=true` explícito em cada serviço
- Entrypoints: `web` (:80) e `websecure` (:443)
- Redirect 80→443 **já é global** (`--entrypoints.web.http.redirections.entrypoint.to=websecure`)
  → não declarar router HTTP nem middleware de redirect por container, seria redundante
- Let's Encrypt via desafio **HTTP-01**, storage em `/letsencrypt/acme.json`

Alterações aplicadas ao projeto (15/08/2026):

- ✅ `docker/docker-compose.yml`
  - `name: finly` no topo → containers `finly-api-1` / `finly-banco-1`, rede
    `finly_default`, volume `finly_sqldata`
    - ⚠️ O volume antigo `docker_sqldata` ficou **órfão** (continha 12 usuários /
      15 transações / 55 occurrences de teste). Decisão registrada: dados
      descartáveis, banco local recriado zerado. O volume antigo segue no disco
      até alguém removê-lo à mão.
  - `api`: 6 labels do Traefik — `traefik.enable`, router `finly-api` em
    `websecure` com `Host(${API_DOMAIN})`, `tls.certresolver=letsencrypt`,
    service apontando para a porta 8080
  - `api`: `ports: 8080:8080` → `expose: 8080`. **A porta não é mais publicada.**
    Quem expõe a API para a internet é o Traefik, que alcança o container pela
    rede bridge do Compose.
  - `banco`: `ports: 1433:1433` → `expose: 1433`. **SQL Server sem acesso público.**
    Só o serviço `api` fala com ele, pela rede interna. Para acesso administrativo:
    `docker compose exec banco sqlcmd ...` ou publicar temporariamente em
    `127.0.0.1:1433` + túnel SSH.
  - `ASPNETCORE_ENVIRONMENT: ${ASPNETCORE_ENVIRONMENT:-Production}` — default
    Production (VPS não precisa configurar nada); dev local sobrescreve no `.env`

- ✅ `apps/api/Finly.Api/Program.cs` — `UseForwardedHeaders`
  - `Configure<ForwardedHeadersOptions>` com `XForwardedFor | XForwardedProto`
  - `app.UseForwardedHeaders()` é o **primeiro middleware do pipeline**, antes de
    `UseHttpsRedirection`, `UseRouting` e `UseRateLimiter`
  - **Por que é obrigatório:** o Traefik termina o TLS e encaminha HTTP puro para a
    8080. Sem isso, (a) o `UseHttpsRedirection` — que já rodava em Production — veria
    `scheme=http` e devolveria 307 para HTTPS em *todo* request, criando **loop de
    redirect**; e (b) o `RemoteIpAddress` seria o IP do proxy, colapsando o rate
    limiting por IP numa partição só.
  - `KnownNetworks` restrito a `172.16.0.0/12` (faixa privada das bridges do Docker),
    **não** permissivo. Os headers `X-Forwarded-*` são texto que qualquer cliente pode
    forjar; a lista decide de quem aceitamos a reescrita. Com `Clear()` em
    `KnownNetworks`/`KnownProxies`, qualquer origem que alcançasse a 8080 poderia
    forjar `X-Forwarded-For` (balde de rate limit novo por tentativa → força bruta
    liberada) ou `X-Forwarded-Proto: https` (derrubando o redirect de HTTPS). Hoje o
    container não tem porta publicada, então o permissivo seria *na prática* seguro —
    mas essa seria uma propriedade do compose, não do código, e some no dia que
    alguém republicar a porta para debugar.
    - Tradeoff conhecido: `/12` é largo, confia em qualquer container em qualquer
      bridge do host. Fechar no IP exato do gateway exigiria subnet estática no
      compose (o Docker atribui dinamicamente).
  - `ForwardLimit = 1` explícito (é o default): consome só a última entrada do
    `X-Forwarded-For`, a que o próprio Traefik acrescentou. Entradas injetadas pelo
    cliente à esquerda são descartadas.

- ✅ `docker/.env.example` — `API_DOMAIN` e `ASPNETCORE_ENVIRONMENT` documentados

Validado: `dotnet build` limpo (0 erros / 0 avisos); `docker compose config`
resolvendo `Development` com o `.env` local e `Production` sem a variável.

**Deploy em si ainda não foi feito** — ver seção 23.

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
- Domínio próprio (`app.finly.systems`, `api.finly.systems`)
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

## 21. Arquitetura de Transações — Transaction + Occurrence

> Mudança de arquitetura de dados (backend nas Fases A/B, frontend modo API na
> Fase C, frontend modo local na Fase D, limpeza de código morto na Fase E).
> Migração **COMPLETA** — backend, modo API e modo local no mesmo modelo, sem
> resíduo do modelo antigo. Leia esta seção inteira antes de tocar em
> Transações, Regras Financeiras ou Dashboard, em qualquer um dos três.

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
- ✅ **Fase C** — Frontend modo API consome Occurrences reais. Inclui os fixes:
  Bug 1 (editar Valor de uma transação Single via "Dados gerais" não atualizava
  o saldo — `TransactionService.UpdateAsync` agora propaga Amount/DueDate para
  a Occurrence quando `TransactionKind == Single`) e Bug 2 (bloco "Esta
  ocorrência" aparecia também para Single — corrigido para exigir
  `transactionKind !== "single"`).
- ✅ **Fase D** — Frontend modo local (`localStorage`) espelha o mesmo modelo.
  Implementado e validado nesta sessão:
  - `types/local-finance-profile.ts` — schema novo com `occurrences` (schema
    **resetado**, sem migração de dados antigos do `localStorage`, decisão
    tomada nesta sessão).
  - `hooks/use-local-finance.ts` reescrito — `addTransaction`/`updateTransaction`/
    `removeTransaction` geram e sincronizam Occurrences reais; novos
    `updateOccurrence`, `markOccurrencePaid`, `markOccurrencePending`,
    `cancelOccurrence` (soft-delete via status `Cancelled`, mesma semântica do
    backend). `updateTransaction` replica o fix do Bug 1 da Fase C: quando o
    kind é Single, propaga `amount`/`dueDate` para a única Occurrence.
  - `utils/occurrence-generation.ts` (novo) — réplica em TypeScript de
    `OccurrenceGenerationService.cs`; é a fonte única de geração de occurrences
    no modo local, reaproveitada também por `use-impact-simulation.ts` (preview
    para os dois modos). Não duplicar esta lógica.
  - `utils/flatten-transaction.ts` (novo) — achata um contrato (Transaction) +
    Occurrences em N linhas de UI (1 por ocorrência), reaproveitado por modo
    local e modo API.
  - `transaction-normalization.ts` ganhou `getBackendTransactionKind` e
    `inferContractRecurrenceMode`, compartilhados entre os dois modos.
  - Componentes de UI (`transaction-edit-modal.tsx`, `transaction-list.tsx`,
    `schedule-modal.tsx`) já eram agnósticos de modo — nenhuma alteração de
    gating local/API foi necessária.
  - **Validado por Playwright** (fluxo completo no modo sem conta): criar
    Single/Installment(4x)/Recurring(indefinido→12 ocorrências), editar valor
    de uma ocorrência específica, marcar ocorrência como paga, cancelar
    ocorrência (soft-delete), abrir Agenda com ocorrências futuras agrupadas
    por mês, editar Single via "Dados gerais" propagando para a Occurrence, e
    excluir a série inteira de uma Recurring. Saldo conferido matematicamente
    em cada transição (todas corretas), zero erros de console.
  - **Arquivos removidos** (código morto do modelo antigo, sem uso após a
    reescrita): `utils/installment-transactions.ts` (+ teste),
    `services/local-finance-service.ts` (já estava morto, nenhum import),
    `utils/upcoming-transactions.ts` reduzido a apenas tipos.
- ✅ **Fase E** — Remoção final de código morto da migração. Auditoria completa
  por `grep` de cada símbolo de `recurring-transactions.ts` contra todo
  `apps/web/src` (produção + testes), confirmando uso real antes de remover
  qualquer coisa. Removidos por estarem **100% mortos** (zero uso fora da
  própria definição/teste):
  - `synchronizeRecurringTransactions` (função exportada)
  - `getOccurrenceKey` (função exportada — ficaria órfã após a remoção acima)
  - `getSourceId` (helper privado, só usado por `synchronizeRecurringTransactions`)
  - `getOccurrenceDate` (helper privado, idem)
  - `createRecurringInstance` (helper privado, idem)
  - `SynchronizeRecurringTransactionsInput` / `SynchronizeRecurringTransactionsResult`
    (tipos locais só usados na assinatura da função removida)
  - O describe block correspondente (5 testes) em
    `test/utils/recurring-transactions.test.ts` também foi removido.

  Confirmados **vivos e mantidos intocados** (dependências internas de funções
  ainda em uso, mesmo sem import externo): `createDateValue`, `getReferenceDate`,
  `getDaysInMonth`, `getMonthDifference`, `isRecurringTemplateTransaction`,
  `isOccurrenceWithinRecurringLimit`, `getLatestGeneratedOccurrenceDate` — todas
  usadas por `getNextRecurringOccurrenceDate` (que por sua vez é usada em
  `app/page.tsx`) ou por `parseDateValue`/`createMonthlyOccurrence` (usadas em
  `occurrence-generation.ts`, `transaction-normalization.ts`,
  `upcoming-occurrences.ts` e outros — este último removido depois, na seção 22).
  `recurring-transactions.ts` **não foi deletado** — continua existindo com o que
  está em uso.

  Validado após a remoção: `npx tsc --noEmit` limpo (só os 3 arquivos de dívida
  técnica pré-existente da seção 13); `npx vitest run` com exatamente as mesmas
  19 falhas do baseline documentado (mesmos 8 arquivos, mesmos testes — nenhuma
  nova, nenhuma resolvida); `recurring-transactions.test.ts` passando 100% (9
  testes, os 5 do `synchronizeRecurringTransactions` removidos junto com a
  função).

### Estado atual — migração COMPLETA (Fases A a E)

Backend, frontend modo API e frontend modo local estão todos no modelo
Transaction + Occurrence, sem código morto remanescente do modelo antigo. A
migração de arquitetura Transaction + Occurrence está **encerrada**. Dívida
técnica que resta (testes com texto de UI desatualizado e erros de TypeScript
em testes) é pré-existente e não relacionada a esta migração — ver seção 13.

---

## 22. Calendário Financeiro — substituiu a Agenda

Funcionalidade entregue e validada no browser. **Substitui completamente** a Agenda
(`schedule-modal.tsx` + lista de "próximos 3 meses"), que foi removida.

### O que é

Modal/overlay com grid mensal estilo Google Calendar, aberto pelo botão
**Calendário** (antes "Agenda") na Home e na aba Lançamentos.

- Header: navegação `‹ Mês Ano ›` + botão **Hoje** (só aparece fora do mês atual)
- Resumo do mês: entradas previstas, saídas previstas e **Saldo do mês**
  (`totalIncome - totalExpense` das Occurrences do mês, `Paid` + `Pending`)
- Grid: dias 1..N alinhados por dia da semana (células vazias antes do dia 1),
  incluindo dias passados; dia atual destacado com pill `bg-primary`
- Pontinhos por dia: **verde** (`emerald`) = `Paid`, **cinza** = `Pending`.
  Máximo de 4 pontos, excedente vira `+N`. `Cancelled` nunca aparece (já vem
  filtrada do array achatado, decisão da Fase C/D)
- Hover no dia: popover leve (CSS puro, `group-hover`, `pointer-events-none`)
  com até 3 ocorrências + "e mais N". Abre para cima nas 2 últimas semanas para
  não ser cortado pelo scroll do modal
- Clique no dia: painel de detalhes **dentro do próprio modal** — coluna à
  direita no `xl`, empilhado abaixo do grid em telas menores
- O painel do dia é **somente visualização**. Nenhuma ação nova (marcar pago,
  cancelar, editar inline) foi implementada — só um botão **Editar** por item,
  que fecha o calendário e abre o `TransactionEditModal` já existente

> ⚠️ **Saldo do mês ≠ saldo projetado acumulado.** É o resultado líquido daquele
> mês isolado, bem definido tanto para meses passados quanto futuros. Não soma o
> saldo atual nem acumula meses intermediários. Se algum dia for preciso o saldo
> corrido ao final do mês, é mudança de regra de negócio — confirmar antes.

### Arquivos

**Novos**
- `utils/financial-calendar.ts` — `getCalendarMonthData` (agrupa por dia,
  monta os dias do mês, calcula o resumo), `isPaidOccurrence`,
  `CALENDAR_WEEKDAY_LABELS` e `getNextMonthLabel`
- `components/dashboard/overlays/financial-calendar-modal.tsx`
- `components/dashboard/overlays/financial-calendar-grid.tsx`
- `components/dashboard/overlays/financial-calendar-day-panel.tsx`

**Removidos (modelo antigo de lista, 100% morto após a troca)**
- `components/dashboard/overlays/schedule-modal.tsx`
- `components/dashboard/upcoming-transactions.tsx`
- `components/dashboard/upcoming-transactions-month-group.tsx`
- `utils/upcoming-transactions.ts` (só tipos) e `utils/upcoming-occurrences.ts`
- Testes: `schedule-modal.test.tsx`, `upcoming-transactions.test.tsx`,
  `upcoming-transactions-month-group.test.tsx`
- Mock morto de `@/utils/upcoming-transactions` em `test/app/page.test.tsx`
  (apontava para `getUpcomingTransactionsByMonth`, que já não existia)

**Alterados**
- `dashboard-entry-header.tsx`, `dashboard-home-view.tsx`,
  `dashboard-transactions-view.tsx` — prop `onOpenSchedule` → `onOpenCalendar`,
  label "Agenda" → "Calendário" (ícone `CalendarDays` mantido)
- `app/page.tsx` — `isScheduleModalOpen` → `isCalendarModalOpen`; o modal recebe
  `projectionTransactions` (respeita a simulação de impacto ativa) em vez de
  `monthGroups`
- `.claude/launch.json` — criado para o preview do `npm run dev` (dev only)

### Fonte de dados — idêntica nos dois modos

Consome `useFinanceData().transactions`, que passa pela mesma
`flattenApiTransactionToLineItems` no modo local e no modo API (seção 21).
Não há nenhum gating `source === "local" | "api"` no calendário.

### Horizonte de Occurrences

Recorrência indefinida gera 12 meses (limitação conhecida da seção 21). Navegar
além disso mostra o grid vazio com "Nenhum lançamento neste mês" — sem erro e
sem crash. **Decisão: não projetar datas no client**, porque reintroduziria
exatamente a lógica de projeção que as Fases D/E removeram de propósito. A
navegação não tem teto artificial.

### Validação (browser, modo sem conta)

Fluxo validado com dados criados pela própria UI: Single passada (paga), Single
futura (pendente), Installment 4x cruzando julho→outubro e Recurring indefinida.
Conferido: resumo do mês batendo na matemática (entradas 5.000 / saídas 720,50 /
saldo 4.279,50 em agosto), saldo atual correto (4.600 — pendentes não entram),
pontos verde/cinza corretos por status, "Parcela 2/4" no painel do dia,
alinhamento semanal (1º/ago/2026 = sábado → 6 células vazias), dia 15 destacado
como hoje, Editar abrindo o `TransactionEditModal` com o bloco "Esta ocorrência",
scroll-lock do body restaurado ao fechar (incluindo via `Escape`), recorrente
indefinida presente em exatamente 12 meses e vazia a partir do 13º, e mobile
(375px) sem scroll horizontal. Zero erros de console.

`npx tsc --noEmit` limpo (só os 3 arquivos de dívida técnica da seção 13).
`npx vitest run`: 18 falhas — o baseline de 19 medido com `git stash` no mesmo
commit, menos o teste da Agenda que foi reescrito. Nenhuma regressão.

---

## 23. Checklist de Deploy VPS

> Estado atual: **arquivos preparados, deploy não executado**. Os itens abaixo são
> pré-requisitos e pendências reais — não são sugestões. Ver seção 14 para o
> detalhe técnico de cada alteração.

### Pré-requisitos antes do primeiro `docker compose up`

- [ ] **Registro DNS A** de `api.finly.systems` → IP público da VPS, **propagado antes
      de subir os containers**. O Let's Encrypt usa desafio **HTTP-01**: bate em
      `http://api.finly.systems/.well-known/acme-challenge/...` e precisa chegar no
      Traefik. Se o DNS não resolver no momento em que o container sobe, a emissão
      falha e o Traefik entra em **backoff com retentativas espaçadas** — não adianta
      subir e torcer. Ainda há risco de bater no rate limit do Let's Encrypt
      (5 falhas por hora, por conta e hostname).
      Conferir com `dig +short api.finly.systems` antes de prosseguir.

- [ ] **`docker/.env` de produção criado na VPS** — o arquivo é gitignored e **não vem
      no clone**. Sem ele, o Compose sobe com variáveis vazias.

- [ ] **`SA_PASSWORD` e `JWT__SecretKey` NOVOS**, gerados na própria VPS.
      **Jamais reaproveitar os valores locais** — segredo de dev que vaza (backup,
      screenshot, histórico de shell) não pode virar segredo de produção.
      Trocar a `JWT__SecretKey` invalida todos os tokens emitidos, o que é o
      comportamento desejado ao separar os ambientes.

- [ ] **`API_DOMAIN=api.finly.systems`** no `.env` da VPS — é o valor interpolado na
      label `Host()` do Traefik. Se faltar, a regra de roteamento nasce vazia e o
      Traefik não expõe a API.

- [ ] **`ASPNETCORE_ENVIRONMENT` AUSENTE** no `.env` da VPS. O compose usa
      `${ASPNETCORE_ENVIRONMENT:-Production}`, então a ausência já resolve para
      `Production` — que é o que ativa CORS restrito à Vercel, Swagger desligado e
      `UseHttpsRedirection`. Definir a variável como `Development` na VPS exporia o
      Swagger publicamente e liberaria o CORS errado.

### Pendências conhecidas (não bloqueiam o deploy)

- [ ] **CORS precisará de ajuste quando o frontend sair da Vercel** para domínio
      próprio (ex.: `app.finly.systems`). Hoje `Cors:AllowedOrigins` em Production tem
      só `https://finly-opal.vercel.app`. Enquanto o front estiver na Vercel, está
      correto e não deve ser mexido.

- [ ] **Volume `docker_sqldata` órfão na máquina local** (não na VPS). Decisão tomada:
      dados de teste descartáveis, remover à mão quando quiser
      (`docker volume rm docker_sqldata`). Não afeta produção.

### Verificações após subir

- [ ] `docker compose ps` — `finly-banco-1` deve estar `healthy` antes de a API subir
- [ ] `docker compose logs api` — confirmar as migrations aplicadas no startup
- [ ] `docker logs traefik-traefik-1` — confirmar que o router `finly-api` foi
      detectado e o certificado emitido
- [ ] `curl -I https://api.finly.systems/swagger` deve dar **404** (Swagger é
      desligado em Production — 404 aqui é sinal de que o ambiente está certo)
- [ ] `curl -I http://api.finly.systems` deve devolver **301/308** para HTTPS
- [ ] Confirmar que **nada** responde em `http://<IP-da-VPS>:8080` e
      `<IP-da-VPS>:1433` — as portas não são mais publicadas
- [ ] Testar login pelo front da Vercel (valida CORS + JWT + ForwardedHeaders juntos)
