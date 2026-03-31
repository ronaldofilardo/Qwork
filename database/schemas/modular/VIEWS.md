# Views & Dependencies Map

Mapa de dependências das views do banco `nr-bps_db_test`, organizadas por domínio modular.

## Legenda

- **Domínio**: arquivo modular onde a view é definida
- **Depende de**: tabelas/views referenciadas na query (com domínio de origem)

---

## 01-foundation.sql

| View                  | Tipo | Depende de        |
| --------------------- | ---- | ----------------- |
| `audit_stats_by_user` | VIEW | `audit_logs` (01) |

## 02-identidade.sql

| View                      | Tipo | Depende de                                                |
| ------------------------- | ---- | --------------------------------------------------------- |
| `gestores`                | VIEW | `usuarios` (02)                                           |
| `vw_auditoria_acessos_rh` | VIEW | `session_logs` (02), `funcionarios` (02), `clinicas` (02) |

## 03-entidades-comercial.sql

| View        | Tipo | Depende de                        |
| ----------- | ---- | --------------------------------- |
| `tomadores` | VIEW | `entidades` (03), `clinicas` (02) |

## 04-avaliacoes-laudos.sql

| View                       | Tipo | Depende de                                                                                                                              |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `v_auditoria_emissoes`     | VIEW | `lotes_avaliacao` (04), `empresas_clientes` (03), `clinicas` (02), `avaliacoes` (04), `laudos` (04)                                     |
| `v_fila_emissao`           | VIEW | `auditoria_laudos` (04)                                                                                                                 |
| `v_relatorio_emissoes`     | VIEW | `lotes_avaliacao` (04), `tomadores` VIEW (03), `laudos` (04), `avaliacoes` (04), `clinicas` (02), `empresas_clientes` (03)              |
| `vw_auditoria_avaliacoes`  | VIEW | `avaliacoes` (04), `lotes_avaliacao` (04), `clinicas` (02), `empresas_clientes` (03), `audit_logs` (01)                                 |
| `vw_empresas_stats`        | VIEW | `empresas_clientes` (03), `clinicas` (02), `funcionarios_clinicas` (02), `funcionarios` (02), `avaliacoes` (04), `lotes_avaliacao` (04) |
| `vw_funcionarios_por_lote` | VIEW | `funcionarios` (02), `funcionarios_entidades` (03), `funcionarios_clinicas` (02), `avaliacoes` (04), `lotes_avaliacao` (04)             |

## 05-financeiro-notificacoes.sql

| View                        | Tipo              | Depende de                           |
| --------------------------- | ----------------- | ------------------------------------ |
| `v_solicitacoes_emissao`    | VIEW              | placeholder (sem dependências reais) |
| `vw_notificacoes_nao_lidas` | VIEW              | `notificacoes` (05)                  |
| `vw_recibos_completos_mat`  | MATERIALIZED VIEW | `recibos` (05), `pagamentos` (05)    |

---

## Ordem de execução obrigatória

Para recriar o banco do zero, os arquivos devem ser executados nesta ordem:

```
01-foundation.sql        → tipos, funções base, tabelas de auditoria
02-identidade.sql        → clínicas, funcionários, usuários, RBAC
03-entidades-comercial.sql → entidades, empresas, contratos, representantes
04-avaliacoes-laudos.sql → avaliações, lotes, laudos, emissão
05-financeiro-notificacoes.sql → pagamentos, recibos, notificações
acl.sql                  → GRANTs/REVOKE de permissões
```

## Grafo de dependências entre domínios

```
01-foundation ──────┐
                    ▼
02-identidade ──────┐
                    ▼
03-entidades ───────┐
                    ▼
04-avaliacoes ──────┐
                    ▼
05-financeiro ──────┐
                    ▼
acl (permissões)
```

**Nota**: Cada domínio pode referenciar tabelas de domínios anteriores. Nunca existe referência circular (domínio inferior → domínio superior).
