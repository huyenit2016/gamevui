// Game hành động & phiêu lưu: Xe tăng, Bắn tỉa, Không chiến, Phòng thủ tháp, Câu cá, Người que chạy, Đặt bom, Nhà ma
(function () {
  const $ = (el, s) => el.querySelector(s);
  const hud = (id, extra = '') => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id)}</b></span>${extra}<button class="btn rs">Chơi lại</button></div>`;
  function loop(fn) { let id, last = performance.now(); const t = now => { const dt = Math.min(0.033, (now - last) / 1000); last = now; fn(dt); id = requestAnimationFrame(t); }; id = requestAnimationFrame(t); return () => cancelAnimationFrame(id); }
  const pos = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  function held() {
    const k = {}, dn = e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return; k[e.key.toLowerCase()] = 1; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }, up = e => { k[e.key.toLowerCase()] = 0; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up); return { k, off() { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); } };
  }
  const BG = '#0D0F14';
  // nút cảm ứng giữ: đặt k[key]=1 khi nhấn
  function pad(el, k, spec) {
    const d = document.createElement('div'); d.className = 'row'; d.style.cssText = 'gap:8px;touch-action:none'; d.innerHTML = spec.map(([key, lb]) => `<button class="btn ghost" data-k="${key}" style="min-width:56px;min-height:52px;font-size:20px;touch-action:none;user-select:none">${lb}</button>`).join('');
    const set = (e, v) => { const b = e.target.closest('[data-k]'); if (b) { k[b.dataset.k] = v; e.preventDefault(); } };
    d.addEventListener('pointerdown', e => set(e, 1)); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => d.addEventListener(n, e => { d.querySelectorAll('[data-k]').forEach(b => k[b.dataset.k] = 0); }));
    el.appendChild(d); return d;
  }

  /* ---------- XE TĂNG ---------- */
  GV.register({
    id: 'tank2', type: 'game', cat: 'Hai người', name: 'Xe tăng đối kháng', icon: '🪖', desc: 'Hai xe tăng đấu nhau trong đấu trường có tường. Chơi 2 người một máy hoặc đấu với máy – ai thắng 3 hiệp trước thắng!',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Xanh: <b class="a">0</b></span><span>Đỏ: <b class="b">0</b></span><select class="md"><option value="bot">Đấu với máy</option><option value="two">2 người</option></select><button class="btn rs">Chơi lại</button></div><canvas class="cv" width="480" height="360"></canvas><p class="msg"></p><p class="hint">Xanh: W/S tiến-lùi · A/D xoay · Space bắn. Đỏ: ↑/↓ · ←/→ · Enter bắn. Điện thoại: dùng nút bên dưới (xe xanh).</p>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 360, K = held(), PK = {};
      let walls, A, B, bul, wa, wb, round, over, lock;
      function mk() { walls = [[0, 0, W, 10], [0, H - 10, W, 10], [0, 0, 10, H], [W - 10, 0, 10, H]]; for (let i = 0; i < 6; i++) { const w = 20 + GV.rnd(50), h = 20 + GV.rnd(70), x = 90 + GV.rnd(W - 200), y = 30 + GV.rnd(H - 100); if (Math.abs(x + w / 2 - 60) > 60 && Math.abs(x + w / 2 - (W - 60)) > 60) walls.push([x, y, w, h]); } A = { x: 50, y: H / 2, a: 0, hp: 3, cd: 0, c: '#42A5F5' }; B = { x: W - 50, y: H / 2, a: Math.PI, hp: 3, cd: 0, c: '#EF5350' }; bul = []; lock = 0; }
      function reset() { wa = wb = 0; over = false; $(el, '.a').textContent = $(el, '.b').textContent = 0; $(el, '.msg').textContent = ''; mk(); }
      const hitW = (x, y, r) => walls.some(w => x + r > w[0] && x - r < w[0] + w[2] && y + r > w[1] && y - r < w[1] + w[3]);
      function drive(t, fw, rot, dt) { t.a += rot * 2.6 * dt; const nx = t.x + Math.cos(t.a) * fw * 90 * dt, ny = t.y + Math.sin(t.a) * fw * 90 * dt; if (!hitW(nx, t.y, 13)) t.x = nx; if (!hitW(t.x, ny, 13)) t.y = ny; }
      function fire(t, o) { if (t.cd > 0 || over || lock > 0) return; t.cd = .6; bul.push({ x: t.x + Math.cos(t.a) * 18, y: t.y + Math.sin(t.a) * 18, vx: Math.cos(t.a) * 300, vy: Math.sin(t.a) * 300, o, life: 2.2, bn: 1 }); GV.beep(300, 40); }
      function step(dt) {
        const k = Object.assign({}, K.k); Object.keys(PK).forEach(x => { if (PK[x]) k[x] = 1; });
        if (!over && lock <= 0) {
          drive(A, (k.w ? 1 : 0) - (k.s ? 1 : 0), (k.d ? 1 : 0) - (k.a ? 1 : 0), dt); if (k[' ']) fire(A, 'A');
          if ($(el, '.md').value === 'two') { drive(B, (k.arrowup ? 1 : 0) - (k.arrowdown ? 1 : 0), (k.arrowright ? 1 : 0) - (k.arrowleft ? 1 : 0), dt); if (k.enter) fire(B, 'B'); }
          else { let da = Math.atan2(A.y - B.y, A.x - B.x) - B.a; da = Math.atan2(Math.sin(da), Math.cos(da)); drive(B, Math.hypot(A.x - B.x, A.y - B.y) > 150 ? .7 : -.2, Math.max(-1, Math.min(1, da * 3)) * .85, dt); if (Math.abs(da) < .12) fire(B, 'B'); }
        }
        lock -= dt; A.cd -= dt; B.cd -= dt;
        bul.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; for (const w of walls) if (b.x > w[0] && b.x < w[0] + w[2] && b.y > w[1] && b.y < w[1] + w[3]) { if (b.bn-- > 0) { const px = b.x - b.vx * dt, py = b.y - b.vy * dt; if (px < w[0] || px > w[0] + w[2]) b.vx *= -1; else b.vy *= -1; b.x = px; b.y = py; } else b.life = 0; } [[A, 'B'], [B, 'A']].forEach(([t, o]) => { if (b.life > 0 && b.o === o && Math.hypot(b.x - t.x, b.y - t.y) < 15 && !over && lock <= 0) { b.life = 0; t.hp--; GV.beep(160, 160); if (t.hp <= 0) { if (o === 'A') wa++; else wb++; $(el, '.a').textContent = wa; $(el, '.b').textContent = wb; if (wa >= 3 || wb >= 3) { over = true; $(el, '.msg').textContent = (wa >= 3 ? 'XANH' : 'ĐỎ') + ' thắng trận! 🏆'; } else { $(el, '.msg').textContent = 'Hiệp mới!'; setTimeout(() => { if (cv.isConnected && !over) { mk(); $(el, '.msg').textContent = ''; } }, 900); lock = 1; } } } }); }); bul = bul.filter(b => b.life > 0);
        c.fillStyle = '#1b2a1b'; c.fillRect(0, 0, W, H); c.fillStyle = '#546E7A'; walls.forEach(w => c.fillRect(w[0], w[1], w[2], w[3]));
        [A, B].forEach(t => { c.save(); c.translate(t.x, t.y); c.rotate(t.a); c.fillStyle = t.c; c.fillRect(-14, -11, 28, 22); c.fillStyle = '#fff3'; c.fillRect(-14, -11, 28, 5); c.fillStyle = '#263238'; c.fillRect(0, -3, 20, 6); c.restore(); c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { c.globalAlpha = i < t.hp ? 1 : .2; c.fillRect(t.x - 12 + i * 9, t.y - 24, 7, 3); } c.globalAlpha = 1; });
        c.fillStyle = '#FFD54F'; bul.forEach(b => { c.beginPath(); c.arc(b.x, b.y, 3, 0, 7); c.fill(); });
      }
      pad(el, PK, [['a', '↺'], ['w', '▲'], ['s', '▼'], ['d', '↻'], [' ', '🔥']]);
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); K.off(); };
    }
  });

  /* ---------- BẮN TỈA ---------- */
  GV.register({
    id: 'sniper', type: 'game', cat: 'Hành động', name: 'Xạ thủ bắn tỉa', icon: '🎯', desc: 'Ngắm qua ống kính, hạ mục tiêu xuất hiện ở cửa sổ – nhắm đầu được thưởng thêm, đừng bắn nhầm dân thường!',
    mount(el) {
      el.innerHTML = hud('sniper', '<span>Đạn: <b class="am">6</b></span><span>Còn: <b class="tm">40</b>s</span>') + '<canvas class="cv" width="480" height="360"></canvas><p class="msg"></p><p class="hint">Di chuột / kéo ngón tay để ngắm (tâm hơi rung), chạm hoặc Space để bắn. Hết đạn sẽ nạp tự động.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 360; let ws, mx, my, t, score, ammo, rl, time, over, sway, fx;
      function reset() { ws = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) ws.push({ x: 40 + i * 110, y: 50 + j * 100, tg: null, t: 0 }); mx = W / 2; my = H / 2; t = 0; score = 0; ammo = 6; rl = 0; time = 40; over = false; fx = []; $(el, '.sc').textContent = 0; $(el, '.am').textContent = 6; $(el, '.msg').textContent = ''; }
      function shoot() {
        if (over || rl > 0) return; if (ammo <= 0) return; ammo--; $(el, '.am').textContent = ammo; if (!ammo) rl = 1.2; const sx = mx + sway.x, sy = my + sway.y; GV.beep(200, 90);
        for (const w of ws) if (w.tg && sx > w.x && sx < w.x + 84 && sy > w.y && sy < w.y + 84) { const ty = w.y + 30, head = sy < w.y + 34; if (w.tg === 'bad') { const pts = head ? 30 : 15; score += pts; fx.push({ x: sx, y: sy, t: .5, s: '+' + pts, c: '#FFD54F' }); } else { score = Math.max(0, score - 25); fx.push({ x: sx, y: sy, t: .6, s: '-25', c: '#EF5350' }); } w.tg = null; $(el, '.sc').textContent = score; return; }
      }
      function step(dt) {
        if (!over) { time -= dt; $(el, '.tm').textContent = Math.max(0, Math.ceil(time)); if (time <= 0) { over = true; $(el, '.msg').textContent = 'Hết giờ! Điểm: ' + score; if (GV.setBest('sniper', score)) $(el, '.bs').textContent = score; }
          t += dt; if (rl > 0) { rl -= dt; if (rl <= 0) { ammo = 6; $(el, '.am').textContent = 6; } }
          ws.forEach(w => { if (w.tg) { w.t -= dt; if (w.t <= 0) w.tg = null; } else if (GV.rnd(100) < 2 && ws.filter(x => x.tg).length < 3) { w.tg = GV.rnd(4) ? 'bad' : 'civ'; w.t = 1.1 + Math.random() * 1.2; } }); }
        sway = { x: Math.sin(t * 2.1) * 5, y: Math.cos(t * 1.7) * 5 }; fx.forEach(f => f.t -= dt); fx = fx.filter(f => f.t > 0);
        c.fillStyle = '#263238'; c.fillRect(0, 0, W, H); c.fillStyle = '#37474F'; for (let i = 0; i < 6; i++) c.fillRect(i * 85, 10, 78, H);
        ws.forEach(w => { c.fillStyle = '#10151a'; c.fillRect(w.x, w.y, 84, 84); if (w.tg) { c.font = '56px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w.tg === 'bad' ? '🥷' : '🧑‍🌾', w.x + 42, w.y + 48); } c.strokeStyle = '#78909C'; c.lineWidth = 4; c.strokeRect(w.x, w.y, 84, 84); });
        fx.forEach(f => { c.globalAlpha = Math.min(1, f.t * 3); c.fillStyle = f.c; c.font = 'bold 20px Roboto,sans-serif'; c.textAlign = 'center'; c.fillText(f.s, f.x, f.y - (0.6 - f.t) * 40); c.globalAlpha = 1; });
        const sx = mx + sway.x, sy = my + sway.y; c.fillStyle = '#000000b3'; c.beginPath(); c.rect(0, 0, W, H); c.arc(sx, sy, 62, 0, 7, true); c.fill('evenodd');
        c.strokeStyle = '#E53935'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx - 62, sy); c.lineTo(sx + 62, sy); c.moveTo(sx, sy - 62); c.lineTo(sx, sy + 62); c.stroke(); c.beginPath(); c.arc(sx, sy, 62, 0, 7); c.stroke();
        if (rl > 0) { c.fillStyle = '#fff'; c.font = '16px Roboto,sans-serif'; c.textAlign = 'center'; c.fillText('Đang nạp đạn…', W / 2, H - 14); }
      }
      cv.addEventListener('pointermove', e => { const p = pos(cv, e); mx = p.x; my = p.y; }); cv.addEventListener('pointerdown', e => { const p = pos(cv, e); mx = p.x; my = p.y; shoot(); });
      const off = GV.keys(e => { if (e.key === ' ') shoot(); }); $(el, '.rs').onclick = reset; reset(); sway = { x: 0, y: 0 }; const stop = loop(step); return () => { stop(); off(); };
    }
  });

  /* ---------- KHÔNG CHIẾN ---------- */
  GV.register({
    id: 'airfight', type: 'game', cat: 'Hành động', name: 'Không chiến', icon: '🛩️', desc: 'Lái máy bay tự động bắn, hạ máy bay địch, nhặt ⭐ để nâng cấp đạn. Kéo ngón tay để di chuyển!',
    mount(el) {
      el.innerHTML = hud('airfight', '<span>Mạng: <b class="lv">3</b></span>') + '<canvas class="cv" width="360" height="520" style="max-height:68vh;width:auto"></canvas><p class="msg"></p><p class="hint">Kéo ngón tay / di chuột để bay, hoặc dùng mũi tên. Máy bay tự bắn.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 360, H = 520, K = held(); let P, es, bs, eb, pu, score, lives, t, sp, fire, over, inv;
      function reset() { P = { x: W / 2, y: H - 80, lv: 1 }; es = []; bs = []; eb = []; pu = []; score = 0; lives = 3; t = 0; sp = 0; fire = 0; over = false; inv = 0; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; $(el, '.msg').textContent = ''; }
      function hurt() { if (inv > 0) return; lives--; inv = 1.5; P.lv = Math.max(1, P.lv - 1); $(el, '.lv').textContent = lives; GV.beep(130, 300); if (lives <= 0) { over = true; $(el, '.msg').textContent = 'Máy bay rơi! Điểm: ' + score; if (GV.setBest('airfight', score)) $(el, '.bs').textContent = score; } }
      function step(dt) {
        if (!over) {
          t += dt; inv -= dt; if (K.k.arrowleft || K.k.a) P.x -= 240 * dt; if (K.k.arrowright || K.k.d) P.x += 240 * dt; if (K.k.arrowup || K.k.w) P.y -= 240 * dt; if (K.k.arrowdown || K.k.s) P.y += 240 * dt; P.x = Math.max(20, Math.min(W - 20, P.x)); P.y = Math.max(40, Math.min(H - 20, P.y));
          fire -= dt; if (fire <= 0) { fire = .2; const L = P.lv; for (let i = 0; i < L; i++) bs.push({ x: P.x + (i - (L - 1) / 2) * 14, y: P.y - 22, vx: (i - (L - 1) / 2) * 40, vy: -460 }); }
          sp -= dt; if (sp <= 0) { const big = t > 12 && GV.rnd(5) === 0; es.push({ x: 24 + GV.rnd(W - 48), y: -30, hp: big ? 6 : 1 + (t > 25 ? 1 : 0), big, vy: big ? 45 : 70 + GV.rnd(50), sh: 1 + Math.random() * 1.5 }); sp = Math.max(.35, 1.1 - t * .01); }
          bs.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; }); bs = bs.filter(b => b.y > -20);
          es.forEach(e => { e.y += e.vy * dt; if (e.big) { e.sh -= dt; if (e.sh <= 0) { e.sh = 1.4; eb.push({ x: e.x, y: e.y + 20, vx: (P.x - e.x) * .35, vy: 190 }); } } });
          bs.forEach(b => es.forEach(e => { if (!b.dead && Math.hypot(b.x - e.x, b.y - e.y) < (e.big ? 26 : 18)) { b.dead = true; e.hp--; if (e.hp <= 0) { e.dead = true; score += e.big ? 50 : 10; $(el, '.sc').textContent = score; GV.beep(500, 50); if (GV.rnd(e.big ? 2 : 9) === 0) pu.push({ x: e.x, y: e.y }); } } })); bs = bs.filter(b => !b.dead); es = es.filter(e => !e.dead && e.y < H + 40);
          es.forEach(e => { if (Math.hypot(e.x - P.x, e.y - P.y) < 26) { e.dead = true; hurt(); } }); es = es.filter(e => !e.dead);
          eb.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.hypot(b.x - P.x, b.y - P.y) < 15) { b.dead = true; hurt(); } }); eb = eb.filter(b => !b.dead && b.y < H + 20);
          pu.forEach(p => { p.y += 80 * dt; if (Math.hypot(p.x - P.x, p.y - P.y) < 24) { p.dead = true; P.lv = Math.min(4, P.lv + 1); score += 20; $(el, '.sc').textContent = score; GV.beep(880, 80); } }); pu = pu.filter(p => !p.dead && p.y < H + 20);
        }
        c.fillStyle = '#0a1330'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff44'; for (let i = 0; i < 40; i++) c.fillRect((i * 83) % W, (i * 57 + t * 60 * (1 + i % 3 * .5)) % H, 2, 2);
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; es.forEach(e => { c.font = (e.big ? 52 : 30) + 'px serif'; c.fillText(e.big ? '🛸' : '👾', e.x, e.y); }); pu.forEach(p => { c.font = '26px serif'; c.fillText('⭐', p.x, p.y); });
        c.fillStyle = '#FFD54F'; bs.forEach(b => c.fillRect(b.x - 2, b.y - 8, 4, 12)); c.fillStyle = '#EF5350'; eb.forEach(b => { c.beginPath(); c.arc(b.x, b.y, 5, 0, 7); c.fill(); });
        if (inv <= 0 || Math.floor(inv * 10) % 2) { c.font = '38px serif'; c.fillText('🛩️', P.x, P.y); }
      }
      cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') { const p = pos(cv, e); P.x = p.x; P.y = p.y - 36; } }); cv.addEventListener('pointerdown', e => { const p = pos(cv, e); P.x = p.x; P.y = p.y - 36; });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); K.off(); };
    }
  });

  /* ---------- PHÒNG THỦ THÁP ---------- */
  GV.register({
    id: 'towerdef', type: 'game', cat: 'Chiến thuật', name: 'Phòng thủ tháp', icon: '🗼', desc: 'Xây tháp pháo dọc đường đi để chặn đàn sâu bọ tiến vào căn cứ. Chạm tháp để nâng cấp. Qua càng nhiều đợt càng tốt!',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Xu: <b class="co">120</b></span><span>Đợt: <b class="sc">0</b></span><span>Mạng: <b class="lv">10</b></span><span>Kỷ lục: <b class="bs">${GV.best('towerdef')}</b></span><button class="btn nw">▶ Gọi đợt</button><button class="btn ghost rs">Chơi lại</button></div><canvas class="cv" width="480" height="320"></canvas><p class="msg"></p><p class="hint">Chạm ô trống để xây tháp (40 xu). Chạm tháp để nâng cấp (60 xu × cấp).</p>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), S = 40, PATH = [[0, 2], [4, 2], [4, 5], [8, 5], [8, 1], [11, 1]].map(([x, y]) => [x * S + 20, y * S + 20]);
      let towers, en, shots, coin, wave, lives, spawnN, spawnT, over, run, onPath;
      function mkPath() { const g = new Set(); for (let i = 0; i < PATH.length - 1; i++) { const [x1, y1] = PATH[i], [x2, y2] = PATH[i + 1]; for (let t = 0; t <= 1; t += .02) g.add(Math.floor((x1 + (x2 - x1) * t) / S) + ',' + Math.floor((y1 + (y2 - y1) * t) / S)); } return g; }
      onPath = mkPath();
      function reset() { towers = []; en = []; shots = []; coin = 120; wave = 0; lives = 10; spawnN = 0; spawnT = 0; over = false; run = false; $(el, '.co').textContent = 120; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 10; $(el, '.msg').textContent = 'Đặt vài tháp rồi bấm "Gọi đợt".'; $(el, '.nw').disabled = false; }
      function next() { if (run || over) return; run = true; wave++; spawnN = 5 + wave * 2; spawnT = 0; $(el, '.sc').textContent = wave; $(el, '.nw').disabled = true; $(el, '.msg').textContent = ''; }
      function step(dt) {
        if (run) { spawnT -= dt; if (spawnN > 0 && spawnT <= 0) { en.push({ d: 0, hp: 3 + wave * 2.2, mhp: 3 + wave * 2.2, v: 38 + wave * 3 + GV.rnd(10), x: PATH[0][0], y: PATH[0][1] }); spawnN--; spawnT = Math.max(.35, 1 - wave * .04); } if (!spawnN && !en.length) { run = false; coin += 20 + wave * 5; $(el, '.co').textContent = coin; $(el, '.nw').disabled = false; $(el, '.msg').textContent = `Đợt ${wave} xong! +${20 + wave * 5} xu.`; if (GV.setBest('towerdef', wave)) $(el, '.bs').textContent = wave; } }
        en.forEach(e => { e.d += e.v * dt; let d = e.d, i = 0; for (; i < PATH.length - 1; i++) { const L = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]); if (d <= L) { e.x = PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * d / L; e.y = PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * d / L; break; } d -= L; } if (i >= PATH.length - 1) { e.end = true; } });
        en.filter(e => e.end).forEach(() => { lives--; $(el, '.lv').textContent = Math.max(0, lives); GV.beep(130, 200); }); en = en.filter(e => !e.end);
        if (lives <= 0 && !over) { over = true; run = false; $(el, '.msg').textContent = `Căn cứ thất thủ ở đợt ${wave}.`; }
        towers.forEach(t => { t.cd -= dt; if (t.cd <= 0) { const tg = en.filter(e => Math.hypot(e.x - t.x, e.y - t.y) < 85 + t.l * 10).sort((a, b) => b.d - a.d)[0]; if (tg) { t.cd = Math.max(.25, .8 - t.l * .1); shots.push({ x: t.x, y: t.y, tg, dmg: 2 + t.l * 1.5, t: 0 }); t.a = Math.atan2(tg.y - t.y, tg.x - t.x); GV.beep(500, 20); } } });
        shots.forEach(s => { s.t += dt * 6; s.x += (s.tg.x - s.x) * Math.min(1, dt * 14); s.y += (s.tg.y - s.y) * Math.min(1, dt * 14); if (Math.hypot(s.tg.x - s.x, s.tg.y - s.y) < 8 || s.t > 1) { s.dead = true; s.tg.hp -= s.dmg; if (s.tg.hp <= 0 && !s.tg.dead) { s.tg.dead = true; coin += 6; $(el, '.co').textContent = coin; } } }); shots = shots.filter(s => !s.dead); en = en.filter(e => !e.dead);
        c.fillStyle = '#16301c'; c.fillRect(0, 0, 480, 320); c.strokeStyle = '#8D6E63'; c.lineWidth = 30; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); PATH.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.lineWidth = 1;
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏰', PATH[PATH.length - 1][0] + 8, PATH[PATH.length - 1][1]);
        towers.forEach(t => { c.fillStyle = '#ffffff12'; c.beginPath(); c.arc(t.x, t.y, 85 + t.l * 10, 0, 7); c.fill(); c.font = '30px serif'; c.fillText('🗼', t.x, t.y); c.fillStyle = '#FFD54F'; c.font = '11px Roboto,sans-serif'; c.fillText('★'.repeat(t.l), t.x, t.y + 20); });
        en.forEach(e => { c.font = '24px serif'; c.fillText('🐛', e.x, e.y); c.fillStyle = '#EF5350'; c.fillRect(e.x - 12, e.y - 18, 24, 3); c.fillStyle = '#66BB6A'; c.fillRect(e.x - 12, e.y - 18, 24 * Math.max(0, e.hp / e.mhp), 3); });
        c.fillStyle = '#FFEB3B'; shots.forEach(s => { c.beginPath(); c.arc(s.x, s.y, 4, 0, 7); c.fill(); });
      }
      cv.addEventListener('pointerdown', e => { if (over) return; const p = pos(cv, e), gx = Math.floor(p.x / S), gy = Math.floor(p.y / S), tw = towers.find(t => t.gx === gx && t.gy === gy);
        if (tw) { const cost = 60 * tw.l; if (tw.l < 4 && coin >= cost) { coin -= cost; tw.l++; GV.beep(700, 60); } else $(el, '.msg').textContent = tw.l >= 4 ? 'Tháp đã tối đa.' : 'Không đủ xu để nâng cấp.'; }
        else if (!onPath.has(gx + ',' + gy) && gx < 12 && gy < 8) { if (coin >= 40) { coin -= 40; towers.push({ gx, gy, x: gx * S + 20, y: gy * S + 20, l: 1, cd: 0 }); GV.beep(500, 50); } else $(el, '.msg').textContent = 'Không đủ xu (cần 40).'; }
        $(el, '.co').textContent = coin; });
      $(el, '.nw').onclick = next; $(el, '.rs').onclick = reset; reset(); return loop(step);
    }
  });

  /* ---------- CÂU CÁ ---------- */
  GV.register({
    id: 'fishing', type: 'game', cat: 'Thể thao', name: 'Câu cá giải trí', icon: '🎣', desc: 'Giữ chuột / ngón tay để thả cần xuống, thả ra để kéo lên. Câu cá lớn nhiều xu, tránh giày rách!',
    mount(el) {
      el.innerHTML = hud('fishing', '<span>Còn: <b class="tm">45</b>s</span>') + '<canvas class="cv" width="400" height="500" style="max-height:68vh;width:auto"></canvas><p class="msg"></p><p class="hint">Di chuyển để chọn chỗ thả, giữ để thả dây xuống, thả tay để kéo lên.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 400, H = 500, T = [{ e: '🐟', v: 10, s: 60, w: 6, y: [150, 450] }, { e: '🐠', v: 25, s: 85, w: 4, y: [200, 460] }, { e: '🐡', v: 40, s: 55, w: 3, y: [280, 470] }, { e: '🦈', v: 100, s: 130, w: 1, y: [380, 480] }, { e: '🥾', v: -15, s: 40, w: 3, y: [250, 470] }];
      let fish, hx, hy, down, hooked, score, time, over, msgT, boat = 200;
      function reset() { fish = []; hx = 200; hy = 90; down = false; hooked = null; score = 0; time = 45; over = false; $(el, '.sc').textContent = 0; $(el, '.msg').textContent = ''; for (let i = 0; i < 9; i++) spawn(true); }
      function spawn(init) { const r = GV.rnd(17), t = T[r < 6 ? 0 : r < 10 ? 1 : r < 13 ? 2 : r < 14 ? 3 : 4]; const dir = GV.rnd(2) ? 1 : -1; fish.push({ ...t, x: init ? GV.rnd(W) : (dir > 0 ? -30 : W + 30), y: t.y[0] + GV.rnd(t.y[1] - t.y[0]), d: dir }); }
      function step(dt) {
        if (!over) { time -= dt; $(el, '.tm').textContent = Math.max(0, Math.ceil(time)); if (time <= 0) { over = true; $(el, '.msg').textContent = 'Hết giờ! Số xu câu được: ' + score; if (GV.setBest('fishing', score)) $(el, '.bs').textContent = score; }
          boat += (hx - boat) * Math.min(1, dt * 6);
          if (down && !hooked) hy = Math.min(H - 20, hy + 220 * dt); else hy = Math.max(90, hy - (hooked ? 160 : 260) * dt);
          fish.forEach(f => { f.x += f.d * f.s * dt; });
          if (!hooked && down) { const f = fish.find(f => Math.abs(f.x - boat) < 22 && Math.abs(f.y - hy) < 20); if (f) { hooked = f; GV.beep(600, 50); } }
          if (hooked) { hooked.x = boat; hooked.y = hy + 10; if (hy <= 92) { score = Math.max(0, score + hooked.v); $(el, '.sc').textContent = score; $(el, '.msg').textContent = hooked.v > 0 ? `+${hooked.v} xu!` : 'Ôi, chiếc giày rách…'; GV.beep(hooked.v > 0 ? 800 : 150, 90); fish.splice(fish.indexOf(hooked), 1); hooked = null; } }
          fish = fish.filter(f => f.x > -60 && f.x < W + 60 && f !== undefined); while (fish.length < 9) spawn(false); }
        c.fillStyle = '#81D4FA'; c.fillRect(0, 0, W, 80); const g = c.createLinearGradient(0, 80, 0, H); g.addColorStop(0, '#0288D1'); g.addColorStop(1, '#01264a'); c.fillStyle = g; c.fillRect(0, 80, W, H);
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; fish.forEach(f => { c.save(); c.translate(f.x, f.y); if (f.d > 0) c.scale(-1, 1); c.fillText(f.e, 0, 0); c.restore(); });
        c.strokeStyle = '#ECEFF1'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(boat, 64); c.lineTo(boat, hy); c.stroke(); c.font = '22px serif'; c.fillText('🪝', boat, hy + 6); c.font = '48px serif'; c.fillText('⛵', boat, 46);
      }
      const set = (e, v) => { const p = pos(cv, e); hx = Math.max(20, Math.min(W - 20, p.x)); if (v !== undefined) down = v; };
      cv.addEventListener('pointerdown', e => set(e, true)); cv.addEventListener('pointermove', e => set(e)); cv.addEventListener('pointerup', () => down = false); cv.addEventListener('pointerleave', () => down = false);
      const off = GV.keys(e => { if (e.key === ' ') down = true; else if (e.key === 'ArrowLeft') hx = Math.max(20, hx - 20); else if (e.key === 'ArrowRight') hx = Math.min(W - 20, hx + 20); }); const up = e => { if (e.key === ' ') down = false; }; window.addEventListener('keyup', up);
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); off(); window.removeEventListener('keyup', up); };
    }
  });

  /* ---------- NGƯỜI QUE CHẠY ---------- */
  GV.register({
    id: 'stickrun', type: 'game', cat: 'Arcade', name: 'Người que chạy bộ', icon: '🏃', desc: 'Người que tự chạy: chạm / Space để nhảy (nhảy 2 lần được), vuốt xuống / ↓ để trượt qua chướng ngại bay.',
    mount(el) {
      el.innerHTML = hud('stickrun') + '<canvas class="cv" width="480" height="240"></canvas><p class="msg"></p><p class="hint">Chạm nửa trên: nhảy · chạm nửa dưới hoặc ↓: trượt. Space: nhảy.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 240, GY = 190; let y, vy, jumps, slide, obs, score, speed, sp, over, t;
      function reset() { y = GY; vy = 0; jumps = 0; slide = 0; obs = []; score = 0; speed = 230; sp = 1; over = false; t = 0; $(el, '.sc').textContent = 0; $(el, '.msg').textContent = ''; }
      const jump = () => { if (over) return; if (jumps < 2) { vy = -520; jumps++; slide = 0; GV.beep(500, 40); } }, sl = () => { if (!over && y >= GY - 1) slide = .6; };
      function step(dt) {
        if (!over) {
          t += dt; speed = 230 + t * 6; vy += 1500 * dt; y += vy * dt; if (y >= GY) { y = GY; vy = 0; jumps = 0; } slide -= dt; score += dt * speed / 25; $(el, '.sc').textContent = Math.floor(score);
          sp -= dt; if (sp <= 0) { const r = GV.rnd(3); obs.push(r === 0 ? { x: W + 20, w: 30, h: 30 + GV.rnd(30), t: 'g' } : r === 1 ? { x: W + 20, w: 40, h: 22, t: 'a' } : { x: W + 20, w: 24, h: 50, t: 'g' }); sp = .9 + Math.random() * 1.1 - Math.min(.4, t / 120); }
          obs.forEach(o => o.x -= speed * dt); obs = obs.filter(o => o.x > -60);
          const ph = slide > 0 ? 22 : 46, px = 70, pw = 18;
          if (obs.some(o => { const oy = o.t === 'g' ? GY - o.h : GY - 48; const oh = o.t === 'g' ? o.h : o.h; return px + pw > o.x && px - pw < o.x + o.w && y > oy && y - ph < oy + oh; })) { over = true; const s = Math.floor(score); $(el, '.msg').textContent = 'Vấp rồi! Quãng đường: ' + s + ' m'; if (GV.setBest('stickrun', s)) $(el, '.bs').textContent = s; GV.beep(130, 300); }
        }
        c.fillStyle = '#16213a'; c.fillRect(0, 0, W, H); c.fillStyle = '#263238'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#ffffff22'; for (let i = 0; i < 12; i++) c.fillRect(((i * 70 - t * speed * .4) % W + W) % W, GY + 14, 30, 3);
        c.fillStyle = '#6D4C41'; obs.forEach(o => { if (o.t === 'g') c.fillRect(o.x, GY - o.h, o.w, o.h); else { c.fillStyle = '#B71C1C'; c.fillRect(o.x, GY - 48, o.w, o.h); c.fillStyle = '#6D4C41'; } });
        c.strokeStyle = '#E8DEF8'; c.lineWidth = 4; c.lineCap = 'round'; const px = 70, s = slide > 0; const hy = y - (s ? 14 : 38), ph = Math.sin(t * 16) * 10;
        c.beginPath(); c.arc(px, hy - 6, 7, 0, 7); c.stroke(); c.beginPath(); c.moveTo(px, hy + 1); c.lineTo(px, y - (s ? 8 : 18)); c.moveTo(px, hy + 8); c.lineTo(px + 14, hy + 16 + ph / 3); c.moveTo(px, hy + 8); c.lineTo(px - 12, hy + 14 - ph / 3); c.moveTo(px, y - (s ? 8 : 18)); c.lineTo(px + (s ? 16 : 8 + ph), y); c.moveTo(px, y - (s ? 8 : 18)); c.lineTo(px - (s ? 6 : 8 + ph), y); c.stroke();
      }
      cv.addEventListener('pointerdown', e => { pos(cv, e).y < H / 2 ? jump() : sl(); }); GV.swipe(cv, d => { if (d === 'down') sl(); else if (d === 'up') jump(); });
      const off = GV.keys(e => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump(); else if (e.key === 'ArrowDown' || e.key === 's') sl(); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); off(); };
    }
  });

  /* ---------- ĐẶT BOM ---------- */
  GV.register({
    id: 'bomber', type: 'game', cat: 'Phiêu lưu', name: 'Đặt bom', icon: '💣', desc: 'Kiểu Bomberman: đặt bom phá tường, hạ hết quái vật trong mê cung và đừng đứng trong vùng nổ!',
    mount(el) {
      el.innerHTML = hud('bomber', '<span>Quái: <b class="en">3</b></span><span>Màn: <b class="lv">1</b></span>') + '<canvas class="cv" width="416" height="352"></canvas><p class="msg"></p><p class="hint">Mũi tên / WASD để đi, Space đặt bom (nổ sau 2 giây, lan 2 ô).</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), CW = 13, CH = 11, S = 32, K = held(), PK = {};
      let g, p, ens, bombs, fl, score, lv, over, mt = 0, tm = 0;
      function level(n) { g = Array.from({ length: CH }, (_, y) => Array.from({ length: CW }, (_, x) => (x === 0 || y === 0 || x === CW - 1 || y === CH - 1 || (x % 2 === 0 && y % 2 === 0)) ? 1 : ((x + y < 4) ? 0 : (Math.random() < .5 ? 2 : 0)))); p = { x: 1, y: 1, alive: true }; ens = []; for (let i = 0; i < 2 + n; i++) { let x, y; do { x = 1 + GV.rnd(CW - 2); y = 1 + GV.rnd(CH - 2); } while (g[y][x] || x + y < 8); ens.push({ x, y, d: [1, 0], t: 0 }); } bombs = []; fl = []; $(el, '.en').textContent = ens.length; $(el, '.lv').textContent = n; }
      function reset() { score = 0; lv = 1; over = false; $(el, '.sc').textContent = 0; $(el, '.msg').textContent = ''; level(1); }
      const free = (x, y) => g[y] && g[y][x] === 0 && !bombs.some(b => b.x === x && b.y === y);
      function boom(b) { const cells = [[b.x, b.y]]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { for (let i = 1; i <= 2; i++) { const x = b.x + dx * i, y = b.y + dy * i; if (g[y][x] === 1) break; cells.push([x, y]); if (g[y][x] === 2) { g[y][x] = 0; score += 5; break; } } }); cells.forEach(([x, y]) => { fl.push({ x, y, t: .35 }); if (p.alive && p.x === x && p.y === y) { p.alive = false; over = true; $(el, '.msg').textContent = 'Nổ trúng bạn! Điểm: ' + score; if (GV.setBest('bomber', score)) $(el, '.bs').textContent = score; GV.beep(130, 400); } ens.forEach(e => { if (e.x === x && e.y === y) e.dead = true; }); bombs.forEach(o => { if (o !== b && o.x === x && o.y === y) o.t = Math.min(o.t, .05); }); }); ens = ens.filter(e => { if (e.dead) { score += 50; GV.beep(700, 60); } return !e.dead; }); $(el, '.en').textContent = ens.length; $(el, '.sc').textContent = score; GV.beep(250, 120);
        if (!ens.length && !over) { $(el, '.msg').textContent = 'Dọn sạch quái! Sang màn tiếp…'; lv++; setTimeout(() => { if (cv.isConnected && !over) { level(lv); $(el, '.msg').textContent = ''; } }, 1200); } }
      function place() { if (over || !p.alive || bombs.some(b => b.x === p.x && b.y === p.y) || bombs.length >= 2) return; bombs.push({ x: p.x, y: p.y, t: 2 }); GV.beep(400, 40); }
      function step(dt) {
        const k = Object.assign({}, K.k); Object.keys(PK).forEach(x => { if (PK[x]) k[x] = 1; });
        if (!over) { mt -= dt; if (mt <= 0) { let dx = 0, dy = 0; if (k.arrowleft || k.a) dx = -1; else if (k.arrowright || k.d) dx = 1; else if (k.arrowup || k.w) dy = -1; else if (k.arrowdown || k.s) dy = 1; if ((dx || dy) && free(p.x + dx, p.y + dy)) { p.x += dx; p.y += dy; mt = .13; } }
          if (k[' ']) { place(); k[' '] = 0; K.k[' '] = 0; PK[' '] = 0; }
          tm += dt; ens.forEach(e => { e.t -= dt; if (e.t <= 0) { e.t = .45; const o = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => free(e.x + dx, e.y + dy)); if (o.length) { const same = o.find(d => d[0] === e.d[0] && d[1] === e.d[1]); e.d = same && GV.rnd(4) ? same : o[GV.rnd(o.length)]; e.x += e.d[0]; e.y += e.d[1]; } } if (e.x === p.x && e.y === p.y && p.alive) { p.alive = false; over = true; $(el, '.msg').textContent = 'Quái bắt được bạn! Điểm: ' + score; if (GV.setBest('bomber', score)) $(el, '.bs').textContent = score; GV.beep(130, 400); } });
          bombs.forEach(b => b.t -= dt); const ex = bombs.filter(b => b.t <= 0); bombs = bombs.filter(b => b.t > 0); ex.forEach(boom); }
        fl.forEach(f => f.t -= dt); fl = fl.filter(f => f.t > 0);
        c.fillStyle = '#1b2a1b'; c.fillRect(0, 0, CW * S, CH * S);
        for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { if (g[y][x] === 1) { c.fillStyle = '#455A64'; c.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); } else if (g[y][x] === 2) { c.fillStyle = '#8D6E63'; c.fillRect(x * S + 2, y * S + 2, S - 4, S - 4); c.fillStyle = '#6D4C41'; c.fillRect(x * S + 6, y * S + 14, S - 12, 3); } }
        c.font = '24px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; fl.forEach(f => { c.fillStyle = `rgba(255,${120 + Math.floor(f.t * 300)},40,.85)`; c.fillRect(f.x * S + 3, f.y * S + 3, S - 6, S - 6); }); bombs.forEach(b => c.fillText('💣', b.x * S + 16, b.y * S + 17 + Math.sin(b.t * 14) * 1.5)); ens.forEach(e => c.fillText('👹', e.x * S + 16, e.y * S + 17)); if (p.alive) c.fillText('😎', p.x * S + 16, p.y * S + 17);
      }
      pad(el, PK, [['arrowleft', '←'], ['arrowup', '↑'], ['arrowdown', '↓'], ['arrowright', '→'], [' ', '💣']]);
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); K.off(); };
    }
  });

  /* ---------- NHÀ MA ---------- */
  GV.register({
    id: 'haunted', type: 'game', cat: 'Phiêu lưu', name: 'Thoát khỏi nhà ma', icon: '🏚️', desc: 'Lạc trong ngôi nhà ma tối om: chỉ thấy quanh mình bằng đèn pin, nhặt đủ chìa khoá rồi tìm cửa thoát, đừng để bóng ma bắt!',
    mount(el) {
      el.innerHTML = hud('haunted', '<span>Chìa: <b class="ky">0</b>/3</span><span>Màn: <b class="lv">1</b></span>') + '<canvas class="cv" width="420" height="420"></canvas><div class="dpad"><span></span><button class="btn ghost" data-d="up">↑</button><span></span><button class="btn ghost" data-d="left">←</button><button class="btn ghost" data-d="down">↓</button><button class="btn ghost" data-d="right">→</button></div><p class="msg"></p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'); let n, g, cs, px, py, gx, gy, keys, door, lv, score, over, tmr, gt = 0;
      function gen() {
        n = Math.min(15, 7 + lv); cs = 420 / n; g = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ r: 1, d: 1, v: 0 }))); const st = [[0, 0]]; g[0][0].v = 1;
        while (st.length) { const [x, y] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !g[b][a].v); if (!nb.length) { st.pop(); continue; } const [a, b, dx, dy] = nb[GV.rnd(nb.length)]; g[b][a].v = 1; if (dx === 1) g[y][x].r = 0; else if (dx === -1) g[b][a].r = 0; else if (dy === 1) g[y][x].d = 0; else g[b][a].d = 0; st.push([a, b]); }
        for (let i = 0; i < n; i++) { const x = GV.rnd(n - 1), y = GV.rnd(n); if (g[y][x]) g[y][x].r = 0; } // thêm lối tắt
        px = py = 0; gx = n - 1; gy = 0; door = { x: n - 1, y: n - 1 }; keys = []; while (keys.length < 3) { const x = GV.rnd(n), y = GV.rnd(n); if ((x + y > 3) && !keys.some(k => k.x === x && k.y === y) && !(x === door.x && y === door.y)) keys.push({ x, y }); } over = false; gt = 0; $(el, '.ky').textContent = 0; $(el, '.lv').textContent = lv; $(el, '.msg').textContent = '';
      }
      const wallR = (x, y) => x < 0 || x >= n - 1 ? true : g[y][x].r, wallD = (x, y) => y < 0 || y >= n - 1 ? true : g[y][x].d;
      const can = (x, y, dx, dy) => dx === 1 ? !wallR(x, y) : dx === -1 ? (x > 0 && !g[y][x - 1].r) : dy === 1 ? !wallD(x, y) : (y > 0 && !g[y - 1][x].d);
      function bfs() { const dist = Array.from({ length: n }, () => Array(n).fill(-1)); const q = [[px, py]]; dist[py][px] = 0; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (can(x, y, dx, dy) && dist[y + dy][x + dx] < 0) { dist[y + dy][x + dx] = dist[y][x] + 1; q.push([x + dx, y + dy]); } }); } return dist; }
      function ghostMove() { if (over) return; const d = bfs(); let best = null; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (can(gx, gy, dx, dy)) { const v = d[gy + dy][gx + dx]; if (v >= 0 && (!best || v < best.v)) best = { v, dx, dy }; } }); if (best && (GV.rnd(100) < 70 + lv * 3)) { gx += best.dx; gy += best.dy; } else { const o = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => can(gx, gy, dx, dy)); if (o.length) { const m = o[GV.rnd(o.length)]; gx += m[0]; gy += m[1]; } } check(); }
      function check() { if (gx === px && gy === py && !over) { over = true; $(el, '.msg').textContent = 'Ma bắt được bạn! Điểm: ' + score; if (GV.setBest('haunted', score)) $(el, '.bs').textContent = score; GV.beep(120, 500); } }
      function mv(dx, dy) { if (over || !can(px, py, dx, dy)) return; px += dx; py += dy; GV.beep(300, 15); const ki = keys.findIndex(k => k.x === px && k.y === py); if (ki >= 0) { keys.splice(ki, 1); score += 20; $(el, '.ky').textContent = 3 - keys.length; $(el, '.sc').textContent = score; GV.beep(900, 80); }
        if (px === door.x && py === door.y) { if (keys.length) $(el, '.msg').textContent = 'Cửa khoá! Còn ' + keys.length + ' chìa.'; else { score += 100; $(el, '.sc').textContent = score; $(el, '.msg').textContent = 'Thoát được rồi! 🎉'; over = true; if (GV.setBest('haunted', score)) $(el, '.bs').textContent = score; lv++; setTimeout(() => { if (cv.isConnected) gen(); }, 1100); } } check(); draw(); }
      function draw() {
        c.fillStyle = '#000'; c.fillRect(0, 0, 420, 420); c.save(); c.beginPath(); c.arc((px + .5) * cs, (py + .5) * cs, cs * 3.2, 0, 7); c.clip(); c.fillStyle = '#1b1530'; c.fillRect(0, 0, 420, 420); c.strokeStyle = '#B39DDB'; c.lineWidth = 2; c.beginPath();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (x < n - 1 && g[y][x].r) { c.moveTo((x + 1) * cs, y * cs); c.lineTo((x + 1) * cs, (y + 1) * cs); } if (y < n - 1 && g[y][x].d) { c.moveTo(x * cs, (y + 1) * cs); c.lineTo((x + 1) * cs, (y + 1) * cs); } } c.rect(0, 0, 420, 420); c.stroke();
        c.font = cs * .7 + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; keys.forEach(k => c.fillText('🗝️', (k.x + .5) * cs, (k.y + .5) * cs)); c.fillText(keys.length ? '🔒' : '🚪', (door.x + .5) * cs, (door.y + .5) * cs); c.fillText('👻', (gx + .5) * cs, (gy + .5) * cs); c.fillText('🧒', (px + .5) * cs, (py + .5) * cs); c.restore();
        const gr = c.createRadialGradient((px + .5) * cs, (py + .5) * cs, cs * 1.2, (px + .5) * cs, (py + .5) * cs, cs * 3.2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.92)'); c.fillStyle = gr; c.fillRect(0, 0, 420, 420);
      }
      const dir = d => { const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]; if (m) mv(m[0], m[1]); };
      const off = GV.keys(e => { const d = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[e.key]; if (d) dir(d); });
      GV.swipe(cv, dir); el.querySelector('.dpad').onclick = e => { const b = e.target.closest('[data-d]'); if (b) dir(b.dataset.d); };
      function reset() { lv = 1; score = 0; $(el, '.sc').textContent = 0; gen(); draw(); }
      tmr = setInterval(() => { gt++; if (!over) { ghostMove(); } draw(); }, 650);
      $(el, '.rs').onclick = reset; reset(); return () => { clearInterval(tmr); off(); };
    }
  });
})();
