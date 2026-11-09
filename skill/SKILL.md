---
name: repo-standard
description: Use when creating or normalizing a GitHub repository to the Meow Repo Standard (minimal README with badges and links, Wiki docs, Projects roadmap, Issue/PR templates, optional GitHub Pages). Trigger on requests like "初始化仓库标准", "apply repo standard", "simplify README + move docs to wiki + set up roadmap", or when starting a new repo.
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
   - set the `PROJECT_TITLE` repository variable so project-date can find the project

6. **Project dates**: the template includes `.github/workflows/project-date.yml`, which writes `Date` (latest commit) and `Start date` (earliest commit) when a PR opens. It needs a `PROJECT_TOKEN` repository secret (classic PAT with `repo` + `project`); the default `GITHUB_TOKEN` cannot access Projects v2. Ask the user to add it.

7. **Assignees**: `.github/workflows/project-assignee.yml` assigns a new PR to its opener plus its commit authors (GitHub users, bots excluded, assignable users only, max 10) unless it already has one. It uses the repository `GITHUB_TOKEN` (no PAT); a manual Project change is not overwritten.

7. **Finish the manual steps** (GitHub has no API for these):
   - Enable Wiki in Settings → Features, create the first page, then re-run `--wiki`.
   - In the Roadmap view, select `Date` for Start date and Target date.
   - Drag the view tabs into the desired order.

8. **Verify** with `node <path-to>/meow-repo-standard/scripts/repo-check.mjs .`

## Branch rules

- `main` is release/stable and **PR-only**; never commit or push to it directly, including admins.
- `dev` is the integration branch; all normal development is committed there.
- Release: open a PR `dev → main` when a version is ready.
- `feat/*` branches may also target `main` directly via PR.
- README/docs changes to `main` also go through a PR (a small docs PR is fine).
- Closing keywords (`Closes #N`) only link the roadmap card when the PR targets `main` (the default branch).

## Planning workflow

- Propose the plan first. **Do not create Issues or Project items until the user accepts.**
- After acceptance, create real Issues (not drafts) and add them to the Project as `Todo`.
- Record each implementation step in the Issue (checklist update or comment) and the linked PR (`Closes #N`).
- Move items to `In Progress` when work starts and `Done` when merged.
- If a plan is cancelled, move its item to `Cancelled`; never delete it, so it is not proposed again.
- The Project `Status` field must include `Todo`, `In Progress`, `Done` and `Cancelled`.

## Rules

- README stays a landing page: title, description, badges, one link row. Detail goes to the Wiki.
- Wiki pages use English filenames; translations are `<Page>.<locale>.md`.
- Roadmap cards must be real Issues (drafts cannot link PRs).
- Link PRs with `Closes #N`; the PR must target the default branch for the link to resolve.
- Never commit generated data or the local Wiki clone; add them to `.gitignore`.

## Pitfalls

- Repository templates do not copy Wiki or Projects.
- `updateProjectV2View` that only changes the name resets the layout to Table; always pass `layout`.
- Draft issues cannot be assigned via `addAssigneesToAssignable`; use `updateProjectV2DraftIssue` or convert to an Issue.
