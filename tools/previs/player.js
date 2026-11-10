/* No network dependencies. The same document also works from a local file. */
function makeTimeline(shots) {
  let cursor = 0;
  return shots.map(shot => {
    const duration = shot.frames / shot.fps;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Invalid duration: ${shot.id}`);
    const entry = { shot, start: cursor, end: cursor + duration, duration };
    cursor = entry.end;
    return entry;
  });
}

function locateTime(timeline, seconds) {
  if (!timeline.length) return null;
  const time = Math.max(0, Math.min(Number(seconds) || 0, timeline.at(-1).end));
  const found = timeline.findIndex(entry => time < entry.end - 1e-8);
  const index = found === -1 ? timeline.length - 1 : found;
  return { index, offset: Math.min(timeline[index].duration, Math.max(0, time - timeline[index].start)) };
}

function nextCut(index, count, continuous, repeat) {
  if (!continuous || !count) return null;
  if (index + 1 < count) return index + 1;
  return repeat ? 0 : null;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { makeTimeline, locateTime, nextCut };

if (typeof document !== 'undefined') (() => {
  'use strict';
  const data = JSON.parse(document.getElementById('manifest').textContent);
  const $ = id => document.getElementById(id);
  const video = $('video');
  const groupNames = { all: '전체 라이브러리', A: 'A · 주행', B: 'B · 주행', C: 'C · 실내·ASMR' };
  let group = 'all';
  let timeline = makeTimeline(data.shots);
  let index = 0;
  let generation = 0;
  let pendingTime = 0;
  let scrubbing = false;
  let copyTimer;
  let progressFrame;
  const nextPreview = document.createElement('video');
  nextPreview.preload = 'auto';
  nextPreview.muted = true;
  const time = seconds => {
    const tenths = Math.floor(Math.max(0, seconds) * 10 + 0.00001);
    return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
  };
  const total = () => timeline.at(-1).end;
  const message = text => { $('status').textContent = text; };
  const current = () => timeline[index];

  function updateClock() {
    const elapsed = Math.min(current().duration, video.readyState ? video.currentTime : pendingTime);
    const absolute = current().start + elapsed;
    $('clipElapsed').textContent = time(elapsed);
    $('totalClock').textContent = `${time(absolute)} / ${time(total())}`;
    if (!scrubbing) $('scrubber').value = absolute;
    $('scrubber').style.setProperty('--progress', `${100 * Number($('scrubber').value) / total()}%`);
    $('scrubber').setAttribute('aria-valuetext', `${current().shot.id}, ${time(absolute)} / ${time(total())}`);
    const progress = document.querySelector('.shot[aria-current="true"] .shot-progress');
    if (progress) progress.style.width = `${100 * elapsed / current().duration}%`;
  }

  function animationTick() {
    updateClock();
    if (!video.paused) progressFrame = requestAnimationFrame(animationTick);
  }

  function updatePlaying() {
    const playing = !video.paused && !video.ended;
    $('stage').classList.toggle('playing', playing);
    $('play').textContent = playing ? 'Ⅱ' : '▶';
    $('play').setAttribute('aria-label', playing ? '일시정지' : '재생');
    $('stagePlay').setAttribute('aria-label', video.ended ? '다시 재생' : '영상 재생');
    cancelAnimationFrame(progressFrame);
    if (playing) animationTick();
    else updateClock();
  }

  function showDetails() {
    const { shot, duration } = current();
    $('scenePosition').textContent = `${groupNames[group]} / SCENE ${String(index + 1).padStart(2, '0')} OF ${timeline.length}`;
    $('sceneId').textContent = shot.id;
    $('stageId').textContent = `${shot.id} / ${index + 1} of ${timeline.length}`;
    $('sceneTitle').textContent = shot.title;
    $('kind').textContent = { exterior: '외관', interior: '실내', mixed: '외관 + 실내' }[shot.classification];
    $('duration').textContent = `${duration.toFixed(2)}초`;
    $('motion').textContent = shot.kind === 'driving' ? '주행 · 바퀴 회전' : '정차 · 바퀴 정지';
    $('loopNote').hidden = !shot.loop_duplicate_of;
    $('description').textContent = shot.description_ko;
    $('cameraPrompt').textContent = shot.camera_prompt;
    $('prompt').value = shot.prompt;
    $('prompt').scrollTop = 0;
    $('photo').textContent = shot.photo_label;
    $('compatibility').textContent = shot.compatibility;
    $('clipLink').href = shot.clip;
    $('startLink').href = shot.start_frame;
    $('promptLink').href = `${shot.id}/prompt.txt`;
    $('clipDuration').textContent = time(duration);
    $('previous').disabled = index === 0;
    $('next').disabled = index === timeline.length - 1;
    $('copyPrompt').textContent = '프롬프트 복사 ⧉';
    clearTimeout(copyTimer);
    document.querySelectorAll('.shot').forEach((button, i) => {
      button.setAttribute('aria-current', String(i === index));
      button.querySelector('.shot-progress').style.width = '0';
    });
    const active = $('filmstrip').children[index];
    // Scroll this strip only; never yank the document away from the video on mobile.
    if (active) {
      const strip = $('filmstrip');
      const left = active.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft || left + active.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollTo({ left: left - (strip.clientWidth - active.offsetWidth) / 2, behavior: 'auto' });
      }
    }
  }

  function preloadNext() {
    const next = nextCut(index, timeline.length, $('continuous').checked, $('repeat').checked);
    if (next === null) {
      nextPreview.removeAttribute('src');
      nextPreview.load();
    } else if (nextPreview.getAttribute('src') !== timeline[next].shot.clip) {
      nextPreview.src = timeline[next].shot.clip;
      nextPreview.load();
    }
  }

  function requestPlay(token = generation) {
    const result = video.play();
    if (result) result.catch(error => {
      if (token !== generation || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') message('재생 버튼을 누르면 선택한 컷부터 이어서 재생합니다.');
      else if (!video.error) message('재생할 수 없습니다. 다시 불러오거나 다음 컷을 선택해 주세요.');
      updatePlaying();
    });
  }

  function selectCut(nextIndex, { play = true, offset = 0 } = {}) {
    if (nextIndex < 0 || nextIndex >= timeline.length) return;
    const token = ++generation;
    video.pause();
    index = nextIndex;
    pendingTime = Math.max(0, Math.min(offset, current().duration));
    $('mediaError').hidden = true;
    video.poster = current().shot.mid_frame;
    showDetails();
    message(`${current().shot.id} · ${play ? '재생 준비 중' : '일시정지'}`);
    video.onloadedmetadata = () => {
      if (token !== generation) return;
      video.currentTime = Math.min(pendingTime, video.duration);
      video.playbackRate = Number($('speed').value);
      updateClock();
    };
    video.src = current().shot.clip;
    video.load();
    video.playbackRate = Number($('speed').value);
    updateClock();
    if (play) requestPlay(token);
    preloadNext();
  }

  function renderTimeline() {
    const fragment = document.createDocumentFragment();
    timeline.forEach(({ shot, start, duration }, i) => {
      const button = document.createElement('button');
      button.className = 'shot';
      button.dataset.id = shot.id;
      button.dataset.group = shot.id[0];
      button.setAttribute('aria-label', `${shot.id} · ${shot.title}, ${duration.toFixed(2)}초, ${time(start)}부터 재생`);
      button.setAttribute('aria-current', 'false');
      const img = document.createElement('img');
      img.src = shot.mid_frame;
      img.alt = '';
      img.loading = 'lazy';
      const copy = document.createElement('span');
      copy.className = 'shot-copy';
      const top = document.createElement('span');
      top.className = 'shot-top';
      top.textContent = `${shot.id}  /  ${duration.toFixed(2)}s`;
      const title = document.createElement('span');
      title.className = 'shot-title';
      title.textContent = shot.title;
      const stamp = document.createElement('span');
      stamp.className = 'shot-time';
      stamp.textContent = time(start) + (shot.loop_duplicate_of ? ' · 루프 복귀' : '');
      const progress = document.createElement('span');
      progress.className = 'shot-progress';
      copy.append(top, title, stamp);
      button.append(img, copy, progress);
      button.addEventListener('click', () => selectCut(i));
      fragment.append(button);
    });
    $('filmstrip').replaceChildren(fragment);
    $('filmstrip').scrollLeft = 0;
    $('scrubber').max = total();
    $('collectionCount').textContent = `${timeline.length}컷 · ${total().toFixed(2)}초`;
    $('timelineDuration').textContent = `${total().toFixed(2)}초`;
  }

  function togglePlay() {
    if (!video.paused) video.pause();
    else if (video.ended) {
      const restart = $('continuous').checked && index === timeline.length - 1 ? 0 : index;
      selectCut(restart);
    } else requestPlay();
  }

  $('groups').addEventListener('click', event => {
    const button = event.target.closest('button[data-group]');
    if (!button || button.dataset.group === group) return;
    group = button.dataset.group;
    timeline = makeTimeline(data.shots.filter(shot => group === 'all' || shot.id.startsWith(group)));
    document.querySelectorAll('#groups button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderTimeline();
    selectCut(0);
  });
  $('play').addEventListener('click', togglePlay);
  $('stagePlay').addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);
  $('previous').addEventListener('click', () => selectCut(index - 1));
  $('next').addEventListener('click', () => selectCut(index + 1));
  $('speed').addEventListener('change', () => { video.playbackRate = Number($('speed').value); });
  $('continuous').addEventListener('change', () => {
    $('repeat').disabled = !$('continuous').checked;
    preloadNext();
    message($('continuous').checked ? '컷이 끝나면 다음 컷으로 이어집니다.' : '현재 컷이 끝나면 멈춥니다.');
  });
  $('repeat').addEventListener('change', preloadNext);
  $('retry').addEventListener('click', () => selectCut(index));
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('stage').requestFullscreen) await $('stage').requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { message('이 브라우저에서는 전체 화면을 열 수 없습니다.'); }
  });
  $('scrubber').addEventListener('pointerdown', () => { scrubbing = true; });
  window.addEventListener('pointerup', () => { scrubbing = false; });
  $('scrubber').addEventListener('input', () => {
    const point = locateTime(timeline, $('scrubber').value);
    const wasPlaying = !video.paused;
    if (point.index !== index) selectCut(point.index, { play: wasPlaying, offset: point.offset });
    else {
      pendingTime = point.offset;
      if (video.readyState) video.currentTime = point.offset;
      updateClock();
    }
  });
  $('scrubber').addEventListener('change', () => { scrubbing = false; updateClock(); });
  $('copyPrompt').addEventListener('click', async () => {
    const shot = current().shot;
    let copied = false;
    try { await navigator.clipboard.writeText(shot.prompt); copied = true; }
    catch {
      $('prompt').focus();
      $('prompt').select();
      try { copied = document.execCommand('copy'); } catch { /* Selection stays available. */ }
    }
    message(copied ? `${shot.id} 프롬프트를 복사했습니다.` : '프롬프트를 선택했습니다. Ctrl+C로 복사해 주세요.');
    if (current().shot.id === shot.id) {
      $('copyPrompt').textContent = copied ? '복사 완료 ✓' : 'Ctrl+C로 복사';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { $('copyPrompt').textContent = '프롬프트 복사 ⧉'; }, 2000);
    }
  });
  video.addEventListener('play', () => { updatePlaying(); message(`${current().shot.id} 재생 중 · ${$('continuous').checked ? '다음 컷 자동 연결' : '이 컷만 재생'}`); });
  video.addEventListener('pause', updatePlaying);
  video.addEventListener('timeupdate', updateClock);
  video.addEventListener('seeked', updateClock);
  video.addEventListener('ended', () => {
    const next = nextCut(index, timeline.length, $('continuous').checked, $('repeat').checked);
    if (next !== null) selectCut(next);
    else { updatePlaying(); message($('continuous').checked ? '선택한 모음을 모두 재생했습니다. 다시 재생하거나 다른 컷을 선택하세요.' : `${current().shot.id} 재생 완료 · 다음 컷을 선택하거나 다시 재생하세요.`); }
  });
  video.addEventListener('error', () => {
    $('errorText').textContent = `${current().shot.id} 영상을 불러오지 못했습니다. HTML과 컷 폴더가 같은 위치에 있는지 확인해 주세요.`;
    $('mediaError').hidden = false;
    message(`${current().shot.id} 불러오기 실패`);
    updatePlaying();
  });
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,button,a,summary,[contenteditable=true]')) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    else if (event.code === 'ArrowRight') { event.preventDefault(); selectCut(index + 1); }
    else if (event.code === 'ArrowLeft') { event.preventDefault(); selectCut(index - 1); }
  });
  renderTimeline();
  selectCut(0);
})();
