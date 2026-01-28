# Políticas RLS Revisadas - Qwork

## 📋 Documentação Completa

Esta pasta contém toda a documentação e scripts relacionados à **revisão completa das políticas RLS** implementadas no Qwork em **11/12/2025**.

---

## 🎯 Objetivo da Revisão

Implementar restrições de segurança específicas para o **perfil Admin**, incluindo:

1. ✅ Bloqueio de acesso a **avaliações, respostas e resultados**
2. ✅ Limitação de acesso a **funcionários** (apenas RH e Emissor)
3. ✅ Implementação de **imutabilidade** para avaliações concluídas

---

## 📚 Estrutura da Documentação

### 📄 Arquivos Principais

| Arquivo                                                      | Descrição                       | Quando Usar                |
| ------------------------------------------------------------ | ------------------------------- | -------------------------- |
| **[RLS-POLICIES-REVISION.md](./RLS-POLICIES-REVISION.md)**   | Documentação completa e técnica | Entender todos os detalhes |
| **[GUIA-RAPIDO-RLS.md](./GUIA-RAPIDO-RLS.md)**               | Guia de implementação rápida    | Aplicar as mudanças        |
| **[RESUMO-VISUAL-RLS.md](./RESUMO-VISUAL-RLS.md)**           | Resumo visual com diagramas     | Visão geral rápida         |
| **[EXAMPLE-API-ROUTES-RLS.ts](./EXAMPLE-API-ROUTES-RLS.ts)** | Exemplos de código para APIs    | Ajustar o frontend         |

### 🗂️ Scripts SQL

| Script                                                               | Descrição                     | Quando Executar           |
| -------------------------------------------------------------------- | ----------------------------- | ------------------------- |
| **[rls-policies-revised.sql](../database/rls-policies-revised.sql)** | Políticas RLS completas       | Referência técnica        |
| **[migrate-rls-policies.sql](../database/migrate-rls-policies.sql)** | Script de migração seguro     | Aplicar em banco de dados |
| **[test-rls-policies.sql](../database/test-rls-policies.sql)**       | Suite de testes automatizados | Validar implementação     |

---

## 🚀 Como Começar

### 1️⃣ Para Entender as Mudanças

👉 Leia: **[RESUMO-VISUAL-RLS.md](./RESUMO-VISUAL-RLS.md)**

### 2️⃣ Para Implementar

👉 Siga: **[GUIA-RAPIDO-RLS.md](./GUIA-RAPIDO-RLS.md)**

### 3️⃣ Para Detalhes Técnicos

👉 Consulte: **[RLS-POLICIES-REVISION.md](./RLS-POLICIES-REVISION.md)**

### 4️⃣ Para Ajustar Código

👉 Veja: **[EXAMPLE-API-ROUTES-RLS.ts](./EXAMPLE-API-ROUTES-RLS.ts)**

---

## ⚡ Implementação Rápida (5 Minutos)

```powershell
# 1. Backup
pg_dump -U postgres -d nr-bps_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# 2. Aplicar migração
psql -U postgres -d nr-bps_db -f database/migrate-rls-policies.sql

# 3. Validar
psql -U postgres -d nr-bps_db -f database/test-rls-policies.sql
```

Se todos os testes passarem (mostrar **✓ PASSOU**), está pronto! ✅

---

## 📊 Resumo das Mudanças

### Perfil Admin - ANTES vs DEPOIS

| Recurso      | ANTES    | DEPOIS               |
| ------------ | -------- | -------------------- |
| Funcionários | 🟢 Todos | 🟡 Apenas RH/Emissor |
| Avaliações   | 🟢 Todas | 🔴 Bloqueado         |
| Respostas    | 🟢 Todas | 🔴 Bloqueado         |
| Resultados   | 🟢 Todos | 🔴 Bloqueado         |
| Lotes        | 🟢 Todos | 🔴 Bloqueado         |
| Laudos       | 🟢 Todos | 🔴 Bloqueado         |
| Empresas     | 🟢 Todas | 🟢 Todas ✅          |
| Clínicas     | 🟢 Todas | 🟢 Todas ✅          |

**Legenda:**

- 🟢 Acesso total
- 🟡 Acesso limitado
- 🔴 Sem acesso

### Imutabilidade Implementada

```
Avaliação CONCLUÍDA = Dados IMUTÁVEIS
├─► Respostas: Não podem ser modificadas
├─► Resultados: Não podem ser modificados
└─► Status: Não pode ser alterado
```

---

## 🔍 Perguntas Frequentes

### ❓ Por que Admin não pode mais acessar avaliações?

**Resposta:** Para garantir **separação de responsabilidades** e proteger dados sensíveis. Admin gerencia usuários e infraestrutura, mas não deve ter acesso a dados pessoais de avaliações.

### ❓ Como fazer manutenções emergenciais?

**Resposta:** Para manutenções emergenciais, entre em contato com a equipe de desenvolvimento ou administração do sistema. As avaliações concluídas são imutáveis por design para garantir integridade dos dados.

### ❓ E se eu precisar que Admin acesse algo específico?

**Resposta:** Você pode:

1. Criar uma nova política RLS específica para o caso
2. Consultar a equipe de desenvolvimento para avaliar a necessidade
3. Usar perfis RH ou Emissor que têm acesso apropriado aos dados

### ❓ Como reverter as mudanças?

**Resposta:** Restaure o backup feito antes da migração:

```powershell
psql -U postgres -d nr-bps_db < backup_XXXXXX.sql
```

### ❓ Os dados existentes são afetados?

**Resposta:** **Não**. Apenas as **permissões de acesso** são alteradas. Nenhum dado é modificado ou deletado.

---

## ⚠️ Avisos Importantes

### 🚨 Antes de Aplicar em Produção

- ✅ Fazer **backup completo** do banco de dados
- ✅ Testar em **desenvolvimento** primeiro
- ✅ Executar em **horário de baixo movimento**
- ✅ Comunicar **usuários Admin** sobre as mudanças

### 💡 Boas Práticas

- Monitore a tabela `audit_access_log`
- Revise as políticas a cada **6 meses**
- Documente **quaisquer exceções**
- Mantenha a separação de responsabilidades entre perfis

---

## 🛠️ Suporte e Troubleshooting

### Problema: Teste falhou

**Solução:**

1. Verifique se o banco está limpo (sem políticas antigas conflitantes)
2. Execute: `DROP POLICY IF EXISTS ...` para políticas antigas
3. Reaplique a migração

### Problema: Admin não consegue fazer login

**Solução:**

- Admin ainda pode fazer login normalmente
- Apenas o **acesso a certas tabelas** é restrito
- Verifique se o dashboard do Admin foi ajustado

### Problema: Erro de permissão ao modificar resultado

**Solução:**

- É esperado se a avaliação está **concluída**
- As avaliações concluídas são imutáveis por design
- Para qualquer modificação, consulte a equipe de desenvolvimento

---

## 📞 Contato

Em caso de dúvidas ou problemas:

1. Consulte a documentação completa
2. Verifique os logs do PostgreSQL
3. Entre em contato com a equipe de desenvolvimento

---

## 📜 Histórico

| Data       | Versão | Descrição                          |
| ---------- | ------ | ---------------------------------- |
| 11/12/2025 | 2.0    | Revisão completa das políticas RLS |
| -          | 1.0    | Implementação inicial              |

---

## 📄 Licença

Este documento é parte do sistema Qwork e deve ser mantido em sigilo.

---

**Última atualização:** 11/12/2025  
**Autor:** Copilot  
**Qwork - Sistema de Avaliação Psicossocial**
