PR: Remove `rascunho` state & implement emission immediate

Branch: feat/remove-rascunho

Description:
- Remove `rascunho` from enums, types and DB migration.
- Centralize emission logic: immediate emission on `concluido` status.
- Block edit of `observacoes` (PUT returns 403).
- Disable cron endpoints (return 410) and noop triggers.
- Add migration `013_remove_rascunho_status.sql`.

Files changed (summary):
- `lib/types/enums.ts`, `lib/types/database.ts`, `lib/laudo-tipos.ts`
- `lib/lotes.ts`, `lib/laudo-auto.ts`
- `app/api/emissor/laudos/[loteId]/route.ts` (GET/PUT changed)
- `app/api/cron/emitir-laudos-auto/route.ts` and `app/api/system/auto-laudo/route.ts`
- `database/migrations/013_remove_rascunho_status.sql`
- Docs: `docs/MAQUINA-ESTADO-SIMPLIFICADA.md`

How to create the branch and PR locally:

```bash
# create branch from main
git checkout -b feat/remove-rascunho
# stage and commit changes (if not already committed)
git add -A && git commit -m "feat: remove 'rascunho' state; immediate emission; disable cron"
# push and open PR (if gh cli configured)
git push -u origin feat/remove-rascunho
# Then: gh pr create --base main --head feat/remove-rascunho --title "Remove 'rascunho' & emission immediate" --body-file docs/prs/PR-0001-remove-rascunho-and-emission-immediate.md
```

Notes:
- This PR is BREAKING and must be staged carefully. Coordinate migration and deletion windows with ops.
