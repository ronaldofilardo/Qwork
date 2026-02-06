# LIMPEZA DE CÓDIGO LEGADO - GESTORES EM FUNCIONARIOS

Data: 05/02/2026
Status: PENDENTE DE REVISÃO/REMOÇÃO

## ⚠️ ARQUIVOS QUE NECESSITAM REVISÃO

### 1. Testes que esperam gestores em `funcionarios`

Estes testes foram escritos baseados no modelo antigo e precisam ser atualizados para validar `usuarios`:

- `__tests__/registration/criarContaResponsavel.unit.test.ts`
  - Linha 77: `expect(f.rows[0].usuario_tipo).toBe('gestor');`
  - **Ação:** Remover teste ou adaptar para validar que NÃO cria em funcionarios

- `__tests__/lib/criarContaResponsavel.integration.test.ts`
  - Linhas 79, 181: esperam `usuario_tipo` em funcionarios
  - **Ação:** Adaptar para validar criação em `usuarios` ao invés de `funcionarios`

- `__tests__/rh/gestores-rh-integration.test.ts`
  - Arquivo COMPLETO valida `usuario_tipo` em funcionarios
  - **Ação:** Reescrever testes para validar `usuarios.tipo_usuario = 'rh'`

- `__tests__/security/rls-rbac.test.ts`
  - Linhas 245, 257, 272: queries buscam gestores em funcionarios
  - **Ação:** Atualizar para consultar `usuarios`

- `__tests__/contracts/payment-confirmation-integration.test.ts`
  - Linhas 60, 81, 94, 140, 149, 157, 166: mocks e expects sobre `usuario_tipo` em funcionarios
  - **Ação:** Atualizar para refletir `usuarios.tipo_usuario`

- `__tests__/corrections/conversation-changes.test.ts`
  - Linha 54: `expect(user.usuario_tipo).toBe('rh');`
  - **Ação:** Atualizar para `usuarios.tipo_usuario`

- `__tests__/database/migration-data.test.ts`
  - Linha 49: conta gestores em funcionarios
  - **Ação:** Adaptar para contar em `usuarios`

- `__tests__/api/admin/emissores-create.test.ts`
  - Linha 292: delete de rh em funcionarios
  - **Ação:** Adaptar para `usuarios`

### 2. Documentação e schemas legados

- `txt-files/neon-schema-report.txt`
  - Linha 83: enum inclui `rh`, `gestor` em `usuario_tipo_enum`
  - **Ação:** Documentar que estes valores estão deprecated em funcionarios

- `txt-files/local-schema-report.txt`
  - Linha 70: mesmo caso
  - **Ação:** Adicionar nota de deprecation

- `schema-comparison/*.txt`
  - Múltiplas referências a `usuario_tipo` para gestores
  - **Ação:** Marcar como legado nos diffs

### 3. Scripts legados que criam gestores em funcionarios

- `scripts/create_responsavel_account.js`
  - **Análise necessária:** verificar se ainda é usado
  - **Ação:** Deprecar ou adaptar para usar `usuarios`

- Qualquer script em `scripts/setup/` ou `scripts/fixes/` que manipule gestores
  - **Ação:** Auditoria manual necessária

### 4. Views e funções de banco de dados

- Qualquer VIEW que agregue gestores a partir de `funcionarios.usuario_tipo`
  - **Ação:** Buscar no banco com:
    ```sql
    SELECT * FROM information_schema.views
    WHERE view_definition ILIKE '%usuario_tipo%';
    ```

- Funções pl/pgsql que consultam gestores por `funcionarios`
  - **Ação:** Buscar no banco com:
    ```sql
    SELECT routine_name, routine_definition
    FROM information_schema.routines
    WHERE routine_definition ILIKE '%usuario_tipo%gestor%';
    ```

### 5. Comentários e docs inline no código

Buscar e remover/atualizar comentários que mencionam:

- "gestor em funcionarios"
- "responsável é funcionário"
- "gestores na tabela funcionarios"
- "usuario_tipo para gestores"

**Comando de busca:**

```bash
grep -r "gestor.*funcionario" --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "usuario_tipo.*gestor" --include="*.ts" --include="*.tsx"
```

## ✅ AÇÕES RECOMENDADAS (Ordem de Execução)

1. **Atualizar testes (PRIORITÁRIO)**
   - Começar por `criarContaResponsavel.*.test.ts`
   - Reescrever `gestores-rh-integration.test.ts`
   - Atualizar mocks em `payment-confirmation-integration.test.ts`

2. **Deprecar scripts legados**
   - Marcar `scripts/create_responsavel_account.js` como deprecated
   - Criar versão atualizada se necessário

3. **Limpar documentação**
   - Adicionar avisos de deprecation nos schemas
   - Atualizar READMEs e docs inline

4. **Auditoria de banco de dados**
   - Executar queries para encontrar views/funções legadas
   - Planejar atualização de views

5. **Remover código morto (ÚLTIMO)**
   - Após validação em staging, remover código comentado
   - Remover funções/helpers não utilizados

## 🚨 CUIDADOS

- **NÃO remover** `funcionarios.usuario_tipo` da estrutura do banco ainda
  - Pode ser necessário para rollback
  - Manter por 1-2 ciclos de release

- **NÃO deletar** registros de gestores em `funcionarios` automaticamente
  - Fazer apenas após validação completa
  - Criar script de limpeza manual se necessário

- **Testar em staging** antes de aplicar em produção

## 📊 MÉTRICAS DE SUCESSO

Após limpeza completa:

- ✅ Todos os testes passando
- ✅ Zero referências a `usuario_tipo` para gestores em código ativo
- ✅ Documentação atualizada
- ✅ Views/funções de banco atualizadas
- ✅ Scripts legados deprecados ou atualizados
