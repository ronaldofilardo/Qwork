PR: Test fixes for cron/emission and Notification UI

Branch: fix/tests-cron-emission

Description:

- Update tests to accept cron endpoints being disabled (410) and to validate emission immediate behavior (mocking `gerarLaudoCompletoEmitirPDF`).
- Update Notification/NotificationCenter tests to use new messaging and types ('processado').
- Adjust messages in tests that referenced scheduling text.

Files to update (examples):

- `__tests__/api/cron/emitir-laudos-auto.test.ts`
- `__tests__/lib/lotes-recalculo.test.ts`
- `__tests__/components/NotificationCenter.test.tsx`
- `__tests__/api/system/emissao-automatica-status.test.ts`

How to create branch and PR:

```bash
git checkout -b fix/tests-cron-emission
# apply changes, run tests
pnpm test __tests__/api/cron/emitir-laudos-auto.test.ts
git add -A && git commit -m "test: adapt cron & emission tests for immediate flow"
git push -u origin fix/tests-cron-emission
# open PR
gh pr create --base main --head fix/tests-cron-emission --title "Fix tests: cron & emission" --body-file docs/prs/PR-0002-fix-tests-cron-and-emission.md
```
