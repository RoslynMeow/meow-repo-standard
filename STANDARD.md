# Meow Repo Standard — Specification

A repository-agnostic documentation and planning standard. The goal is consistency: every project has the same entry points, and detail lives one click away.

## 1. Tiers

| Tier | Files produced |
| --- | --- |
| **Lite** | `README.md` (+ translations), `.github/` templates, CI |
| **Standard** (default) | Lite + `wiki-template/` pushed to the GitHub Wiki |
| **Full** | Standard + a `Projects` roadmap linked to Issues |

`repo.config.json` → `"tier": "lite" | "standard" | "full"`.

## 2. README rules

The README is a landing page, not a manual.

- Title + one-line description.
- A badge row (build / release / downloads / license / docs / roadmap).
- One row of links: Wiki, Installation, Configuration, API, Data Sources, Roadmap, Releases, Issues.
- Translations linked at the top: `README.md` (default), `README.<locale>.md`.
- Everything else belongs in the Wiki.

## 3. Wiki rules

- The Wiki is mandatory at `Standard` and above.
- Default pages: `Home`, `Installation`, `Configuration`, `API`, `Features`, `Data-Sources`, `Architecture`, `Roadmap`, `FAQ`.
- English filenames (stable URLs); content may be any language.
- `_Sidebar.md` and `_Footer.md` are required.
- Translations use `<Page>.<locale>.md` (e.g. `Home.zh-CN.md`).
- `Home` must contain **Recent updates** and a navigation table.

## 4. Projects rules

- One project per repository: `<Name> Roadmap` (an emoji in `projectTitle` is allowed).
- Fields:
  - built-in `Status`: `Todo` / `In Progress` / `Done` / `Deferred` / `Canceled`
  - `Start` (DATE) = Issue creation date
  - `End` (DATE) = Issue close date
  - `Area` (SINGLE_SELECT), options from `projectAreas`
  - `Kind` (SINGLE_SELECT), options from `projectKinds` (`Feature` / `Fix` / `Docs` / `Chore` / `Release`)
- Views: `All Issues` (table), `Board`, `Roadmap`, `Canceled`, `Deferred`; all filtered to `is:issue`.
- **Project items are Issues only.** Pull requests are implementation artifacts and are never added to the Project.
- **Roadmap cards are real Issues**, never draft issues.
- A PR links an issue with `Closes #N`, but the PR itself is not a Project item.
- The project is public and linked to the repository.
- Labels: `deferred` (yellow), `canceled` (gray), `area: <slug>` for each area, plus `chore` and `release`.
- `Start` / `End` are filled from the Issue's creation / close dates when the Issue is added or closed. There is **no** `project-date.yml` workflow and **no** `PROJECT_TOKEN` secret.
- Planning workflow: the agent proposes a plan; only after the user accepts it, create real Issues and add them to the Project as `Todo`.
- Record every implementation step in the Issue (checklist/comment). Keep the status current.
- Deferred work keeps the `deferred` label and `Deferred` status. Canceled work keeps the `canceled` label and `Canceled` status. Never delete it, so it is not proposed again later.

## 5. Branching & release

Every repository starts with two identical branches:

- **`main`** — stable / release. **PR-only**: no direct pushes, no force pushes, no deletion. The rule is enforced for admins too, so every change to `main` is recorded by a PR.
- **`dev`** — integration / development. All day-to-day work is committed here.

There are no long-lived `feat/*` / `fix/*` branches. A temporary branch is allowed only when isolation is really needed, and must be deleted after merge.

Flow:

- Normal work: commit on `dev`.
- When a version is ready, open a PR `dev → main`.
- README/docs changes also reach `main` through the same `dev → main` PR.
- `main` stays the default branch, so `Closes #N` in a PR targeting `main` links the roadmap card.

Initialization creates `main` and `dev` at the same commit and enables the `main` protection rule.

## 6. Issue / PR rules

- `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md` asks for a summary, linked issue and test plan.
- CI runs on PRs and on pushes to the default branch.
- No `project-date` / `project-assignee` workflow is required. Project fields and statuses are maintained by the agent/bootstrap, not by a PAT-based workflow.

## 7. GitHub Pages (optional)

Pages is opt-in. Some repositories only ship a program, so Pages must never be assumed. `--pages` copies `optional/github-pages/`.

## 8. Automation boundaries

Automated by `scripts/bootstrap.mjs`:

- render README and copy `.github/`
- optionally copy the Pages scaffold
- clone `<repo>.wiki.git`, copy localized pages, commit and push
- create the Projects project, `Start` / `End` / `Area` / `Kind` fields, the `Todo` / `In Progress` / `Done` / `Deferred` / `Canceled` status options, five `is:issue` views, and the `deferred` / `canceled` / `area:*` / `chore` / `release` labels
- link the project to the repository and make it public
- create `dev`, protect `main` (PR-only, admins enforced) and optionally require CI checks (`requiredChecks`)

Requires a human (GitHub has no API for these):

1. Enable **Wiki** and create the first page (creates `<repo>.wiki.git`).
2. In the **Board** view, group by `Status`.
3. In the **Roadmap** view, choose `Start` and `End` as the date fields.
4. Reorder view tabs.

No `PROJECT_TOKEN` secret or `PROJECT_TITLE` variable is needed.

## 9. Known pitfalls (encoded in the script)

- Repository templates do **not** copy the Wiki or Projects.
- `updateProjectV2View` that only changes `name` resets the layout to `TABLE`; always pass `layout`.
- Roadmap views do not support visible fields; do not pass `configuration` when creating/updating them.
- Board grouping/sorting and Roadmap start/end field selection are view configuration with no public mutation.
- Closing keywords do not link when the PR base is not the default branch.
- Draft issues cannot be assigned through `addAssigneesToAssignable`; use `updateProjectV2DraftIssue` or convert to a real issue.
- Generated data files must be gitignored, not committed.
