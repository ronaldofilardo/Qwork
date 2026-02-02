# Melhorias no Fluxo de Emissão de Laudos

**Data:** 30/01/2026  
**Status:** ✅ Implementado e Testado

## Resumo das Alterações

Esta implementação melhora a experiência do usuário no fluxo de solicitação e emissão de laudos, removendo ambiguidades e automatizando a exibição correta de informações.

---

## 1. Dashboard do Emissor

### Alterações em `app/emissor/page.tsx`

#### Remoção da Aba "Aguardando Envio"

- ❌ **Removido:** Aba "Aguardando Envio" que causava confusão
- ✅ **Mantido:** Apenas 3 abas: "Laudo para Emitir", "Laudo Emitido", "Cancelados"

#### Padronização de Status

- **Aba padrão alterada:** De "aguardando-envio" → "laudo-para-emitir"
- **Filtro corrigido:** Mostra apenas lotes com `status='concluido'`
- **Removido:** Lotes com `status='ativo'` não aparecem mais no emissor

#### Informações de Solicitação

- **Novo:** Card do lote exibe "🚀 Emissão solicitada por [nome] em [data/hora]"
- **Interface atualizada:** Campos `solicitado_por`, `solicitado_em`, `tipo_solicitante`

```typescript
// Antes
type ActiveTab =
  | 'laudo-para-emitir'
  | 'aguardando-envio'
  | 'laudo-emitido'
  | 'cancelados';
const [activeTab, setActiveTab] = useState<ActiveTab>('aguardando-envio');

// Depois
type ActiveTab = 'laudo-para-emitir' | 'laudo-emitido' | 'cancelados';
const [activeTab, setActiveTab] = useState<ActiveTab>('laudo-para-emitir');
```

---

## 2. Página de Detalhes do Lote (Entidade)

### Alterações em `app/entidade/lote/[id]/page.tsx`

#### Botão "Solicitar Emissão"

**Condições de Exibição:**

```typescript
// Mostra APENAS quando:
lote.status === 'concluido' && !lote.emissao_solicitada && !lote.tem_laudo;
```

#### Cards Informativos

1. **"Lote Concluído"** (Verde) → Mostra botão quando pode solicitar
2. **"Emissão Solicitada"** (Azul) → Exibe quando já solicitado mas sem laudo
3. **"Laudo Emitido"** (Roxo) → Exibe quando laudo já existe

#### Interface Atualizada

```typescript
interface LoteInfo {
  // ... campos existentes
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
  laudo_status?: string | null;
}
```

---

## 3. Backend - API de Detalhes do Lote

### Alterações em `app/api/entidade/lote/[id]/route.ts`

#### Query SQL Aprimorada

```sql
SELECT
  la.id,
  la.codigo,
  la.titulo,
  la.tipo,
  la.status,
  la.criado_em,
  la.liberado_em,
  la.emitido_em,
  -- Verifica se está na fila de emissão
  CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
  fe.solicitado_em as emissao_solicitado_em,
  -- Verifica se já tem laudo
  CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo,
  l.status as laudo_status
FROM lotes_avaliacao la
LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id = $1
  AND EXISTS (
    SELECT 1 FROM avaliacoes a
    JOIN funcionarios f ON a.funcionario_cpf = f.cpf
    WHERE a.lote_id = la.id AND f.contratante_id = $2
  )
LIMIT 1
```

---

## 4. Backend - API de Lotes do Emissor

### Alterações em `app/api/emissor/lotes/route.ts`

#### Campos Adicionados ao Retorno

```typescript
return {
  id: lote.id,
  codigo: lote.codigo,
  // ... outros campos
  solicitado_por: lote.solicitado_por || null,
  solicitado_em: lote.solicitado_em || null,
  tipo_solicitante: lote.tipo_solicitante || null,
  // ...
};
```

---

## 5. Fluxo de Status Padronizado

### Ciclo de Vida do Lote

```
1. ATIVO
   └─> Funcionários respondendo avaliações

2. CONCLUÍDO
   └─> Todas avaliações finalizadas
   └─> Gestor/RH pode solicitar emissão
   └─> APARECE NO EMISSOR (aba "Laudo para Emitir")

3. FINALIZADO
   └─> Laudo emitido e enviado
   └─> Aparece em "Laudo Emitido"
```

### Regras de Negócio

| Condição                                         | Botão Visível? | Card Exibido                |
| ------------------------------------------------ | -------------- | --------------------------- |
| status='ativo'                                   | ❌             | -                           |
| status='concluido' + sem solicitação + sem laudo | ✅             | "Lote Concluído" (Verde)    |
| status='concluido' + solicitado + sem laudo      | ❌             | "Emissão Solicitada" (Azul) |
| status='concluido' + tem laudo                   | ❌             | "Laudo Emitido" (Roxo)      |
| status='finalizado'                              | ❌             | "Laudo Emitido" (Roxo)      |

---

## 6. Testes Implementados

### Arquivo: `__tests__/emissor-workflow-improvements.test.ts`

**Cobertura:**

- ✅ 6 testes de Frontend (Emissor Dashboard)
- ✅ 4 testes de Frontend (Página Detalhes Lote)
- ✅ 4 testes de Backend (APIs)
- ✅ 4 testes de Integração (Queries SQL)
- ✅ 3 testes de Validação

**Total:** 21 testes passando ✅

---

## 7. Benefícios

### UX Melhorada

1. ✅ Menos confusão com abas desnecessárias
2. ✅ Feedback visual claro do estado do lote
3. ✅ Botões aparecem apenas quando aplicável
4. ✅ Rastreabilidade de quem solicitou emissão

### Performance

1. ✅ Menos queries desnecessárias
2. ✅ JOINs otimizados com LEFT JOIN
3. ✅ CASE WHEN para boolean em vez de subconsultas

### Manutenibilidade

1. ✅ Código mais legível e organizado
2. ✅ Interfaces TypeScript bem definidas
3. ✅ Testes cobrindo cenários principais
4. ✅ Documentação clara do fluxo

---

## 8. Arquivos Modificados

| Arquivo                                           | Alterações                                           |
| ------------------------------------------------- | ---------------------------------------------------- |
| `app/emissor/page.tsx`                            | Removida aba, filtro corrigido, interface atualizada |
| `app/entidade/lote/[id]/page.tsx`                 | Botão condicional, cards informativos, interface     |
| `app/api/entidade/lote/[id]/route.ts`             | LEFT JOINs, campos adicionais                        |
| `app/api/emissor/lotes/route.ts`                  | Campos de rastreabilidade                            |
| `__tests__/emissor-workflow-improvements.test.ts` | 21 testes novos                                      |

---

## 9. Como Testar Manualmente

### Cenário 1: Lote Concluído sem Solicitação

1. Acesse lote com status='concluido'
2. ✅ Deve ver card verde "Lote Concluído"
3. ✅ Deve ver botão "Solicitar Emissão do Laudo"

### Cenário 2: Após Solicitar Emissão

1. Clique em "Solicitar Emissão"
2. ✅ Botão desaparece
3. ✅ Aparece card azul "Emissão Solicitada" com data
4. ✅ Lote aparece no dashboard do emissor

### Cenário 3: Dashboard do Emissor

1. Acesse /emissor
2. ✅ Aba padrão é "Laudo para Emitir"
3. ✅ Não existe aba "Aguardando Envio"
4. ✅ Lotes solicitados aparecem com emoji 🚀

### Cenário 4: Após Emitir Laudo

1. Emissor gera o laudo
2. ✅ Na página da entidade, aparece card roxo "Laudo Emitido"
3. ✅ Botão nunca mais aparece

---

## 10. Comandos para Rodar Testes

```bash
# Rodar apenas testes desta feature
npx jest __tests__/emissor-workflow-improvements.test.ts --verbose

# Com cobertura
npx jest __tests__/emissor-workflow-improvements.test.ts --coverage

# Com force exit
npx jest __tests__/emissor-workflow-improvements.test.ts --forceExit
```

---

**Implementado por:** GitHub Copilot  
**Revisado por:** Ronaldo Fill  
**Data de Aprovação:** 30/01/2026
