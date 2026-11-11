# Contributing

See [`STANDARD.md`](STANDARD.md) for the full specification.

## Branches

Only two long-lived branches:

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | stable / release | **PR-only** — never push directly, no force push, no deletion |
| `dev` | integration / development | commit all day-to-day work here |

There are no long-lived `feat/*` / `fix/*` branches. Create a temporary branch only if you really need isolation, and delete it after merge.

## Workflow

1. Commit directly on `dev` with Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
2. Open a PR `dev → main` when a version is ready.
3. README/docs changes also reach `main` through the same `dev → main` PR.

## Task tracking

- Issues are the source of truth.
- The GitHub Project is only a view over Issues.
- Start time = Issue creation time; end time = Issue close time.
- Add the Issue to the Project and set `Start` / `End` / `Area` / `Kind` from the Issue.
- Deferred work uses the `deferred` label and `Deferred` status.
- Canceled work uses the `canceled` label and `Canceled` status.

## Before opening a PR

- [ ] `node --check scripts/*.mjs` (for this repo)
- [ ] README / Wiki updated if behavior changed
- [ ] No secrets or generated files committed
