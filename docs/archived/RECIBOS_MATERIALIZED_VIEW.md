# vw_recibos_completos_mat (Materialized View)

Objetivo

- Melhorar a performance de consultas frequentes sobre recibos (relatórios, geração de PDFs em batch, dashboards).

O que foi criado

- `vw_recibos_completos_mat`: materialized view que contém os mesmos campos de `vw_recibos_completos`, incluindo `valor_parcela` calculado.
- Índices: `idx_vw_recibos_completos_mat_id`, `idx_vw_recibos_completos_mat_numero`, `idx_vw_recibos_completos_mat_criado`.
- Função helper `refresh_vw_recibos_completos_mat()` que tenta `REFRESH MATERIALIZED VIEW CONCURRENTLY` e dá fallback para `REFRESH MATERIALIZED VIEW` quando necessário.

Como usar

- Para consultar dados:
  - SELECT \* FROM vw_recibos_completos_mat WHERE id = $1;

- Para atualizar os dados (recomendado):
  - Agendar um job periódico (cron) para chamar `SELECT refresh_vw_recibos_completos_mat();` a cada N minutos (ex: 5-10 min) ou após operações de batch que alterem recibos.

Observações

- A materialized view deve ser atualizada periodicamente. Dependendo do volume de alterações, ajuste o intervalo de refresh.
- Em casos de geração de PDFs em tempo real (recibo recém-gerado), a API de geração de recibo continua a retornar dados a partir de `vw_recibos_completos` (fonte canônica). A view materializada é para consultas de alta leitura e relatórios.

Migração aplicada: `database/migrations/044_create_mat_vw_recibos.sql`.
