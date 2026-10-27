import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInstallPlan, installSkills, checkInstalled } from './manage.mjs';

async function fixture(fn) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc skill repo '));
  try {
    await fs.mkdir(path.join(root, 'skills/demo/references'), { recursive: true });
    await fs.mkdir(path.join(root, 'scripts/instagram'), { recursive: true });
    await fs.writeFile(path.join(root, 'skills/demo/SKILL.md'), '---\nname: demo\ndescription: Use when testing a local install.\n---\n');
    await fs.writeFile(path.join(root, 'skills/demo/references/workflow.md'), 'Keep the originals.\n');
    await fs.writeFile(path.join(root, 'scripts/instagram/tool.mjs'), 'export const value = 42;\n');
    const catalog = { version: 1, skills: [{ name: 'demo', tools: ['scripts/instagram'] }] };
    await fn(root, catalog, path.join(root, 'personal skills'));
  } finally {
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir())) throw Error('Invalid cleanup root');
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('plans use canonical tools and omit local caches and credentials', () => fixture(async (root, catalog) => {
  for (const name of ['__pycache__/cache.pyc', 'node_modules/dependency.js', '.env.local']) {
    const file = path.join(root, 'skills/demo', name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, 'private');
  }
  const plan = await createInstallPlan({ root, catalog });
  assert.deepEqual(plan.map(f => f.relative).sort(), ['SKILL.md', 'references/workflow.md', 'scripts/tool.mjs']);
  assert.equal(await fs.readFile(plan.find(f => f.relative === 'scripts/tool.mjs').source, 'utf8'), 'export const value = 42;\n');
}));

test('installation is explicit about updates and preserves unrelated personal files', () => fixture(async (root, catalog, targetRoot) => {
  const plan = await createInstallPlan({ root, catalog });
  await installSkills({ plan, targetRoot });
  await fs.writeFile(path.join(targetRoot, 'demo/owner-note.txt'), 'keep');
  await assert.rejects(installSkills({ plan, targetRoot }), /exists.*update/i);
  await fs.writeFile(path.join(root, 'scripts/instagram/tool.mjs'), 'export const value = 43;\n');
  const revised = await createInstallPlan({ root, catalog });
  await installSkills({ plan: revised, targetRoot, update: true });
  assert.equal(await fs.readFile(path.join(targetRoot, 'demo/scripts/tool.mjs'), 'utf8'), 'export const value = 43;\n');
  assert.equal(await fs.readFile(path.join(targetRoot, 'demo/owner-note.txt'), 'utf8'), 'keep');
  assert.equal((await checkInstalled({ plan: revised, targetRoot })).valid, true);
}));

test('installed verification detects missing and modified bytes', () => fixture(async (root, catalog, targetRoot) => {
  const plan = await createInstallPlan({ root, catalog });
  await installSkills({ plan, targetRoot });
  await fs.writeFile(path.join(targetRoot, 'demo/SKILL.md'), 'local change');
  await fs.unlink(path.join(targetRoot, 'demo/scripts/tool.mjs'));
  const result = await checkInstalled({ plan, targetRoot });
  assert.equal(result.valid, false);
  assert.deepEqual(result.differences.map(d => d.status).sort(), ['changed', 'missing']);
}));

test('unknown skills and source path escapes fail before writing', () => fixture(async (root, catalog) => {
  await assert.rejects(createInstallPlan({ root, catalog, names: ['unknown'] }), /unknown/i);
  await assert.rejects(createInstallPlan({ root, catalog: { version: 1, skills: [{ name: '../outside', tools: [] }] } }), /unsafe/i);
  await assert.rejects(createInstallPlan({ root, catalog: { version: 1, skills: [{ name: 'demo', tools: ['../outside'] }] } }), /outside|escape/i);
}));

test('CRLF skill files are supported and changed source plans cannot overwrite installs', () => fixture(async (root, catalog, targetRoot) => {
  const file = path.join(root, 'skills/demo/SKILL.md');
  await fs.writeFile(file, '---\r\nname: demo\r\ndescription: Use when testing Windows installs.\r\n---\r\n');
  const plan = await createInstallPlan({ root, catalog });
  await fs.writeFile(file, 'changed after planning');
  await assert.rejects(installSkills({ plan, targetRoot }), /source changed/i);
  await assert.rejects(fs.access(path.join(targetRoot, 'demo')));
}));

test('an installed directory link cannot redirect an update into unrelated files', () => fixture(async (root, catalog, targetRoot) => {
  const plan = await createInstallPlan({ root, catalog });
  const outside = path.join(root, 'unrelated');
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'workflow.md'), 'keep external bytes');
  await fs.mkdir(path.join(targetRoot, 'demo'), { recursive: true });
  await fs.symlink(outside, path.join(targetRoot, 'demo/references'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(installSkills({ plan, targetRoot, update: true }), /link/i);
  assert.equal(await fs.readFile(path.join(outside, 'workflow.md'), 'utf8'), 'keep external bytes');
  await fs.unlink(path.join(targetRoot, 'demo/references'));
}));

test('a linked install root cannot write back into the source skills', () => fixture(async (root, catalog) => {
  const plan = await createInstallPlan({ root, catalog });
  const targetRoot = path.join(root, 'linked personal skills');
  await fs.symlink(path.join(root, 'skills'), targetRoot, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(installSkills({ plan, targetRoot, update: true }), /link|source repository/i);
  await assert.rejects(fs.access(path.join(root, 'skills/demo/.repository-skill.json')));
  await fs.unlink(targetRoot);
}));

test('a linked receipt cannot redirect writes outside the install', () => fixture(async (root, catalog, targetRoot) => {
  const plan = await createInstallPlan({ root, catalog });
  await fs.mkdir(path.join(targetRoot, 'demo'), { recursive: true });
  const outside = path.join(root, 'unrelated-receipt.json');
  const linked = path.join(targetRoot, 'demo/.repository-skill.json');
  await fs.writeFile(outside, 'keep external receipt');
  try { await fs.symlink(outside, linked, 'file'); }
  catch (error) { if (error.code === 'EPERM') await fs.link(outside, linked); else throw error; }
  try {
    await assert.rejects(installSkills({ plan, targetRoot, update: true }), /link/i);
    assert.equal(await fs.readFile(outside, 'utf8'), 'keep external receipt');
  } finally { await fs.unlink(linked); }
}));
