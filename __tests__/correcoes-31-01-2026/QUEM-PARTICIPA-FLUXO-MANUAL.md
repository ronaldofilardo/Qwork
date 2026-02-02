# ✅ CONFIRMAÇÃO: Quem Participa do Fluxo Manual

**Data:** 31/01/2026

---

## 🎯 Sim! A correção é para RH e Gestor_Entidade

### 👥 Perfis Envolvidos

#### 1️⃣ **RH (Clínicas)** ✅

- **Quem:** Perfil `rh` vinculado a uma clínica
- **O que faz:** Solicita emissão de laudos para lotes de sua clínica
- **Como:** Clica em "Solicitar Emissão" no dashboard
- **API:** `POST /api/lotes/[loteId]/solicitar-emissao`
- **Validação:** Verifica `clinica_id` do lote vs `clinica_id` do usuário

#### 2️⃣ **Gestor_Entidade (Entidades/Contratantes)** ✅

- **Quem:** Perfil `gestor_entidade` vinculado a um contratante
- **O que faz:** Solicita emissão de laudos para lotes de sua entidade
- **Como:** Clica em "Solicitar Emissão" no dashboard
- **API:** `POST /api/lotes/[loteId]/solicitar-emissao`
- **Validação:** Verifica `contratante_id` do lote vs `contratante_id` do usuário

#### 3️⃣ **Emissor** ✅

- **Quem:** Perfil `emissor` (independente de clínica/entidade)
- **O que faz:** GERA laudos manualmente (após solicitação)
- **Como:**
  1. Vê lotes pendentes no dashboard
  2. Clica "Iniciar laudo" → gera PDF
  3. Revisa PDF
  4. Clica "Enviar Laudo" → marca como enviado
- **APIs:**
  - `POST /api/emissor/laudos/[loteId]` (gerar)
  - `PATCH /api/emissor/laudos/[loteId]` (enviar)

---

## 🔄 Fluxo Completo (3 Etapas Manuais)

### **ETAPA 1: Solicitação (RH ou Gestor_Entidade)** 🟢

```
Lote status='concluido' (todas avaliações finalizadas)
              ↓
RH da Clínica OU Gestor_Entidade vê notificação
              ↓
Clica "Solicitar Emissão de Laudo"
              ↓
POST /api/lotes/[loteId]/solicitar-emissao
              ↓
Sistema registra em fila_emissao
(solicitado_por, tipo_solicitante, solicitado_em)
              ↓
Lote aparece no dashboard do Emissor
```

**Código da validação:**

```typescript
// Para lotes de CLÍNICA
if (lote.clinica_id && user.perfil === 'rh') {
  // Validar acesso à empresa
  await requireRHWithEmpresaAccess(user, lote.empresa_id);
}

// Para lotes de ENTIDADE
if (lote.contratante_id && user.perfil === 'gestor_entidade') {
  // Validar contratante_id
  if (user.contratante_id !== lote.contratante_id) {
    return NextResponse.json(
      { error: 'Acesso negado: contratante não corresponde' },
      { status: 403 }
    );
  }
}
```

---

### **ETAPA 2: Geração (Emissor)** 🟡

```
Emissor acessa dashboard
              ↓
Vê lista de "Lotes Aguardando Emissão"
              ↓
Clica "Iniciar laudo" em um lote
              ↓
POST /api/emissor/laudos/[loteId]
              ↓
Sistema chama gerarLaudoCompletoEmitirPDF()
              ↓
PDF gerado + hash calculado
              ↓
Laudo criado: status='emitido', emitido_em=NOW()
              ↓
Emissor pode baixar e revisar PDF
```

**Código da validação:**

```typescript
export const POST = async (req, { params }) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Gerar laudo
  const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, user.cpf);
  // Status fica como 'emitido' (NÃO 'enviado')
};
```

---

### **ETAPA 3: Envio (Emissor)** 🔴

```
Emissor revisa PDF gerado
              ↓
Clica "Enviar Laudo para Cliente"
              ↓
PATCH /api/emissor/laudos/[loteId]
              ↓
Sistema atualiza: status='enviado', enviado_em=NOW()
              ↓
Sistema notifica RH/Entidade: "Laudo disponível"
              ↓
RH/Entidade pode baixar laudo final
```

**Código da validação:**

```typescript
export const PATCH = async (req, { params }) => {
  const user = await requireRole('emissor');
  const { status } = await req.json();

  if (status !== 'enviado') {
    return NextResponse.json(
      { error: 'Apenas status "enviado" é permitido' },
      { status: 400 }
    );
  }

  // Atualizar laudo para 'enviado'
  await query(
    `UPDATE laudos 
     SET status = 'enviado', enviado_em = NOW() 
     WHERE lote_id = $1 AND status = 'emitido'`,
    [loteId]
  );
};
```

---

## ⚠️ O Que a Correção Garante

### **Antes (Automático - INCORRETO)** ❌

```
Lote status='concluido'
        ↓
[TRIGGER DO BANCO EMITIA AUTOMATICAMENTE]
        ↓
Laudo criado com status='enviado'
        ↓
RH/Entidade recebia laudo SEM controle do emissor
```

**Problema:**

- ❌ Emissor perdia controle total
- ❌ Laudos emitidos sem revisão
- ❌ Impossível corrigir erros antes do envio

---

### **Depois (Manual - CORRETO)** ✅

```
Lote status='concluido'
        ↓
[TRIGGER APENAS ATUALIZA STATUS - SEM EMISSÃO]
        ↓
RH/Entidade SOLICITA emissão (ETAPA 1)
        ↓
Emissor VÊ solicitação
        ↓
Emissor GERA laudo (ETAPA 2) → status='emitido'
        ↓
Emissor REVISA PDF
        ↓
Emissor ENVIA laudo (ETAPA 3) → status='enviado'
```

**Benefícios:**

- ✅ Emissor tem controle total do processo
- ✅ Pode revisar antes de enviar
- ✅ Pode corrigir erros detectados
- ✅ RH/Entidade sabe quando solicitar
- ✅ Rastreabilidade completa (quem solicitou, quando)

---

## 📊 Validações de Segurança

### **Para RH (Clínicas)**

```typescript
// Verifica:
1. user.perfil === 'rh'
2. lote.clinica_id existe
3. user tem acesso à empresa do lote (requireRHWithEmpresaAccess)
4. Lote está em status='concluido'
5. Laudo não foi emitido ainda (emitido_em IS NULL)
```

### **Para Gestor_Entidade**

```typescript
// Verifica:
1. user.perfil === 'gestor_entidade'
2. lote.contratante_id existe
3. user.contratante_id === lote.contratante_id
4. Lote está em status='concluido'
5. Laudo não foi emitido ainda (emitido_em IS NULL)
```

### **Para Emissor**

```typescript
// Verifica:
1. user.perfil === 'emissor'
2. Para GERAR: lote.status === 'concluido'
3. Para ENVIAR: laudo.status === 'emitido' (não pode pular revisão)
4. Não permite múltiplas emissões para o mesmo lote
```

---

## 🎯 Resumo

### **Quem faz o quê:**

| Perfil                        | Etapa | Ação             | Status Resultado   |
| ----------------------------- | ----- | ---------------- | ------------------ |
| **RH** ou **Gestor_Entidade** | 1     | Solicita emissão | Lote vai para fila |
| **Emissor**                   | 2     | Gera laudo (PDF) | `status='emitido'` |
| **Emissor**                   | 3     | Envia laudo      | `status='enviado'` |

### **A correção beneficia:**

✅ **RH (Clínicas)** - Pode solicitar quando necessário  
✅ **Gestor_Entidade** - Pode solicitar quando necessário  
✅ **Emissor** - Tem controle total da emissão  
✅ **Sistema** - Rastreabilidade e auditoria completa

---

## 🚀 Conclusão

**Sim, a correção é para RH e Gestor_Entidade!**

A correção garante que:

1. **RH** e **Gestor_Entidade** precisam **solicitar** emissão (não acontece sozinho)
2. **Emissor** tem controle **manual** de quando gerar e quando enviar
3. **Ninguém** perde controle do processo
4. **Todos** ganham rastreabilidade e qualidade

**O fluxo agora é 100% manual e controlado por cada perfil.**
