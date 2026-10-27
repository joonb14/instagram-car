"""Composite an opaque approved plate asset into four reviewed source-pixel corners."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw


def composite_plate(photo, asset, corners):
    photo = photo.convert('RGB')
    asset = asset.convert('RGBA')
    if asset.getextrema()[3] != (255, 255):
        raise ValueError('Plate backing must be fully opaque')
    points = np.asarray(corners, dtype=float)
    if points.shape != (4, 2) or not np.isfinite(points).all():
        raise ValueError('Four finite TL,TR,BR,BL corners required')
    edges = np.roll(points, -1, axis=0) - points
    crosses = edges[:, 0]*np.roll(edges[:, 1], -1) - edges[:, 1]*np.roll(edges[:, 0], -1)
    if not (crosses > 0).all():
        raise ValueError('Corners must form a clockwise convex quadrilateral')
    w, h = photo.size
    if ((points < 0).any() or (points[:, 0] >= w).any() or (points[:, 1] >= h).any()):
        raise ValueError('Corners must lie in the source image')
    src = [(0, 0), (asset.width-1, 0), (asset.width-1, asset.height-1), (0, asset.height-1)]
    rows, values = [], []
    for (x, y), (u, v) in zip(points, src):
        rows += [[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]]
        values += [u,v]
    coefficients = np.linalg.solve(np.array(rows), np.array(values))
    # Pillow uses an inverse mapping from destination pixels to asset pixels.
    warped = asset.transform(photo.size, Image.Transform.PERSPECTIVE, coefficients, Image.Resampling.BICUBIC)
    mask = Image.new('L', photo.size)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in points], fill=255)
    return Image.composite(warped.convert('RGB'), photo, mask)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('config')
    args = parser.parse_args()
    cfg = json.loads(Path(args.config).read_text(encoding='utf-8-sig'))
    for job in cfg['images']:
        if Path(job['source']).resolve() == Path(job['output']).resolve():
            raise ValueError('Preserve the original: source and output must differ')
        original = Image.open(job['source'])
        result = composite_plate(original, Image.open(cfg['asset']), job['corners'])
        output = Path(job['output'])
        output.parent.mkdir(parents=True, exist_ok=True)
        result.save(output)
        print(json.dumps({'output':str(output),'size':result.size,'corners':job['corners']}))
