// Character Lab 3D · cảnh, ánh sáng PBR, hậu kỳ theo mức chất lượng, điều khiển người chơi, máy quay điện ảnh,
// tự điều chỉnh đồ hoạ theo FPS và giao diện kiểm định. Chỉ dùng tài sản người dùng nạp (không có nhân vật dựng sẵn bằng khối hình học).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { makeLoader, loadGLTF, normalize, upgradeMaterials, buildLODs, analyze, ARKIT, morphKey, SKIN, reassignKind, listMaterials, detectFacing } from './pipeline.js';
import { CharacterRig } from './rig.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (t, ms = 2600) => { const e = $('toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = 'none', ms); };
const prog = (t, p) => { $('load').hidden = p === null; if (t) $('lt').textContent = t; if (p != null) $('lb').style.width = Math.round(p * 100) + '%'; };

/* ---------- Renderer & cảnh ---------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.info.autoReset = false;
const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
const GPU = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'WebGL2';
const scene = new THREE.Scene();
// Nền = vòm cầu (không dùng scene.background dạng texture: GTAOPass vẽ sai vùng đen khi nền là texture)
scene.background = new THREE.Color(0x0b0d10);
const gradTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#05070a'); g.addColorStop(0.45, '#151a22'); g.addColorStop(0.52, '#1c222b'); g.addColorStop(1, '#0d0f12'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const dome = new THREE.Mesh(new THREE.SphereGeometry(90, 48, 24), new THREE.MeshBasicMaterial({ map: gradTex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
dome.renderOrder = -1; dome.castShadow = dome.receiveShadow = false; scene.add(dome);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 200); camera.position.set(0, 1.6, 3.4);
const pmrem = new THREE.PMREMGenerator(renderer);
let envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture; scene.environment = envTex;

// ánh sáng: key ấm có bóng (bám theo nhân vật), rim lạnh phía sau, fill từ môi trường
const key = new THREE.DirectionalLight(0xfff0dd, 3.2); key.position.set(2.5, 4.5, 3); key.castShadow = true;
Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 2.6, bottom: -0.6, near: 0.5, far: 14 }); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.025;
const rim = new THREE.DirectionalLight(0xbfd6ff, 2.2); rim.position.set(-3, 3, -4);
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 0.25);
scene.add(key, key.target, rim, hemi);

// sàn studio: bê tông mịn vẽ bằng canvas (màu + độ nhám), nhận bóng
function floorTex() {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
  x.fillStyle = '#26282c'; x.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i++) { const v = 28 + Math.random() * 26 | 0; x.fillStyle = `rgba(${v},${v},${v + 3},.25)`; x.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; for (let i = 0; i <= s; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, s); x.moveTo(0, i); x.lineTo(s, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 24); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.42, metalness: 0, envMapIntensity: 0.6 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
scene.fog = new THREE.Fog(0x111419, 14, 38);

/* ---------- Chất lượng & hậu kỳ ---------- */
const PRESETS = {
  low: { pr: 0.75, shadow: 1024, ao: false, msaa: 0, ssr: false },
  mid: { pr: 1, shadow: 2048, ao: true, msaa: 4, ssr: false },
  high: { pr: 1.5, shadow: 2048, ao: true, msaa: 4, ssr: false },
  ultra: { pr: 2, shadow: 4096, ao: true, msaa: 4, ssr: true },
};
const ORDER = ['low', 'mid', 'high', 'ultra'];
const S = { quality: 'auto', preset: 'high', mode: 'play', aoOn: true, dofOn: true, sss: 1, char: null, rig: null, gltf: null, report: null, perf: null, loaded: false };
let composer, gtao, bokeh, ssr;
function buildComposer() {
  const P = PRESETS[S.preset], pr = Math.min(devicePixelRatio || 1, P.pr), w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: P.msaa });
  composer = new EffectComposer(renderer, rt); composer.setPixelRatio(pr); composer.setSize(w, h);
  if (P.ssr) { ssr = new SSRPass({ renderer, scene, camera, width: w, height: h, selects: [floor] }); ssr.thickness = 0.02; ssr.infiniteThick = false; ssr.maxDistance = 1.2; ssr.opacity = 0.55; composer.addPass(ssr); }
  else { ssr = null; composer.addPass(new RenderPass(scene, camera)); }
  gtao = null; if (P.ao && S.aoOn) { gtao = new GTAOPass(scene, camera, w, h); gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1, scale: 1, samples: S.preset === 'mid' ? 8 : 16 }); gtao.blendIntensity = 1; composer.addPass(gtao); }
  bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.0018, maxblur: 0.006 }); bokeh.enabled = S.mode === 'cine' && S.dofOn && S.preset !== 'low'; composer.addPass(bokeh);
  composer.addPass(new OutputPass());
  key.shadow.mapSize.set(P.shadow, P.shadow); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', () => buildComposer());

/* ---------- Nạp nhân vật ---------- */
const loader = makeLoader(renderer);
async function loadCharacter(src, label) {
  try {
    prog('Đang tải ' + (label || 'nhân vật') + '…', 0.05);
    const t0 = performance.now(), gltf = await loadGLTF(loader, src, p => prog(null, 0.05 + p * 0.7));
    prog('Đang chuẩn hoá và nâng cấp vật liệu…', 0.8);
    if (S.char) { scene.remove(S.char); S.rig && S.rig.dispose(); }
    const root = gltf.scene; const norm = normalize(root);
    const kinds = upgradeMaterials(root, renderer, { msaa: PRESETS[S.preset].msaa > 0 });
    const lods = buildLODs(root);
    root.traverse(o => { if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.boundingSphere.radius *= 1.4; } });
    // bọc trong nhóm điều khiển: xoay sẵn 180° nếu tệp quay mặt về −Z, để +Z của nhóm luôn là hướng trước mặt
    const facing = detectFacing(root), holder = new THREE.Group(); holder.name = 'Character'; if (facing < 0) root.rotation.y += Math.PI; holder.add(root);
    scene.add(holder); S.char = holder; S.gltf = gltf; S.facing = facing;
    const rig = new CharacterRig(root, gltf.animations); rig.facing = holder; S.rig = rig; rig.setExpression('neutral'); rig.lookAt = S.mode === 'play' ? 0 : 1;
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
    S.loadMs = Math.round(performance.now() - t0); S.norm = norm; S.kinds = kinds; S.lods = lods; S.loaded = true;
    S.player = { pos: new THREE.Vector3(), yaw: 0, v: 0 };
    if (norm.bust) { orbit.dist = 0.85; orbit.pitch = 0.05; setMode('studio'); } else if (S.mode === 'studio' && orbit.dist < 1.5) orbit.dist = 3.4;
    refreshReport(); $('intake').hidden = true; prog(null, null);
    toast(`Đã nạp ${label || 'nhân vật'} · ${S.report.tris.toLocaleString('vi-VN')} tam giác · ${S.loadMs} ms${norm.note ? ' · ' + norm.note : ''}`, 4000);
    renderTabs(); return true;
  } catch (e) { console.error(e); prog(null, null); toast('Không nạp được tệp: ' + (e.message || e), 5000); if (!S.loaded) $('intake').hidden = false; return false; }
}
function refreshReport() {
  const rig = S.rig, loco = rig ? { idle: !!rig.loco.idle, walk: !!rig.loco.walk, run: !!rig.loco.run } : {};
  S.report = analyze(S.char, Object.assign({}, S.gltf, { animations: rig ? rig.clips : S.gltf.animations }), { loco, lods: S.lods, height: S.norm.height });
  if (S.perf) S.report.checks.push(perfCheck(S.perf));
}
async function addAnimations(files) {
  if (!S.rig) return toast('Hãy nạp nhân vật trước.');
  let n = 0; for (const f of files) { try { const g = await loadGLTF(loader, await f.arrayBuffer()); const before = S.rig.clips.length; S.rig.addClips(g.animations, true); n += S.rig.clips.length - before; } catch (e) { toast('Lỗi tệp ' + f.name); } }
  refreshReport(); renderTabs(); toast(n ? `Đã thêm ${n} hoạt ảnh (khớp theo tên xương)` : 'Không có hoạt ảnh nào khớp xương của nhân vật', 4000);
}
async function loadHDR(file) {
  const url = URL.createObjectURL(file); const tex = await new RGBELoader().loadAsync(url); tex.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(tex).texture; envTex.dispose(); envTex = env; scene.environment = env; dome.material.map = tex; dome.material.toneMapped = true; dome.material.color.setScalar(0.6); dome.material.needsUpdate = true; scene.fog = null; URL.revokeObjectURL(url); toast('Đã áp ánh sáng HDR');
}

/* ---------- Điều khiển ---------- */
const keys = new Set(); const orbit = { yaw: 0.4, pitch: 0.12, dist: 3.4, drag: null }; const joy = { x: 0, y: 0 };
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys.add(e.code); if (e.code === 'KeyC') setMode({ play: 'studio', studio: 'cine', cine: 'play' }[S.mode]); });
addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', e => { orbit.drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { const d = orbit.drag; if (!d || d.id !== e.pointerId) return; orbit.yaw -= (e.clientX - d.x) * 0.006; orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + (e.clientY - d.y) * 0.004, -0.35, 1.1); d.x = e.clientX; d.y = e.clientY; });
canvas.addEventListener('pointerup', () => orbit.drag = null); canvas.addEventListener('pointercancel', () => orbit.drag = null);
canvas.addEventListener('wheel', e => { e.preventDefault(); orbit.dist = THREE.MathUtils.clamp(orbit.dist * (1 + Math.sign(e.deltaY) * 0.1), 0.6, 12); }, { passive: false });
(() => { const J = $('joy'), K = J.firstElementChild; let id = null; const set = e => { const r = J.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1, l = Math.min(1, Math.hypot(x, y)) / (Math.hypot(x, y) || 1); joy.x = x * l; joy.y = y * l; K.style.transform = `translate(${joy.x * 40}px,${joy.y * 40}px)`; };
  J.addEventListener('pointerdown', e => { id = e.pointerId; J.setPointerCapture(id); set(e); }); J.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const end = () => { id = null; joy.x = joy.y = 0; K.style.transform = ''; }; J.addEventListener('pointerup', end); J.addEventListener('pointercancel', end); })();

function setMode(m) {
  S.mode = m; document.body.classList.toggle('cine', m === 'cine'); document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
  if (bokeh) bokeh.enabled = m === 'cine' && S.dofOn && S.preset !== 'low'; if (S.rig) S.rig.lookAt = m === 'play' ? 0 : 1;
  $('hint').textContent = m === 'play' ? 'WASD/phím mũi tên: đi · Shift: chạy · kéo chuột: xoay máy quay · cuộn: thu phóng · C: đổi chế độ' : m === 'studio' ? 'Studio: kéo để xoay quanh nhân vật · cuộn để soi gần mặt · nhân vật nhìn theo máy quay' : 'Điện ảnh: máy quay tự lia + chiều sâu trường ảnh (DOF) lấy nét vào mặt';
  if (m === 'studio') orbit.yaw = (S.player ? S.player.yaw : 0) + Math.PI; // studio: nhìn chính diện
  S.cineT = 0;
}

const tmp = new THREE.Vector3(), headPos = new THREE.Vector3();
function update(dt, t) {
  const P = S.player, rig = S.rig;
  if (rig && P) {
    let ix = 0, iz = 0;
    if (S.mode === 'play') { if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1; ix += joy.x; iz += joy.y; }
    const mag = Math.min(1, Math.hypot(ix, iz)), run = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(joy.x, joy.y) > 0.92;
    const target = mag > 0.1 ? (run && rig.loco.run ? 4.2 : 1.4) * mag : (S.previewSpeed || 0);
    P.v = THREE.MathUtils.damp(P.v, target, 6, dt);
    if (mag > 0.1) { const a = Math.atan2(ix, iz) + orbit.yaw; let d = a - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 10); P.pos.x += Math.sin(a) * P.v * dt; P.pos.z += Math.cos(a) * P.v * dt; }
    P.pos.x = THREE.MathUtils.clamp(P.pos.x, -30, 30); P.pos.z = THREE.MathUtils.clamp(P.pos.z, -30, 30);
    S.char.position.x = P.pos.x; S.char.position.z = P.pos.z; S.char.rotation.y = P.yaw;
    rig.setSpeed(P.v); rig.updateAnim(dt);
  }
  // máy quay
  const focus = S.char ? S.char.position : tmp.set(0, 0, 0);
  const h = S.norm ? S.norm.height : 1.7;
  if (rig && rig.head) rig.head.getWorldPosition(headPos); else headPos.set(focus.x, h * 0.92, focus.z);
  if (S.mode === 'cine') {
    S.cineT = (S.cineT || 0) + dt; const a = S.cineT * 0.18 + (S.player ? S.player.yaw : 0), r = 1.25 + Math.sin(S.cineT * 0.3) * 0.35;
    camera.position.set(headPos.x + Math.sin(a) * r, headPos.y + 0.05 + Math.sin(S.cineT * 0.21) * 0.12, headPos.z + Math.cos(a) * r); camera.lookAt(headPos.x, headPos.y - 0.03, headPos.z);
    if (bokeh) bokeh.uniforms.focus.value = camera.position.distanceTo(headPos);
  } else {
    const ty = S.mode === 'studio' ? THREE.MathUtils.lerp(h * 0.55, headPos.y, THREE.MathUtils.clamp(1.6 - orbit.dist / 3, 0, 1)) : h * 0.85;
    const tgt = tmp.set(focus.x, ty, focus.z), cp = Math.cos(orbit.pitch);
    const want = new THREE.Vector3(tgt.x + Math.sin(orbit.yaw + Math.PI) * cp * orbit.dist, Math.max(0.15, tgt.y + Math.sin(orbit.pitch) * orbit.dist), tgt.z + Math.cos(orbit.yaw + Math.PI) * cp * orbit.dist);
    camera.position.lerp(want, 1 - Math.exp(-dt * 12)); camera.lookAt(tgt);
  }
  // bóng đổ bám nhân vật (frustum hẹp → bóng sắc nét)
  key.position.set(focus.x + 2.5, 4.5, focus.z + 3); key.target.position.copy(focus); rim.position.set(focus.x - 3, 3, focus.z - 4);
  if (rig) rig.updateFace(dt, camera);
}

/* ---------- Vòng lặp + tự điều chỉnh đồ hoạ ---------- */
const clock = new THREE.Clock(); const frames = []; let gov = { t: 0, low: 0, high: 0 }, bench = null;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), now = performance.now();
  update(dt, clock.elapsedTime);
  renderer.info.reset(); composer.render(dt);
  frames.push(now); while (frames.length && frames[0] < now - 1000) frames.shift();
  if (bench) bench.ft.push(dt * 1000);
  gov.t += dt; if (gov.t > 2) { const fps = frames.length; gov.t = 0;
    if (S.quality === 'auto' && S.loaded && !bench) { if (fps < 45) { gov.low++; gov.high = 0; } else if (fps >= 58) { gov.high++; gov.low = 0; } else gov.low = gov.high = 0;
      const i = ORDER.indexOf(S.preset); if (gov.low >= 2 && i > 0) { setPreset(ORDER[i - 1]); toast('Tự giảm chất lượng: ' + S.preset); gov.low = 0; } else if (gov.high >= 4 && i < 2) { setPreset(ORDER[i + 1]); gov.high = 0; } } }
  hud(); requestAnimationFrame(frame);
}
function setPreset(p) { S.preset = p; buildComposer(); if (S.char) S.char.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { if (m.userData.kind === 'hair') { const ms = PRESETS[p].msaa > 0; m.alphaToCoverage = ms && !!(m.map || m.alphaMap); m.alphaHash = !ms && !!(m.map || m.alphaMap); m.needsUpdate = true; } }); }); }
function hud() {
  if ((hud.n = (hud.n || 0) + 1) % 10) return; const i = renderer.info, R = S.report;
  $('hud').innerHTML = `<b>${frames.length}</b> FPS · ${S.preset}${S.quality === 'auto' ? ' (tự động)' : ''}<br>Lượt vẽ ${i.render.calls} · Tam giác ${i.render.triangles.toLocaleString('vi-VN')}<br>Texture ${i.memory.textures} · Hình học ${i.memory.geometries}` +
    (R ? `<br>Nhân vật ${R.tris.toLocaleString('vi-VN')} tam giác · ${R.bones} xương · ${R.morphs} morph` : '') + `<br><span style="color:var(--mut)">${esc(GPU).slice(0, 48)}${navigator.gpu ? ' · có WebGPU' : ''}</span>`;
  if (S.rig && !$('t-anim').hidden) { const w = S.rig.weights(); ['idle', 'walk', 'run'].forEach(k => { const e = $('w-' + k); if (e) e.style.width = Math.round(((S.rig.actions[k] && S.rig.actions[k].getEffectiveWeight()) || 0) * 100) + '%'; }); }
}

/* ---------- Đo hiệu năng ---------- */
function perfCheck(p) { return { id: 'perf', name: `Hiệu năng (${p.preset}, ${p.secs}s)`, st: p.avg >= 55 ? 'pass' : p.avg >= 30 ? 'warn' : 'fail', val: `${p.avg} FPS · 1% thấp ${p.low1} · ${p.p95} ms p95`, tip: 'Mục tiêu ≥55 FPS trung bình trên máy mục tiêu.' }; }
async function runBench(secs = 6) {
  if (!S.loaded) return toast('Hãy nạp nhân vật trước.');
  const prevMode = S.mode; setMode('cine'); bench = { ft: [] }; toast(`Đang đo ${secs} giây ở mức ${S.preset}…`, secs * 1000);
  await new Promise(r => setTimeout(r, secs * 1000)); const ft = bench.ft.slice(10).sort((a, b) => a - b); bench = null; setMode(prevMode);
  if (!ft.length) return; const avgMs = ft.reduce((s, v) => s + v, 0) / ft.length, p99 = ft[Math.floor(ft.length * 0.99)] || ft[ft.length - 1], p95 = ft[Math.floor(ft.length * 0.95)] || p99;
  S.perf = { preset: S.preset, secs, avg: Math.round(1000 / avgMs), low1: Math.round(1000 / p99), p95: +p95.toFixed(1), frames: ft.length, gpu: GPU };
  refreshReport(); renderTabs(); toast(`Kết quả: ${S.perf.avg} FPS trung bình, 1% thấp ${S.perf.low1} FPS`, 4000); return S.perf;
}

/* ---------- Giao diện bảng ---------- */
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); document.querySelectorAll('.tb').forEach(t => t.hidden = t.id !== 't-' + b.dataset.t); renderTabs(); });
function renderTabs() {
  const R = S.report, rig = S.rig;
  if (!R) { $('t-val').innerHTML = '<p style="color:var(--mut)">Chưa có nhân vật. Bấm <b>Nhập nhân vật</b> để nạp GLB/GLTF.</p>'; ['t-anim', 't-face'].forEach(i => $(i).innerHTML = $('t-val').innerHTML); renderRen(); return; }
  const icon = { pass: '✓', warn: '!', fail: '✕' }, n = s => R.checks.filter(c => c.st === s).length;
  $('t-val').innerHTML = `<h3>Tổng quan</h3><div class="kv"><span>Đạt / Cảnh báo / Không đạt</span><span><b style="color:var(--ok)">${n('pass')}</b> / <b style="color:var(--warn)">${n('warn')}</b> / <b style="color:var(--bad)">${n('fail')}</b></span>
    <span>Chiều cao</span><span>${R.height} m</span><span>Thời gian nạp</span><span>${S.loadMs} ms</span><span>Extension glTF</span><span>${esc(R.ext.join(', ') || '—')}</span><span>Vật liệu</span><span>${R.materials} (${esc(R.kinds.join(', '))})</span></div>
    <h3>Danh sách kiểm định</h3>${R.checks.map(c => `<div class="ck ${c.st}"><span class="i">${icon[c.st]}</span><span>${esc(c.name)}<small>${esc(c.tip)}</small></span><span class="v">${esc(c.val)}</span></div>`).join('')}
    <div class="row" style="margin-top:12px"><button class="btn pri" id="bBench">Đo hiệu năng 6 giây</button><button class="btn" id="bJson">Xuất báo cáo JSON</button></div>
    <p style="color:var(--mut);font-size:12px">Đạt đủ các mục (nhất là hiệu năng trên máy mục tiêu) rồi mới nhân bản NPC (SkeletonUtils.clone + LOD).</p>`;
  $('bBench').onclick = () => runBench(6); $('bJson').onclick = () => { const b = new Blob([JSON.stringify({ report: R, perf: S.perf, gpu: GPU, preset: S.preset, at: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'character-report.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  // hoạt ảnh
  const L = rig.loco;
  $('t-anim').innerHTML = `<h3>Trộn di chuyển</h3>${['idle', 'walk', 'run'].map(k => `<div class="wl"><span>${k}</span><div class="bar"><i id="w-${k}" style="width:0"></i></div><span style="font-size:11px;color:var(--mut)">${L[k] ? 'có' : 'thiếu'}</span></div>`).join('')}
    <div class="row"><label style="flex:1">Tốc độ xem thử (studio) <input type="range" id="rSpd" min="0" max="4.2" step="0.1" value="${S.previewSpeed || 0}"></label></div>
    <p style="color:var(--mut);font-size:12px">Tốc độ tự nhiên đo từ quỹ đạo hông: walk ${rig.natural && rig.natural.walk ? rig.natural.walk.toFixed(2) + ' m/s' : '—'}, run ${rig.natural && rig.natural.run ? rig.natural.run.toFixed(2) + ' m/s' : '—'} (dùng để chỉnh tốc độ phát, tránh trượt chân). Vị trí gốc được khoá tại chỗ.</p>
    <h3>Clip (${rig.clips.length})</h3><div class="row">${rig.clips.map(c => `<button class="btn" data-clip="${esc(c.name)}">${esc(c.name)} · ${c.duration.toFixed(1)}s</button>`).join('') || '<span style="color:var(--mut)">Không có clip. Bấm “+ Hoạt ảnh”.</span>'}</div>`;
  $('rSpd').oninput = e => S.previewSpeed = +e.target.value;
  $('t-anim').querySelectorAll('[data-clip]').forEach(b => b.onclick = () => rig.play(b.dataset.clip));
  // khuôn mặt
  const have = new Set([...rig.morphIndex.keys()]), miss = ARKIT.filter(a => !have.has(morphKey(a)));
  $('t-face').innerHTML = !rig.hasFace() ? '<p style="color:var(--mut)">Nhân vật không có blendshape khuôn mặt. Cần xuất morph target (khuyến nghị bộ ARKit 52) để có biểu cảm và nhép môi.</p>' : `
    <h3>Biểu cảm</h3><div class="row">${['neutral', 'smile', 'surprise', 'angry', 'sad'].map(e => `<button class="btn" data-ex="${e}" aria-pressed="${rig.expr === e}">${{ neutral: 'Bình thường', smile: 'Cười', surprise: 'Ngạc nhiên', angry: 'Giận', sad: 'Buồn' }[e]}</button>`).join('')}</div>
    <h3>Nhép môi</h3><div class="row"><input type="text" id="iLip" value="Xin chào, tôi là nhân vật thử nghiệm." aria-label="Câu thoại"><button class="btn" id="bLip">Nói</button></div>
    <div class="row"><button class="btn" id="bMic">Micro</button><button class="btn" id="bAud">Tệp âm thanh</button><button class="btn" id="bStop">Dừng</button></div>
    <h3>Mắt nhìn theo máy quay</h3><input type="range" id="rLook" min="0" max="1" step="0.05" value="${rig.lookAt}">
    <h3>Blendshape ARKit: ${52 - miss.length}/52</h3><p style="color:var(--mut);font-size:12px">${miss.length ? 'Thiếu: ' + esc(miss.join(', ')) : 'Đủ bộ 52.'}</p>
    <p style="color:var(--mut);font-size:12px">Tổng ${R.morphs} morph trên ${rig.faceMeshes.length} mesh.</p>`;
  if (rig.hasFace()) {
    $('t-face').querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { rig.setExpression(b.dataset.ex); renderTabs(); });
    $('bLip').onclick = () => rig.lipText($('iLip').value); $('bStop').onclick = () => rig.lipStop();
    $('bMic').onclick = () => rig.lipMic().catch(() => toast('Không mở được micro (cần HTTPS và cấp quyền).'));
    $('bAud').onclick = () => $('fAudio').click(); $('rLook').oninput = e => rig.lookAt = +e.target.value;
  }
  renderRen();
}
function renderRen() {
  $('t-ren').innerHTML = `<h3>Tông màu</h3><div class="row"><select id="sTm"><option value="agx">AgX (điện ảnh)</option><option value="aces">ACES Filmic</option></select></div>
    <label>Phơi sáng <input type="range" id="rExp" min="0.3" max="2" step="0.05" value="${renderer.toneMappingExposure}"></label>
    <label>Cường độ môi trường <input type="range" id="rEnv" min="0" max="2" step="0.05" value="${S.envI ?? 1}"></label>
    <label>Đèn chính <input type="range" id="rKey" min="0" max="6" step="0.1" value="${key.intensity}"></label>
    <label>Tán xạ dưới da (SSS) <input type="range" id="rSss" min="0" max="2" step="0.05" value="${S.sss}"></label>
    <h3>Hậu kỳ</h3><div class="row"><label><input type="checkbox" id="cAo" ${S.aoOn ? 'checked' : ''}> Che khuất môi trường (GTAO)</label><label><input type="checkbox" id="cDof" ${S.dofOn ? 'checked' : ''}> Chiều sâu trường ảnh (chế độ Điện ảnh)</label></div>
    <p style="color:var(--mut);font-size:12px">Mức hiện tại: <b>${S.preset}</b>. Thấp: không AO/MSAA, bóng 1K · Vừa: AO + MSAA 4x, bóng 2K · Cao: thêm độ phân giải 1,5x · Siêu: bóng 4K, phản chiếu màn hình (SSR) trên sàn, độ phân giải 2x. Renderer: WebGL2 (WebGPU ${navigator.gpu ? 'có trên máy nhưng chưa dùng' : 'không có'}).</p>`;
  if (S.char) {
    const KS = { skin: 'Da (SSS)', eye: 'Mắt', cornea: 'Giác mạc', teeth: 'Răng/lưỡi', hair: 'Tóc/mi/lông mày', cloth: 'Vải', other: 'Khác' };
    const box = document.createElement('div'); box.innerHTML = '<h3>Gán loại vật liệu</h3><p style="color:var(--mut);font-size:12px">Tự nhận theo tên; chỉnh tay nếu tệp đặt tên lạ (vd. MetaHuman, scan).</p>';
    listMaterials(S.char).forEach(({ mat, meshes }) => { const r = document.createElement('div'); r.className = 'row';
      r.innerHTML = `<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(meshes.join(', '))}">${esc(mat.name || '(không tên)')}</span><select>${Object.entries(KS).map(([k, v]) => `<option value="${k}" ${mat.userData.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
      r.querySelector('select').onchange = e => { reassignKind(S.char, mat, e.target.value, renderer, PRESETS[S.preset].msaa > 0); S.kinds = null; refreshReport(); renderTabs(); toast('Đã đổi vật liệu sang: ' + KS[e.target.value]); };
      box.appendChild(r); });
    $('t-ren').appendChild(box);
  }
  $('sTm').value = renderer.toneMapping === THREE.ACESFilmicToneMapping ? 'aces' : 'agx';
  $('sTm').onchange = e => { renderer.toneMapping = e.target.value === 'aces' ? THREE.ACESFilmicToneMapping : THREE.AgXToneMapping; };
  $('rExp').oninput = e => renderer.toneMappingExposure = +e.target.value;
  $('rEnv').oninput = e => { S.envI = +e.target.value; scene.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { if ('envMapIntensity' in m) m.envMapIntensity = S.envI * (o === floor ? 0.6 : 1); }); }); };
  $('rKey').oninput = e => key.intensity = +e.target.value;
  $('rSss').oninput = e => { S.sss = +e.target.value; if (S.char) S.char.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { const u = m.userData.sss; if (u) { u.wrap.value.fromArray(SKIN.wrap).multiplyScalar(S.sss); u.trans.value = SKIN.trans * S.sss; } }); }); };
  $('cAo').onchange = e => { S.aoOn = e.target.checked; buildComposer(); };
  $('cDof').onchange = e => { S.dofOn = e.target.checked; if (bokeh) bokeh.enabled = S.mode === 'cine' && S.dofOn && S.preset !== 'low'; };
}

/* ---------- Nút & tệp ---------- */
$('bOpen').onclick = $('bOpen2').onclick = () => $('fModel').click();
$('bAnim').onclick = () => $('fAnim').click(); $('bHdr').onclick = () => $('fHdr').click();
$('fModel').onchange = async e => { const f = e.target.files[0]; if (f) await loadCharacter(await f.arrayBuffer(), f.name); e.target.value = ''; };
$('fAnim').onchange = async e => { await addAnimations([...e.target.files]); e.target.value = ''; };
$('fHdr').onchange = e => { const f = e.target.files[0]; if (f) loadHDR(f).catch(() => toast('Không đọc được tệp HDR')); e.target.value = ''; };
$('fAudio').onchange = e => { const f = e.target.files[0]; if (f && S.rig) S.rig.lipAudio(URL.createObjectURL(f)); e.target.value = ''; };
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('sQ').onchange = e => { S.quality = e.target.value; if (S.quality !== 'auto') setPreset(S.quality); };
$('bSide').onclick = () => { const s = $('side'); s.classList.toggle('hide'); $('bSide').setAttribute('aria-pressed', !s.classList.contains('hide')); };
const drop = $('drop');
['dragenter', 'dragover'].forEach(ev => addEventListener(ev, e => { e.preventDefault(); drop.classList.add('on'); }));
['dragleave', 'drop'].forEach(ev => addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('on'); }));
addEventListener('drop', async e => { const fs = [...(e.dataTransfer && e.dataTransfer.files || [])]; const m = fs.find(f => /\.(glb|gltf)$/i.test(f.name)); if (!m) return; if (S.loaded && fs.length && !confirm('Thay nhân vật hiện tại? (Bấm Huỷ để nạp tệp này như hoạt ảnh)')) return addAnimations(fs); await loadCharacter(await m.arrayBuffer(), m.name); });

/* ---------- Khởi động ---------- */
S.preset = (devicePixelRatio > 1.5 && innerWidth < 900) ? 'mid' : 'high';
buildComposer(); renderTabs(); requestAnimationFrame(frame);
(async () => {
  const q = new URLSearchParams(location.search), u = q.get('model');
  if (q.get('q') && PRESETS[q.get('q')]) { S.quality = q.get('q'); $('sQ').value = S.quality; setPreset(S.quality); }
  if (u && /^(https:\/\/|\.{0,2}\/|[\w-]+\/)[^\s"'<>]+\.(glb|gltf)$/i.test(u)) { if (await loadCharacter(u, u.split('/').pop())) return; }
  try { const r = await fetch('assets/hero.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); if (j && typeof j.model === 'string' && /^[\w./-]+\.(glb|gltf)$/i.test(j.model) && await loadCharacter('assets/' + j.model.replace(/^\.?\/?(assets\/)?/, ''), j.name || 'nhân vật')) {
    for (const a of (Array.isArray(j.anims) ? j.anims : [])) if (/^[\w./-]+\.(glb|gltf)$/i.test(a)) { try { const g = await loadGLTF(loader, 'assets/' + a.replace(/^\.?\/?(assets\/)?/, '')); S.rig.addClips(g.animations, true); } catch (e) {} }
    refreshReport(); renderTabs(); return; } } } catch (e) {}
  prog(null, null); $('intake').hidden = false;
})();

window.CL = { S, scene, renderer, camera, setMode, setPreset, runBench, loadCharacter, addAnimations, keys, orbit, PRESETS, passes: () => ({ composer, gtao, bokeh, ssr }) };
