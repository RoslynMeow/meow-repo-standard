<div align="center">

# Meow Repo Standard

**A reusable repository layout: minimal README, Wiki docs, Projects roadmap, Issue/PR templates, optional GitHub Pages.**

[![license](https://img.shields.io/github/license/RoslynMeow/meow-repo-standard?style=flat-square)](LICENSE) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/RoslynMeow/meow-repo-standard/pulls) [![docs](https://img.shields.io/badge/docs-Wiki-1f6feb?style=flat-square)](https://github.com/RoslynMeow/meow-repo-standard/wiki)

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

A generic, language-agnostic starting point so every repository can follow the same structure:

- a **minimal README** (badges + links only)
- **detailed docs in the Wiki**
- a **Projects roadmap** wired to real Issues and PRs
- **Issue / PR templates** and a CI workflow
- **optional GitHub Pages** (opt-in, because not every project fits Pages)

It is not tied to one language or stack. Content templates ship in English with a `zh-CN` example; add any other locale by dropping `README.<locale>.md` and `Page.<locale>.md` files.

## Tiers

| Tier | Includes |
| --- | --- |
| **Lite** | README + `.github` templates + CI |
| **Standard** (default) | Lite + Wiki docs |
| **Full** | Standard + Projects roadmap + Issue/PR linkage |

## Quick start

```bash
# 1. copy this repo's scripts/template/wiki-template somewhere, or clone it
git clone https://github.com/RoslynMeow/meow-repo-standard.git
cd meow-repo-standard

# 2. describe the target repo
copy repo.config.example.json repo.config.json   # edit it

# 3. from inside the target repo, apply the standard
node <path-to>/meow-repo-standard/scripts/bootstrap.mjs --config repo.config.json

# optional steps
node scripts/bootstrap.mjs --config repo.config.json --wiki
node scripts/bootstrap.mjs --config repo.config.json --project
node scripts/bootstrap.mjs --config repo.config.json --pages
```

`bootstrap.mjs` is idempotent: it only creates what is missing. `--dry-run` prints actions without touching anything.

## Manual steps (GitHub limitations)

A few things cannot be automated, and the script will remind you:

1. Enable **Wiki** in repository Settings → Features, and create the first page (this creates `<repo>.wiki.git`).
2. In the **Roadmap** view, choose the `Date` field for **Start date** and **Target date** (the view's date-field selection has no API).
3. Drag view tabs into the order you want (view ordering has no API).

## Internationalization

- README: `README.md` is the default locale; `README.zh-CN.md`, `README.ja.md`, … are optional translations linked at the top.
- Wiki: default pages are `<Page>.md`; translations are `<Page>.<locale>.md` (for example `Home.zh-CN.md`).
- Set `defaultLocale` and `locales` in `repo.config.json`.

## GitHub Pages (optional)

Pages is **not** enabled by default. If your project can host docs as a site, run with `--pages`; it copies `optional/github-pages/` (workflow + `docs/index.md`). Projects that ship only a program can skip it entirely.

## Project dates on pull requests

`template/.github/workflows/project-date.yml` fills a PR's Project fields on open/update:

- `Date` = latest commit date (end)
- `Start date` = earliest commit date

Projects v2 cannot be reached with the default `GITHUB_TOKEN`, so add a repository secret (classic PAT with `repo` + `project`):

```bash
gh secret set PROJECT_TOKEN --body "<your PAT>"
gh variable set PROJECT_TITLE --body "My Repo Roadmap"   # optional; bootstrap sets it
```

## Structure

```
template/            # copied into the target repo
  README.md
  .github/           # Issue/PR templates + CI
wiki-template/       # initial Wiki pages (default + localized)
optional/github-pages/
scripts/bootstrap.mjs
scripts/repo-check.mjs
skill/SKILL.md       # opencode skill (install into .opencode/skills/)
STANDARD.md          # the full specification
```

## License

MIT — free to use, modify and share.
