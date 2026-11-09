<div align="center">

# Meow Repo Standard

**一套可复用的仓库标准：极简 README、Wiki 文档、Projects 路线图、Issue/PR 模板、可选 GitHub Pages。**

[![license](https://img.shields.io/github/license/RoslynMeow/meow-repo-standard?style=flat-square)](LICENSE) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/RoslynMeow/meow-repo-standard/pulls) [![docs](https://img.shields.io/badge/docs-Wiki-1f6feb?style=flat-square)](https://github.com/RoslynMeow/meow-repo-standard/wiki)

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

让每个仓库都遵循同一套结构：

- **极简 README**（只放徽章和链接）
- 详细文档放 **Wiki**
- 用 **Projects 路线图**，并关联真实 Issue 和 PR
- 自带 **Issue / PR 模板** 和 CI
- **GitHub Pages 可选**（有些纯程序项目不需要）

不绑定任何语言或技术栈。模板内容以英文为默认，附带 `zh-CN` 示例；新增语言只需添加 `README.<locale>.md` 和 `Page.<locale>.md`。

## 三档

| 档位 | 包含 |
| --- | --- |
| **Lite** | README + `.github` 模板 + CI |
| **Standard**（默认） | Lite + Wiki 文档 |
| **Full** | Standard + Projects 路线图 + Issue/PR 关联 |

## 快速开始

```bash
# 1. 获取本仓库（clone 或下载）
git clone https://github.com/RoslynMeow/meow-repo-standard.git
cd meow-repo-standard

# 2. 描述目标仓库
copy repo.config.example.json repo.config.json   # 然后编辑

# 3. 在目标仓库里执行
node <path-to>/meow-repo-standard/scripts/bootstrap.mjs --config repo.config.json

# 可选步骤
node scripts/bootstrap.mjs --config repo.config.json --wiki
node scripts/bootstrap.mjs --config repo.config.json --project
node scripts/bootstrap.mjs --config repo.config.json --pages
```

`bootstrap.mjs` 是幂等的：只补缺失项；加 `--dry-run` 只打印不修改。

## 需要手动完成的步骤（GitHub 限制）

1. 在仓库 Settings → Features 启用 **Wiki**，并创建第一个页面（这样才能生成 `<repo>.wiki.git`）
2. 在 **Roadmap** 视图里把 Start date / Target date 都选为 `Date`（视图的日期字段选择没有 API）
3. 拖动视图标签排序（视图顺序没有 API）

## 多语言

- README：`README.md` 是默认语言，`README.zh-CN.md`、`README.ja.md` 等为翻译，顶部互相链接
- Wiki：默认页面是 `<Page>.md`，翻译是 `<Page>.<locale>.md`（如 `Home.zh-CN.md`）
- 在 `repo.config.json` 里设置 `defaultLocale` 和 `locales`

## GitHub Pages（可选）

默认不启用。如果项目适合把文档做成站点，用 `--pages` 才会复制 `optional/github-pages/`（workflow + `docs/index.md`）。纯程序项目可以完全跳过。

## PR 自动填写项目日期

`template/.github/workflows/project-date.yml` 会在 PR 打开/更新时写入项目字段：

- `Date` = 最新提交日期（终止）
- `Start date` = 最早提交日期

`template/.github/workflows/project-assignee.yml` 会把新 PR 指派给**开 PR 的人 + 提交作者**（GitHub 用户，去 bot，只含可指派用户，最多 10 个），已有 assignee 时不覆盖；使用仓库自带 `GITHUB_TOKEN`，不需要 PAT。

Projects v2 无法用默认 `GITHUB_TOKEN` 访问，所以要加一个仓库 secret（classic PAT，`repo` + `project`）：

```bash
gh secret set PROJECT_TOKEN --body "<你的 PAT>"
gh variable set PROJECT_TITLE --body "My Repo Roadmap"   # 可选；bootstrap 会自动设置
```

## 结构

```
template/            # 复制到目标仓库
  README.md
  .github/           # Issue/PR 模板 + CI
wiki-template/       # 初始 Wiki 页面（默认 + 本地化）
optional/github-pages/
scripts/bootstrap.mjs
scripts/repo-check.mjs
skill/SKILL.md       # opencode 技能（安装到 .opencode/skills/）
STANDARD.md          # 完整规范
```

## 许可

MIT —— 可自由使用、修改、分发。
