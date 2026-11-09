---
name: repo-standard
description: Use when creating or normalizing a GitHub repository to the Meow Repo Standard (minimal README with badges and links, Wiki docs, Projects roadmap, Issue/PR templates, optional GitHub Pages). Trigger on requests like "初始化仓库标准", "apply repo standard", "simplify README + move docs to wiki + set up roadmap", or when starting a new repo.
---

# Meow Repo Standard

Apply this standard to the current repository. The source of truth is
`https://github.com/RoslynMeow/meow-repo-standard` (`STANDARD.md`).

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

5. **Finish the manual steps** (GitHub has no API for these):
   - Enable Wiki in Settings → Features, create the first page, then re-run `--wiki`.
   - In the Roadmap view, select `Date` for Start date and Target date.
   - Drag the view tabs into the desired order.

6. **Verify** with `node <path-to>/meow-repo-standard/scripts/repo-check.mjs .`

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
