// Character Lab · bộ điều khiển nhân vật: trộn hoạt ảnh di chuyển (idle ↔ walk ↔ run, đồng bộ pha),
// hoạt ảnh một lần, khoá vị trí gốc (in-place), biểu cảm qua blendshape ARKit, chớp mắt, nhép môi
// (micro/tệp âm thanh hoặc văn bản → viseme) và mắt/đầu nhìn theo máy quay.
import * as THREE from 'three';
import { morphKey, retargetClip } from './pipeline.js';

const pick = (clips, rx, not) => clips.find(c => rx.test(c.name) && !(not && not.test(c.name)));

export class CharacterRig {
  constructor(root, clips = []) {
    this.root = root; this.mixer = new THREE.AnimationMixer(root); this.clips = [];
    this.speed = 0; this.loco = {}; this.actions = {}; this.oneShot = null; this.inPlace = true;
    this.hips = null; root.traverse(o => { if (!this.hips && o.isBone && /hips|pelvis|root/i.test(o.name)) this.hips = o; });
    if (!this.hips) root.traverse(o => { if (!this.hips && o.isBone) this.hips = o; });
    this.head = null; this.eyes = []; root.traverse(o => { if (!o.isBone) return; if (!this.head && /(^|[^a-z])head$|head$/i.test(o.name) && !/top|end/i.test(o.name)) this.head = o; if (/eye/i.test(o.name) && !/brow|lid|lash|end|top/i.test(o.name)) this.eyes.push(o); });
    this.addClips(clips);
    // khuôn mặt
    this.faceMeshes = []; root.traverse(o => { if (o.isMesh && o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).length) this.faceMeshes.push(o); });
    this.morphIndex = new Map(); // key chuẩn → [{mesh, i}]
    for (const m of this.faceMeshes) for (const [n, i] of Object.entries(m.morphTargetDictionary)) { const k = morphKey(n); if (!this.morphIndex.has(k)) this.morphIndex.set(k, []); this.morphIndex.get(k).push({ m, i }); }
    this.target = {}; this.current = {}; this.blinkT = 2 + Math.random() * 3; this.blinkV = 0;
    this.lip = { mode: null, analyser: null, data: null, seq: null, t: 0, src: null, stream: null };
    this.lookAt = null; this.expr = 'neutral';
  }
  /* ---- hoạt ảnh ---- */
  addClips(clips, retarget = false) {
    for (let c of clips) {
      if (retarget) { c = retargetClip(c, this.root); if (!c) continue; }
      if (this.clips.some(x => x.name === c.name)) c = Object.assign(c.clone(), { name: c.name + '_' + this.clips.length });
      this.clips.push(c);
    }
    const C = this.clips.filter(c => !/t-?pose|a-?pose|bind/i.test(c.name));
    const idle = pick(C, /idle|breath|stand/i), walk = pick(C, /walk/i, /back|left|right|strafe/i), run = pick(C, /run|jog|sprint/i, /back|left|right|strafe/i);
    this.loco = { idle, walk, run };
    for (const k of ['idle', 'walk', 'run']) {
      const c = this.loco[k]; if (!c || (this.actions[k] && this.actions[k].getClip() === c)) continue;
      this.natural = this.natural || {}; this.natural[k] = this.measureSpeed(c);
      if (this.inPlace) this.makeInPlace(c);
      const a = this.mixer.clipAction(c); a.enabled = true; a.setEffectiveWeight(k === 'idle' ? 1 : 0); a.play(); this.actions[k] = a;
    }
    return this.loco;
  }
  measureSpeed(clip) { // tốc độ tự nhiên của clip (m/s) đo từ quỹ đạo hông, dùng để chỉnh timeScale tránh trượt chân
    const t = clip.tracks.find(t => this.hips && t.name === this.hips.name + '.position'); if (!t || t.times.length < 2) return 0;
    const v = t.values, n = v.length - 3, dx = v[n] - v[0], dz = v[n + 2] - v[2];
    let s = 1; this.root.traverse(o => { if (o === this.hips) { const w = new THREE.Vector3(); o.parent.getWorldScale(w); s = w.x; } });
    return Math.hypot(dx, dz) * s / clip.duration;
  }
  makeInPlace(clip) {
    if (!this.hips) return; const t = clip.tracks.find(t => t.name === this.hips.name + '.position'); if (!t) return;
    const v = t.values, x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  setSpeed(s, walkS = 1.4, runS = 4.2) { this.speed = s; this.walkS = walkS; this.runS = runS; }
  play(name, fade = 0.25) { // hoạt ảnh một lần (vẫy tay, nhảy…), xong tự về di chuyển
    const c = this.clips.find(c => c.name === name); if (!c) return false;
    if (this.oneShot) this.oneShot.fadeOut(fade);
    const a = this.mixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.setEffectiveWeight(1); a.fadeIn(fade); a.play(); this.oneShot = a;
    const done = e => { if (e.action === a) { this.mixer.removeEventListener('finished', done); a.fadeOut(fade); this.oneShot = null; } };
    this.mixer.addEventListener('finished', done); return true;
  }
  weights() {
    const s = this.speed, W = this.walkS || 1.4, R = this.runS || 4.2; let wi = 0, ww = 0, wr = 0;
    if (!this.actions.walk && !this.actions.run) wi = 1;
    else if (s <= 0.05) wi = 1;
    else if (s < W) { ww = s / W; wi = 1 - ww; }
    else if (s < R && this.actions.run) { wr = (s - W) / (R - W); ww = 1 - wr; }
    else if (this.actions.run) wr = 1; else ww = 1;
    if (!this.actions.walk) { wr += ww; ww = 0; } if (!this.actions.run) { ww += wr; wr = 0; } if (!this.actions.idle) { const t = ww + wr || 1; ww /= t; wr /= t; wi = 0; }
    return { idle: wi, walk: ww, run: wr };
  }
  updateAnim(dt) {
    const w = this.weights(), os = this.oneShot ? 1 - (this.oneShot.getEffectiveWeight() || 0) : 1;
    for (const k of ['idle', 'walk', 'run']) { const a = this.actions[k]; if (!a) continue; const cur = a.getEffectiveWeight(); a.setEffectiveWeight(THREE.MathUtils.damp(cur, w[k] * os, 10, dt)); }
    const nat = this.natural || {}, s = this.speed;
    if (this.actions.walk) this.actions.walk.timeScale = nat.walk ? THREE.MathUtils.clamp(Math.max(s, 0.6) / nat.walk, 0.5, 1.6) : 1;
    if (this.actions.run) this.actions.run.timeScale = nat.run ? THREE.MathUtils.clamp(Math.max(s, 2) / nat.run, 0.6, 1.5) : 1;
    if (this.actions.walk && this.actions.run && w.walk > 0 && w.run > 0) { // đồng bộ pha bước chân
      const a = this.actions.walk, b = this.actions.run; b.time = (a.time / a.getClip().duration) * b.getClip().duration;
    }
    this.mixer.update(dt);
  }
  /* ---- khuôn mặt ---- */
  hasFace() { return this.morphIndex.size > 0; }
  setMorph(key, v) { const l = this.morphIndex.get(key); if (l) for (const { m, i } of l) m.morphTargetInfluences[i] = v; }
  setExpression(name) {
    const E = {
      neutral: {},
      smile: { mouthsmilel: .8, mouthsmiler: .8, cheeksquintl: .45, cheeksquintr: .45, eyesquintl: .25, eyesquintr: .25 },
      surprise: { browinnerup: .8, browouterupl: .7, browouterupr: .7, eyewidel: .7, eyewider: .7, jawopen: .35 },
      angry: { browdownl: .9, browdownr: .9, eyesquintl: .45, eyesquintr: .45, nosesneerl: .5, nosesneerr: .5, mouthpressl: .4, mouthpressr: .4 },
      sad: { browinnerup: .75, mouthfrownl: .7, mouthfrownr: .7, eyelookdownl: .2, eyelookdownr: .2, mouthshruglower: .3 },
    };
    this.expr = name; this.target = Object.assign({}, E[name] || {});
  }
  updateFace(dt, cam) {
    if (!this.hasFace()) return this.updateLook(cam);
    const want = Object.assign({}, this.target);
    // chớp mắt tự nhiên 2–6 s/lần
    this.blinkT -= dt; if (this.blinkT <= 0) { this.blinkV = 1; this.blinkT = 2 + Math.random() * 4; }
    this.blinkV = Math.max(0, this.blinkV - dt * 7); const bl = this.blinkV > 0 ? Math.sin((1 - this.blinkV) * Math.PI) : 0;
    want.eyeblinkl = Math.max(want.eyeblinkl || 0, bl); want.eyeblinkr = Math.max(want.eyeblinkr || 0, bl);
    Object.assign(want, this.lipFrame(dt));
    const keys = new Set([...Object.keys(want), ...Object.keys(this.current)]);
    for (const k of keys) { const v = THREE.MathUtils.damp(this.current[k] || 0, want[k] || 0, k.startsWith('eyeblink') ? 40 : 14, dt); this.current[k] = v; this.setMorph(k, v); if (v < 1e-3 && !want[k]) delete this.current[k]; }
    this.updateLook(cam);
  }
  updateLook(cam) {
    if (!cam || !this.lookAt) return;
    // xoay tương đối (không phụ thuộc trục xương của từng rig): quay hướng "trước mặt" nhân vật về phía máy quay
    const tgt = cam.position, fwd = new THREE.Vector3(0, 0, 1).applyQuaternion((this.facing || this.root).getWorldQuaternion(new THREE.Quaternion())).normalize();
    for (const b of [this.head, ...this.eyes]) {
      if (!b || !b.parent) continue; b.updateWorldMatrix(true, false);
      const wp = b.getWorldPosition(new THREE.Vector3()), dir = tgt.clone().sub(wp).normalize();
      if (fwd.dot(dir) < 0.35) continue; // chỉ nhìn khi máy quay ở phía trước
      const lim = (b === this.head ? 0.55 : 0.9) * this.lookAt, delta = new THREE.Quaternion().setFromUnitVectors(fwd, dir);
      delta.slerp(new THREE.Quaternion(), 1 - lim);
      const world = delta.multiply(b.getWorldQuaternion(new THREE.Quaternion()));
      b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
    }
  }
  /* ---- nhép môi ---- */
  async lipMic() { this.lipStop(); const s = await navigator.mediaDevices.getUserMedia({ audio: true }); this.lip.stream = s; this.lipAnalyser(c => c.createMediaStreamSource(s), false); this.lip.mode = 'audio'; }
  lipAudio(url) { this.lipStop(); const el = new Audio(url); el.crossOrigin = 'anonymous'; el.play(); this.lip.el = el; this.lipAnalyser(c => c.createMediaElementSource(el), true); this.lip.mode = 'audio'; el.onended = () => this.lipStop(); }
  lipAnalyser(mk, out) {
    const C = this.lip.ctx || (this.lip.ctx = new (window.AudioContext || window.webkitAudioContext)()); C.resume && C.resume();
    const src = mk(C), an = C.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.6; src.connect(an); if (out) an.connect(C.destination);
    this.lip.src = src; this.lip.analyser = an; this.lip.data = new Uint8Array(an.frequencyBinCount);
  }
  lipText(text) { // văn bản → chuỗi viseme đơn giản (không cần âm thanh) để kiểm tra rig miệng
    this.lipStop(); const V = { a: 'A', ă: 'A', â: 'A', e: 'E', ê: 'E', i: 'I', y: 'I', o: 'O', ô: 'O', ơ: 'O', u: 'U', ư: 'U', m: 'M', b: 'M', p: 'M', f: 'F', v: 'F', ' ': '_' };
    const seq = [...String(text).toLowerCase().normalize('NFD').replace(/[̀-̣́̃̉]/g, '').normalize('NFC')].map(ch => V[ch] || (/[a-zđ]/.test(ch) ? 'C' : '_'));
    this.lip.seq = seq; this.lip.t = 0; this.lip.mode = 'text';
  }
  lipStop() { const L = this.lip; try { L.el && L.el.pause(); } catch (e) {} try { L.stream && L.stream.getTracks().forEach(t => t.stop()); } catch (e) {} try { L.src && L.src.disconnect(); } catch (e) {} Object.assign(L, { mode: null, analyser: null, seq: null, el: null, stream: null, src: null }); }
  lipFrame(dt) {
    const L = this.lip, o = {};
    if (L.mode === 'text' && L.seq) {
      L.t += dt * 13; const i = Math.floor(L.t); if (i >= L.seq.length) { this.lipStop(); return o; }
      const V = { A: { jawopen: .55, mouthstretchl: .15, mouthstretchr: .15 }, E: { jawopen: .3, mouthsmilel: .35, mouthsmiler: .35, mouthstretchl: .3, mouthstretchr: .3 }, I: { jawopen: .18, mouthsmilel: .45, mouthsmiler: .45 }, O: { jawopen: .4, mouthfunnel: .6 }, U: { jawopen: .2, mouthpucker: .75, mouthfunnel: .3 }, M: { mouthclose: .6, mouthpressl: .4, mouthpressr: .4 }, F: { mouthrolllower: .5, mouthupperupl: .2, mouthupperupr: .2, jawopen: .08 }, C: { jawopen: .22 }, _: {} };
      return Object.assign(o, V[L.seq[i]]);
    }
    if (L.mode === 'audio' && L.analyser) {
      const d = L.data; L.analyser.getByteFrequencyData(d); const hz = (L.ctx.sampleRate / 2) / d.length, band = (a, b) => { let s = 0, n = 0; for (let i = Math.floor(a / hz); i < Math.min(d.length, b / hz); i++) { s += d[i]; n++; } return n ? s / n / 255 : 0; };
      const lo = band(80, 300), mid = band(300, 2000), hi = band(2000, 6000), vol = Math.min(1, (lo + mid + hi) * 1.3);
      if (vol < 0.06) return o;
      o.jawopen = Math.min(0.8, vol * 0.9); o.mouthfunnel = Math.max(0, lo - mid) * 1.5; o.mouthpucker = Math.max(0, lo - hi) * 0.8; o.mouthstretchl = o.mouthstretchr = hi * 0.8; o.mouthsmilel = o.mouthsmiler = hi * 0.3;
    }
    return o;
  }
  dispose() { this.lipStop(); this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }
}
