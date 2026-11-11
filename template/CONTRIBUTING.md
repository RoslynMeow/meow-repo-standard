# Contributing

## Branches

Only two long-lived branches:

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | stable / release | **PR-only** — never push directly, no force push, no deletion |
| `dev` | integration / development | commit all day-to-day work here |

There are no long-lived `feat/*` / `fix/*` branches. Create a temporary branch only if you really need isolation, and delete it right after the merge.

## Workflow

1. Commit directly on `dev` with Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
2. Open a PR `dev → main` when a version is ready.
3. README/docs changes also reach `main` through the same `dev → main` PR.

## Task tracking

- Issues are the source of truth.
- The GitHub Project is only a view over those Issues.
- Start time = Issue creation time; end time = Issue close time.
- Add the Issue to the Project and set `Start` / `End` / `Area` / `Kind` from the Issue.
- Mark deferred work with the `deferred` label and `Deferred` status.
- Mark canceled work with the `canceled` label and `Canceled` status.
- Never delete an Issue or a Project item; keep it for history.

## Before opening a PR

- [ ] `npm run typecheck` (if applicable)
- [ ] `npm test` (if applicable)
- [ ] README / Wiki updated if behavior changed
- [ ] No secrets or generated files committed
