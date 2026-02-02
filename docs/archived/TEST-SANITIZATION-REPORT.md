# Relatório de Sanitização de Testes - 2026-01-04 15:10

## Status Atual
- ✅ **236 suites passando** (70%)  
- ❌ **90 suites falhando** (27%)
- ⏭️ **12 suites skip** (3%)
- ✅ **2280 testes passando** (+12 desde início)
- ❌ **368 testes falhando** (-12 desde início)

## Correções Implementadas

### 1. EmissorDashboard (10/10 ✅)
- Criado __tests__/helpers/test-utils.tsx com utilitários React Query
- Todos os 11 ender() substituídos por enderWithQueryClient()

### 2. test-utils.tsx (✅)
- Movido para helpers/ para evitar execução como suite de teste

### 3. ModalInserirFuncionario (22/23 ✅)
- Adicionado clinica_id: 1 ao mock de equireRHWithEmpresaAccess
- Melhorou de 3 falhas → 1 falha

### 4. novos-cadastros-regenerar-link (6/10 ✅)
- Corrigido mock de getSession (deve ser síncrono, não async)
- Melhorou de 0/10 → 6/10 testes passando

## Categorias de Falhas Restantes

1. **QueryClient faltando** - Componentes React usando useQuery sem provider
2. **Mocks de sessão** - Testes esperando getSession async mas é síncrono
3. **Constraints/Schema** - liberado_por NOT NULL, nivel_cargo checks
4. **APIs desatualizadas** - Testes de features removidas/refatoradas

## Próximos Passos
1. Deletar testes obsoletos (sistema-pagamentos-modificacoes, etc)
2. Aplicar padrão de mock síncrono em outros testes admin
3. Revisar testes com constraints para adicionar dados obrigatórios
