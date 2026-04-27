# Relatório Final de Auditoria — Sync PROD → STAGING
**Data**: 2025-04-26  
**Fonte de verdade**: neondb_staging  
**Alvo**: neondb_v2 (PROD)  
**Objetivo**: Confirmar que PROD está pronto para receber promoção do branch staging

---

## Resumo Executivo

✅ **PROD ESTÁ PRONTO PARA PROMOÇÃO**

Todas as gaps estruturais entre STAGING e PROD foram identificadas e corrigidas. Nenhuma diferença bloqueante permanece. Dados de produção estão intactos.

---

## Fases de Sync Realizadas

### Fase 1 — Backup (sessão anterior)
- ✅ Backup completo de PROD antes de qualquer alteração
- Arquivo: `backups/prod_v2_backup_20260425_163100/neondb_v2_full_20260425_163100.dump`
- Tamanho: 1.25MB

### Fase 2 — Migrations faltantes (sessão anterior)
- ✅ 10 migrations aplicadas (1200–1209) via `patch-1210-schema-diff-prod.sql`
- ✅ Tabela `confirmacao_identidade` removida intencionalmente
- ✅ Funções/tipos/tabelas do plano de sync aplicados

### Fase 3 — Colunas faltantes (esta sessão)
- ✅ 9 colunas adicionadas via `patch-missing-cols-prod.sql`

| Tabela | Coluna | Tipo |
|--------|--------|------|
| comissoes_laudo | arquivado | boolean NOT NULL DEFAULT false |
| comissoes_laudo | asaas_payment_id | varchar |
| comissoes_laudo | asaas_split_confirmado_em | timestamptz |
| comissoes_laudo | asaas_split_executado | boolean NOT NULL DEFAULT false |
| comissoes_laudo | percentual_comissao_comercial | numeric NOT NULL DEFAULT 0 |
| comissoes_laudo | valor_comissao_comercial | numeric NOT NULL DEFAULT 0 |
| leads_representante | requer_aprovacao_suporte | boolean NOT NULL DEFAULT false |
| vinculos_comissao | percentual_comissao_comercial | numeric NOT NULL DEFAULT 0 |
| vendedores_perfil | doc_nf_path | text |

### Fase 4 — Enum values faltantes (esta sessão)
- ✅ 7 valores adicionados via `patch-missing-enums-prod.sql`

| Enum | Valor |
|------|-------|
| perfil_usuario_enum | gestor |
| status_comissao | pendente_consolidacao |
| status_laudo_enum | aguardando_assinatura |
| status_laudo_enum | pdf_gerado |
| status_lead | aprovado |
| status_lead | rejeitado |
| status_representante | aprovacao_comercial |

> ⚠️ `status_avaliacao|concluido` (STAGING) vs `|concluida` (PROD): diferença intencional. Codebase usa `concluida`. Não alterado.

### Fase 5 — View v_solicitacoes_emissao (sessão anterior)
- ✅ View recriada no PROD com DDL completo de 42 colunas do STAGING
- Aplicada via `patch-view-solicitacoes-emissao.sql`

### Fase 6 — Funções e Triggers (esta sessão)
- ✅ 6 funções criadas via `patch-missing-funcs-triggers-prod.sql`
- ✅ 3 triggers críticos (migration 1229 — CPF único) criados

| Função/Trigger | Tipo | Criticidade |
|---------------|------|-------------|
| set_updated_at | function | normal |
| current_user_contratante_id | function (deprecated) | compatibilidade |
| fn_check_cpf_unico_sistema | function | CRÍTICO |
| fn_trigger_lead_cpf_unico | function | CRÍTICO |
| fn_trigger_representante_cpf_unico | function | CRÍTICO |
| fn_trigger_usuario_cpf_unico | function | CRÍTICO |
| tg_representante_cpf_unico | trigger on representantes | CRÍTICO |
| tg_lead_cpf_unico | trigger on representantes_cadastro_leads | CRÍTICO |
| tg_usuario_cpf_unico | trigger on usuarios | CRÍTICO |

---

## Status por Dimensão

### Tabelas
| Status | Detalhe |
|--------|---------|
| ✅ STAGING → PROD | Todas presentes, exceto `confirmacao_identidade` |
| ✅ `confirmacao_identidade` ausente | INTENCIONAL — dropeada via patch-1210 (feature removida) |
| ⚠️ PROD orfãs (aceitável) | `ciclos_comissao`, `v_auditoria_emissoes` — de migrations exclusivas do PROD |

### Colunas
| Status | Detalhe |
|--------|---------|
| ✅ Todas as colunas de STAGING presentes em PROD | Após patches desta sessão |
| ⚠️ PROD tem colunas extras (aceitável) | `analise_estatistica`, `hierarquia_comercial`, `representantes`, `comissoes_laudo` — de migrations orfãs do PROD |

### Enums
| Status | Detalhe |
|--------|---------|
| ✅ Todos os values de STAGING presentes em PROD | Após patch desta sessão |
| ⚠️ PROD tem values extras (aceitável) | `status_aprovacao_enum` (ativo/cancelado/inativo), `status_laudo_enum|rascunho`, `status_lote_enum|rascunho` |
| ℹ️ Divergência controlada | `status_avaliacao|concluida` (PROD) vs `|concluido` (STAGING) — codebase usa `concluida` |

### Views
| Status | Detalhe |
|--------|---------|
| ✅ `v_solicitacoes_emissao` | Recriada com DDL exato do STAGING (42 colunas) |
| ⚠️ `v_auditoria_emissoes` | Presente só em PROD — orfã aceitável |

### Funções
| Status | Detalhe |
|--------|---------|
| ✅ Todas as funções de STAGING presentes em PROD | Após patch desta sessão |
| ⚠️ PROD tem funções extras (aceitável) | `detectar_anomalia_score`, `detectar_anomalias_indice`, `gerar_codigo_representante`, `trg_gerar_codigo_representante` |

### Triggers
| Status | Detalhe |
|--------|---------|
| ✅ `tg_representante_cpf_unico` on representantes | Criado — enforcement CPF único |
| ✅ `tg_lead_cpf_unico` on representantes_cadastro_leads | Criado — enforcement CPF único |
| ✅ `tg_usuario_cpf_unico` on usuarios | Criado — enforcement CPF único |
| ⚠️ PROD tem triggers extras (aceitável) | `trg_recalc_lote_on_avaliacao_change`, `trg_representante_codigo` |

### Integridade de Dados
| Tabela | Linhas | Status |
|--------|--------|--------|
| avaliacoes | 324 | ✅ |
| clinicas | 26 | ✅ |
| contratos | 44 | ✅ |
| empresas_clientes | 55 | ✅ |
| entidades | 16 | ✅ |
| funcionarios | 354 | ✅ |
| laudos | 77 | ✅ |
| lotes_avaliacao | 86 | ✅ |
| pagamentos | 40 | ✅ |
| representantes | 2 | ✅ |
| respostas | 5342 | ✅ |
| usuarios | 46 | ✅ |

---

## Diferenças Residuais (Todas Aceitáveis)

Estas diferenças são **orfãs do PROD** (migrations aplicadas só em PROD) e **não são bloqueantes**:

| Objeto | Direção | Motivo |
|--------|---------|--------|
| `confirmacao_identidade` | STAGING only | Dropeada intencionalmente em PROD (patch-1210) |
| `ciclos_comissao` | PROD only | Migration orfã de PROD |
| `v_auditoria_emissoes` | PROD only | Migration orfã de PROD |
| `analise_estatistica` +2 cols | PROD tem mais | Migration orfã de PROD |
| `representantes` +2 cols | PROD tem mais | Migration orfã de PROD |
| `comissoes_laudo` +N cols | PROD tem mais | Migrations orfãs de PROD |
| `status_avaliacao|concluida` | PROD only | Codebase usa `concluida`, STAGING tem `concluido` como alias |
| `status_aprovacao_enum` 3 values | PROD only | Migration orfã de PROD |
| `detectar_anomalia_score`, etc. | PROD only | Funções de analytics, orfãs do PROD |
| `trg_recalc_lote_on_avaliacao_change` | PROD only | Trigger orfão do PROD |
| `trg_representante_codigo` | PROD only | Trigger orfão do PROD (código legado) |

---

## Rollback

Caso necessário, restaurar backup completo:
```powershell
$env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

pg_restore -h ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb_v2 -Fc C:\apps\QWork\backups\prod_v2_backup_20260425_163100\neondb_v2_full_20260425_163100.dump
```

---

## Veredicto Final

**✅ PROD (neondb_v2) está PRONTO para receber a promoção do branch staging.**

- Zero gaps bloqueantes de STAGING → PROD
- Todos os 9 triggers/funções CPF único ativos (enforcement de regra crítica de negócio)
- Dados intactos (todos os 12 checks passam)
- Diferenças residuais são todas orfãs de migrations exclusivas do PROD e não interferem no código do staging
