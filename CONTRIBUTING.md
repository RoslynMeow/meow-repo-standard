# Contributing

See [`STANDARD.md`](STANDARD.md) for the full specification.

## Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | stable / release | **PR-only** — never push directly, no force push, no deletion |
| `dev` | integration | commit day-to-day work here |
| `feat/*`, `fix/*`, `chore/*` | short-lived | branch off `dev`, open a PR |

## Workflow

1. Create a short-lived branch from `dev`.
2. Commit with Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
3. Open a PR:
   - normal work: `feat/*` → `dev`
   - release: `dev` → `main` when a version is ready
   - a `feat/*` branch may also target `main` directly
   - README/docs changes also reach `main` through a PR
4. Link the roadmap issue with `Closes #N` in a PR that targets `main` (the default branch).

## Before opening a PR

- [ ] `node --check scripts/*.mjs` (for this repo)
- [ ] README / Wiki updated if behavior changed
- [ ] No secrets or generated files committed
