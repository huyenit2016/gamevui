// Đà Lạt Phố Hội 3D: điều khiển, kinh tế quầy hàng, khách NPC, chợ, nâng cấp, mở khoá bản đầy đủ, online.
import * as THREE from 'three';
import { PRODUCTS, TIERS, DECOR, WEATHER, LAND, PAY, PLOTS, MARKET, NPC_STALLS, marketMul, weatherAt, levelOf, xpFor, hashStr, dirty } from './data.js';
import { makeTraveler, SKINS, TOPS, PANTS, BAGS, HAIRC, HATS, HAIRS, DEF, encodeAv, decodeAv, randomAv } from '../saigon3d/char.js';
import { buildWorld } from './world.js';
import { makeStall } from './stall.js';
import { Net } from './net.js';

const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, fmt = n => Math.round(n).toLocaleString('vi-VN'), pick = a => a[Math.floor(Math.random() * a.length)];
const isTouch = matchMedia('(pointer:coarse)').matches, PROD = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/* ============ 1. LƯU TRỮ (trên máy bạn) ============ */
const KEY = 'dalat3d_v1';
const save = Object.assign({ name: '', av: {}, xu: 150, xp: 0, rev: 0, sold: 0, ing: {}, stock: {}, price: {}, tier: 0, deco: {}, open: false, slot: Math.floor(Math.random() * 12), unlock: false, seen: {}, sound: true, names: true, shadows: !isTouch, tutDone: false, avDone: false, bonus: 0 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
save.av = Object.assign({}, DEF, save.av);
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
const myName = () => save.name || 'Tiểu thương', lvl = () => levelOf(save.xp);
const isPaid = () => !!save.unlock;
const prodOk = p => lvl() >= p.lv && (p.free || isPaid()), tierOk = i => TIERS[i].free || isPaid(), decoOk = d => d.free || isPaid();
const stockN = () => Object.values(save.stock).reduce((a, s) => a + (s.n || 0), 0), cap = () => TIERS[save.tier].cap;
const priceOf = p => save.price[p.id] || p.price;
const decoRate = () => 1 + DECOR.reduce((a, d) => a + (save.deco[d.id] ? d.rate : 0), 0);

/* ============ 2. KHỞI TẠO 3D ============ */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' }); } catch (e) { $('err').style.display = 'grid'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .6, 1400);
const W = buildWorld(scene); W.setShadows(save.shadows);
const stallPos = s => ({ x: PLOTS[s].x, z: PLOTS[s].z });
const P = { pos: new THREE.Vector3(stallPos(save.slot).x, 0, stallPos(save.slot).z - 9), yaw: 0, vel: 0 };   // đứng trước quầy, quay mặt vào quầy
let me = makeTraveler(save.av); scene.add(me.g);
const cam = { yaw: Math.PI, pitch: .32, dist: isTouch ? 12 : 10, front: false, pos: new THREE.Vector3(P.pos.x, 6, P.pos.z - 10), look: new THREE.Vector3() };
const vTmp = new THREE.Vector3(), vB = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3();
function rebuildMe() { scene.remove(me.g); me = makeTraveler(save.av); scene.add(me.g); }
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

/* ============ 3. ÂM THANH ============ */
const Snd = (() => {
  let ac, master;
  const tone = (f, t0, dur, type = 'sine', vol = .2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .05); };
  const ok = () => ac && save.sound;
  return {
    start() { if (ac) { if (ac.state === 'suspended') ac.resume(); return; } try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } master = ac.createGain(); master.gain.value = save.sound ? .7 : 0; master.connect(ac.destination);
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { b = .97 * b + .03 * (Math.random() * 2 - 1); d[i] = b * 3; } const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = ac.createGain(); g.gain.value = .12; src.connect(lp); lp.connect(g); g.connect(master); src.start(); },
    setOn(on) { if (master) master.gain.value = on ? .7 : 0; },
    coin() { if (!ok()) return; const t = ac.currentTime; tone(1568, t, .12, 'triangle', .12); tone(2093, t + .07, .25, 'triangle', .1); },
    click() { if (!ok()) return; tone(520, ac.currentTime, .06, 'triangle', .08); },
    good() { if (!ok()) return; const t = ac.currentTime; [660, 880, 1320].forEach((f, i) => tone(f, t + i * .08, .5, 'sine', .14)); },
    sizzle() { if (!ok()) return; const t = ac.currentTime; tone(180, t, .15, 'sawtooth', .05); },
    shutter() { if (!ok()) return; const t = ac.currentTime; tone(1800, t, .04, 'square', .05); tone(900, t + .05, .06, 'square', .05); }
  };
})();

/* ============ 4. HUD & bảng ============ */
let toastT = 0; const toast = (m, ms = 2600) => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); };
const updCounters = () => { $('cXu').textContent = fmt(save.xu); $('cLv').textContent = lvl(); };
let started = false; const panelOpen = () => $('panel').classList.contains('on'), locked = () => panelOpen() || !started;
let panelClose = null, panelTick = null;
function openPanel(title, html, o = {}) { clearInterval(panelTick); $('pt').textContent = title; $('pb').innerHTML = html; $('panel').className = 'on' + (o.avp ? ' avp' : ''); panelClose = o.onClose || null; Snd.click(); }
function closePanel() { if (!panelOpen()) return; clearInterval(panelTick); $('panel').className = ''; cam.front = false; const f = panelClose; panelClose = null; f && f(); }
$('px').onclick = closePanel; $('panel').addEventListener('pointerdown', e => { if (e.target.id === 'panel' && !$('panel').classList.contains('avp')) closePanel(); });
const bind = (sel, fn) => $('pb').querySelectorAll(sel).forEach(b => b.addEventListener('click', () => fn(b)));
function gain(xu, xp, why) { save.xu += xu; if (xp) { const l0 = lvl(); save.xp += xp; if (lvl() > l0) { Snd.good(); toast(`🎉 Lên cấp ${lvl()}!` + (PRODUCTS.some(p => p.lv === lvl()) ? ' Có món mới để bán.' : ''), 3600); } } persist(); updCounters(); Net.rankSave(myName(), save.rev, lvl()); }
function floatAt(pos, text, y = 3) { vTmp.set(pos.x, y, pos.z).project(camera); if (vTmp.z > 1) return; const d = document.createElement('div'); d.className = 'float'; d.textContent = text; d.style.left = (vTmp.x * .5 + .5) * innerWidth + 'px'; d.style.top = (-vTmp.y * .5 + .5) * innerHeight + 'px'; document.body.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'translate(-50%,-90px)'; d.style.opacity = '0'; }); setTimeout(() => d.remove(), 1500); }

/* ============ 5. ĐIỀU KHIỂN ============ */
const keys = {}, isTyping = () => /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName);
addEventListener('keydown', e => { if (isTyping()) return; keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); }); addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const joy = { id: null, x: 0, y: 0, x0: 0, y0: 0 }, drag = { id: null, x: 0, y: 0 }, cv = $('c');
cv.addEventListener('pointerdown', e => {
  try { cv.setPointerCapture(e.pointerId); } catch (er) {} if (!started) return;
  if (joy.id === null && !locked() && (isTouch || e.pointerType !== 'mouse') && e.clientX < innerWidth * .5 && e.clientY > innerHeight * .35) { joy.id = e.pointerId; joy.x0 = e.clientX; joy.y0 = e.clientY; joy.x = joy.y = 0; const j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.firstElementChild.style.transform = ''; $('joyGhost').style.display = 'none'; }
  else if (drag.id === null) { drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; }
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId === joy.id) { const dx = e.clientX - joy.x0, dy = e.clientY - joy.y0, l = Math.hypot(dx, dy), m = Math.min(l, 52); joy.x = l ? dx / l * m / 52 : 0; joy.y = l ? dy / l * m / 52 : 0; $('joy').firstElementChild.style.transform = `translate(${joy.x * 40}px,${joy.y * 40}px)`; }
  else if (e.pointerId === drag.id) { cam.yaw -= (e.clientX - drag.x) * .006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * .004, .1, 1.15); drag.x = e.clientX; drag.y = e.clientY; }
});
const pUp = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; $('joy').style.display = 'none'; if (isTouch) $('joyGhost').style.display = 'grid'; } if (e.pointerId === drag.id) drag.id = null; };
cv.addEventListener('pointerup', pUp); cv.addEventListener('pointercancel', pUp);
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .02, 5, 30); }, { passive: true });
$('zIn').onclick = () => cam.dist = clamp(cam.dist - 2.5, 5, 30); $('zOut').onclick = () => cam.dist = clamp(cam.dist + 2.5, 5, 30);
if (!isTouch) $('joyGhost').style.display = 'none';
$('bFull').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };
let emote = '', emoteT = 0;
function setEmote(id, dur) { emote = id; clearTimeout(emoteT); if (id) emoteT = setTimeout(() => { if (emote === id) emote = ''; }, dur || (id === 'selfie' ? 1600 : 3600)); }
document.querySelectorAll('#acts [data-e]').forEach(b => b.onclick = () => { if (locked()) return; Snd.click(); setEmote(b.dataset.e); });

/* ============ 6. QUẦY CỦA TÔI ============ */
let myStall = null, myStallKey = '';
const stallFront = () => { const p = stallPos(save.slot); return { x: p.x, z: p.z - 3.2 }; };
const mainProd = () => { let b = null, n = 0; for (const id in save.stock) if ((save.stock[id].n || 0) > n) { n = save.stock[id].n; b = id; } return b ? PROD[b] : PRODUCTS[0]; };
function buildMyStall() {
  const key = [save.slot, save.tier, mainProd().id, save.deco.lan | 0, save.deco.hoa | 0, save.deco.ban | 0, myName()].join('|'); if (key === myStallKey) return; myStallKey = key;
  if (myStall) scene.remove(myStall); myStall = makeStall(save.tier, myName(), mainProd().ic, save.deco); const p = stallPos(save.slot); myStall.position.set(p.x, 0, p.z); myStall.rotation.y = Math.PI; scene.add(myStall);
}
const nearStall = () => Math.hypot(P.pos.x - stallPos(save.slot).x, P.pos.z - stallPos(save.slot).z) < 9;
const nearMarket = () => Math.hypot(P.pos.x - MARKET.x, P.pos.z - MARKET.z) < 9;
function goHome() { const f = stallFront(); P.pos.set(f.x, 0, f.z - 1.5); P.yaw = 0; cam.yaw = Math.PI; cam.eff = null; cam.pos.set(f.x, 6, f.z - 12); toast('📍 Bạn đã về quầy của mình.'); }
function setOpen(on) { save.open = on; persist(); refreshOpenBtn(); if (on) { if (!stockN()) toast('Quầy mở cửa nhưng chưa có món nào. Hãy chế biến trước nhé!', 3200); else toast('🛍️ Quầy đã mở cửa. Khách sẽ ghé dần!'); } }
function refreshOpenBtn() { const b = $('bOpen'); b.textContent = save.open ? '🟢 Quầy đang mở' : '🔒 Quầy đang đóng'; }
$('bOpen').onclick = () => { if (!locked()) setOpen(!save.open); };

const stars = q => '★'.repeat(Math.round(q)) + '☆'.repeat(3 - Math.round(q));
function openStall() {
  const t = TIERS[save.tier], nx = TIERS[save.tier + 1], ref = p => p.price;
  const rows = PRODUCTS.map(p => { const st = save.stock[p.id] || { n: 0, q: 2 }, ok = prodOk(p), pr = priceOf(p); return ok ? `<tr><td>${p.ic} <b>${p.n}</b><br><small class="small">Kho: ${save.ing[p.id] | 0} nguyên liệu · ${st.n | 0} phần ${st.n ? `<span class="stars">${stars(st.q)}</span>` : ''}</small></td><td class="r"><span class="pm"><button data-p="${p.id}" data-d="-1">−</button><b class="price">${pr}</b><button data-p="${p.id}" data-d="1">+</button></span><br><small class="small">giá gốc ${ref(p)}</small></td></tr>` : `<tr class="lock"><td>🔒 ${p.ic} ${p.n}<br><small class="small">${lvl() < p.lv ? 'Mở ở cấp ' + p.lv : 'Cần bản đầy đủ'}</small></td><td class="r"></td></tr>`; }).join('');
  const ups = nx ? `<button class="btn alt sm" data-up="tier">${nx.ic} Nâng lên ${nx.n} · ${fmt(nx.cost)} 🪙${tierOk(save.tier + 1) ? '' : ' 🔒'}</button>` : '<span class="small">Quầy đã ở cấp cao nhất.</span>';
  const dec = DECOR.map(d => save.deco[d.id] ? `<span class="chip on">${d.ic} ${d.n}</span>` : `<button class="btn alt sm" data-up="${d.id}">${d.ic} ${d.n} · ${d.cost} 🪙${decoOk(d) ? '' : ' 🔒'}</button>`).join(' ');
  openPanel('Quầy của tôi', `<div class="pp"><b>${t.ic} ${t.n}</b><span>Sức chứa ${stockN()}/${t.cap}</span><span>Khách ×${(t.rate * decoRate()).toFixed(1)}</span>${isPaid() ? '<span class="badge">Bản đầy đủ</span>' : '<span class="badge">Bản thử</span>'}</div>
    <div class="row" style="margin-top:0"><button class="btn sm" data-a="open">${save.open ? '🟢 Đang mở — bấm để đóng' : '🔒 Đang đóng — bấm để mở'}</button><button class="btn alt sm" data-a="craft">👩‍🍳 Chế biến</button><button class="btn alt sm" data-a="home">📍 Về quầy</button></div>
    <table class="tbl" style="margin-top:8px">${rows}</table><p class="small">Giá cao hơn thì khách dễ chê đắt; giá thấp bán chạy nhưng lãi mỏng. Món ngon (nhiều ★) chịu được giá cao hơn.</p>
    <h3 style="margin:10px 0 4px;font-size:16px">Nâng cấp</h3><div class="row" style="margin-top:4px">${ups}</div><div class="row">${dec}</div>${isPaid() ? '' : '<div class="pay">🔓 Mở khoá bản đầy đủ: toàn bộ món hàng, quầy cấp cao, trang trí và chơi online.<div class="row"><button class="btn sm" data-a="pay">Mở khoá một lần · ' + esc(PAY.price) + '</button></div></div>'}`);
  bind('[data-p]', b => { const p = PROD[b.dataset.p]; save.price[p.id] = clamp(priceOf(p) + (+b.dataset.d) * Math.max(1, Math.round(p.price * .08)), Math.ceil(p.cost * .8), p.price * 3); persist(); openStall(); });
  bind('[data-a="open"]', () => { setOpen(!save.open); openStall(); }); bind('[data-a="craft"]', openCraft); bind('[data-a="home"]', () => { closePanel(); goHome(); }); bind('[data-a="pay"]', openPay);
  bind('[data-up]', b => {
    const k = b.dataset.up; if (k === 'tier') { if (!tierOk(save.tier + 1)) return openPay(); if (save.xu < nx.cost) return toast('Chưa đủ xu để nâng cấp.'); gain(-nx.cost, 0); save.tier++; Snd.good(); toast(`🎉 Quầy lên ${nx.n}!`); }
    else { const d = DECOR.find(x => x.id === k); if (!decoOk(d)) return openPay(); if (save.xu < d.cost) return toast('Chưa đủ xu.'); gain(-d.cost, 0); save.deco[k] = 1; Snd.good(); toast(`${d.ic} Đã trang trí ${d.n}.`); }
    persist(); buildMyStall(); openStall();
  });
}
// Chế biến: thanh trượt, dừng đúng vùng xanh để món ngon hơn. Mỗi lượt làm tối đa 2 phần, tốn 1 nguyên liệu/phần.
function openCraft() {
  if (!nearStall()) { toast('Hãy đứng gần quầy của bạn để chế biến (bấm 📍 để về quầy).'); return; }
  const opts = PRODUCTS.filter(prodOk).map(p => `<button class="btn alt" data-c="${p.id}" ${(save.ing[p.id] | 0) < 1 ? 'disabled' : ''}>${p.ic} ${p.n} <small>(nguyên liệu: ${save.ing[p.id] | 0})</small></button>`).join('');
  openPanel('Chế biến', `<p class="small">Chọn món rồi bấm <b>Dừng</b> khi vạch trắng nằm trong vùng xanh. Sức chứa quầy: ${stockN()}/${cap()}.</p><div class="opts">${opts}</div><p class="small">${PRODUCTS.some(p => (save.ing[p.id] | 0) > 0) ? '' : 'Bạn chưa có nguyên liệu. Hãy ra chợ đầu mối (🧺) để mua.'}</p>`);
  bind('[data-c]', b => craftGame(PROD[b.dataset.c]));
}
function craftGame(p) {
  if (stockN() >= cap()) { toast('Quầy đã đầy, hãy bán bớt hoặc nâng cấp quầy.'); return; }
  const zone = Math.max(.14, .34 - lvl() * .012), c0 = .25 + Math.random() * .5; let x = 0, dir = 1, run = true, last = performance.now();
  openPanel('Chế biến · ' + p.n, `<p class="qq">${p.ic} ${p.n}</p><div class="bar" id="cb"><div class="z1" style="left:${(c0 - zone * 1.6) * 100}%;width:${zone * 3.2 * 100}%"></div><div class="z2" style="left:${(c0 - zone * .6) * 100}%;width:${zone * 1.2 * 100}%"></div><div class="mk" id="mk"></div></div><div class="row" style="justify-content:center"><button class="btn" id="stop" style="min-width:160px">Dừng!</button></div><p class="small" id="cm" style="text-align:center">Canh vạch trắng vào vùng xanh.</p>`, { onClose: () => { run = false; } });
  Snd.sizzle(); const speed = .9 + lvl() * .06;
  panelTick = setInterval(() => { const now = performance.now(), dt = (now - last) / 1000; last = now; if (!run) return; x += dir * speed * dt; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } const m = $('mk'); if (m) m.style.left = x * 100 + '%'; }, 16);
  const stop = () => { if (!run) return; run = false; clearInterval(panelTick); const d = Math.abs(x - c0), q = d < zone * .6 ? 3 : d < zone * 1.6 ? 2 : 1, n = Math.min(2, save.ing[p.id] | 0, cap() - stockN()); if (n < 1) { toast('Không đủ nguyên liệu hoặc quầy đầy.'); return openCraft(); }
    save.ing[p.id] -= n; const st = save.stock[p.id] || (save.stock[p.id] = { n: 0, q: 2 }); st.q = (st.q * st.n + q * n) / (st.n + n); st.n += n; gain(0, 2 * n); persist(); buildMyStall(); Snd[q === 3 ? 'good' : 'coin'](); setEmote('cheer', 1200);
    $('cm').textContent = (q === 3 ? '🌟 Hoàn hảo!' : q === 2 ? '👍 Tốt!' : '🙂 Tạm được.') + ` Làm được ${n} phần ${p.n} (${stars(q)}).`; $('stop').textContent = 'Làm tiếp'; $('stop').onclick = () => (save.ing[p.id] | 0) > 0 && stockN() < cap() ? craftGame(p) : openCraft(); };
  $('stop').onclick = stop; $('cb').onclick = stop;
}

/* ============ 7. CHỢ ĐẦU MỐI ============ */
const mPrice = (p, now) => Math.max(1, Math.round(p.cost * marketMul(p.id, now)));
function openMarket(force) {
  if (!force && !nearMarket()) { toast('Hãy đi tới chợ đầu mối ở góc trái quảng trường để mua nguyên liệu.'); return; }
  const w = weatherAt(), rows = PRODUCTS.filter(prodOk).map(p => { const pr = mPrice(p), prev = mPrice(p, Date.now() - 90000), tr = pr > prev ? '<span class="up">▲</span>' : pr < prev ? '<span class="dn">▼</span>' : '·'; return `<tr><td>${p.ic} <b>${p.n}</b><br><small class="small">Đang có ${save.ing[p.id] | 0}</small></td><td class="r"><b class="price">${pr}</b> 🪙 ${tr}<br><span class="pm"><button data-b="${p.id}" data-n="1">+1</button><button data-b="${p.id}" data-n="5">+5</button><button data-b="${p.id}" data-n="10">+10</button></span></td></tr>`; }).join('');
  openPanel(MARKET.n, `<p class="tip">${w.ic} Hôm nay: <b>${w.n}</b>. Trời lạnh/mưa thì món nóng bán chạy, trời nắng thì món mát bán chạy. Giá chợ đổi mỗi 90 giây, ai cũng thấy cùng một giá.</p><table class="tbl">${rows}</table><p class="small">Bạn có <b>${fmt(save.xu)}</b> 🪙</p>`);
  bind('[data-b]', b => { const p = PROD[b.dataset.b], n = +b.dataset.n, pr = mPrice(p) * n; if (save.xu < pr) return toast('Chưa đủ xu.'); gain(-pr, 0); save.ing[p.id] = (save.ing[p.id] | 0) + n; persist(); Snd.coin(); openMarket(true); });
}

/* ============ 8. KHÁCH HÀNG NPC ============ */
const cust = []; let spawnT = 3;
const demand = p => { const w = weatherAt(); return p.hot ? w.hot : p.cold ? w.cold : 1; };
function spawnCustomer() {
  if (cust.length >= 4) return;
  const ids = PRODUCTS.filter(p => (save.stock[p.id] || {}).n > 0 && prodOk(p)); if (!ids.length) return;
  let tot = 0; const ws = ids.map(p => (tot += demand(p), tot)); let r = Math.random() * tot, p = ids[ws.findIndex(v => r <= v)] || ids[0];
  const st = save.stock[p.id], pr = priceOf(p), ratio = pr / p.price, acc = clamp((1.5 + (st.q - 2) * .14 - ratio) / .55, 0, 1), f = stallFront(), ok = Math.random() < acc;
  const t = makeTraveler(randomAv()); t.g.scale.setScalar(.92); const a = Math.random() * Math.PI - Math.PI / 2; t.g.position.set(f.x + Math.sin(a) * 26, .05, f.z - 18 - Math.random() * 10); scene.add(t.g);
  if (ok) { st.n--; if (!st.n) delete save.stock[p.id]; buildMyStall(); persist(); }
  cust.push({ t, p, ok, q: st.q, price: pr, state: 'in', wait: 0, vel: 0, tx: f.x + (Math.random() - .5) * 2.4, tz: f.z - .5 });
}
function updateCustomers(dt, t) {
  for (let i = cust.length - 1; i >= 0; i--) {
    const c = cust[i], g = c.t.g; let dx = c.tx - g.position.x, dz = c.tz - g.position.z, d = Math.hypot(dx, dz), sp = 0;
    if (c.state === 'in') { if (d < .7) { c.state = 'wait'; c.wait = 1.3; } else sp = 3.2; }
    else if (c.state === 'wait') { c.wait -= dt; c.t.g.rotation.y = Math.PI; if (c.wait <= 0) { c.state = 'out'; const f = stallFront(); c.tx = f.x + (Math.random() - .5) * 50; c.tz = f.z - 40; sale(c); } }
    else { sp = 3.2; if (d < 1 || g.position.z < stallFront().z - 34) { scene.remove(g); cust.splice(i, 1); continue; } }
    if (sp) { g.position.x += dx / d * sp * dt; g.position.z += dz / d * sp * dt; const ty = Math.atan2(dx, dz); g.rotation.y += Math.atan2(Math.sin(ty - g.rotation.y), Math.cos(ty - g.rotation.y)) * Math.min(1, dt * 8); }
    c.vel = lerp(c.vel, sp, Math.min(1, dt * 8)); c.t.anim.update(dt, t, c.vel, c.state === 'wait' && c.ok ? 'cheer' : '');
  }
}
function sale(c) {
  const sp = stallPos(save.slot), pos = { x: sp.x, z: sp.z - 2 };
  if (c.ok) { save.rev += c.price; save.sold++; gain(c.price, Math.round(c.price / 4)); Snd.coin(); floatAt(pos, `+${c.price} 🪙 ${c.p.ic}`, 3.6); milestones(); if (!stockN() && save.open) toast('Hết hàng rồi! Hãy chế biến thêm.', 3000); }
  else floatAt(pos, '😕 Đắt quá!', 3.6);
}
function milestones() { const M = [[10, 100], [50, 400], [200, 1500], [1000, 8000]]; M.forEach(([n, xu], i) => { if (save.sold >= n && !(save.bonus & (1 << i))) { save.bonus |= 1 << i; gain(xu, 20); toast(`🏅 Đã bán ${n} phần! Thưởng +${fmt(xu)} xu.`, 3600); } }); }
function updateSales(dt) { if (!save.open || !started) return; if ((spawnT -= dt) > 0) return; spawnT = (8 + Math.random() * 6) / (TIERS[save.tier].rate * decoRate()); spawnCustomer(); }

/* ============ 9. ĐỊA DANH, THỜI TIẾT ============ */
let curLand = null, curWx = '';
function nearLand() { let b = null, bd = 1e9; for (const l of LAND) { const d = Math.hypot(P.pos.x - l.x, P.pos.z - l.z); if (d < l.r && d < bd) { bd = d; b = l; } } curLand = b; }
function openLand(l) { const first = !save.seen[l.id]; if (first) { save.seen[l.id] = 1; gain(60, 10); Snd.good(); } const n = Object.keys(save.seen).length;
  openPanel(l.n, `<div class="gh"><span>${l.ic}</span><div><b>${esc(l.n)}</b><small>Quảng trường Lâm Viên (cách điệu)</small></div></div><p>${esc(l.info)}</p><p class="small">${first ? '🎁 Lần đầu ghé: +60 xu.' : ''} Đã khám phá ${n}/${LAND.length} địa danh.</p>${n === LAND.length && !(save.bonus & 64) ? (save.bonus |= 64, gain(300, 40), '<p class="tip">🎉 Bạn đã khám phá đủ địa danh! Thưởng +300 xu.</p>') : ''}`); }
function updWeather() { const w = weatherAt(); if (w.id !== curWx) { curWx = w.id; W.setWeather(w.id); $('wx').textContent = `${w.ic} ${w.n}`; if (started) toast(`${w.ic} Trời ${w.n.toLowerCase()}: ${w.id === 'sun' ? 'món mát bán chạy hơn' : 'món nóng bán chạy hơn'}.`, 3200); } }

/* ============ 10. MỞ KHOÁ BẢN ĐẦY ĐỦ (mua một lần) ============ */
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function openPay() {
  if (isPaid()) return openPanel('Bản đầy đủ', '<p>✅ Bạn đã mở khoá bản đầy đủ. Cảm ơn bạn đã ủng hộ!</p>');
  openPanel('Mở khoá bản đầy đủ', `<div class="pay"><b style="font-size:18px">Mua một lần · ${esc(PAY.price)}</b><p style="margin:6px 0">Dùng mãi mãi, không thu phí định kỳ:</p><ul style="margin:4px 0 4px 18px;padding:0;line-height:1.7"><li>Cả 8 món hàng (cà phê, dâu tây, kem bơ, mứt…)</li><li>Quầy gỗ và tiệm nhỏ, mọi trang trí</li><li>Chơi online: thấy quầy và bạn bè, chat, xếp hạng</li></ul>
    ${PAY.buyUrl ? `<div class="row"><a class="btn" href="${esc(PAY.buyUrl)}" target="_blank" rel="noopener" style="text-decoration:none">🛒 Mua ngay</a></div>` : '<p class="small">Cổng thanh toán chưa được gắn. Nếu bạn đã có mã mở khoá, hãy nhập bên dưới.</p>'}</div>
    <div class="avs"><b>Đã có mã mở khoá?</b><div class="chf"><input id="code" maxlength="24" placeholder="Nhập mã" autocomplete="off" style="text-transform:uppercase"><button class="btn sm" id="codeOk">Mở khoá</button></div></div><p class="small" id="codeMsg">Tiền trong game là xu ảo, không quy đổi ra tiền thật.</p>`);
  $('codeOk').onclick = async () => { const c = $('code').value.trim().toUpperCase().replace(/\s+/g, ''); if (!c) return; try { const h = await sha256('dalat3d:' + c), list = (await (await fetch('codes.json', { cache: 'no-store' })).json()).h || []; if (list.includes(h)) { save.unlock = true; persist(); Snd.good(); toast('🔓 Đã mở khoá bản đầy đủ! Cảm ơn bạn.', 4000); closePanel(); refreshNetChip(); Net.init().then(ok => { refreshNetChip(); if (ok) goOnline(); }); } else $('codeMsg').textContent = '❌ Mã không đúng hoặc đã bị thu hồi.'; } catch (e) { $('codeMsg').textContent = '⚠️ Không kiểm tra được mã (cần mạng và trình duyệt hỗ trợ).'; } };
}

/* ============ 11. CÁC BẢNG KHÁC ============ */
const chatMsgs = [], seenChat = new Set(), cleanName = n => String(n || 'Bạn').replace(/[<>]/g, '').slice(0, 24);
function chatAdd(id, v) { if (seenChat.has(id)) return; seenChat.add(id); chatMsgs.push({ n: cleanName(v.n), t: dirty(v.t) ? '***' : String(v.t).slice(0, 120) }); if (chatMsgs.length > 40) chatMsgs.shift(); const last = chatMsgs.slice(-3); $('chatlog').innerHTML = last.map(m => `<div><b>${esc(m.n)}:</b> ${esc(m.t)}</div>`).join(''); $('chatlog').classList.add('on'); clearTimeout(chatAdd.t); chatAdd.t = setTimeout(() => $('chatlog').classList.remove('on'), 9000); if (panelOpen() && $('chl')) drawChat(); }
function drawChat() { const el = $('chl'); el.innerHTML = chatMsgs.map(m => `<div><b>${esc(m.n)}:</b> ${esc(m.t)}</div>`).join('') || '<small>Chưa có tin nhắn.</small>'; el.scrollTop = el.scrollHeight; }
function openChat() {
  if (!isPaid()) return openLockedOnline('Trò chuyện');
  openPanel('Trò chuyện', `<div id="chl" class="chl"></div><form id="chf" class="chf"><input id="chi" maxlength="120" placeholder="${Net.on ? 'Nhập lời chào…' : 'Chưa kết nối online'}" autocomplete="off"><button class="btn sm" type="submit">Gửi</button></form>`); drawChat();
  $('chf').onsubmit = e => { e.preventDefault(); const t = $('chi').value.trim(); if (!t) return; $('chi').value = ''; if (dirty(t)) return toast('Tin nhắn có từ chưa phù hợp.'); if (!Net.chatSend(myName(), t)) { chatAdd('l' + Date.now(), { n: myName(), t }); toast('Bạn đang chơi một mình nên chỉ mình bạn thấy tin này.'); } };
}
function openLockedOnline(what) { openPanel(what, `<p>🌏 ${what} cần bản đầy đủ (chơi online).</p><div class="row"><button class="btn" data-a="pay">Mở khoá một lần · ${esc(PAY.price)}</button></div>`); bind('[data-a="pay"]', openPay); }
function openFriends() {
  if (!isPaid()) return openLockedOnline('Bạn bè');
  const list = [...R.values()].filter(r => r.visible);
  openPanel('Phố hội', `<p>${Net.on ? `🟢 Đang online: <b>${list.length + 1}</b> người (kể cả bạn).` : '⚪ Bạn đang chơi một mình (chưa kết nối máy chủ).'}</p><div class="list">${list.map(r => `<div class="li"><span>${TIERS[r.tier].ic}</span><div><b>${esc(r.name || 'Tiểu thương')}</b><small>${TIERS[r.tier].n} · ${r.open ? '🟢 đang mở' : '🔒 đóng cửa'}</small></div></div>`).join('') || '<small>Chưa thấy ai khác. Hãy rủ bạn bè cùng vào nhé!</small>'}</div>`);
}
async function openRank() {
  if (!isPaid()) return openLockedOnline('Xếp hạng');
  openPanel('Tiểu thương xuất sắc', '<p>⏳ Đang tải…</p>'); if (!Net.on) { $('pb').innerHTML = `<p>⚪ Cần kết nối online để xem bảng xếp hạng. Doanh thu của bạn: 🪙 ${fmt(save.rev)}</p>`; return; }
  try { const top = await Net.rankTop(); if (!panelOpen()) return; $('pb').innerHTML = `<p class="small">Doanh thu do người chơi tự báo, chỉ mang tính vui. Bạn: 🪙 ${fmt(save.rev)}</p><div class="list">${top.map((r, i) => `<div class="li ${r.id === Net.uid ? 'me' : ''}"><span>${['🥇', '🥈', '🥉'][i] || (i + 1)}</span><div><b>${esc(String(r.n).slice(0, 24))}</b><small>Cấp ${r.k | 0}</small></div><b>${fmt(r.s)} 🪙</b></div>`).join('') || '<small>Chưa có ai.</small>'}</div>`; } catch (e) { $('pb').innerHTML = '<p>Không tải được bảng xếp hạng.</p>'; }
}
function openMore() { openPanel('Thêm', `<div class="agrid"><button class="atile" data-m="stat"><span>📊</span>Thống kê</button><button class="atile" data-m="guide"><span>📖</span>Địa danh</button><button class="atile" data-m="pay"><span>🔓</span>${isPaid() ? 'Bản đầy đủ' : 'Mở khoá'}</button><button class="atile" data-m="set"><span>⚙️</span>Cài đặt</button><button class="atile" data-m="help"><span>❓</span>Hướng dẫn</button></div>`);
  bind('[data-m]', b => { const m = b.dataset.m; if (m === 'stat') openStats(); else if (m === 'guide') openGuideList(); else if (m === 'pay') openPay(); else if (m === 'set') openSettings(); else tutorial(0); }); }
function openStats() { openPanel('Thống kê', `<div class="pp"><b>${esc(myName())}</b><span>Cấp ${lvl()}</span><span>XP ${save.xp}/${xpFor(lvl() + 1)}</span></div><div class="list"><div class="li"><span>🪙</span><div><b>${fmt(save.xu)} xu</b><small>Tổng doanh thu ${fmt(save.rev)}</small></div></div><div class="li"><span>🛍️</span><div><b>${fmt(save.sold)} phần đã bán</b><small>${TIERS[save.tier].n}</small></div></div><div class="li"><span>📍</span><div><b>${Object.keys(save.seen).length}/${LAND.length} địa danh</b></div></div></div>`); }
function openGuideList() { openPanel('Địa danh quảng trường', `<div class="list">${LAND.map(l => `<div class="li click" data-id="${l.id}"><span>${l.ic}</span><div><b>${esc(l.n)}</b><small>${save.seen[l.id] ? '✅ đã ghé' : 'chưa ghé'}</small></div></div>`).join('')}</div>`); bind('[data-id]', b => openLand(LAND.find(l => l.id === b.dataset.id))); }
function openSettings() {
  const tg = (k, label) => `<label class="tg"><input type="checkbox" data-k="${k}" ${save[k] ? 'checked' : ''}> ${label}</label>`;
  openPanel('Cài đặt', `${tg('sound', '🔊 Âm thanh')}${tg('names', '🏷️ Hiện tên người chơi')}${tg('shadows', '🌓 Đổ bóng (đẹp hơn, nặng máy hơn)')}<div class="row"><button class="btn alt" data-a="reset">🗑️ Xoá tiến trình trên máy này</button></div><p class="small">Dữ liệu chỉ lưu trên máy bạn; khi chơi online chỉ có tên, vị trí, trạng thái quầy, tin nhắn và doanh thu được gửi lên.</p>`);
  bind('[data-k]', b => { const k = b.dataset.k; save[k] = b.checked; persist(); if (k === 'sound') Snd.setOn(save.sound); if (k === 'shadows') W.setShadows(save.shadows); });
  bind('[data-a="reset"]', () => { if (confirm('Xoá toàn bộ tiến trình (xu, quầy, nhân vật, mã mở khoá) trên máy này?')) { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); } });
}
const TUT = [['🕹️', 'Đi lại', isTouch ? 'Đặt ngón tay ở nửa trái màn hình rồi kéo để đi. Kéo nửa phải để xoay góc nhìn. Nút + − để thu phóng.' : 'Phím W A S D hoặc mũi tên để đi, giữ Shift để chạy. Kéo chuột để xoay, lăn chuột để thu phóng.'], ['🧺', 'Mua – làm – bán', 'Ra chợ đầu mối (vòng vàng ở góc trái) mua nguyên liệu. Về quầy bấm 👩‍🍳 Chế biến, canh thanh trượt để món ngon. Rồi bấm 🔒 để mở quầy, khách sẽ ghé mua.'], ['📈', 'Kinh doanh khéo', 'Thời tiết và giá chợ thay đổi theo thời gian. Chỉnh giá bán trong 🛍️ Quầy của tôi, nâng cấp quầy để đón nhiều khách hơn.']];
function tutorial(i) { const [ic, h, p] = TUT[i]; openPanel('Hướng dẫn ' + (i + 1) + '/3', `<div class="tut"><div class="big">${ic}</div><h3>${h}</h3><p>${p}</p></div><div class="row"><button class="btn alt" data-a="s">Bỏ qua</button><button class="btn" data-a="n">${i === 2 ? 'Bắt đầu' : 'Tiếp'}</button></div>`, { onClose: () => { save.tutDone = true; persist(); } }); bind('[data-a="s"]', closePanel); bind('[data-a="n"]', () => i === 2 ? closePanel() : tutorial(i + 1)); }
function openAvatar(first) {
  const a = save.av, sw = (k, arr) => arr.map((c, i) => `<button class="sw${a[k] === i ? ' on' : ''}" data-k="${k}" data-v="${i}" style="background:${c}" aria-label="màu ${i + 1}"></button>`).join(''), ch = (k, arr) => arr.map((n, i) => `<button class="chip${a[k] === i ? ' on' : ''}" data-k="${k}" data-v="${i}">${n}</button>`).join('');
  openPanel(first ? 'Tạo nhân vật của bạn' : 'Nhân vật của tôi', `<div class="avs"><b>Tên (cũng là tên quầy)</b><input id="avN" maxlength="20" value="${esc(save.name)}" placeholder="Tên của bạn"></div><div class="avs"><b>Kiểu tóc</b><div class="chips">${ch('hair', HAIRS)}</div></div><div class="avs"><b>Màu tóc</b><div class="sws">${sw('hairC', HAIRC)}</div></div><div class="avs"><b>Mũ</b><div class="chips">${ch('hat', HATS)}</div></div><div class="avs"><b>Màu da</b><div class="sws">${sw('skin', SKINS)}</div></div><div class="avs"><b>Áo</b><div class="sws">${sw('top', TOPS)}</div></div><div class="avs"><b>Quần</b><div class="sws">${sw('pants', PANTS)}</div></div><div class="row"><button class="btn alt" id="avR">🎲 Ngẫu nhiên</button><button class="btn" id="avOk">Xong</button></div>`, { avp: true, onClose: () => { save.avDone = true; if (dirty(save.name)) { save.name = ''; toast('Tên có từ chưa phù hợp nên đã được xoá.'); } persist(); buildMyStall(); if (first && !save.tutDone) setTimeout(() => tutorial(0), 200); } });
  cam.front = true; const keep = () => { save.name = $('avN').value.replace(/[<>]/g, '').slice(0, 20); persist(); };
  $('avN').oninput = keep; bind('[data-k]', b => { a[b.dataset.k] = +b.dataset.v; keep(); persist(); rebuildMe(); openAvatar(first); }); $('avR').onclick = () => { Object.assign(a, randomAv()); keep(); persist(); rebuildMe(); openAvatar(first); }; $('avOk').onclick = () => { keep(); closePanel(); };
}
let photoBusy = false;
async function doPhoto() {
  if (photoBusy) return; photoBusy = true; setEmote('selfie', 1700); toast('📷 Giữ yên nào…', 1200);
  setTimeout(async () => { $('flash').classList.add('on'); Snd.shutter(); setTimeout(() => $('flash').classList.remove('on'), 160); cam.front = false; renderer.render(scene, camera);
    const src = renderer.domElement, c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d'), ar = 1080 / 1130; let cw = src.width, ch = cw / ar; if (ch > src.height) { ch = src.height; cw = ch * ar; } g.drawImage(src, (src.width - cw) / 2, (src.height - ch) / 2, cw, ch, 0, 0, 1080, 1130);
    const gr = g.createLinearGradient(0, 1000, 0, 1350); gr.addColorStop(0, 'rgba(30,14,30,0)'); gr.addColorStop(.3, 'rgba(30,14,30,.92)'); gr.addColorStop(1, '#1e0e1e'); g.fillStyle = gr; g.fillRect(0, 1000, 1080, 350); g.textAlign = 'center'; g.fillStyle = '#ffe3ee'; g.font = '700 66px system-ui,sans-serif'; g.fillText(curLand ? curLand.n : 'Quảng trường Lâm Viên', 540, 1170); g.fillStyle = '#f3dcc0'; g.font = '36px system-ui,sans-serif'; g.fillText(`${myName()} · ${TIERS[save.tier].n} · Cấp ${lvl()}`, 540, 1228); g.fillStyle = '#c9a0b4'; g.font = '30px system-ui,sans-serif'; g.fillText('Đà Lạt Phố Hội 3D · ' + new Date().toLocaleDateString('vi-VN'), 540, 1296);
    const blob = await new Promise(r => c.toBlob(r, 'image/png')); photoBusy = false; window.__lastShot = { size: blob ? blob.size : 0 }; if (!blob) return toast('Chưa tạo được ảnh.');
    const file = new File([blob], 'da-lat-pho-hoi.png', { type: 'image/png' }); try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Đà Lạt Phố Hội 3D' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'da-lat-pho-hoi.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast('Đã tải ảnh xuống máy 📷'); }, 1000);
}

/* ============ 12. NGƯỜI CHƠI KHÁC (online, cần bản đầy đủ) ============ */
const R = new Map(), tagsEl = $('tags');
function mkRemote(id, v) { const t = makeTraveler(decodeAv(v.av)), tag = document.createElement('div'); tag.className = 'tag'; tagsEl.appendChild(tag); scene.add(t.g); return { id, t, tag, pos: new THREE.Vector3(v.x, 0, v.z), tx: v.x, tz: v.z, ya: v.a || 0, ty: v.a || 0, e: '', name: '', av: v.av, seen: Date.now(), visible: true, vel: 0, slot: -1, tier: 0, open: 0, p: 0, stall: null, sk: '' }; }
Net.handlers.player = (id, v, age) => {
  if (age > 90000) { Net.prune(id); return; } if (typeof v.x !== 'number' || typeof v.z !== 'number') return;
  let r = R.get(id); if (!r) { if (R.size >= 24) return; r = mkRemote(id, v); R.set(id, r); }
  if (v.av !== r.av) { scene.remove(r.t.g); r.t = makeTraveler(decodeAv(v.av)); scene.add(r.t.g); r.av = v.av; }
  r.tx = clamp(v.x, -200, 200); r.tz = clamp(v.z, -200, 200); r.ty = +v.a || 0; r.e = typeof v.e === 'string' ? v.e.slice(0, 10) : ''; r.name = cleanName(v.n); r.seen = Date.now();
  r.slot = clamp(v.s | 0, 0, 11); r.tier = clamp(v.t | 0, 0, 3); r.open = v.o ? 1 : 0; r.p = clamp(v.p | 0, 0, PRODUCTS.length - 1);
  const sk = [r.slot, r.tier, r.p, r.name].join('|'); if (sk !== r.sk) { r.sk = sk; if (r.stall) scene.remove(r.stall); r.stall = makeStall(r.tier, r.name, PRODUCTS[r.p].ic, {}); r.stall.position.set(PLOTS[r.slot].x, 0, PLOTS[r.slot].z); r.stall.rotation.y = Math.PI; scene.add(r.stall); }
  resolveSlot(); refreshNetChip();
};
Net.handlers.fail = () => { refreshNetChip(); toast('Máy chủ online chưa sẵn sàng nên bạn đang chơi một mình.', 3600); };
Net.handlers.leave = id => { const r = R.get(id); if (!r) return; scene.remove(r.t.g); if (r.stall) scene.remove(r.stall); r.tag.remove(); R.delete(id); refreshNetChip(); };
function resolveSlot() { // hai người trùng ô: người có uid lớn hơn dời sang ô trống
  if (!Net.uid) return; const used = new Set(); R.forEach(r => { if (r.visible && r.slot >= 0) used.add(r.slot); });
  const clash = [...R.values()].some(r => r.visible && r.slot === save.slot && r.id < Net.uid); if (!clash) return; for (let i = 0; i < 12; i++) if (!used.has(i)) { save.slot = i; persist(); buildMyStall(); toast('Quầy của bạn đã được dời sang ô trống khác.'); return; }
}
function refreshNetChip() { const n = [...R.values()].filter(r => r.visible).length + 1; if (!Net.on) R.forEach((r, id) => Net.handlers.leave(id)); const el = $('net'), on = Net.on && isPaid(); el.textContent = !isPaid() ? '🔓 Bản thử · chơi một mình' : on ? `🟢 Online · ${n} người` : '⚪ Chơi một mình'; el.className = 'chip' + (on ? ' on' : ''); }
function updateRemotes(dt, t) { const now = Date.now(); R.forEach(r => { r.visible = now - r.seen < 30000; r.t.g.visible = r.visible; if (r.stall) r.stall.visible = r.visible; if (!r.visible) return; const px = r.pos.x, pz = r.pos.z; r.pos.x = lerp(r.pos.x, r.tx, Math.min(1, dt * 6)); r.pos.z = lerp(r.pos.z, r.tz, Math.min(1, dt * 6)); const sp = Math.hypot(r.pos.x - px, r.pos.z - pz) / Math.max(dt, .001); r.vel = lerp(r.vel, Math.min(sp, 9), Math.min(1, dt * 8)); r.ya += Math.atan2(Math.sin(r.ty - r.ya), Math.cos(r.ty - r.ya)) * Math.min(1, dt * 8); r.t.g.position.set(r.pos.x, .05, r.pos.z); r.t.g.rotation.y = r.ya; r.t.anim.update(dt, t, r.vel, r.e); }); }
function updateTags() {
  const show = (el, text, pos, y, dist) => { vTmp.set(pos.x, y, pos.z).project(camera); const vis = vTmp.z < 1 && dist < 80 && save.names && !panelOpen(); el.style.visibility = vis ? '' : 'hidden'; if (!vis) return; if (el._t !== text) { el.textContent = text; el._t = text; } el.style.left = (vTmp.x * .5 + .5) * innerWidth + 'px'; el.style.top = (-vTmp.y * .5 + .5) * innerHeight + 'px'; };
  show($('mytag'), myName(), P.pos, 2.5, 0); R.forEach(r => { if (r.visible) show(r.tag, r.name, r.pos, 2.5, Math.hypot(r.pos.x - P.pos.x, r.pos.z - P.pos.z)); else r.tag.style.visibility = 'hidden'; });
}
function goOnline() { if (!isPaid() || !started || !Net.on) return; Net.join(() => started ? { n: myName(), x: P.pos.x, z: P.pos.z, a: P.yaw, e: emote, av: encodeAv(save.av), s: save.slot, t: save.tier, p: PRODUCTS.indexOf(mainProd()), o: save.open } : null); Net.chatStart(chatAdd); }

/* ============ 13. VÒNG LẶP ============ */
let ctxKey = '';
function refreshCtx() {
  nearLand(); const ns = nearStall(), nm = nearMarket(), key = [curLand && curLand.id, ns, nm].join('|');
  if (key !== ctxKey) { ctxKey = key; $('bCraft').hidden = !ns; $('bMarket').hidden = !nm; $('bInfo').hidden = !curLand; $('loc').textContent = curLand ? curLand.n : nm ? MARKET.n : ns ? 'Quầy của ' + myName() : 'Quảng trường Lâm Viên'; }
}
function updHint() { const miss = LAND.filter(l => !save.seen[l.id]); $('next').textContent = !stockN() && !Object.values(save.ing).some(n => n > 0) ? '🧺 Việc cần làm: ra chợ mua nguyên liệu' : !stockN() ? '👩‍🍳 Hãy chế biến món để bán' : !save.open ? '🔒 Bấm để mở quầy đón khách' : miss.length ? `📍 Khám phá: ${miss[0].n}` : `🛍️ Đang bán · ${stockN()}/${cap()} phần`; }
function updateCamera(dt) {
  if (cam.front) { const fy = P.yaw, wide = innerWidth >= 700, d = wide ? 4.8 : 7, ox = wide ? 1.25 : 0, sx = Math.cos(fy), sz = -Math.sin(fy); cam.pos.lerp(vTmp.set(P.pos.x + Math.sin(fy) * d, 1.6, P.pos.z + Math.cos(fy) * d), Math.min(1, dt * 5)); camera.position.copy(cam.pos); cam.look.lerp(vTmp.set(P.pos.x + sx * ox, wide ? 1.0 : -.2, P.pos.z + sz * ox), Math.min(1, dt * 6)); camera.lookAt(cam.look); return; }
  const dx = Math.sin(cam.yaw) * Math.cos(cam.pitch), dy = Math.sin(cam.pitch), dz = Math.cos(cam.yaw) * Math.cos(cam.pitch); let d = cam.dist;
  for (let s = 2; s <= cam.dist; s += .7) { const y = 1.7 + dy * s; if (y < 14 && W.blockedAt(P.pos.x + dx * s, P.pos.z + dz * s, .9)) { d = Math.max(2.2, s - .9); break; } }
  cam.eff = cam.eff == null ? d : (d < cam.eff ? d : lerp(cam.eff, d, Math.min(1, dt * 1.5)));
  const tx = P.pos.x + dx * cam.eff, ty = 1.7 + dy * cam.eff, tz = P.pos.z + dz * cam.eff, tooFar = cam.pos.distanceTo(vB.set(P.pos.x, 1.7, P.pos.z)) > d + .4;
  cam.pos.lerp(vTmp.set(tx, ty, tz), Math.min(1, dt * (tooFar ? 18 : 7))); camera.position.copy(cam.pos); cam.look.lerp(vTmp.set(P.pos.x, 1.7, P.pos.z), Math.min(1, dt * 9)); camera.lookAt(cam.look);
}
function updatePlayer(dt, t) {
  let ix = 0, iy = 0; if (!locked()) { ix = joy.x + (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0); iy = -joy.y + (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0); }
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } let sp = 0;
  if (l > .12) { if (emote) setEmote(''); sp = ((keys.shift || (joy.id !== null && l > .95)) ? 9.5 : 5.2) * Math.min(1, l); fwd.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)); right.set(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); mv.copy(fwd).multiplyScalar(iy).addScaledVector(right, ix).normalize(); P.pos.addScaledVector(mv, sp * dt); W.collide(P.pos); const ty = Math.atan2(mv.x, mv.z); P.yaw += Math.atan2(Math.sin(ty - P.yaw), Math.cos(ty - P.yaw)) * Math.min(1, dt * 10); }
  P.vel = lerp(P.vel, sp, Math.min(1, dt * 10)); me.g.position.set(P.pos.x, .05, P.pos.z); me.g.rotation.y = P.yaw; me.anim.update(dt, t, P.vel, emote);
}
const clock = new THREE.Clock(); let running = true, frames = 0, hintT = 0, wxT = 0;
function loop() {
  if (!running) return; requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if ((wxT -= dt) < 0) { wxT = 2; updWeather(); }
  if (started) { updatePlayer(dt, t); refreshCtx(); updateSales(dt); if ((hintT -= dt) < 0) { hintT = .6; updHint(); } } else me.anim.update(dt, t, 0, '');
  updateCustomers(dt, t); W.update(dt, t, P.pos); updateRemotes(dt, t); updateCamera(dt); updateTags(); renderer.render(scene, camera); frames++;
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; clock.getDelta(); if (running) loop(); });

/* ============ 14. NÚT BẤM ============ */
$('bCraft').onclick = () => openCraft(); $('bMarket').onclick = () => openMarket(); $('bInfo').onclick = () => curLand && openLand(curLand); $('bPhoto').onclick = () => { if (!locked()) doPhoto(); };
const BAR = { stall: openStall, market: () => openMarket(), home: goHome, friends: openFriends, rank: openRank, chat: openChat, emote: () => openAvatar(false), more: openMore };
document.querySelectorAll('#bar [data-b]').forEach(b => b.onclick = () => { if (!started) return; if (panelOpen()) closePanel(); BAR[b.dataset.b](); });
addEventListener('beforeunload', () => Net.leave());

/* ============ 15. MÀN CHÀO ============ */
$('nameIn').value = save.name; $('bEnter').disabled = false; $('bEnter').textContent = 'Vào Đà Lạt'; updCounters(); refreshNetChip(); refreshOpenBtn(); buildMyStall(); updWeather();
function enter() {
  const n = $('nameIn').value.replace(/[<>]/g, '').trim().slice(0, 20); save.name = dirty(n) ? '' : n; persist(); Snd.start(); buildMyStall();
  $('splash').style.display = 'none'; started = true; $('hud').style.visibility = 'visible'; ctxKey = ''; refreshCtx(); updHint();
  if (!save.avDone) openAvatar(true); else if (!save.tutDone) tutorial(0); goOnline();
}
$('bEnter').onclick = enter; $('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') enter(); });
if (isPaid()) Net.init().then(ok => { refreshNetChip(); if (ok) goOnline(); });
$('hud').style.visibility = 'hidden'; loop();
window.DL = { save, P, W, cam, Net, R, scene, camera, renderer, PRODUCTS, cust, openStall, openMarket, openCraft, openPay, openLand, setOpen, goHome, spawnCustomer, craftGame, stockN, cap, state: () => ({ started, frames, curLand: curLand && curLand.id, open: save.open, lvl: lvl(), paid: isPaid(), custN: cust.length }) };
window.dispatchEvent(new Event('dl-ready'));
