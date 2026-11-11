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
  const out = { config: 'repo.config.json', dir: process.cwd(), wiki: false, noWiki: false, project: false, branches: false, pages: false, force: false, dryRun: false, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (a === '--dir') out.dir = argv[++i];
    else if (a === '--wiki') out.wiki = true;
    else if (a === '--no-wiki') { out.noWiki = true; out.wiki = false; }
    else if (a === '--project') out.project = true;
    else if (a === '--branches') out.branches = true;
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
    projectAreas: Array.isArray(cfg.projectAreas) && cfg.projectAreas.length
      ? cfg.projectAreas
      : ['App', 'Core', 'Data', 'CI', 'Docs', 'Deploy'],
    projectKinds: Array.isArray(cfg.projectKinds) && cfg.projectKinds.length
      ? cfg.projectKinds
      : ['Feature', 'Fix', 'Docs', 'Chore', 'Release'],
    pages: !!cfg.pages,
    wiki: cfg.wiki !== false,
    projectUrl: cfg.projectUrl || '',
    requiredChecks: Array.isArray(cfg.requiredChecks) ? cfg.requiredChecks : [],
    strictChecks: !!cfg.strictChecks,
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
    execFileSync(ghBin(), ['repo', 'edit', `${cfg.owner}/${cfg.repo}`, '--enable-wiki'], { stdio: 'ignore' });
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

function ghBin() {
  if (process.env.GH_BIN) return process.env.GH_BIN;
  if (process.platform === 'win32') return 'C:\\Program Files\\GitHub CLI\\gh.exe';
  return 'gh';
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  for (const bin of [process.env.GH_BIN, 'gh', 'C:\\Program Files\\GitHub CLI\\gh.exe'].filter(Boolean)) {
    try {
      const t = execFileSync(bin, ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (t) return t;
    } catch {
      /* try the next candidate */
    }
  }
  return '';
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

const PROJECT_STATUSES = [
  { name: 'Todo', color: 'GRAY', description: 'Not started' },
  { name: 'In Progress', color: 'BLUE', description: 'In progress' },
  { name: 'Done', color: 'GREEN', description: 'Completed' },
  { name: 'Deferred', color: 'YELLOW', description: 'Deferred; may be resumed later' },
  { name: 'Canceled', color: 'GRAY', description: 'Canceled; will not be implemented' },
];
const AREA_FIELD_COLORS = ['BLUE', 'PURPLE', 'PINK', 'GREEN', 'ORANGE', 'RED', 'YELLOW', 'GRAY'];
const KIND_FIELD_COLORS = { Feature: 'BLUE', Fix: 'RED', Docs: 'YELLOW', Chore: 'GRAY', Release: 'GREEN' };
const AREA_LABEL_COLORS = ['1d76db', '5319e7', 'e99695', '006b75', 'bfd4f2', '0075ca', 'c2e0c6', 'd4c5f9', 'fbca04'];

function labelSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function ensureLabel(token, owner, repo, name, color, description) {
  const base = `/repos/${owner}/${repo}/labels`;
  try {
    await rest(token, 'POST', base, { name, color, description });
    log(`created label: ${name}`);
  } catch {
    try {
      await rest(token, 'PATCH', `${base}/${encodeURIComponent(name)}`, { new_name: name, color, description });
      log(`updated label: ${name}`);
    } catch {
      log(`label skipped: ${name}`);
    }
  }
}

async function projectFields(token, projectId) {
  const data = await gql(
    token,
    'query($id:ID!){node(id:$id){... on ProjectV2{fields(first:50){nodes{... on ProjectV2FieldCommon{id name dataType} ... on ProjectV2SingleSelectField{options{id name color description}}}}}}}',
    { id: projectId },
  );
  return data.node.fields.nodes;
}

async function ensureDateField(token, projectId, name, fields) {
  if (fields.some((field) => field.name === name)) return;
  await gql(
    token,
    'mutation($p:ID!,$n:String!){createProjectV2Field(input:{projectId:$p,dataType:DATE,name:$n}){projectV2Field{... on ProjectV2Field{id name}}}}',
    { p: projectId, n: name },
  );
  log(`created ${name} field`);
}

async function ensureSingleSelectField(token, projectId, name, optionNames, colors, fields) {
  const field = fields.find((entry) => entry.name === name);
  const existing = field?.options || [];
  const wanted = optionNames.map((optionName, index) => {
    const old = existing.find((option) => option.name === optionName);
    return {
      ...(old ? { id: old.id } : {}),
      name: optionName,
      color: old?.color || colors[index % colors.length],
      description: old?.description || '',
    };
  });
  for (const old of existing) {
    if (wanted.some((option) => option.name === old.name)) continue;
    wanted.push({ id: old.id, name: old.name, color: old.color, description: old.description || '' });
  }

  if (!field) {
    await gql(
      token,
      'mutation($p:ID!,$n:String!,$opts:[ProjectV2SingleSelectFieldOptionInput!]!){createProjectV2Field(input:{projectId:$p,dataType:SINGLE_SELECT,name:$n,singleSelectOptions:$opts}){projectV2Field{... on ProjectV2SingleSelectField{id name}}}}',
      { p: projectId, n: name, opts: wanted },
    );
    log(`created ${name} field`);
    return;
  }

  const same = JSON.stringify(existing.map((o) => [o.id, o.name, o.color, o.description])) ===
    JSON.stringify(wanted.map((o) => [o.id, o.name, o.color, o.description]));
  if (same) return;
  await gql(
    token,
    'mutation($f:ID!,$opts:[ProjectV2SingleSelectFieldOptionInput!]!){updateProjectV2Field(input:{fieldId:$f,singleSelectOptions:$opts}){projectV2Field{... on ProjectV2SingleSelectField{id}}}}',
    { f: field.id, opts: wanted },
  );
  log(`updated ${name} options`);
}

async function ensureStatusField(token, projectId, fields) {
  const field = fields.find((entry) => entry.name === 'Status');
  const existing = field?.options || [];
  const cancelAlias = existing.find((option) => option.name === 'Canceled') ||
    existing.find((option) => option.name === 'Cancelled');
  const wanted = PROJECT_STATUSES.map((status) => {
    const old = existing.find((option) => option.name === status.name) ||
      (status.name === 'Canceled' ? cancelAlias : undefined);
    return { ...(old ? { id: old.id } : {}), ...status };
  });
  for (const old of existing) {
    if (wanted.some((option) => option.name === old.name || option.id === old.id)) continue;
    if (old.name === 'Cancelled') continue;
    wanted.push({ id: old.id, name: old.name, color: old.color, description: old.description || '' });
  }

  if (!field) {
    await gql(
      token,
      'mutation($p:ID!,$opts:[ProjectV2SingleSelectFieldOptionInput!]!){createProjectV2Field(input:{projectId:$p,dataType:SINGLE_SELECT,name:"Status",singleSelectOptions:$opts}){projectV2Field{... on ProjectV2SingleSelectField{id name}}}}',
      { p: projectId, opts: wanted },
    );
    log('created Status field');
    return;
  }

  const same = JSON.stringify(existing.map((o) => [o.id, o.name, o.color, o.description])) ===
    JSON.stringify(wanted.map((o) => [o.id, o.name, o.color, o.description]));
  if (same) return;
  await gql(
    token,
    'mutation($f:ID!,$opts:[ProjectV2SingleSelectFieldOptionInput!]!){updateProjectV2Field(input:{fieldId:$f,singleSelectOptions:$opts}){projectV2Field{... on ProjectV2SingleSelectField{id}}}}',
    { f: field.id, opts: wanted },
  );
  log('updated Status options');
}

async function ensureViews(token, projectId, fields) {
  const data = await gql(
    token,
    'query($id:ID!){node(id:$id){... on ProjectV2{views(first:30){nodes{id name layout filter}}}}}',
    { id: projectId },
  );
  const existing = data.node.views.nodes;
  const visibleFieldIds = ['Title', 'Status', 'Start', 'End', 'Area', 'Kind', 'Labels', 'Assignees']
    .map((name) => fields.find((field) => field.name === name)?.id)
    .filter(Boolean);

  const specs = [
    { name: 'All Issues', layout: 'TABLE_LAYOUT', filter: 'is:issue', visible: true },
    { name: 'Board', layout: 'BOARD_LAYOUT', filter: 'is:issue', visible: true },
    { name: 'Roadmap', layout: 'ROADMAP_LAYOUT', filter: 'is:issue', visible: false },
    { name: 'Canceled', layout: 'TABLE_LAYOUT', filter: 'is:issue status:Canceled', visible: true },
    { name: 'Deferred', layout: 'TABLE_LAYOUT', filter: 'is:issue status:Deferred', visible: true },
  ];

  const reusableAll = existing.find((view) => view.name === 'All Issues') ||
    existing.find((view) => view.name === 'List') ||
    existing.find((view) => view.name === 'View 1');

  for (const spec of specs) {
    let view = existing.find((entry) => entry.name === spec.name) ||
      (spec.name === 'All Issues' ? reusableAll : undefined);
    if (!view) {
      const created = await gql(
        token,
        'mutation($p:ID!,$n:String!,$l:ProjectV2ViewLayout!){createProjectV2View(input:{projectId:$p,name:$n,layout:$l}){projectV2View{id name layout}}}',
        { p: projectId, n: spec.name, l: spec.layout },
      );
      view = created.createProjectV2View.projectV2View;
      log(`created view: ${spec.name}`);
    }

    const variables = { v: view.id, n: spec.name, l: spec.layout, f: spec.filter };
    if (spec.visible) {
      variables.fields = visibleFieldIds;
      await gql(
        token,
        'mutation($v:ID!,$n:String!,$l:ProjectV2ViewLayout!,$f:String!,$fields:[ID!]!){updateProjectV2View(input:{viewId:$v,name:$n,layout:$l,filter:$f,configuration:{visibleFieldIds:$fields}}){projectV2View{id name layout filter}}}',
        variables,
      );
    } else {
      await gql(
        token,
        'mutation($v:ID!,$n:String!,$l:ProjectV2ViewLayout!,$f:String!){updateProjectV2View(input:{viewId:$v,name:$n,layout:$l,filter:$f}){projectV2View{id name layout filter}}}',
        variables,
      );
    }
    log(`view ${spec.name}: ${spec.filter}`);
  }
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
  let project = list.viewer.projectsV2.nodes.find((entry) => entry.title === cfg.projectTitle);
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
    try {
      await gql(
        token,
        'mutation($p:ID!,$r:ID!){linkProjectV2ToRepository(input:{projectId:$p,repositoryId:$r}){repository{id}}}',
        { p: project.id, r: repoId },
      );
    } catch {
      /* already linked */
    }
  }

  let fields = await projectFields(token, project.id);
  await ensureDateField(token, project.id, 'Start', fields);
  await ensureDateField(token, project.id, 'End', fields);
  await ensureSingleSelectField(
    token,
    project.id,
    'Area',
    cfg.projectAreas,
    AREA_FIELD_COLORS,
    fields,
  );
  await ensureSingleSelectField(
    token,
    project.id,
    'Kind',
    cfg.projectKinds,
    cfg.projectKinds.map((kind) => KIND_FIELD_COLORS[kind] || 'GRAY'),
    fields,
  );

  fields = await projectFields(token, project.id);
  await ensureStatusField(token, project.id, fields);

  fields = await projectFields(token, project.id);
  await ensureViews(token, project.id, fields);

  await ensureLabel(token, cfg.owner, cfg.repo, 'deferred', 'fbca04', 'Deferred; may be resumed later');
  await ensureLabel(token, cfg.owner, cfg.repo, 'canceled', '6e7781', 'Canceled; will not be implemented');
  await ensureLabel(token, cfg.owner, cfg.repo, 'chore', 'fef2c0', 'Maintenance / cleanup / engineering task');
  await ensureLabel(token, cfg.owner, cfg.repo, 'release', 'b60205', 'Release related');
  for (let i = 0; i < cfg.projectAreas.length; i++) {
    const area = cfg.projectAreas[i];
    await ensureLabel(
      token,
      cfg.owner,
      cfg.repo,
      `area: ${labelSlug(area)}`,
      AREA_LABEL_COLORS[i % AREA_LABEL_COLORS.length],
      `Area: ${area}`,
    );
  }

  await gql(token, 'mutation($p:ID!){updateProjectV2(input:{projectId:$p,public:true}){projectV2{id public url}}}', { p: project.id });
  log(`project url: ${project.url}`);
  log('manual: Board → group by Status; Roadmap → choose Start and End as date fields; drag view tabs to reorder.');
  return project.url;
}

async function rest(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'meow-repo-standard',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) return { notFound: true };
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? {} : res.json();
}

async function bootstrapBranches(cfg, opts) {
  const token = getToken();
  if (!token) {
    log('BRANCHES SKIPPED: no GITHUB_TOKEN / GH_TOKEN and gh is not logged in.');
    return;
  }
  log('branches -> main + dev (identical), protect main (PR-only)');
  if (opts.dryRun) return;
  const base = `/repos/${cfg.owner}/${cfg.repo}`;
  const repo = await rest(token, 'GET', base);
  const mainBranch = repo.default_branch || 'main';
  const mainRef = await rest(token, 'GET', `${base}/branches/${mainBranch}`);
  if (mainRef.notFound) {
    log(`BRANCHES SKIPPED: ${mainBranch} has no commits yet. Push an initial commit first.`);
    return;
  }
  const sha = mainRef.commit.sha;
  const dev = await rest(token, 'GET', `${base}/branches/dev`);
  if (dev.notFound) {
    await rest(token, 'POST', `${base}/git/refs`, { ref: 'refs/heads/dev', sha });
    log('created dev at main');
  } else {
    log('dev already exists');
  }
  await rest(token, 'PUT', `${base}/branches/${mainBranch}/protection`, {
    required_status_checks: cfg.requiredChecks.length ? { strict: cfg.strictChecks, contexts: cfg.requiredChecks } : null,
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 0,
      dismiss_stale_reviews: false,
      require_code_owner_reviews: false,
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_conversation_resolution: true,
  });
  log(`protected ${mainBranch}: PR-only, no force push, no deletion (admins enforced)`);
}

function printHelp() {
  console.log(`Meow Repo Standard bootstrap

  node scripts/bootstrap.mjs --config repo.config.json [options]

Options:
  --config <path>   config file (default: repo.config.json)
  --dir <path>      target repo directory (default: cwd)
  --wiki            initialize/push Wiki pages
  --project         create the issue-based Projects roadmap (fields, views, labels)
  --branches        create dev and protect main (PR-only)
  --pages           copy the optional GitHub Pages scaffold
  --all             --wiki + --project + --branches
  --force           overwrite existing files
  --dry-run         print actions only`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return printHelp();
  const cfg = loadConfig(opts.config);
  const targetDir = resolve(opts.dir || cfg.targetDir || process.cwd());
  if (opts.all) { opts.wiki = true; opts.project = true; opts.branches = true; }
  if (!opts.wiki && !opts.noWiki && cfg.tier !== 'lite' && cfg.wiki) opts.wiki = true;
  if (!opts.project && cfg.tier === 'full') opts.project = true;
  if (!opts.pages && cfg.pages) opts.pages = true;

  log(`target: ${targetDir}`);
  let projectUrl = cfg.projectUrl;
  if (opts.project) projectUrl = (await bootstrapProject(cfg, opts)) || projectUrl;
  if (opts.branches) await bootstrapBranches(cfg, opts);
  const vars = makeVars(cfg, projectUrl);

  bootstrapTemplates(cfg, targetDir, vars, opts);
  if (opts.pages) bootstrapPages(cfg, targetDir, vars, opts);
  if (opts.wiki) bootstrapWiki(cfg, vars, opts);
  log('done');
}

main().catch((e) => { console.error(`[standard] ERROR: ${e.message}`); process.exit(1); });
