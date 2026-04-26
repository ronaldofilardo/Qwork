# Roteiro Completo: Promover Staging para Produção — QWork Neon

## Contexto Histórico

Este roteiro documenta o processo descoberto em 07/04/2026 ao promover code da feature/v2 com database neondb_v2 para produção. A abordagem evita `vercel promote` (que reconstrói a partir do branch padrão configurado) e usa em vez disso um workflow de branch dedicado + deploy explícito.

---

## Fase 1: Preparação Pré-Deploy

### 1.1 Validar Estado da Feature Branch

**Objetivo**: Confirmar que `feature/v2` tem o código pronto para produção.

```bash
# 1. Mudar para a feature branch
git checkout feature/v2

# 2. Atualizar da origem
git pull origin feature/v2

# 3. Verificar status
git status

# 4. Revisar commits ulteriores fazendo log
git log --oneline -10
```

**Critérios de Aceição**:

- HEAD apontando para commit recente
- Sem uncommitted changes
- Build passa localmente: `pnpm build`
- Testes passam (ou status de teste conhecido e documentado)

### 1.2 Validar Database Target (Staging ou Neon)

**Objetivo**: Confirmar qual database será promovida junto com o código.

```bash
# Em ambiente de staging (se aplicável)
echo $DATABASE_URL
# Ou no Vercel, verificar env var na aba Production/Preview
```

**Critérios de Aceição**:

- DATABASE_URL aponta para `neondb_v2` (ou o banco novo desejado)
- Migrations estão atualizadas no banco target
- Schema em staging == schema esperado em produção

**Método de Verificação** (via psql):

```bash
export PGPASSWORD="<neon_password>"
export PGSSLMODE="require"

# Listar versão de migrations
psql -h <host> -U <user> -d <dbname> -c "SELECT id, name FROM migrations ORDER BY id DESC LIMIT 5;"

# Contar tabelas e verificar estrutura crítica
psql -h <host> -U <user> -d <dbname> -c "\dt" | wc -l
psql -h <host> -U <user> -d <dbname> -c "SELECT COUNT(*) FROM usuarios;"
```

### 1.3 Listar Endpoints de Neon Production vs Staging (via Neon Console)

**Objetivo**: Confirmar URLs de conexão antes de fazer deploy.

Neon Dashboard → Connections → Copy connection string

**Informações a Documentar**:

```
STAGING (Preview):
  - Connection string: postgresql://neondb_owner:npg_...@ep-...staging...
  - Database name: neondb_staging
  - Host: ep-...-staging....sa-east-1.aws.neon.tech

PRODUCTION (Main):
  - Connection string: postgresql://neondb_owner:npg_...@ep-...production...
  - Database name: neondb_v2 (ou novo nome)
  - Host: ep-...-production....sa-east-1.aws.neon.tech
```

---

## Fase 2: Criar Branch Production Dedicado

### 2.1 Criar Branch Production a Partir de Feature/V2

**Objetivo**: Estabelecer um branch independente que represente production.

```bash
# 1. Estar em feature/v2 (já feito em 1.1)
git checkout feature/v2

# 2. Criar branch production baseado em feature/v2
git checkout -b production

# 3. Empurrar para remoto (cria branch no GitHub)
git push -u origin production
```

**Resultado Esperado**:

```
Branch 'production' set up to track 'origin/production'.
```

### 2.2 Verificar Existência do Branch

```bash
git branch -a
# Deve mostrar:
# * production
#   feature/v2
#   main
#   remotes/origin/production
#   remotes/origin/feature/v2
#   remotes/origin/main
```

---

## Fase 3: Configuração Vercel Production Environment

### 3.1 Acessar Projeto Vercel

**Objetivo**: Validar configuração antes de deploy.

1. Ir para: https://vercel.com/dashboard
2. Selecionar projeto: **qwork**
3. Ir para aba: **Settings** → **Git**

### 3.2 Verificar Configuração de Production Branch

**Informação Crítica**:

```
Production Branch: main (ou conforme configurado)
```

**Nota Importante**: Não tente alterar via API (schema rejeitado por Vercel). Deixar como está. O workflow evita dependência dessa setting via deploy explícito (veja Fase 4).

### 3.3 Verificar Environment Variables em Production

**Objetivo**: Confirmar DATABASE_URL e variáveis críticas.

Caminho: **Settings** → **Environment Variables**

**Variáveis Críticas a Validar**:

```
DATABASE_URL = postgresql://neondb_owner:npg_...@ep-...neondb_v2...
NODE_ENV = production
NEXTAUTH_SECRET = <configurado>
APP_ENV = production (opcional, mas recomendado)
NEXTAUTH_URL = https://sistema.qwork.app.br
```

**Ação se DATABASE_URL Estiver Errado**:

1. Ir para **Settings** → **Environment Variables**
2. Clicar em DATABASE_URL
3. Editar valor para apontar para novo banco
4. Salvar
5. **Importante**: Qualquer mudança de env var requer novo deploy para ter efeito

---

## Fase 4: Deploy Explícito via Vercel CLI

### 4.1 Instalar/Validar Vercel CLI

```bash
# 1. Verificar se instalado
vercel --version

# 2. Se não instalado
npm install -g vercel
# ou
pnpm add -g vercel

# 3. Fazer login
vercel login
```

### 4.2 Fazer Deploy para Production

**Objetivo**: Build e deploy direto de feature/v2 para production.

```bash
# 1. Estar em feature/v2 localmente
git checkout feature/v2

# 2. Executar deploy com flag --prod
vercel deploy --prod

# 3. VOU APARECER INTERAÇÃO TERMINAL:
# - Confirmação de projeto: qwork (confirm)
# - Confirmação de settings: Show (ou skip)
# - Build completion: Aguardar até sucesso
```

**Fluxo Esperado**:

```
> vercel deploy --prod
? Set up and deploy "~/apps/QWork"? [Y/n] y
? Which scope should contain your project? [Your Workspace]
? Found project "qwork". Link to it? [Y/n] y
✓ Linked to qwork
? How would you like to define your Build and Output settings? [Auto]
> Building...
```

**Output Final Esperado**:

```
✓ Production: https://sistema.qwork.app.br [<8digits>]
✓ Inspect Source: https://vercel.com/.../<deploy-id>/source
Preview: https://sistema.qwork.app.br

Deployment Complete! Aliased to sistema.qwork.app.br
```

### 4.3 Documentar Deployment ID

**Objetivo**: Ter referência para rollback ou investigação.

Salvar o ID retornado, exemplo:

```
Deploy ID: GbroLsvHF (ou similar)
Timestamp: 2026-04-07 HH:MM:SS
Source: feature/v2
Target: sistema.qwork.app.br (production)
```

---

## Fase 5: Promoção Manual para Production (Se Necessário)

### 5.1 Cenário: Deploy Criada em Preview (Não Production)

**Situação**: Se deploy foi criada como Preview (URL sistema.qwork.app.br), precisa promover.

**Solução**:

1. Ir para **Deployments** → Localizar deploy ID de 4.3
2. Clicar em deploy
3. Clicar botão **"Promote to Production"**
4. Confirmar

**Resultado**:

```
✓ Promoted to production
Custom Domain: sistema.qwork.app.br
```

### 5.2 Verificar Domínios Customizados

**Objetivo**: Confirmar que deployment está servindo domínio correto.

Caminho: **Settings** → **Domains**

**Domínios Expected**:

```
sistema.qwork.app.br → Production (main deployment)
staging.qwork.app.br → Preview (automated previews)
sistema.qwork.app.br → Default preview URL
```

---

## Fase 6: Validação Pós-Deploy

### 6.1 Verificar Acesso à URL Production

**Objetivo**: Confirmar que deploy está ativa e servindo código.

```bash
# 1. Acessar URL no navegador
https://sistema.qwork.app.br

# 2. Verificar se carrega sem erro 404 ou 500
# 3. Observar headers HTTP
curl -I https://sistema.qwork.app.br

# 4. Verificar se versão de código está correta (v2)
# Procurar em elemento da página indicador de versão
# ou fazer load de page source e buscar comentários/versioning
```

**Critérios de Aceição**:

- HTTP 200 (não 403, 404, 500)
- Página carrega sem erros de build
- Assets carregam (CSS, JS)

### 6.2 Verificar Conectividade de Database

**Objetivo**: Confirmar que ENV VAR DATABASE_URL está sendo lida corretamente.

```bash
# 1. Fazer test de login (vai falhar se DB não estiver acessível)
# Ou fazer curl para endpoint de health-check (se disponível)

# 2. Verificar logs em Vercel
# Caminho: Deployments → [Deploy ID] → Logs (Function logs, Runtime logs)

# 3. Se disponível, criar endpoint de test:
# GET /api/health ou similar que query o DB
```

**Indicadores de Sucesso**:

- Login funciona (database acessível)
- Queries retornam dados (usuários, clínicas, etc.)
- Sem mensagens "Connection refused" ou "FATAL"
- DATABASE_URL não tem typos

### 6.3 Validar Schema Database

**Objetivo**: Confirmar que banco está na versão esperada.

```bash
export PGPASSWORD="<neon_password>"
export PGSSLMODE="require"

# 1. Verificar versão de migrations
psql -h <production_host> -U neondb_owner -d neondb_v2 \
  -c "SELECT id, name FROM migrations ORDER BY id DESC LIMIT 5;"

# 2. Contar tabelas (deve ser ~70+)
psql -h <production_host> -U neondb_owner -d neondb_v2 \
  -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# 3. Verificar usuários existem
psql -h <production_host> -U neondb_owner -d neondb_v2 \
  -c "SELECT COUNT(*) as usuario_count FROM usuarios;"

# 4. Verificar índices críticos
psql -h <production_host> -U neondb_owner -d neondb_v2 \
  -c "SELECT indexname FROM pg_indexes WHERE tablename='usuarios' LIMIT 10;"
```

**Esperado**:

```
id | name
   | 9001 | create_clinicas_table
   | 9002 | create_usuarios_table
   ... (progressão até migration recente)

table_count | 71 (ou número esperado)
usuario_count | >0 (database tem dados)
```

---

## Fase 7: Validação de Features

### 7.1 Smoke Test do Application

**Objetivo**: Testar flows críticos em production.

```bash
# 1. Acessar https://sistema.qwork.app.br/login
# 2. Tentar login com admin (ou usuário test known)
# 3. Se sucesso, verificar dashboard carrega
# 4. Clicar em alguns menus: Usuários, Clínicas, Funcionários
# 5. Verificar se dados aparecem (indicativo que DB query funciona)
```

**Checklist**:

- [ ] Login page carrega
- [ ] Login com credenciais válidas funciona
- [ ] Dashboard carrega pós-login
- [ ] Menu navigation funciona
- [ ] Pelo menos um CRUD (view usuários) mostra dados
- [ ] Sem console errors no DevTools

### 7.2 Verificar que é Feature/V2 (Não Legacy)

**Objetivo**: Confirmar que code legacy foi removido.

```bash
# 1. Abrir DevTools → Network
# 2. Fazer alguns cliques, verificar que requisições para /api/* funcionam
# 3. Procurar por indicadores:
#    - UI deve ser "limpa" (sem legacy payment/plan UI)
#    - Endpoints antigos (/api/plano/*, /api/pagamento/v1/*) não devem existir
#    - Layout deve ser consistente com design v2
```

### 7.3 Verificar Logs em Vercel (Se Disponível)

**Objetivo**: Diagnosticar qualquer erro silencioso.

Caminho: **Deployments** → [Deploy ID] → **Logs**

```
Procurar por:
- [Error] ou [Warn] - indicam problemas
- Database connection logs - devem mostrar sucesso
- Build-time errors - devem estar zerados
```

---

## Fase 8: Limpeza e Documentação

### 8.1 Atualizar Production Branch com Empty Commit (Se Necessário)

**Objetivo**: Marcar deployment no histórico git.

```bash
# 1. Estar em production branch
git checkout production

# 2. Fazer empty commit marker (opcional)
git commit --allow-empty -m "chore: trigger production rebuild for neondb_v2"

# 3. Push
git push origin production
```

**Propósito**: Deixa marca clara no git quando cada deploy foi feito.

### 8.2 Documentar Status em Wiki ou Notion

**Campos a Documentar**:

```
Data: 2026-04-07
Horário: HH:MM UTC
Status: ✅ SUCCESS

Source Branch: feature/v2 (commit hash)
Target: sistema.qwork.app.br (production)
Deploy ID: <vercel_deploy_id>

Database: neondb_v2
Last Migration: 9001
User Count: 32
Funcionario Count: 124

Checklist:
[ ] Code builds successfully
[ ] Login works
[ ] Database queryable
[ ] Dashboard loads
[ ] No console errors

Rollback Plan:
  - If needed, redeploy from main or previous commit
  - DATABASE_URL switch to neondb (legacy) if emergency

Notes:
- Vercel production branch tracking: still points to main (by design, not critical)
- Feature/v2 isolated as production source via production branch
- Admin user password: <configured separately, see docs>
```

### 8.3 Cleanup Scripts Temporários

**Objetivo**: Remover arquivos de teste usados durante deploy.

```bash
# Se houver scripts SQL temporários ou test files:
rm -f C:\Temp\*.sql
rm -f C:\Temp\deploy_notes.txt

# Commits de cleanup (opcional):
git add -A
git commit -m "chore: cleanup temporary deployment artifacts"
git push origin production
```

---

## Fase 9: Contingência — Rollback (Se Necessário)

### 9.1 Rollback Rápido via Vercel UI

**Se deployment em production has critical errors**:

1. Ir para **Deployments**
2. Localizar previous commit/deploy que era estável
3. Clicar botão **Rollback**
4. Confirmar

**Tempo esperado**: <1 minuto

### 9.2 Rollback via Git + Redeploy

**Se rollback via UI não funciona**:

```bash
# 1. Ir para commit anterior estável
git log --oneline -20
git checkout <previous_stable_commit>

# 2. Ou volta branch para main
git checkout main

# 3. Deploy again
vercel deploy --prod

# 4. Promote se criada como preview
```

### 9.3 Rollback Database (Se Necessário)

**Se dados foram corrompidos**:

```bash
# 1. Switch DATABASE_URL em Vercel production env var
#    De: neondb_v2
#    Para: neondb (legacy, backup)

# 2. Redeploy para pegar novo env var
vercel redeploy (ou vercel deploy --prod)

# 3. Investigar o que falhou em neondb_v2
# 4. Restaurar dados se possível (backup de Neon console)
```

**Documentar Incident**:

- Hora de rollback
- Razão
- Tempo para recuperação
- Root cause post-mortem

---

## Appendix A: Variáveis e Credenciais Reference

### Neon Connection Info (Exemplo)

```
Environment: PROD
Host: ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech
User: neondb_owner
Password: npg_J2QYqn5oxCzp
Database: neondb_v2
Connection String: postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2
```

### Vercel Project Reference

```
Project Name: qwork
Project ID: prj_LvK5ytsqYligFlwdzBAihqdgj2WS
Team: ronaldofilardos-projects
Production Domain: sistema.qwork.app.br
Staging Domain: staging.qwork.app.br
```

### Custom Domains

```
Production: sistema.qwork.app.br (domínio principal)
Staging: staging.qwork.app.br (auto-preview)
```

---

## Appendix B: Troubleshooting Map

| Sintoma                                | Possível Causa                      | Solução                                         |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| "Deployment não aparece em Production" | Deploy criada em preview mode       | Promover manually via UI (Fase 5.1)             |
| "Login falha, conexão recusada"        | DATABASE_URL incorreta ou DB down   | Verificar env var Vercel, confirmar Neon status |
| "HTTP 500 em alguns endpoints"         | Build incompleto ou env var missing | Check Vercel runtime logs                       |
| "Assets (CSS/JS) não carregam"         | Build artifacts faltando            | Rerun `vercel deploy --prod`                    |
| "Database version mismatch"            | Migrations não aplicadas            | Aplicar migrations em Neon manualmente          |
| "Old code (main) sendo servido"        | Production branch ainda aponta main | Deploy explícito de feature/v2 ignora isso      |
| "Vercel API reject env var update"     | Schema incompatível com Vercel      | Usar UI, não CLI; não crítico para workflow     |

---

## Appendix C: Checklist Pre-Deploy Final

```
PRÉ-DEPLOY:
[ ] feature/v2 branch atualizada de origin
[ ] Código compila localmente (pnpm build)
[ ] feature/v2 tests passam (ou status conhecido)
[ ] Database neondb_v2 está na versão esperada (migrations)
[ ] Backup de database anterior feito (se aplicável)
[ ] Vercel project settings revisados
[ ] Production env vars corretas em Vercel UI
[ ] Domain apontamentos configurados
[ ] Team acessos validados (quem pode fazer rollback)

PÓS-DEPLOY:
[ ] Deploy criada em Vercel
[ ] URL production acessível (no navegador)
[ ] Login funciona
[ ] Dashboard carrega
[ ] Database queries retornam dados
[ ] Logs em Vercel sem erros críticos
[ ] Smoke test completo
[ ] Documentação atualizada
[ ] Team notificado de sucesso
[ ] Rollback plan comunicado
```

---

## Appendix D: Comandos Rápidos (Copy-Paste)

### Deploy Rápido

```bash
git checkout feature/v2
git pull origin feature/v2
vercel deploy --prod
```

### Validar DB

```bash
export PGPASSWORD="npg_J2QYqn5oxCzp"
export PGSSLMODE="require"
psql -h ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb_v2 -c "SELECT COUNT(*) FROM usuarios;"
```

### Setup Production Branch (Primeira Vez)

```bash
git checkout feature/v2
git pull origin feature/v2
git checkout -b production
git push -u origin production
```

---

## Histórico de Uso

| Data       | Status     | Notas                                       |
| ---------- | ---------- | ------------------------------------------- |
| 2026-04-07 | ✅ SUCCESS | Primeira promoção com neondb_v2, verificado |
|            |            |                                             |

---

**Versão deste Roteiro**: 1.0  
**Última Atualização**: 2026-04-07  
**Responsável**: Squad Deployment QWork  
**Próxima Revisão**: Conforme novos deploys, solicitar feedback e melhorias
