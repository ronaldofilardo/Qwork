# Sistema de Deleção Segura de Clínicas e Entidades

## Visão Geral

Sistema implementado para garantir segurança e rastreabilidade na exclusão de clínicas e entidades no Qwork. Requer confirmação por senha do administrador e registra todas as tentativas em log de auditoria.

## Componentes Implementados

### 1. Tabela de Logs (`logs_exclusao_clinicas`)

Tabela para armazenar histórico completo de todas as tentativas de exclusão.

**Localização:** `database/logs-exclusao-clinicas.sql`

**Campos principais:**

- `clinica_id`, `clinica_nome`, `clinica_cnpj` - Dados da entidade excluída
- `admin_cpf`, `admin_nome` - Administrador que executou
- `status` - `'sucesso'`, `'falha'` ou `'negado'`
- `motivo_falha` - Detalhe do erro (senha incorreta, erro técnico, etc)
- `total_gestores`, `total_empresas`, `total_funcionarios`, `total_avaliacoes` - Contadores
- `ip_origem`, `user_agent` - Metadados da requisição

**Função auxiliar:**

```sql
registrar_log_exclusao_clinica(
    p_clinica_id, p_clinica_nome, p_clinica_cnpj, p_tipo_entidade,
    p_admin_cpf, p_admin_nome, p_status, p_motivo_falha,
    p_total_gestores, p_total_empresas, p_total_funcionarios, p_total_avaliacoes,
    p_ip_origem, p_user_agent
)
```

**View de consulta:**

```sql
SELECT * FROM vw_auditoria_exclusoes ORDER BY criado_em DESC;
```

### 2. API de Deleção Segura

**Endpoint:** `POST /api/admin/clinicas/delete-secure`

**Localização:** `app/api/admin/clinicas/delete-secure/route.ts`

**Parâmetros:**

```typescript
{
  password: string,      // Senha do admin logado
  clinicaId: number      // ID da clínica/entidade a excluir
}
```

**Fluxo:**

1. Verifica autenticação e permissões (apenas `admin`)
2. Valida senha do administrador com bcrypt
3. Registra tentativa negada se senha incorreta
4. Conta registros relacionados que serão excluídos
5. Executa deleção em transação (ON DELETE CASCADE cuida das dependências)
6. Registra sucesso ou falha no log
7. Retorna totais excluídos

**Resposta de sucesso:**

```json
{
  "success": true,
  "message": "Clínica excluída com sucesso",
  "totaisExcluidos": {
    "gestores": 5,
    "empresas": 3,
    "funcionarios": 150,
    "avaliacoes": 120
  }
}
```

**Respostas de erro:**

- `401` - Senha incorreta (registra tentativa negada)
- `403` - Sem permissão
- `404` - Clínica não encontrada
- `500` - Erro interno (registra falha com detalhe)

### 3. Modal de Confirmação

**Componente:** `AdminConfirmDeleteModal`

**Localização:** `components/modals/AdminConfirmDeleteModal.tsx`

**Já existente no projeto**, solicita:

- Senha do administrador (obrigatório)
- Motivo da exclusão (opcional)

### 4. Integração nos Componentes Admin

#### ClinicasContent

**Localização:** `components/admin/ClinicasContent.tsx`

Função atualizada para chamar API segura:

```typescript
const deleteClinica = async (
  clinicaId: number,
  payload?: { admin_password: string }
) => {
  // Chama /api/admin/clinicas/delete-secure
  // Exibe totais excluídos
  // Recarrega lista
};
```

#### EntidadesContent

**Localização:** `components/admin/EntidadesContent.tsx`

Mesma implementação, usando o mesmo endpoint (entidades são um tipo de clínica no BD).

## Fluxo Completo de Exclusão

1. **Admin clica no botão de deletar** (ícone 🗑️ Trash2)
2. **Modal de confirmação abre** solicitando senha
3. **Admin digita senha e motivo** (opcional)
4. **API recebe requisição:**
   - Valida sessão e permissões
   - Busca hash da senha do admin no BD
   - Compara senha fornecida com hash (bcrypt)
   - Se incorreta: registra tentativa negada e retorna erro 401
   - Se correta: continua
5. **Conta registros relacionados** (gestores, empresas, funcionários, avaliações)
6. **Inicia transação:**
   - DELETE FROM clinicas WHERE id = ?
   - Foreign keys com ON DELETE CASCADE removem automaticamente:
     - empresas_clientes (clinica_id)
     - funcionarios (clinica_id)
     - avaliacoes (via funcionarios)
     - clinicas_empresas
7. **Registra sucesso no log** com todos os totais
8. **COMMIT da transação**
9. **Retorna sucesso** com totais para o frontend
10. **Frontend exibe confirmação** e recarrega lista

## Segurança

✅ **Senha obrigatória** - Admin deve confirmar com sua própria senha
✅ **Bcrypt** - Senhas hasheadas, comparação segura
✅ **Log completo** - Todas as tentativas registradas (sucesso, falha, negado)
✅ **Transação** - Rollback automático em caso de erro
✅ **IP e User-Agent** - Rastreabilidade completa
✅ **Permissões** - Apenas admin podem executar

## Consultas de Auditoria

### Ver últimas exclusões

```sql
SELECT * FROM vw_auditoria_exclusoes LIMIT 20;
```

### Exclusões de um admin específico

```sql
SELECT * FROM logs_exclusao_clinicas
WHERE admin_cpf = '12345678901'
ORDER BY criado_em DESC;
```

### Tentativas negadas (senha incorreta)

```sql
SELECT * FROM logs_exclusao_clinicas
WHERE status = 'negado'
ORDER BY criado_em DESC;
```

### Exclusões com falhas técnicas

```sql
SELECT * FROM logs_exclusao_clinicas
WHERE status = 'falha'
ORDER BY criado_em DESC;
```

### Total de registros afetados por exclusão

```sql
SELECT
  clinica_nome,
  total_gestores + total_empresas + total_funcionarios + total_avaliacoes as total_afetado,
  criado_em
FROM logs_exclusao_clinicas
WHERE status = 'sucesso'
ORDER BY criado_em DESC;
```

## Deleção em Cascata (Foreign Keys)

O banco de dados está configurado com `ON DELETE CASCADE` nas seguintes relações:

```sql
-- empresas_clientes -> clinicas
ALTER TABLE empresas_clientes
ADD CONSTRAINT empresas_clientes_clinica_id_fkey
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;

-- funcionarios -> clinicas
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_clinica_id_fkey
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;

-- avaliacoes -> funcionarios
ALTER TABLE avaliacoes
ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey
FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios(cpf) ON DELETE CASCADE;

-- clinicas_empresas -> clinicas
ALTER TABLE clinicas_empresas
ADD CONSTRAINT clinicas_empresas_clinica_id_fkey
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;
```

Isso garante que ao deletar uma clínica:

1. Todas as empresas clientes são removidas
2. Todos os funcionários são removidos
3. Todas as avaliações (via funcionários) são removidas
4. Todos os relacionamentos clinicas_empresas são removidos

## Testando o Sistema

### 1. Teste de senha incorreta

```bash
# Deve registrar tentativa negada
curl -X POST http://localhost:3000/api/admin/clinicas/delete-secure \
  -H "Content-Type: application/json" \
  -d '{"password": "senha_errada", "clinicaId": 1}'
```

### 2. Verificar log após tentativa

```sql
SELECT * FROM logs_exclusao_clinicas ORDER BY criado_em DESC LIMIT 1;
```

### 3. Teste de exclusão bem-sucedida

- Fazer login como admin
- Navegar para Contratantes > Clínicas
- Clicar no botão de deletar de uma clínica de teste
- Digitar senha correta
- Verificar mensagem com totais excluídos

### 4. Verificar log de sucesso

```sql
SELECT * FROM vw_auditoria_exclusoes ORDER BY criado_em DESC LIMIT 1;
```

## Migração para Produção

Para aplicar em produção (Neon):

```bash
# Copiar script SQL para produção
# Executar via dashboard do Neon ou CLI:
psql $DATABASE_URL -f database/logs-exclusao-clinicas.sql
```

Ou incluir no próximo sync dev-to-prod:

```powershell
.\scripts\powershell\sync-dev-to-prod.ps1
```

## Manutenção

### Limpeza de logs antigos (opcional)

```sql
-- Manter apenas últimos 6 meses
DELETE FROM logs_exclusao_clinicas
WHERE criado_em < NOW() - INTERVAL '6 months';
```

### Exportar logs para backup

```bash
# Exportar logs para backup (pg_dump example)
pg_dump -U postgres -d nr-bps_db -t logs_exclusao_clinicas > logs_exclusao_backup.sql
```

## Observações Importantes

⚠️ **Ação irreversível** - Não há recuperação após exclusão bem-sucedida
⚠️ **Cascata automática** - Todos os dados relacionados são excluídos
⚠️ **Log permanente** - Registros de log não são excluídos automaticamente
✅ **Auditável** - Todas as tentativas ficam registradas com IP e timestamp
✅ **Seguro** - Requer senha do admin para cada exclusão
