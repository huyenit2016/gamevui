// Phố Đêm 3D · vòng lặp trò chơi: cảnh, ngày/đêm, điều khiển (bàn phím + cảm ứng), lên/xuống xe, giao thông AI,
// hệ thống truy nã (cảnh sát), nhiệm vụ (giao hàng, taxi, đua phố), bản đồ nhỏ, âm thanh, lưu tiến trình.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { City, N, CELL, HALF, roadC } from './city.js';
import { Vehicle, collideCars, lightMats, TYPES } from './vehicle.js';
import { Player, Ped, driveAI, policeAI, snapEdge } from './entities.js';
import { Sound, STATIONS } from './audio.js';

const $ = id => document.getElementById(id), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a);
const store = { get(k, d) { try { const v = localStorage.getItem('phodem3d_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('phodem3d_' + k, JSON.stringify(v)); } catch (e) {} } };
const touchMode = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent); document.body.classList.toggle('touch', touchMode);

/* ---------- chất lượng ---------- */
const QS = { low: { traffic: 12, peds: 14, shadow: 0, pr: 1, bloom: false }, mid: { traffic: 20, peds: 24, shadow: 1024, pr: 1.5, bloom: false }, high: { traffic: 28, peds: 36, shadow: 2048, pr: 2, bloom: true } };
const qParam = new URLSearchParams(location.search).get('q'); let qName = QS[qParam] ? qParam : store.get('q', 'auto'); if (!QS[qName]) qName = touchMode || innerWidth < 800 ? 'low' : 'high'; const Q = QS[qName];
$('sQ').value = store.get('q', 'auto'); $('sQ').onchange = e => { store.set('q', e.target.value); location.reload(); };

/* ---------- renderer & cảnh ---------- */
const canvas = $('c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q.bloom, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pr)); renderer.setSize(innerWidth, innerHeight, false);
if (Q.shadow) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const scene = new THREE.Scene(), sky = new THREE.Color(0x070b17); scene.background = sky; scene.fog = new THREE.Fog(sky, 90, 560);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
const sun = new THREE.DirectionalLight(0xffffff, 3), moon = new THREE.DirectionalLight(0x6f8fd0, 0.3), hemi = new THREE.HemisphereLight(0xbcd6ff, 0x20242b, 0.3); scene.add(sun, sun.target, moon, hemi);
if (Q.shadow) { sun.castShadow = true; sun.shadow.mapSize.set(Q.shadow, Q.shadow); Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 260 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; }
const starsGeo = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + 0.12, r = 900; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 1, fog: false })); scene.add(stars);
let composer = null; function buildComposer() { if (!Q.bloom) return; const w = innerWidth, h = innerHeight, pr = renderer.getPixelRatio(); composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: 4 })); composer.setPixelRatio(pr); composer.setSize(w, h); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.6, 0.85)); composer.addPass(new OutputPass()); }
buildComposer(); addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (composer) composer.setSize(innerWidth, innerHeight); });

/* ---------- thế giới ---------- */
const city = new City({ aniso: renderer.capabilities.getMaxAnisotropy() }); scene.add(city.group);
const vehicles = [], peds = [], police = [], player = new Player(); scene.add(player.mesh);
const COLORS = [0xc0392b, 0x2c3e50, 0xf1c40f, 0x27ae60, 0xecf0f1, 0x8e44ad, 0xe67e22, 0x16a085, 0x95a5a6, 0x1d1d1f, 0x3498db, 0xd63384];
function spawn(type, color, x, z, yaw) { const v = new Vehicle(type, color); v.place(x, z, yaw); scene.add(v.mesh); vehicles.push(v); return v; }
const START = { x: roadC(4) - 9.5, z: roadC(4) + 12 }; player.teleport(START.x, START.z); player.yaw = Math.PI / 2;
const startCar = spawn('sport', 0xe0402a, roadC(4) - 5.25, roadC(4) + 15, 0); startCar.input.brk = 1;
for (let k = 0, n = 0; k < 90 && n < 24; k++) { // xe đỗ ở mép vỉa hè
  const p = city.randomRoadPoint(); if (!p) continue; const c0 = roadC(p.k), s = Math.sign((p.vert ? p.x : p.z) - c0), x = p.vert ? c0 + s * 8.3 : p.x, z = p.vert ? p.z : c0 + s * 8.3;
  if (vehicles.some(v => Math.hypot(v.x - x, v.z - z) < 7)) continue; const t = ['hatch', 'sedan', 'sedan', 'van', 'sport', 'hatch'][Math.random() * 6 | 0]; spawn(t, COLORS[Math.random() * COLORS.length | 0], x, z, p.yaw).input.brk = 1; n++;
}
const trafficTypes = ['hatch', 'sedan', 'sedan', 'van', 'taxi', 'hatch', 'sedan', 'sport'];
function spawnTraffic() { const p = city.randomRoadPoint(70, player); if (!p) return null; if (vehicles.some(v => Math.hypot(v.x - p.x, v.z - p.z) < 9)) return null; const t = trafficTypes[Math.random() * trafficTypes.length | 0], v = spawn(t, t === 'taxi' ? 0xf2c230 : COLORS[Math.random() * COLORS.length | 0], p.x, p.z, p.yaw); v.ai = { speed: rnd(8, 13) }; snapEdge(v, city); v.vx = Math.sin(v.yaw) * 6; v.vz = Math.cos(v.yaw) * 6; v.traffic = true; return v; }
for (let k = 0; k < Q.traffic * 3 && vehicles.filter(v => v.traffic).length < Q.traffic; k++) spawnTraffic();
for (let k = 0; k < Q.peds; k++) { const p = new Ped(); scene.add(p.mesh); peds.push(p); }
const headSpot = new THREE.SpotLight(0xfff0d0, 0, 70, 0.55, 0.6, 1.2); headSpot.target.position.set(0, 0, 20); scene.add(headSpot, headSpot.target);

/* ---------- âm thanh ---------- */
const sound = new Sound();

/* ---------- trạng thái ---------- */
const S = { running: false, hour: 18.2, t: 0, money: store.get('money', 300), best: store.get('race', 0), heat: 0, unseen: 0, busted: 0, arrest: 0, stuckMsg: 0, camShake: 0, hitCd: 0, pedCd: 0, paused: true, station: 1 };
const mis = { cur: null }; const cam = { yaw: Math.PI, pitch: 0.28, dist: 5.6, car: 8.5, user: 0, last: new THREE.Vector3() };
const toast = (m, ms = 2400) => { const e = $('msg'); e.textContent = m; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms); };
const saveAll = () => { store.set('money', S.money); store.set('race', S.best); };

/* ---------- đầu vào ---------- */
const keys = new Set(), edge = new Set(), touch = { x: 0, y: 0, hand: 0, jump: 0, horn: 0 };
addEventListener('keydown', e => { if (e.repeat) { if (/Space|Arrow/.test(e.code)) e.preventDefault(); return; } keys.add(e.code); edge.add(e.code); if (/Space|Arrow/.test(e.code)) e.preventDefault(); sound.init(); });
addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
const K = (...c) => c.some(x => keys.has(x)), E = c => edge.has(c);
canvas.addEventListener('pointerdown', e => { cam.drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); sound.init(); });
canvas.addEventListener('pointermove', e => { const d = cam.drag; if (!d || d.id !== e.pointerId) return; cam.yaw -= (e.clientX - d.x) * 0.005; cam.pitch = clamp(cam.pitch + (e.clientY - d.y) * 0.004, -0.15, 1.2); d.x = e.clientX; d.y = e.clientY; cam.user = 2.5; });
canvas.addEventListener('pointerup', () => cam.drag = null); canvas.addEventListener('pointercancel', () => cam.drag = null);
canvas.addEventListener('wheel', e => { e.preventDefault(); if (player.vehicle) cam.car = clamp(cam.car * (1 + Math.sign(e.deltaY) * 0.1), 4.5, 18); else cam.dist = clamp(cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 2.2, 12); }, { passive: false });
(() => { const J = $('joy'), Kn = J.firstElementChild; let id = null; const set = e => { const r = J.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1, l = Math.min(1, Math.hypot(x, y)) / (Math.hypot(x, y) || 1); touch.x = x * l; touch.y = y * l; Kn.style.transform = `translate(${touch.x * 40}px,${touch.y * 40}px)`; };
  J.addEventListener('pointerdown', e => { id = e.pointerId; J.setPointerCapture(id); set(e); sound.init(); }); J.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const end = () => { id = null; touch.x = touch.y = 0; Kn.style.transform = ''; }; J.addEventListener('pointerup', end); J.addEventListener('pointercancel', end); })();
const tbtn = (id, down, up) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); down(); sound.init(); }); const u = () => { b.classList.remove('on'); up && up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); };
tbtn('tF', () => edge.add('KeyF')); tbtn('tE', () => edge.add('KeyE')); tbtn('tH', () => touch.horn = 1, () => touch.horn = 0); tbtn('tJ', () => { touch.hand = 1; touch.jump = 1; }, () => { touch.hand = 0; touch.jump = 0; }); tbtn('tR', () => edge.add('KeyR')); tbtn('tP', () => edge.add('Escape'));

/* ---------- lên / xuống xe ---------- */
function nearestCar(r = 4.6) { let best = null, bd = r; for (const v of vehicles) { if (v.ai || v.driver || v.type === 'police') continue; const d = Math.hypot(v.x - player.x, v.z - player.z) - v.T.len * 0.25; if (d < bd) { bd = d; best = v; } } return best; }
function enterCar(v) { player.vehicle = v; v.driver = 'player'; v.input.brk = 0; player.mesh.visible = false; cam.user = 0; sound.chime(440); }
function exitCar() {
  const v = player.vehicle; if (!v) return; const c = Math.cos(v.yaw), s = Math.sin(v.yaw), L = v.T.wid / 2 + 0.9; let px = v.x + c * L, pz = v.z - s * L; if (city.solidAt(px, pz)) { px = v.x - c * L; pz = v.z + s * L; }
  player.teleport(px, pz); player.yaw = v.yaw; player.vehicle = null; v.driver = null; v.input.thr = v.input.str = 0; v.input.brk = 1; v.input.hand = 0; player.mesh.visible = true; cam.user = 0; cam.yaw = v.yaw + Math.PI;
}

/* ---------- ngày / đêm ---------- */
const cDay = new THREE.Color(0x8cc4f2), cDusk = new THREE.Color(0xf09a60), cNight = new THREE.Color(0x070b17), tmpC = new THREE.Color(); let night = 0.9;
function updateSky(dt) {
  S.hour = (S.hour + dt * 24 / 720) % 24; const a = (S.hour - 6) / 12 * Math.PI, el = Math.sin(a), day = clamp((el + 0.12) / 0.4, 0, 1), dusk = clamp(1 - Math.abs(el) / 0.3, 0, 1); night = 1 - day;
  sky.copy(cNight).lerp(cDay, day); if (el > -0.2) sky.lerp(cDusk, dusk * 0.55 * (1 - Math.abs(el) / 0.3 > 0 ? 1 : 0)); scene.fog.color.copy(sky);
  const f = player.vehicle ? new THREE.Vector3(player.vehicle.x, 0, player.vehicle.z) : new THREE.Vector3(player.x, 0, player.z), sd = new THREE.Vector3(-Math.cos(a), Math.max(0.12, el), 0.4).normalize();
  sun.position.copy(f).addScaledVector(sd, 120); sun.target.position.copy(f); sun.intensity = 3.4 * day; sun.color.copy(tmpC.set(0xffffff).lerp(cDusk, dusk * 0.7)); if (Q.shadow) sun.castShadow = day > 0.05;
  moon.position.copy(f).add(new THREE.Vector3(60, 90, -40)); moon.intensity = 1.6 * night; hemi.intensity = 0.8 + 0.4 * day; hemi.color.set(night > 0.5 ? 0x6f88c4 : 0xbcd6ff); hemi.groundColor.set(night > 0.5 ? 0x1c2330 : 0x20242b);
  city.update(night, S.t); lightMats.head.emissiveIntensity = 0.3 + night * 3; lightMats.tail.emissiveIntensity = 0.4 + night * 1.5; stars.material.opacity = clamp(night * 1.2 - 0.1, 0, 1); renderer.toneMappingExposure = 1 + night * 0.15;
  const hh = Math.floor(S.hour), mm = Math.floor((S.hour - hh) * 60); $('clock').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* ---------- nhiệm vụ ---------- */
const MT = { delivery: { n: 'Giao hàng', i: '📦', c: 0xffb347 }, taxi: { n: 'Taxi', i: '🚕', c: 0xffe14a, car: true }, race: { n: 'Đua phố', i: '🏁', c: 0x35e3ff, car: true } };
const mkBeam = c => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); const b = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 20, 1, true), m); b.position.y = 35; const r = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.4, 40), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.9, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.position.y = 0.3; g.add(b, r); g.userData = { b, r, m }; scene.add(g); return g; };
const starts = ['delivery', 'delivery', 'taxi', 'taxi', 'race', 'race'].map(type => { const m = { type, x: 0, z: 0, g: mkBeam(MT[type].c), cd: 0 }; return m; });
function placeStart(m) { for (let k = 0; k < 30; k++) { const i = 1 + Math.random() * (N - 1) | 0, j = 1 + Math.random() * (N - 1) | 0, x = roadC(i), z = roadC(j); if (Math.hypot(x - player.x, z - player.z) < 60 || starts.some(o => o !== m && Math.hypot(o.x - x, o.z - z) < 90)) continue; m.x = x; m.z = z; break; } m.g.position.set(m.x, 0, m.z); m.g.visible = true; m.cd = 0; }
starts[0].x = roadC(4); starts[0].z = roadC(4) - 2; starts[0].g.position.set(starts[0].x, 0, starts[0].z); starts.slice(1).forEach(placeStart);
const tgtBeam = mkBeam(0xffffff); tgtBeam.visible = false;
const randNode = (from, a, b) => { for (let k = 0; k < 40; k++) { const i = 1 + Math.random() * (N - 1) | 0, j = 1 + Math.random() * (N - 1) | 0, x = roadC(i), z = roadC(j), d = Math.hypot(x - from.x, z - from.z); if (d >= a && d <= b) return [x, z, d]; } return [roadC(1 + Math.random() * (N - 1) | 0), roadC(1 + Math.random() * (N - 1) | 0), 200]; };
function setTarget(x, z, color) { mis.cur.tx = x; mis.cur.tz = z; tgtBeam.position.set(x, 0, z); tgtBeam.userData.m.color.setHex(color); tgtBeam.userData.r.material.color.setHex(color); tgtBeam.visible = true; }
function startMission(m) {
  const T = MT[m.type], pos = { x: m.x, z: m.z }; if (T.car && !player.vehicle) return toast('Cần lái xe để nhận việc này');
  if (m.type === 'race') { const cps = []; let p = pos, tot = 0; for (let k = 0; k < 6; k++) { const n = randNode(p, 80, 220); cps.push([n[0], n[1]]); tot += n[2]; p = { x: n[0], z: n[1] }; } mis.cur = { type: 'race', m, cps, ci: 0, t: tot / 12 + 18, reward: Math.round(300 + tot * 0.55), t0: 0, hits: 0 }; setTarget(cps[0][0], cps[0][1], T.c); }
  else { const n = randNode(pos, 140, 340), spd = m.type === 'taxi' ? 9 : 7; mis.cur = { type: m.type, m, t: n[2] / spd + 32, reward: Math.round((m.type === 'taxi' ? 160 : 120) + n[2] * 0.95), hits: 0, dist: n[2] }; setTarget(n[0], n[1], T.c); }
  mis.cur.total = mis.cur.t; m.g.visible = false; toast(`${T.i} ${T.n}: bắt đầu!`); sound.chime(520);
}
function endMission(ok, why) {
  const c = mis.cur; if (!c) return; if (ok) { const bonus = Math.round(Math.max(0, c.t) * 2), pen = c.type === 'taxi' ? Math.min(c.hits * 20, c.reward / 2) : 0, pay = Math.round(c.reward + bonus - pen); S.money += pay; toast(`✔ ${MT[c.type].n} xong! +$${pay}`, 3200); sound.chime(784); if (c.type === 'race' && (!S.best || c.total - c.t < S.best)) { S.best = Math.round(c.total - c.t); } } else toast(`✘ ${why || 'Nhiệm vụ thất bại'}`, 3000);
  c.m.cd = 12; c.m.g.visible = false; tgtBeam.visible = false; mis.cur = null; saveAll(); setTimeout(() => { if (!mis.cur) placeStart(c.m); }, 12000);
}
function updateMission(dt) {
  const c = mis.cur; if (!c) return; c.t -= dt; const px = player.vehicle ? player.vehicle.x : player.x, pz = player.vehicle ? player.vehicle.z : player.z; if (c.t <= 0) return endMission(false, 'Hết giờ!');
  const T = MT[c.type], d = Math.hypot(c.tx - px, c.tz - pz);
  if (c.type === 'race') { if (d < 11) { c.ci++; sound.chime(600 + c.ci * 80); if (c.ci >= c.cps.length) return endMission(true); setTarget(c.cps[c.ci][0], c.cps[c.ci][1], T.c); c.t += 6; } }
  else if (d < 5.5 && (c.type !== 'taxi' || player.vehicle)) return endMission(true);
  $('obj').style.display = 'block'; $('oT').textContent = `${T.i} ${T.n}`; const ts = Math.max(0, c.t); $('oD').textContent = (c.type === 'race' ? `Điểm ${c.ci + 1}/${c.cps.length} · ` : '') + `${Math.round(d)} m · ${Math.floor(ts / 60)}:${String(Math.floor(ts % 60)).padStart(2, '0')}` + (c.type === 'taxi' && !player.vehicle ? ' · Quay lại xe!' : '');
}

/* ---------- truy nã & cảnh sát ---------- */
const STATION = { x: roadC(1) + 9, z: roadC(1) + 9 };
const stars$ = $('stars'); const wanted = () => Math.min(5, Math.ceil(S.heat - 0.001));
function addHeat(h) { const before = wanted(); S.heat = Math.min(5, S.heat + h); S.unseen = 0; if (wanted() > before) toast('★'.repeat(wanted()) + ' Cảnh sát đang truy đuổi!', 2200); }
function spawnPolice() { const p = city.randomRoadPoint(120, player, 240); if (!p) return; if (vehicles.some(v => Math.hypot(v.x - p.x, v.z - p.z) < 9)) return; const v = spawn('police', 0xeef1f5, p.x, p.z, p.yaw); v.siren = true; v.ai = {}; v.police = true; v.vx = Math.sin(p.yaw) * 8; v.vz = Math.cos(p.yaw) * 8; police.push(v); }
function removePolice(v) { scene.remove(v.mesh); vehicles.splice(vehicles.indexOf(v), 1); police.splice(police.indexOf(v), 1); }
function updateWanted(dt) {
  const w = wanted(), tx = player.vehicle ? player.vehicle.x : player.x, tz = player.vehicle ? player.vehicle.z : player.z, target = { x: tx, z: tz };
  const want = w === 0 ? 0 : w === 5 ? 6 : w; S.spawnT = (S.spawnT || 0) - dt; if (police.length < want && S.spawnT <= 0) { spawnPolice(); S.spawnT = 2.5; }
  let near = 1e9, closePolice = false; for (const v of police) { const d = Math.hypot(v.x - tx, v.z - tz); near = Math.min(near, d); if (d > 420 || (w === 0 && d > 120)) { removePolice(v); continue; } policeAI(v, dt, city, target, !player.vehicle && d < 20 ? 'hold' : 'chase'); if (d < (player.vehicle ? 10 : 8)) closePolice = true; }
  if (w > 0) { const sees = near < 90; if (sees) S.unseen = 0; else S.unseen += dt; if (S.unseen > 6) S.heat = Math.max(0, S.heat - dt * 0.12); if (S.heat <= 0 && w > 0) toast('Bạn đã cắt đuôi cảnh sát', 2200); }
  const slow = !player.vehicle || player.vehicle.speed < 5; if (w > 0 && closePolice && slow) S.busted += dt; else S.busted = Math.max(0, S.busted - dt * 1.5);
  if (S.busted > 2.2 && !S.arrest) arrest();
  const s = wanted(); stars$.innerHTML = Array.from({ length: 5 }, (_, i) => i < s ? '<b>★</b>' : '☆').join(''); stars$.classList.toggle('flash', s > 0 && near < 160);
}
function arrest() {
  S.arrest = 1; $('fade').style.opacity = 1; setTimeout(() => {
    const fine = Math.min(S.money, Math.round(S.money * 0.1 + 50)); S.money -= fine; if (player.vehicle) { const v = player.vehicle; player.vehicle = null; v.driver = null; v.input.brk = 1; player.mesh.visible = true; }
    player.teleport(STATION.x, STATION.z); player.yaw = Math.PI / 2; S.heat = 0; S.busted = 0; [...police].forEach(removePolice); if (mis.cur) endMission(false, 'Bị bắt!'); saveAll(); toast(`Bị bắt! Mất $${fine}`, 3200);
    setTimeout(() => { $('fade').style.opacity = 0; S.arrest = 0; }, 500);
  }, 600);
}
function onCarHit(A, B, rel) {
  if (rel < 2.5) return; const pc = A.driver === 'player' ? A : B.driver === 'player' ? B : null, other = pc === A ? B : A;
  if (pc) { sound.crash(rel); S.camShake = Math.min(0.6, rel * 0.04); if (S.hitCd <= 0 && rel > 5 && !other.police) { S.hitCd = 0.9; addHeat(other.traffic || other.driver ? 0.45 : 0.2); } else if (other.police && rel > 4 && S.hitCd <= 0) { S.hitCd = 0.9; addHeat(0.5); } }
}

/* ---------- camera ---------- */
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
function updateCamera(dt) {
  const v = player.vehicle; cam.user = Math.max(0, cam.user - dt);
  if (v) { const vf = v.vf, hd = Math.atan2(v.vx, v.vz), tgt = v.yaw + Math.PI; let want = tgt; if (v.speed > 6 && vf > 0) want = wrap(lerp(0, wrap(hd + Math.PI - tgt), 0.35)) + tgt; if (cam.user <= 0) cam.yaw += wrap(want - cam.yaw) * Math.min(1, dt * 3.2); cam.pitch += ((0.22 + clamp(v.speed / 160, 0, 0.1)) - cam.pitch) * Math.min(1, dt * (cam.user > 0 ? 0 : 2)); camTarget.set(v.x, 1.4, v.z); }
  else camTarget.set(player.x, player.y + 1.55, player.z);
  const D = v ? cam.car + v.speed * 0.06 : cam.dist, cp = Math.cos(cam.pitch); let d = D; const dx = Math.sin(cam.yaw) * cp, dy = Math.sin(cam.pitch), dz = Math.cos(cam.yaw) * cp;
  for (let k = 0; k < 8; k++) { const px = camTarget.x + dx * d, pz = camTarget.z + dz * d, py = camTarget.y + dy * d; if (py > 0.4 && !city.solidAt(px, pz, py)) break; d *= 0.85; if (d < 1.2) break; }
  camPos.set(camTarget.x + dx * d, Math.max(0.35, camTarget.y + dy * d), camTarget.z + dz * d); camera.position.lerp(camPos, 1 - Math.exp(-dt * 18));
  S.camShake = Math.max(0, S.camShake - dt * 1.5); if (S.camShake > 0) camera.position.add(new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(S.camShake * 0.15));
  camera.lookAt(camTarget); const fov = 62 + (v ? clamp(v.speed * 0.32, 0, 18) : 0); if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
}

/* ---------- bản đồ nhỏ ---------- */
const mini = $('mini'), mx = mini.getContext('2d'), MS = 0.9;
function drawMini() {
  const W = mini.width, c = W / 2, v = player.vehicle, px = v ? v.x : player.x, pz = v ? v.z : player.z, yaw = v ? v.yaw : cam.yaw + Math.PI, k = W / 176 * MS;
  mx.clearRect(0, 0, W, W); mx.save(); mx.beginPath(); mx.arc(c, c, c - 3, 0, 7); mx.clip(); mx.fillStyle = '#10151d'; mx.fillRect(0, 0, W, W);
  mx.translate(c, c); mx.rotate(yaw + Math.PI); const s = N * CELL * k; mx.drawImage(city.mini, -(px + HALF) * k, -(pz + HALF) * k, s, s);
  const dot = (x, z, col, r = 5, sq = false) => { let dx = (x - px) * k, dz = (z - pz) * k; const d = Math.hypot(dx, dz), lim = c - 14; if (d > lim) { dx *= lim / d; dz *= lim / d; } mx.fillStyle = col; mx.beginPath(); sq ? mx.rect(dx - r, dz - r, r * 2, r * 2) : mx.arc(dx, dz, r, 0, 7); mx.fill(); };
  for (const m of starts) if (m.g.visible && !mis.cur) dot(m.x, m.z, '#' + MT[m.type].c.toString(16).padStart(6, '0'), 7, true);
  if (mis.cur) { dot(mis.cur.tx, mis.cur.tz, '#ffffff', 8, true); dot(mis.cur.tx, mis.cur.tz, '#' + MT[mis.cur.type].c.toString(16).padStart(6, '0'), 5, true); }
  for (const p of police) dot(p.x, p.z, Math.sin(S.t * 8) > 0 ? '#ff3b3b' : '#3b7bff', 5);
  mx.restore(); mx.save(); mx.translate(c, c); mx.fillStyle = '#fff'; mx.strokeStyle = '#000'; mx.lineWidth = 2; mx.beginPath(); mx.moveTo(0, -11); mx.lineTo(8, 9); mx.lineTo(0, 5); mx.lineTo(-8, 9); mx.closePath(); mx.fill(); mx.stroke(); mx.restore();
}

/* ---------- vòng lặp ---------- */
const clock = new THREE.Clock(); let hudT = 0;
function readFoot() { return { mx: (K('KeyD', 'ArrowRight') ? 1 : 0) - (K('KeyA', 'ArrowLeft') ? 1 : 0) + touch.x, mz: (K('KeyW', 'ArrowUp') ? 1 : 0) - (K('KeyS', 'ArrowDown') ? 1 : 0) - touch.y, run: K('ShiftLeft', 'ShiftRight') || Math.hypot(touch.x, touch.y) > 0.93, jump: E('Space') || touch.jump }; }
function driveInput(v) {
  const I = v.input, up = K('KeyW', 'ArrowUp') || touch.y < -0.25, dn = K('KeyS', 'ArrowDown') || touch.y > 0.25, vf = v.vf; I.thr = 0; I.brk = 0;
  if (up) I.thr = touch.y < -0.25 ? clamp(-touch.y * 1.2, 0, 1) : 1; if (dn) { if (vf > 1.5) I.brk = 1; else I.thr = -1; }
  I.str = clamp((K('KeyD', 'ArrowRight') ? 1 : 0) - (K('KeyA', 'ArrowLeft') ? 1 : 0) + touch.x * 1.3, -1, 1); I.hand = K('Space') || touch.hand ? 1 : 0;
}
function frame() {
  requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), 0.05);
  if (S.running && edge.has('Escape')) { edge.delete('Escape'); toggleMenu(); }
  if (S.running && !S.paused) { S.t += dt; update(dt); } edge.clear();
  if (S.paused || !S.running) { camera.position.set(START.x + Math.sin(S.t * 0.1) * 30, 14, START.z + Math.cos(S.t * 0.1) * 30); camera.lookAt(START.x, 3, START.z); S.t += dt; updateSky(dt * 0.3); }
  if (composer) composer.render(dt); else renderer.render(scene, camera);
}
function update(dt) {
  S.hitCd -= dt; const pv = player.vehicle;
  if (E('KeyM')) sound.toggle(); if (E('KeyR')) { const n = (sound.station + 1) % STATIONS.length; sound.init(); sound.setStation(n); S.station = n; toast('📻 ' + STATIONS[n]); } if (E('KeyT')) { S.hour = (S.hour + 3) % 24; toast('Tua nhanh thời gian'); }
  if (!S.arrest) {
    if (pv) { driveInput(pv); if (E('KeyF')) exitCar(); } else { player.update(dt, readFoot(), cam.yaw, city); if (E('KeyF')) { const v = nearestCar(); if (v) enterCar(v); } }
    sound.horn(K('KeyH') || touch.horn);
  }
  // AI & vật lý
  for (const v of vehicles) { if (v.traffic) driveAI(v, dt, city, vehicles); }
  for (const v of vehicles) { if (!v.ai && v.driver === null && v.speed < 0.04 && Math.abs(v.yawRate) < 0.01 && !v.input.thr) { continue; } const imp = v.step(dt, city); if (imp > 5 && v.driver === 'player') { sound.crash(imp); S.camShake = Math.min(0.5, imp * 0.03); } }
  collideCars(vehicles, onCarHit); if (pv) { player.x = pv.x; player.z = pv.z; }
  for (const p of peds) p.update(dt, vehicles, pv || player, (v, ped) => { if (v.driver === 'player' && S.pedCd <= 0) { S.pedCd = 1.2; addHeat(0.9); toast('Tai nạn! Người đi bộ bị hất ngã', 1800); } sound.crash(3); });
  S.pedCd -= dt;
  // xe giao thông ở xa: tái sinh gần người chơi
  S.recT = (S.recT || 0) - dt; if (S.recT <= 0) { S.recT = 1.5; const px = pv ? pv.x : player.x, pz = pv ? pv.z : player.z, far = vehicles.find(v => v.traffic && Math.hypot(v.x - px, v.z - pz) > 340); if (far) { scene.remove(far.mesh); vehicles.splice(vehicles.indexOf(far), 1); spawnTraffic(); } }
  updateWanted(dt); updateMission(dt); updateSky(dt);
  // marker nhiệm vụ
  for (const m of starts) { if (m.g.visible) { m.g.userData.r.rotation.z += dt; m.g.userData.m.opacity = 0.22 + 0.08 * Math.sin(S.t * 3); } }
  if (tgtBeam.visible) { tgtBeam.userData.r.rotation.z -= dt * 1.4; tgtBeam.userData.m.opacity = 0.3 + 0.1 * Math.sin(S.t * 5); }
  // gợi ý thao tác
  let prompt = ''; if (!pv) { const v = nearestCar(); if (v) prompt = `<kbd>F</kbd>Lên xe: ${v.T.name}`; }
  if (!mis.cur) { const px = pv ? pv.x : player.x, pz = pv ? pv.z : player.z; for (const m of starts) if (m.g.visible && Math.hypot(m.x - px, m.z - pz) < 5.5 && (!pv || pv.speed < 12)) { prompt = `<kbd>E</kbd>Nhận việc: ${MT[m.type].i} ${MT[m.type].n}`; if (E('KeyE')) startMission(m); break; } }
  $('prompt').style.display = prompt && !S.arrest ? 'block' : 'none'; if (prompt) $('prompt').innerHTML = prompt;
  if (!mis.cur) $('obj').style.display = 'none';
  updateCamera(dt);
  // âm thanh
  if (pv) { sound.setEngine(true, clamp(Math.abs(pv.vf) / pv.T.max, 0, 1), Math.max(0, pv.input.thr)); sound.screech(pv.speed > 8 && pv.slip > 0.5 ? pv.slip : 0); } else { sound.setEngine(false, 0, 0); sound.screech(0); }
  let sv = 0; for (const p of police) { const d = Math.hypot(p.x - camera.position.x, p.z - camera.position.z); sv = Math.max(sv, 1 - d / 150); } sound.siren(Math.max(0, sv), S.t);
  // đèn pha xe người chơi ban đêm
  if (pv && night > 0.25) { headSpot.intensity = 90 * night; headSpot.position.set(pv.x + Math.sin(pv.yaw) * 2.2, 0.9, pv.z + Math.cos(pv.yaw) * 2.2); headSpot.target.position.set(pv.x + Math.sin(pv.yaw) * 22, 0, pv.z + Math.cos(pv.yaw) * 22); } else headSpot.intensity = 0;
  hudT -= dt; if (hudT <= 0) { hudT = 0.1; $('money').textContent = '$' + S.money.toLocaleString('vi-VN'); $('speed').style.display = pv ? 'block' : 'none'; $('radio').style.display = pv && sound.station ? 'block' : 'none'; if (pv) { $('spv').textContent = Math.round(Math.abs(pv.vf) * 3.6); $('radio').textContent = '📻 ' + STATIONS[sound.station]; } drawMini(); }
}

/* ---------- menu ---------- */
function toggleMenu() { S.paused = !S.paused; $('menu').hidden = !S.paused; if (S.paused) { saveAll(); $('bStart').textContent = 'Tiếp tục'; sound.setEngine(false, 0, 0); sound.screech(0); sound.horn(false); } updateSaveInfo(); }
function updateSaveInfo() { $('saveInfo').textContent = `Tiền hiện có: $${S.money.toLocaleString('vi-VN')}` + (S.best ? ` · Kỷ lục đua phố: ${S.best} giây` : '') + (touchMode ? ' · Chế độ cảm ứng: cần trái điều khiển, nút bên phải: F lên/xuống xe, E nhận việc.' : ''); }
$('bStart').onclick = () => { S.running = true; sound.init(); if (S.paused) toggleMenu(); sound.setStation(S.station); };
$('bBack').onclick = () => { saveAll(); location.href = '../../index.html'; };
$('bReset').onclick = () => { if (confirm('Xoá tiền và kỷ lục?')) { S.money = 300; S.best = 0; saveAll(); updateSaveInfo(); } };
addEventListener('pagehide', saveAll); updateSaveInfo(); $('menu').hidden = false; updateSky(0); frame();
window.PD = { S, player, vehicles, police, peds, city, mis, starts, cam, camera, scene, renderer, enterCar, exitCar, startMission, endMission, addHeat, wanted, toggleMenu, startCar, spawnPolice, sound };
