## 🔴 ERRO EM PRODUÇÃO: Login com data_nascimento inválida

**Status:** ✅ CORRIGIDO

---

## Problema Reportado

```
[LOGIN] Erro ao gerar/validar senha de data_nascimento: Error: Dia inválido na data de nascimento
```

### Causa

Há usuarios com datas de nascimento impossíveis armazenadas no banco (ex: `31/02/1990`). Essas datas foram criadas antes da validação ser implementada.

Quando um usuário tenta fazer login com data_nascimento inválida:

1. O código tenta gerar a senha a partir da data
2. A validação rejeita a data como impossível
3. Erro é lançado sem fallback

---

## Solução Implementada

### 1. **Login Fallback** ✅

Arquivo: [app/api/auth/login/route.ts](../app/api/auth/login/route.ts)

```typescript
// Se gerarSenhaDeNascimento() falhar com data inválida:
// → Tentar login com senha normal (campo 'senha' da requisição)
// → Se senhaHash for válido, login é autorizado
// → Se não houver senha, retornar erro estruturado
```

**Resultado:** Usuários com datas inválidas conseguem fazer login usando a senha normal.

### 2. **Script SQL para Limpeza de Dados** ✅

Arquivo: [scripts/fix-datas-nascimento-invalidas.sql](../scripts/fix-datas-nascimento-invalidas.sql)

Script que:

- Identifica todas as datas de nascimento impossíveis no banco
- Fornece relatório com exemplos
- (Opcional) Corrige automaticamente datas ruins:
  - `31/02/YYYY` → `28/02/YYYY`
  - `31/04/YYYY` → `30/04/YYYY`
  - `31/06/YYYY` → `30/06/YYYY`
  - etc.

---

## Passos para Resolver em Produção

### Passo 1: Deploy da Correção

```bash
# Pull e deploy novo code:
git pull origin main
pnpm build
pnpm start

# Ou via Vercel (automatic se configurado)
```

**O que muda:**

- Usuários com datas inválidas conseguem fazer login com senha normal
- Melhor logging para diagnosticar problemas

### Passo 2: Identificar Dados Ruins (OPCIONAL)

```bash
# Conectar em Neon e executar:
psql <DATABASE_URL>
```

```sql
-- Copiar e colar o relatório do arquivo:
-- scripts/fix-datas-nascimento-invalidas.sql
-- (Apenas a primeira metade, até "DO $$")
```

**Exemplo de output:**

```
====================================
RELATÓRIO DE DATAS INVÁLIDAS
====================================
Total de datas impossíveis encontradas: 3

Exemplos de datas inválidas encontradas:
----
  - CPF: 96309540017, Data: 31/02/1990
  - CPF: 12345678901, Data: 31/04/2000
  - CPF: 11122233344, Data: 29/02/1900
```

### Passo 3: Limpar Dados Ruins (RECOMENDADO)

```bash
# Se há datas inválidas encontradas:
psql <DATABASE_URL>
```

```sql
-- Descomente e execute a SEGUNDA PARTE do script:
-- scripts/fix-datas-nascimento-invalidas.sql
-- (A parte com UPDATE)

-- OU execute manualmente:
UPDATE funcionarios
SET data_nascimento = CASE
  WHEN SUBSTRING(data_nascimento, 4, 2) = '02'
    AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 28
  THEN CONCAT('28/', SUBSTRING(data_nascimento, 4, 10))

  WHEN SUBSTRING(data_nascimento, 4, 2) IN ('04', '06', '09', '11')
    AND SUBSTRING(data_nascimento, 1, 2) = '31'
  THEN CONCAT('30/', SUBSTRING(data_nascimento, 4, 10))

  ELSE data_nascimento
END
WHERE data_nascimento IS NOT NULL
  -- condição de data inválida aqui...
```

---

## Validação da Correção

Após aplicar os passos acima:

1. **Teste de Login com Senha Normal:**

   ```bash
   curl -X POST https://<seu-dominio>/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"cpf":"96309540017","senha":"sua-senha"}'
   ```

   Esperado: ✅ Login bem-sucedido

2. **Teste de Login com data_nascimento inválida:**

   ```bash
   curl -X POST https://<seu-dominio>/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"cpf":"96309540017","data_nascimento":"31/02/1990"}'
   ```

   Esperado: ✅ Login bem-sucedido (com fallback)

---

## Timeline de Eventos

| Data  | Evento                                                       |
| ----- | ------------------------------------------------------------ |
| 16/02 | Erro reportado em PROD: "Dia inválido na data de nascimento" |
| 16/02 | Fix implementado com login fallback + script SQL             |
| 16/02 | Commit 691dcb9 pushed para main                              |
| 16/02 | **← Você está aqui**                                         |

---

## Próximos Passos

- [ ] Pull code atualizado em PROD
- [ ] Executar `scripts/fix-datas-nascimento-invalidas.sql` (segunda metade) para limpar dados
- [ ] Testar login de usuários afetados
- [ ] Monitorar logs em produção

---

## Notas

- **O fallback é temporário:** Uma vez que os dados forem limpos, todos os usuários poderão fazer login normalmente com data_nascimento
- **Audiotoria:** Todos os logins com fallback são registrados em tempo real
- **Compatibilidade:** A correção é backward-compatible e não quebra nenhuma funcionalidade existente

---

**Referências:**

- [app/api/auth/login/route.ts](../app/api/auth/login/route.ts) - Login logic com fallback
- [scripts/fix-datas-nascimento-invalidas.sql](../scripts/fix-datas-nascimento-invalidas.sql) - SQL fix para limpeza de dados
- [lib/auth/date-validator.ts](../lib/auth/date-validator.ts) - Validador de datas
- [lib/auth/password-generator-corrigido.ts](../lib/auth/password-generator-corrigido.ts) - Gerador de senhas com validação
