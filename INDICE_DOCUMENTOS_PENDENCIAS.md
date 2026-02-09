# 📑 ÍNDICE DE DOCUMENTOS: Criação de Pendências de Pagamento

> Análise completa sobre onde entidades são cadastradas e onde pendências de pagamento são geradas automaticamente para novos cadastros no QWork.

---

## 📚 DOCUMENTOS GERADOS

### 1. 📋 [RESUMO_EXECUTIVO_PENDENCIAS.md](RESUMO_EXECUTIVO_PENDENCIAS.md) ⭐ **COMECE AQUI**

**Para:** Leitura rápida (5 minutos)
**Contém:**
- Resposta direta: Onde pendências são criadas (Linhas 244-276)
- 3 arquivos críticos com números de linha
- Código exato que cria pendências
- Exemplo prático (2.000 reais em 4 parcelas)
- Fluxo visual com diagrama ASCII

**Usar quando:** Precisa de resposta rápida e concisa

---

### 2. 📍 [RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md](RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md) ⭐ **MAIS DETALHADO**

**Para:** Análise técnica completa (15 minutos)
**Contém:**
- Explicação de cada etapa do fluxo
- Código-fonte com comentários
- Lógica de determinação de status
- Cálculo de valor total (plano fixo)
- Validações de contrato aceito
- Função completa de `calcularParcelas()`
- Estrutura de parcelas (JSON)
- Criação de notificações (loop for)
- Fluxo completo com linha do tempo
- Total de entidades/transações geradas
- Conclusões com pontos-chave

**Usar quando:** Precisa entender TODO o fluxo em detalhe

---

### 3. 🗺️ [MAPA_LINHAS_PENDENCIAS.md](MAPA_LINHAS_PENDENCIAS.md) ⭐ **REFERÊNCIA TÉCNICA**

**Para:** Localização de código específico (10 minutos)
**Contém:**
- Tabela de linhas para cada operação
- SQL de INSERT/UPDATE
- Descrição de campos persistidos
- Sequência de chamadas de API
- Pontos críticos com ⚠️
- Exemplo concreto passo a passo
- Referências rápidas

**Usar quando:** Precisa encontrar um número de linha específico

---

### 4. 📊 [SUMARIO_PENDENCIAS_VISUAL.md](SUMARIO_PENDENCIAS_VISUAL.md) ⭐ **VISUAL/DIAGRAMÁTICO**

**Para:** Compreensão visual (8 minutos)
**Contém:**
- Visão geral com diagrama grande
- 5 arquivos principais com funções
- Tabelas de mapeamento
- Ponto crítico em destaque
- Fluxo rápido de 5 passos
- Resumo executivo em tópicos
- Checklist de investigação
- Perguntas frequentes com respostas
- Referências rápidas

**Usar quando:** Prefere visual/diagramas ou precisa investigar

---

## 🎯 QUAL DOCUMENTO LER?

```
┌─ Tenho 5 minutos?
│  └─→ Leia: RESUMO_EXECUTIVO_PENDENCIAS.md
│
├─ Preciso entender TODO o fluxo?
│  └─→ Leia: RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md
│
├─ Preciso de um número de linha específico?
│  └─→ Leia: MAPA_LINHAS_PENDENCIAS.md
│
├─ Prefiro diagramas/visual?
│  └─→ Leia: SUMARIO_PENDENCIAS_VISUAL.md
│
└─ Preciso debugar uma pendência?
   └─→ Leia: SUMARIO_PENDENCIAS_VISUAL.md (seção CHECKLIST)
```

---

## 🔴 RESPOSTA RÁPIDA

**P: Onde pendências de pagamento são criadas?**

**R:** Linhas **244-276** do arquivo [`app/api/pagamento/confirmar/route.ts`](app/api/pagamento/confirmar/route.ts)

```typescript
for (const parcela of parcelas) {
  if (parcela.numero === 1) continue;
  
  await criarNotificacao({
    tipo: 'parcela_pendente',  // ⭐ CRIA PENDÊNCIA AQUI
    // ...dados...
  });
}
```

**Condições:**
- ✅ Pagamento deve ser confirmado (status='pago')
- ✅ Deve ter mais de 1 parcela (`numero_parcelas > 1`)
- ✅ Cria 1 notificação para cada parcela futura (2 até N)

---

## 📊 MAPA DE OPERAÇÕES

| Etapa | Arquivo | Linhas | O que cria | Cria pendências? |
|-------|---------|--------|-----------|---|
| 1. Cadastro | cadastro/tomadores/route.ts | 350-650 | tomador, contrato | ❌ |
| 2. Aceitar contrato | contratos/[id]/route.ts | - | update contrato | ❌ |
| 3. Iniciar pagamento | pagamento/iniciar/route.ts | 300-308 | pagamento | ❌ |
| 4. Confirmar pagamento | pagamento/confirmar/route.ts | 244-276 | notificacoes | ✅ |

---

## 🧮 CÁLCULO DE PARCELAS

**Arquivo:** `lib/parcelas-helper.ts` (Linhas 25-74)

**Fórmula:**
```
Primeira parcela = 100% paga no ato
Parcelas restantes = 100% pendentes com datas mensais
Número de pendências = numero_parcelas - 1
```

**Exemplo:**
```
Valor total: R$ 2.000
Parcelas: 4
Resultado:
  - Parcela 1: R$ 500 (PAGA em 08/02)
  - Parcela 2: R$ 500 (PENDENTE em 08/03) 🔴
  - Parcela 3: R$ 500 (PENDENTE em 08/04) 🔴
  - Parcela 4: R$ 500 (PENDENTE em 08/05) 🔴
Total pendências: 3
```

---

## 🔗 ARQUIVOS RELACIONADOS

### Código Fonte Direto
- [`app/api/cadastro/tomadores/route.ts`](app/api/cadastro/tomadores/route.ts) - Cadastro de entidades
- [`app/api/pagamento/iniciar/route.ts`](app/api/pagamento/iniciar/route.ts) - Criação de pagamento
- [`app/api/pagamento/confirmar/route.ts`](app/api/pagamento/confirmar/route.ts) - ⭐ Criação de pendências
- [`lib/parcelas-helper.ts`](lib/parcelas-helper.ts) - Cálculo de parcelas
- [`app/api/admin/cobranca/parcela/route.ts`](app/api/admin/cobranca/parcela/route.ts) - Gestão de parcelas

### Testes de Integração
- [`__tests__/integration/fluxo-cadastro-pagamento-ativacao.test.ts`](__tests__/integration/fluxo-cadastro-pagamento-ativacao.test.ts)
- [`__tests__/api/cobranca-parcelas.test.ts`](__tests__/api/cobranca-parcelas.test.ts)

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Pendências NÃO são criadas automaticamente

- ❌ No cadastro de entidade
- ❌ Ao aceitar contrato
- ❌ Ao iniciar pagamento
- ✅ APENAS ao confirmar pagamento parcelado

### ⏱️ Timeline

```
T+0s:    Cadastro entidade
T+30s:   Usuário aceita contrato
T+60s:   Inicia pagamento
T+120s:  ⭐ Confirma pagamento → Cria notificações
T+125s:  Notificações visíveis no Centro de Operações
```

### 🔢 Números

- 1 tomador criado por cadastro
- 1 contrato criado por tomador
- 1 pagamento criado por contrato
- N notificações criadas = (numero_parcelas - 1)
- 0 triggers automáticos (tudo em código)

---

## 🎓 PARA DEVELOPERS

### Para debugar uma pendência

1. Verifique em `SELECT * FROM notificacoes WHERE tipo='parcela_pendente'`
2. Procure o `pagamento_id` na `dados_contexto`
3. Verifique em `SELECT detalhes_parcelas FROM pagamentos WHERE id=XXX`
4. Compare com saída de `calcularParcelas()` em lib/parcelas-helper.ts

### Para modificar lógica de parcelas

1. Altere `lib/parcelas-helper.ts` (Linhas 25-74)
2. Testes em `__tests__/lib/parcelas-helper.test.ts`
3. Cascata em `app/api/pagamento/confirmar/route.ts` (Linhas 244-276)

### Para adicionar novos tipos de notificação

1. Altere `criarNotificacao()` em `lib/notifications/`
2. Adicione novo `tipo` em `app/api/pagamento/confirmar/route.ts`
3. Adicione teste em `__tests__/api/cobranca-parcelas.test.ts`

---

## ✅ CHECKLIST DE LEITURA

Recomendação de ordem de leitura:

- [ ] Leia RESUMO_EXECUTIVO_PENDENCIAS.md (5 min)
- [ ] Leia exemplo prático na seção de MAPA_LINHAS (3 min)
- [ ] Se precisar entender completo: RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md (10 min)
- [ ] Se precisar debugar: SUMARIO_PENDENCIAS_VISUAL.md + CHECKLIST (10 min)
- [ ] Se precisar modificar código: MAPA_LINHAS_PENDENCIAS.md + fontes (20 min)

---

## 📞 DÚVIDAS FREQUENTES

**P1: Por que não vejo pendências após fazer cadastro?**
R: Porque pendências só nascem quando pagamento é confirmado (POST /api/pagamento/confirmar) e há múltiplas parcelas.

**P2: Onde vejo as pendências?**
R: No Centro de Operações, como notificações do tipo `parcela_pendente`.

**P3: Como gero pendências manualmente para teste?**
R: Veja MAPA_LINHAS_PENDENCIAS.md - seção "Exemplo Concreto".

**P4: Qual é o único arquivo que cria pendências?**
R: `app/api/pagamento/confirmar/route.ts` linhas 244-276.

---

**Documentos gerados em:** 8 de fevereiro de 2026
**Última atualização:** ~{data-atual}
**Escopo:** Análise de criação automática de pendências durante cadastro de entidades

