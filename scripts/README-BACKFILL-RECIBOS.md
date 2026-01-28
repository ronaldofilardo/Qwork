# Script de Backfill de Recibos Retroativos

## 📋 Visão Geral

Script para gerar recibos retroativos para todos os pagamentos confirmados até **30/12/2025** que não possuem recibo associado.

## ✨ Funcionalidades

- ✅ **Idempotente**: Pode ser executado múltiplas vezes sem duplicar recibos
- ✅ **PDF completo**: Gera PDF real com template profissional
- ✅ **Hash SHA-256**: Inclui hash de integridade no rodapé do PDF
- ✅ **Persistência BYTEA**: Salva PDF binário no banco de dados
- ✅ **Backup em disco**: Cria cópia local em `./storage/recibos/`
- ✅ **Notificações**: Cria notificações retroativas para contratantes
- ✅ **Auditoria**: Registra log agregado no sistema de auditoria
- ✅ **Constraint UNIQUE**: Usa constraint de banco para prevenir duplicatas

## 🚀 Como Executar

### Pré-requisitos

1. **Executar migration** primeiro:

   ```bash
   # Execute a migration que adiciona UNIQUE constraint e estende enum
   psql -U postgres -d nr-bps_db -f database/migrations/043_recibos_unique_pagamento_enum_notificacoes.sql
   ```

2. **Verificar ambiente**:

   ```bash
   # Certifique-se de que está no ambiente correto
   echo $DATABASE_URL
   # ou
   echo $NODE_ENV
   ```

3. **(Opcional mas recomendado)**: Antes de executar o backfill, corrija pagamentos que possam ter sido gravados com `valor` unitário ao invés do `valor_total`.

   ```bash
   # Aplicar script seguro para preencher `valor_por_funcionario`, `numero_funcionarios` e recalcular `valor` quando necessário
   psql -U postgres -d nr-bps_db -f scripts/fixes/fix_pagamentos_valor_por_funcionario.sql
   ```

   Isso evita que recibos sejam gerados com valores incorretos (por exemplo, R$20 em vez de R$300 para 15 funcionários).

### Execução em Produção

```bash
# Modo normal (gera e persiste recibos)
node scripts/backfill-recibos-2025.mjs
```

### Execução em Dry-Run (Simulação)

```bash
# Modo dry-run (apenas simula, não persiste)
node scripts/backfill-recibos-2025.mjs --dry-run
```

## 📊 Saída Esperada

```
╔═══════════════════════════════════════════════════════════╗
║   BACKFILL DE RECIBOS RETROATIVOS - 2025                  ║
╚═══════════════════════════════════════════════════════════╝

📋 Buscando pagamentos até 2025-12-30 sem recibo...
✅ Encontrados 15 pagamentos sem recibo

🚀 Iniciando processamento de 15 recibos...

   [1/15] Pagamento 123... ✅ OK - REC-RETRO-2025-00001 (45KB)
   [2/15] Pagamento 124... ✅ OK - REC-RETRO-2025-00002 (48KB)
   [3/15] Pagamento 125... ⏭️  PULADO (já existe)
   [4/15] Pagamento 126... ✅ OK - REC-RETRO-2025-00003 (42KB)
   ...

═══════════════════════════════════════════════════════════
📊 RESUMO DO BACKFILL
═══════════════════════════════════════════════════════════
Total processados:  15
✅ Sucesso:          12
⏭️  Pulados:          2
❌ Falhas:           1

📝 Auditoria registrada com sucesso

✨ Backfill concluído!
```

## 🔍 Verificação Pós-Execução

### 1. Verificar recibos gerados

```sql
-- Contar recibos retroativos
SELECT COUNT(*)
FROM recibos
WHERE numero_recibo LIKE 'REC-RETRO-2025-%';

-- Ver recibos gerados
SELECT
  id,
  numero_recibo,
  contratante_id,
  pagamento_id,
  LENGTH(pdf) as tamanho_pdf,
  hash_pdf,
  backup_path,
  criado_em
FROM recibos
WHERE numero_recibo LIKE 'REC-RETRO-2025-%'
ORDER BY criado_em DESC
LIMIT 10;
```

### 2. Verificar integridade dos PDFs

```sql
-- Usar função de verificação de integridade
SELECT * FROM verificar_integridade_recibo(123);

-- Verificar todos os recibos retroativos
SELECT
  r.id,
  r.numero_recibo,
  v.integro,
  v.hash_armazenado = v.hash_calculado as hashes_conferem
FROM recibos r
CROSS JOIN LATERAL verificar_integridade_recibo(r.id) v
WHERE r.numero_recibo LIKE 'REC-RETRO-2025-%';
```

### 3. Verificar notificações criadas

```sql
-- Contar notificações retroativas
SELECT COUNT(*)
FROM notificacoes
WHERE tipo = 'recibo_gerado_retroativo';

-- Ver notificações
SELECT
  id,
  destinatario_id,
  titulo,
  mensagem,
  link_acao,
  lida,
  criado_em
FROM notificacoes
WHERE tipo = 'recibo_gerado_retroativo'
ORDER BY criado_em DESC
LIMIT 10;
```

### 4. Verificar auditoria

```sql
-- Ver log de auditoria do backfill
SELECT
  id,
  acao,
  usuario_cpf,
  detalhes::jsonb,
  criado_em
FROM auditoria
WHERE acao = 'BACKFILL_RECIBOS_RETROATIVOS'
ORDER BY criado_em DESC
LIMIT 1;
```

### 5. Verificar arquivos em disco

```bash
# Listar arquivos gerados
ls -lh storage/recibos/2025/12-dezembro/recibo-REC-RETRO-*

# Verificar tamanho total
du -sh storage/recibos/2025/12-dezembro/
```

## 🐛 Resolução de Problemas

### Erro: "Constraint violation - duplicate key"

**Causa**: Recibo já existe para o pagamento.

**Solução**: O script é idempotente. Isso é esperado e o recibo será pulado automaticamente.

### Erro: "Permission denied" ao salvar PDF em disco

**Causa**: Pasta `storage/recibos/` não existe ou sem permissão de escrita.

**Solução**:

```bash
mkdir -p storage/recibos/2025/12-dezembro
chmod 755 storage/recibos
```

### Erro: "Cannot find module @/lib/..."

**Causa**: Imports ESM não configurados.

**Solução**:

```bash
# Certifique-se de que package.json tem:
# "type": "module"

# Ou use tsx para executar:
npx tsx scripts/backfill-recibos-2025.mjs
```

### Erro: "Enum tipo_notificacao não inclui 'recibo_gerado_retroativo'"

**Causa**: Migration 043 não foi executada.

**Solução**:

```bash
psql -U postgres -d nr-bps_db -f database/migrations/043_recibos_unique_pagamento_enum_notificacoes.sql
```

## 📝 Logs e Monitoramento

### Logs do script

O script gera logs detalhados no console:

- ✅ Sucesso na geração
- ⏭️ Recibo já existe (pulado)
- ❌ Erro na geração

### Auditoria no banco

Todos os backfills são registrados na tabela `auditoria`:

```sql
SELECT * FROM auditoria
WHERE acao = 'BACKFILL_RECIBOS_RETROATIVOS'
ORDER BY criado_em DESC;
```

## 🧪 Testes

### Executar testes unitários

```bash
pnpm test __tests__/lib/receipt-generator-pdf-hash.test.ts
```

### Executar testes de integração

```bash
pnpm test __tests__/integration/backfill-recibos-retroativos.test.ts
```

### Executar todos os testes relacionados

```bash
pnpm test recibo
```

## 📚 Arquivos Relacionados

- `scripts/backfill-recibos-2025.mjs` - Script principal
- `database/migrations/043_recibos_unique_pagamento_enum_notificacoes.sql` - Migration necessária
- `lib/receipt-generator.ts` - Função de geração de recibos
- `lib/pdf-generator.ts` - Geração de PDF com hash
- `lib/templates/recibo-template.ts` - Template HTML do recibo
- `__tests__/integration/backfill-recibos-retroativos.test.ts` - Testes de integração
- `__tests__/lib/receipt-generator-pdf-hash.test.ts` - Testes unitários

## ⚠️ Avisos Importantes

1. **Execute em ambiente de teste primeiro**: Use `--dry-run` para simular.
2. **Backup do banco**: Faça backup antes de executar em produção.
3. **Migration obrigatória**: Execute a migration 043 antes do script.
4. **Espaço em disco**: Verifique espaço disponível (cada PDF ~40-60KB).
5. **Performance**: Para grandes volumes (>1000 recibos), considere executar em lotes.

## 🔐 Segurança

- ✅ Usa constraint UNIQUE para prevenir duplicatas
- ✅ Registra auditoria completa
- ✅ Hash SHA-256 para integridade
- ✅ Backup em disco para recuperação
- ✅ Transações atômicas por recibo
- ✅ ON CONFLICT DO NOTHING para idempotência

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique logs do script
2. Consulte auditoria no banco
3. Execute testes de integração
4. Abra issue no repositório
