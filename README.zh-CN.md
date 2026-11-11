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
- 用 **Projects 路线图**，并关联真实 Issue
- 自带 **Issue / PR 模板** 和 CI
- **GitHub Pages 可选**（有些纯程序项目不需要）

不绑定任何语言或技术栈。模板内容以英文为默认，附带 `zh-CN` 示例；新增语言只需添加 `README.<locale>.md` 和 `Page.<locale>.md`。

## 三档

| 档位 | 包含 |
| --- | --- |
| **Lite** | README + `.github` 模板 + CI |
| **Standard**（默认） | Lite + Wiki 文档 |
| **Full** | Standard + Projects 路线图 + Issue 关联 |

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

## 分支

只保留两个长期分支：

- **`dev`**：集成分支，所有日常开发都提交到这里。
- **`main`**：稳定 / 发布分支，**只接受 PR**，不能直接 push。发布时用 `dev → main` PR。

不再使用长期 `feat/*` / `fix/*` 分支。确实需要隔离时可以临时建一个，合并后立即删除。

## 需要手动完成的步骤（GitHub 限制）

1. 在仓库 Settings → Features 启用 **Wiki**，并创建第一个页面（这样才能生成 `<repo>.wiki.git`）
2. 在 **Board** 视图里按 `Status` 分组
3. 在 **Roadmap** 视图里把日期字段选为 `Start` 和 `End`
4. 拖动视图标签排序（视图顺序没有 API）

## 多语言

- README：`README.md` 是默认语言，`README.zh-CN.md`、`README.ja.md` 等为翻译，顶部互相链接
- Wiki：默认页面是 `<Page>.md`，翻译是 `<Page>.<locale>.md`（如 `Home.zh-CN.md`）
- 在 `repo.config.json` 里设置 `defaultLocale` 和 `locales`

## GitHub Pages（可选）

默认不启用。如果项目适合把文档做成站点，用 `--pages` 才会复制 `optional/github-pages/`（workflow + `docs/index.md`）。纯程序项目可以完全跳过。

## Project 模式

Project 只是 **Issue 的视图**，Issue 才是记录源。

- Project 只包含 Issue；Pull Request 是实现记录，不会加入。
- 状态：`Todo` / `In Progress` / `Done` / `Deferred` / `Canceled`。
- 字段：`Start`（Issue 创建日期）、`End`（Issue 关闭日期）、`Area`、`Kind`。
- 视图：`All Issues`、`Board`、`Roadmap`、`Canceled`、`Deferred`，全部过滤 `is:issue`。
- 标签：`deferred`、`canceled`、`area: <slug>`、`chore`、`release`。
- 不再需要 `project-date.yml` 工作流，也不需要 `PROJECT_TOKEN` secret。
- 创建或关闭 Issue 时，把它加入 Project，并按 Issue 日期填写 `Start` / `End` / `Area` / `Kind`。

`Area` / `Kind` 选项可在 `repo.config.json` 配置：

```json
{
  "projectAreas": ["App", "Core", "Data", "CI", "Docs", "Deploy"],
  "projectKinds": ["Feature", "Fix", "Docs", "Chore", "Release"]
}
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
