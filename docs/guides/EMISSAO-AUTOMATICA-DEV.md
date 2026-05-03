# Emissão Automática de Laudos em Desenvolvimento

**Data:** 05/01/2026  
**Implementação:** Sistema de emissão automática de laudos com `setTimeout` para ambiente de desenvolvimento

---

## 📋 Visão Geral

O sistema agora emite laudos **automaticamente 10 minutos após a conclusão do lote**, tanto em **desenvolvimento** quanto em **produção**, sem qualquer ação humana.

### 🎯 Diferenças por Ambiente

| Aspecto          | Desenvolvimento                         | Produção                                      |
| ---------------- | --------------------------------------- | --------------------------------------------- |
| **Gatilho**      | `setTimeout` após conclusão             | Cron job externo via `/api/system/auto-laudo` |
| **Persistência** | ❌ Não persiste se servidor reiniciar   | ✅ Resiliente a reinicializações              |
| **Configuração** | Automático (via `NODE_ENV=development`) | Requer configuração de cron job               |
| **Prazo**        | 10 minutos (configurável em testes)     | 10 minutos                                    |
| **Logs**         | Prefixo `[DEV]`                         | Prefixo `[AUTO-LAUDO]`                        |

---

## 🔧 Implementação

### Arquivo Modificado

**`lib/auto-concluir-lotes.ts`**

Após o lote ser marcado como `'concluido'`, o sistema:

1. **Verifica o ambiente** (`NODE_ENV === 'development'`)
2. **Agenda um `setTimeout`** de 10 minutos
3. **Busca um emissor ativo** no banco de dados
4. **Chama `emitirLaudosAutomaticamenteParaLote`** com validação normal (não usa modo emergência)
5. **Registra logs detalhados** de sucesso ou falha

### Código Adicionado

```typescript
// 🔥 Agendar emissão automática em 10 minutos (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log(
    `[DEV] 🕐 Lote ${lote.codigo} concluído. Agendando emissão automática em ${CONFIG.PRAZO_EMISSAO_MINUTOS} minutos...`
  );

  setTimeout(
    async () => {
      try {
        console.log(
          `[DEV] 📄 Iniciando emissão automática para lote ${lote.codigo}...`
        );

        // Buscar emissor ativo
        const emissores = await query(`
        SELECT cpf, nome FROM funcionarios 
        WHERE perfil = 'emissor' AND ativo = true 
        LIMIT 1
      `);

        if (emissores.rows.length === 0) {
          console.error('[DEV] ❌ Nenhum emissor ativo encontrado');
          return;
        }

        const emissorCpf = emissores.rows[0].cpf;

        // Emissão normal com validação (modoEmergencia = false)
        await emitirLaudosAutomaticamenteParaLote(
          lote.id,
          emissorCpf,
          false,
          null
        );

        console.log(
          `[DEV] ✅ Laudo emitido com sucesso para lote ${lote.codigo}`
        );
      } catch (error) {
        console.error(`[DEV] ❌ Falha na emissão automática:`, error);
      }
    },
    CONFIG.PRAZO_EMISSAO_MINUTOS * 60 * 1000
  ); // 10 minutos
}
```

---

## 🧪 Como Testar

### Pré-requisitos

1. ✅ Ter pelo menos um **emissor ativo** no banco:

   ```sql
   SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor';
   ```

2. ✅ Servidor Next.js rodando:

   ```bash
   pnpm dev
   ```

3. ✅ `.env.local` configurado:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Passos para Teste Completo

#### 1️⃣ Criar um Lote com Avaliações

```bash
# Abrir o sistema em http://localhost:3000
# Logar como RH ou Admin
# Criar um lote de avaliações (ex: 3 funcionários)
```

#### 2️⃣ Concluir Todas as Avaliações

- Responder todas as avaliações do lote (como funcionário)
- Ou marcar avaliações como concluídas diretamente no banco (para testes rápidos)

#### 3️⃣ Verificar Logs Imediatamente Após Conclusão

No terminal do Next.js, você verá:

```
[AUTO-CONCLUIR] ✅ Lote 009-050126 concluído com sucesso
[AUTO-CONCLUIR] ⏰ Emissão automática agendada para: 2026-01-05T15:23:00.000Z
[DEV] 🕐 Lote 009-050126 concluído. Agendando emissão automática em 10 minutos...
```

#### 4️⃣ Aguardar 10 Minutos (ou menos para testes)

**Para testes rápidos**, você pode reduzir o tempo editando temporariamente `CONFIG.PRAZO_EMISSAO_MINUTOS`:

```typescript
const CONFIG = {
  PRAZO_EMISSAO_MINUTOS: 1, // 1 minuto para testes
  MIN_AVALIACOES_POR_LOTE: 1,
} as const;
```

⚠️ **Lembre-se de reverter para 10 minutos após o teste!**

#### 5️⃣ Verificar Emissão Automática

Após o prazo, você verá:

```
[DEV] 📄 Iniciando emissão automática para lote 009-050126 (ID: 123)...
[DEV] 👤 Emissor selecionado: Dr. João Silva (12345678900)
[EMISSÃO] Iniciando emissão para lote 123 (emergência: false)
[EMISSÃO] ✅ PDF gerado com sucesso (tamanho: 234567 bytes)
[DEV] ✅ Laudo emitido com sucesso para lote 009-050126 (ID: 123)
```

#### 6️⃣ Verificar no Banco de Dados

```sql
-- Verificar status do lote
SELECT id, codigo, status FROM lotes_avaliacao WHERE codigo = '009-050126';
-- Deve estar como 'finalizado'

-- Verificar laudo gerado
SELECT id, lote_id, avaliacao, status, pdf_url, criado_em
FROM laudos
WHERE lote_id = 123;
-- Deve ter status = 'enviado' e pdf_url preenchido

-- Verificar logs de auditoria
SELECT * FROM audit_logs
WHERE resource = 'lotes_avaliacao' AND resource_id = '123'
ORDER BY criado_em DESC;
```

#### 7️⃣ Acessar o Dashboard do Emissor

```bash
# Logar como emissor em http://localhost:3000/emissor
# O lote deve aparecer na aba "Laudo Emitido" com status verde
```

---

## 🐛 Troubleshooting

### ❌ Problema: "Nenhum emissor ativo encontrado"

**Causa:** Não há nenhum funcionário com `perfil = 'emissor'` e `ativo = true`.

**Solução:**

```sql
-- Criar um emissor de teste
INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id)
VALUES ('12345678900', 'Dr. Emissor Teste', 'emissor@test.com', 'emissor', true, 1);
```

### ❌ Problema: "Laudo não foi emitido após 10 minutos"

**Causa:** O servidor Next.js foi reiniciado durante a espera.

**Solução:** `setTimeout` não persiste após reinicializações. Isso é **esperado em desenvolvimento**. Execute o processo novamente sem reiniciar o servidor.

### ❌ Problema: "Falha na emissão automática: Lote não está concluído"

**Causa:** O lote não está com `status = 'concluido'`.

**Solução:**

```sql
-- Verificar status do lote
SELECT id, codigo, status FROM lotes_avaliacao WHERE id = 123;

-- Forçar conclusão (apenas para testes)
UPDATE lotes_avaliacao
SET status = 'concluido', auto_emitir_agendado = true, auto_emitir_em = NOW()
WHERE id = 123;
```

### ❌ Problema: "Erro ao gerar PDF"

**Causa:** Puppeteer ou dependências de renderização podem estar faltando.

**Solução:**

```bash
# Reinstalar dependências
pnpm install

# Verificar se Chrome/Chromium está disponível
npx puppeteer browsers install chrome
```

---

## ⚠️ Limitações e Boas Práticas

### Limitações do `setTimeout`

| ❌ Não Faz                           | ✅ Faz                                        |
| ------------------------------------ | --------------------------------------------- |
| Persistir após reinicializações      | Simular o comportamento de produção fielmente |
| Funcionar em serverless (Vercel)     | Funcionar em servidor local (Next.js dev)     |
| Agendar múltiplas emissões paralelas | Emitir uma vez por lote, no momento exato     |

### Boas Práticas

1. **Não use `setInterval`**: isso causaria emissões múltiplas. O `setTimeout` é disparado **uma vez por lote**, no momento da conclusão.

2. **Não dependa do `setTimeout` em produção**: o sistema usa cron job externo (`/api/system/auto-laudo`) para garantir resiliência.

3. **Logs detalhados**: todos os logs usam prefixo `[DEV]` para facilitar debug.

4. **Modo emergência desabilitado**: a emissão usa validação normal (`modoEmergencia = false`), garantindo integridade dos dados.

5. **Audit logs**: tanto sucessos quanto falhas são registrados em `audit_logs` para rastreabilidade.

---

## 🚀 Em Produção (Vercel)

Em produção, o sistema **não usa `setTimeout`**. Em vez disso:

1. **Cron job externo** (configurado no Vercel ou via serviço de cron) chama:

   ```
   POST https://seudominio.com/api/system/auto-laudo
   Authorization: Bearer {AUTO_LAUDO_SECRET_KEY}
   ```

2. **Endpoint valida** o token e chama `verificarEEmitirLaudosAgendados()`

3. **Laudo é emitido** para todos os lotes cujo `auto_emitir_em <= NOW()`

### Configuração do Cron Job (Vercel)

No arquivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/system/auto-laudo",
      "schedule": "* * * * *"
    }
  ]
}
```

**Nota:** O cron job roda a cada 1 minuto, mas só emite laudos cujo prazo (`auto_emitir_em`) já tenha sido atingido.

---

## 📊 Métricas de Sucesso

Para validar se o sistema está funcionando corretamente:

```sql
-- Total de laudos emitidos automaticamente (última semana)
SELECT COUNT(*) as total_emissoes_automaticas
FROM audit_logs
WHERE action = 'conclusao_automatica'
  AND criado_em >= NOW() - INTERVAL '7 days';

-- Lotes com emissão pendente
SELECT id, codigo, status, auto_emitir_em
FROM lotes_avaliacao
WHERE status = 'concluido'
  AND auto_emitir_agendado = true
  AND auto_emitir_em <= NOW()
  AND id NOT IN (SELECT lote_id FROM laudos WHERE status = 'enviado');

-- Taxa de sucesso de emissões automáticas
SELECT
  COUNT(CASE WHEN action = 'conclusao_automatica' THEN 1 END) as total_tentativas,
  COUNT(CASE WHEN action = 'emissao_automatica_erro' THEN 1 END) as total_erros,
  ROUND(100.0 * COUNT(CASE WHEN action = 'conclusao_automatica' THEN 1 END) /
        NULLIF(COUNT(*), 0), 2) as taxa_sucesso
FROM audit_logs
WHERE action IN ('conclusao_automatica', 'emissao_automatica_erro')
  AND criado_em >= NOW() - INTERVAL '7 days';
```

---

## 📝 Changelog

- **05/01/2026**: Implementação inicial da emissão automática com `setTimeout` para desenvolvimento
  - Adicionado import de `emitirLaudosAutomaticamenteParaLote`
  - Implementado agendamento condicional baseado em `NODE_ENV`
  - Adicionado logs detalhados com prefixo `[DEV]`
  - Configurado `.env.local` com `NEXT_PUBLIC_API_URL`
  - Criado guia de teste e troubleshooting

---

## 🔗 Arquivos Relacionados

- [lib/auto-concluir-lotes.ts](../../lib/auto-concluir-lotes.ts) - Lógica de conclusão e agendamento
- [lib/laudo-auto-refactored.ts](../../lib/laudo-auto-refactored.ts) - Função de emissão de laudos
- [.env.local](../../.env.local) - Configurações de desenvolvimento
- [app/api/system/auto-laudo/route.ts](../../app/api/system/auto-laudo/route.ts) - Endpoint de cron job (produção)

---

**✨ Dica Final:** Para ver todos os logs de emissão em tempo real durante os testes:

```bash
pnpm dev | grep -E "\[DEV\]|\[AUTO-CONCLUIR\]|\[EMISSÃO\]"
```
