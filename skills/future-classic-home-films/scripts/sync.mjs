import path from 'node:path';import {pathToFileURL} from 'node:url';import fs from 'node:fs/promises';
const args=process.argv.slice(2),i=args.indexOf('--project');if(i<0||!args[i+1])throw Error('Specify --project with the actual project/release root');
const project=path.resolve(args[i+1]),tool=path.join(project,'scripts/home-films/sync.mjs');await fs.access(tool);const {main}=await import(pathToFileURL(tool));await main(args);
