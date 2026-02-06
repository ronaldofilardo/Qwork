# Testes de Estrutura Organizacional: Entidades vs Clínicas

## 📋 Visão Geral

Este conjunto de testes valida a estrutura organizacional correta do sistema, garantindo que:

### **Entidades [gestor]**

- ✅ Geram DIRETAMENTE seus funcionários, avaliações e lotes
- ✅ NÃO passam por clínica ou empresa intermediária
- ✅ Usam `contratante_id` para vínculo
- ✅ `clinica_id` e `empresa_id` devem ser NULL

### **Clínicas [rh]**

- ✅ Geram EMPRESAS (clientes)
- ✅ Cada empresa tem funcionários, avaliações e lotes
- ✅ Tabela `empresas_clientes` SEMPRE vinculada à `clinica` (`clinica_id NOT NULL`)
- ✅ Funcionários de empresa têm `empresa_id + clinica_id` (NÃO `contratante_id`)

## 🧪 Suítes de Testes

### 1. **entidades-gestores.test.ts**

Valida o fluxo completo de Entidades (Gestor):

- ✅ Criar funcionário vinculado à entidade
- ✅ Criar lote de entidade
- ✅ Criar avaliação para funcionário de entidade
- ✅ Validar estrutura organizacional
- ✅ Validar constraints do banco
- ✅ Validar view `gestores`

**Cobertura:**

- Criação de contratante tipo 'entidade'
- Criação de gestor na tabela `usuarios`
- Criação de funcionários com `contratante_id`
- Criação de lotes com `contratante_id`
- Criação de avaliações
- Validação de hierarquia completa

### 2. **clinicas-rh.test.ts**

Valida o fluxo completo de Clínicas (RH):

- ✅ Criar empresa SEMPRE vinculada à clínica
- ✅ Criar funcionário vinculado à empresa E à clínica
- ✅ Criar lote de clínica/empresa
- ✅ Criar avaliação para funcionário de empresa
- ✅ Validar estrutura organizacional
- ✅ Validar constraints do banco

**Cobertura:**

- Criação de contratante tipo 'clinica'
- Criação de registro em tabela `clinicas`
- Criação de gestor RH na tabela `usuarios`
- Criação de empresas com `clinica_id NOT NULL`
- Criação de funcionários com `empresa_id + clinica_id`
- Criação de lotes com `clinica_id + empresa_id`
- Validação de hierarquia completa

### 3. **isolamento-entidades-clinicas.test.ts**

Valida o isolamento TOTAL entre os dois fluxos:

- ✅ Funcionários de ENTIDADES não aparecem em queries de CLÍNICA
- ✅ Funcionários de EMPRESAS/CLÍNICAS não aparecem em queries de ENTIDADE
- ✅ Lotes de ENTIDADES não aparecem em queries de CLÍNICA
- ✅ Lotes de CLÍNICAS não aparecem em queries de ENTIDADE
- ✅ Avaliações respeitam isolamento
- ✅ Exclusividade de campos (`contratante_id` XOR `clinica_id`)

**Cobertura:**

- Setup completo de entidade E clínica no mesmo teste
- Queries de isolamento em ambas as direções
- Validação de exclusividade mútua de campos
- Contagem de recursos por tipo

### 4. **validacao-constraints.test.ts**

Valida TODAS as constraints críticas do banco:

#### Constraints Validadas:

- ✅ `usuarios_gestor_check` - Gestor deve ter `entidade_id` e NÃO ter `clinica_id`
- ✅ `funcionarios_owner_check` - Funcionário de entidade OU de empresa (exclusivo)
- ✅ `empresas_clientes.clinica_id` NOT NULL
- ✅ Enum `usuario_tipo_enum` - Contém 'gestor', NÃO contém 'gestor'
- ✅ Foreign Keys - Todas as referências existem
- ✅ Índices - Otimização de queries
- ✅ View `gestores` - Apenas RH e Gestor
- ✅ Integridade Referencial - Sem registros órfãos
- ✅ Validação de dados existentes

**Cobertura:**

- Criação de dados válidos (deve passar)
- Tentativa de criação de dados inválidos (deve falhar)
- Verificação de estrutura do banco
- Validação de dados em produção

## 📊 Estatísticas

### Total de Testes

- **Entidades (Gestor):** 12+ testes
- **Clínicas (RH):** 14+ testes
- **Isolamento:** 16+ testes
- **Constraints:** 25+ testes
- **TOTAL:** **67+ testes**

### Cobertura

- ✅ Criação de dados (CRUD completo)
- ✅ Validação de constraints
- ✅ Isolamento entre fluxos
- ✅ Integridade referencial
- ✅ Estrutura do banco
- ✅ Views e funções

## 🚀 Como Executar

### Executar todos os testes de integração

```bash
npm test __tests__/integration/
```

### Executar teste específico

```bash
npm test __tests__/integration/entidades-gestores.test.ts
npm test __tests__/integration/clinicas-rh.test.ts
npm test __tests__/integration/isolamento-entidades-clinicas.test.ts
npm test __tests__/integration/validacao-constraints.test.ts
```

### Executar com cobertura

```bash
npm test -- --coverage __tests__/integration/
```

## ✅ Checklist de Validação

### Após Executar os Testes

- [ ] Todos os testes de entidades passam
- [ ] Todos os testes de clínicas passam
- [ ] Todos os testes de isolamento passam
- [ ] Todos os testes de constraints passam
- [ ] Nenhum registro órfão no banco
- [ ] Nenhuma violação de constraint
- [ ] View `gestores` funcionando corretamente
- [ ] Enum `usuario_tipo_enum` correto (sem `gestor`)

### Validação Manual Adicional

```sql
-- 1. Verificar enum
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'usuario_tipo_enum'::regtype
ORDER BY enumlabel;
-- Deve conter: admin, emissor, funcionario_clinica, funcionario_entidade, gestor, rh

-- 2. Verificar constraints
SELECT conname FROM pg_constraint
WHERE conname IN ('usuarios_gestor_check', 'funcionarios_owner_check');
-- Deve retornar ambas

-- 3. Verificar empresas sem clinica_id
SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL;
-- Deve retornar 0

-- 4. Verificar view gestores
SELECT COUNT(*) FROM gestores;
-- Deve retornar total de gestores (RH + Gestor)
```

## 🔧 Troubleshooting

### Teste falhando: "gestor não existe no enum"

**Solução:** Executar migration 400b para remover `gestor`

```bash
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400b_correcao_parcial.sql
```

### Teste falhando: "Constraint usuarios_gestor_check não existe"

**Solução:** Executar migration 400b

```bash
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400b_correcao_parcial.sql
```

### Teste falhando: "Empresas sem clinica_id"

**Solução:** Atualizar empresas órfãs ou executar migration de correção

```sql
-- Verificar empresas sem clinica_id
SELECT id, nome FROM empresas_clientes WHERE clinica_id IS NULL;

-- Corrigir manualmente (substituir 1 por ID da clínica correta)
UPDATE empresas_clientes SET clinica_id = 1 WHERE clinica_id IS NULL;
```

## 📝 Notas Importantes

1. **Ambiente de Teste:** Os testes criam e limpam dados automaticamente. Não interferem com dados de produção.

2. **Transações:** Cada teste é isolado e faz limpeza (cleanup) ao final.

3. **Performance:** Os testes podem ser executados em paralelo se necessário.

4. **Manutenção:** Sempre executar os testes após mudanças no schema ou migrações.

## 🎯 Objetivos Alcançados

✅ **Estrutura Correta:** Entidades e Clínicas completamente separadas  
✅ **Isolamento Total:** Nenhum cruzamento de dados entre os fluxos  
✅ **Constraints Validadas:** Todas as regras de negócio implementadas  
✅ **Integridade Garantida:** Sem registros órfãos ou dados inconsistentes  
✅ **Documentação Completa:** Testes servem como documentação viva

## 📚 Referências

- [GUIA_CONCLUSAO_MIGRACAO.md](../../GUIA_CONCLUSAO_MIGRACAO.md)
- [MIGRACAO_CONTRATANTES_PARA_ENTIDADES.md](../../MIGRACAO_CONTRATANTES_PARA_ENTIDADES.md)
- [Migration 400](../../database/migrations/400_corrigir_estrutura_entidades_empresas.sql)
- [Migration 400b](../../database/migrations/400b_correcao_parcial.sql)
