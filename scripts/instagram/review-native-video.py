"""Extract a local Kling clip's metadata and review frames; never submits or edits it."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess
from PIL import Image, ImageDraw

def review(video, output, ffmpeg):
    video, output, ffmpeg = Path(video).resolve(), Path(output).resolve(), Path(ffmpeg).resolve()
    if not video.is_file() or not ffmpeg.is_file():
        raise ValueError('Actual local video and ffmpeg executable are required')
    output.mkdir(parents=True, exist_ok=True)
    probe = subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(video)], capture_output=True,
                           encoding='utf-8', errors='replace')
    info = probe.stderr
    dims = re.search(r'Video:.*?\b(\d{2,5})x(\d{2,5})\b', info)
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
    if not dims or not dur:
        raise ValueError('No actual video metadata; keep the file held')
    width, height = map(int, dims.groups())
    duration = int(dur[1])*3600 + int(dur[2])*60 + float(dur[3])
    has_audio = bool(re.search(r'Stream #.*Audio:', info))
    fps = re.search(r'\b([\d.]+) fps', info)
    last = max(0, duration - .08)
    times = sorted(set(round(min(t, last), 3) for t in [0, .5, 1, 1.5, 2, 2.5, last]))
    sheet = Image.new('RGB', (1440, 1360), '#171717')
    draw = ImageDraw.Draw(sheet)
    samples = []
    for i, timestamp in enumerate(times):
        frame = output / f'{timestamp:05.2f}.jpg'
        subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-ss',
                        str(timestamp), '-i', str(video), '-frames:v', '1', '-q:v', '2', str(frame)], check=True)
        with Image.open(frame) as im:
            preview = im.convert('RGB'); preview.thumbnail((350, 622))
            left, top = i % 4 * 360 + 5, i // 4 * 680
            sheet.paste(preview, (left, top + 30)); draw.text((left, top + 5), f'{timestamp:g} sec', fill='white')
        samples.append({'timeSeconds':timestamp, 'file':str(frame)})
    contact = output / 'contact.jpg'; sheet.save(contact, quality=92)
    format_checks = {'portrait1080':(width, height)==(1080,1920), 'audioAbsent':not has_audio,
                     'threeSecondRange':2.9 <= duration <= 3.2}
    result = {'file':str(video), 'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),
              'width':width, 'height':height, 'duration':duration,
              'fps':float(fps[1]) if fps else None, 'hasAudio':has_audio,
              'formatChecks':format_checks, 'formatPass':all(format_checks.values()),
              'samples':samples, 'contactSheet':str(contact),
              'visualReviewStatus':'pending',
              'scope':'Metadata/frame extraction only. Inspect native playback, perspective/parallax, tire contact, crop, badges, wipers and lamp continuity; this tool does not certify visual motion or identity.'}
    (output/'metadata.txt').write_text(info, encoding='utf-8')
    (output/'review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);p.add_argument('--ffmpeg',required=True)
    a=p.parse_args();r=review(a.input,a.out,a.ffmpeg)
    print(json.dumps({k:r[k] for k in ['file','width','height','duration','hasAudio','formatPass','contactSheet','visualReviewStatus']}, ensure_ascii=False))
