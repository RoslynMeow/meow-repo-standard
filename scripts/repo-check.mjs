#!/usr/bin/env node
// Verify a repository follows the Meow Repo Standard.
// Usage: node scripts/repo-check.mjs [target-dir]
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || process.cwd());
const readme = join(dir, 'README.md');

const checks = [
  ['README.md exists', () => existsSync(readme)],
  ['README links to Wiki', () => existsSync(readme) && /\/wiki/.test(readFileSync(readme, 'utf8'))],
  ['README has a badge', () => existsSync(readme) && /img\.shields\.io|badge\.svg/.test(readFileSync(readme, 'utf8'))],
  ['.github/PULL_REQUEST_TEMPLATE.md', () => existsSync(join(dir, '.github', 'PULL_REQUEST_TEMPLATE.md'))],
  ['.github/ISSUE_TEMPLATE', () => existsSync(join(dir, '.github', 'ISSUE_TEMPLATE'))],
  ['.github/workflows/ci.yml', () => existsSync(join(dir, '.github', 'workflows', 'ci.yml'))],
];

let failed = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try { ok = fn(); } catch { ok = false; }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} check(s) failed in ${dir}`);
  process.exit(1);
}
console.log(`\nAll checks passed in ${dir}`);
