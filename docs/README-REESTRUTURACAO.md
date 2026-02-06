# 📝 Índice de Documentação - Reestruturação Usuários e Funcionários

## 🎯 Visão Geral

Este documento serve como índice central para toda a documentação relacionada à reestruturação do modelo de dados que separa **usuários do sistema** (com acesso) de **funcionários** (pessoas avaliadas).

---

## 📚 Documentos Disponíveis

### 1. 🔄 [REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md](./REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md)

**Descrição:** Documento conceitual completo sobre a reestruturação  
**Quando usar:** Para entender o "porquê" e o "o quê" da mudança  
**Conteúdo:**

- Visão geral e motivação
- Modelo proposto (tabelas usuarios e funcionarios)
- Hierarquia e responsabilidades de cada tipo de usuário
- Diagrama de relacionamentos simplificado
- Fluxos de trabalho principais
- Benefícios da reestruturação
- Checklist de implementação
- Riscos e mitigações

### 2. 💻 [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md)

**Descrição:** Guia técnico detalhado de implementação  
**Quando usar:** Durante a implementação da reestruturação  
**Conteúdo:**

- Estrutura de dados completa (SQL)
- Processo de migração passo a passo
- Atualizações de código (TypeScript, React, API)
- Configuração de permissões e RLS
- Exemplos de código atualizado
- Testes automatizados
- Queries de monitoramento
- Troubleshooting e soluções

### 3. 📐 [DIAGRAMA-USUARIOS-FUNCIONARIOS.md](./DIAGRAMA-USUARIOS-FUNCIONARIOS.md)

**Descrição:** Diagramas visuais da arquitetura  
**Quando usar:** Para visualizar a estrutura e relacionamentos  
**Conteúdo:**

- Diagrama completo da arquitetura
- Camadas do sistema (usuários, estrutura, avaliações)
- Fluxos de trabalho ilustrados
- Regras de negócio resumidas
- Constraints e validações
- Índices de banco de dados

### 4. 🔧 [Migration 300](../database/migrations/300_reestruturacao_usuarios_funcionarios.sql)

**Descrição:** Script SQL de migração completo  
**Quando usar:** Para executar a migração no banco de dados  
**Conteúdo:**

- Script SQL executável
- Validações pré e pós-migração
- Criação da nova tabela usuarios
- Migração de dados
- Limpeza da tabela funcionarios
- Atualização de views
- Triggers de auditoria
- Relatórios de validação

---

## 🗺️ Roadmap de Leitura

### Para Entender o Conceito

1. Leia [REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md](./REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md) - Seções 1-4
2. Visualize [DIAGRAMA-USUARIOS-FUNCIONARIOS.md](./DIAGRAMA-USUARIOS-FUNCIONARIOS.md) - Diagramas principais

### Para Implementar

1. Leia [REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md](./REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md) - Seção completa
2. Estude [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md) - Estrutura de dados
3. Revise [Migration 300](../database/migrations/300_reestruturacao_usuarios_funcionarios.sql)
4. Execute os passos de [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md) - Processo de migração
5. Implemente atualizações de código conforme [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md)

### Para Desenvolver Features

1. Consulte [DIAGRAMA-USUARIOS-FUNCIONARIOS.md](./DIAGRAMA-USUARIOS-FUNCIONARIOS.md) - Fluxos de trabalho
2. Use [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md) - Exemplos de código

### Para Resolver Problemas

1. Consulte [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md) - Seção Troubleshooting
2. Valide com queries de [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md) - Monitoramento

---

## 🎯 Quick Reference

### Tabelas Principais

| Tabela           | Propósito         | Quem está aqui?                           |
| ---------------- | ----------------- | ----------------------------------------- |
| **usuarios**     | Acesso ao sistema | admin, emissor, gestor, rh                |
| **funcionarios** | Pessoas avaliadas | funcionario_clinica, funcionario_entidade |

### Tipos de Usuário (tabela usuarios)

| Tipo        | Vinculação     | Pode fazer                            |
| ----------- | -------------- | ------------------------------------- |
| **admin**   | Nenhuma        | Gerenciar sistema completo            |
| **emissor** | Nenhuma        | Emitir laudos                         |
| **rh**      | clinica_id     | Gerenciar clínica e empresas clientes |
| **gestor**  | contratante_id | Gerenciar própria entidade            |

### Tipos de Funcionário (tabela funcionarios)

| Tipo                     | Vinculação                  | Avaliado por               |
| ------------------------ | --------------------------- | -------------------------- |
| **funcionario_clinica**  | empresa_id + clinica_id     | Empresa cliente da clínica |
| **funcionario_entidade** | contratante_id + clinica_id | Entidade direta            |

---

## ⚙️ Comandos Úteis

### Verificar estado atual

```sql
-- Ver distribuição de usuários
SELECT tipo_usuario, COUNT(*) FROM usuarios GROUP BY tipo_usuario;

-- Ver distribuição de funcionários
SELECT usuario_tipo, COUNT(*) FROM funcionarios GROUP BY usuario_tipo;
```

### Executar migração

```bash
# Backup
pg_dump -h HOST -U USER -d DATABASE > backup.sql

# Migração
psql -h HOST -U USER -d DATABASE -f database/migrations/300_reestruturacao_usuarios_funcionarios.sql
```

### Validar migração

```sql
-- Verificar que não há usuários do sistema em funcionarios
SELECT COUNT(*) FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');
-- Deve retornar 0
```

---

## 📞 Contato e Suporte

Para dúvidas sobre a implementação:

- Revisar seção de Troubleshooting em [GUIA-IMPLEMENTACAO-REESTRUTURACAO.md](./GUIA-IMPLEMENTACAO-REESTRUTURACAO.md)
- Consultar exemplos de código no mesmo documento
- Verificar constraints no [DIAGRAMA-USUARIOS-FUNCIONARIOS.md](./DIAGRAMA-USUARIOS-FUNCIONARIOS.md)

---

## 📅 Histórico de Versões

| Versão | Data       | Descrição                     |
| ------ | ---------- | ----------------------------- |
| 1.0    | 04/02/2026 | Documentação inicial completa |

---

## ✅ Status da Documentação

- ✅ Documento conceitual (REESTRUTURACAO-USUARIOS-FUNCIONARIOS.md)
- ✅ Guia de implementação (GUIA-IMPLEMENTACAO-REESTRUTURACAO.md)
- ✅ Diagramas (DIAGRAMA-USUARIOS-FUNCIONARIOS.md)
- ✅ Migration SQL (300_reestruturacao_usuarios_funcionarios.sql)
- ✅ Índice (README-REESTRUTURACAO.md - este documento)

**Status geral:** ✅ Documentação completa e pronta para uso

---

**Última atualização:** 04 de Fevereiro de 2026  
**Responsável:** Equipe de Desenvolvimento QWork
