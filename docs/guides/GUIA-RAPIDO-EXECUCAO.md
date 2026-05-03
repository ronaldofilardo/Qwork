# Guia Rápido de Execução - Migrations e Testes

## 🔐 Credenciais do Banco de Dados

Para todos os comandos neste guia, use as credenciais padrão:

- **Usuário:** `postgres`
- **Senha:** `123456`
- **Banco Desenvolvimento:** `nr-bps_db`
- **Banco Testes:** `nr-bps_db_test`

## ✅ Passo a Passo para Aplicar Todas as Implementações

### 1️⃣ Aplicar Migrations Corrigidas (022 e 023)

```powershell
# Execute o script automatizado
.\scripts\powershell\aplicar-migrations-corrigidas.ps1
```

**O que esse script faz:**

- Aplica Migration 022 corrigida (RLS)
- Limpa tabela notificacoes antiga
- Aplica Migration 023 reescrita (sistema de notificações com CPF)
- Verifica estrutura criada

---

### 2️⃣ Aplicar Migration de Prioridade Baixa (024)

```powershell
$env:PGPASSWORD = "123456"
psql -U postgres -d nr-bps_db -f database/migrations/024_prioridade_baixa_features.sql
```

**O que será criado:**

- Tabela `historico_alteracoes_valores`
- Tabela `clinica_configuracoes`
- Tabela `templates_contrato`
- Tabela `notificacoes_traducoes`
- Triggers, views, funções

---

### 3️⃣ Verificar Estrutura

```powershell
psql -U postgres -d nr-bps_db
```

```sql
-- Verificar notificações (deve usar destinatario_cpf agora)
\d notificacoes

-- Verificar novas tabelas
\dt historico_alteracoes_valores
\dt clinica_configuracoes
\dt templates_contrato
\dt notificacoes_traducoes

-- Verificar template padrão inserido
SELECT id, nome, tipo_template, padrao FROM templates_contrato;

-- Verificar traduções inseridas
SELECT chave_traducao, idioma FROM notificacoes_traducoes;

-- Sair
\q
```

---

### 4️⃣ Rodar Testes

```powershell
# Testes unitários
pnpm test

# Testes com coverage
pnpm test -- --coverage

# Testes E2E
pnpm test:e2e
```

---

## 📋 Verificação Rápida

### Verificar se tudo foi aplicado corretamente:

```sql
-- 1. Verificar sistema de notificações (deve usar CPF)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notificacoes'
  AND column_name LIKE 'destinatario%';

-- 2. Verificar histórico de alterações
SELECT COUNT(*) FROM historico_alteracoes_valores;

-- 3. Verificar configurações
SELECT COUNT(*) FROM clinica_configuracoes;

-- 4. Verificar templates
SELECT COUNT(*) FROM templates_contrato WHERE padrao = TRUE;

-- 5. Verificar traduções
SELECT idioma, COUNT(*)
FROM notificacoes_traducoes
GROUP BY idioma;
```

**Resultados esperados:**

1. Colunas: `destinatario_cpf` (text), `destinatario_tipo` (text)
2. 0 registros (histórico vazio inicialmente)
3. 0 registros (configurações criadas sob demanda)
4. 1 registro (template padrão)
5. pt_BR: 3, en_US: 3, es_ES: 3

---

## 🐛 Solução de Problemas

### Erro: "relation notificacoes already exists"

```powershell
# Execute o script que faz limpeza automática
.\scripts\powershell\aplicar-migrations-corrigidas.ps1
```

### Erro: "type tipo_notificacao already exists"

```sql
-- A migration 024 já trata isso com DO $$ BEGIN ... EXCEPTION
-- Se persistir, execute:
DROP TYPE IF EXISTS tipo_notificacao CASCADE;
DROP TYPE IF EXISTS prioridade_notificacao CASCADE;
DROP TYPE IF EXISTS idioma_suportado CASCADE;

-- Depois rode novamente:
psql -U postgres -d nr-bps_db -f database/migrations/024_prioridade_baixa_features.sql
```

### Erro: "OLD não existe" em RLS policies

```sql
-- Já foi corrigido na migration 022
-- Se ainda aparecer, verifique se aplicou a versão corrigida:
SELECT * FROM pg_policies WHERE tablename = 'contratacao_personalizada';
```

---

## 🎯 Próximo Teste Manual

### Testar Sistema de Notificações:

```sql
-- Criar contratação de teste para disparar notificação
INSERT INTO contratacao_personalizada (
  tomador_id,
  numero_funcionarios_estimado,
  status
) VALUES (
  1,  -- ID de uma clínica existente
  100,
  'aguardando_valor_admin'
);

-- Verificar se notificação foi criada
SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 1;

-- Verificar destinatários (deve ter CPF de admins)
SELECT destinatario_cpf, tipo, titulo
FROM notificacoes
ORDER BY criado_em DESC
LIMIT 5;
```

### Testar Templates:

```sql
-- Listar templates
SELECT id, nome, tipo_template FROM templates_contrato;

-- Testar renderização via SQL
SELECT * FROM templates_contrato WHERE padrao = TRUE LIMIT 1;
```

### Testar Traduções:

```sql
-- Obter tradução em inglês
SELECT obter_traducao('pre_cadastro_criado_titulo', 'en_US');

-- Obter tradução em espanhol
SELECT obter_traducao('pre_cadastro_criado_mensagem', 'es_ES');

-- Fallback para português se idioma não existir
SELECT obter_traducao('pre_cadastro_criado_titulo', 'fr_FR');
```

---

## ✅ Checklist Final

- [ ] Migration 022 aplicada (RLS corrigido)
- [ ] Migration 023 aplicada (notificações com CPF)
- [ ] Migration 024 aplicada (prioridade baixa)
- [ ] Tabela `notificacoes` usa `destinatario_cpf`
- [ ] Tabela `historico_alteracoes_valores` existe
- [ ] Tabela `clinica_configuracoes` existe
- [ ] Tabela `templates_contrato` existe (com 1 template padrão)
- [ ] Tabela `notificacoes_traducoes` existe (com 9 traduções)
- [ ] Testes unitários passando
- [ ] Testes de integração passando

---

## 🚀 Pronto para Produção!

Depois de verificar tudo:

```powershell
# Sincronizar para produção (Neon)
.\scripts\powershell\sync-dev-to-prod.ps1
```

---

_Última atualização: 21 de dezembro de 2025_
