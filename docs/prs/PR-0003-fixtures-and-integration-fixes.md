PR: Recreate fixtures and fix integration tests impacted by data deletions

Branch: fix/fixtures-integration

Description:

- Rework test fixtures/seeds to not rely on globally shared data that was removed.
- Ensure tests create and clean up their own data; use randomized identifiers to avoid unique constraint collisions.
- Update integration tests that assumed presence of historical laudos/lotes.

Suggested changes:

- Add helper functions in `__tests__/utils/seed.ts` to generate unique records.
- Update failing integration tests to call seed helpers before assertions.

Commands:

```bash
git checkout -b fix/fixtures-integration
# Implement helpers and update tests
pnpm test __tests__/integration --silent
git add -A && git commit -m "test: robust fixtures for integration tests"
git push -u origin fix/fixtures-integration
gh pr create --base main --head fix/fixtures-integration --title "Fix fixtures for integration tests" --body-file docs/prs/PR-0003-fixtures-and-integration-fixes.md
```
