# GitHub Pages (optional)

This folder is **not copied by default**. Enable it only if the project should publish docs as a website.

```bash
node scripts/bootstrap.mjs --config repo.config.json --pages
```

It copies:

- `.github/workflows/pages.yml`
- `docs/index.md`

Then enable Pages in repository Settings → Pages → Source: **GitHub Actions**.

Projects that only ship a program (no hosted docs) can ignore this folder entirely.
