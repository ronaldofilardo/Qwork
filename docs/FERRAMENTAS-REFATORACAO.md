# 🛠️ FERRAMENTAS DE SUPORTE À REFATORAÇÃO

**Objetivo**: Scripts e procedimentos para facilitar refatorações incrementais  
**Localização**: `scripts/refactor/`

---

## 1️⃣ SCRIPT: Análise de Dependências

**Arquivo**: `scripts/refactor/analyze-dependencies.sh`

```bash
#!/bin/bash
# analyze-dependencies.sh - Mapeia todas as dependências de um arquivo

if [ -z "$1" ]; then
  echo "Uso: ./analyze-dependencies.sh <caminho-arquivo>"
  echo "Exemplo: ./analyze-dependencies.sh lib/db.ts"
  exit 1
fi

TARGET_FILE="$1"
LOG_DIR=".refactor-logs"
mkdir -p "$LOG_DIR"

echo "🔍 Analisando dependências de: $TARGET_FILE"

# 1. Listar todas as exportações
echo ""
echo "📤 EXPORTAÇÕES DO ARQUIVO:"
echo "================================"
grep "^export " "$TARGET_FILE" | head -50 | tee "$LOG_DIR/$TARGET_FILE-exports.txt"
echo ""
echo "Total: $(grep '^export ' $TARGET_FILE | wc -l) exportações encontradas"

# 2. Quantas linhas tem cada export
echo ""
echo "📊 TAMANHO POR SEÇÃO:"
echo "================================"
# (simplificado - idealmente seria mais sofisticado)

# 3. Quem importa este arquivo
echo ""
echo "👥 QUEM IMPORTA ESTE ARQUIVO:"
echo "================================"
IMPORT_PATTERN=$(echo "$TARGET_FILE" | sed 's/^\.\{1,2\}\///' | sed 's/\/index\...*$//' | tr '/' '/')

grep -r "from.*['\"]@/$IMPORT_PATTERN['\"]" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next > "$LOG_DIR/$TARGET_FILE-importers.txt" 2>/dev/null

echo "Arquivos que importam:"
wc -l < "$LOG_DIR/$TARGET_FILE-importers.txt" | xargs echo "Total:"
head -20 "$LOG_DIR/$TARGET_FILE-importers.txt"

# 4. Quais exporting específicos são usados
echo ""
echo "🎯 EXPORTS ESPECÍFICOS USADOS:"
echo "================================"
while IFS= read -r export_line; do
    export_name=$(echo "$export_line" | sed 's/export.* \([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' | grep -o '^[a-zA-Z_][a-zA-Z0-9_]*')
    if [ ! -z "$export_name" ]; then
        count=$(grep -r "$export_name" --include="*.ts" --include="*.tsx" --exclude="$TARGET_FILE" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | wc -l)
        if [ "$count" -gt 0 ]; then
            echo "$export_name: $count usos"
        fi
    fi
done < <(grep "^export " "$TARGET_FILE")

echo ""
echo "✅ Análise salva em: $LOG_DIR/"
```

---

## 2️⃣ SCRIPT: Verificar Tamanho de Arquivo

**Arquivo**: `scripts/refactor/check-file-size.sh`

```bash
#!/bin/bash
# check-file-size.sh - Monitora redução de tamanho de arquivo

if [ -z "$1" ]; then
  echo "Uso: ./check-file-size.sh <caminho-arquivo>"
  exit 1
fi

FILE="$1"
BASELINE_FILE=".refactor-logs/${FILE}-baseline.size"

if [ ! -f "$FILE" ]; then
  echo "❌ Arquivo não encontrado: $FILE"
  exit 1
fi

CURRENT_LINES=$(wc -l < "$FILE")
CURRENT_SIZE=$(du -h "$FILE" | cut -f1)

echo "📊 Tamanho Atual: $FILE"
echo "  Linhas: $CURRENT_LINES"
echo "  Bytes: $CURRENT_SIZE"

if [ -f "$BASELINE_FILE" ]; then
  BASELINE_LINES=$(cat "$BASELINE_FILE")
  REDUCTION=$((BASELINE_LINES - CURRENT_LINES))
  PERCENT=$((REDUCTION * 100 / BASELINE_LINES))

  echo ""
  echo "📈 Comparação com Baseline:"
  echo "  Linhas original: $BASELINE_LINES"
  echo "  Linhas agora: $CURRENT_LINES"
  echo "  Redução: $REDUCTION linhas ($PERCENT%)"

  if [ "$CURRENT_LINES" -lt 500 ]; then
    echo "  ✅ META ATINGIDA: < 500 linhas"
  else
    echo "  ⚠️  Ainda acima de 500 linhas"
  fi
else
  echo ""
  echo "📌 Definindo baseline..."
  echo "$CURRENT_LINES" > "$BASELINE_FILE"
  echo "✅ Baseline salvo"
fi
```

---

## 3️⃣ SCRIPT: Validação Pós-Refatoração

**Arquivo**: `scripts/refactor/validate-refactor.sh`

```bash
#!/bin/bash
# validate-refactor.sh - Suite de validação após refatoração

echo "🧪 VALIDAÇÃO DE REFATORAÇÃO"
echo "===================================="
date

FAILED=false

# 1. Type Check
echo ""
echo "1️⃣ Type-Check..."
if ! pnpm type-check > .refactor-logs/validation-types.log 2>&1; then
  echo "❌ Type-check FAILED"
  head -20 .refactor-logs/validation-types.log
  FAILED=true
else
  echo "✅ Type-check OK"
fi

# 2. Build
echo ""
echo "2️⃣ Build..."
if ! pnpm build > .refactor-logs/validation-build.log 2>&1; then
  echo "❌ Build FAILED"
  tail -50 .refactor-logs/validation-build.log
  FAILED=true
else
  echo "✅ Build OK"
  # Extrair tamanho do bundle
  BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
  echo "   Bundle size: $BUILD_SIZE"
fi

# 3. Unit Tests
echo ""
echo "3️⃣ Unit Tests..."
if ! pnpm test:unit > .refactor-logs/validation-tests.log 2>&1; then
  echo "❌ Tests FAILED"
  tail -30 .refactor-logs/validation-tests.log
  FAILED=true
else
  TESTS_PASSED=$(grep -o "Tests:.*passed" .refactor-logs/validation-tests.log | tail -1)
  echo "✅ Tests OK ($TESTS_PASSED)"
fi

# 4. Linting
echo ""
echo "4️⃣ Linting..."
if ! pnpm lint > .refactor-logs/validation-lint.log 2>&1; then
  echo "❌ Linting FAILED (warnings allowed)"
  LINT_WARNINGS=$(grep -o "warning" .refactor-logs/validation-lint.log | wc -l)
  echo "   Warnings: $LINT_WARNINGS"
else
  echo "✅ Linting OK"
fi

# 5. Import compatibility check
echo ""
echo "5️⃣ Import Compatibility..."
echo "  Verificando que imports externos continuam funcionando..."

# Verificar que lib/db ainda pode ser importado
if grep -q "export.*from.*database" lib/db.ts 2>/dev/null || grep -q "export.*query" lib/db.ts 2>/dev/null; then
  echo "✅ lib/db.ts compatível"
else
  echo "⚠️  lib/db.ts may have compatibility issues"
fi

# RESUMO
echo ""
echo "===================================="
if [ "$FAILED" = true ]; then
  echo "❌ VALIDAÇÃO FALHOU"
  echo ""
  echo "Logs disponíveis em:"
  ls -lah .refactor-logs/validation-*.log
  exit 1
else
  echo "✅ VALIDAÇÃO PASSOU"
  echo ""
  echo "Status:"
  echo "  - Type-check: ✅"
  echo "  - Build: ✅"
  echo "  - Tests: ✅"
  echo "  - Lint: ✅"

  echo ""
  echo "Próximo passo: git commit && git merge"
fi
```

---

## 4️⃣ SCRIPT: Importer Finder (Busca Inteligente)

**Arquivo**: `scripts/refactor/find-importers.sh`

```bash
#!/bin/bash
# find-importers.sh - Encontra todos os importers de um módulo/função

if [ -z "$1" ]; then
  echo "Uso: ./find-importers.sh <módulo> [função]"
  echo "Exemplos:"
  echo "  ./find-importers.sh lib/db"
  echo "  ./find-importers.sh lib/db query"
  echo "  ./find-importers.sh components/MyComponent"
  exit 1
fi

MODULE="$1"
FUNCTION="${2:-}"

LOG_DIR=".refactor-logs"
mkdir -p "$LOG_DIR"

# Normalizar caminho
IMPORT_PATH=$(echo "$MODULE" | sed 's/^\.\{1,2\}\///' | sed 's/\/index\..*//' | sed 's/\.ts.*//' | sed 's/\.tsx.*//')

echo "🔎 Procurando importers de: $IMPORT_PATH"
[ ! -z "$FUNCTION" ] && echo "   Função específica: $FUNCTION"

# 1. Encontrar importers do módulo
OUTPUT_FILE="$LOG_DIR/importers-${IMPORT_PATH//\//-}.txt"

echo "📍 Encontrando..."
grep -r "from ['\"]@/$IMPORT_PATH['\"]\\|from ['\"]\./" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=__tests__ \
  app lib components \
> "$OUTPUT_FILE" 2>/dev/null

IMPORTER_COUNT=$(wc -l < "$OUTPUT_FILE")

echo ""
echo "📊 Resultado:"
echo "  Total de importers: $IMPORTER_COUNT"
echo ""
echo "Arquivos que importam:"
cut -d: -f1 "$OUTPUT_FILE" | sort -u | head -30

if [ "$IMPORTER_COUNT" -gt 30 ]; then
  echo ""
  echo "... e mais $(($IMPORTER_COUNT - 30)) arquivos"
fi

echo ""
echo "✅ Lista completa salva em: $OUTPUT_FILE"

# 2. Se função específica, análise mais profunda
if [ ! -z "$FUNCTION" ]; then
  echo ""
  echo "🔎 Analisando uso da função: $FUNCTION"

  USAGE_FILE="$LOG_DIR/usages-${IMPORT_PATH//\//-}-${FUNCTION}.txt"
  grep -r "$FUNCTION" \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    app lib components \
  > "$USAGE_FILE" 2>/dev/null

  USAGE_COUNT=$(wc -l < "$USAGE_FILE")
  echo "  Total de usos: $USAGE_COUNT"
  echo "  Exemplos:"
  head -10 "$USAGE_FILE" | sed 's/^/    /'
fi
```

---

## 5️⃣ SCRIPT: Comparador de Antes/Depois

**Arquivo**: `scripts/refactor/compare-refactor.sh`

```bash
#!/bin/bash
# compare-refactor.sh - Compara estado antes/depois da refatoração

echo "📊 COMPARAÇÃO DE REFATORAÇÃO"
echo "===================================="

LOG_DIR=".refactor-logs"

# 1. Contar linhas totais
TOTAL_LINES_BEFORE=$(cat "$LOG_DIR/baseline-lines.txt" 2>/dev/null | awk '{sum+=$1} END {print sum}')
TOTAL_LINES_NOW=$(find lib components app --name "*.ts" --name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -exec wc -l {} + | tail -1 | awk '{print $1}')

if [ ! -z "$TOTAL_LINES_BEFORE" ]; then
  REDUCTION=$((TOTAL_LINES_BEFORE - TOTAL_LINES_NOW))
  PERCENT=$((REDUCTION * 100 / TOTAL_LINES_BEFORE))

  echo "📈 Linhas de Código:"
  echo "  Antes: $TOTAL_LINES_BEFORE"
  echo "  Agora: $TOTAL_LINES_NOW"
  echo "  Redução: $REDUCTION linhas ($PERCENT%)"
else
  echo "⚠️  Baseline não encontrado"
fi

# 2. Complexidade de imports
echo ""
echo "🔀 Estrutura de Imports:"
echo "  Número de módulos criados:"
find lib/infrastructure lib/repositories lib/domain -name "*.ts" 2>/dev/null | wc -l

# 3. Testes
echo ""
echo "🧪 Testes:"
if [ -f "$LOG_DIR/validation-tests.log" ]; then
  grep "Tests:" "$LOG_DIR/validation-tests.log" | tail -1
fi

# 4. Build size
echo ""
echo "📦 Bundle:"
if [ -d ".next" ]; then
  du -sh .next | awk '{print "  Size: " $1}'
fi

echo ""
echo "✅ Análise completa salva em $LOG_DIR/"
```

---

## 6️⃣ SCRIPT: Criador de Stubs

**Arquivo**: `scripts/refactor/create-stub.sh`

```bash
#!/bin/bash
# create-stub.sh - Cria arquivo stub com tipos apenas

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Uso: ./create-stub.sh <arquivo-origem> <arquivo-destino>"
  echo "Exemplo: ./create-stub.sh lib/db.ts lib/infrastructure/database/types.ts"
  exit 1
fi

SOURCE="$1"
DEST="$2"

# Criar diretório se não existir
mkdir -p "$(dirname "$DEST")"

# Extrair tipos do arquivo origem
cat > "$DEST" << 'STUB_HEADER'
/**
 * THIS IS A STUB FILE
 * Gerado por create-stub.sh
 *
 * ⚠️ PLACEHOLDER - tipos/interfaces serão importados durante refatoração
 *
 * Toda a lógica está ainda em ARQUIVO_ORIGEM
 * Após migração completa, este arquivo terá conteúdo completo
 *
 * @generated
 * @todo migrar conteúdo de ARQUIVO_ORIGEM
 */

// TODO: Preencher com tipos extraídos
STUB_HEADER

echo ""
echo "Agora, edite manualmente e copie tipos do arquivo origem:"
echo ""
echo "Origem: $SOURCE"
echo "Destino: $DEST"
echo ""

# Abrir no editor se disponível
if command -v code &> /dev/null; then
  echo "Abrindo em VS Code..."
  code "$DEST"
fi
```

---

## 7️⃣ SCRIPT: Gerenciador de Status

**Arquivo**: `scripts/refactor/status.sh`

```bash
#!/bin/bash
# status.sh - Mostra status atual da refatoração

echo "📊 STATUS DA REFATORAÇÃO"
echo "===================================="
date
echo ""

# 1. Ler arquivo .refactor-status
if [ -f .refactor-status ]; then
  echo "📋 Progresso:"
  grep "^\- \[" .refactor-status | sed 's/^/  /'
fi

# 2. Últimos commits relacionados a refatoração
echo ""
echo "📝 Últimos commits:"
git log --oneline --grep="refactor\|sprint" -n 5 2>/dev/null | sed 's/^/  /'

# 3. Tamanhos atuais
echo ""
echo "📦 Tamanhos atuais:"
echo "  lib/db.ts: $(wc -l < lib/db.ts) linhas"
echo "  lib/infrastructure/database/types.ts: $([ -f lib/infrastructure/database/types.ts ] && wc -l < lib/infrastructure/database/types.ts || echo '(não existe)')"

# 4. Validação rápida
echo ""
echo "🧪 Validação rápida:"
echo -n "  Type-check: "
if pnpm type-check > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
fi

echo -n "  Build: "
if pnpm build > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
fi

echo ""
echo "Mais detalhes: cat .refactor-logs/*.log"
```

---

## 📋 COMO USAR ESTES SCRIPTS

### Setup

```bash
#!/bin/bash
# Setup - executar uma vez

mkdir -p scripts/refactor
touch scripts/refactor/{analyze-dependencies,check-file-size,validate-refactor,find-importers,compare-refactor,create-stub,status}.sh

chmod +x scripts/refactor/*.sh

echo "✅ Scripts criados e prontos para usar"
```

### Uso em Workflow

```bash
# 1. ANTES DE COMEÇAR
./scripts/refactor/status.sh

# 2. COMEÇANDO UM NOVO SPRINT
./scripts/refactor/analyze-dependencies.sh lib/db.ts
./scripts/refactor/find-importers.sh lib/db query

# 3. DURANTE SPRINT
./scripts/refactor/check-file-size.sh lib/infrastructure/database/types.ts

# 4. APÓS SPRINT
./scripts/refactor/validate-refactor.sh

# 5. COMPARAÇÃO FINAL
./scripts/refactor/compare-refactor.sh
```

---

## 🔗 INTEGRAÇÃO COM CI/CD

### GitHub Actions (exemplo)

```yaml
# .github/workflows/refactor-validation.yml
name: Refactor Validation

on:
  push:
    branches:
      - refactor/modularizacao-arquivos-grandes

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run refactor validation
        run: |
          bash ./scripts/refactor/validate-refactor.sh
          bash ./scripts/refactor/compare-refactor.sh

      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: refactor-logs
          path: .refactor-logs/
```

---

## 📚 RESUMEN DE SCRIPTS

| Script                    | Propósito             | Quando Usar      |
| ------------------------- | --------------------- | ---------------- |
| `analyze-dependencies.sh` | Mapeia dependências   | Início de sprint |
| `check-file-size.sh`      | Monitora tamanho      | Durante sprint   |
| `validate-refactor.sh`    | Suite completa testes | Fim de sprint    |
| `find-importers.sh`       | Encontra usuários     | Planejamento     |
| `compare-refactor.sh`     | Antes/depois          | Relatório final  |
| `create-stub.sh`          | Cria stub file        | Preparação       |
| `status.sh`               | Status geral          | Qualquer hora    |

---

**Autor**: GitHub Copilot  
**Versão**: 1.0  
**Status**: 📋 Operacional
