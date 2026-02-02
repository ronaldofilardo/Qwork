Title: chore(lint): chunked lint-staged script + use eslint_d + docs

Description:
This change improves the pre-commit experience for large PRs by making lint staged execution robust and memory-friendly.

What I changed:

- Add `scripts/lint-staged-chunked.mjs` — executes the linter in chunks to prevent OOM / SIGKILL on very large staged file lists.
- Switch lint-staged to use `eslint_d` (daemon) to drastically reduce ESLint startup time.
- Add `pnpm` scripts: `lint:staged:chunked`, `lint:staged:daemon` and `eslint:d:restart` for local workflows.
- Documented the flow in `docs/contributing/linting.md` and referenced it in `docs/policies/CONVENCOES.md`.
- Added a short corrections/changelog note at `docs/corrections/2026-01-22-lint-chunking.md`.

Why:

- Previously, pre-commit (eslint + lint-staged) could be killed when many files were staged, blocking PRs and developer flow. Chunking + daemon addresses performance and reliability while keeping CI as the final gate for lint correctness.

How to test locally:

1. `pnpm install`
2. `pnpm run eslint:d:restart` (optional) or `pnpm run lint:staged:daemon`
3. Create a big commit or simulate: `git add <many files>` and `git commit` to validate hooks do not crash.

Notes:

- The pre-commit hook is still enforced — if lint reports errors, fix them or open a follow-up PR. Use `--no-verify` only in emergencies and document in the PR.

Checklist (to be done before merge):

- [ ] CI lint job passes
- [ ] Smoke test commit locally (simulate large commit)
- [ ] Update any team docs / notify team

If you'd like, I can push this branch to your remote and open the PR for you (I'll need the remote origin URL or provider auth). Otherwise, you can run:

# push and create PR (example using provider CLI, e.g., gh)

# git remote add origin <repo-url>

git push -u origin fix/lint-staged-chunking

# then

gh pr create --title "chore(lint): chunked lint-staged script + use eslint_d + docs" --body-file PR_DESCRIPTION.md --base main --head fix/lint-staged-chunking
