# Checklist de Validação - Correções de Integridade

## ✅ Pré-Aplicação

- [ ] Backup do banco de dados criado
- [ ] Ambiente de DEV/TEST preparado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] PostgreSQL rodando e acessível
- [ ] Credenciais de banco configuradas

---

## 🔧 Aplicação de Migrations

### Migration 011: FK clinicas_empresas

- [ ] Migration executada sem erros
- [ ] FK `clinicas_empresas_clinica_id_fkey` criada
- [ ] FK referencia `clinicas(id)` corretamente
- [ ] Índice `idx_clinicas_empresas_clinica` criado
- [ ] Registros órfãos removidos (verificar count no log)
- [ ] Comentário da coluna atualizado

**Comando de verificação:**

```sql
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name = 'clinicas_empresas_clinica_id_fkey';
```

---

### Migration 012: Remover lotes_avaliacao_funcionarios

- [ ] Migration executada sem erros
- [ ] Backup da tabela criado (`lotes_avaliacao_funcionarios_backup_20251220`)
- [ ] Tabela `lotes_avaliacao_funcionarios` removida
- [ ] Índices relacionados removidos
- [ ] Sequence removida
- [ ] Queries via `avaliacoes.lote_id` funcionando

**Comando de verificação:**

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'lotes_avaliacao_funcionarios'
) as tabela_existe;
-- Deve retornar FALSE
```

---

### Migration 013: nivel_cargo NOT NULL

- [ ] Migration executada sem erros
- [ ] Constraint `funcionarios_nivel_cargo_check` criada
- [ ] Registros com NULL atualizados para 'operacional'
- [ ] Admin e emissor podem ter NULL
- [ ] Funcionário e RH não podem ter NULL
- [ ] Apenas 'operacional' e 'gestao' aceitos

**Comando de verificação:**

```sql
-- Deve falhar
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, empresa_id, clinica_id, nivel_cargo)
VALUES ('00000000000', 'Teste', 'teste@teste.com', 'hash', 'funcionario', 1, 1, NULL);

-- Deve passar
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id)
VALUES ('00000000001', 'Admin', 'admin@teste.com', 'hash', 'admin', 1);
DELETE FROM funcionarios WHERE cpf IN ('00000000000', '00000000001');
```

---

### Migration 014: FK analise_estatistica

- [ ] Migration executada sem erros
- [ ] FK `analise_estatistica_avaliacao_id_fkey` criada
- [ ] FK com ON DELETE CASCADE
- [ ] Índice `idx_analise_estatistica_avaliacao` criado
- [ ] Registros órfãos removidos
- [ ] Backup de órfãos criado (se houver)

**Comando de verificação:**

```sql
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name = 'analise_estatistica_avaliacao_id_fkey';
```

---

## 🧪 Testes de Integridade

### Testes de Migrations

- [ ] `pnpm test migrations-integrity` - Todos passam
  - [ ] FK clinicas_empresas validado
  - [ ] Tabela redundante removida
  - [ ] Constraint nivel_cargo funcionando
  - [ ] FK analise_estatistica criado

### Testes de Status de Lotes

- [ ] `pnpm test lote-status-sync` - Todos passam
  - [ ] Status manuais protegidos
  - [ ] Cálculo automático correto
  - [ ] Enum aceita todos valores

---

## 🔍 Validação Funcional

### Administração de Empresas

- [ ] Admin COM clinica_id pode listar empresas
- [ ] Admin SEM clinica_id recebe erro 403
- [ ] Criar nova empresa funciona
- [ ] Atualizar empresa funciona
- [ ] Deletar empresa funciona

### Status de Lotes

- [ ] Lote com status 'cancelado' não muda automaticamente
- [ ] Lote com status 'finalizado' não muda automaticamente
- [ ] Lote com todas avaliações concluídas vira 'concluido'
- [ ] Lote sem avaliações ativas vira 'rascunho'
- [ ] Lote com pendências permanece 'ativo'

### Gestão de Funcionários

- [ ] Criar funcionário exige nivel_cargo
- [ ] Criar admin permite nivel_cargo NULL
- [ ] Atualizar funcionário mantém validação
- [ ] Inativar funcionário atualiza status do lote

### Análises Estatísticas

- [ ] Criar análise exige avaliacao_id válido
- [ ] Deletar avaliação remove análise (cascade)
- [ ] Não é possível criar análise órfã

---

## 📊 Métricas de Banco

### Performance

- [ ] Índices criados corretamente
  - [ ] `idx_clinicas_empresas_clinica`
  - [ ] `idx_analise_estatistica_avaliacao`
- [ ] Queries não apresentam degradação
- [ ] Explain plan mostra uso de índices

### Integridade

- [ ] Contagem de registros antes/depois conferem
- [ ] Nenhum registro órfão detectado
- [ ] FKs não violadas
- [ ] Constraints funcionando

**Comando de verificação:**

```sql
-- Verificar órfãos em clinicas_empresas
SELECT COUNT(*) FROM clinicas_empresas ce
WHERE NOT EXISTS (SELECT 1 FROM clinicas c WHERE c.id = ce.clinica_id);
-- Deve retornar 0

-- Verificar órfãos em analise_estatistica
SELECT COUNT(*) FROM analise_estatistica ae
WHERE avaliacao_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = ae.avaliacao_id);
-- Deve retornar 0
```

---

## 📝 Documentação

- [ ] README.md atualizado (se necessário)
- [ ] CHANGELOG.md atualizado com correções
- [ ] Documentação técnica revisada
- [ ] Comentários de código atualizados

---

## 🚀 Deploy em Produção

### Pré-Deploy

- [ ] Todas validações acima passaram em DEV
- [ ] Todas validações passaram em Staging
- [ ] Backup de produção criado
- [ ] Janela de manutenção agendada
- [ ] Time notificado sobre mudanças
- [ ] Rollback plan documentado

### Durante Deploy

- [ ] Aplicar script `apply-integrity-fixes.ps1`
- [ ] Monitorar logs em tempo real
- [ ] Verificar integridade após cada migration
- [ ] Executar testes críticos

### Pós-Deploy

- [ ] Testes de fumaça executados
- [ ] Funcionalidades críticas validadas
- [ ] Logs de erro verificados (primeiras 2h)
- [ ] Performance monitorada (primeiras 24h)
- [ ] Usuários notificados sobre conclusão

---

## ⚠️ Rollback (se necessário)

### Identificação de Problema

- [ ] Logs revisados e problema identificado
- [ ] Decisão de rollback tomada

### Execução de Rollback

- [ ] Aplicação parada (se crítico)
- [ ] Restore do backup pré-correções
- [ ] Verificação de integridade pós-restore
- [ ] Aplicação reiniciada
- [ ] Testes básicos executados

### Documentação

- [ ] Problema documentado
- [ ] Causa raiz identificada
- [ ] Plano de correção revisado
- [ ] Nova tentativa agendada

---

## ✅ Conclusão

**Data de Aplicação:** **_/_**/**\_\_**  
**Ambiente:** [ ] DEV [ ] Staging [ ] Produção  
**Responsável:** \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***

**Status Geral:**

- [ ] ✅ Todas migrations aplicadas com sucesso
- [ ] ✅ Todos os testes passaram
- [ ] ✅ Validação funcional completa
- [ ] ✅ Performance mantida
- [ ] ✅ Documentação atualizada

**Observações:**

---

---

---

**Assinatura:** **\*\*\*\***\_\_\_\_**\*\*\*\***
