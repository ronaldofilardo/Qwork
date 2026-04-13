# Fluxo de Contratação - QWork

**Última atualização:** 13/01/2026  
**Responsável:** Sistema de Contratação v2.0 (Contract-First)

## 📋 Visão Geral

Este documento descreve os fluxos completos de contratação na plataforma QWork, seguindo as melhores práticas jurídicas brasileiras para serviços digitais B2B.

---

## 🎯 Princípios Fundamentais

### Ordem Jurídica Correta

1. **Contrato válido** (aceite + evidências técnicas)
2. **Pagamento** (com registro claro)
3. **Recibo** (emitido após quitação)
4. **Acesso liberado** (após recibo gerado)

### Evidências Técnicas Obrigatórias

- Data/hora do aceite
- IP do cliente
- Hash SHA256 do contrato
- Device/User Agent (quando disponível)

---

## 📊 Fluxo 1: Plano Fixo (Contract-First)

### Características

- Disponível para: **Entidades** e **Clínicas**
- Valor fixo: **R$ 20,00 por funcionário**
- Contrato gerado **ANTES** do pagamento
- Aceite obrigatório para prosseguir

### Fluxo Completo

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. CADASTRO INICIAL                                             │
├─────────────────────────────────────────────────────────────────┤
│ • tomador preenche dados (CNPJ, email, telefone, etc.)     │
│ • Seleciona "Plano Fixo"                                        │
│ • Informa número estimado de funcionários                       │
│ • Upload de documentos (Contrato Social, procuração, etc.)     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONFIRMAÇÃO E ENVIO DOS DADOS                                │
├─────────────────────────────────────────────────────────────────┤
│ • Sistema valida dados (CNPJ, email, documentos)               │
│ • Salva tomador com status "aguardando_pagamento"          │
│ • API: POST /api/cadastro/tomador                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GERAÇÃO AUTOMÁTICA DO CONTRATO                              │
├─────────────────────────────────────────────────────────────────┤
│ • Sistema cria contrato pendente:                               │
│   - tomador_id                                              │
│   - plano_id                                                    │
│   - numero_funcionarios                                         │
│   - valor_total (R$ 20 × funcionários)                         │
│   - status: "aguardando_pagamento"                             │
│   - aceito: false                                               │
│ • Registra contrato_id no response                              │
│ • Redireciona para: /sucesso-cadastro?id=X&contrato_id=Y      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. TELA DE ACEITE DO CONTRATO                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Página: /sucesso-cadastro                                     │
│ • BLOQUEIO: Botão de pagamento DESABILITADO                    │
│ • Exibe mensagem: "Contrato Pendente - Aceite Obrigatório"    │
│ • Botão principal: "Ver e Aceitar Contrato"                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ACEITE DO CONTRATO                                          │
├─────────────────────────────────────────────────────────────────┤
│ • Modal exibe contrato completo                                 │
│ • Botão: "✓ Aceitar Contrato e Prosseguir para Pagamento"     │
│ • API: POST /api/contratos { acao: "aceitar", contrato_id }   │
│ • Sistema registra:                                             │
│   - aceito: true                                                │
│   - ip_aceite                                                   │
│   - data_aceite: CURRENT_TIMESTAMP                             │
│   - hash_contrato: SHA256(id + timestamp)                      │
│ • Retorna: simulador_url                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SIMULADOR DE PAGAMENTO                                      │
├─────────────────────────────────────────────────────────────────┤
│ • Página: /pagamento/simulador?tomador_id=X&contrato_id=Y │
│ • VALIDAÇÃO BACKEND: Verifica aceito = true                   │
│ • Exibe opções:                                                 │
│   - PIX (à vista)                                               │
│   - Cartão (até 12x)                                            │
│   - Boleto                                                      │
│ • Calcula parcelas com juros se aplicável                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. CONFIRMAÇÃO DE PAGAMENTO                                    │
├─────────────────────────────────────────────────────────────────┤
│ • API: POST /api/pagamento/processar                           │
│ • Integração com gateway (PIX/cartão/boleto)                   │
│ • Aguarda confirmação do gateway                                │
│ • Se aprovado: continua fluxo                                   │
│ • Se recusado: permite retry                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. GERAÇÃO AUTOMÁTICA DO RECIBO                                │
├─────────────────────────────────────────────────────────────────┤
│ • API: POST /api/recibo/gerar                                  │
│ • Recibo contém:                                                │
│   - Dados do prestador (Qwork)                                  │
│   - Dados do tomador (tomador)                              │
│   - Descrição do serviço                                        │
│   - Valor pago (número e por extenso)                          │
│   - Data e forma de pagamento                                   │
│   - Indicação de quitação total/parcial                        │
│   - Hash SHA256 para integridade                                │
│ • Status: "Quitado" ou "Parcialmente Quitado"                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. LIBERAÇÃO AUTOMÁTICA DE LOGIN                               │
├─────────────────────────────────────────────────────────────────┤
│ • Sistema atualiza:                                             │
│   - tomadores.pagamento_confirmado = true                   │
│   - tomadores.contrato_aceito = true                        │
│   - tomadores.status = "ativo"                              │
│ • Cria login do gestor/rh                      │
│ • Envia email com credenciais                                   │
│ • Redireciona para tela de sucesso                              │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo Alternativo: Pagamento Não Imediato

```text
[Etapas 1-5 iguais]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. ABANDONO NO SIMULADOR                                       │
├─────────────────────────────────────────────────────────────────┤
│ • tomador fecha página sem pagar                            │
│ • Status permanece: "aguardando_pagamento"                     │
│ • Contrato aceito: true (já registrado)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. ADMIN IDENTIFICA PENDÊNCIA                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Dashboard Admin: Lista "Aguardando Pagamento"                │
│ • Visualiza dados do tomador                                │
│ • Contrato já aceito (não editável)                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. ADMIN ENVIA LINK DE RETOMADA                                │
├─────────────────────────────────────────────────────────────────┤
│ • API: POST /api/admin/gerar-link-retomada                     │
│ • Sistema gera link único:                                      │
│   /pagamento/simulador?tomador_id=X&contrato_id=Y&retry=1 │
│ • Email enviado ao tomador                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. tomador ABRE LINK                                       │
├─────────────────────────────────────────────────────────────────┤
│ • Link abre direto no simulador (contrato já aceito)           │
│ • Continua do passo 6 do fluxo principal                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validações de Segurança

### Backend (API)

#### `/api/pagamento/simulador`

```typescript
// Validação obrigatória para planos fixos
if (plano.tipo === 'fixo') {
  const contratoRes = await query(
    'SELECT id, aceito FROM contratos WHERE tomador_id = $1 AND aceito = true',
    [tomadorId]
  );

  if (contratoRes.rows.length === 0) {
    return NextResponse.json(
      { error: 'Contrato deve ser aceito antes do simulador' },
      { status: 403 }
    );
  }
}
```

#### `/api/contratos` (POST)

```typescript
// Ação: aceitar
// Registra evidências técnicas
const hash = crypto
  .createHash('sha256')
  .update(`${contratoRow.id}-${Date.now()}`)
  .digest('hex');

await query(
  `UPDATE contratos 
   SET aceito = true, 
       ip_aceite = $2, 
       data_aceite = CURRENT_TIMESTAMP, 
       hash_contrato = $3 
   WHERE id = $1`,
  [contratoRow.id, clientIp, hash]
);
```

### Frontend (UI)

#### `/sucesso-cadastro`

```tsx
// Condicional que FORÇA aceite antes de pagamento
{
  contratoIdFromParam && !pagamentoConcluido ? (
    <div>
      <p>📄 Contrato Pendente: Aceite obrigatório</p>
      <button onClick={() => setMostrarModalContrato(true)}>
        Ver e Aceitar Contrato
      </button>
    </div>
  ) : (
    <button disabled>Pagamento Bloqueado</button>
  );
}
```

---

## 📋 Checklist de Implementação

### ✅ Concluído

- [x] Geração automática de contratos para planos fixos
- [x] Validação backend que bloqueia simulador sem aceite
- [x] UI que força aceite antes de mostrar botão de pagamento
- [x] Registro de evidências técnicas (IP, data/hora, hash)
- [x] Redirecionamento automático para simulador após aceite
- [x] Link de retomada para pagamentos abandonados

### 🔄 Em Progresso

- [ ] Geração automática de recibos pós-pagamento
- [ ] Integração completa com gateways de pagamento
- [ ] Email automático com credenciais após ativação

### 📝 Pendente

- [ ] Emissão de NF-e automática (integração fiscal)
- [ ] Assinatura eletrônica ICP-Brasil (opcional)
- [ ] Validação de documentos via IA
- [ ] Dashboard de acompanhamento para tomadores

---

## 🚨 Problemas Conhecidos e Soluções

### Problema 1: Página de pagamento aparece antes do contrato

**Status:** ✅ Corrigido  
**Data:** 13/01/2026  
**Causa:** Lógica condicional permitia acesso ao botão de pagamento mesmo com `contratoIdFromParam` presente  
**Solução:** Refatoração da máquina de estados em `/sucesso-cadastro` para forçar aceite obrigatório

### Problema 2: TDZ Error em `lib/db.ts`

**Status:** ✅ Corrigido  
**Data:** 13/01/2026  
**Causa:** `ensureAdminPassword()` chamado antes de `databaseUrl` ser inicializado  
**Solução:** Moveu constantes e função para posição correta no arquivo

---

## 📞 Contato e Suporte

Para dúvidas sobre implementação:

- **Documentação:** `docs/guides/`
- **Testes:** `__tests__/integration/`
- **Issues:** Issues do repositório

---

**Documento vivo:** Este guia será atualizado conforme novas funcionalidades sejam implementadas.
