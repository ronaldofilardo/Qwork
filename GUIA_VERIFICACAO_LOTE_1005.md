# 🔍 Guia de Verificação: Por que o Lote 1005 Não Aparece

**Data**: 10/02/2026  
**Problema**: Aba "Aguardando Cobrança" mostra contador "0" mas lote 1005 existe no banco

---

## ✅ Mudanças Aplicadas

1. ✅ **Removida página `/admin/emissoes`** (agora usa apenas `/admin` → Financeiro → Pagamentos)
2. ✅ **Adicionados logs de debug** (frontend + backend)
3. ✅ **Commit e push realizados** (6ee5f5d)

---

## ⏱️ IMPORTANTE: Aguardar Deploy

O Vercel levará **2-3 minutos** para:
1. Detectar o novo commit
2. Fazer build da aplicação
3. Publicar a nova versão

**Aguarde uns minutos antes de testar!**

---

## 🔧 PASSO A PASSO PARA VERIFICAÇÃO

### 1️⃣ Aguarde o Deploy (2-3 minutos)

Você pode verificar o status do deploy em:
- Dashboard Vercel: https://vercel.com/qwork
- Ou aguarde a notificação de deploy

### 2️⃣ Abra o Site em Modo Anônimo

Para evitar cache:
- **Chrome/Edge**: Ctrl + Shift + N
- **Firefox**: Ctrl + Shift + P

### 3️⃣ Faça Login como Admin

Navegue para: https://qwork-psi.vercel.app/admin

### 4️⃣ Abra o Console do Navegador

**Pressione F12** e vá na aba **Console**

### 5️⃣ Navegue para Financeiro → Pagamentos

Observe os logs que aparecerão no Console:

#### ✅ LOGS ESPERADOS (Se estiver funcionando):

```
[API /admin/emissoes] Query executada com sucesso
[API /admin/emissoes] Total de rows: 1
[API /admin/emissoes] Primeira row: { lote_id: 1005, ... }

[DEBUG] Solicitações carregadas: {
  total: 1,
  count: 1,
  solicitacoes: [{ lote_id: 1005, status_pagamento: 'aguardando_cobranca', ... }]
}
```

#### ❌ LOGS DE PROBLEMA:

Se você ver:
```
[DEBUG] Solicitações carregadas: { total: 0, count: 0, solicitacoes: [] }
```

Então a API está retornando vazio (problema no banco ou view).

---

## 6️⃣ Verificar Aba Network (Se Console Não Mostrar Nada)

1. Pressione **F12**
2. Vá na aba **Network**
3. Recarregue a página (F5)
4. Filtre por: `emissoes`
5. Clique na requisição `/api/admin/emissoes`
6. Veja a **Response** (direita)

**Response esperada:**
```json
{
  "solicitacoes": [
    {
      "lote_id": 1005,
      "status_pagamento": "aguardando_cobranca",
      "empresa_nome": "RLJ COMERCIAL EXPORTADORA LTDA",
      ...
    }
  ],
  "total": 1
}
```

---

## 🎯 Possíveis Cenários

### Cenário A: Contador mostra "1" e lote aparece ✅
**Solução**: Era cache! Tudo resolvido.

### Cenário B: Console mostra `total: 0` ❌
**Problema**: API retornando vazio
**Causa possível**: 
- View `v_solicitacoes_emissao` com problema
- Database connection diferente
- RLS bloqueando

**Ação**: Tire print do Console e envie para análise

### Cenário C: Erro 403 ou 401 ❌
**Problema**: Autenticação
**Ação**: Faça logout e login novamente como admin

### Cenário D: Erro 500 ❌
**Problema**: Erro no servidor
**Ação**: Abra os logs do Vercel (Runtime Logs)

---

## 📞 Se Ainda Não Funcionar

Me envie:
1. **Print do Console** (aba Console com os logs)
2. **Print do Network** (clique na requisição `/api/admin/emissoes` e mostre Response)
3. **Print da tela** (mostrando contador "0")

---

## ⏰ TIMELINE

- **Agora (17:50)**: Commit feito, push enviado
- **17:53**: Deploy deve estar pronto
- **17:54**: Teste com hard refresh
- **17:55**: Se não funcionar, verifique Console

---

## 🚀 TESTE RÁPIDO (Após 3 minutos)

```
1. Abra: https://qwork-psi.vercel.app/admin (MODO ANÔNIMO)
2. Login como admin
3. F12 (Console aberto)
4. Financeiro → Pagamentos
5. Veja os logs [DEBUG]
6. Contador deve mostrar "1" em "Aguardando Cobrança"
```

---

**Última atualização**: Commit 6ee5f5d (há alguns segundos)  
**Deploy estimado**: Em até 3 minutos
