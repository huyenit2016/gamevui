// Game mới (canvas): Pong 2 người, Đào vàng, Đua xe, Diệt zombie, Đá phạt, Bắn cung
(function () {
  const $ = (el, s) => el.querySelector(s);
  const hud = (id, extra = '') => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id)}</b></span>${extra}<button class="btn rs">Chơi lại</button></div>`;
  // vòng lặp theo thời gian thực; trả về hàm dừng
  function loop(fn) { let id, last = performance.now(); const t = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt); id = requestAnimationFrame(t); }; id = requestAnimationFrame(t); return () => cancelAnimationFrame(id); }
  // phím giữ (cho game cần nhấn liên tục)
  function held() {
    const k = {}, dn = e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return; k[e.key.toLowerCase()] = 1; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }, up = e => { k[e.key.toLowerCase()] = 0; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return { k, off() { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); } };
  }
  const pos = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const BG = '#0D0F14';

  /* ---------- PONG 2 NGƯỜI ---------- */
  GV.register({
    id: 'pong2', type: 'game', cat: 'Hai người', name: 'Pong 2 người', icon: '🏓', desc: 'Hai người một máy: W/S và ↑/↓ (hoặc chạm hai nửa màn hình). Ai đủ 7 điểm thắng.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Trái: <b class="a">0</b></span><span>Phải: <b class="b">0</b></span><button class="btn rs">Chơi lại</button></div><canvas class="cv" width="600" height="360"></canvas><p class="msg"></p><p class="hint">Trái: W / S · Phải: ↑ / ↓ · Trên điện thoại: kéo ngón tay ở nửa trái / nửa phải.</p>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 600, H = 360, PH = 70, H_ = held(), msg = $(el, '.msg');
      let L, R, ball, sa, sb, over;
      function serve(dir) { ball = { x: W / 2, y: H / 2, vx: 260 * dir, vy: (GV.rnd(2) ? 1 : -1) * (80 + GV.rnd(120)) }; }
      function reset() { L = R = H / 2 - PH / 2; sa = sb = 0; over = false; msg.textContent = ''; $(el, '.a').textContent = $(el, '.b').textContent = 0; serve(GV.rnd(2) ? 1 : -1); }
      function step(dt) {
        if (over) { draw(); return; }
        const k = H_.k, sp = 320;
        if (k.w) L -= sp * dt; if (k.s) L += sp * dt; if (k.arrowup) R -= sp * dt; if (k.arrowdown) R += sp * dt;
        L = Math.max(0, Math.min(H - PH, L)); R = Math.max(0, Math.min(H - PH, R));
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < 6 || ball.y > H - 6) { ball.vy *= -1; ball.y = Math.max(6, Math.min(H - 6, ball.y)); }
        if (ball.vx < 0 && ball.x < 26 && ball.x > 10 && ball.y > L - 4 && ball.y < L + PH + 4) { ball.vx = Math.abs(ball.vx) * 1.06; ball.vy += (ball.y - (L + PH / 2)) * 5; GV.beep(520, 40); }
        if (ball.vx > 0 && ball.x > W - 26 && ball.x < W - 10 && ball.y > R - 4 && ball.y < R + PH + 4) { ball.vx = -Math.abs(ball.vx) * 1.06; ball.vy += (ball.y - (R + PH / 2)) * 5; GV.beep(620, 40); }
        if (ball.x < -10) { sb++; $(el, '.b').textContent = sb; GV.beep(200, 120); serve(1); }
        if (ball.x > W + 10) { sa++; $(el, '.a').textContent = sa; GV.beep(200, 120); serve(-1); }
        if (sa >= 7 || sb >= 7) { over = true; msg.textContent = (sa >= 7 ? 'Người chơi TRÁI' : 'Người chơi PHẢI') + ' thắng! 🎉'; }
        draw();
      }
      function draw() {
        c.fillStyle = BG; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff22'; for (let y = 0; y < H; y += 24) c.fillRect(W / 2 - 2, y, 4, 12);
        c.fillStyle = '#D0BCFF'; c.fillRect(12, L, 10, PH); c.fillStyle = '#7FCFFF'; c.fillRect(W - 22, R, 10, PH);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ball.x, ball.y, 6, 0, 7); c.fill();
      }
      const touch = e => { const p = pos(cv, e); if (p.x < W / 2) L = p.y - PH / 2; else R = p.y - PH / 2; };
      cv.addEventListener('pointerdown', touch); cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') touch(e); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => { stop(); H_.off(); };
    }
  });

  /* ---------- ĐÀO VÀNG ---------- */
  GV.register({
    id: 'goldminer', type: 'game', cat: 'Arcade', name: 'Đào vàng', icon: '⛏️', desc: 'Móc câu đung đưa – nhấn đúng lúc để kéo vàng, tránh đá nặng. 60 giây.',
    mount(el) {
      el.innerHTML = hud('goldminer', '<span>Còn: <b class="tm">60</b>s</span>') + '<canvas class="cv" width="480" height="400"></canvas><p class="msg"></p><p class="hint">Chạm / Space / ↓ để thả móc. Vàng to nặng nhưng nhiều điểm hơn.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 400, OX = W / 2, OY = 50;
      let ang, dirn, hook, items, score, time, over, pull;
      function reset() {
        items = []; const T = [{ r: 12, v: 50, w: 1, col: '#FFD54F', e: '🪙' }, { r: 20, v: 150, w: 2, col: '#FFC107', e: '🟡' }, { r: 28, v: 300, w: 3, col: '#FFB300', e: '💰' }, { r: 18, v: 20, w: 3.5, col: '#78909C', e: '🪨' }, { r: 10, v: 400, w: 0.6, col: '#80DEEA', e: '💎' }];
        for (let i = 0; i < 12; i++) { const t = T[i < 4 ? 0 : i < 7 ? 1 : i < 8 ? 2 : i < 11 ? 3 : 4]; for (let k = 0; k < 40; k++) { const x = 40 + GV.rnd(W - 80), y = 130 + GV.rnd(H - 160); if (items.every(o => Math.hypot(o.x - x, o.y - y) > o.r + t.r + 8)) { items.push({ ...t, x, y }); break; } } }
        ang = 0; dirn = 1; hook = null; pull = null; score = 0; time = 60; over = false; $(el, '.sc').textContent = 0; $(el, '.msg').textContent = '';
      }
      function fire() { if (!hook && !over) hook = { len: 20, out: true, got: null }; }
      function step(dt) {
        if (over) return draw();
        time -= dt; $(el, '.tm').textContent = Math.max(0, Math.ceil(time));
        if (time <= 0) { over = true; $(el, '.msg').textContent = 'Hết giờ! Điểm: ' + score; if (GV.setBest('goldminer', score)) $(el, '.bs').textContent = score; GV.beep(150, 300); }
        if (!hook) { ang += dirn * 1.3 * dt; if (Math.abs(ang) > 1.2) dirn *= -1; }
        else {
          const sp = hook.out ? 260 : 260 / (hook.got ? hook.got.w : 1); hook.len += (hook.out ? 1 : -1) * sp * dt;
          const hx = OX + Math.sin(ang) * hook.len, hy = OY + Math.cos(ang) * hook.len;
          if (hook.out) {
            if (hx < 6 || hx > W - 6 || hy > H - 6) hook.out = false;
            const it = items.find(o => Math.hypot(o.x - hx, o.y - hy) < o.r + 4);
            if (it) { hook.got = it; items.splice(items.indexOf(it), 1); hook.out = false; }
          } else {
            if (hook.got) { hook.got.x = hx; hook.got.y = hy; }
            if (hook.len <= 20) { if (hook.got) { score += hook.got.v; $(el, '.sc').textContent = score; GV.beep(780, 80); } hook = null; if (!items.length) reset2(); }
          }
        }
        draw();
      }
      function reset2() { const s = score, t = time; reset(); score = s; time = t; $(el, '.sc').textContent = score; }
      function draw() {
        c.fillStyle = '#26323a'; c.fillRect(0, 0, W, H); c.fillStyle = '#4B3621'; c.fillRect(0, OY + 8, W, H); c.fillStyle = '#6D4C41'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, OY + 20 + (i * 53) % (H - 70), 5, 3);
        c.fillStyle = '#90A4AE'; c.fillRect(OX - 18, OY - 22, 36, 24);
        items.forEach(o => { c.fillStyle = o.col; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); c.font = o.r * 1.3 + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.e, o.x, o.y + 1); });
        const L = hook ? hook.len : 20, hx = OX + Math.sin(ang) * L, hy = OY + Math.cos(ang) * L;
        c.strokeStyle = '#ECEFF1'; c.lineWidth = 2; c.beginPath(); c.moveTo(OX, OY); c.lineTo(hx, hy); c.stroke();
        if (hook && hook.got) { const o = hook.got; c.fillStyle = o.col; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); c.font = o.r * 1.3 + 'px serif'; c.fillText(o.e, o.x, o.y + 1); }
        c.fillStyle = '#ECEFF1'; c.beginPath(); c.arc(hx, hy, 5, 0, 7); c.fill();
      }
      cv.addEventListener('pointerdown', fire); const off = GV.keys(e => { if (e.key === ' ' || e.key === 'ArrowDown') fire(); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => { stop(); off(); };
    }
  });

  /* ---------- ĐUA XE ---------- */
  GV.register({
    id: 'racing', type: 'game', cat: 'Arcade', name: 'Đua xe né chướng ngại', icon: '🏎️', desc: 'Lái xe qua 3 làn, né xe khác và đi càng xa càng tốt.',
    mount(el) {
      el.innerHTML = hud('racing') + '<canvas class="cv" width="360" height="520" style="max-height:70vh;width:auto"></canvas><p class="msg"></p><p class="hint">← → hoặc A / D, vuốt trái/phải, hoặc chạm nửa trái/phải màn hình.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 360, H = 520, LW = W / 3, CAR = ['#EF5350', '#FFCA28', '#66BB6A', '#42A5F5', '#AB47BC'];
      let lane, x, obs, score, speed, spawn, over, off0 = 0;
      function reset() { lane = 1; x = LW * 1.5; obs = []; score = 0; speed = 220; spawn = 0; over = false; $(el, '.msg').textContent = ''; $(el, '.sc').textContent = 0; }
      const go = d => { if (over) return; lane = Math.max(0, Math.min(2, lane + d)); };
      function step(dt) {
        if (!over) {
          x += (LW * (lane + .5) - x) * Math.min(1, dt * 14); speed += dt * 6; off0 = (off0 + speed * dt) % 40;
          spawn -= dt; if (spawn <= 0) { obs.push({ l: GV.rnd(3), y: -70, c: CAR[GV.rnd(5)] }); if (GV.rnd(3) === 0) obs.push({ l: (obs[obs.length - 1].l + 1 + GV.rnd(2)) % 3, y: -70, c: CAR[GV.rnd(5)] }); spawn = 0.85 - Math.min(.45, speed / 1200); }
          obs.forEach(o => o.y += speed * 0.8 * dt); obs = obs.filter(o => o.y < H + 80);
          score += dt * speed / 40; $(el, '.sc').textContent = Math.floor(score);
          if (obs.some(o => Math.abs(o.y - (H - 90)) < 56 && Math.abs((o.l + .5) * LW - x) < 34)) { over = true; const s = Math.floor(score); $(el, '.msg').textContent = 'Va chạm! Quãng đường: ' + s + ' m'; if (GV.setBest('racing', s)) $(el, '.bs').textContent = s; GV.beep(120, 400); }
        }
        c.fillStyle = '#2b2d33'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff55'; for (let l = 1; l < 3; l++) for (let y = -40 + off0; y < H; y += 40) c.fillRect(l * LW - 2, y, 4, 22);
        const car = (cx, cy, col) => { c.fillStyle = col; c.fillRect(cx - 20, cy - 36, 40, 72); c.fillStyle = '#0008'; c.fillRect(cx - 15, cy - 20, 30, 16); c.fillRect(cx - 15, cy + 10, 30, 10); c.fillStyle = '#111'; c.fillRect(cx - 24, cy - 28, 5, 16); c.fillRect(cx + 19, cy - 28, 5, 16); c.fillRect(cx - 24, cy + 12, 5, 16); c.fillRect(cx + 19, cy + 12, 5, 16); };
        obs.forEach(o => car((o.l + .5) * LW, o.y, o.c)); car(x, H - 90, '#D0BCFF');
      }
      cv.addEventListener('pointerdown', e => go(pos(cv, e).x < W / 2 ? -1 : 1)); GV.swipe(cv, d => d === 'left' ? go(-1) : d === 'right' ? go(1) : 0);
      const off = GV.keys(e => { if (e.key === 'ArrowLeft' || e.key === 'a') go(-1); else if (e.key === 'ArrowRight' || e.key === 'd') go(1); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => { stop(); off(); };
    }
  });

  /* ---------- DIỆT ZOMBIE ---------- */
  GV.register({
    id: 'zombie', type: 'game', cat: 'Hành động', name: 'Diệt zombie', icon: '🧟', desc: 'Chạm để bắn zombie trước khi chúng tới căn cứ. Mỗi đợt một đông hơn!',
    mount(el) {
      el.innerHTML = hud('zombie', '<span>Đợt: <b class="wv">1</b></span><span>Căn cứ: <b class="hp">5</b></span>') + '<canvas class="cv" width="520" height="360"></canvas><p class="msg"></p><p class="hint">Chạm / bấm vào zombie để bắn. Zombie to cần nhiều phát hơn.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 520, H = 360;
      let zs, score, wave, hp, spawnLeft, spawnT, over, fx;
      function reset() { zs = []; fx = []; score = 0; wave = 1; hp = 5; spawnLeft = 6; spawnT = 0; over = false; $(el, '.msg').textContent = ''; ['sc', 'wv', 'hp'].forEach((k, i) => $(el, '.' + k).textContent = [0, 1, 5][i]); }
      function step(dt) {
        if (!over) {
          spawnT -= dt;
          if (spawnLeft > 0 && spawnT <= 0) { const big = wave > 2 && GV.rnd(5) === 0; zs.push({ x: W + 20, y: 50 + GV.rnd(H - 100), hp: big ? 3 : 1, r: big ? 26 : 18, v: (big ? 22 : 34) + wave * 3 + GV.rnd(14), e: big ? '🧟‍♂️' : '🧟' }); spawnLeft--; spawnT = Math.max(.35, 1.2 - wave * .08); }
          zs.forEach(z => z.x -= z.v * dt);
          zs.filter(z => z.x < 46).forEach(z => { hp--; $(el, '.hp').textContent = Math.max(0, hp); GV.beep(160, 120); fx.push({ x: z.x, y: z.y, t: .3, c: '#EF5350' }); });
          zs = zs.filter(z => z.x >= 46);
          if (hp <= 0) { over = true; $(el, '.msg').textContent = 'Căn cứ thất thủ! Điểm: ' + score; if (GV.setBest('zombie', score)) $(el, '.bs').textContent = score; }
          else if (!spawnLeft && !zs.length) { wave++; spawnLeft = 5 + wave * 2; spawnT = 1.2; $(el, '.wv').textContent = wave; if (hp < 5) { hp++; $(el, '.hp').textContent = hp; } }
        }
        fx.forEach(f => f.t -= dt); fx = fx.filter(f => f.t > 0);
        c.fillStyle = '#16231a'; c.fillRect(0, 0, W, H); c.fillStyle = '#1d3524'; for (let i = 0; i < 30; i++) c.fillRect((i * 83) % W, (i * 47) % H, 40, 3);
        c.fillStyle = '#546E7A'; c.fillRect(0, 0, 40, H); c.fillStyle = '#90A4AE'; for (let y = 0; y < H; y += 30) c.fillRect(34, y, 10, 20);
        c.font = '28px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < hp; i++) c.fillText('🛡️', 20, 30 + i * 36);
        zs.forEach(z => { c.font = z.r * 1.6 + 'px serif'; c.fillText(z.e, z.x, z.y); if (z.hp > 1) { c.fillStyle = '#EF5350'; c.fillRect(z.x - 16, z.y - z.r - 10, 32 * z.hp / 3, 4); } });
        fx.forEach(f => { c.globalAlpha = f.t * 3; c.fillStyle = f.c; c.beginPath(); c.arc(f.x, f.y, 24 * (1.3 - f.t), 0, 7); c.fill(); c.globalAlpha = 1; });
      }
      cv.addEventListener('pointerdown', e => {
        if (over) return; const p = pos(cv, e); let hit = null;
        for (const z of zs) if (Math.hypot(z.x - p.x, z.y - p.y) < z.r + 8 && (!hit || z.x < hit.x)) hit = z;
        fx.push({ x: p.x, y: p.y, t: .2, c: hit ? '#FFD54F' : '#ffffff55' }); GV.beep(hit ? 700 : 260, 50);
        if (hit && --hit.hp <= 0) { zs.splice(zs.indexOf(hit), 1); score += hit.r > 20 ? 30 : 10; $(el, '.sc').textContent = score; }
      });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => stop();
    }
  });

  /* ---------- ĐÁ PHẠT ---------- */
  GV.register({
    id: 'penalty', type: 'game', cat: 'Thể thao', name: 'Đá phạt đền', icon: '⚽', desc: '5 quả đá phạt: bấm 2 lần để chọn hướng ngang rồi độ cao, sút qua thủ môn!',
    mount(el) {
      el.innerHTML = hud('penalty', '<span>Lượt: <b class="tn">1</b>/5</span>') + '<canvas class="cv" width="480" height="340"></canvas><p class="msg">Bấm để dừng thanh ngang…</p><p class="hint">Bấm / Space lần 1: dừng hướng trái–phải. Lần 2: dừng độ cao. Sút trúng góc xa thủ môn!</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 340, G = { x: 90, y: 50, w: 300, h: 150 };
      let ph, mx, my, t, t2, score, turn, shot, kd, res, tmo;
      function reset() { clearTimeout(tmo); score = 0; turn = 1; next(); $(el, '.sc').textContent = 0; $(el, '.tn').textContent = 1; }
      function next() { ph = 0; t = 0; t2 = 0; mx = 0; my = 0; shot = null; res = ''; $(el, '.msg').textContent = 'Bấm để dừng thanh ngang…'; }
      function act() {
        if (turn > 5 || (shot && shot.t < 1)) return; if (shot && shot.done) { return; }
        if (ph === 0) { ph = 1; $(el, '.msg').textContent = 'Bấm lần nữa để chọn độ cao…'; return; }
        if (ph === 1) {
          ph = 2; const tx = G.x + (G.w * (0.5 + 0.5 * Math.sin(mx))), ty = G.y + G.h * (0.5 + 0.5 * Math.sin(my));
          const dive = GV.rnd(3) - 1, dh = GV.rnd(2); kd = { x: G.x + G.w / 2 + dive * 90, y: G.y + G.h * (dh ? .35 : .7) };
          shot = { tx, ty, t: 0, done: false }; $(el, '.msg').textContent = '';
        }
      }
      function step(dt) {
        if (ph === 0) { t += dt; mx = t * 2.6; } else if (ph === 1) { t2 += dt; my = t2 * 3.3; }
        if (shot && !shot.done) { shot.t = Math.min(1, shot.t + dt * 2.2); if (shot.t >= 1) finish(); }
        draw();
      }
      function finish() {
        shot.done = true; const inGoal = shot.tx > G.x + 6 && shot.tx < G.x + G.w - 6 && shot.ty > G.y + 6 && shot.ty < G.y + G.h - 6;
        const saved = Math.hypot(shot.tx - kd.x, (shot.ty - kd.y) * 1.2) < 58; let m;
        if (!inGoal) m = 'Ra ngoài! 😬'; else if (saved) m = 'Thủ môn cản phá! 🧤'; else { score++; $(el, '.sc').textContent = score; m = 'VÀO!!! ⚽🎉'; GV.beep(880, 150); }
        $(el, '.msg').textContent = m;
        tmo = setTimeout(() => { if (turn >= 5) { turn = 6; $(el, '.msg').textContent = `Kết thúc: ${score}/5 quả vào lưới.`; if (GV.setBest('penalty', score)) $(el, '.bs').textContent = score; return; } turn++; $(el, '.tn').textContent = turn; next(); }, 1200);
      }
      function draw() {
        c.fillStyle = '#1b5e20'; c.fillRect(0, 0, W, H); c.fillStyle = '#2e7d32'; for (let i = 0; i < 8; i++) c.fillRect(0, 200 + i * 20, W, 10);
        c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(G.x, G.y, G.w, G.h); c.lineWidth = 1; c.globalAlpha = .25; for (let x = G.x; x < G.x + G.w; x += 15) { c.beginPath(); c.moveTo(x, G.y); c.lineTo(x, G.y + G.h); c.stroke(); } for (let y = G.y; y < G.y + G.h; y += 15) { c.beginPath(); c.moveTo(G.x, y); c.lineTo(G.x + G.w, y); c.stroke(); } c.globalAlpha = 1;
        c.font = '54px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const k = shot ? kd : { x: G.x + G.w / 2, y: G.y + G.h * .6 }; c.fillText('🧤', k.x, k.y);
        if (!shot) { if (ph === 0) { c.fillStyle = '#FFD54F'; c.fillRect(G.x + G.w * (0.5 + 0.5 * Math.sin(mx)) - 3, G.y - 14, 6, G.h + 28); } else if (ph === 1) { c.fillStyle = '#7FCFFF'; c.fillRect(G.x - 14, G.y + G.h * (0.5 + 0.5 * Math.sin(my)) - 3, G.w + 28, 6); c.fillStyle = '#FFD54F'; c.fillRect(G.x + G.w * (0.5 + 0.5 * Math.sin(mx)) - 3, G.y, 6, G.h); } }
        const bx = shot ? W / 2 + (shot.tx - W / 2) * shot.t : W / 2, by = shot ? 290 + (shot.ty - 290) * shot.t : 290, s = shot ? 1 - shot.t * .6 : 1;
        c.font = 40 * s + 'px serif'; c.fillText('⚽', bx, by - Math.sin((shot ? shot.t : 0) * Math.PI) * 30);
      }
      cv.addEventListener('pointerdown', act); const off = GV.keys(e => { if (e.key === ' ' || e.key === 'Enter') act(); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => { stop(); off(); clearTimeout(tmo); };
    }
  });

  /* ---------- BẮN CUNG ---------- */
  GV.register({
    id: 'archery', type: 'game', cat: 'Thể thao', name: 'Bắn cung', icon: '🏹', desc: '10 mũi tên, bia di chuyển, có gió thổi lệch – ngắm trúng hồng tâm lấy 10 điểm!',
    mount(el) {
      el.innerHTML = hud('archery', '<span>Còn: <b class="ar">10</b> tên</span>') + '<canvas class="cv" width="480" height="360"></canvas><p class="msg"></p><p class="hint">Di chuột / ngón tay để ngắm, chạm / Space để bắn. Ngắm hơi ngược chiều gió.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 360, TX = 330;
      let ty, tv, wind, ax, ay, left, score, shots, t, over;
      function reset() { ty = 180; tv = 70; wind = (GV.rnd(2) ? 1 : -1) * (6 + GV.rnd(24)); ax = 100; ay = 180; left = 10; score = 0; shots = []; t = 0; over = false; $(el, '.msg').textContent = ''; $(el, '.sc').textContent = 0; $(el, '.ar').textContent = 10; }
      function shoot() {
        if (over) return; const sx = ax + (Math.random() - .5) * 14 + wind * 0.9, sy = ay + (Math.random() - .5) * 14 + wind * 0.25 * (Math.random() - .5) * 2;
        const d = Math.hypot(sx - TX, sy - ty), pts = d < 8 ? 10 : d < 18 ? 9 : d < 28 ? 8 : d < 38 ? 7 : d < 48 ? 6 : d < 58 ? 5 : d < 68 ? 3 : d < 78 ? 1 : 0;
        shots.push({ x: sx, y: sy, rel: sy - ty }); score += pts; left--; $(el, '.sc').textContent = score; $(el, '.ar').textContent = left; $(el, '.msg').textContent = pts ? '+' + pts + ' điểm' : 'Trượt!'; GV.beep(pts ? 500 + pts * 40 : 180, 80);
        wind = (GV.rnd(2) ? 1 : -1) * (6 + GV.rnd(24));
        if (!left) { over = true; $(el, '.msg').textContent = 'Xong! Tổng điểm: ' + score; if (GV.setBest('archery', score)) $(el, '.bs').textContent = score; }
      }
      function step(dt) {
        t += dt; ty = 180 + Math.sin(t * 1.2) * 110 * Math.min(1, tv / 70);
        c.fillStyle = '#87CEEB'; c.fillRect(0, 0, W, 250); c.fillStyle = '#558B2F'; c.fillRect(0, 250, W, H);
        c.fillStyle = '#6D4C41'; c.fillRect(TX - 4, ty, 8, 300);
        [[78, '#fafafa'], [68, '#212121'], [58, '#1E88E5'], [48, '#E53935'], [38, '#FFD600']].forEach(([r, col], i) => { c.fillStyle = col; c.beginPath(); c.arc(TX, ty, r - (i > 3 ? 0 : 0), 0, 7); c.fill(); }); c.fillStyle = '#FFD600'; c.beginPath(); c.arc(TX, ty, 38, 0, 7); c.fill(); c.fillStyle = '#E53935'; c.beginPath(); c.arc(TX, ty, 18, 0, 7); c.fill(); c.fillStyle = '#FFEB3B'; c.beginPath(); c.arc(TX, ty, 8, 0, 7); c.fill();
        shots.forEach(s => { const y = ty + s.rel; c.fillStyle = '#212121'; c.beginPath(); c.arc(s.x, y, 3, 0, 7); c.fill(); c.strokeStyle = '#212121'; c.beginPath(); c.moveTo(s.x, y); c.lineTo(s.x - 26, y + 6); c.stroke(); });
        c.strokeStyle = '#E53935'; c.lineWidth = 2; c.beginPath(); c.arc(ax, ay, 14, 0, 7); c.moveTo(ax - 22, ay); c.lineTo(ax + 22, ay); c.moveTo(ax, ay - 22); c.lineTo(ax, ay + 22); c.stroke(); c.lineWidth = 1;
        c.fillStyle = '#fff'; c.font = '14px Roboto,sans-serif'; c.textAlign = 'left'; c.fillText('Gió ' + (wind > 0 ? '→ ' : '← ') + Math.abs(wind) + ' km/h', 14, 24); c.fillText(wind > 0 ? '➡️'.repeat(Math.ceil(Math.abs(wind) / 10)) : '⬅️'.repeat(Math.ceil(Math.abs(wind) / 10)), 14, 46);
      }
      const aim = e => { const p = pos(cv, e); ax = Math.max(20, Math.min(W - 20, p.x)); ay = Math.max(20, Math.min(H - 20, p.y)); };
      cv.addEventListener('pointermove', aim); cv.addEventListener('pointerdown', e => { aim(e); shoot(); });
      const off = GV.keys(e => { if (e.key === ' ') shoot(); else if (e.key === 'ArrowUp') ay -= 12; else if (e.key === 'ArrowDown') ay += 12; else if (e.key === 'ArrowLeft') ax -= 12; else if (e.key === 'ArrowRight') ax += 12; });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step);
      return () => { stop(); off(); };
    }
  });
})();
