#!/bin/bash
# ==============================================================================
# Script de Verificação de Padrões Proibidos em Testes
# Implementa validações da Política de Qualidade de Código em Testes
# @see docs/testing/QUALITY-POLICY.md
# ==============================================================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Verificando padrões proibidos em testes (QUALITY-POLICY.md)..."
echo ""

EXIT_CODE=0

# ==============================================================================
# 1. Verifica @ts-nocheck sem justificativa (Issue #XXXX ou Ticket:)
# ==============================================================================
echo "📋 [1/5] Verificando @ts-nocheck sem justificativa..."

NOCHECK_FILES=$(grep -rl "@ts-nocheck" __tests__/ 2>/dev/null || true)

if [ -n "$NOCHECK_FILES" ]; then
  echo -e "${YELLOW}⚠️  Arquivos com @ts-nocheck encontrados:${NC}"
  
  for file in $NOCHECK_FILES; do
    # Verifica se tem justificativa (Issue #, Ticket:, JIRA-)
    if ! grep -q "Issue #\|Ticket:\|JIRA-" "$file"; then
      echo -e "${RED}   ❌ $file - SEM JUSTIFICATIVA${NC}"
      echo -e "      ${YELLOW}Adicione comentário: // @ts-nocheck - Issue #XXXX: motivo${NC}"
      EXIT_CODE=1
    else
      echo -e "${GREEN}   ✓ $file - com justificativa${NC}"
    fi
  done
else
  echo -e "${GREEN}✅ Nenhum @ts-nocheck encontrado${NC}"
fi

echo ""

# ==============================================================================
# 2. Conta uso excessivo de 'any' em testes (limite: 50 ocorrências totais)
# ==============================================================================
echo "📋 [2/5] Verificando uso de 'any'..."

ANY_COUNT=$(grep -r ": any" __tests__/ 2>/dev/null | wc -l || echo 0)
ANY_LIMIT=50

if [ "$ANY_COUNT" -gt "$ANY_LIMIT" ]; then
  echo -e "${RED}❌ Uso excessivo de 'any' em testes: $ANY_COUNT ocorrências (limite: $ANY_LIMIT)${NC}"
  echo -e "${YELLOW}   Top 5 arquivos com mais 'any':${NC}"
  grep -r ": any" __tests__/ 2>/dev/null | cut -d: -f1 | sort | uniq -c | sort -rn | head -5
  echo -e "${YELLOW}   Ação: Substituir 'any' por tipos explícitos ou 'unknown'${NC}"
  EXIT_CODE=1
else
  echo -e "${GREEN}✅ Uso de 'any' dentro do limite: $ANY_COUNT/$ANY_LIMIT${NC}"
fi

echo ""

# ==============================================================================
# 3. Verifica require() em arquivos TypeScript
# ==============================================================================
echo "📋 [3/5] Verificando require() em arquivos .ts/.tsx..."

REQUIRE_FILES=$(grep -rl "require(" __tests__/ | grep -E "\.(ts|tsx)$" || true)

if [ -n "$REQUIRE_FILES" ]; then
  echo -e "${RED}❌ Arquivos com require() encontrados (use import):${NC}"
  echo "$REQUIRE_FILES" | while read -r file; do
    echo -e "${RED}   ❌ $file${NC}"
    grep -n "require(" "$file" | head -3
  done
  echo -e "${YELLOW}   Ação: Substituir require() por import${NC}"
  EXIT_CODE=1
else
  echo -e "${GREEN}✅ Nenhum require() em arquivos TypeScript${NC}"
fi

echo ""

# ==============================================================================
# 4. Verifica funções async sem await
# ==============================================================================
echo "📋 [4/5] Verificando async sem await..."

# Busca funções async que não têm await no corpo
ASYNC_NO_AWAIT=$(grep -rn "async\s*(" __tests__/ 2>/dev/null | while read -r match; do
  file=$(echo "$match" | cut -d: -f1)
  line=$(echo "$match" | cut -d: -f2)
  
  # Verifica se há await nas próximas 10 linhas
  if ! sed -n "${line},$((line + 10))p" "$file" | grep -q "await"; then
    # Verifica se não tem comentário justificativo
    if ! sed -n "${line},$((line + 2))p" "$file" | grep -q "async intencional"; then
      echo "$file:$line"
    fi
  fi
done || true)

if [ -n "$ASYNC_NO_AWAIT" ]; then
  echo -e "${YELLOW}⚠️  Funções async sem await encontradas:${NC}"
  echo "$ASYNC_NO_AWAIT" | while read -r location; do
    echo -e "${YELLOW}   ⚠️  $location${NC}"
  done
  echo -e "${YELLOW}   Ação: Remover 'async' ou adicionar comentário '// async intencional: motivo'${NC}"
  # Não bloqueia (warning only)
else
  echo -e "${GREEN}✅ Funções async verificadas${NC}"
fi

echo ""

# ==============================================================================
# 5. Relatório de métricas de qualidade
# ==============================================================================
echo "📋 [5/5] Gerando métricas de qualidade..."

TOTAL_TESTS=$(find __tests__/ -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
TOTAL_LINES=$(find __tests__/ -name "*.test.ts" -o -name "*.test.tsx" -exec wc -l {} + | tail -1 | awk '{print $1}')

echo -e "${GREEN}📊 Métricas:${NC}"
echo "   • Total de arquivos de teste: $TOTAL_TESTS"
echo "   • Total de linhas: $TOTAL_LINES"
echo "   • Ocorrências de 'any': $ANY_COUNT"
echo "   • Arquivos com @ts-nocheck: $(echo "$NOCHECK_FILES" | wc -w)"

echo ""

# ==============================================================================
# Resultado Final
# ==============================================================================
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Verificação de padrões aprovada!${NC}"
  echo -e "${GREEN}   Todos os testes estão em conformidade com QUALITY-POLICY.md${NC}"
else
  echo -e "${RED}❌ Verificação falhou - Correções necessárias${NC}"
  echo -e "${YELLOW}   📖 Consulte: docs/testing/QUALITY-POLICY.md${NC}"
fi

exit $EXIT_CODE
