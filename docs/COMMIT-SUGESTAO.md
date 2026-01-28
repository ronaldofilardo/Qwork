# Sugestão de Commit Message

## Opção 1: Commit Único Completo

```
chore: Higienização completa do projeto - organização de arquivos

- Criada estrutura organizada para documentação em /docs
  - /docs/policies (convenções e políticas)
  - /docs/guides (guias práticos)
  - /docs/corrections (relatórios de correções)

- Reorganizados scripts por categoria em /scripts
  - /scripts/checks (verificações e diagnóstico)
  - /scripts/tests (testes ad-hoc)
  - /scripts/fixes (correções pontuais)
  - /scripts/analysis (análises e relatórios)

- Movidas migrações para /database/migrations

- Removidos arquivos obsoletos:
  - 12 arquivos temporários (temp_*, temp-*)
  - 3 arquivos backup (*.bak)
  - 4 testes duplicados

- Atualizado .gitignore para prevenir commits de arquivos temporários

- Atualizados READMEs e documentação com nova estrutura

- Atualizado copilot-instructions.md com convenções de organização

BREAKING CHANGE: Scripts movidos do root para subpastas organizadas.
Refs nos package.json scripts já foram validados.

Ver: LIMPEZA-2025-12-24.md para detalhes completos.
```

## Opção 2: Commits Separados

### Commit 1: Organização de Documentação

```
docs: Organizar documentação em pastas temáticas

- Criadas pastas policies/, guides/, corrections/ em /docs
- Movidos arquivos de convenções e políticas
- Criado README-ORGANIZACAO.md

Facilita navegação e manutenção da documentação.
```

### Commit 2: Organização de Scripts

```
chore: Reorganizar scripts em subpastas por categoria

- Criadas subpastas checks/, tests/, fixes/, analysis/
- Movidos ~50 scripts do root para pastas apropriadas
- Criado README-ORGANIZACAO.md em /scripts

Melhora organização e descoberta de scripts utilitários.
```

### Commit 3: Limpeza de Arquivos

```
chore: Remover arquivos temporários e obsoletos

- Removidos 12 arquivos temporários (temp_*, temp-*)
- Removidos 3 arquivos backup (*.bak)
- Removidos 4 testes duplicados
- Atualizado .gitignore

Limpa projeto de arquivos desnecessários.
```

### Commit 4: Atualização de Documentação

```
docs: Atualizar documentação com nova estrutura

- Atualizado README.md com seção de organização
- Atualizado copilot-instructions.md
- Criado LIMPEZA-2025-12-24.md com resumo completo

Documenta mudanças e facilita onboarding.
```

## Recomendação

**Use a Opção 1 (commit único)** se quiser manter o histórico limpo e atômico.

**Use a Opção 2 (commits separados)** se quiser maior granularidade no histórico e facilitar code review.

## Comandos Git

### Opção 1 (Único Commit)

```bash
git add .
git commit -F .git/COMMIT_EDITMSG
# Cole a mensagem da Opção 1
git push origin main
```

### Opção 2 (Commits Separados)

```bash
# Commit 1
git add docs/
git commit -m "docs: Organizar documentação em pastas temáticas"

# Commit 2
git add scripts/ database/migrations/
git commit -m "chore: Reorganizar scripts em subpastas por categoria"

# Commit 3
git add .gitignore
git commit -m "chore: Remover arquivos temporários e obsoletos"

# Commit 4
git add README.md docs/ LIMPEZA-2025-12-24.md
git commit -m "docs: Atualizar documentação com nova estrutura"

git push origin main
```

## Próximos Passos Após Commit

1. ✅ Validar que os testes ainda passam

   ```bash
   pnpm test
   ```

2. ✅ Validar que scripts organizados ainda funcionam

   ```bash
   node scripts/checks/check-db-status.cjs
   ```

3. ✅ Comunicar equipe sobre nova estrutura

4. ✅ Atualizar documentação do projeto se necessário

5. ✅ Manter disciplina: não commitar arquivos temp\__ ou _.bak
