// Đi Chùa Online: chánh điện (bàn thờ ảo + hiệu ứng), lời nguyện realtime, lịch từ CMS và nhận quà TikTok LIVE → lời nguyện lành.
// Dữ liệu: Firebase `dichua/*` (xem FIREBASE.md). Quà TikTok đến từ relay (tools/dichua-relay) qua Firebase `dichua/gifts` hoặc SSE (`relayUrl`).
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = new URLSearchParams(location.search), LIVE = qs.get('live') === '1';
  if (LIVE) document.body.classList.add('live');
  const store = { get(k, d) { try { const v = localStorage.getItem('dc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('dc_' + k, JSON.stringify(v)); } catch (e) {} } };
  let toastT; const toast = m => { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); };
  const safeImg = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } };
  const safeTikTok = u => { try { const x = new URL(u); return x.protocol === 'https:' && (x.hostname === 'tiktok.com' || x.hostname.endsWith('.tiktok.com')) ? x.href : ''; } catch (e) { return ''; } };

  /* ================= ÂM THANH (WebAudio tự tạo) ================= */
  let AC = null, master = null, soundOn = store.get('sound', false), musicOn = false, musicNodes = null, musicTimer = 0;
  function ctx() { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = soundOn ? 0.9 : 0; master.connect(AC.destination); } if (AC.state === 'suspended') AC.resume(); return AC; }
  function setSound(on) { soundOn = on; store.set('sound', on); const a = ctx(); master.gain.setTargetAtTime(on ? 0.9 : 0, a.currentTime, 0.05); $('#btnSound').textContent = on ? '🔊 Âm thanh' : '🔇 Âm thanh'; if (!on && musicOn) toggleMusic(false); }
  function bell() { if (!soundOn) return; const a = ctx(), t = a.currentTime; [[196, 1], [392.8, .6], [588.6, .38], [790, .22], [1180, .12]].forEach(([f, v]) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32 * v, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + 5.5 * (v > .3 ? 1 : .6)); o.connect(g); g.connect(master); o.start(t); o.stop(t + 6); }); }
  function fish() { if (!soundOn) return; const a = ctx(), t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(820, t); o.frequency.exponentialRampToValueAtTime(330, t + .09); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g); g.connect(master); o.start(t); o.stop(t + .25); }
  function toggleMusic(on) {
    musicOn = on === undefined ? !musicOn : on; $('#btnMusic').classList.toggle('on', musicOn);
    if (musicOn && !soundOn) setSound(true);
    const a = ctx();
    if (musicOn) {
      const g = a.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.5, a.currentTime, 2); g.connect(master);
      const oscs = [73.4, 110, 146.8].map((f, i) => { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (i - 1) * .002); const og = a.createGain(); og.gain.value = [.5, .35, .2][i]; o.connect(og); og.connect(g); o.start(); return o; });
      const pent = [293.7, 329.6, 370, 440, 493.9, 587.3]; let i = 0;
      const pluck = () => { if (!musicOn) return; const t = a.currentTime, f = pent[(i++ * 3 + Math.floor(Math.random() * 3)) % pent.length], o = a.createOscillator(), pg = a.createGain(); o.type = 'sine'; o.frequency.value = f; pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(.16, t + .04); pg.gain.exponentialRampToValueAtTime(.001, t + 4); o.connect(pg); pg.connect(g); o.start(t); o.stop(t + 4.2); musicTimer = setTimeout(pluck, 2600 + Math.random() * 2600); };
      pluck(); musicNodes = { g, oscs };
    } else if (musicNodes) { clearTimeout(musicTimer); const { g, oscs } = musicNodes; g.gain.setTargetAtTime(0, a.currentTime, .6); setTimeout(() => oscs.forEach(o => { try { o.stop(); } catch (e) {} }), 2500); musicNodes = null; }
  }

  /* ================= HIỆU ỨNG: khói nhang + cánh sen (canvas) ================= */
  const cv = $('#fx'), g2 = cv.getContext('2d'); let W = 0, H = 0, parts = [], petals = [];
  const resize = () => { W = cv.width = innerWidth * Math.min(devicePixelRatio, 2); H = cv.height = innerHeight * Math.min(devicePixelRatio, 2); };
  resize(); addEventListener('resize', resize);
  const sticks = []; // { el, lit, life }
  function emitSmoke() {
    $$('.stick:not(.out)').forEach(st => { const r = st.getBoundingClientRect(), k = cv.width / innerWidth; if (Math.random() < .5) parts.push({ x: (r.left + r.width / 2) * k, y: (r.top - 2) * k, vx: (Math.random() - .5) * .25, vy: -(.6 + Math.random() * .5), r: 4 + Math.random() * 5, a: .22, t: 0, ph: Math.random() * 6 }); });
    while (petals.length < 14) petals.push({ x: Math.random() * cv.width, y: -20, s: 5 + Math.random() * 7, vy: .4 + Math.random() * .6, ph: Math.random() * 6, rot: Math.random() * 6 });
  }
  function frame(ts) {
    g2.clearRect(0, 0, W, H); const k = cv.width / innerWidth; emitSmoke();
    parts = parts.filter(p => p.a > .01); parts.forEach(p => { p.t++; p.ph += .03; p.x += p.vx + Math.sin(p.ph) * .5; p.y += p.vy; p.r += .09; p.a *= .985; const gr = g2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(236,226,210,${p.a})`); gr.addColorStop(1, 'rgba(236,226,210,0)'); g2.fillStyle = gr; g2.beginPath(); g2.arc(p.x, p.y, p.r, 0, 7); g2.fill(); });
    petals.forEach(p => { p.y += p.vy; p.ph += .02; p.x += Math.sin(p.ph) * .6; p.rot += .01; if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; } g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.fillStyle = 'rgba(255,200,215,.38)'; g2.beginPath(); g2.ellipse(0, 0, p.s * k * .7, p.s * k * 1.4, 0, 0, 7); g2.fill(); g2.restore(); });
    requestAnimationFrame(frame);
  }
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) requestAnimationFrame(frame);
  // nghiêng nhẹ tượng theo con trỏ (hiệu ứng 3D)
  const scene = $('#scene'); scene.addEventListener('pointermove', e => { const r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; const b = $('.buddha'); b.style.setProperty('--ry', (x * 9).toFixed(1) + 'deg'); b.style.setProperty('--rx', (-y * 6).toFixed(1) + 'deg'); });

  /* ================= BÀN THỜ ================= */
  const FLOWERS = ['🪷', '🌸', '🌼', '🪷', '🌺'];
  function addFlower(n = 1) { const v = $('#vase'); for (let i = 0; i < n; i++) { const el = document.createElement('i'); el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)]; v.appendChild(el); } while (v.children.length > 14) v.removeChild(v.firstChild); }
  function lightIncense() {
    const box = $('#sticks'); if ($$('.stick:not(.out)', box).length >= 5) { toast('Lư hương đã đầy nhang, xin đợi nhang cháy bớt.'); return false; }
    const st = document.createElement('div'); st.className = 'stick'; st.style.height = '70px'; box.appendChild(st); const dur = 5 * 60 * 1000, t0 = Date.now();
    const iv = setInterval(() => { const f = 1 - (Date.now() - t0) / dur; if (f <= 0) { clearInterval(iv); st.classList.add('out'); setTimeout(() => st.remove(), 4000); return; } st.style.height = Math.max(10, 70 * f) + 'px'; }, 2000);
    return true;
  }
  let last = 0, db = null, uid = null, TS = null; const counts = { flower: 0, incense: 0, bell: 0, fish: 0 };
  function bump(k) { if (!db) return; db.ref('dichua/stats/' + k).transaction(v => (v || 0) + 1).catch(() => {}); }
  function act(a) {
    const now = Date.now(); if (now - last < 450) return; last = now;
    if (a === 'music') return toggleMusic();
    if (!soundOn && (a === 'bell' || a === 'fish')) setSound(true);
    if (a === 'flower') { addFlower(); bump('flower'); toast('Con xin dâng đóa sen lên Phật 🪷'); }
    else if (a === 'incense') { if (lightIncense()) { bump('incense'); toast('Một nén tâm hương – tâm thành kính 🕯️'); } }
    else if (a === 'bell') { bell(); bump('bell'); }
    else if (a === 'fish') { fish(); bump('fish'); }
  }
  $('#controls').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a); });
  $('#btnSound').onclick = () => setSound(!soundOn); setSound(false); if (soundOn) $('#btnSound').textContent = '🔊 Âm thanh';
  addFlower(3);

  /* ================= LỜI NGUYỆN TỰ TẠO KHI CÓ QUÀ ================= */
  const OPEN = ['Nam mô A Di Đà Phật.', 'Mô Phật, thiện tai thiện tai.', 'A Di Đà Phật, chùa xin tùy hỷ.', 'Nam mô Bổn Sư Thích Ca Mâu Ni Phật.', 'Nam mô Quan Thế Âm Bồ Tát.'];
  const THANKS = ['Cảm ơn {n} đã gửi tặng {g}', 'Chùa xin tùy hỷ tấm lòng của {n} với {g}', 'Công đức của {n} qua món quà {g} xin được hồi hướng', 'Một món quà {g} từ {n} – thật là duyên lành'];
  const VOW = [
    ['Nguyện cho {n} tâm thường an lạc, mỗi ngày đều có một niềm vui nhỏ.', 'Nguyện cho {n} bước đi nhẹ nhàng, gặp nhiều người hiền.', 'Nguyện cho gia đình {n} bình an, ấm êm.'],
    ['Nguyện cho {n} và gia quyến thân tâm khỏe mạnh, công việc hanh thông.', 'Nguyện cho {n} gieo nhân lành, gặt quả ngọt, tâm không phiền não.', 'Nguyện cho mọi điều lành tìm đến {n} như hoa sen nở giữa mùa hạ.'],
    ['Nguyện cho {n} cùng cửu huyền thất tổ an vui, phước huệ tròn đầy.', 'Nguyện cho {n} vạn sự cát tường, trí tuệ sáng soi, từ bi rộng mở.', 'Nguyện ánh sáng Phật pháp soi đường, độ cho {n} và người thương vượt qua mọi nghịch cảnh.']
  ];
  const CLOSE = ['Nam mô A Di Đà Phật 🙏', 'Hồi hướng công đức cho muôn loài 🪷', 'Chúc {n} một ngày an lành 🌸', 'Gieo tâm lành, đón bình an 🪷'];
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  function blessing(ev) {
    const r = hash((ev.u || '') + '|' + (ev.g || '') + '|' + (ev.at || Date.now()) + '|' + Math.random()), pick = (a, o = 0) => a[(r >>> o) % a.length];
    const tier = ev.d >= 500 ? 2 : ev.d >= 30 ? 1 : 0, g = (ev.n > 1 ? ev.n + ' ' : '') + ev.g;
    const f = s => s.replace(/\{n\}/g, ev.u).replace(/\{g\}/g, g);
    return [pick(OPEN, 3), f(pick(THANKS, 7)) + '.', f(pick(VOW[tier], 11)), f(pick(CLOSE, 15))].join(' ');
  }
  const queue = []; let showing = false, donors = {};
  function showGift(ev) { queue.push(ev); if (!showing) next(); }
  function next() {
    const ev = queue.shift(); if (!ev) { showing = false; $('#giftPop').hidden = true; return; } showing = true;
    const pop = $('#giftPop'), av = safeImg(ev.av), txt = blessing(ev);
    $('#gpAv').src = av || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#3a2a20"/><text x="32" y="44" font-size="34" text-anchor="middle">🪷</text></svg>');
    $('#gpName').textContent = ev.u; $('#gpGift').textContent = '🎁 ' + (ev.n > 1 ? ev.n + ' × ' : '') + ev.g + (ev.d ? ' · ' + ev.d + ' 💎' : ''); $('#gpText').textContent = txt;
    pop.hidden = false; pop.style.animation = 'none'; void pop.offsetWidth; pop.style.animation = ''; bell(); addFlower(Math.min(4, 1 + Math.floor((ev.d || 0) / 30)));
    $('#ticker').textContent = '🙏 ' + ev.u + ' – ' + txt;
    const k = ev.id || ev.u, d = donors[k] || (donors[k] = { u: ev.u, av, d: 0, n: 0 }); d.d += ev.d || 0; d.n += ev.n || 1; renderDonors();
    if (store.get('tts', false) && 'speechSynthesis' in window) { try { const u = new SpeechSynthesisUtterance(txt); u.lang = 'vi-VN'; speechSynthesis.speak(u); } catch (e) {} }
    setTimeout(next, LIVE ? 9000 : 7000);
  }
  function renderDonors() {
    const arr = Object.values(donors).sort((a, b) => b.d - a.d).slice(0, 8);
    $('#donorList').innerHTML = arr.map(x => `<div class="donor"><img alt="" referrerpolicy="no-referrer" src="${esc(x.av || '')}" onerror="this.style.visibility='hidden'"><div><b>${esc(x.u)}</b><small>${x.n} quà · ${x.d} 💎</small></div></div>`).join('') || '<p class="note">Chưa có quà tặng nào trong phiên này.</p>';
  }
  const cleanEv = e => { if (!e || typeof e !== 'object') return null; const u = String(e.u || '').trim().slice(0, 40), g = String(e.g || 'quà').trim().slice(0, 40); if (!u) return null; return { u, g, id: String(e.id || '').slice(0, 40), av: safeImg(e.av), n: Math.max(1, Math.min(9999, +e.n || 1)), d: Math.max(0, Math.min(1e7, +e.d || 0)), at: +e.at || Date.now() }; };
  window.DCO = { gift: ev => { const c = cleanEv(ev); if (c) showGift(c); return c; }, blessing, parseTikTok: safeTikTok };

  /* ================= CẤU HÌNH + LỊCH (từ CMS) ================= */
  const DEF_SCHEDULE = [{ t: '05:30', h: 'Công phu khuya', s: 'Tụng kinh – niệm Phật' }, { t: '08:00', h: 'Pháp thoại buổi sáng', s: 'Lắng nghe và thực tập chánh niệm' }, { t: '18:30', h: 'Lễ sám hối – cầu an', s: 'Thời khóa buổi tối' }];
  function renderSchedule(list) {
    list = (Array.isArray(list) ? list : Object.values(list || {})).filter(x => x && x.t && x.h); if (!list.length) list = DEF_SCHEDULE;
    const mins = x => { const m = /^(\d{1,2}):(\d{2})$/.exec(x.t); return m ? +m[1] * 60 + +m[2] : 0; }, now = new Date().getHours() * 60 + new Date().getMinutes();
    list.sort((a, b) => mins(a) - mins(b)); let cur = -1; list.forEach((x, i) => { if (mins(x) <= now) cur = i; });
    $('#schedule').innerHTML = list.map((x, i) => `<div class="schedule-item${i === cur ? ' now' : ''}"><div class="time">${esc(x.t)}</div><div><strong>${esc(x.h)}</strong>${x.s ? `<small>${esc(x.s)}</small>` : ''}</div></div>`).join('');
  }
  let sse = null;
  function applyConfig(c) {
    c = c || {}; renderSchedule(c.schedule);
    if (c.quote) $('#quote').innerHTML = `“${esc(c.quote)}”<small>Góc suy ngẫm</small>`;
    const live = safeTikTok(c.liveUrl) || (c.tiktokUser && /^[\w.]{2,40}$/.test(c.tiktokUser.replace(/^@/, '')) ? 'https://www.tiktok.com/@' + c.tiktokUser.replace(/^@/, '') + '/live' : '');
    if (live) { $('#openLive').href = live; $('#liveStatus').textContent = 'Kênh LIVE: ' + (c.tiktokUser ? '@' + c.tiktokUser.replace(/^@/, '') : 'TikTok'); }
    if (c.tkText) $('#tkText').textContent = c.tkText;
    const relay = qs.get('relay') || c.relayUrl; if (relay && !sse) connectRelay(relay);
  }
  function connectRelay(url) {
    try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return; sse = new EventSource(u.href.replace(/\/?$/, '/') + 'events'); sse.onmessage = m => { try { const d = JSON.parse(m.data); if (d.type === 'gift' || d.g) { const c = cleanEv(d.type === 'gift' ? d : d); if (c) showGift(c); } } catch (e) {} }; sse.onopen = () => { $('#liveStatus').textContent = '🟢 Đã nối relay TikTok LIVE'; }; } catch (e) {}
  }

  /* ================= FIREBASE: lời nguyện, đếm, hiện diện, quà ================= */
  const loaded = Date.now();
  async function boot() {
    renderSchedule(null); renderDonors();
    try {
      const f = await GV.fbInfo().fb(); db = f.db; uid = f.uid; TS = f.TS;
    } catch (e) { $('#wishes').innerHTML = '<p class="note">Chưa kết nối được máy chủ – bàn thờ vẫn dùng được, nhưng lời nguyện sẽ chưa đồng bộ.</p>'; return; }
    db.ref('dichua/config').on('value', s => applyConfig(s.val()));
    db.ref('dichua/stats').on('value', s => { const v = s.val() || {}; Object.assign(counts, { flower: v.flower || 0, incense: v.incense || 0, bell: v.bell || 0, fish: v.fish || 0 }); $('#statLine').textContent = `🪷 ${counts.flower} đóa sen · 🕯️ ${counts.incense} nén nhang · 🔔 ${counts.bell} hồi chuông · 🪘 ${counts.fish} tiếng mõ`; });
    const pr = db.ref('dichua/presence/' + uid); pr.onDisconnect().remove(); pr.set({ at: TS, n: (store.get('name', '') || '').slice(0, 40) }).catch(() => {});
    db.ref('dichua/presence').on('value', s => { const n = s.numChildren(); $('#onlineTag').textContent = n + ' người đang hiện diện'; });
    const wl = $('#wishes'); let first = true; wl.innerHTML = '';
    db.ref('dichua/wishes').orderByChild('at').limitToLast(30).on('child_added', s => { const w = s.val(); if (!w) return; if (first) first = false; const el = document.createElement('div'); el.className = 'wish'; el.innerHTML = `<b>${esc(w.n || 'Một người bạn lành')}</b>${esc(w.t)}`; wl.prepend(el); while (wl.children.length > 30) wl.lastChild.remove(); if (!LIVE || true) $('#ticker').textContent = '🪷 ' + (w.n || 'Một người bạn lành') + ': ' + w.t; });
    db.ref('dichua/gifts').orderByChild('at').startAt(loaded - 8000).limitToLast(20).on('child_added', s => { const c = cleanEv(s.val()); if (c) showGift(c); });
  }
  $('#person').value = store.get('name', '');
  $('#prayerForm').addEventListener('submit', async e => {
    e.preventDefault(); const t = $('#wish').value.trim(), n = $('#person').value.trim().slice(0, 40); if (!t) return; store.set('name', n);
    if (!db) return toast('Chưa kết nối được máy chủ, hãy thử lại sau.');
    try { await db.ref('dichua/wishes').push({ n: n || null, t: t.slice(0, 500), at: TS }); $('#wish').value = ''; toast('Lời nguyện đã được gửi 🙏'); bell(); } catch (er) { toast('Không gửi được: ' + (GV.fbInfo().explain(er))); }
  });

  /* ================= CHÁNH NIỆM 1 PHÚT ================= */
  let breathing = false;
  $('#breathBtn').onclick = function () {
    if (breathing) return; breathing = true; let rem = 60; this.disabled = true; const c = $('#breathCircle'), tx = $('#breathText'), b = this;
    (function tick() { if (rem <= 0) { c.style.transform = 'scale(1)'; c.textContent = 'An trú'; tx.textContent = 'Hoàn thành – chúc bạn một ngày an lành'; b.disabled = false; breathing = false; return; } if (rem % 8 >= 4) { c.style.transform = 'scale(1.22)'; c.style.background = '#d9ad6d18'; c.textContent = 'Hít vào'; tx.textContent = 'Hít vào nhẹ nhàng'; } else { c.style.transform = 'scale(1)'; c.style.background = 'transparent'; c.textContent = 'Thở ra'; tx.textContent = 'Thở ra chậm rãi'; } rem--; setTimeout(tick, 1000); })();
  };
  if (LIVE) { $('#btnLive').textContent = '⬅ Thoát chế độ LIVE'; $('#btnLive').href = './'; }
  boot();
  setInterval(() => { if (db) { /* làm mới highlight giờ hiện tại */ db.ref('dichua/config/schedule').once('value').then(s => renderSchedule(s.val())).catch(() => {}); } }, 5 * 60 * 1000);
})();
