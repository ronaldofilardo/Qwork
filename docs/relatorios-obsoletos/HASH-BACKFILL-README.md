# Backfill de Hashes de Laudos

Este script calcula e atualiza o hash SHA-256 de laudos existentes que foram gerados antes da implementação do sistema de hash.

## 📋 Visão Geral

Laudos gerados antes da implementação do sistema de hash não possuem o campo `hash_pdf` preenchido. Este script:

1. Busca todos os laudos sem hash no banco de dados
2. Verifica se o arquivo PDF existe no storage (`storage/laudos/laudo-{id}.pdf`)
3. Calcula o hash SHA-256 do arquivo
4. Atualiza o registro no banco de dados

## 🚀 Uso

### Opção 1: Via Script (Linha de Comando)

```bash
# Executar o script diretamente
tsx scripts/backfill-laudos-hash.ts
```

### Opção 2: Via API (Interface Admin)

1. Acesse o painel de administração
2. Navegue até a seção de "Manutenção de Laudos"
3. Clique no botão "🔄 Regenerar Hashes"
4. Aguarde o processamento

**Endpoint da API:**

```
POST /api/admin/laudos/regenerar-hashes
```

**Requer:** Perfil `admin`

## 📊 Saída do Script

```
🔄 Iniciando backfill de hashes de laudos...

📊 Encontrados 15 laudos sem hash

[1/15] Processando laudo 3...
  ✓ Hash calculado para laudo 3: abc123def456...
  ✓ Hash atualizado com sucesso

[2/15] Processando laudo 5...
  ✓ Hash calculado para laudo 5: def789abc012...
  ✓ Hash atualizado com sucesso

...

============================================================
📊 ESTATÍSTICAS FINAIS
============================================================
Total de laudos processados: 15
✅ Hashes calculados e atualizados: 13
📁 Arquivos não encontrados: 2
❌ Erros ao atualizar: 0
============================================================

✅ Backfill concluído com sucesso!
💡 As UIs agora exibirão os hashes dos laudos atualizados.
```

## ⚠️ Notas Importantes

1. **Performance**: O script processa até 100 laudos por execução na API para evitar timeout
2. **Arquivos Faltantes**: Laudos cujos arquivos PDF não existem no storage serão pulados
3. **Idempotência**: O script pode ser executado múltiplas vezes sem problemas (só atualiza laudos sem hash)
4. **Backup**: Recomendado fazer backup do banco antes de executar em produção

## 🔍 Verificação

Após executar o script, você pode verificar os hashes atualizados:

```sql
-- Ver laudos com hash
SELECT id, lote_id, status,
       LEFT(hash_pdf, 16) || '...' as hash_preview,
       emitido_em
FROM laudos
WHERE hash_pdf IS NOT NULL
ORDER BY id DESC
LIMIT 10;

-- Contar laudos com e sem hash
SELECT
  COUNT(*) FILTER (WHERE hash_pdf IS NOT NULL) as com_hash,
  COUNT(*) FILTER (WHERE hash_pdf IS NULL) as sem_hash,
  COUNT(*) as total
FROM laudos;
```

## 🎯 Integração com UI

Após executar o backfill, os hashes serão exibidos automaticamente em:

- ✅ Dashboard do Emissor
- ✅ Dashboard da Entidade
- ✅ Dashboard da Clínica/RH

Laudos sem hash mostrarão a mensagem:

> "Não disponível (laudo gerado antes do sistema de hash)"

## 🛠️ Troubleshooting

### Erro: "Arquivo não encontrado"

- **Causa**: O PDF do laudo não está no diretório `storage/laudos/`
- **Solução**: Verificar se os arquivos foram movidos ou deletados. Se necessário, regenerar o laudo.

### Erro ao atualizar banco de dados

- **Causa**: Problemas de conexão ou permissões
- **Solução**: Verificar logs do banco e permissões do usuário

### Timeout na API

- **Causa**: Muitos laudos para processar
- **Solução**: Executar o script via linha de comando ou processar em lotes menores

## 📝 Logs

Os logs do script incluem:

- Progresso de cada laudo processado
- Hashes calculados (primeiros 16 caracteres)
- Estatísticas finais detalhadas
- Erros e avisos

## 🔐 Segurança

- ✅ API requer autenticação e perfil admin
- ✅ Script registra ações no log
- ✅ Hashes são calculados usando SHA-256 (mesmo algoritmo da geração de laudos)
- ✅ Não modifica laudos que já possuem hash
