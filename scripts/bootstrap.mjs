#!/usr/bin/env node
// Meow Repo Standard bootstrap.
// Usage: node scripts/bootstrap.mjs --config repo.config.json [--dir .] [--wiki] [--project] [--pages] [--force] [--dry-run]
import { existsSync, readFileSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_NAMES = {
  en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文', ja: '日本語', ko: '한국어',
  fr: 'Français', de: 'Deutsch', es: 'Español', ru: 'Русский', pt: 'Português',
  it: 'Italiano', nl: 'Nederlands', pl: 'Polski', tr: 'Türkçe',
};

function parseArgs(argv) {
  const out = { config: 'repo.config.json', dir: process.cwd(), wiki: false, noWiki: false, project: false, pages: false, force: false, dryRun: false, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (a === '--dir') out.dir = argv[++i];
    else if (a === '--wiki') out.wiki = true;
    else if (a === '--no-wiki') { out.noWiki = true; out.wiki = false; }
    else if (a === '--project') out.project = true;
    else if (a === '--pages') out.pages = true;
    else if (a === '--all') out.all = true;
    else if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`config not found: ${abs}`);
  const cfg = JSON.parse(readFileSync(abs, 'utf8'));
  const defaultLocale = cfg.defaultLocale || 'en';
  const locales = Array.isArray(cfg.locales) && cfg.locales.length ? cfg.locales : [defaultLocale];
  if (!locales.includes(defaultLocale)) locales.unshift(defaultLocale);
  if (!cfg.owner || !cfg.repo || !cfg.name) throw new Error('config requires owner, repo and name');
  return {
    owner: cfg.owner,
    repo: cfg.repo,
    name: cfg.name,
    description: cfg.description || '',
    defaultLocale,
    locales,
    tier: cfg.tier || 'standard',
    projectTitle: cfg.projectTitle || `${cfg.name} Roadmap`,
    pages: !!cfg.pages,
    wiki: cfg.wiki !== false,
    projectUrl: cfg.projectUrl || '',
    targetDir: cfg.targetDir || '',
  };
}

function localeName(locale) {
  return LOCALE_NAMES[locale] || locale;
}

function makeVars(cfg, projectUrl) {
  const wikiUrl = `https://github.com/${cfg.owner}/${cfg.repo}/wiki`;
  const repoUrl = `https://github.com/${cfg.owner}/${cfg.repo}`;
  const localeNav = cfg.locales
    .map((l) => `[${localeName(l)}](README${l === cfg.defaultLocale ? '' : `.${l}`}.md)`)
    .join(' · ');
  const localeNavList = cfg.locales
    .map((l) => `- [${localeName(l)}](Home${l === cfg.defaultLocale ? '' : `.${l}`})`)
    .join('\n');
  return {
    NAME: cfg.name,
    DESCRIPTION: cfg.description,
    OWNER: cfg.owner,
    REPO: cfg.repo,
    DEFAULT_LOCALE: cfg.defaultLocale,
    WIKI_URL: wikiUrl,
    REPO_URL: repoUrl,
    PROJECT_URL: projectUrl || `https://github.com/users/${cfg.owner}/projects`,
    LOCALE_NAV: localeNav,
    LOCALE_NAV_LIST: localeNavList,
  };
}

function render(text, vars) {
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, key) => (key in vars ? vars[key] : m));
}

function log(msg) { console.log(`[standard] ${msg}`); }

function ensureDir(dir, dryRun) {
  if (dryRun) return;
  mkdirSync(dir, { recursive: true });
}

function copyMissing(src, dest, vars, dryRun, force) {
  if (!existsSync(src)) return false;
  if (existsSync(dest) && !force) {
    log(`skip (exists): ${dest}`);
    return false;
  }
  log(`write: ${dest}`);
  if (!dryRun) {
    ensureDir(dirname(dest), false);
    const raw = readFileSync(src, 'utf8');
    writeFileSync(dest, render(raw, vars));
  }
  return true;
}

function copyTreeMissing(srcDir, destDir, vars, dryRun, force) {
  if (!existsSync(srcDir)) return;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) copyTreeMissing(src, dest, vars, dryRun, force);
    else copyMissing(src, dest, vars, dryRun, force);
  }
}

function localizeName(file, locale, defaultLocale) {
  // Home.zh-CN.md -> { base: 'Home', locale: 'zh-CN' }; Home.md -> { base: 'Home', locale: default }
  const m = file.match(/^(.*)\.([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)\.md$/);
  if (m && m[2] !== defaultLocale) return { base: m[1], locale: m[2], localized: true };
  if (file.endsWith('.md')) return { base: file.slice(0, -3), locale: defaultLocale, localized: false };
  return null;
}

function bootstrapTemplates(cfg, targetDir, vars, opts) {
  log(`templates -> ${targetDir}`);
  copyMissing(join(ROOT, 'template', 'README.md'), join(targetDir, 'README.md'), vars, opts.dryRun, opts.force);
  for (const locale of cfg.locales) {
    if (locale === cfg.defaultLocale) continue;
    const src = join(ROOT, 'template', `README.${locale}.md`);
    copyMissing(src, join(targetDir, `README.${locale}.md`), vars, opts.dryRun, opts.force);
  }
  copyTreeMissing(join(ROOT, 'template', '.github'), join(targetDir, '.github'), vars, opts.dryRun, opts.force);
}

function bootstrapPages(cfg, targetDir, vars, opts) {
  log('github pages (optional)');
  copyMissing(join(ROOT, 'optional', 'github-pages', '.github', 'workflows', 'pages.yml'), join(targetDir, '.github', 'workflows', 'pages.yml'), vars, opts.dryRun, opts.force);
  copyMissing(join(ROOT, 'optional', 'github-pages', 'docs', 'index.md'), join(targetDir, 'docs', 'index.md'), vars, opts.dryRun, opts.force);
}

function git(args, cwd, inherit = false) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
}

function bootstrapWiki(cfg, vars, opts) {
  const wikiUrl = `https://github.com/${cfg.owner}/${cfg.repo}.wiki.git`;
  log(`wiki -> ${wikiUrl}`);
  if (opts.dryRun) {
    log('would initialize Wiki pages (requires wiki enabled + first page)');
    return true;
  }
  try {
    execFileSync('gh', ['repo', 'edit', `${cfg.owner}/${cfg.repo}`, '--enable-wiki'], { stdio: 'ignore' });
    log('wiki feature enabled (if it was not already)');
  } catch {
    /* gh not installed or no permission; the wiki may already be enabled */
  }
  try {
    git(['ls-remote', wikiUrl], ROOT);
  } catch {
    log('WIKI SKIPPED: wiki repo not found.');
    log('  1) Settings -> Features -> enable Wikis');
    log('  2) create the first Wiki page');
    log('  3) re-run with --wiki');
    return false;
  }
  const tmp = join(os.tmpdir(), `meow-wiki-${cfg.owner}-${cfg.repo}-${Date.now()}`);
  rmSync(tmp, { recursive: true, force: true });
  git(['clone', '--depth', '1', wikiUrl, tmp], ROOT);
  let changed = false;
  const wikiSrc = join(ROOT, 'wiki-template');
  for (const entry of readdirSync(wikiSrc, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const info = localizeName(entry.name, cfg.defaultLocale, cfg.defaultLocale);
    if (!info) continue;
    if (info.localized && info.locale !== cfg.defaultLocale) {
      if (!cfg.locales.includes(info.locale)) continue;
      const dest = join(tmp, entry.name);
      changed = copyMissing(join(wikiSrc, entry.name), dest, vars, false, opts.force) || changed;
    } else {
      const dest = join(tmp, `${info.base}.md`);
      changed = copyMissing(join(wikiSrc, entry.name), dest, vars, false, opts.force) || changed;
    }
  }
  if (!changed) {
    log('wiki: nothing to update');
    rmSync(tmp, { recursive: true, force: true });
    return true;
  }
  git(['add', '-A'], tmp);
  git(['-c', `user.name=${cfg.owner}`, '-c', `user.email=${cfg.owner}@users.noreply.github.com`, 'commit', '-m', 'docs(wiki): initialize from meow-repo-standard'], tmp);
  try {
    git(['push'], tmp, true);
    log('wiki pushed');
  } catch {
    log('wiki push failed (auth?). Clone/push manually if needed.');
  }
  rmSync(tmp, { recursive: true, force: true });
  return true;
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

async function gql(token, query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': 'meow-repo-standard',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

async function bootstrapProject(cfg, opts) {
  const token = getToken();
  if (!token) {
    log('PROJECT SKIPPED: no GITHUB_TOKEN / GH_TOKEN and gh is not logged in.');
    return '';
  }
  log(`project -> ${cfg.projectTitle}`);
  if (opts.dryRun) return '';
  const viewer = await gql(token, 'query{viewer{id login}}');
  const viewerId = viewer.viewer.id;
  const repo = await gql(token, 'query($owner:String!,$repo:String!){repository(owner:$owner,name:$repo){id}}', { owner: cfg.owner, repo: cfg.repo });
  const repoId = repo.repository.id;

  const list = await gql(token, 'query{viewer{projectsV2(first:100){nodes{id number title url}}}}');
  let project = list.viewer.projectsV2.nodes.find((p) => p.title === cfg.projectTitle);
  if (!project) {
    const created = await gql(
      token,
      'mutation($owner:ID!,$title:String!,$repo:ID!){createProjectV2(input:{ownerId:$owner,title:$title,repositoryId:$repo}){projectV2{id number url title}}}',
      { owner: viewerId, title: cfg.projectTitle, repo: repoId },
    );
    project = created.createProjectV2.projectV2;
    log(`created project #${project.number}`);
  } else {
    log(`project exists: #${project.number}`);
  }

  const fields = await gql(token, 'query($id:ID!){node(id:$id){... on ProjectV2{fields(first:50){nodes{... on ProjectV2FieldCommon{name dataType}}}}}}', { id: project.id });
  const hasDate = fields.node.fields.nodes.some((f) => f.name === 'Date');
  if (!hasDate) {
    await gql(token, 'mutation($p:ID!){createProjectV2Field(input:{projectId:$p,dataType:DATE,name:"Date"}){projectV2Field{... on ProjectV2Field{id name}}}}', { p: project.id });
    log('created Date field');
  }

  const views = await gql(token, 'query($id:ID!){node(id:$id){... on ProjectV2{views(first:20){nodes{name layout}}}}}', { id: project.id });
  const existing = new Set(views.node.views.nodes.map((v) => v.name));
  const wanted = [
    ['List', 'TABLE_LAYOUT'],
    ['Roadmap', 'ROADMAP_LAYOUT'],
    ['Board', 'BOARD_LAYOUT'],
  ];
  for (const [name, layout] of wanted) {
    if (existing.has(name)) continue;
    await gql(token, 'mutation($p:ID!,$n:String!,$l:ProjectV2ViewLayout!){createProjectV2View(input:{projectId:$p,name:$n,layout:$l}){projectV2View{id name layout}}}', { p: project.id, n: name, l: layout });
    log(`created view: ${name}`);
  }

  await gql(token, 'mutation($p:ID!){updateProjectV2(input:{projectId:$p,public:true}){projectV2{id public url}}}', { p: project.id });
  log(`project url: ${project.url}`);
  log('manual: in the Roadmap view choose Date for Start date and Target date; drag tabs to reorder.');
  return project.url;
}

function printHelp() {
  console.log(`Meow Repo Standard bootstrap

  node scripts/bootstrap.mjs --config repo.config.json [options]

Options:
  --config <path>   config file (default: repo.config.json)
  --dir <path>      target repo directory (default: cwd)
  --wiki            initialize/push Wiki pages
  --project         create the Projects roadmap (needs gh auth or GITHUB_TOKEN)
  --pages           copy the optional GitHub Pages scaffold
  --all             --wiki + --project
  --force           overwrite existing files
  --dry-run         print actions only`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return printHelp();
  const cfg = loadConfig(opts.config);
  const targetDir = resolve(opts.dir || cfg.targetDir || process.cwd());
  if (opts.all) { opts.wiki = true; opts.project = true; }
  if (!opts.wiki && !opts.noWiki && cfg.tier !== 'lite' && cfg.wiki) opts.wiki = true;
  if (!opts.project && cfg.tier === 'full') opts.project = true;
  if (!opts.pages && cfg.pages) opts.pages = true;

  log(`target: ${targetDir}`);
  let projectUrl = cfg.projectUrl;
  if (opts.project) projectUrl = (await bootstrapProject(cfg, opts)) || projectUrl;
  const vars = makeVars(cfg, projectUrl);

  bootstrapTemplates(cfg, targetDir, vars, opts);
  if (opts.pages) bootstrapPages(cfg, targetDir, vars, opts);
  if (opts.wiki) bootstrapWiki(cfg, vars, opts);
  log('done');
}

main().catch((e) => { console.error(`[standard] ERROR: ${e.message}`); process.exit(1); });
