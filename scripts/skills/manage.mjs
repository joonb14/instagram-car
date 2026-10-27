import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const excluded = name => ['node_modules', '__pycache__', '.git', '_runtime'].includes(name) || name.startsWith('.env') || name.endsWith('.pyc');

function within(root, relative) {
  const resolved = path.resolve(root, relative);
  const rel = path.relative(path.resolve(root), resolved);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw Error('Path escapes outside root: ' + relative);
  return resolved;
}

async function files(root, relative = '') {
  const result = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    if (excluded(entry.name)) continue;
    if (entry.isSymbolicLink()) throw Error('Source symlink requires explicit review: ' + entry.name);
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await files(root, next));
    else if (entry.isFile()) result.push(next);
  }
  return result;
}

async function assertUnlinkedDestination(root, destination) {
  // Include the explicitly named root and its ancestors: a junction there can
  // otherwise redirect a seemingly different destination into repository sources.
  let current = path.parse(path.resolve(root)).root;
  for (const part of path.relative(current, destination).split(path.sep)) {
    current = path.join(current, part);
    try {
      const info = await fs.lstat(current);
      if (info.isSymbolicLink() || (info.isFile() && info.nlink > 1)) throw Error('Linked install destination requires review: ' + current);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
  }
}

export async function createInstallPlan({ root = repositoryRoot, catalog, names } = {}) {
  catalog ??= JSON.parse(await fs.readFile(path.join(root, 'scripts/skills/catalog.json'), 'utf8'));
  const all = catalog.skills;
  if (catalog.version !== 1 || !Array.isArray(all)) throw Error('Unsupported skill catalog');
  const selected = names ?? all.map(s => s.name);
  for (const name of selected) if (!all.some(s => s.name === name)) throw Error('Unknown skill: ' + name);
  const plan = [];
  for (const item of all.filter(s => selected.includes(s.name))) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name)) throw Error('Unsafe skill name: ' + item.name);
    const source = within(root, 'skills/' + item.name);
    const text = (await fs.readFile(path.join(source, 'SKILL.md'), 'utf8')).replace(/\r\n/g, '\n');
    if (!text.startsWith('---') || !text.includes('name: ' + item.name + '\n')) throw Error('Invalid SKILL.md: ' + item.name);
    const entries = new Map();
    for (const relative of await files(source)) {
      // Runtime copies are generated from canonical project tools, never copied back.
      if (item.tools?.length && relative.split(path.sep)[0] === 'scripts') continue;
      entries.set(relative.split(path.sep).join('/'), path.join(source, relative));
    }
    for (const bundle of item.tools ?? []) {
      const toolRoot = within(root, bundle);
      for (const relative of await files(toolRoot)) {
        const key = 'scripts/' + relative.split(path.sep).join('/');
        if (entries.has(key)) throw Error('Duplicate bundled tool destination: ' + key);
        entries.set(key, path.join(toolRoot, relative));
      }
    }
    for (const [relative, file] of entries) plan.push({ skill: item.name, relative, source: file, sha256: hash(await fs.readFile(file)) });
  }
  return plan;
}

export async function installSkills({ plan, targetRoot, update = false }) {
  const names = [...new Set(plan.map(f => f.skill))];
  for (const name of names) {
    const destination = within(targetRoot, name);
    await assertUnlinkedDestination(targetRoot, within(targetRoot, name + '/.repository-skill.json'));
    try {
      const info = await fs.lstat(destination);
      if (info.isSymbolicLink()) throw Error('Refusing to replace linked skill: ' + destination);
      if (!update) throw Error('Skill exists; inspect differences and use --update: ' + name);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  // Validate all source bytes before any write; a stale plan cannot overwrite a skill.
  const prepared = [];
  for (const file of plan) {
    const destination = within(targetRoot, file.skill + '/' + file.relative);
    if (path.resolve(destination) === path.resolve(file.source)) throw Error('Install destination is the source repository');
    await assertUnlinkedDestination(targetRoot, destination);
    const bytes = await fs.readFile(file.source);
    if (hash(bytes) !== file.sha256) throw Error('Source changed after planning: ' + file.source);
    prepared.push({ ...file, destination, bytes });
  }
  for (const file of prepared) {
    await fs.mkdir(path.dirname(file.destination), { recursive: true });
    await fs.writeFile(file.destination, file.bytes);
  }
  for (const name of names) await fs.writeFile(path.join(targetRoot, name, '.repository-skill.json'), JSON.stringify({
    source: 'diy-cars', installedAt: new Date().toISOString(), files: plan.filter(f => f.skill === name).map(({ relative, sha256 }) => ({ relative, sha256 })),
  }, null, 2) + '\n');
  return checkInstalled({ plan, targetRoot });
}

export async function checkInstalled({ plan, targetRoot }) {
  const differences = [];
  for (const file of plan) {
    try {
      if (hash(await fs.readFile(within(targetRoot, file.skill + '/' + file.relative))) !== file.sha256) differences.push({ skill: file.skill, file: file.relative, status: 'changed' });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      differences.push({ skill: file.skill, file: file.relative, status: 'missing' });
    }
  }
  return { valid: !differences.length, fileCount: plan.length, skills: [...new Set(plan.map(f => f.skill))], differences };
}

export async function main(args = process.argv.slice(2)) {
  const [command, ...flags] = args;
  const value = name => { const i = flags.indexOf(name); if (i < 0) return undefined; if (!flags[i + 1] || flags[i + 1].startsWith('--')) throw Error('Missing value for ' + name); return flags[i + 1]; };
  if (!['check', 'install'].includes(command)) throw Error('Usage: manage.mjs check|install [--only name,name] [--target-root directory] [--installed] [--update]');
  const targetRoot = path.resolve(value('--target-root') ?? path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'));
  const plan = await createInstallPlan({ names: value('--only')?.split(',') });
  const result = command === 'install'
    ? await installSkills({ plan, targetRoot, update: flags.includes('--update') })
    : flags.includes('--installed') ? await checkInstalled({ plan, targetRoot }) : { valid: true, fileCount: plan.length, skills: [...new Set(plan.map(f => f.skill))] };
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
