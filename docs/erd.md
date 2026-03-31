# ERD — QWork Database

> Este arquivo é gerado automaticamente por `scripts/generate-erd.ts`.
> Para regenerar: `pnpm db:erd`

**PENDING** — Execute `pnpm db:erd` contra o banco `nr-bps_db` local para gerar o diagrama ERD completo.

O diagrama incluirá:

- Todas as tabelas organizadas por domínio (Foundation, Identidade, Entidades & Comercial, Avaliações & Laudos, Financeiro & Notificações)
- Colunas com tipo, indicação PK/FK e comentários (`COMMENT ON COLUMN`)
- Relações entre tabelas com cardinalidade inferida das FK constraints
- Comentários de tabelas (`COMMENT ON TABLE`) como documentação inline
