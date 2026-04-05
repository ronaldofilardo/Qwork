#!/bin/bash
# ==========================================
# SCRIPT: Preparação de Dump para Restore
# Descrição: Remove policies incorretas do dump ANTES de restore
# Data: 04/02/2026
# Uso: ./pre-restore-dump-cleanup.sh <arquivo-dump.sql>
# ==========================================

set -e

DUMP_FILE=$1
BACKUP_FILE="${DUMP_FILE}.backup-$(date +%Y%m%d-%H%M%S)"

if [ -z "$DUMP_FILE" ]; then
  echo "❌ Uso: $0 <arquivo-dump.sql>"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Arquivo não encontrado: $DUMP_FILE"
  exit 1
fi

echo "🔍 Processando: $DUMP_FILE"
echo "💾 Backup criado: $BACKUP_FILE"

# Criar backup
cp "$DUMP_FILE" "$BACKUP_FILE"

echo "🧹 Removendo policies incorretas..."

# Remover blocos de policies admin_all_*
sed -i.tmp '/-- Name: .* admin_all_.*; Type: POLICY/,/^$/d' "$DUMP_FILE"

# Remover CREATE POLICY admin_all_*
sed -i.tmp '/CREATE POLICY admin_all_/d' "$DUMP_FILE"
sed -i.tmp '/CREATE POLICY clinicas_admin_all/d' "$DUMP_FILE"
sed -i.tmp '/CREATE POLICY tomadores_admin_all/d' "$DUMP_FILE"
sed -i.tmp '/CREATE POLICY lotes_emissor_select/d' "$DUMP_FILE"

# Remover COMMENTS sobre policies removidas
sed -i.tmp '/COMMENT ON POLICY admin_all_/d' "$DUMP_FILE"

# Remover policy admin_restricted_funcionarios (muito permissiva)
sed -i.tmp '/CREATE POLICY admin_restricted_funcionarios/d' "$DUMP_FILE"

# Corrigir avaliacoes_own_update removendo 'admin' da lista
sed -i.tmp "s/ARRAY\['admin'::text, 'rh'::text, 'emissor'::text\]/ARRAY['rh'::text, 'gestor'::text]/g" "$DUMP_FILE"

rm -f "${DUMP_FILE}.tmp"

echo "✅ Dump limpo e pronto para restore!"
echo ""
echo "📋 Próximos passos:"
echo "1. psql -d database_name -f $DUMP_FILE"
echo "2. psql -d database_name -f scripts/cleanup-dump-policies.sql (validação adicional)"
echo "3. psql -d database_name -f database/migrations/301_remove_admin_emissor_incorrect_permissions.sql"
echo ""
echo "⚠️ Para reverter: cp $BACKUP_FILE $DUMP_FILE"
