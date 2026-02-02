# Análise Comparativa: Fluxo de Emissão de Laudos (Entidade/RH vs Clínica)

**Data:** 30/01/2026  
**Contexto:** Análise solicitada após implementação do botão "Iniciar Laudo" no dashboard do emissor

---

## 📊 VISÃO GERAL DOS ATORES

### Hierarquia do Sistema:

```
┌─────────────────────────────────────────────────────────┐
│                       CLÍNICA                           │
│  (Proprietária das empresas-clientes)                   │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼────────┐              ┌────────▼─────────┐
│  EMPRESA-      │              │   CONTRATANTE    │
│  CLIENTE       │              │   (Entidade)     │
│  (com RH)      │              │   (sem RH)       │
└────────────────┘              └──────────────────┘
        │                                 │
        │                                 │
   ┌────▼────┐                      ┌────▼────┐
   │  LOTE   │                      │  LOTE   │
   │(empresa)│                      │(entid.) │
   └─────────┘                      └─────────┘
```

---

## 🔄 FLUXO 1: ENTIDADE (Gestor de Entidade)

### Endpoint: `POST /api/entidade/liberar-lote`

**Permissão:** `requireEntity()` - Gestor vinculado a contratante

### Características:

1. **Criação de Lote:**

   ```typescript
   - Status inicial: 'ativo'
   - Campo: liberado_por (pode ser NULL se gestor não for funcionário)
   - Campo: contratante_id (obrigatório)
   - Campo: empresa_id (pode ser NULL para funcionários diretos da entidade)
   - Campo: clinica_id (pode ser NULL)
   ```

2. **Criação de Avaliações:**

   ```typescript
   // Para empresas vinculadas:
   status: 'liberada';

   // Para funcionários diretos da entidade:
   status: 'iniciada'; // ❌ INCONSISTÊNCIA DETECTADA
   ```

3. **Envio para Emissor:**
   - ❌ **NÃO cria registro em fila_emissao** no momento da liberação
   - ✅ Registro criado automaticamente por `recalcularStatusLotePorId()` quando lote fica 'concluido'
   - Trigger: Última avaliação concluída/inativada

4. **Auditoria:**
   ```typescript
   action: 'liberar_lote';
   resource: 'lotes_avaliacao';
   details: {
     (empresa_id,
       contratante_id,
       tipo,
       codigo,
       numero_ordem,
       avaliacoes_criadas,
       total_funcionarios);
   }
   ```

---

## 🔄 FLUXO 2: RH (Funcionário RH de Empresa-Cliente)

### Endpoint: `POST /api/rh/liberar-lote`

**Permissão:** `requireRHWithEmpresaAccess()` - RH vinculado à mesma clínica da empresa

### Características:

1. **Criação de Lote:**

   ```typescript
   - Status inicial: 'ativo'
   - Campo: liberado_por (user.cpf - sempre preenchido)
   - Campo: empresa_id (obrigatório)
   - Campo: clinica_id (obrigatório)
   - Campo: contratante_id (NULL)
   ```

2. **Criação de Avaliações:**

   ```typescript
   status: 'liberada'; // ✅ CONSISTENTE
   ```

3. **Envio para Emissor:**
   - ❌ **NÃO cria registro em fila_emissao** no momento da liberação
   - ✅ Registro criado automaticamente por `recalcularStatusLotePorId()` quando lote fica 'concluido'
   - Trigger: Última avaliação concluída/inativada

4. **Auditoria:**
   ```typescript
   action: 'liberar_lote'
   resource: 'lotes_avaliacao'
   details: {
     empresa_id, empresa_nome, tipo, codigo, numero_ordem,
     avaliacoes_criadas, total_funcionarios,
     resumo_inclusao: { novos, atrasados, mais_de_1_ano, ... }
   }
   ```

---

## 🔄 FLUXO 3: CLÍNICA (Administrador de Clínica)

### Endpoint: ❌ **NÃO EXISTE**

**Permissão:** `requireClinica()` - mas sem endpoint de criação de lote

### Características:

1. **Criação de Lote:**
   - ❌ Clínica **NÃO cria lotes**
   - ✅ Clínica **recebe laudos** criados por RH de suas empresas

2. **Visualização de Laudos:**

   ```typescript
   GET /api/clinica/laudos
   - Retorna laudos de TODAS empresas da clínica
   - Filtro: status IN ('enviado', 'emitido')
   - Acesso: através de la.clinica_id
   ```

3. **Download de Laudos:**

   ```typescript
   GET /api/clinica/laudos/[laudoId]/download
   - Download do PDF do laudo
   - Validação: laudo pertence à clínica
   ```

4. **Papel no Fluxo:**
   - 🔵 **PASSIVO**: Apenas visualiza/baixa laudos já emitidos
   - 🔵 **AGREGADOR**: Vê laudos de todas suas empresas-clientes

---

## 🎯 PONTO COMUM: FUNÇÃO `recalcularStatusLotePorId()`

### Local: `lib/lotes.ts` (linhas 100-180)

**Trigger:** Chamada após conclusão/inativação de avaliação

### Lógica:

```typescript
if (todas_avaliacoes_finalizadas) {
  // 1. Atualizar status do lote
  UPDATE lotes_avaliacao SET status = 'concluido' WHERE id = loteId

  // 2. Criar registro na fila_emissao
  INSERT INTO fila_emissao (lote_id, solicitado_em)
  VALUES (loteId, NOW())
  ON CONFLICT (lote_id) DO NOTHING

  // 3. Criar notificação para quem liberou
  INSERT INTO notificacoes (
    user_cpf: liberado_por,
    tipo: 'lote_aguardando_solicitacao_emissao',
    mensagem: 'Lote {codigo} concluído - aguardando emissão do laudo'
  )
}
```

---

## ⚡ FLUXO DE EMISSÃO (COMUM A TODOS)

### 1. Lote Concluído → Fila de Emissão

```
[Entidade/RH libera lote]
         ↓
[Funcionários respondem avaliações]
         ↓
[Última avaliação concluída/inativada]
         ↓
[recalcularStatusLotePorId() executa]
         ↓
[INSERT INTO fila_emissao]
         ↓
[Lote aparece no dashboard do EMISSOR]
```

### 2. Emissor Gera Laudo

```
[Emissor acessa /emissor/page.tsx]
         ↓
[Clica "Iniciar Laudo"]
         ↓
[POST /api/emissor/laudos/[loteId]]
         ↓
[Validação: total_liberadas === (concluidas + inativadas)]
         ↓
[gerarLaudoCompletoEmitirPDF(loteId, emissor.cpf)]
         ↓
[Puppeteer gera PDF + SHA-256 hash]
         ↓
[INSERT INTO laudos (status='enviado')]
         ↓
[DELETE FROM fila_emissao WHERE lote_id = loteId]
         ↓
[Upload assíncrono para Backblaze]
```

### 3. Laudo Disponível

```
[RH/Entidade]: /rh/empresa/[id]/lote/[loteId] (visualiza e baixa)
[Clínica]:     /api/clinica/laudos (lista todos)
               /api/clinica/laudos/[laudoId]/download
[Emissor]:     /emissor/laudo/[loteId] (visualiza)
```

---

## 📋 TABELA COMPARATIVA

| Aspecto                      | Entidade                              | RH                             | Clínica            |
| ---------------------------- | ------------------------------------- | ------------------------------ | ------------------ |
| **Cria Lotes**               | ✅ Sim                                | ✅ Sim                         | ❌ Não             |
| **Endpoint**                 | `/api/entidade/liberar-lote`          | `/api/rh/liberar-lote`         | -                  |
| **Permissão**                | `requireEntity()`                     | `requireRHWithEmpresaAccess()` | `requireClinica()` |
| **empresa_id**               | Opcional (NULL para func. diretos)    | Obrigatório                    | -                  |
| **contratante_id**           | Obrigatório                           | NULL                           | -                  |
| **clinica_id**               | Opcional (NULL se sem empresa)        | Obrigatório                    | -                  |
| **Status Inicial Avaliação** | 'liberada' ou 'iniciada' ⚠️           | 'liberada' ✅                  | -                  |
| **liberado_por**             | Opcional (NULL se gestor não é func.) | Obrigatório (user.cpf)         | -                  |
| **Cria fila_emissao**        | ❌ Não (automático)                   | ❌ Não (automático)            | -                  |
| **Visualiza Laudos**         | ✅ Seus lotes                         | ✅ Seus lotes                  | ✅ Todas empresas  |
| **Baixa Laudos**             | ✅ Sim                                | ✅ Sim                         | ✅ Sim             |
| **Papel**                    | 🟢 Criador (entidade)                 | 🟢 Criador (empresa)           | 🔵 Consumidor      |

---

## ⚠️ INCONSISTÊNCIAS DETECTADAS

### 1. Status de Avaliação na Entidade

**Local:** `/api/entidade/liberar-lote/route.ts` linha 321

```typescript
// Para funcionários de empresas:
status: 'liberada' ✅

// Para funcionários diretos da entidade:
status: 'iniciada' ❌ INCONSISTENTE
```

**Problema:** Funcionários diretos da entidade têm status 'iniciada' mas não acessaram ainda.

**Impacto:**

- Dashboard mostra "Continuar" ao invés de "Iniciar"
- Contador de liberadas não inclui esses funcionários
- Validação de lote pronto pode falhar

**Correção Recomendada:**

```typescript
// Linha 321 - trocar para:
status: 'liberada'; // Mantém consistência
```

### 2. Campo `liberado_por` Inconsistente

**Entidade:**

```typescript
liberado_por: gestorEstaFuncionario ? session.cpf : null;
```

**RH:**

```typescript
liberado_por: user.cpf; // Sempre preenchido
```

**Problema:**

- Notificação de lote concluído depende de `liberado_por` não ser NULL
- Gestor de entidade pode não receber notificação

**Impacto:**

- Notificações podem falhar silenciosamente
- Auditoria perde rastreabilidade

**Correção Recomendada:**

- Criar funcionário "virtual" para gestor ou
- Usar contratante_id para notificações de entidade

---

## ✅ PONTOS POSITIVOS (CONSISTÊNCIAS)

1. **Validação Única para Emissão:**
   - Ambos usam mesma lógica: `parseInt(total_liberadas) === (parseInt(concluidas) + parseInt(inativadas))`
   - Fix aplicado em ambos endpoints GET e POST

2. **Função Centralizada:**
   - `recalcularStatusLotePorId()` unifica transição para 'concluido'
   - Garante que fila_emissao é criada consistentemente

3. **Geração de Laudo Única:**
   - `gerarLaudoCompletoEmitirPDF()` processa qualquer lote da mesma forma
   - RLS configurado corretamente no cliente isolado

4. **Hash e Armazenamento:**
   - SHA-256 para todos os laudos
   - storage/laudos/ + Backblaze para todos

5. **Auditoria Completa:**
   - Ambos registram em `audit_logs`
   - Detalhes completos do lote e avaliações

---

## 🎯 RECOMENDAÇÕES

### Prioridade ALTA:

1. ✅ **CORRIGIR**: Status 'iniciada' para 'liberada' em lotes de entidade (funcionários diretos)
2. ⚠️ **PADRONIZAR**: `liberado_por` sempre preenchido (criar funcionário virtual se necessário)

### Prioridade MÉDIA:

3. 📝 **DOCUMENTAR**: Diferença entre empresa_id e contratante_id no schema
4. 🔔 **MELHORAR**: Sistema de notificações para entidades sem `liberado_por`

### Prioridade BAIXA:

5. 📊 **MONITORAR**: Laudos que ficam na fila_emissao por muito tempo
6. 🧪 **TESTAR**: Cenários de lote sem empresa_id e sem clinica_id

---

## 📈 FLUXOGRAMA CONSOLIDADO

```
┌─────────────────┐         ┌─────────────────┐
│   ENTIDADE      │         │       RH        │
│  libera lote    │         │  libera lote    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │  empresa_id=NULL/present  │  empresa_id=required
         │  contratante_id=required  │  contratante_id=NULL
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   LOTES_AVALIACAO     │
         │   status='ativo'      │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │    AVALIAÇÕES         │
         │   status='liberada'   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  Funcionários          │
         │  respondem avaliações  │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Última concluída/     │
         │ inativada             │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ recalcularStatus      │
         │ LotePorId()           │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ status='concluido'    │
         │ INSERT fila_emissao   │
         │ CREATE notificacao    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   EMISSOR DASHBOARD   │
         │  "Iniciar Laudo"      │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ POST /api/emissor/    │
         │ laudos/[loteId]       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ gerarLaudoCompleto    │
         │ EmitirPDF()           │
         │ - Puppeteer           │
         │ - SHA-256             │
         │ - Local storage       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   LAUDOS TABLE        │
         │   status='enviado'    │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌────────────────┐    ┌─────────────────┐
│  RH/ENTIDADE   │    │    CLÍNICA      │
│  Visualiza     │    │    Lista todos  │
│  Baixa PDF     │    │    Baixa PDFs   │
└────────────────┘    └─────────────────┘
```

---

## 🎓 CONCLUSÃO

**SEMELHANÇAS (80%):**

- ✅ Ambos criam lotes com avaliações
- ✅ Ambos dependem de `recalcularStatusLotePorId()` para ir para emissor
- ✅ Ambos usam mesma lógica de validação e geração de laudo
- ✅ Ambos registram auditoria completa

**DIFERENÇAS (20%):**

- ⚠️ Estrutura hierárquica (empresa vs entidade)
- ⚠️ Campos obrigatórios diferentes (empresa_id vs contratante_id)
- ⚠️ Status inicial de avaliação inconsistente (entidade)
- ⚠️ Preenchimento de liberado_por opcional (entidade)

**PAPEL DA CLÍNICA:**

- 🔵 Totalmente passivo/consumidor
- 🔵 Agrega laudos de todas empresas
- 🔵 Não participa da criação de lotes

O fluxo está **majoritariamente consistente**, com pequenas inconsistências na entidade que devem ser corrigidas para garantir comportamento uniforme do sistema.
