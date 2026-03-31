# Matriz de Permissões — QWork

> Atualizado: 29/03/2026  
> Fonte: análise de `requireRole()` / `assertRoles()` em todas as route.ts

## Legenda

| Símbolo | Significado                                |
| ------- | ------------------------------------------ |
| ✅      | Acesso permitido                           |
| 🔒      | Acesso com restrição (own data / contexto) |
| ❌      | Sem acesso                                 |
| 🌐      | Endpoint público (sem autenticação)        |

---

## 1. Autenticação & Público

| Endpoint             | Método   | admin | rh  | gestor | emissor | suporte | comercial | vendedor | funcionário | público |
| -------------------- | -------- | :---: | :-: | :----: | :-----: | :-----: | :-------: | :------: | :---------: | :-----: |
| `/api/auth/login`    | POST     |       |     |        |         |         |           |          |             |   🌐    |
| `/api/auth/logout`   | POST     |       |     |        |         |         |           |          |             |   🌐    |
| `/api/auth/session`  | GET      |       |     |        |         |         |           |          |             |   🌐    |
| `/api/health`        | GET      |       |     |        |         |         |           |          |             |   🌐    |
| `/api/public-config` | GET      |       |     |        |         |         |           |          |             |   🌐    |
| `/api/consentimento` | GET/POST |       |     |        |         |         |           |          |             |   🌐    |

---

## 2. Admin — Gestão da Plataforma

| Endpoint                      | Método    | admin | suporte | comercial | rh  | gestor |
| ----------------------------- | --------- | :---: | :-----: | :-------: | :-: | :----: |
| `/api/admin/auditorias/*`     | GET       |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/clinicas`         | GET/POST  |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/clinicas/[id]`    | PATCH/DEL |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/emissores`        | GET/POST  |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/funcionarios`     | GET/PUT   |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/gestores-rh`      | GET/POST  |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/contagem`         | GET       |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/volume`           | GET       |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/comissoes`        | GET       |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/comissoes/[id]`   | PATCH     |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/admin/comissoes/gerar`  | POST      |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |
| `/api/comissionamento/ciclos` | GET/POST  |  ✅   |   ❌    |    ❌     | ❌  |   ❌   |

---

## 3. Suporte — Gestão Financeira

| Endpoint                                           | Método    | admin | suporte |
| -------------------------------------------------- | --------- | :---: | :-----: |
| `/api/admin/emissoes/[loteId]/definir-valor`       | POST      |  ❌   |   ✅    |
| `/api/admin/emissoes/[loteId]/disponibilizar-link` | POST      |  ❌   |   ✅    |
| `/api/admin/emissoes/[loteId]/gerar-link`          | POST      |  ❌   |   ✅    |
| `/api/admin/entidades`                             | GET       |  ✅   |   ✅    |
| `/api/admin/entidades/[id]`                        | PATCH     |  ✅   |   ✅    |
| `/api/admin/financeiro/notificacoes`               | GET       |  ❌   |   ✅    |
| `/api/admin/financeiro/notificacoes/[id]`          | GET/PATCH |  ❌   |   ✅    |
| `/api/admin/pagamentos/[id]`                       | GET       |  ❌   |   ✅    |
| `/api/admin/parcelas-a-vencer`                     | GET       |  ❌   |   ✅    |
| `/api/admin/templates-contrato`                    | GET/POST  |  ❌   |   ✅    |
| `/api/suporte/representantes`                      | GET       |  ❌   |   ✅    |
| `/api/suporte/representantes/[id]`                 | GET/PATCH |  ❌   |   ✅    |
| `/api/suporte/vendedores/[id]`                     | GET/PATCH |  ❌   |   ✅    |
| `/api/suporte/vendedores/[id]/dados-bancarios`     | GET/PATCH |  ❌   |   ✅    |

---

## 4. Comercial — Gestão de Representantes & Leads

| Endpoint                                          | Método | admin | comercial | suporte |
| ------------------------------------------------- | ------ | :---: | :-------: | :-----: |
| `/api/admin/representantes`                       | GET    |  ❌   |    ✅     |   ✅    |
| `/api/admin/representantes/[id]`                  | GET    |  ❌   |    ✅     |   ✅    |
| `/api/admin/representantes/[id]/comissao`         | PATCH  |  ❌   |    ✅     |   ❌    |
| `/api/admin/representantes/[id]/leads`            | GET    |  ❌   |    ✅     |   ✅    |
| `/api/admin/representantes/[id]/status`           | PATCH  |  ✅   |    ✅     |   ✅    |
| `/api/admin/representantes/[id]/vinculos`         | GET    |  ❌   |    ✅     |   ❌    |
| `/api/admin/representantes/[id]/reenviar-convite` | POST   |  ❌   |    ✅     |   ❌    |
| `/api/admin/representantes-leads`                 | GET    |  ❌   |    ✅     |   ✅    |
| `/api/admin/representantes-leads/[id]/aprovar`    | POST   |  ❌   |    ✅     |   ✅    |
| `/api/admin/representantes-leads/[id]/converter`  | POST   |  ❌   |    ✅     |   ❌    |
| `/api/admin/representantes-leads/[id]/rejeitar`   | POST   |  ❌   |    ✅     |   ✅    |

---

## 5. RH — Gestão de Clínica

| Endpoint                            | Método  | admin | rh  | gestor |
| ----------------------------------- | ------- | :---: | :-: | :----: |
| `/api/rh/funcionarios`              | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/funcionarios/[cpf]`        | GET     |  ❌   | ✅  |   ✅   |
| `/api/rh/funcionarios/status`       | PATCH   |  ❌   | ✅  |   ❌   |
| `/api/rh/funcionarios/status/batch` | PATCH   |  ❌   | ✅  |   ❌   |
| `/api/rh/monitor/laudos`            | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/monitor/lotes`             | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/notificacoes`              | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/parcelas`                  | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/parcelas/download-recibo`  | GET     |  ❌   | ✅  |   ❌   |
| `/api/rh/relatorio-*-pdf`           | GET     |  ❌   | ✅  |   ❌   |
| `/api/clinica/configuracoes`        | GET/PUT |  ✅   | ✅  |   ❌   |
| `/api/auth/trocar-senha`            | POST    |  ❌   | ✅  |   ✅   |
| `/api/admin/reenviar-lote`          | POST    |  ❌   | ✅  |   ✅   |
| `/api/pendencias/lote`              | GET     |  ❌   | ✅  |   ✅   |

---

## 6. Gestor — Gestão de Entidade

| Endpoint                                    | Método       | admin | gestor |
| ------------------------------------------- | ------------ | :---: | :----: |
| `/api/entidade/dashboard`                   | GET          |  ❌   |   ✅   |
| `/api/entidade/empresas`                    | GET          |  ❌   |   ✅   |
| `/api/entidade/funcionarios`                | GET/POST/PUT |  ❌   |   ✅   |
| `/api/entidade/funcionarios/import`         | POST         |  ❌   |   ✅   |
| `/api/entidade/lote/[id]`                   | GET          |  ❌   |   ✅   |
| `/api/entidade/lote/[id]/solicitar-emissao` | POST         |  ❌   |   ✅   |
| `/api/entidade/lotes`                       | GET          |  ❌   |   ✅   |
| `/api/entidade/laudos`                      | GET          |  ❌   |   ✅   |
| `/api/entidade/pagamentos-em-aberto`        | GET          |  ❌   |   ✅   |
| `/api/entidade/parcelas`                    | GET          |  ❌   |   ✅   |
| `/api/entidade/relatorio-*-pdf`             | GET          |  ❌   |   ✅   |
| `/api/avaliacao/*`                          | GET/POST     |  ❌   |   ✅   |
| `/api/contratos`                            | GET/POST     |  ✅   |   ✅   |

---

## 7. Emissor — Emissão de Laudos

| Endpoint                                   | Método            | admin | emissor |
| ------------------------------------------ | ----------------- | :---: | :-----: |
| `/api/emissor/lotes`                       | GET               |  ❌   |   ✅    |
| `/api/emissor/laudos/[loteId]`             | GET/PATCH/PUT/DEL |  ❌   |   ✅    |
| `/api/emissor/laudos/[loteId]/upload`      | POST              |  ❌   |   ✅    |
| `/api/emissor/laudos/[loteId]/pdf`         | GET               |  ❌   |   ✅    |
| `/api/emissor/laudos/[loteId]/reprocessar` | POST              |  ❌   |   ✅    |
| `/api/emissor/notificacoes`                | GET               |  ❌   |   ✅    |

---

## 8. Vendedor — Vendas Diretas

| Endpoint                              | Método    | admin | vendedor |
| ------------------------------------- | --------- | :---: | :------: |
| `/api/vendedor/dados`                 | GET/PATCH |  ❌   |  ✅ 🔒   |
| `/api/vendedor/dados/bancarios`       | GET/PATCH |  ❌   |  ✅ 🔒   |
| `/api/vendedor/leads`                 | GET/POST  |  ❌   |  ✅ 🔒   |
| `/api/vendedor/dashboard/resumo`      | GET       |  ❌   |  ✅ 🔒   |
| `/api/vendedor/relatorios/pagamentos` | GET       |  ❌   |  ✅ 🔒   |
| `/api/vendedor/relatorios/vendas`     | GET       |  ❌   |  ✅ 🔒   |
| `/api/vendedor/trocar-senha`          | POST      |  ❌   |  ✅ 🔒   |
| `/api/vendedor/vinculos`              | GET       |  ❌   |  ✅ 🔒   |
| `/api/vendedor/aceitar-termos`        | POST      |  ❌   |    ✅    |
| `/api/vendedor/criar-senha`           | GET/POST  |  ❌   |    ✅    |

> 🔒 = Apenas dados próprios do vendedor autenticado

---

## 9. Representante — Parceiro Comercial

| Endpoint                           | Método | admin | representante | comercial |
| ---------------------------------- | ------ | :---: | :-----------: | :-------: |
| `/api/comissionamento/ciclos/[id]` | GET    |  ✅   |     ✅ 🔒     |    ❌     |

---

## 10. Defesa em Profundidade (RLS)

| Tabela                 | admin |     rh     | gestor |  emissor  |  suporte  | comercial |  vendedor  | representante |
| ---------------------- | :---: | :--------: | :----: | :-------: | :-------: | :-------: | :--------: | :-----------: |
| `funcionarios`         |  ✅   | 🔒 clínica |   ❌   |    ❌     | ✅ SELECT |    ❌     |     ❌     |      ❌       |
| `avaliacoes`           |  ✅   | 🔒 clínica |   ❌   |    ❌     |    ❌     |    ❌     |     ❌     |      ❌       |
| `lotes_avaliacao`      |  ✅   | 🔒 clínica |   ❌   | 🔒 status | ✅ SELECT | ✅ SELECT |     ❌     |  🔒 vinculos  |
| `laudos`               |  ✅   | 🔒 clínica |   ❌   |    ✅     | ✅ SELECT |    ❌     |     ❌     |      ❌       |
| `empresas_clientes`    |  ✅   | 🔒 clínica |   ❌   |    ❌     | ✅ SELECT | ✅ SELECT |     ❌     |      ❌       |
| `clinicas`             |  ✅   |   🔒 own   | 🔒 own |    ❌     |  ✅ ALL   |    ❌     |     ❌     |      ❌       |
| `representantes`       |  ✅   |     ❌     |   ❌   |    ❌     | ✅ SELECT |  ✅ ALL   |     ❌     |    🔒 own     |
| `leads_representante`  |  ✅   |     ❌     |   ❌   |    ❌     | ✅ SELECT |  ✅ ALL   |   🔒 own   |    🔒 own     |
| `vinculos_comissao`    |  ✅   |     ❌     |   ❌   |    ❌     | ✅ SELECT |  ✅ ALL   | 🔒 via rep |    🔒 own     |
| `comissoes_laudo`      |  ✅   |     ❌     |   ❌   |    ❌     |  ✅ ALL   |  ✅ ALL   |   🔒 own   |    🔒 own     |
| `hierarquia_comercial` |  ❌   |     ❌     |   ❌   |    ❌     | ✅ SELECT |  ✅ ALL   |   🔒 own   |      ❌       |

> Policies RLS para suporte/comercial/vendedor: Migration 1023, 1028, **1132**
