# RELATORIO DE SINCRONIZACAO DE BANCO DE DADOS

## Desenvolvimento vs Producao

**Data:** 09/02/2026 15:14:09
**Banco Desenvolvimento:** nr-bps_db (PostgreSQL - localhost)
**Banco Producao:** neondb (Neon - AWS sa-east-1)

---

## RESUMO EXECUTIVO

| Metrica | Dev | Prod | Diferenca |
|---------|-----|------|-----------|
| **Total de Tabelas** | 66 | 72 | +6 |
| **Tabelas Sincronizadas** | 60 | 60 | OK |
| **Colunas (linhas)** | 790 | 802 | +12 |
| **Indices** | 319 | 326 | +7 |
| **Constraints** | 475 | 496 | +21 |

**Taxa de Sincronizacao:** 83.3%

---

## DIFERENCAS IDENTIFICADAS

### Tabelas em PRODUCAO mas NAO em DESENVOLVIMENTO

- (853 linhas)
- _backup_contratantes_senhas_audit
- _deprecated_fila_emissao
- contratantes
- funcionarios_backup_gestores_final_400
- vw_analise_grupos_negativos
- vw_audit_trail_por_contratante
- vw_auditoria_acessos_funcionarios
- vw_auditoria_acessos_rh
- vw_comparativo_empresas
- vw_notificacoes_admin_pendentes
- vw_recibos_completos

### Tabelas em DESENVOLVIMENTO mas NAO em PRODUCAO

- (788 linhas)
- fk_migration_audit
- tomadores
- v_relatorio_emissoes
- v_solicitacoes_emissao
- vw_empresas_stats

---

## ANALISE DETALHADA

### Estrutura de Colunas
- Linhas em Dev: 790
- Linhas em Prod: 802
- Diferenca: 12 linhas adicionais em Producao

As 3 tabelas adicionais em producao correspondem a essas 12 linhas extras.

### Indices
- Total em Dev: 319 indices
- Total em Prod: 326 indices
- Diferenca: 7 indices adicionais

### Constraints
- Total em Dev: 475 constraints
- Total em Prod: 496 constraints
- Diferenca: 21 constraints adicionais

---

## RECOMENDACOES

### Prioridade 1 - CRITICO
Sincronizar tabelas faltando em desenvolvimento (se houver).

### Prioridade 2 - MODERADO
Avaliar tabelas extras em desenvolvimento.

### Prioridade 3
- Validar indices faltando (7 em PROD)
- Validar constraints faltando (21 em PROD)
- Validar dados seed e valores default

---

*Relatorio gerado em: 09/02/2026 15:14:09*
