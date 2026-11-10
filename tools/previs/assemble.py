"""Assemble selected IDs without altering their frames; optionally split at cut boundaries."""
from pathlib import Path
import argparse,json,subprocess
from package import FF,probe
def partition(shots,limit):
    groups=[];current=[];total=0
    for s in shots:
        if s['duration']>limit:raise ValueError(f"Cut {s['id']} exceeds {limit}s; cannot split it silently")
        if current and total+s['duration']>limit+1e-8:groups.append(current);current=[];total=0
        current.append(s);total+=s['duration']
    if current:groups.append(current)
    return groups
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--library',type=Path,required=True);ap.add_argument('--ids');ap.add_argument('--recipe',type=Path);ap.add_argument('--max-seconds',type=float,default=20);ap.add_argument('--name',default='selected');ap.add_argument('--allow-repeat',action='store_true');args=ap.parse_args()
    if not args.ids and not args.recipe:ap.error('Provide --ids or --recipe')
    if not args.name.replace('-','').replace('_','').isalnum():ap.error('name must be a simple filename')
    m=json.loads((args.library/'manifest.json').read_text(encoding='utf-8'));lookup={s['id']:s for s in m['shots']}
    ids=args.ids.split(',') if args.ids else json.loads(args.recipe.read_text(encoding='utf-8'))['shots']
    if not ids:ap.error('Empty selection')
    if not args.allow_repeat and (len(set(ids))!=len(ids) or ('A01' in ids and 'A12' in ids)):ap.error('Repeated/loop-return cut; review and use --allow-repeat only if intentional')
    shots=[lookup[x] for x in ids];groups=partition(shots,args.max_seconds);out=args.library/'assemblies';out.mkdir(exist_ok=True)
    checks=[]
    for i,g in enumerate(groups,1):
        li=out/f'{args.name}-{i:02d}.txt';li.write_text(''.join(f"file '../{s['clip']}'\n" for s in g),encoding='utf-8')
        target=li.with_suffix('.mp4')
        if target.exists():raise FileExistsError(target)
        subprocess.run([str(FF),'-v','error','-f','concat','-safe','0','-i',str(li),'-c','copy','-movflags','+faststart',str(target)],check=True)
        c=probe(target);assert c['frames']==sum(s['frames'] for s in g);checks.append(dict(file=target.name,ids=[s['id'] for s in g],**c))
    (out/f'{args.name}-receipt.json').write_text(json.dumps(checks,indent=2),encoding='utf-8');print(json.dumps(checks,indent=2))
if __name__=='__main__':main()
