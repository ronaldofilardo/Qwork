# 🔧 Correção da Função Trigger - Avaliação Conclusão

**Data:** 14 de fevereiro de 2026  
**Migração:** 165_fix_atualizar_ultima_avaliacao_trigger.sql  
**Status:** ✅ RESOLVIDO

## 📋 Problema

Ao tentar salvar respostas e concluir uma avaliação, o sistema retornava erro:

```
Erro ao salvar respostas: error: coluna l.codigo não existe
  SQL: SELECT l.codigo FROM lotes_avaliacao l WHERE l.id = NEW.lote_id
  Função: atualizar_ultima_avaliacao_funcionario() linha 7
```

## 🔍 Análise da Causa

A função trigger `atualizar_ultima_avaliacao_funcionario()` (criada na migração 016) estava tentando:

1. **Acessar coluna inexistente**: `l.codigo` em `lotes_avaliacao`
   - Tabela `lotes_avaliacao` nunca teve coluna `codigo`
   - Usa `numero_ordem` e `id` para identificação

2. **Atualizar colunas removidas** em `funcionarios`:
   - `ultimo_lote_codigo` - removida pela migração 160
   - Tentativa de usar um valor de coluna que não existe

## ✅ Solução Implementada

Refatoração da função trigger para:

- ✅ Remover tentativa de acessar `l.codigo`
- ✅ Remover atualização de `ultimo_lote_codigo` (coluna inexistente)
- ✅ Manter apenas as colunas denormalizadas que ainda existem:
  - `ultima_avaliacao_id`
  - `ultima_avaliacao_data_conclusao`
  - `ultima_avaliacao_status`
  - `atualizado_em`

## 📝 Código Anterior (Problematico)

```sql
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_codigo VARCHAR(20);  -- ❌ Nunca será usado corretamente
  v_motivo_inativacao TEXT;
BEGIN
  -- ❌ ERRO: l.codigo não existe em lotes_avaliacao!
  SELECT l.codigo INTO v_lote_codigo
  FROM lotes_avaliacao l
  WHERE l.id = NEW.lote_id;

  IF NEW.status = 'inativada' THEN
    v_motivo_inativacao := NEW.motivo_inativacao;
  ELSE
    v_motivo_inativacao := NULL;
  END IF;

  UPDATE funcionarios
  SET
    ultima_avaliacao_id = NEW.id,
    ultimo_lote_codigo = v_lote_codigo,  -- ❌ Coluna removida na migração 160
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    ultimo_motivo_inativacao = v_motivo_inativacao,  -- ❌ Coluna removida
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (...);

  RETURN NEW;
END;
```

## 📝 Código Novo (Corrigido)

```sql
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ Apenas colunas que realmente existem
  UPDATE funcionarios
  SET
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  RETURN NEW;
END;
```

## 🧪 Testes Realizados

- ✅ Migração 165 aplicada com sucesso
- ✅ Função trigger verificada via `pg_proc`
- ✅ Nenhuma referência a colunas inexistentes

## 🚀 Próximos Passos

1. Testar fluxo de conclusão de avaliação novamente
2. Confirmar que respostas são salvas sem erro
3. Validar que fonários têm `ultima_avaliacao_*` fields atualizados corretamente

## 📛 Relacionado

- **Migração 016**: Criou a função (com problemas)
- **Migração 160**: Removeu colunas denormalizadas `ultimo_lote_codigo` e `ultimo_motivo_inativacao`
- **Stack Trace**: POST /api/avaliacao/respostas → lib/avaliacao-conclusao.ts → UPDATE avaliacoes → trigger
