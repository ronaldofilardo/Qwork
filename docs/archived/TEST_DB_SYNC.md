# Sincronização: Banco de Teste ← Banco de Desenvolvimento (Fonte da Verdade)

Objetivo: garantir que o schema do banco de teste (`nr-bps_db_test`) reflita exatamente o schema do banco de desenvolvimento (`nr-bps_db`).

Política:

- O **banco de desenvolvimento (`nr-bps_db`) é a fonte da verdade** para schema e migrações.
- O **banco de teste (`nr-bps_db_test`) deve ser sincronizado** sempre que houver mudanças de schema no ambiente de desenvolvimento.

Processo (automático):

- Use o script Node: `node scripts/setup-test-db.js` — ele criará o banco de teste (se necessário), fará backup do schema atual do banco de teste e aplicará o schema do banco de desenvolvimento (via `pg_dump -s nr-bps_db | psql -d nr-bps_db_test`).

- Migrações de compatibilidade de teste (ex.: adicionar coluna `questao` em `respostas`) devem ser aplicadas primeiro apenas no `nr-bps_db_test`. Para scripts que populam dados históricos (possivelmente conflitantes com triggers de imutabilidade) usamos um segundo script opcional como `database/migrations/076_populate_questao_non_concluded_respostas.sql` que atualiza apenas linhas pertencentes a avaliações não concluídas.

Processo (manual):

- Exportar schema do dev e aplicar no teste:
  1. `pg_dump -U postgres -s -d nr-bps_db -f database/schema_nr-bps_db_dev.sql`
  2. `psql -U postgres -d nr-bps_db_test -f database/schema_nr-bps_db_dev.sql`

Notas de segurança:

- O script faz backup do schema do banco de teste antes de aplicar as mudanças.
- Não execute no banco de produção — este fluxo é apenas para sincronizar ambientes de testes com o schema de desenvolvimento.

Quando executar:

- Antes de executar a suíte E2E completa
- Após aplicar novas migrations no desenvolvimento
- Periodicamente em pipelines de CI para garantir paridade

Contato:

- Para exceções (ex.: manter dados de teste específicos), converse com a equipe antes de sobrescrever o banco de teste.
