# Resumo da Implementação - Sistema de Índice de Avaliação

**Data**: 18 de dezembro de 2025  
**Projeto**: Qwork - Sistema de Avaliação Biopsicossocial  
**Versão**: 1.0.0

---

## 🎯 Objetivo

Implementar sistema de índice de avaliação para garantir que **nenhum funcionário fique mais de 1 ano sem realizar uma avaliação**, assegurando que o laudo biopsicossocial seja uma "foto" precisa do estado atual da empresa.

---

## ✅ O Que Foi Implementado

### 1. **Estrutura de Banco de Dados** ✅

#### Migration SQL (`database/migration-016-indice-avaliacao.sql`)

- ✅ Campo `indice_avaliacao` (int, default 0) em `funcionarios`
- ✅ Campo `data_ultimo_lote` (timestamp) em `funcionarios`
- ✅ Campo `numero_ordem` (int) em `lotes_avaliacao`
- ✅ 6 índices para performance (idx_funcionarios_indice_avaliacao, idx_funcionarios_data_ultimo_lote, idx_lotes_numero_ordem, idx_funcionarios_pendencias, etc.)
- ✅ Função helper `obter_proximo_numero_ordem(empresa_id)`
- ✅ População retroativa de dados existentes (índices calculados com base no histórico)
- ✅ Verificações e validações automáticas

#### Funções PostgreSQL (`database/functions-016-indice-avaliacao.sql`)

- ✅ **calcular_elegibilidade_lote(empresa_id, numero_lote_atual)**: Determina quais funcionários devem ser incluídos no próximo lote (novos, atrasados, >1 ano)
- ✅ **verificar_inativacao_consecutiva(cpf, lote_id)**: Valida se avaliação pode ser inativada. Observação: a primeira avaliação de funcionário recém-importado/inscrito é permitida sem sinalização; a partir da segunda inativação a operação é sinalizada como restrita (exige justificativa detalhada para forçar).
- ✅ **detectar_anomalias_indice(empresa_id)**: Detecta padrões suspeitos (>3 inativações, índices muito atrasados, >2 anos, nunca avaliado)
- ✅ **validar_lote_pre_laudo(lote_id)**: Check pré-laudo com alertas e métricas
- ✅ **obter_proximo_numero_ordem(empresa_id)**: Helper para gerar próximo número de ordem

#### Script de Execução (`run_migration_016.mjs`)

- ✅ Script Node.js para executar migration + functions automaticamente
- ✅ Verificações de estrutura pós-migration
- ✅ Estatísticas e relatórios de instalação

---

### 2. **APIs Backend** ✅

#### API: Inativar Avaliação (Nova)

**Endpoint**: `POST /api/avaliacoes/inativar`  
**Arquivo**: `app/api/avaliacoes/inativar/route.ts`

**Funcionalidades**:

- ✅ Validação de consecutividade (impede 2ª inativação seguida)
- ✅ Motivo obrigatório (mínimo 20 caracteres)
- ✅ Opção `forcar: true` para casos excepcionais (exige ≥50 caracteres)
- ✅ Registro de auditoria (`INATIVACAO_NORMAL` ou `INATIVACAO_FORCADA`)
- ✅ Endpoint GET para pré-validação (verificar se pode inativar antes de tentar)

**Response Exemplo (Bloqueio)**:

```json
{
  "error": "Inativação bloqueada",
  "permitido": false,
  "motivo": "⚠️ NÃO É POSSÍVEL INATIVAR! Funcionário já teve avaliação anterior inativada...",
  "total_inativacoes_consecutivas": 1,
  "ultima_inativacao_lote": "003-151225",
  "pode_forcar": true
}
```

#### API: Iniciar Ciclo (Atualizada)

**Endpoint**: `POST /api/rh/liberar-lote`  
**Arquivo**: `app/api/rh/liberar-lote/route.ts`

**Alterações**:

- ✅ Usa função `calcular_elegibilidade_lote()` para inclusão automática
- ✅ Gera `numero_ordem` automaticamente via `obter_proximo_numero_ordem()`
- ✅ Retorna resumo agregado com prioridades (críticas, altas, médias)
- ✅ Contadores por motivo de inclusão (novos, atrasados, >1 ano, regulares)

**Response Exemplo**:

```json
{
  "success": true,
  "lote": {
    "numero_ordem": 11,
    "codigo": "008-181225"
  },
  "resumoInclusao": {
    "funcionarios_novos": 5,
    "indices_atrasados": 3,
    "mais_de_1_ano_sem_avaliacao": 2,
    "prioridade_critica": 1,
    "prioridade_alta": 4,
    "mensagem": "Incluindo automaticamente: 5 funcionários com pendências prioritárias"
  }
}
```

#### API: Finalizar Avaliação (Atualizada)

**Endpoint**: `POST /api/avaliacao/finalizar`  
**Arquivo**: `app/api/avaliacao/finalizar/route.ts`

**Alterações**:

- ✅ Atualiza `indice_avaliacao` do funcionário com `numero_ordem` do lote
- ✅ Atualiza `data_ultimo_lote` com timestamp da conclusão
- ✅ Transação segura (UPDATE em `funcionarios` após conclusão)
- ✅ Registro de auditoria (`ATUALIZACAO_INDICE`)

#### API: Validar Lote Pré-Laudo (Nova)

**Endpoint**: `GET /api/laudos/validar-lote?lote_id=123`  
**Arquivo**: `app/api/laudos/validar-lote/route.ts`

**Funcionalidades**:

- ✅ Usa função `validar_lote_pre_laudo()` para verificar se lote está pronto
- ✅ Detecta padrões suspeitos via `detectar_anomalias_indice()` **e os reporta como alertas/informações (NÃO bloqueantes)**
- ✅ Retorna alertas, recomendações e métricas (taxa de conclusão, pendências, etc.), que devem ser exibidos como informações ao emissor do laudo
- ✅ Filtra anomalias relevantes aos funcionários do lote

**Response Exemplo**:

```json
{
  "valido": false,
  "pode_emitir": true,
  "validacao": {
    "total_avaliacoes": 50,
    "avaliacoes_concluidas": 42,
    "funcionarios_pendentes": 3,
    "taxa_conclusao": 84.0
  },
  "anomalias": {
    "total": 5,
    "do_lote": 2,
    "criticas": 1
  },
  "recomendacoes": [
    {
      "tipo": "PENDÊNCIA",
      "severidade": "ALTA",
      "mensagem": "3 funcionário(s) elegíveis não foram incluídos",
      "acao": "Considere criar um lote complementar"
    }
  ]
}
```

---

### 3. **Auditoria** ✅

Todos os eventos são registrados na tabela `auditorias` com tipos específicos:

- ✅ `ATUALIZACAO_INDICE`: Índice atualizado após conclusão de avaliação
- ✅ `INATIVACAO_NORMAL`: Inativação permitida (sem restrições)
- ✅ `INATIVACAO_FORCADA`: Inativação consecutiva forçada com justificativa detalhada

**Query de Auditoria**:

```sql
SELECT acao, detalhes, criado_em
FROM auditorias
WHERE acao IN ('ATUALIZACAO_INDICE', 'INATIVACAO_FORCADA', 'INATIVACAO_NORMAL')
ORDER BY criado_em DESC;
```

---

### 4. **Documentação** ✅

#### README Completo (`docs/INDICE-AVALIACAO-README.md`)

- ✅ Visão geral e conceitos centrais
- ✅ Instruções de instalação (migration + functions)
- ✅ Documentação completa das APIs backend
- ✅ Documentação das 5 funções PostgreSQL com exemplos
- ✅ Guia de implementação frontend (pendente)
- ✅ Guia de integração PWA/Offline (pendente)
- ✅ Exemplos de testes Jest e Cypress (pendente)
- ✅ Troubleshooting e suporte
- ✅ Roadmap e checklist de progresso

---

## ⏳ O Que Está Pendente (Frontend & Testes)

### 1. **Frontend - Indicadores na Lista de Funcionários** ⏳

- [ ] Adicionar coluna "Última Avaliação" mostrando índice
- [ ] Ícone de alerta (⚠️ ou 🔴) para pendências (índice 0, >1 ano)
- [ ] Badge ou cor de fundo para destacar funcionários com pendências
- [ ] Filtro/ordenação por "Com Pendências"

**Localização**: `app/rh/empresa/[id]/page.tsx`

---

### 2. **Frontend - Modal de Inativação com Validação** ⏳

- [ ] Chamada GET pré-validação antes de mostrar modal
- [ ] Botão de inativação com cor diferente se houver restrição
- [ ] Modal de aviso explícito mostrando motivo do bloqueio
- [ ] Opção "Forçar Inativação" com justificativa obrigatória (≥50 caracteres)
- [ ] Integração com API POST `/api/avaliacoes/inativar`

**Localização**: Criar componente `ModalInativarAvaliacao.tsx` ou modificar existente

---

### 3. **Frontend - Aba "Pendências" no Dashboard** ⏳

- [ ] Nova aba no dashboard da empresa (`app/rh/empresa/[id]/page.tsx`)
- [ ] Métricas agregadas:
  - Funcionários com índice 0 (nunca fizeram)
  - Índices atrasados (>2 lotes de diferença)
  - Mais de 1 ano sem avaliação
  - Anomalias críticas e altas
- [ ] Lista filtrada e paginada de funcionários com pendências
- [ ] Botão "Incluir no Próximo Lote" para ação rápida

---

### 4. **Frontend - Resumo no Modal de Iniciar Ciclo** ⏳

- [ ] Mostrar resumo agregado após gerar lote (response da API)
- [ ] Card com estatísticas:
  - ✅ X funcionários novos
  - ⚠️ X índices atrasados
  - 🔴 X prioridade crítica
  - 🟠 X prioridade alta
- [ ] Link para aba "Pendências" se houver críticos

---

### 5. **Frontend - Banner de Alerta na Página do Funcionário** ⏳

- [ ] Seção "Status de Avaliação" no topo da página do funcionário
- [ ] Banner colorido para pendências (vermelho/amarelo)
- [ ] Timeline ou lista de avaliações passadas (✅ concluída, ❌ inativada, ⏳ pendente)
- [ ] Texto explicativo: "Você tem uma avaliação inativada consecutiva. É obrigatório participar da próxima..."

**Localização**: Criar página `app/rh/funcionario/[cpf]/page.tsx` ou modal de detalhes

---

### 6. **PWA/Offline - Sincronização de Índice** ⏳

- [ ] Atualizar `PWAInitializer.tsx` para incluir índice no IndexedDB
- [ ] Incrementar `DB_VERSION` e criar índices no objectStore
- [ ] Função `syncIndice()` para sincronizar ao reconectar
- [ ] Service Worker para cachear dados offline

---

### 7. **Testes Automatizados** ⏳

- [ ] Testes Jest:
  - Deve incluir funcionário novo (índice 0) automaticamente
  - Deve bloquear 2ª inativação consecutiva
  - Deve atualizar índice após conclusão
  - Deve detectar anomalias corretamente
  - Deve validar lote pré-laudo com alertas
- [ ] Testes Cypress:
  - Deve gerar lote com resumo agregado
  - Deve mostrar aviso ao inativar consecutivamente
  - Deve exibir indicadores na lista de funcionários
  - Deve navegar para aba "Pendências"

---

## 📊 Progresso Geral

### Backend (SQL + APIs)

- **Progresso**: 8/8 (100%)
- ✅ Migration SQL
- ✅ Funções PostgreSQL
- ✅ API Inativar
- ✅ API Iniciar Ciclo
- ✅ API Finalizar
- ✅ API Validar Lote
- ✅ Auditoria
- ✅ Documentação

### Frontend

- **Progresso**: 0/5 (0%)
- ⏳ Indicadores na lista
- ⏳ Modal de inativação
- ⏳ Aba Pendências
- ⏳ Resumo no lote
- ⏳ Banner funcionário

### PWA/Offline

- **Progresso**: 0/1 (0%)
- ⏳ Sincronização de índice

### Testes

- **Progresso**: 0/2 (0%)
- ⏳ Testes Jest
- ⏳ Testes Cypress

---

## 🚀 Próximos Passos

1. **Executar Migration**:

   ```bash
   node run_migration_016.mjs
   ```

2. **Testar APIs**:
   - Testar POST `/api/rh/liberar-lote` (verificar resumo agregado)
   - Testar POST `/api/avaliacoes/inativar` (tentar inativar consecutivamente)
   - Testar GET `/api/laudos/validar-lote` (verificar alertas)

3. **Implementar Frontend** (ordem sugerida):
   1. Indicadores na lista de funcionários (mais rápido)
   2. Modal de inativação com validação
   3. Resumo no modal de Iniciar Ciclo
   4. Aba "Pendências"
   5. Banner na página do funcionário

4. **Integração PWA/Offline**:
   - Incrementar versão do IndexedDB
   - Adicionar sincronização de índice

5. **Testes**:
   - Criar testes Jest para funções PostgreSQL
   - Criar testes Cypress para fluxo completo

---

## 📝 Notas Técnicas

### Decisões de Implementação

1. **Índice Numérico Simples**: Escolhido número sequencial (1, 2, 3...) em vez de código do lote para simplicidade e retrocompatibilidade.

2. **Função de Elegibilidade Centralizada**: Lógica de inclusão em função PostgreSQL para evitar duplicação e garantir consistência.

3. **Auditoria Manual**: Logs inseridos manualmente nas APIs em vez de triggers PostgreSQL para maior controle e flexibilidade.

4. **Inativação Forçada**: Opção de forçar inativação consecutiva para casos excepcionais (licença médica, afastamento) com justificativa obrigatória.

5. **Check Pré-Laudo Não Bloqueante**: Validação retorna alertas mas permite emissão (pode_emitir: true) para evitar bloqueios desnecessários.

### Performance

- Índices criados para queries frequentes (`indice_avaliacao`, `data_ultimo_lote`, `numero_ordem`)
- Índice composto para pendências (`empresa_id, ativo, indice_avaliacao, data_ultimo_lote`)
- Queries otimizadas com filtros WHERE e LIMIT

### Segurança

- Validação de perfil em todas as APIs (apenas RH/admin/emissor)
- Auditoria completa de ações críticas
- Justificativa obrigatória para forçar inativações

---

## 🔧 Comandos Úteis

### Verificar Estrutura

```sql
-- Funcionários por índice
SELECT indice_avaliacao, COUNT(*)
FROM funcionarios
GROUP BY indice_avaliacao
ORDER BY indice_avaliacao;

-- Lotes com numero_ordem
SELECT codigo, numero_ordem, liberado_em
FROM lotes_avaliacao
ORDER BY numero_ordem DESC;
```

### Testar Funções

```sql
-- Elegibilidade
SELECT * FROM calcular_elegibilidade_lote(1, 11);

-- Inativação consecutiva
SELECT * FROM verificar_inativacao_consecutiva('12345678901', 123);

-- Anomalias
SELECT * FROM detectar_anomalias_indice(1);

-- Validar lote
SELECT * FROM validar_lote_pre_laudo(123);
```

### Auditoria

```sql
SELECT acao, detalhes, criado_em
FROM auditorias
WHERE acao IN ('ATUALIZACAO_INDICE', 'INATIVACAO_FORCADA')
ORDER BY criado_em DESC
LIMIT 20;
```

---

## 📞 Suporte

Para mais informações, consultar:

- **README Completo**: [docs/INDICE-AVALIACAO-README.md](docs/INDICE-AVALIACAO-README.md)
- **Migration SQL**: [database/migration-016-indice-avaliacao.sql](database/migration-016-indice-avaliacao.sql)
- **Functions SQL**: [database/functions-016-indice-avaliacao.sql](database/functions-016-indice-avaliacao.sql)
- **Script de Execução**: [run_migration_016.mjs](run_migration_016.mjs)

---

**Status**: ✅ Backend Completo | ⏳ Frontend Pendente | ⏳ Testes Pendentes  
**Última Atualização**: 18 de dezembro de 2025
