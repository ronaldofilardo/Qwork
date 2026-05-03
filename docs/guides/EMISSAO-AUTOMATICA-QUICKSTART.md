# Guia Rápido: Emissão Automática de Laudos

## 🚀 Comandos Rápidos

### Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

### Executar Teste Automatizado

```bash
node scripts/tests/test-emissao-automatica-dev.js
```

### Reduzir Tempo de Espera (Testes Rápidos)

Edite `lib/auto-concluir-lotes.ts`:

```typescript
const CONFIG = {
  PRAZO_EMISSAO_MINUTOS: 1, // Mude de 10 para 1
  MIN_AVALIACOES_POR_LOTE: 1,
} as const;
```

⚠️ **Lembre-se de reverter para 10 minutos!**

---

## 📊 Comandos SQL Úteis

### Verificar Status do Lote

```sql
SELECT id, codigo, status, auto_emitir_agendado, auto_emitir_em
FROM lotes_avaliacao
WHERE codigo = 'SEU_LOTE_AQUI';
```

### Verificar Laudo Gerado

```sql
SELECT id, lote_id, avaliacao, status, pdf_url, criado_em
FROM laudos
WHERE lote_id = 123; -- ID do lote
```

### Listar Emissores Ativos

```sql
SELECT cpf, nome, email, ativo
FROM funcionarios
WHERE perfil = 'emissor';
```

### Criar Emissor de Teste

```sql
INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id)
VALUES ('12345678900', 'Dr. Emissor Teste', 'emissor@test.com', 'emissor', true, 1);
```

### Verificar Logs de Auditoria

```sql
SELECT * FROM audit_logs
WHERE resource = 'lotes_avaliacao' AND resource_id = '123'
ORDER BY criado_em DESC
LIMIT 10;
```

### Forçar Conclusão de Lote (Apenas Testes)

```sql
UPDATE lotes_avaliacao
SET status = 'concluido',
    auto_emitir_agendado = true,
    auto_emitir_em = NOW()
WHERE id = 123;
```

### Verificar Lotes Pendentes de Emissão

```sql
SELECT id, codigo, status, auto_emitir_em
FROM lotes_avaliacao
WHERE status = 'concluido'
  AND auto_emitir_agendado = true
  AND auto_emitir_em <= NOW()
  AND id NOT IN (SELECT lote_id FROM laudos WHERE status = 'enviado');
```

---

## 🔍 Monitorar Logs em Tempo Real

### Filtrar Apenas Logs de Desenvolvimento

```bash
pnpm dev | grep -E "\[DEV\]|\[AUTO-CONCLUIR\]|\[EMISSÃO\]"
```

### No PowerShell (Windows)

```powershell
pnpm dev | Select-String -Pattern "\[DEV\]|\[AUTO-CONCLUIR\]|\[EMISSÃO\]"
```

---

## 🐛 Troubleshooting Rápido

### Problema: Emissor não encontrado

```sql
-- Verificar se há emissores ativos
SELECT COUNT(*) FROM funcionarios WHERE perfil = 'emissor' AND ativo = true;

-- Se retornar 0, criar um emissor
INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id)
VALUES ('12345678900', 'Dr. Emissor Teste', 'emissor@test.com', 'emissor', true, 1);
```

### Problema: Laudo não emitido após 10 minutos

```bash
# 1. Verificar se o servidor ainda está rodando
# 2. Verificar logs no console
# 3. Checar status do lote no banco
```

### Problema: Erro ao gerar PDF

```bash
# Reinstalar dependências
pnpm install

# Instalar Chrome/Chromium para Puppeteer
npx puppeteer browsers install chrome
```

---

## 📈 Fluxo Esperado

1. **Conclusão do Lote:**

   ```
   [AUTO-CONCLUIR] ✅ Lote 009-050126 concluído
   [AUTO-CONCLUIR] ⏰ Emissão agendada para: 2026-01-05T15:23:00.000Z
   [DEV] 🕐 Agendando emissão automática em 10 minutos...
   ```

2. **Após 10 Minutos:**
   ```
   [DEV] 📄 Iniciando emissão automática para lote 009-050126...
   [DEV] 👤 Emissor selecionado: Dr. João Silva (12345678900)
   [EMISSÃO] Iniciando emissão para lote 123 (emergência: false)
   [EMISSÃO] ✅ PDF gerado com sucesso
   [DEV] ✅ Laudo emitido com sucesso
   ```

---

## 📚 Documentação Completa

- [Guia Completo](./EMISSAO-AUTOMATICA-DEV.md)
- [Resumo Executivo](./EMISSAO-AUTOMATICA-RESUMO.md)
- [Script de Teste](../../scripts/tests/test-emissao-automatica-dev.js)

---

## ✅ Checklist de Teste

- [ ] Servidor Next.js rodando (`pnpm dev`)
- [ ] Emissor ativo no banco
- [ ] `.env.local` configurado
- [ ] Script de teste executado
- [ ] Logs verificados após conclusão
- [ ] Aguardado 10 minutos (ou tempo configurado)
- [ ] Logs verificados após emissão
- [ ] Laudo verificado no banco
- [ ] PDF validado na interface

---

**Dica:** Use `CONFIG.PRAZO_EMISSAO_MINUTOS = 1` para testes rápidos, mas não esqueça de reverter!
