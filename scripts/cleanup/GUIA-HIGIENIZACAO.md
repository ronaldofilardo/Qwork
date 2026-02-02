# 🧹 Guia de Higienização do Diretório /scripts

**Data:** 31 de janeiro de 2026  
**Versão:** 1.0

## 📖 Visão Geral

Este guia contém ferramentas e procedimentos para higienizar e organizar o diretório `/scripts` do projeto QWork. A higienização move scripts dispersos na raiz para diretórios organizados por categoria.

## 🎯 Objetivos

1. ✅ Organizar ~150+ arquivos dispersos na raiz
2. ✅ Consolidar scripts similares em diretórios apropriados
3. ✅ Identificar e remover duplicados
4. ✅ Padronizar nomenclatura e estrutura
5. ✅ Melhorar manutenibilidade do projeto

## 📁 Estrutura Alvo

Após a higienização, os scripts estarão organizados em:

```
scripts/
├── admin/              # Scripts administrativos
├── analysis/           # Scripts de análise e relatórios
├── archive/            # Arquivos históricos/arquivados
├── backfill/           # Scripts de backfill de dados
├── batch/              # Scripts de processamento em lote
├── checks/             # ✨ Scripts de verificação e validação
├── ci/                 # Scripts de CI/CD
├── cleanup/            # 🆕 Scripts de limpeza e manutenção
├── database/           # Scripts relacionados a banco de dados
│   └── sql/            # Arquivos SQL organizados
├── debug/              # ✨ Scripts de debugging
├── diagnostics/        # ✨ Scripts de diagnóstico
├── fixes/              # Scripts de correção
├── migrations/         # ✨ Scripts de migração
├── powershell/         # Scripts PowerShell
├── security/           # Scripts de segurança
├── temp/               # ✨ Arquivos temporários
├── tests/              # ✨ Scripts de teste ad-hoc
├── tools/              # Ferramentas utilitárias
├── updates/            # Scripts de atualização
└── verification/       # Scripts de verificação
```

**Legenda:**

- ✨ Diretórios que receberão mais arquivos durante a higienização
- 🆕 Novo diretório criado para organização

## 🛠️ Ferramentas Disponíveis

### 1. 📋 Análise de Higienização

**Arquivo:** `cleanup/ANALISE-HIGIENIZACAO.md`

Documento completo com:

- Análise detalhada dos arquivos existentes
- Identificação de duplicados
- Plano de ação por fase
- Estatísticas e recomendações

**Como usar:**

```powershell
# Abrir e revisar o documento
code scripts/cleanup/ANALISE-HIGIENIZACAO.md
```

### 2. 🔍 Identificador de Duplicados

**Arquivo:** `cleanup/identificar-duplicados.ps1`

Analisa e identifica arquivos duplicados (mesmo nome, extensões diferentes).

**Como usar:**

```powershell
# Executar análise de duplicados
cd c:\apps\QWork
.\scripts\cleanup\identificar-duplicados.ps1

# Gera relatório em: cleanup/duplicates-report.json
```

**Saída esperada:**

- Lista de duplicados encontrados
- Comparação de conteúdo (idêntico vs diferente)
- Recomendações de qual versão manter
- Relatório JSON detalhado

### 3. 🧹 Script de Higienização Automatizada

**Arquivo:** `cleanup/higienizar-scripts.ps1`

Move arquivos da raiz para diretórios organizados.

**Como usar:**

#### Modo Dry Run (Simulação - RECOMENDADO PRIMEIRO)

```powershell
# Simula a movimentação SEM mover arquivos
.\scripts\cleanup\higienizar-scripts.ps1 -DryRun

# Com verbose para mais detalhes
.\scripts\cleanup\higienizar-scripts.ps1 -DryRun -Verbose
```

#### Modo Execução Real

```powershell
# Move arquivos de fato
.\scripts\cleanup\higienizar-scripts.ps1

# Sobrescreve arquivos existentes se houver conflito
.\scripts\cleanup\higienizar-scripts.ps1 -Force
```

**Fases executadas:**

1. Scripts de CHECK → `/checks/`
2. Scripts de DEBUG → `/debug/`
3. Scripts de DIAGNÓSTICO → `/diagnostics/`
4. Scripts de TEST → `/tests/`
5. Arquivos TEMPORÁRIOS → `/temp/`
6. Scripts de MIGRAÇÃO → `/migrations/`
7. Scripts de FIX → `/fixes/`
8. Scripts de BACKFILL → `/backfill/`
9. Scripts de BATCH → `/batch/`
10. Scripts SQL → `/database/sql/`
11. Outros DATABASE → `/database/`

## 📝 Procedimento Recomendado

### Passo 1: Backup

```powershell
# Criar backup do diretório scripts
cd c:\apps\QWork
Copy-Item -Path "scripts" -Destination "scripts-backup-$(Get-Date -Format 'yyyyMMdd')" -Recurse
```

### Passo 2: Análise Inicial

```powershell
# 1. Revisar análise completa
code scripts/cleanup/ANALISE-HIGIENIZACAO.md

# 2. Identificar duplicados
.\scripts\cleanup\identificar-duplicados.ps1

# 3. Revisar relatório de duplicados
code scripts/cleanup/duplicates-report.json
```

### Passo 3: Simulação

```powershell
# Executar dry run para ver o que será movido
.\scripts\cleanup\higienizar-scripts.ps1 -DryRun

# Revisar saída cuidadosamente
```

### Passo 4: Execução

```powershell
# Executar higienização real
.\scripts\cleanup\higienizar-scripts.ps1

# Verificar resultado
Write-Host "Arquivos movidos com sucesso!"
```

### Passo 5: Verificação

```powershell
# 1. Verificar estrutura de diretórios
Get-ChildItem scripts -Directory | Select-Object Name

# 2. Verificar arquivos restantes na raiz
Get-ChildItem scripts -File | Where-Object { $_.Extension -match '\.(js|ts|cjs|mjs|mts)$' } | Select-Object Name

# 3. Testar scripts críticos
# (executar testes importantes do projeto)
```

### Passo 6: Tratamento de Duplicados

Para cada duplicado identificado:

```powershell
# 1. Comparar conteúdo
code scripts/checks/check-rh-user.cjs
code scripts/checks/check-rh-user.js

# 2. Se idênticos, remover versão menos específica
Remove-Item scripts/checks/check-rh-user.js

# 3. Se diferentes, consolidar em uma versão TypeScript
# (fazer merge manual do código)

# 4. Atualizar imports se necessário
```

### Passo 7: Commit

```powershell
# Adicionar mudanças ao git
git add scripts/
git status

# Commit com mensagem descritiva
git commit -m "chore(scripts): Higienizar e organizar diretório /scripts

- Mover ~100+ arquivos para diretórios apropriados
- Consolidar scripts por categoria (checks, debug, tests, etc)
- Remover arquivos duplicados
- Atualizar estrutura conforme ANALISE-HIGIENIZACAO.md"

# Push (após revisar)
git push
```

## ⚠️ Cuidados Importantes

### ❌ NÃO fazer:

- ❌ Executar sem fazer backup primeiro
- ❌ Pular o modo Dry Run
- ❌ Remover arquivos sem verificar dependências
- ❌ Mover scripts de produção sem testar
- ❌ Fazer commit sem revisar mudanças

### ✅ SEMPRE fazer:

- ✅ Criar backup antes de iniciar
- ✅ Executar Dry Run primeiro
- ✅ Revisar cada fase cuidadosamente
- ✅ Verificar imports e referências
- ✅ Testar scripts críticos após movimentação
- ✅ Documentar mudanças no commit

## 🔧 Resolução de Problemas

### Problema: "Arquivo não encontrado"

**Causa:** Arquivo já foi movido ou não existe  
**Solução:** Ignorar ou verificar se já está no destino correto

### Problema: "Arquivo já existe no destino"

**Causa:** Duplicado ou já foi movido anteriormente  
**Solução:**

```powershell
# Opção 1: Usar -Force para sobrescrever
.\scripts\cleanup\higienizar-scripts.ps1 -Force

# Opção 2: Mover manualmente ou renomear
Move-Item source destination -Force
```

### Problema: "Script não funciona após mover"

**Causa:** Imports relativos quebrados  
**Solução:**

```typescript
// Antes
import { func } from './helper';

// Depois (ajustar caminho)
import { func } from '../helper';
// ou
import { func } from '@/lib/helper';
```

### Problema: "Muitos arquivos para revisar"

**Causa:** Muitas mudanças simultâneas  
**Solução:**

```powershell
# Executar por fases (comentar fases no script)
# Editar higienizar-scripts.ps1 e comentar fases 6-11
# Executar apenas fases 1-5 primeiro
```

## 📊 Estatísticas Esperadas

Após execução completa:

- **~150+** arquivos movidos da raiz
- **~25** scripts de check organizados
- **~10** scripts de debug organizados
- **~15** scripts de test organizados
- **~15** scripts de migração organizados
- **~20** scripts de fix organizados
- **~40** arquivos SQL organizados
- **~10** duplicados identificados

## 📚 Arquivos de Referência

1. **ANALISE-HIGIENIZACAO.md** - Análise completa e plano detalhado
2. **higienizar-scripts.ps1** - Script de higienização automatizada
3. **identificar-duplicados.ps1** - Identificador de duplicados
4. **duplicates-report.json** - Relatório de duplicados (gerado)
5. **GUIA-HIGIENIZACAO.md** - Este guia (você está aqui!)

## 🎓 Melhores Práticas

### Nomenclatura de Scripts

```
✅ BOM:
- check-database.ts
- fix-user-password.ts
- migrate-data-v2.ts

❌ EVITAR:
- check_database.ts (underscore)
- fixUserPassword.ts (camelCase para arquivos)
- migrateDataV2.js (preferir TypeScript)
```

### Organização por Categoria

```
checks/       → Verificações não destrutivas
debug/        → Scripts de debugging temporários
diagnostics/  → Diagnósticos detalhados
fixes/        → Correções e patches
migrations/   → Mudanças de schema/dados
tests/        → Testes ad-hoc (não Jest/Cypress)
```

### Arquivos Temporários

```
temp/         → Apenas arquivos temporários
              → Revisar periodicamente para limpeza
              → Não commitar arquivos críticos aqui
```

## 🆘 Suporte

Se encontrar problemas:

1. Revisar logs do script
2. Verificar [ANALISE-HIGIENIZACAO.md](./ANALISE-HIGIENIZACAO.md)
3. Executar `identificar-duplicados.ps1` novamente
4. Restaurar backup se necessário
5. Abrir issue com detalhes do erro

## ✅ Checklist Final

Após executar a higienização:

- [ ] Backup criado
- [ ] Dry run executado e revisado
- [ ] Higienização executada com sucesso
- [ ] Duplicados identificados e tratados
- [ ] Scripts críticos testados
- [ ] Imports e referências verificados
- [ ] README-ORGANIZACAO.md atualizado
- [ ] Mudanças commitadas e documentadas
- [ ] Backup pode ser removido (após confirmar estabilidade)

---

**Última atualização:** 31 de janeiro de 2026  
**Versão:** 1.0  
**Autor:** Sistema de Higienização Automática QWork
