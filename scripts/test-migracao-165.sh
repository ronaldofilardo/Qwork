#!/bin/bash
# Script para rodar testes da migração 165

cd /c/apps/QWork

echo "========================================"
echo "Testando Migração 165 - Trigger Fix"
echo "========================================"

# Rodar testes específicos
npm run test -- __tests__/database/migracao-165-trigger-fix.test.ts --no-coverage --verbose 2>&1 | tail -200

echo ""
echo "========================================"
echo "Testando Integração Conclusão 165"
echo "========================================"

npm run test -- __tests__/api/avaliacao/conclusao-migracao-165.test.ts --no-coverage --verbose 2>&1 | tail -200
