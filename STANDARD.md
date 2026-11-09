# Meow Repo Standard — Specification

A repository-agnostic documentation and planning standard. The goal is consistency: every project has the same entry points, and detail lives one click away.

## 1. Tiers

| Tier | Files produced |
| --- | --- |
| **Lite** | `README.md` (+ translations), `.github/` templates, CI |
| **Standard** (default) | Lite + `wiki-template/` pushed to the GitHub Wiki |
| **Full** | Standard + a `Projects` roadmap linked to Issues/PRs |

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

- One project per repository: `<Name> Roadmap`.
- Fields: built-in `Status` (Todo / In Progress / Done) plus a `Date` field.
- Views: list, roadmap, board.
- **Roadmap cards are real Issues**, never draft issues — drafts cannot link PRs.
- A PR links a card with `Closes #N`; the closing keyword only resolves when the PR targets the default branch.
- The project is public and linked to the repository.

## 5. Issue / PR rules

- `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml`.
- `.github/PULL_REQUEST_TEMPLATE.md` asks for a summary, linked issue and test plan.
- CI runs on PRs and on pushes to the default branch.

## 6. GitHub Pages (optional)

Pages is opt-in. Some repositories only ship a program, so Pages must never be assumed. `--pages` copies `optional/github-pages/`.

## 7. Automation boundaries

Automated by `scripts/bootstrap.mjs`:

- render README and copy `.github/`
- optionally copy the Pages scaffold
- clone `<repo>.wiki.git`, copy localized pages, commit and push
- create the Projects project, `Date` field and three views, link it to the repository and make it public

Requires a human (GitHub has no API for these):

1. Enable **Wiki** and create the first page (creates `<repo>.wiki.git`).
2. Select `Date` as Start/Target in the Roadmap view.
3. Reorder view tabs.

## 8. Known pitfalls (encoded in the script)

- Repository templates do **not** copy the Wiki or Projects.
- `updateProjectV2View` that only changes `name` resets the layout to `TABLE`; always pass `layout`.
- Roadmap start/target fields are view configuration with no public mutation.
- Closing keywords do not link when the PR base is not the default branch.
- Draft issues cannot be assigned through `addAssigneesToAssignable`; use `updateProjectV2DraftIssue` or convert to a real issue.
- `packages/server/data` style generated files must be gitignored, not committed.
