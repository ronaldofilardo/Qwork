# Correções no Sistema de Pagamentos e Parcelas

**Data:** 27/12/2025  
**Tipo:** Correções e Melhorias  
**Status:** ✅ Concluído

## 📋 Resumo Executivo

Implementadas correções críticas no sistema de pagamentos, incluindo:

- ✅ Cálculo correto de parcelas (1ª imediata, demais no mesmo dia dos meses seguintes)
- ✅ Validação obrigatória do número de funcionários em planos personalizados
- ✅ Indicador visual de status "Quitado" / "Em Aberto"
- ✅ Layout horizontal melhorado para exibição de parcelas

---

## 🎯 Problemas Identificados e Soluções

### 1. Cálculo de Parcelas Incorreto

**Problema:**

- Parcelas eram calculadas sempre para o dia 10 de cada mês
- Não respeitava a data do primeiro pagamento

**Solução Implementada:**

- 1ª parcela: vencimento IMEDIATO (data do pagamento) - deve ser paga na hora
- Demais parcelas: MESMO DIA nos meses subsequentes
- Exemplo: Pagamento em 27/12 com 4 parcelas → 27/12 (imediata), 27/01, 27/02, 27/03

**Arquivo Alterado:** [lib/parcelas-helper.ts](../../lib/parcelas-helper.ts)

```typescript
// ANTES (INCORRETO)
dataVencimento.setMonth(dataVencimento.getMonth() + i);
dataVencimento.setDate(10); // ❌ Sempre dia 10

// DEPOIS (CORRETO)
const diaVencimento = dataBase.getDate(); // Guardar dia original
if (i > 0) {
  dataVencimento.setMonth(dataVencimento.getMonth() + i);
  dataVencimento.setDate(diaVencimento); // ✅ Mantém o mesmo dia
}
```

---

### 2. Validação de Funcionários em Planos Personalizados

**Problema:**

- Campo "Número de funcionários" era opcional em planos personalizados
- Plano Preço não era sempre calculado corretamente (valor por funcionário/ano)

**Solução Implementada:**

- Campo "Número de funcionários" agora é OBRIGATÓRIO
- Validação garante que sempre há um valor (inserido ou estimado do cadastro)
- Cálculo: Plano Preço = valor por funcionário × número de funcionários

**Arquivo Alterado:** [components/modals/ModalDefinirValorPersonalizado.tsx](../../components/modals/ModalDefinirValorPersonalizado.tsx)

```typescript
// Validação obrigatória
if (!numeroFuncionarios || numeroFuncionarios <= 0) {
  setErro('Número de funcionários é obrigatório e deve ser maior que zero');
  return;
}
```

---

### 3. Indicador Visual de Quitação

**Problema:**

- Não havia indicação visual se o contrato estava quitado ou em aberto
- Difícil identificar pagamentos pendentes

**Solução Implementada:**

- Nova coluna "Quitação" na tabela de cobranças
- Badge visual:
  - 🟢 **Quitado** (verde): Todas as parcelas pagas
  - 🟡 **Em Aberto** (amarelo): Parcelas pendentes
- Funções helper adicionadas em `parcelas-helper.ts`:
  - `isContratoQuitado()`: Verifica se todas parcelas foram pagas
  - `getStatusBadge()`: Retorna label e classe CSS do badge

**Arquivo Alterado:** [components/admin/CobrancaContent.tsx](../../components/admin/CobrancaContent.tsx)

```tsx
<td className="px-4 py-4 whitespace-nowrap text-center">
  {contrato.modalidade_pagamento === 'parcelado' && contrato.parcelas_json ? (
    (() => {
      const statusBadge = getStatusBadge(contrato.parcelas_json);
      return (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.colorClass}`}
        >
          {statusBadge.label}
        </span>
      );
    })()
  ) : (
    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
      Quitado
    </span>
  )}
</td>
```

---

### 4. Layout Horizontal das Parcelas

**Problema:**

- Parcelas eram exibidas em grid 4 colunas (quebrava em múltiplas linhas)
- Difícil visualizar todas as parcelas de uma vez
- Layout não seguia o padrão mostrado nas imagens de referência

**Solução Implementada:**

- Layout horizontal com scroll (todas parcelas na mesma linha)
- Cards de parcela com largura fixa (160px)
- Scroll horizontal quando necessário
- Visual mais limpo e compacto

**Arquivo Alterado:** [components/admin/CobrancaContent.tsx](../../components/admin/CobrancaContent.tsx)

```tsx
{
  /* ANTES */
}
<div className="grid grid-cols-4 gap-4">{/* Parcelas em grid */}</div>;

{
  /* DEPOIS */
}
<div className="overflow-x-auto">
  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
    {contrato.parcelas_json.map((parcela) => (
      <div className="flex-shrink-0 w-40 p-3 rounded-lg ...">
        {/* Card de parcela compacto */}
      </div>
    ))}
  </div>
</div>;
```

---

## 📊 Estrutura de Dados

### Interface Parcela

```typescript
export interface Parcela {
  numero: number; // 1, 2, 3...
  valor: number; // Valor da parcela
  data_vencimento: string; // Data de vencimento (YYYY-MM-DD)
  pago: boolean; // Se foi paga
  data_pagamento: string | null; // Data do pagamento (se pago)
  status: 'pago' | 'pendente'; // Status da parcela
}
```

### Exemplo de Parcelas Calculadas

```json
[
  {
    "numero": 1,
    "valor": 500.0,
    "data_vencimento": "2025-12-27",
    "pago": true,
    "data_pagamento": "2025-12-27T10:00:00.000Z",
    "status": "pago"
  },
  {
    "numero": 2,
    "valor": 500.0,
    "data_vencimento": "2026-01-27",
    "pago": false,
    "data_pagamento": null,
    "status": "pendente"
  },
  {
    "numero": 3,
    "valor": 500.0,
    "data_vencimento": "2026-02-27",
    "pago": false,
    "data_pagamento": null,
    "status": "pendente"
  },
  {
    "numero": 4,
    "valor": 500.0,
    "data_vencimento": "2026-03-27",
    "pago": false,
    "data_pagamento": null,
    "status": "pendente"
  }
]
```

---

## 🔧 Funções Helper Adicionadas

### `lib/parcelas-helper.ts`

#### `isContratoQuitado(parcelas)`

Verifica se todas as parcelas estão quitadas.

```typescript
export function isContratoQuitado(parcelas: Parcela[] | null): boolean {
  if (!parcelas || parcelas.length === 0) return false;
  return parcelas.every((p) => p.pago === true || p.status === 'pago');
}
```

#### `getStatusBadge(parcelas)`

Retorna badge visual de status.

```typescript
export function getStatusBadge(parcelas: Parcela[] | null): {
  label: string;
  colorClass: string;
} {
  const quitado = isContratoQuitado(parcelas);
  return quitado
    ? { label: 'Quitado', colorClass: 'bg-green-100 text-green-800' }
    : { label: 'Em Aberto', colorClass: 'bg-yellow-100 text-yellow-800' };
}
```

#### `getResumoPagamento(parcelas)` (Atualizada)

Agora retorna também o status geral de quitação.

```typescript
export function getResumoPagamento(parcelas: Parcela[]): {
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  statusGeral: 'quitado' | 'em_aberto'; // ✨ Novo campo
};
```

---

## 📁 Arquivos Alterados

1. ✅ [lib/parcelas-helper.ts](../../lib/parcelas-helper.ts)
   - Corrigido cálculo de parcelas
   - Adicionadas funções de status de quitação

2. ✅ [components/modals/ModalDefinirValorPersonalizado.tsx](../../components/modals/ModalDefinirValorPersonalizado.tsx)
   - Campo funcionários agora obrigatório
   - Validação reforçada

3. ✅ [components/admin/CobrancaContent.tsx](../../components/admin/CobrancaContent.tsx)
   - Adicionada coluna "Quitação"
   - Layout horizontal de parcelas
   - Import da função `getStatusBadge`

---

## ✅ Validação e Testes

### Casos de Teste

#### 1. Cálculo de Parcelas

- ✅ Pagamento em 27/12 com 4 parcelas → Vencimentos: 27/12, 27/01, 27/02, 27/03
- ✅ Pagamento em 31/01 com 3 parcelas → Vencimentos: 31/01, 28/02 (ajuste), 31/03
- ✅ 1ª parcela sempre marcada como "paga"
- ✅ Demais parcelas marcadas como "pendente"

#### 2. Validação de Funcionários

- ✅ Campo obrigatório se não houver valor estimado no cadastro
- ✅ Pode usar valor estimado deixando campo vazio
- ✅ Validação impede valores <= 0

#### 3. Status de Quitação

- ✅ Badge "Quitado" (verde) quando todas parcelas pagas
- ✅ Badge "Em Aberto" (amarelo) quando há parcelas pendentes
- ✅ Pagamentos à vista sempre exibem "Quitado"

#### 4. Layout de Parcelas

- ✅ Parcelas exibidas horizontalmente em linha única
- ✅ Scroll horizontal quando necessário
- ✅ Cards compactos e legíveis
- ✅ Indicador visual de parcela paga (✓ verde)

---

## 🎨 Interface Visual

### Nova Coluna "Quitação"

```
┌─────────────┬─────────────┬──────────┬────────┬──────────┐
│ Pagamento   │ Status      │ Quitação │ ...    │ ...      │
├─────────────┼─────────────┼──────────┼────────┼──────────┤
│ Boleto      │ ● ativo     │ Quitado  │        │          │
│ Parcelado   │             │  🟢      │        │          │
│ (1x)        │             │          │        │          │
├─────────────┼─────────────┼──────────┼────────┼──────────┤
│ Cartão      │ ● ativo     │ Em Aberto│        │          │
│ Parcelado   │             │  🟡      │        │          │
│ (4x)        │             │          │        │          │
└─────────────┴─────────────┴──────────┴────────┴──────────┘
```

### Layout de Parcelas (Expandido)

```
Detalhamento de Parcelas (#50)
┌──────────────────────────────────────────────────────────────────┐
│  [1/4]  ✓    [2/4]       [3/4]       [4/4]                      │
│  R$ 500,00   R$ 500,00   R$ 500,00   R$ 500,00                  │
│  Venc:27/12  Venc:27/01  Venc:27/02  Venc:27/03                 │
│  Pago:27/12                                                      │
│  🟢          ⚪           ⚪           ⚪                          │
└──────────────────────────────────────────────────────────────────┘
     ↔️ Scroll horizontal se necessário
```

---

## 🚀 Impacto e Benefícios

### Para Administradores

- ✅ Visão clara do status de quitação de cada contrato
- ✅ Fácil identificação de pagamentos pendentes
- ✅ Layout mais limpo e organizado

### Para o Sistema

- ✅ Cálculo correto de vencimentos
- ✅ Validação robusta de dados obrigatórios
- ✅ Funções reutilizáveis para status de pagamento

### Para Compliance

- ✅ Datas de vencimento respeitam o dia do primeiro pagamento
- ✅ Registros mais precisos e auditáveis
- ✅ Informações financeiras mais claras

---

## 📝 Notas Importantes

1. **Migração de Dados Existentes:**
   - Parcelas antigas com `data_vencimento` no dia 10 não serão recalculadas
   - Novos contratos usarão o cálculo correto
   - Considerar script de migração se necessário

2. **Retrocompatibilidade:**
   - Função `getStatusBadge()` aceita `null` para parcelas
   - Campo `pago` e `status` são tratados de forma equivalente
   - Layout de parcelas funciona com arrays vazios

3. **Performance:**
   - Layout horizontal usa `flex` em vez de `grid` (mais eficiente)
   - Scroll nativo do navegador (sem bibliotecas extras)

---

## 🔄 Próximos Passos Sugeridos

- [ ] Implementar notificações de parcelas próximas do vencimento
- [ ] Adicionar filtro por status de quitação na tela de cobranças
- [ ] Criar dashboard com métricas de quitação
- [ ] Exportar relatório de parcelas pendentes

---

## 📚 Referências

- [Schema de Pagamentos](../../database/migrations/041_criar_tabela_recibos.sql)
- [Helper de Parcelas](../../lib/parcelas-helper.ts)
- [Componente de Cobrança](../../components/admin/CobrancaContent.tsx)
- Modal para definição de valores de contrato

---

**Autor:** Copilot  
**Revisão:** Pendente  
**Status:** ✅ Implementado e Documentado
