# Proteção Crítica de Senhas

**Data de Implementação:** 23 de Dezembro de 2025  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ ATIVO

## Problema Identificado

Scripts de limpeza (`clean-contratantes.sql` e `clean-cnpj-cpf-data.sql`) estavam deletando senhas da tabela `entidades_senhas`, causando perda de credenciais de acesso dos gestores de entidade.

## Soluções Implementadas

### 1. ✅ Trigger de Proteção Automática

**Arquivo:** `database/migrations/030_protecao_senhas_critica.sql`

Um trigger (`trg_protect_senhas`) foi implementado que:

- **BLOQUEIA** qualquer tentativa de DELETE direto na tabela `entidades_senhas`
- Registra todas as operações (INSERT, UPDATE, DELETE) em uma tabela de auditoria
- Permite DELETE apenas via função autorizada com motivo documentado

```sql
-- Tentativa de delete direto:
DELETE FROM entidades_senhas WHERE cpf = '12345678901';
-- ❌ ERRO: OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita
```

### 2. ✅ Tabela de Auditoria Completa

**Tabela:** `entidades_senhas_audit`

Registra automaticamente:

- Tipo de operação (INSERT/UPDATE/DELETE)
- Hash da senha anterior e nova
- Quem executou a operação
- Quando foi executada
- Motivo (se fornecido)
- Tentativas bloqueadas

**Consultar auditoria:**

```sql
SELECT * FROM vw_auditoria_senhas
ORDER BY executado_em DESC
LIMIT 20;
```

### 3. ✅ Função Segura para Deletar Senhas

**Função:** `fn_delete_senha_autorizado(contratante_id, motivo)`

Única forma autorizada de deletar senhas:

```sql
-- Deletar senha com motivo documentado
SELECT fn_delete_senha_autorizado(
    18,
    'Usuário solicitou reset por esquecimento de senha'
);
```

**Características:**

- Requer motivo obrigatório
- Registra em auditoria
- Emite logs de segurança
- Temporariamente habilita permissão de delete

### 4. ✅ Scripts de Limpeza Modificados

**Arquivos alterados:**

- `scripts/clean-contratantes.sql`
- `scripts/clean-cnpj-cpf-data.sql`

**Mudanças:**

- ❌ Removido: `DELETE FROM entidades_senhas`
- ✅ Adicionado: Avisos críticos e instruções de uso seguro
- ✅ Comentários explicando a proteção

### 5. ✅ Script PowerShell Seguro

**Arquivo:** `scripts/powershell/clean-contratantes-safe.ps1`

Script interativo com múltiplas proteções:

```powershell
# Uso
.\scripts\powershell\clean-contratantes-safe.ps1

# Pular confirmações (CUIDADO!)
.\scripts\powershell\clean-contratantes-safe.ps1 -Force

# Pular backup (não recomendado)
.\scripts\powershell\clean-contratantes-safe.ps1 -SkipBackup
```

**Proteções incluídas:**

- ✅ Confirmação dupla obrigatória ("DELETAR TUDO" + "SIM")
- ✅ Backup automático antes da limpeza
- ✅ Contagem de registros antes e depois
- ✅ Verificação de auditoria de senhas
- ✅ Output colorido com avisos críticos

## Como Usar

### Aplicar as Proteções

```bash
# Conectar ao banco
cd c:\apps\QWork
$env:PGPASSWORD = '123456'

# Aplicar migração
psql -U postgres -d nr-bps_db -f database/migrations/030_protecao_senhas_critica.sql
```

### Verificar se Está Ativo

```sql
-- Testar proteção (deve falhar)
DELETE FROM entidades_senhas WHERE contratante_id = 18;
-- Esperado: ERRO: OPERAÇÃO BLOQUEADA

-- Ver auditoria
SELECT * FROM vw_auditoria_senhas LIMIT 10;
```

### Deletar Senha (Quando Necessário)

```sql
-- Única forma correta
SELECT fn_delete_senha_autorizado(
    18,  -- ID do contratante
    'Motivo detalhado da deleção'
);
```

### Limpeza Segura de Ambiente de Teste

```sql
-- Apenas em banco de teste (bloqueado em produção)
SELECT fn_limpar_senhas_teste();
```

### Executar Limpeza de Contratantes

```powershell
# Com proteções e confirmações
.\scripts\powershell\clean-contratantes-safe.ps1

# OU usar script SQL diretamente (senhas NÃO serão deletadas)
psql -U postgres -d nr-bps_db -f scripts/clean-contratantes.sql
```

## Benefícios

### ✅ Segurança

- Impossível deletar senhas acidentalmente
- Auditoria completa de todas as operações
- Rastreabilidade total

### ✅ Recuperação

- Histórico completo de todas as alterações
- Possibilidade de restaurar senhas anteriores
- Backup automático antes de operações críticas

### ✅ Conformidade

- Registro de quem, quando e por quê
- Evidências para auditorias
- Prevenção de perda de dados

## Monitoramento

### Verificar Tentativas Bloqueadas

```sql
SELECT
    COUNT(*) as tentativas_bloqueadas,
    executado_por,
    DATE(executado_em) as data
FROM entidades_senhas_audit
WHERE motivo LIKE '%BLOQUEADA%'
GROUP BY executado_por, DATE(executado_em)
ORDER BY data DESC;
```

### Ver Últimas Operações

```sql
SELECT * FROM vw_auditoria_senhas
WHERE executado_em > NOW() - INTERVAL '7 days'
ORDER BY executado_em DESC;
```

### Estatísticas de Auditoria

```sql
SELECT
    operacao,
    tipo_operacao,
    COUNT(*) as total
FROM vw_auditoria_senhas
GROUP BY operacao, tipo_operacao
ORDER BY total DESC;
```

## Troubleshooting

### Erro: "Trigger não existe"

```sql
-- Verificar se a migração foi aplicada
SELECT * FROM pg_trigger WHERE tgname = 'trg_protect_senhas';

-- Se não existe, aplicar migração
\i database/migrations/030_protecao_senhas_critica.sql
```

### Erro: "Função não encontrada"

```sql
-- Verificar funções
SELECT proname FROM pg_proc
WHERE proname LIKE '%senha%';

-- Se não existe, aplicar migração
```

### Preciso Deletar Senhas Manualmente

**❌ NÃO FAÇA:**

```sql
-- ISSO VAI FALHAR!
DELETE FROM entidades_senhas WHERE cpf = '12345678901';
```

**✅ FAÇA:**

```sql
-- Use a função segura
SELECT fn_delete_senha_autorizado(
    contratante_id,
    'Motivo detalhado e justificado'
);
```

## Arquivos Relacionados

| Arquivo                                               | Descrição                                    |
| ----------------------------------------------------- | -------------------------------------------- |
| `database/migrations/030_protecao_senhas_critica.sql` | Migração principal com todas as proteções    |
| `scripts/clean-contratantes.sql`                      | Script SQL modificado (sem delete de senhas) |
| `scripts/clean-cnpj-cpf-data.sql`                     | Script SQL modificado (sem delete de senhas) |
| `scripts/powershell/clean-contratantes-safe.ps1`      | Script PowerShell seguro com confirmações    |
| `docs/PROTECAO-SENHAS.md`                             | Esta documentação                            |

## Checklist de Segurança

- [x] Trigger de proteção implementado
- [x] Tabela de auditoria criada
- [x] Função segura de delete disponível
- [x] Scripts de limpeza modificados
- [x] Script PowerShell seguro criado
- [x] Documentação completa
- [x] Testes realizados
- [x] Avisos críticos adicionados

## Suporte

Em caso de dúvidas ou problemas:

1. Verifique a auditoria: `SELECT * FROM vw_auditoria_senhas;`
2. Confirme que a migração foi aplicada
3. Consulte esta documentação
4. Entre em contato com o time de desenvolvimento

---

**⚠️ IMPORTANTE:** Esta proteção é CRÍTICA para a segurança do sistema. NÃO remova ou desabilite sem aprovação explícita.

**📅 Última atualização:** 23 de Dezembro de 2025
