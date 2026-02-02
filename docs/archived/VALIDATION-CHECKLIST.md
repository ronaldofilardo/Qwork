# ✅ Checklist de Validação - Correções RBAC/RLS

## Data: \_**\_ / \_\_** / 2025

## Responsável: ************\_\_\_************

---

## 📋 Pré-Aplicação

- [ ] Backup do banco criado
- [ ] Código atualizado do repositório
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Ambiente de teste disponível
- [ ] Documentação lida (`RLS-RBAC-FIXES-README.md`)

---

## 🔧 Aplicação

- [ ] Script `004_rls_rbac_fixes.sql` executado sem erros
- [ ] Script de testes `004_test_rls_rbac_fixes.sql` executado
- [ ] Todos os testes mostraram "✓ PASSOU"
- [ ] Arquivo `lib/db-security.ts` atualizado
- [ ] Aplicação reconstruída (`pnpm build`)
- [ ] Servidor reiniciado com sucesso
- [ ] Servidor acessível em `http://localhost:3000`

---

## 🧪 Testes Funcionais

### Teste 1: Políticas RLS - audit_logs

- [ ] Admin consegue ver todos os logs
- [ ] RH vê apenas próprios logs
- [ ] Funcionário vê apenas próprios logs
- [ ] Ninguém consegue deletar logs

### Teste 2: Validação de Pertencimento RH

- [ ] RH válido acessa dados da sua clínica
- [ ] RH não acessa dados de outras clínicas
- [ ] RH com `clinica_id` errado na sessão é bloqueado
- [ ] Erro é registrado em `audit_access_denied`

### Teste 3: Imutabilidade de Laudos

- [ ] Laudo não emitido pode ser editado
- [ ] Laudo emitido NÃO pode ser editado
- [ ] Laudo com status "enviado" NÃO pode ser editado
- [ ] Tentativa de edição gera erro apropriado

### Teste 4: Políticas Granulares - Funcionário

- [ ] Funcionário lê próprios dados
- [ ] Funcionário edita campos permitidos (nome, email)
- [ ] Funcionário NÃO edita CPF, perfil, clinica_id
- [ ] Funcionário NÃO vê dados de outros funcionários
- [ ] Funcionário cria próprias avaliações
- [ ] Funcionário responde próprias avaliações
- [ ] Funcionário NÃO deleta avaliações

### Teste 5: Políticas Granulares - RH

- [ ] RH vê todos os funcionários da clínica
- [ ] RH NÃO vê funcionários de outras clínicas
- [ ] RH cria funcionários na sua clínica
- [ ] RH edita funcionários da sua clínica
- [ ] RH NÃO cria funcionários em outras clínicas
- [ ] RH gerencia empresas da sua clínica
- [ ] RH gerencia lotes da sua clínica
- [ ] RH vê avaliações da sua clínica
- [ ] RH vê respostas da sua clínica
- [ ] RH vê resultados da sua clínica
- [ ] RH vê laudos da sua clínica

### Teste 6: Políticas Granulares - Emissor

- [ ] Emissor vê lotes concluídos
- [ ] Emissor NÃO vê lotes em andamento
- [ ] Emissor cria laudos
- [ ] Emissor edita laudos não emitidos
- [ ] Emissor NÃO edita laudos emitidos
- [ ] Emissor deleta laudos rascunho
- [ ] Emissor NÃO acessa dados de funcionários

### Teste 7: Políticas Granulares - Admin

- [ ] Admin vê todas as clínicas
- [ ] Admin cria/edita/deleta clínicas
- [ ] Admin vê todas as empresas
- [ ] Admin vê funcionários RH e Emissor
- [ ] Admin NÃO vê funcionários comuns
- [ ] Admin cria funcionários RH/Emissor
- [ ] Admin edita funcionários RH/Emissor
- [ ] Admin NÃO acessa avaliações
- [ ] Admin NÃO acessa respostas
- [ ] Admin NÃO acessa resultados
- [ ] Admin NÃO acessa lotes
- [ ] Admin NÃO acessa laudos

### Teste 8: Integração RBAC com RLS

- [ ] Função `user_has_permission()` funciona
- [ ] Permissões RBAC são verificadas nas políticas
- [ ] Admin tem permissão `manage:clinicas`
- [ ] Admin NÃO tem permissão `read:avaliacoes`
- [ ] RH tem permissões de leitura/escrita da clínica

### Teste 9: RLS em Tabelas de Sistema

- [ ] Admin vê tabela `roles`
- [ ] Admin vê tabela `permissions`
- [ ] Admin vê tabela `role_permissions`
- [ ] RH NÃO vê tabelas RBAC
- [ ] Funcionário NÃO vê tabelas RBAC
- [ ] Emissor NÃO vê tabelas RBAC

### Teste 10: Constraints de Integridade

- [ ] Não é possível criar avaliação para CPF inexistente
- [ ] Não é possível criar empresa sem clínica
- [ ] Não é possível deletar clínica com funcionários ativos
- [ ] Não é possível deletar empresa com funcionários ativos
- [ ] Não é possível mudar clínica de empresa com funcionários

### Teste 11: Auditoria de Acesso Negado

- [ ] Tabela `audit_access_denied` existe
- [ ] Tentativa de acesso inválido é registrada
- [ ] CPF do usuário é registrado
- [ ] Ação tentada é registrada
- [ ] Motivo da rejeição é registrado

### Teste 12: Validação de Contexto (lib/db-security.ts)

- [ ] CPF inválido é rejeitado
- [ ] Perfil inválido é rejeitado
- [ ] Usuário inativo é rejeitado
- [ ] clinica_id inválido é rejeitado
- [ ] empresa_id não pertencente à clínica é rejeitado
- [ ] Tentativas de injeção são logadas

---

## 📊 Performance

### Índices

- [ ] Verificado que 15+ novos índices foram criados
- [ ] Índice `idx_avaliacoes_funcionario_status` existe
- [ ] Índice `idx_funcionarios_clinica_perfil_ativo` existe
- [ ] Índice `idx_funcionarios_cpf_clinica_perfil` existe
- [ ] Índice `idx_laudos_emitido` existe

### Queries

- [ ] Query de listagem de funcionários (RH) < 100ms
- [ ] Query de listagem de avaliações (RH) < 100ms
- [ ] Query de listagem de empresas (RH) < 50ms
- [ ] Query de dados próprios (funcionário) < 50ms

### Validações

- [ ] `queryWithContext()` overhead < 10ms
- [ ] `validateSessionContext()` overhead < 20ms
- [ ] Nenhuma query crítica > 500ms

---

## 📈 Monitoramento (Primeiras 24h)

### Dia 1

- [ ] Verificar logs de `audit_access_denied` a cada 4 horas
- [ ] Monitorar performance de queries
- [ ] Coletar feedback de usuários RH
- [ ] Coletar feedback de usuários funcionários

### Semana 1

- [ ] Analisar crescimento de `audit_logs`
- [ ] Verificar necessidade de ajuste de índices
- [ ] Documentar casos de uso não previstos
- [ ] Treinar equipe nas novas políticas

---

## 🔍 Queries de Validação

### Verificar Políticas Criadas

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

- [ ] Executado com sucesso
- [ ] Retornou 50+ políticas

### Verificar Índices Criados

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

- [ ] Executado com sucesso
- [ ] Retornou 15+ índices

### Verificar Funções Criadas

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'user_has_permission',
    'validate_rh_clinica',
    'check_laudo_immutability',
    'log_access_denied'
);
```

- [ ] Executado com sucesso
- [ ] Retornou 4 funções

### Verificar Triggers

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

- [ ] Executado com sucesso
- [ ] Trigger `trigger_laudo_immutability` existe

### Verificar Tipos ENUM

```sql
SELECT typname FROM pg_type
WHERE typname IN ('status_avaliacao', 'status_lote', 'status_laudo');
```

- [ ] Executado com sucesso
- [ ] Retornou 3 tipos

---

## 📝 Documentação

- [ ] README lido e compreendido
- [ ] SUMMARY consultado
- [ ] QUICK-START utilizado
- [ ] Checklist preenchido
- [ ] Logs de testes salvos
- [ ] Screenshot de testes bem-sucedidos

---

## ✅ Aprovação Final

### Testes Automatizados

- [ ] Todos os testes SQL passaram (100%)
- [ ] Nenhum erro crítico nos logs

### Testes Manuais

- [ ] Pelo menos 80% dos testes manuais passaram
- [ ] Falhas documentadas e justificadas

### Performance

- [ ] Nenhuma degradação significativa (< 20%)
- [ ] Índices funcionando corretamente

### Segurança

- [ ] Isolamento entre clínicas validado
- [ ] Imutabilidade de dados críticos validada
- [ ] Validações de contexto funcionando

---

## 📋 Assinaturas

### Executor

**Nome**: ************\_\_\_************  
**Data**: \_**\_ / \_\_** / 2025  
**Hora**: \_**\_:\_\_**  
**Assinatura**: ************\_\_\_************

### Revisor

**Nome**: ************\_\_\_************  
**Data**: \_**\_ / \_\_** / 2025  
**Hora**: \_**\_:\_\_**  
**Assinatura**: ************\_\_\_************

### Aprovador (Tech Lead/CTO)

**Nome**: ************\_\_\_************  
**Data**: \_**\_ / \_\_** / 2025  
**Hora**: \_**\_:\_\_**  
**Assinatura**: ************\_\_\_************

---

## 🎯 Resultado Final

- [ ] ✅ **APROVADO** - Todas as correções funcionando corretamente
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Pequenos ajustes necessários (documentar abaixo)
- [ ] ❌ **REPROVADO** - Problemas críticos identificados (documentar abaixo)

### Observações / Problemas Encontrados:

```
[Descrever aqui qualquer problema, ressalva ou observação importante]





```

### Ações Corretivas (se necessário):

```
[Descrever ações necessárias para resolver problemas identificados]





```

---

**Versão do Checklist**: 1.0.0  
**Data de Criação**: 14/12/2025  
**Última Revisão**: 14/12/2025
