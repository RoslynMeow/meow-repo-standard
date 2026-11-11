---
name: repo-standard
description: Use when creating or normalizing a GitHub repository to the Meow Repo Standard (minimal README with badges and links, Wiki docs, Issue-based Projects roadmap, Issue/PR templates, optional GitHub Pages). Trigger on requests like "初始化仓库标准", "apply repo standard", "simplify README + move docs to wiki + set up roadmap", or when starting a new repo.
---

# Meow Repo Standard

Apply this standard to the current repository. The source of truth is
`https://github.com/RoslynMeow/meow-repo-standard` (`STANDARD.md`).

## Locating the standard

1. If `MEOW_REPO_STANDARD` is set, use that path.
2. Else if `E:\Github\meow-repo-standard` exists, use it.
3. Else clone `https://github.com/RoslynMeow/meow-repo-standard.git` into a temp directory and remove it when done.

The bootstrap script is `<standard>/scripts/bootstrap.mjs`; the checker is `<standard>/scripts/repo-check.mjs`.

## Workflow

1. **Inspect** the repo: language, current README, whether a Wiki/Projects already exist.
2. **Choose a tier**: `lite` (README + .github), `standard` (default, + Wiki), `full` (+ Projects roadmap).
3. **Create or edit `repo.config.json`** in the repo root:

   ```json
   {
     "owner": "OWNER",
     "repo": "REPO",
     "name": "Project Name",
     "description": "One-line description.",
     "defaultLocale": "en",
     "locales": ["en", "zh-CN"],
     "tier": "standard",
     "projectTitle": "Project Name Roadmap",
     "projectAreas": ["App", "Core", "Data", "CI", "Docs", "Deploy"],
     "projectKinds": ["Feature", "Fix", "Docs", "Chore", "Release"],
     "wiki": true,
     "pages": false
   }
   ```

4. **Run the bootstrap** (from the target repo):

   ```bash
   node <path-to>/meow-repo-standard/scripts/bootstrap.mjs --config repo.config.json --all
   ```

   Add `--pages` only if the project can host docs on GitHub Pages.
   Use `--dry-run` first to preview.

5. **Set up branches** (part of `--all`, or run `--branches`):
   - create `dev` identical to `main` if missing
   - protect `main`: PR-only, no force push, no deletion, enforced for admins
   - require CI checks when `requiredChecks` is set (e.g. `["check"]`)
   - do **not** create long-lived feature branches; a temporary branch must be deleted after merge
   - no `PROJECT_TITLE` variable is needed

6. **Project mode**:
   - The Project is a **view over Issues**; Issues are the source of truth.
   - Project items are **Issues only**; never add Pull Requests.
   - Status: `Todo` / `In Progress` / `Done` / `Deferred` / `Canceled`.
   - `Start` = Issue creation date; `End` = Issue close date.
   - `Area` and `Kind` are single-select fields (`projectAreas` / `projectKinds`).
   - Views: `All Issues`, `Board`, `Roadmap`, `Canceled`, `Deferred`; all filtered to `is:issue`.
   - Labels: `deferred`, `canceled`, `area: <slug>`, `chore`, `release`.
   - No `project-date.yml` workflow, no `PROJECT_TOKEN` secret, no automatic date fields.
   - When creating/closing an Issue, add it to the Project and set `Start` / `End` / `Area` / `Kind` from the Issue.

7. **Finish the manual steps** (GitHub has no API for these):
   - Enable Wiki in Settings → Features, create the first page, then re-run `--wiki`.
   - In the **Board** view, group by `Status`.
   - In the **Roadmap** view, choose `Start` and `End` as the date fields.
   - Drag the view tabs into the desired order.

8. **Verify** with `node <path-to>/meow-repo-standard/scripts/repo-check.mjs .`

## Branch rules

- `main` is release/stable and **PR-only**; never commit or push to it directly, including admins.
- `dev` is the only long-lived development branch; all normal work is committed there.
- There are no long-lived `feat/*` / `fix/*` branches. Use a temporary branch only if isolation is really needed, and delete it after merge.
- Release: open a PR `dev → main` when a version is ready.
- README/docs changes also reach `main` through the same `dev → main` PR.
- Closing keywords (`Closes #N`) only link the roadmap card when the PR targets `main` (the default branch).

## Planning workflow

- Propose the plan first. **Do not create Issues or Project items until the user accepts.**
- After acceptance, create real Issues (not drafts) and add them to the Project as `Todo`.
- Project items are Issues only; never add Pull Requests.
- Record each implementation step in the Issue (checklist update or comment).
- Move items to `In Progress` when work starts and `Done` when the Issue is complete.
- Deferred work gets the `deferred` label and `Deferred` status.
- Canceled work gets the `canceled` label and `Canceled` status.
- Never delete an Issue or a Project item, so canceled work is not proposed again.
- Fill `Start` from the Issue creation date and `End` from the Issue close date.

## Rules

- README stays a landing page: title, description, badges, one link row. Detail goes to the Wiki.
- Wiki pages use English filenames; translations are `<Page>.<locale>.md`.
- Roadmap cards must be real Issues; drafts are not Project tasks.
- PRs may use `Closes #N`, but PRs are implementation artifacts and are not Project items.
- Never commit generated data or the local Wiki clone; add them to `.gitignore`.

## Pitfalls

- Repository templates do not copy Wiki or Projects.
- `updateProjectV2View` that only changes the name resets the layout to Table; always pass `layout`.
- Roadmap views do not support visible fields; do not pass `configuration` when creating/updating them.
- Board grouping/sorting and Roadmap start/end field selection are view configuration with no public mutation.
- Draft issues cannot be assigned via `addAssigneesToAssignable`; use `updateProjectV2DraftIssue` or convert to an Issue.
