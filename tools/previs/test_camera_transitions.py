"""Pixel-level test of timing and visual behavior, using synthetic colors."""
import subprocess
from package import FF

for kind in ['cut','fade','fadeblack','smoothleft']:
    spec="custom:expr='if(gte(P,0.5),A,B)'" if kind=='cut' else kind
    graph=f'[0:v][1:v]xfade=transition={spec}:duration=0.2:offset=2,trim=start_frame=6:end_frame=246,setpts=PTS-STARTPTS,format=rgb24'
    cmd=[str(FF),'-v','error','-filter_complex_threads','1','-f','lavfi','-i','color=red:s=16x16:r=60:d=2.2','-f','lavfi','-i','color=blue:s=16x16:r=60:d=2.2','-filter_complex',graph,'-f','rawvideo','-']
    raw=subprocess.run(cmd,capture_output=True,check=True).stdout
    frames=[raw[i:i+768] for i in range(0,len(raw),768)]
    assert len(frames)==240
    assert frames[0][0]>200 and frames[0][2]<10
    assert frames[-1][2]>200 and frames[-1][0]<10
    if kind=='cut':assert frames[119][0]>200 and frames[121][2]>200
    if kind=='fade':assert 60<frames[120][0]<190 and 60<frames[120][2]<190
    if kind=='fadeblack':assert min(max(frames[i]) for i in range(114,126))<25
    if kind=='smoothleft':assert max(frames[120][0::3])>200 and max(frames[120][2::3])>200
    print('PASS',kind,'240 frames, expected color behavior')
