# Branch Protection Configuration

## GitHub Branch Protection Rules

Configure estas regras no GitHub via **Settings → Branches → Add branch protection rule**:

### Branch: `main`

- [x] **Require pull request reviews before merging**
  - Required approving reviews: **2**
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners

- [x] **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Status checks required:
    - ✅ `lint-and-typecheck`
    - ✅ `unit-tests`
    - ✅ `integration-tests`
    - ✅ `e2e-critical-flows`
    - ✅ `build`

- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**
  - Enforce for administrators: **Yes**

- [x] **Restrict who can push to matching branches**
  - Only allow:
    - Repository admins
    - GitHub Actions (for automated deployments)

- [x] **Require linear history**
  - Force rebase or squash merge

---

### Branch: `develop`

- [x] **Require pull request reviews before merging**
  - Required approving reviews: **1**

- [x] **Require status checks to pass before merging**
  - Status checks required:
    - ✅ `lint-and-typecheck`
    - ✅ `unit-tests`
    - ✅ `build`

- [x] **Require conversation resolution before merging**

---

## CODEOWNERS

Crie arquivo `.github/CODEOWNERS` com:

```
# Fluxos Críticos (requer aprovação de 2 pessoas)
/app/api/auth/**                    @tech-lead @security-team
/app/api/admin/cadastro/**          @tech-lead @backend-team
/lib/tomador-activation.ts      @tech-lead @backend-team

# Emissão de laudos
/lib/laudo-auto.ts                  @tech-lead @backend-team
/app/api/entidade/lotes/**          @tech-lead @backend-team

# Database e migrations
/database/migrations/**             @tech-lead @dba-team
/lib/db.ts                          @tech-lead @backend-team

# CI/CD
/.github/workflows/**               @tech-lead @devops-team

# Testes críticos
/cypress/e2e/fluxo-*.cy.ts          @tech-lead @qa-team
/__tests__/integration/cadastro-*.test.ts  @tech-lead @qa-team
```

---

## Pull Request Template

Crie arquivo `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## 📋 Descrição

<!-- Descreva o que foi alterado e por quê -->

## 🎯 Tipo de Mudança

- [ ] 🐛 Bug fix
- [ ] ✨ Nova feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentação
- [ ] ♻️ Refactoring
- [ ] ⚡ Performance
- [ ] 🔒 Security fix

## 🧪 Testes

- [ ] Testes unitários adicionados/atualizados
- [ ] Testes de integração adicionados/atualizados
- [ ] Testes E2E adicionados/atualizados
- [ ] Todos os testes passam localmente
- [ ] Cobertura de testes mantida/aumentada

## 🔍 Checklist de Regressão

### ⚠️ **FLUXOS CRÍTICOS** (teste manualmente se afetado):

- [ ] **Fluxo A**: Cadastro Entidade → Liberação Senha → Login funciona
- [ ] **Fluxo B**: Cadastro Funcionário → Lote Pronto → Solicitar Emissão funciona

### Validações:

- [ ] Nenhuma query N+1 introduzida
- [ ] Nenhum console.log deixado no código
- [ ] Variáveis de ambiente documentadas (se novas)
- [ ] Migrations testadas (se aplicável)
- [ ] RLS policies validadas (se toca em queries)
- [ ] Logs estruturados para monitoramento

## 📸 Screenshots/Videos

<!-- Se mudanças de UI, anexe screenshots ou vídeos -->

## 🔗 Issues/Tickets

Closes #
Related to #

## 🚀 Deploy Notes

<!-- Alguma ação necessária após deploy? Migrations? Env vars? -->

---

**✅ Confirmação Final:**

- [ ] Executei `pnpm build` localmente e passou sem erros
- [ ] Executei `pnpm test` e todos os testes passaram
- [ ] Revisei meu próprio código antes de solicitar review
- [ ] Documentei mudanças complexas no código (comentários/docstrings)
```

---

## Automation Script

Crie arquivo `.github/scripts/check-critical-paths.sh`:

```bash
#!/bin/bash

# Script para validar se PR toca em caminhos críticos
# Executar em CI para alertar revisores

CRITICAL_PATHS=(
  "app/api/auth"
  "app/api/admin/cadastro"
  "lib/tomador-activation.ts"
  "lib/laudo-auto.ts"
  "app/api/entidade/lotes"
  "database/migrations"
)

echo "🔍 Checking if PR touches critical paths..."

CHANGED_FILES=$(git diff --name-only origin/main...HEAD)

CRITICAL_TOUCHED=false

for path in "${CRITICAL_PATHS[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "$path"; then
    echo "⚠️  CRITICAL PATH TOUCHED: $path"
    CRITICAL_TOUCHED=true
  fi
done

if [ "$CRITICAL_TOUCHED" = true ]; then
  echo ""
  echo "🚨 This PR touches CRITICAL PATHS!"
  echo "📋 Please ensure:"
  echo "   1. Fluxo A (Cadastro → Senha → Login) was manually tested"
  echo "   2. Fluxo B (Funcionário → Lote → Emissão) was manually tested"
  echo "   3. At least 2 reviewers approved this PR"
  echo ""

  # Adicionar label automaticamente
  gh pr edit --add-label "critical-path"

  exit 0
else
  echo "✅ No critical paths touched"
fi
```

---

## Quick Setup Commands

```bash
# Criar CODEOWNERS
mkdir -p .github
cat > .github/CODEOWNERS << 'EOF'
/app/api/auth/** @tech-lead
/lib/tomador-activation.ts @tech-lead
EOF

# Criar PR template
cat > .github/PULL_REQUEST_TEMPLATE.md << 'EOF'
## Descrição
...
EOF

# Tornar script executável
chmod +x .github/scripts/check-critical-paths.sh
```

---

## Manual Verification

Após configurar branch protection, teste:

```bash
# 1. Criar branch de teste
git checkout -b test-branch-protection

# 2. Fazer commit direto em main (deve falhar)
git checkout main
echo "test" >> README.md
git commit -am "test direct commit"
git push origin main
# ❌ Deve ser rejeitado pelo GitHub

# 3. Fazer PR sem CI verde (deve bloquear merge)
# Abra PR no GitHub e tente fazer merge sem CI passar
# ❌ Botão "Merge" deve estar desabilitado
```
