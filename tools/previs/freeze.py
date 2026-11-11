"""Create a still-only delivery from reviewed PNGs, preserving cut frame counts."""
from pathlib import Path
import argparse, copy, hashlib, json, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor
import imageio_ffmpeg
from player import build_player

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--source',type=Path,required=True); ap.add_argument('--output',type=Path,required=True)
    args=ap.parse_args(); src=args.source.resolve(); out=args.output.resolve()
    if out.exists(): raise SystemExit('Output already exists; use a new version.')
    m=copy.deepcopy(json.loads((src/'manifest.json').read_text(encoding='utf-8-sig')))
    out.mkdir(parents=True); ff=imageio_ffmpeg.get_ffmpeg_exe()
    m['revision']=out.name; m['motion_mode']='still'; m['authorship']='Frozen reviewed midpoint PNGs from '+str(src)
    for key in ('camera_treatment','person_treatment','blend_sha256'): m.pop(key,None)
    def freeze(s):
        folder=out/s['id']; folder.mkdir()
        original=src/s['mid_frame']
        for name in ('start.png','mid.png','end.png'): shutil.copy2(original,folder/name)
        s['source_motion_metadata']={k:s.pop(k) for k in ('camera_motion','wheel_physics') if k in s}
        s['motion_mode']='still'; s['kind']='still'
        s['description_ko']='고정된 한 프레임을 컷 전체 길이 동안 유지합니다. 카메라·차량·바퀴·배경·조작부가 모두 정지합니다.'
        s['camera_prompt']='Locked-off camera. Hold this exact still composition throughout the shot. Every object remains stationary.'
        s['prompt']='Use the supplied photo for vehicle identity and this still frame for composition. '+s['camera_prompt']+' No wheel rotation, road travel, background motion, zoom, orbit, door or control animation. Preserve framing and vehicle details. Portrait 9:16.'
        (folder/'prompt.txt').write_text(s['prompt'],encoding='utf-8')
        dst=out/s['clip']
        subprocess.run([ff,'-v','error','-loop','1','-framerate',str(m['fps']),'-i',str(original),'-frames:v',str(s['frames']),'-c:v','libx264','-preset','fast','-tune','stillimage','-crf','0','-pix_fmt','yuv420p','-threads','2','-an',str(dst)],check=True)
        result=subprocess.run([ff,'-v','error','-i',str(dst),'-f','framemd5','-'],check=True,capture_output=True,text=True)
        hashes=[line.split(',')[-1].strip() for line in result.stdout.splitlines() if line and not line.startswith('#')]
        if len(hashes)!=s['frames'] or len(set(hashes))!=1: raise RuntimeError('Not a constant-frame clip: '+s['id'])
        print(s['id']+' verified static',flush=True)
        return {'id':s['id'],'frames':len(hashes),'unique_decoded_frames':1,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}
    with ThreadPoolExecutor(max_workers=3) as pool: receipts=list(pool.map(freeze,m['shots']))
    (out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'static-verification.json').write_text(json.dumps(receipts,indent=2),encoding='utf-8')
    build_player(out,m)
    shutil.copy2(out/'index.html',out/'catalog.html')

if __name__=='__main__': main()
