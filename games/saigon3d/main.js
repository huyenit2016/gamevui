// Sài Gòn Du Ký 3D: logic chính, điều khiển, giao diện, âm thanh, hành trình du lịch.
import * as THREE from 'three';
import { LM, FOOD, EMOTES, titleOf, dirty } from './data.js';
import { makeTraveler, SKINS, TOPS, PANTS, BAGS, HAIRC, HATS, HAIRS, DEF, encodeAv, decodeAv, randomAv } from './char.js';
import { buildWorld } from './world.js';
import { Net } from './net.js';

const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, fmt = n => Math.round(n).toLocaleString('vi-VN'), pick = a => a[Math.floor(Math.random() * a.length)];
const isTouch = matchMedia('(pointer:coarse)').matches;

/* ============ 1. LƯU TRỮ (chỉ trên máy bạn) ============ */
const KEY = 'saigon3d_v1';
const save = Object.assign({ name: '', av: {}, xu: 100, pts: 0, visited: {}, quiz: {}, foods: {}, photoAt: {}, photos: 0, sound: true, tod: 'auto', names: true, shadows: !isTouch, tutDone: false, avDone: false, bonus: 0 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
save.av = Object.assign({}, DEF, save.av);
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
const nVisited = () => Object.keys(save.visited).length, nFoods = () => Object.keys(save.foods).length;
const myName = () => save.name || 'Du khách';

/* ============ 2. KHỞI TẠO 3D ============ */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' }); } catch (e) { $('err').style.display = 'grid'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .6, 1300);
const W = buildWorld(scene); W.setShadows(save.shadows); LM.forEach(l => W.mark(l.id, !!save.visited[l.id])); FOOD.forEach(f => W.mark(f.id, !!save.foods[f.id]));
const P = { pos: new THREE.Vector3(30, 0, 0), yaw: Math.PI / 2, vel: 0 };
let me = makeTraveler(save.av); scene.add(me.g);
const cam = { yaw: -Math.PI / 2, pitch: .3, dist: isTouch ? 12 : 10, front: false, pos: new THREE.Vector3(0, 6, 20), look: new THREE.Vector3() };
cam.pos.set(P.pos.x + 10, 5, P.pos.z); const vTmp = new THREE.Vector3(), vB = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3();
function rebuildMe() { scene.remove(me.g); me = makeTraveler(save.av); scene.add(me.g); }
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

/* ============ 3. ÂM THANH (WebAudio tự tạo) ============ */
const Snd = (() => {
  let ac, master;
  const tone = (f, t0, dur, type = 'sine', vol = .2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .05); };
  const horn = () => { if (!ac || !save.sound) return; const t = ac.currentTime; tone(720, t, .12, 'square', .04); tone(720, t + .2, .12, 'square', .04); };
  const loopHorn = () => setTimeout(() => { horn(); loopHorn(); }, 14000 + Math.random() * 26000);
  function start() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = save.sound ? .7 : 0; master.connect(ac.destination);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { b = .97 * b + .03 * (Math.random() * 2 - 1); d[i] = b * 3; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; const g = ac.createGain(); g.gain.value = .22; src.connect(lp); lp.connect(g); g.connect(master); src.start(); loopHorn();
  }
  return {
    start, setOn(on) { if (master) master.gain.value = on ? .7 : 0; },
    chime() { if (!ac || !save.sound) return; const t = ac.currentTime; [880, 1318, 1760].forEach((f, i) => tone(f, t + i * .08, 1.1, 'sine', .14)); },
    stamp() { if (!ac || !save.sound) return; const t = ac.currentTime; tone(110, t, .25, 'sine', .4); tone(220, t, .12, 'triangle', .2); setTimeout(() => this.chime(), 160); },
    click() { if (!ac || !save.sound) return; tone(520, ac.currentTime, .06, 'triangle', .08); },
    shutter() { if (!ac || !save.sound) return; const t = ac.currentTime; tone(1800, t, .04, 'square', .05); tone(900, t + .05, .06, 'square', .05); }
  };
})();

/* ============ 4. HUD, thông báo, bảng thông tin ============ */
let toastT = 0; const toast = (m, ms = 2600) => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); };
const updCounters = () => { $('cXu').textContent = fmt(save.xu); $('cPts').textContent = fmt(save.pts); };
function progress(xu, pts, msg) { save.xu += xu; save.pts += pts; persist(); updCounters(); Net.rankSave(myName(), save.pts, nVisited()); if (msg) toast(msg, 3200); }
let started = false;
const panelOpen = () => $('panel').classList.contains('on'), locked = () => panelOpen() || !started;
let panelClose = null;
function openPanel(title, html, o = {}) { $('pt').textContent = title; $('pb').innerHTML = html; $('panel').className = 'on' + (o.avp ? ' avp' : ''); panelClose = o.onClose || null; Snd.click(); }
function closePanel() { if (!panelOpen()) return; $('panel').className = ''; cam.front = false; const f = panelClose; panelClose = null; f && f(); }
$('px').onclick = closePanel; $('panel').addEventListener('pointerdown', e => { if (e.target.id === 'panel' && !$('panel').classList.contains('avp')) closePanel(); });
const bind = (sel, fn) => $('pb').querySelectorAll(sel).forEach(b => b.addEventListener('click', () => fn(b)));
const dateStr = ts => new Date(ts).toLocaleDateString('vi-VN');

/* ============ 5. ĐIỀU KHIỂN: cần ảo, WASD, kéo xoay, thu phóng ============ */
const keys = {}, isTyping = () => /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName);
addEventListener('keydown', e => { if (isTyping()) return; keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); }); addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const joy = { id: null, x: 0, y: 0, x0: 0, y0: 0 }, drag = { id: null, x: 0, y: 0 }, cv = $('c');
cv.addEventListener('pointerdown', e => {
  try { cv.setPointerCapture(e.pointerId); } catch (er) {} if (!started) return;
  if (joy.id === null && !locked() && (isTouch || e.pointerType !== 'mouse') && e.clientX < innerWidth * .5 && e.clientY > innerHeight * .35) { joy.id = e.pointerId; joy.x0 = e.clientX; joy.y0 = e.clientY; joy.x = joy.y = 0; const j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; $('joyGhost').style.display = 'none'; $('joy').firstElementChild.style.transform = ''; }
  else if (drag.id === null) { drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; }
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId === joy.id) { const dx = e.clientX - joy.x0, dy = e.clientY - joy.y0, l = Math.hypot(dx, dy), m = Math.min(l, 52); joy.x = l ? dx / l * m / 52 : 0; joy.y = l ? dy / l * m / 52 : 0; $('joy').firstElementChild.style.transform = `translate(${joy.x * 40}px,${joy.y * 40}px)`; }
  else if (e.pointerId === drag.id) { cam.yaw -= (e.clientX - drag.x) * .006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * .004, .1, 1.15); drag.x = e.clientX; drag.y = e.clientY; }
});
const pUp = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; $('joy').style.display = 'none'; if (isTouch) $('joyGhost').style.display = 'grid'; } if (e.pointerId === drag.id) drag.id = null; };
cv.addEventListener('pointerup', pUp); cv.addEventListener('pointercancel', pUp);
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .02, 5, 28); }, { passive: true });
$('zIn').onclick = () => cam.dist = clamp(cam.dist - 2.5, 5, 28); $('zOut').onclick = () => cam.dist = clamp(cam.dist + 2.5, 5, 28);
if (!isTouch) $('joyGhost').style.display = 'none';
$('bFull').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };

/* ============ 6. CỬ CHỈ ============ */
let emote = '', emoteT = 0;
function setEmote(id, dur) { emote = id; clearTimeout(emoteT); if (id) emoteT = setTimeout(() => { if (emote === id) emote = ''; }, dur || (id === 'selfie' ? 1600 : 3600)); }
document.querySelectorAll('#acts [data-e]').forEach(b => b.onclick = () => { if (locked()) return; Snd.click(); setEmote(b.dataset.e); });

/* ============ 7. DU LỊCH: check-in, hỏi đáp, ẩm thực, ảnh ============ */
let cur = null, curFood = null;
const lmDist = l => Math.hypot(P.pos.x - l.fx, P.pos.z - l.fz);
function nearest() {
  let best = null, bd = 1e9; for (const l of LM) { const d = lmDist(l); if (d < (l.r || 24) && d < bd) { bd = d; best = l; } } cur = best;
  let bf = null; bd = 1e9; for (const f of FOOD) { const d = Math.hypot(P.pos.x - f.x, P.pos.z - f.z); if (d < 5.5 && d < bd) { bd = d; bf = f; } } curFood = bf;
}
function checkIn(l) {
  if (save.visited[l.id]) return openGuide(l);
  save.visited[l.id] = Date.now(); W.mark(l.id, true); Snd.stamp(); progress(60, 10, `📍 Check-in ${l.n}: +60 xu, +10 điểm`);
  if (nVisited() === LM.length && !(save.bonus & 1)) { save.bonus |= 1; progress(300, 50, '🎉 Hộ chiếu đầy đủ! Bạn đã đến cả 9 điểm. Thưởng +300 xu, +50 điểm'); }
  openGuide(l);
}
function openGuide(l) {
  const v = save.visited[l.id];
  openPanel(l.n, `<div class="gh"><span>${l.icon}</span><div><b>${esc(l.n)}</b><small>${esc(l.yr)}${v ? ' · đã check-in ' + dateStr(v) : ''}</small></div></div>
    <p>${esc(l.info)}</p><p class="tip">💡 <b>Mẹo:</b> ${esc(l.tips)}</p>
    <div class="row">${v ? '' : '<button class="btn" data-a="ci">📍 Check-in</button>'}<button class="btn alt" data-a="qz">${save.quiz[l.id] ? '✅ Đã trả lời đúng' : '❓ Hỏi đáp +40 xu'}</button><button class="btn alt" data-a="ph">📷 Chụp ảnh</button></div>`);
  bind('[data-a]', b => { const a = b.dataset.a; if (a === 'ci') checkIn(l); else if (a === 'qz') { if (save.quiz[l.id]) toast('Bạn đã trả lời đúng câu này rồi.'); else openQuiz(l); } else { closePanel(); doPhoto(l); } });
}
function openQuiz(l) {
  const q = l.q, order = q.a.map((t, i) => [t, i]).sort(() => Math.random() - .5);
  openPanel('Hỏi đáp · ' + l.n, `<p class="qq">${esc(q.q)}</p><div class="opts">${order.map(([t, i]) => `<button class="btn alt" data-i="${i}">${esc(t)}</button>`).join('')}</div><p class="small" id="qm">Chọn một đáp án.</p>`);
  bind('[data-i]', b => { if (+b.dataset.i === q.c) { save.quiz[l.id] = 1; Snd.chime(); progress(40, 5, '✅ Chính xác! +40 xu, +5 điểm'); openGuide(l); } else { $('qm').textContent = 'Chưa đúng, bạn thử lại nhé 🙂'; b.disabled = true; } });
}
function eat(f) {
  if (save.foods[f.id]) { toast(`${f.icon} ${f.n}: bạn đã thưởng thức rồi, ngon lắm!`); return; }
  save.foods[f.id] = Date.now(); W.mark(f.id, true); Snd.chime(); setEmote('cheer', 2200); progress(15, 2, `${f.icon} ${f.n}: +15 xu, +2 điểm`);
  openPanel('Ẩm thực · ' + f.n, `<div class="gh"><span>${f.icon}</span><div><b>${esc(f.n)}</b><small>Món ăn đường phố Sài Gòn</small></div></div><p>${esc(f.info)}</p><p class="small">Đã nếm ${nFoods()}/${FOOD.length} món.</p>`);
  if (nFoods() === FOOD.length && !(save.bonus & 2)) { save.bonus |= 2; progress(150, 20, '🍜 Bạn đã nếm đủ 7 món! Thưởng +150 xu, +20 điểm'); }
}
let photoBusy = false;
function doPhoto(l) {
  if (photoBusy) return; photoBusy = true; const lm = l || cur; setEmote('selfie', 1700); toast('📷 Giữ yên nào…', 1200);
  setTimeout(async () => {
    $('flash').classList.add('on'); Snd.shutter(); setTimeout(() => $('flash').classList.remove('on'), 160);
    const blob = await capture(lm ? lm.n : 'Sài Gòn'); photoBusy = false; save.photos++;
    if (lm && !save.photoAt[lm.id]) { save.photoAt[lm.id] = 1; progress(10, 2); } persist();
    if (blob) await shareBlob(blob, 'sai-gon-du-ky.png', `Mình đang ở ${lm ? lm.n : 'Sài Gòn'} 📍`); else toast('Chưa tạo được ảnh, bạn thử lại nhé.');
  }, 1000);
}
async function capture(place) {
  cam.front = false; renderer.render(scene, camera); const src = renderer.domElement, c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d');
  const ar = 1080 / 1130; let cw = src.width, ch = cw / ar; if (ch > src.height) { ch = src.height; cw = ch * ar; } g.drawImage(src, (src.width - cw) / 2, (src.height - ch) / 2, cw, ch, 0, 0, 1080, 1130);
  const gr = g.createLinearGradient(0, 1000, 0, 1350); gr.addColorStop(0, 'rgba(20,14,10,0)'); gr.addColorStop(.3, 'rgba(20,14,10,.92)'); gr.addColorStop(1, '#140e0a'); g.fillStyle = gr; g.fillRect(0, 1000, 1080, 350);
  g.textAlign = 'center'; g.fillStyle = '#ffe9b8'; g.font = '700 70px system-ui,sans-serif'; g.fillText(place, 540, 1170); g.fillStyle = '#f3dcc0'; g.font = '36px system-ui,sans-serif'; g.fillText(`${myName()} · ${titleOf(save.pts)} · ${nVisited()}/${LM.length} điểm đến`, 540, 1228);
  g.fillStyle = '#c9a07a'; g.font = '30px system-ui,sans-serif'; g.fillText(`Sài Gòn Du Ký 3D · ${new Date().toLocaleDateString('vi-VN')}`, 540, 1296);
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); window.__lastShot = { size: blob ? blob.size : 0, place }; return blob;
}
async function shareBlob(blob, name, text) {
  const file = new File([blob], name, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Sài Gòn Du Ký 3D', text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast('Đã tải ảnh xuống máy 📷');
}
function travel(l) {
  if (save.xu < 10) return toast('Cần 10 xu để đi taxi. Hãy check-in thêm để nhận xu!'); closePanel(); save.xu -= 10; persist(); updCounters(); $('fade').classList.add('on'); Snd.click();
  setTimeout(() => { P.pos.set(l.fx + (Math.random() - .5) * 2, 0, l.fz + (Math.random() - .5) * 2); W.collide(P.pos, .45); P.yaw = Math.atan2(l.x - l.fx, l.z - l.fz); cam.yaw = P.yaw + Math.PI; setEmote(''); $('fade').classList.remove('on'); toast(`🚕 Đã tới ${l.n}`); }, 420);
}

/* ============ 8. CÁC BẢNG: hộ chiếu, bản đồ, ẩm thực, bạn bè, xếp hạng, chat, cảm xúc, thêm, cài đặt ============ */
function openPassport() {
  const lv = titleOf(save.pts);
  openPanel('Hộ chiếu du lịch', `<div class="pp"><b>${esc(myName())}</b><span>${lv}</span><span>🪙 ${fmt(save.xu)} · 💎 ${fmt(save.pts)}</span></div>
    <div class="stamps">${LM.map(l => { const v = save.visited[l.id]; return `<div class="stamp ${v ? 'on' : ''}" data-id="${l.id}"><span>${v ? l.icon : '？'}</span><b>${esc(l.n)}</b><small>${v ? dateStr(v) : 'Chưa đến'}</small></div>`; }).join('')}</div>
    <p class="small">Điểm đến ${nVisited()}/${LM.length} · Món ăn ${nFoods()}/${FOOD.length} · Hỏi đáp ${Object.keys(save.quiz).length}/${LM.length} · Ảnh ${save.photos}</p><div class="row"><button class="btn" data-a="sh">📤 Chia sẻ hộ chiếu</button></div>`);
  bind('.stamp', b => openGuide(LM.find(l => l.id === b.dataset.id))); bind('[data-a="sh"]', async () => { const blob = await passportImage(); blob && shareBlob(blob, 'ho-chieu-sai-gon.png', 'Hộ chiếu du lịch Sài Gòn của mình 🇻🇳'); });
}
async function passportImage() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 1350); gr.addColorStop(0, '#1d4d5c'); gr.addColorStop(1, '#10222b'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1350);
  g.textAlign = 'center'; g.fillStyle = '#ffe9b8'; g.font = '700 64px system-ui,sans-serif'; g.fillText('HỘ CHIẾU DU LỊCH SÀI GÒN', 540, 120); g.fillStyle = '#d8efe9'; g.font = '40px system-ui,sans-serif'; g.fillText(`${myName()} · ${titleOf(save.pts)}`, 540, 190);
  LM.forEach((l, i) => { const cx = 190 + (i % 3) * 350, cy = 400 + Math.floor(i / 3) * 330, v = save.visited[l.id]; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fillStyle = v ? 'rgba(255,210,120,.18)' : 'rgba(255,255,255,.05)'; g.fill(); g.lineWidth = 8; g.strokeStyle = v ? '#ffcc33' : 'rgba(255,255,255,.25)'; g.setLineDash(v ? [] : [14, 12]); g.stroke(); g.setLineDash([]);
    g.font = '110px serif'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(v ? l.icon : '？', cx, cy + 6); g.textBaseline = 'alphabetic'; g.font = '700 30px system-ui,sans-serif'; g.fillStyle = v ? '#ffe9b8' : '#8ba7ad'; g.fillText(l.n, cx, cy + 170); if (v) { g.font = '26px system-ui,sans-serif'; g.fillStyle = '#bfe5dc'; g.fillText(dateStr(v), cx, cy + 205); } });
  g.fillStyle = '#ffe9b8'; g.font = '700 44px system-ui,sans-serif'; g.fillText(`${nVisited()}/${LM.length} điểm đến · ${nFoods()}/${FOOD.length} món ăn · 💎 ${save.pts}`, 540, 1270); g.fillStyle = '#8fb4b9'; g.font = '30px system-ui,sans-serif'; g.fillText('Sài Gòn Du Ký 3D', 540, 1318);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
function drawMap(c) {
  const g = c.getContext('2d'), X = x => (x + 300) / 600 * c.width, Z = z => (z + 240) / 480 * c.height; g.fillStyle = '#7aa953'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#3b86a8'; g.fillRect(X(185), Z(-100), c.width - X(185), c.height - Z(-100)); g.strokeStyle = '#59595e'; g.lineWidth = 5; [[-170, -130, 170, -130], [-170, 150, 170, 150], [-170, -130, -170, 150], [170, -130, 170, 150], [-75, -130, -75, 150], [-170, -15, -75, -15]].forEach(([a, b, d, e]) => { g.beginPath(); g.moveTo(X(a), Z(b)); g.lineTo(X(d), Z(e)); g.stroke(); });
  g.strokeStyle = '#e8dcc0'; g.lineWidth = 8; g.beginPath(); g.moveTo(X(20), Z(0)); g.lineTo(X(165), Z(0)); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '17px serif'; LM.forEach(l => { const v = save.visited[l.id]; g.beginPath(); g.arc(X(l.x), Z(l.z), 12, 0, 7); g.fillStyle = v ? '#2fbf6b' : '#ffcc33'; g.fill(); g.fillStyle = '#000'; g.fillText(l.icon, X(l.x), Z(l.z) + 1); });
  R.forEach(r => { g.beginPath(); g.arc(X(r.pos.x), Z(r.pos.z), 4, 0, 7); g.fillStyle = '#4dd2ff'; g.fill(); });
  g.save(); g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.yaw + Math.PI); g.fillStyle = '#ff3b30'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 9); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function openMap() {
  openPanel('Bản đồ Sài Gòn', `<canvas id="map" width="560" height="448"></canvas><p class="small">Bản đồ cách điệu, không theo tỷ lệ thật. 🔴 bạn · 🟡 chưa đến · 🟢 đã đến · 🔵 du khách khác. Đi taxi tốn 10 xu.</p>
    <div class="list">${LM.map(l => `<div class="li"><span>${l.icon}</span><div><b>${esc(l.n)}</b><small>${Math.round(lmDist(l))} m · ${save.visited[l.id] ? '✅ đã đến' : 'chưa đến'}</small></div><button class="btn sm" data-id="${l.id}">🚕 Taxi</button></div>`).join('')}</div>`);
  drawMap($('map')); bind('[data-id]', b => travel(LM.find(l => l.id === b.dataset.id)));
}
function openFood() {
  openPanel('Sổ ẩm thực', `<p class="small">Đến các quầy ăn trên phố (vòng sáng cam) rồi bấm "Thưởng thức". Đã nếm ${nFoods()}/${FOOD.length} món.</p><div class="list">${FOOD.map(f => `<div class="li"><span>${f.icon}</span><div><b>${esc(f.n)}</b><small>${save.foods[f.id] ? esc(f.info) : 'Chưa nếm · cách bạn ' + Math.round(Math.hypot(P.pos.x - f.x, P.pos.z - f.z)) + ' m'}</small></div></div>`).join('')}</div>`);
}
function openFriends() {
  const list = [...R.values()].filter(r => r.visible);
  openPanel('Bạn bè trong thành phố', `<p>${Net.on ? `🟢 Đang online: <b>${list.length + 1}</b> người (kể cả bạn).` : '⚪ Bạn đang chơi một mình (chưa kết nối máy chủ).'}</p><div class="list">${list.map(r => `<div class="li"><span>🧳</span><div><b>${esc(r.name)}</b><small>cách bạn ${Math.round(Math.hypot(r.pos.x - P.pos.x, r.pos.z - P.pos.z))} m</small></div></div>`).join('') || '<div class="li"><div><small>Chưa có du khách nào khác gần đây. Mời bạn bè cùng vào nhé!</small></div></div>'}</div><div class="row"><button class="btn" data-a="w">🙋 Vẫy chào</button></div>`);
  bind('[data-a="w"]', () => { closePanel(); setEmote('wave'); });
}
async function openRank() {
  openPanel('Bảng xếp hạng lữ hành', '<p class="small">Đang tải…</p>');
  if (!Net.on) { $('pb').innerHTML = '<p>⚪ Cần kết nối online để xem bảng xếp hạng. Điểm của bạn: 💎 ' + fmt(save.pts) + '</p>'; return; }
  try { const top = await Net.rankTop(); if (!panelOpen()) return;
    $('pb').innerHTML = `<p class="small">Điểm do người chơi tự báo, chỉ mang tính vui. Bạn: 💎 ${fmt(save.pts)}</p><div class="list">${top.map((r, i) => `<div class="li ${r.id === Net.uid ? 'me' : ''}"><span>${['🥇', '🥈', '🥉'][i] || (i + 1)}</span><div><b>${esc(String(r.n).slice(0, 24))}</b><small>${r.k || 0}/${LM.length} điểm đến</small></div><b>💎 ${fmt(r.s)}</b></div>`).join('') || '<div class="li"><small>Chưa có ai trên bảng.</small></div>'}</div>`;
  } catch (e) { $('pb').innerHTML = '<p>Không tải được bảng xếp hạng. Bạn thử lại sau nhé.</p>'; }
}
const chatMsgs = [], seenChat = new Set(); let lastChat = 0;
const cleanName = s => { s = String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20); return !s || dirty(s) ? 'Du khách' : s; };
function chatAdd(id, v) { if (seenChat.has(id)) return; seenChat.add(id); chatMsgs.push({ n: cleanName(v.n), t: dirty(v.t) ? '***' : String(v.t).slice(0, 120), at: Date.now() }); if (chatMsgs.length > 40) chatMsgs.shift(); drawChatLog(); if (panelOpen() && $('chl')) drawChatPanel(); }
function drawChatLog() { const last = chatMsgs.slice(-3); $('chatlog').innerHTML = last.map(m => `<div><b>${esc(m.n)}:</b> ${esc(m.t)}</div>`).join(''); $('chatlog').classList.add('on'); clearTimeout(drawChatLog.t); drawChatLog.t = setTimeout(() => $('chatlog').classList.remove('on'), 9000); }
function drawChatPanel() { const el = $('chl'); el.innerHTML = chatMsgs.map(m => `<div><b>${esc(m.n)}:</b> ${esc(m.t)}</div>`).join('') || '<small>Chưa có tin nhắn. Hãy chào mọi người!</small>'; el.scrollTop = el.scrollHeight; }
function openChat() {
  openPanel('Trò chuyện', `<div id="chl" class="chl"></div><form id="chf" class="chf"><input id="chi" maxlength="120" placeholder="${Net.on ? 'Nhập lời chào…' : 'Chưa kết nối online'}" autocomplete="off"><button class="btn sm" type="submit">Gửi</button></form>`); drawChatPanel();
  $('chf').onsubmit = e => { e.preventDefault(); const t = $('chi').value.trim(); if (!t) return; if (dirty(t)) return toast('Tin nhắn có từ chưa phù hợp, bạn sửa lại nhé.'); if (Date.now() - lastChat < 1500) return toast('Bạn nhắn hơi nhanh, chậm lại một chút nhé.'); lastChat = Date.now(); $('chi').value = '';
    if (!Net.chatSend(myName(), t)) { chatAdd('l' + Date.now(), { n: myName(), t }); toast('Bạn đang chơi một mình nên chỉ mình bạn thấy tin này.'); } };
}
function openEmotes() { openPanel('Cảm xúc', `<div class="agrid">${EMOTES.map(e => `<button class="atile" data-e="${e.id}"><span>${e.icon}</span>${e.n}</button>`).join('')}</div>`); bind('[data-e]', b => { closePanel(); b.dataset.e === 'selfie' ? doPhoto(cur) : setEmote(b.dataset.e); }); }
function openMore() {
  openPanel('Thêm', `<div class="agrid"><button class="atile" data-m="av"><span>🧍</span>Nhân vật</button><button class="atile" data-m="guide"><span>📖</span>Cẩm nang</button><button class="atile" data-m="set"><span>⚙️</span>Cài đặt</button><button class="atile" data-m="tut"><span>❔</span>Hướng dẫn</button></div>`);
  bind('[data-m]', b => { const m = b.dataset.m; if (m === 'av') openAvatar(false); else if (m === 'guide') openGuideList(); else if (m === 'set') openSettings(); else tutorial(0); });
}
function openGuideList() { openPanel('Cẩm nang địa danh', `<div class="list">${LM.map(l => `<div class="li click" data-id="${l.id}"><span>${l.icon}</span><div><b>${esc(l.n)}</b><small>${esc(l.yr)}</small></div></div>`).join('')}</div>`); bind('[data-id]', b => openGuide(LM.find(l => l.id === b.dataset.id))); }
let todMode = save.tod, todH = 9;
function openSettings() {
  const tg = (k, label) => `<label class="tg"><input type="checkbox" data-k="${k}" ${save[k] ? 'checked' : ''}> ${label}</label>`;
  openPanel('Cài đặt', `${tg('sound', '🔊 Âm thanh')}${tg('names', '🏷️ Hiện tên người chơi')}${tg('shadows', '🌓 Đổ bóng (đẹp hơn, nặng máy hơn)')}
    <div class="avs"><b>Thời gian trong ngày</b><div class="chips">${[['auto', 'Tự động'], ['day', 'Ban ngày'], ['dusk', 'Hoàng hôn'], ['night', 'Ban đêm']].map(([k, n]) => `<button class="chip${save.tod === k ? ' on' : ''}" data-t="${k}">${n}</button>`).join('')}</div></div>
    <div class="row"><button class="btn alt" data-a="reset">🗑️ Xoá tiến trình trên máy này</button></div><p class="small">Dữ liệu chỉ lưu trên máy bạn; chỉ tên hiển thị, vị trí, tin nhắn và điểm được gửi lên khi chơi online.</p>`);
  bind('[data-k]', b => { const k = b.dataset.k; save[k] = b.checked; persist(); if (k === 'sound') Snd.setOn(save.sound); if (k === 'shadows') W.setShadows(save.shadows); });
  bind('[data-t]', b => { save.tod = todMode = b.dataset.t; persist(); openSettings(); });
  bind('[data-a="reset"]', () => { if (confirm('Xoá toàn bộ tiến trình (xu, điểm, check-in, nhân vật) trên máy này?')) { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); } });
}
const TUT = [['🕹️', 'Đi lại', isTouch ? 'Đặt ngón tay ở nửa trái màn hình rồi kéo để đi. Kéo nửa phải để xoay góc nhìn. Nút + − để thu phóng.' : 'Dùng phím W A S D hoặc phím mũi tên để đi, giữ Shift để chạy. Kéo chuột để xoay, lăn chuột để thu phóng.'], ['📍', 'Khám phá', 'Đi tới các vòng sáng vàng ở từng địa danh để Check-in, đọc giới thiệu, trả lời câu hỏi và chụp ảnh. Vòng cam là quầy ăn đường phố.'], ['🌏', 'Cùng chơi online', 'Bạn sẽ thấy du khách khác đi dạo cùng. Dùng thanh biểu tượng bên dưới: Hộ chiếu, Bản đồ, Ẩm thực, Bạn bè, Xếp hạng, Trò chuyện và Cảm xúc.']];
function tutorial(i) {
  const [ic, h, p] = TUT[i]; openPanel('Hướng dẫn ' + (i + 1) + '/3', `<div class="tut"><div class="big">${ic}</div><h3>${h}</h3><p>${p}</p></div><div class="row"><button class="btn alt" data-a="s">Bỏ qua</button><button class="btn" data-a="n">${i === 2 ? 'Bắt đầu' : 'Tiếp'}</button></div>`, { onClose: () => { save.tutDone = true; persist(); } });
  bind('[data-a="s"]', closePanel); bind('[data-a="n"]', () => i === 2 ? closePanel() : tutorial(i + 1));
}

/* ============ 9. NHÂN VẬT ============ */
function openAvatar(first) {
  const a = save.av, sw = (k, arr) => arr.map((c, i) => `<button class="sw${a[k] === i ? ' on' : ''}" data-k="${k}" data-v="${i}" style="background:${c}" aria-label="màu ${i + 1}"></button>`).join(''), ch = (k, arr) => arr.map((n, i) => `<button class="chip${a[k] === i ? ' on' : ''}" data-k="${k}" data-v="${i}">${n}</button>`).join('');
  openPanel(first ? 'Tạo nhân vật của bạn' : 'Nhân vật của tôi', `<div class="avs"><b>Tên hiển thị</b><input id="avN" maxlength="20" value="${esc(save.name)}" placeholder="Tên của bạn"></div>
    <div class="avs"><b>Kiểu tóc</b><div class="chips">${ch('hair', HAIRS)}</div></div><div class="avs"><b>Màu tóc</b><div class="sws">${sw('hairC', HAIRC)}</div></div><div class="avs"><b>Mũ</b><div class="chips">${ch('hat', HATS)}</div></div>
    <div class="avs"><b>Màu da</b><div class="sws">${sw('skin', SKINS)}</div></div><div class="avs"><b>Áo</b><div class="sws">${sw('top', TOPS)}</div></div><div class="avs"><b>Quần</b><div class="sws">${sw('pants', PANTS)}</div></div><div class="avs"><b>Ba lô</b><div class="sws">${sw('bag', BAGS)}</div></div>
    <div class="row"><button class="btn alt" id="avR">🎲 Ngẫu nhiên</button><button class="btn" id="avOk">Xong</button></div>`, { avp: true, onClose: () => { save.avDone = true; commitName(); persist(); if (first && !save.tutDone) setTimeout(() => tutorial(0), 200); } });
  cam.front = true; cam.fo = 0;
  const keep = () => { save.name = $('avN').value.replace(/[<>]/g, '').slice(0, 20); persist(); };
  $('avN').oninput = keep; bind('[data-k]', b => { a[b.dataset.k] = +b.dataset.v; keep(); persist(); rebuildMe(); openAvatar(first); });
  $('avR').onclick = () => { Object.assign(a, randomAv()); keep(); persist(); rebuildMe(); openAvatar(first); }; $('avOk').onclick = () => { keep(); closePanel(); };
}
function commitName() { if (dirty(save.name)) { save.name = ''; toast('Tên có từ chưa phù hợp nên đã được xoá, bạn đặt lại nhé.'); } persist(); }

/* ============ 10. NGƯỜI CHƠI KHÁC (online) ============ */
const R = new Map(), tagsEl = $('tags'); let nR = 0;
function mkRemote(id, v) { const t = makeTraveler(decodeAv(v.av)); scene.add(t.g); const tag = document.createElement('div'); tag.className = 'tag'; tagsEl.appendChild(tag); return { id, t, tag, pos: new THREE.Vector3(v.x, 0, v.z), tx: v.x, tz: v.z, ya: v.a || 0, ty: v.a || 0, e: '', name: '', av: v.av, seen: Date.now(), visible: true, vel: 0 }; }
Net.handlers.player = (id, v, age) => {
  if (age > 90000) { Net.prune(id); return; } if (typeof v.x !== 'number' || typeof v.z !== 'number') return;
  let r = R.get(id); if (!r) { if (R.size >= 24) return; r = mkRemote(id, v); R.set(id, r); }
  if (v.av !== r.av) { scene.remove(r.t.g); r.t = makeTraveler(decodeAv(v.av)); scene.add(r.t.g); r.av = v.av; }
  r.tx = clamp(v.x, -400, 400); r.tz = clamp(v.z, -400, 400); r.ty = +v.a || 0; r.e = typeof v.e === 'string' ? v.e.slice(0, 10) : ''; r.name = cleanName(v.n); r.seen = Date.now(); updNet();
};
Net.handlers.fail = () => { updNet(); toast('Máy chủ online chưa sẵn sàng nên bạn đang chơi một mình.', 3600); };
Net.handlers.leave = id => { const r = R.get(id); if (!r) return; scene.remove(r.t.g); r.tag.remove(); R.delete(id); updNet(); };
function updNet() { const n = [...R.values()].filter(r => r.visible).length + 1; if (!Net.on) R.forEach((r, id) => Net.handlers.leave(id)); $('net').textContent = Net.on ? `🟢 Online · ${n} người` : '⚪ Chơi một mình'; $('net').className = 'chip' + (Net.on ? ' on' : ''); }
function updateRemotes(dt, t) {
  const now = Date.now();
  R.forEach(r => { r.visible = now - r.seen < 30000; r.t.g.visible = r.visible; if (!r.visible) return; const px = r.pos.x, pz = r.pos.z; r.pos.x = lerp(r.pos.x, r.tx, Math.min(1, dt * 6)); r.pos.z = lerp(r.pos.z, r.tz, Math.min(1, dt * 6)); const sp = Math.hypot(r.pos.x - px, r.pos.z - pz) / Math.max(dt, .001); r.vel = lerp(r.vel, Math.min(sp, 9), Math.min(1, dt * 8));
    r.ya += Math.atan2(Math.sin(r.ty - r.ya), Math.cos(r.ty - r.ya)) * Math.min(1, dt * 8); r.t.g.position.set(r.pos.x, .05, r.pos.z); r.t.g.rotation.y = r.ya; r.t.anim.update(dt, t, r.vel, r.e); });
}
function updateTags() {
  const show = (el, text, pos, y, dist) => { vTmp.set(pos.x, y, pos.z).project(camera); const vis = vTmp.z < 1 && dist < 70 && save.names && !panelOpen(); el.style.visibility = vis ? '' : 'hidden'; if (!vis) return; if (el._t !== text) { el.textContent = text; el._t = text; } el.style.left = (vTmp.x * .5 + .5) * innerWidth + 'px'; el.style.top = (-vTmp.y * .5 + .5) * innerHeight + 'px'; };
  show($('mytag'), myName(), P.pos, 2.5, 0); R.forEach(r => { if (r.visible) show(r.tag, r.name, r.pos, 2.5, Math.hypot(r.pos.x - P.pos.x, r.pos.z - P.pos.z)); else r.tag.style.visibility = 'hidden'; });
}

/* ============ 11. VÒNG LẶP ============ */
let ctxKey = '', hintT = 0;
function refreshCtx() {
  nearest(); const key = (cur ? cur.id + (save.visited[cur.id] ? 'v' : '') : '-') + '|' + (curFood ? curFood.id : '-') + '|' + (cur && save.quiz[cur.id] ? 'q' : '');
  if (key !== ctxKey) { ctxKey = key; $('bCheck').hidden = !(cur && !save.visited[cur.id]); $('bInfo').hidden = !cur; $('bQuiz').hidden = !(cur && !save.quiz[cur.id]); $('bEat').hidden = !curFood; $('loc').textContent = cur ? cur.n : 'Sài Gòn'; if (cur && !save.visited[cur.id]) toast(`${cur.icon} Bạn đang ở ${cur.n}. Hãy check-in!`, 2600); }
}
function updHint() {
  let b = null, bd = 1e9; for (const l of LM) if (!save.visited[l.id]) { const d = lmDist(l); if (d < bd) { bd = d; b = l; } }
  $('next').textContent = b ? `📍 Điểm kế tiếp: ${b.n} · ${Math.round(bd)} m` : `🎉 Đã đến đủ ${LM.length} điểm! Bạn là ${titleOf(save.pts)}`;
}
function updateCamera(dt) {
  if (cam.front) { const fy = P.yaw, wide = innerWidth >= 700, d = wide ? 4.8 : 7, ox = wide ? 1.25 : 0, sx = Math.cos(fy), sz = -Math.sin(fy);
    cam.pos.lerp(vTmp.set(P.pos.x + Math.sin(fy) * d, 1.6, P.pos.z + Math.cos(fy) * d), Math.min(1, dt * 5)); camera.position.copy(cam.pos); cam.look.lerp(vTmp.set(P.pos.x + sx * ox, wide ? 1.0 : -.2, P.pos.z + sz * ox), Math.min(1, dt * 6)); camera.lookAt(cam.look); return; }
  // máy quay không chui vào toà nhà: lùi dần từ đầu nhân vật, dừng trước vật cản
  const dx = Math.sin(cam.yaw) * Math.cos(cam.pitch), dy = Math.sin(cam.pitch), dz = Math.cos(cam.yaw) * Math.cos(cam.pitch); let d = cam.dist;
  for (let s = 2; s <= cam.dist; s += .7) { const y = 1.7 + dy * s; if (y < 40 && W.blockedAt(P.pos.x + dx * s, P.pos.z + dz * s, .9)) { d = Math.max(2.2, s - .9); break; } }
  cam.eff = cam.eff == null ? d : (d < cam.eff ? d : lerp(cam.eff, d, Math.min(1, dt * 1.5)));
  const tx = P.pos.x + dx * cam.eff, ty = 1.7 + dy * cam.eff, tz = P.pos.z + dz * cam.eff;
  const tooFar = cam.pos.distanceTo(vB.set(P.pos.x, 1.7, P.pos.z)) > d + .4; // đang xa hơn mức cho phép → kéo vào nhanh
  cam.pos.lerp(vTmp.set(tx, ty, tz), Math.min(1, dt * (tooFar ? 18 : 7))); camera.position.copy(cam.pos); cam.look.lerp(vTmp.set(P.pos.x, 1.7, P.pos.z), Math.min(1, dt * 9)); camera.lookAt(cam.look);
}
function updatePlayer(dt, t) {
  let ix = 0, iy = 0; if (!locked()) { ix = joy.x + (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0); iy = -joy.y + (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0); }
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } let sp = 0;
  if (l > .12) { if (emote) setEmote(''); sp = ((keys.shift || (joy.id !== null && l > .95)) ? 9.5 : 5.2) * Math.min(1, l); fwd.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)); right.set(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); mv.copy(fwd).multiplyScalar(iy).addScaledVector(right, ix).normalize(); P.pos.addScaledVector(mv, sp * dt); W.collide(P.pos, .45); const ty = Math.atan2(mv.x, mv.z); P.yaw += Math.atan2(Math.sin(ty - P.yaw), Math.cos(ty - P.yaw)) * Math.min(1, dt * 10); }
  P.vel = lerp(P.vel, sp, Math.min(1, dt * 10)); me.g.position.set(P.pos.x, .05, P.pos.z); me.g.rotation.y = P.yaw; me.anim.update(dt, t, P.vel, emote);
}
const clock = new THREE.Clock(); let running = true, frames = 0;
function loop() {
  if (!running) return; requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (todMode === 'auto') todH = (todH + dt * .0667) % 24; else todH = { day: 10, dusk: 17.8, night: 21.5 }[todMode] || 10; if (Math.abs(todH - (loop.h ?? -9)) > .01) { loop.h = todH; W.setTime(todH); }
  if (started) { updatePlayer(dt, t); refreshCtx(); if ((hintT -= dt) < 0) { hintT = .6; updHint(); } } else { me.anim.update(dt, t, 0, ''); }
  W.update(dt, t, camera.position, P.pos); updateRemotes(dt, t); updateCamera(dt); updateTags(); renderer.render(scene, camera); frames++;
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; clock.getDelta(); if (running) loop(); });

/* ============ 12. NÚT BẤM ============ */
$('bCheck').onclick = () => cur && checkIn(cur); $('bInfo').onclick = () => cur && openGuide(cur); $('bQuiz').onclick = () => cur && openQuiz(cur); $('bEat').onclick = () => curFood && eat(curFood); $('bPhoto').onclick = () => { if (!locked()) doPhoto(cur); };
const BAR = { passport: openPassport, map: openMap, food: openFood, friends: openFriends, rank: openRank, chat: openChat, emote: openEmotes, more: openMore };
document.querySelectorAll('#bar [data-b]').forEach(b => b.onclick = () => { if (!started) return; if (panelOpen()) closePanel(); BAR[b.dataset.b](); });
addEventListener('beforeunload', () => Net.leave());

/* ============ 13. MÀN CHÀO + KẾT NỐI ============ */
$('nameIn').value = save.name; $('bEnter').disabled = false; $('bEnter').textContent = 'Bắt đầu hành trình'; updCounters(); updNet();
function enter() {
  const n = $('nameIn').value.replace(/[<>]/g, '').trim().slice(0, 20); save.name = dirty(n) ? '' : n; persist(); Snd.start();
  $('splash').style.display = 'none'; started = true; $('hud').style.visibility = 'visible'; updHint(); ctxKey = ''; refreshCtx();
  if (!save.avDone) openAvatar(true); else if (!save.tutDone) tutorial(0);
  Net.join(() => started ? { n: myName(), x: P.pos.x, z: P.pos.z, a: P.yaw, e: emote, av: encodeAv(save.av) } : null);
  Net.chatStart(chatAdd);
}
$('bEnter').onclick = enter; $('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') enter(); });
Net.init().then(ok => { updNet(); if (ok && started) { Net.join(() => ({ n: myName(), x: P.pos.x, z: P.pos.z, a: P.yaw, e: emote, av: encodeAv(save.av) })); Net.chatStart(chatAdd); } });
$('hud').style.visibility = 'hidden'; $('hud').style.pointerEvents = 'none'; updCounters(); loop();
window.SG = { chat: chatMsgs, save, P, W, cam, LM, FOOD, Net, R, scene, camera, renderer, checkIn, eat, travel, setEmote, openPanel, closePanel, openAvatar, openMap, openPassport, openRank, capture, nearest, state: () => ({ cur: cur && cur.id, curFood: curFood && curFood.id, emote, started, frames, todH }), emoteNow: () => emote };
window.dispatchEvent(new Event('sg-ready'));
