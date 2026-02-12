# Fix: Erro de Contexto de Segurança no Reset de Avaliação

**Data:** 12/02/2026  
**Status:** ✅ Corrigido

## Problema

Em produção (Neon/Vercel), as rotas de reset de avaliação estavam falhando com o erro:

```
NeonDbError: SECURITY: app.current_user_cpf not set.
Call SET LOCAL app.current_user_cpf before query.
```

### Detalhes do Erro

- **Rotas afetadas:**
  - `/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset`
  - `/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset`

- **Trigger do erro:** A função `audit_trigger_func()` chamava `current_user_cpf()` que lançava exceção quando o contexto não estava configurado.

- **Ambiente:** Produção (Vercel/Neon) com connection pooling

## Causa Raiz

### Connection Pooling em Produção

O código estava usando transações manuais com `query('BEGIN')` e tentando configurar o contexto com `SET LOCAL`:

```typescript
await query('BEGIN');
await query(`SET LOCAL app.current_user_cpf = '${user.cpf}'`);
await query(`SET LOCAL app.current_user_perfil = '${user.perfil}'`);

// Outras queries...
await query('SELECT ...');
```

**O problema:** Em ambientes com connection pooling (como Neon em produção), cada chamada `query()` pode pegar uma **conexão diferente** do pool. O `SET LOCAL` só vale para a conexão específica onde foi executado.

### Fluxo com Erro

1. `query('BEGIN')` → Conexão A (inicia transação)
2. `query('SET LOCAL app.current_user_cpf...')` → Conexão A
3. `query('SELECT ...')` → **Conexão B** (pega nova conexão do pool!)
4. UPDATE dispara trigger de auditoria → Conexão B não tem contexto → ❌ ERRO

## Solução Implementada

### Passar Sessão para Todas as Queries

A função `query()` em `lib/db.ts` aceita um terceiro parâmetro `session` que garante:

- Criação de transação automática
- Configuração do contexto `app.current_user_cpf` e `app.current_user_perfil`
- **Mesma conexão** para todas as operações dentro da transação

### Mudanças Aplicadas

#### 1. Remoção de Transação Manual

**Antes:**

```typescript
await query('BEGIN');

await query(`SET LOCAL app.current_user_cpf = '${user.cpf}'`);
await query(`SET LOCAL app.current_user_perfil = '${user.perfil}'`);

try {
  const loteCheck = await query('SELECT ...', [loteId]);
  // ...
  await query('COMMIT');
} catch {
  await query('ROLLBACK');
}
```

**Depois:**

```typescript
try {
  const loteCheck = await query('SELECT ...', [loteId], user);
  // ...
} catch (error) {
  // Transação automaticamente revertida
  throw error;
}
```

#### 2. Adição do Parâmetro `user` em Todas as Queries

Todas as chamadas `query()` dentro das rotas agora recebem o parâmetro `user`:

```typescript
// ✅ Correto
await query('SELECT ...', [param1, param2], user);

// ❌ Incorreto (causa o erro em produção)
await query('SELECT ...', [param1, param2]);
```

#### 3. Remoção de ROLLBACK Manual

Como a função `query()` gerencia transações automaticamente quando recebe a sessão, não é mais necessário fazer `ROLLBACK` manual nos pontos de erro:

```typescript
// ❌ Antes
if (error) {
  await query('ROLLBACK');
  return NextResponse.json(...);
}

// ✅ Depois (transação revertida automaticamente ao sair do escopo)
if (error) {
  return NextResponse.json(...);
}
```

## Arquivos Corrigidos

1. `/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route.ts`
2. `/app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset/route.ts`

## Como a Função `query()` Resolve o Problema

Quando o parâmetro `session` é passado (de `lib/db.ts` linha 442+):

```typescript
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session
): Promise<QueryResult<T>> {
  // ...
  if (session) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Configurar contexto dentro da MESMA conexão
      await client.query(`SET LOCAL app.current_user_cpf = '${session.cpf}'`);
      await client.query(
        `SET LOCAL app.current_user_perfil = '${session.perfil}'`
      );
      await client.query(`SET LOCAL app.current_user_clinica_id = ...`);
      await client.query(`SET LOCAL app.current_user_entidade_id = ...`);

      // Executar query na MESMA conexão
      const result = await client.query(text, params);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  // ...
}
```

**Vantagens:**

- ✅ Garante mesma conexão para toda a transação
- ✅ Contexto de segurança sempre configurado
- ✅ Tratamento automático de commit/rollback
- ✅ Funciona corretamente em ambientes com connection pooling

## Verificação

Para verificar que a correção está funcionando em produção:

1. Logs devem mostrar sucesso ao invés de erro:

   ```
   [RESET-AVALIACAO] Reset successful - resetId: X, avaliacaoId: Y...
   ```

2. Não deve mais aparecer o erro:

   ```
   SECURITY: app.current_user_cpf not set
   ```

3. O trigger de auditoria deve executar corretamente e inserir registros em `audit_logs`

## Lições Aprendidas

1. **Connection Pooling:** Em produção, sempre considerar que queries podem pegar conexões diferentes
2. **Contexto de Sessão:** Usar a função `query()` com parâmetro `session` garante isolamento correto
3. **Transações:** Deixar a gestão de transações para a camada de banco de dados quando possível
4. **Teste Local vs Produção:** Ambientes locais podem não reproduzir problemas de connection pooling

## Referências

- [DATABASE-POLICY.md](../../DATABASE-POLICY.md) - Política de segurança do banco
- [lib/db.ts](../../lib/db.ts) - Implementação da função `query()`
- [lib/session.ts](../../lib/session.ts) - Gestão de sessões de usuário
