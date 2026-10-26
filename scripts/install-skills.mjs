import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),mode=args[0];
const available=(await fs.readdir(path.join(root,'skills'),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name).sort();
if(mode==='--list'){console.log(available.join('\n'));process.exit(0);}
if(!['--check','--install'].includes(mode))throw Error('Use --list, --check [skill names], or --install [skill names]');
const selected=args.slice(1).length?args.slice(1):available;
for(const name of selected)if(!available.includes(name))throw Error('Unknown skill: '+name);
const target=path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'skills');
async function files(dir,prefix=''){const found=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='__pycache__')continue;const rel=path.join(prefix,e.name);if(e.isDirectory())found.push(...await files(path.join(dir,e.name),rel));else if(e.isFile())found.push(rel);}return found;}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let differences=0;
for(const name of selected){const source=path.join(root,'skills',name),dest=path.join(target,name);if(mode==='--install'){await fs.mkdir(dest,{recursive:true});await fs.cp(source,dest,{recursive:true,filter:p=>!p.split(path.sep).some(s=>s==='node_modules'||s==='__pycache__')});console.log('Installed '+name);continue;}let changed=0;for(const f of await files(source)){try{if(hash(await fs.readFile(path.join(source,f)))!==hash(await fs.readFile(path.join(dest,f))))changed++;}catch(e){if(e.code!=='ENOENT')throw e;changed++;}}differences+=changed;console.log(name+': '+(changed?changed+' missing/different files':'matches repository'));}
if(mode==='--check'&&differences)process.exitCode=1;
