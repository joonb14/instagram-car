"""Measured source cut map and reusable camera/action instructions.

Sources are private review references, not licensed media for redistribution.
Camera values are authored blocking, not recovered original camera calibration.
"""
SOURCES = {
    'A': {'youtube_id':'eaq0oFtTaQs','title':'BMW E30 M3 Tribute | GT7 | FIAM Black Series (Remastered)','creator':'FIAMRACING'},
    'B': {'youtube_id':'NHWZKfeyJII','title':'BMW M3 E30 Tribute | GT7 | FIAM Black Series','creator':'FIAMRACING'},
    'C': {'youtube_id':'xPlXE8XQi0Y','title':'1988 BMW E30 M3 - ASMR #e30m3 #bmw','creator':'Heritage Gruppe'},
}
BOUNDS = {
    'A':[0,1.4,3.1,4.2,5.366667,6.466667,7.9,9.233333,10.366667,11.666667,12.866667,14.366667,15.033333],
    'B':[0,1.95195,3.920583,5.005,6.25625,7.540867,8.75875,10.026683,11.36135,13.046367,15.015],
    'C':[0,2.266667,3.266667,6.6,8.3,11.666667,16.3,18,18.966667,20.7],
}
# id, Korean title, camera start/end, target start/end, lens, English camera instruction, photo slot
DRIVING = [
 ('A01','낮은 전방 사선 전체',(-4.6,-7,1.65),(-4.3,-7,1.6),(0,-.1,.8),(0,-.1,.8),42,'Low front three-quarter tracking, keep the full vehicle at a constant screen size. Match its forward speed.','front_three_quarter'),
 ('A02','높은 전방 사선 앞부분',(-3,-4.5,3.3),(-2.9,-4.3,3.25),(0,-1,.9),(0,-.95,.9),45,'Elevated front three-quarter tracking, tightly cover the hood, windscreen and front wheel.','front_high'),
 ('A03','후방 사선 추적',(-4.5,6.5,2),(-4.35,6.4,1.95),(0,.5,.85),(0,.5,.85),45,'Rear three-quarter follow, hold the rear fascia and rear wheel in the frame at a stable distance.','rear_three_quarter'),
 ('A04','상부 보닛·전면',(-1.1,-3.1,4),(-.85,-3,4),(0,-1.35,.9),(0,-1.35,.9),48,'Steep overhead front detail. Track the hood and grille; keep the same diagonal orientation.','hood_high'),
 ('A05','상부 트렁크·후미등',(-.7,3,3.9),(-.5,3,3.85),(0,1.6,.9),(0,1.6,.9),48,'Overhead rear detail of the deck lid and tail lamps, with a very small lateral drift.','rear_high'),
 ('A06','범퍼·라이트 낮은 디테일',(-1.6,-3.4,.65),(-1.45,-3.4,.65),(-.25,-1.97,.68),(-.2,-1.97,.68),38,'Very low front-corner close tracking. Hold the headlight and bumper; let the road slide past naturally.','front_detail'),
 ('A07','뒤 휠·펜더 로우 앵글',(-2.05,1.65,.25),(-2.05,1.55,.27),(-.8,1.25,.65),(-.8,1.25,.65),28,'Low rear-wheel tracking detail looking slightly upward. Show continuous tire rotation and the rear quarter against the sky.','rear_wheel'),
 ('A08','보닛·앞유리 사선 탑뷰',(-1.8,-2.2,4.7),(-1.65,-2.1,4.7),(0,-.8,1),(0,-.75,1),43,'Diagonal top view across the hood and windshield. Maintain the diagonal body line while matching vehicle speed.','hood_windshield'),
 ('A09','앞 휠 클로즈업',(-2.35,-1.45,.47),(-2.3,-1.35,.47),(-.87,-1.3,.4),(-.87,-1.3,.4),48,'Close side tracking on the front wheel, centered axle, visible rolling contact and physically consistent spoke rotation.','front_wheel'),
 ('A10','앞 절반 측면',(-4.5,-2.7,1.05),(-4.5,-2.5,1.05),(0,-1.4,.7),(0,-1.3,.7),38,'Near-side front-half tracking, retain the nose and front wheel together. Slide gently rearward while preserving the shallow view of the front fascia.','front_side'),
 ('A11','낮은 후방 사선',(-2,7,.8),(-1.8,7,.78),(0,.7,.8),(0,.7,.8),48,'Low rear three-quarter follow with generous sky. Keep the rear end level and the car moving straight.','rear_low'),
 ('A12','전방 복귀 루프 컷',(-4.6,-7,1.65),(-4.45,-7,1.62),(0,-.1,.8),(0,-.1,.8),42,'Return to the opening low front three-quarter tracking composition, as a deliberate loop closure.','front_three_quarter'),
 ('B01','낮은 사선에서 정면으로',(-3.7,-6,1.3),(-1.3,-6,1.25),(0,-.65,.75),(0,-.65,.75),43,'Low front tracking, move gently from a front-side view toward head-on while keeping the same forward speed.','front_three_quarter'),
 ('B02','측면 코에서 앞 휠로',(-4,-2.4,.90),(-4,-1.7,.90),(0,-1.65,.7),(0,-1.3,.7),38,'Close side track drifting from the nose toward the front wheel. Finish with the front wheel readable inside the frame.','front_side'),
 ('B03','상부 보닛·유리 넓은 구도',(-2.4,-2.5,5.3),(-2.2,-2.4,5.3),(0,-.5,1),(0,-.45,1),43,'Elevated diagonal view containing hood, windshield and the leading edge of the roof.','hood_windshield'),
 ('B04','앞 휠 디테일',(-2.25,-1.4,.45),(-2.2,-1.25,.45),(-.86,-1.3,.4),(-.86,-1.3,.4),46,'Front-wheel close tracking; show the spokes rotating at the road-matched speed.','front_wheel'),
 ('B05','반대편 전방 상부', (2.9,-2.7,4.9),(2.6,-2.5,4.8),(0,-.65,1),(0,-.6,1),42,'Opposite-side elevated front three-quarter track showing hood, windshield and side body.','front_high_opposite'),
 ('B06','정면 상부 보닛·그릴',(-.65,-3.2,3.9),(-.1,-3.25,3.8),(0,-1.45,.9),(0,-1.5,.9),47,'Steep frontal overhead detail, drift toward the centerline while preserving hood and grille coverage.','hood_high'),
 ('B07','전방 사선 앞 절반',(-2.4,-4,1.35),(-3.2,-3.7,1.3),(0,-1.15,.8),(0,-.95,.8),40,'Front three-quarter tracking that reveals more front wheel as the camera moves gently toward the side.','front_three_quarter'),
 ('B08','후면 데크 상부 디테일',(-.85,2.5,3.8),(-.65,2.6,3.8),(0,1.25,1),(0,1.3,1),50,'Close diagonal top view of rear deck and lower rear window. Follow the existing rear silhouette.','rear_high'),
 ('B09','낮은 측면에서 뒤 휠로',(-5.5,.1,.9),(-5.5,.8,.85),(0,.1,.8),(0,.7,.8),40,'Low side tracking drifting toward the rear wheel, level horizon and steady forward travel.','side'),
 ('B10','후방 상부에서 측면으로',(-3.4,4.6,4.4),(-4.2,1.3,4.5),(0,.55,1),(0,.1,1),43,'Elevated rear-quarter camera travels in a restrained arc toward the side. Preserve continuous forward vehicle motion.','rear_three_quarter_high'),
]
# action id, title, photo slots, compatibility, camera/action description
INTERIOR = [
 ('C01','밖에서 운전석 문 열기','exterior_driver_side + open_door_cockpit','해당 차량의 문 경첩 방향·핸들 위치 확인','External waist-height close view of the driver door. An adult pulls the exterior handle and opens the door once. Keep the visible cockpit consistent with its reference. Restrained handheld movement.'),
 ('C02','실내 도어풀로 문 당기기','inside_door_panel','도어풀 전체와 손잡이 부착 위치가 보이는 사진','Interior close-up of the large door pull. The hand grips the pull and draws the door inward to close it once. Camera stays inside the cabin with only slight handheld response.'),
 ('C03','수동 기어 레버 조작','gear_console','수동 변속 차량만 그대로 사용; 자동/P·R·N·D는 동작 재설계','Downward close-up of the manual shifter and console. The hand grips the knob and moves it through a short deliberate shift pattern, then rests. Keep hand-to-knob contact throughout.'),
 ('C04','핸드브레이크 조작','handbrake_console','기계식 레버 차량만 그대로 사용; 전자식 버튼은 별도 컷','Downward close-up of the mechanical handbrake. The hand grips the lever and operates it once, maintaining contact. Keep the surrounding seat and console stationary.'),
 ('C05','물리 키로 시동 켜기','ignition_cluster','물리 키 실린더 차량만 그대로 사용; 964는 키 위치가 달라 사진 기준 재배치','Tight driver-eye close-up of the ignition cylinder beside the steering wheel, with the instrument cluster above. The hand inserts the key, turns to start, then releases it to the running position.'),
 ('C06','후방 정차·엔진 아이들','rear_low','배기구 위치와 개수는 외관 사진 기준','Low rear three-quarter stationary view. The car idles in place; wheels remain still. Tiny natural handheld movement, no dolly orbit or invented exhaust smoke.'),
 ('C07','시동 끄고 키 빼기','ignition_cluster','C05와 동일한 실내 및 손 사용','Same tight ignition framing as the start shot. The hand turns the key off and removes it, then leaves the frame. Preserve the real ignition placement.'),
 ('C08','안쪽 도어 릴리스 당기기','inside_door_panel','도어 릴리스와 도어풀을 구별해 촬영','Close-up of the interior door release latch. Fingers pull the small latch once and the door begins to open. Preserve the latch location and geometry from the photo.'),
 ('C09','밖에서 운전석 문 닫기','exterior_driver_side + open_door_cockpit','C01과 동일한 문·실내·인물','External waist-height view matching the door-opening shot. An adult pushes the open driver door closed once. Keep hand contact until closure; no extra open-close cycle.'),
]

SIDE_CORRECTIONS={'A02','A03','A04','A06','A10','A11','B02','B07','B08','B09'}
OVERHEAD_CORRECTIONS={'A08','B03','B05'}
def orient_like_source(s):
    if s['id'] in SIDE_CORRECTIONS:
        for field in ['cam0','cam1','aim0','aim1']:
            v=list(s[field]);v[0]*=-1;s[field]=v
        cue='The nose points screen-left.' if s['id'] not in ['A03','A11','A04','B08'] else 'Preserve the rear pointing screen-right.' if s['id'] in ['A03','A11'] else 'Preserve the leading hood edge toward the lower-left.' if s['id']=='A04' else 'Preserve the rear deck edge toward the lower-left.'
        s['camera_prompt']+=' '+cue;s['orientation_applied']=True
    if s['id'] in OVERHEAD_CORRECTIONS:
        presets={'A08':((1.8,1.0,7.0),(1.65,.9,7.0),65),'B03':((2.3,1.2,8.0),(2.1,1.1,8.0),60),'B05':((-2.6,1.0,7.5),(-2.4,.9,7.5),55)}
        s['cam0'],s['cam1'],s['lens']=presets[s['id']]
        s['camera_prompt']+=' The nose points toward the upper part of the image; the windshield and roof extend toward the lower part.';s['orientation_applied']=True
    return s

def get_shots():
    shots=[]
    for row in DRIVING:
        sid,title,cam0,cam1,aim0,aim1,lens,cue,photos=row
        shots.append(dict(id=sid,title=title,kind='driving',classification='exterior',cam0=cam0,cam1=cam1,aim0=aim0,aim1=aim1,lens=lens,camera_prompt=cue,photos=photos,compatibility='외관 사진의 비율·휠·라이트·방향을 유지',loop_duplicate_of='A01' if sid=='A12' else None))
    for sid,title,photos,compat,cue in INTERIOR:
        shots.append(dict(id=sid,title=title,kind='interaction' if sid!='C06' else 'idle',classification='mixed' if sid in ['C01','C09'] else 'exterior' if sid=='C06' else 'interior',photos=photos,compatibility=compat,camera_prompt=cue))
    for s in shots:
        if s['kind']=='driving':orient_like_source(s)
        group=s['id'][0]; i=int(s['id'][1:])-1
        s.update(source=SOURCES[group],source_in=BOUNDS[group][i],source_out=BOUNDS[group][i+1])
        s['frames']=round((s['source_out']-s['source_in'])*60)
        s['duration']=s['frames']/60
    return shots
