// Game thể thao & lễ hội: Bóng rổ, Bida, Bowling, Hứng lì xì (Tết), Bầu cua (Tết), Ghép trái tim (Valentine), Ông già Noel giao quà, Halloween nhặt kẹo
(function () {
  const $ = (el, s) => el.querySelector(s);
  const hud = (id, extra = '', low) => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id) || (low ? '-' : 0)}</b></span>${extra}<button class="btn rs">Chơi lại</button></div>`;
  function loop(fn) { let id, last = performance.now(); const t = now => { const dt = Math.min(0.033, (now - last) / 1000); last = now; fn(dt); id = requestAnimationFrame(t); }; id = requestAnimationFrame(t); return () => cancelAnimationFrame(id); }
  const pos = (cv, e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const BG = '#0D0F14';
  // kéo-thả để bắn: trả về hàm huỷ. cb(start,cur,'move'|'end')
  function drag(cv, cb) {
    let st = null; const mv = e => { if (st) cb(st, pos(cv, e), 'move'); }, up = e => { if (st) { const s = st; st = null; cb(s, pos(cv, e), 'end'); } };
    cv.addEventListener('pointerdown', e => { st = pos(cv, e); cb(st, st, 'start'); try { cv.setPointerCapture(e.pointerId); } catch (x) {} }); cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  // va chạm đàn hồi giữa các quả bóng tròn có khối lượng
  function collide(bs) {
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j]; if (a.out || b.out) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), md = a.r + b.r; if (!d || d >= md) continue;
      const nx = dx / d, ny = dy / d, ov = md - d, ma = a.m || 1, mb = b.m || 1; a.x -= nx * ov * mb / (ma + mb); a.y -= ny * ov * mb / (ma + mb); b.x += nx * ov * ma / (ma + mb); b.y += ny * ov * ma / (ma + mb);
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv > 0) continue; const jx = -(1 + 0.92) * rv / (1 / ma + 1 / mb);
      a.vx -= jx * nx / ma; a.vy -= jx * ny / ma; b.vx += jx * nx / mb; b.vy += jx * ny / mb;
    }
  }

  /* ---------- BÓNG RỔ ---------- */
  GV.register({
    id: 'basketball', type: 'game', cat: 'Thể thao', name: 'Ném bóng rổ', icon: '🏀', desc: 'Kéo lùi rồi thả để ném bóng vào rổ. 10 quả, rổ đổi vị trí mỗi lượt.',
    mount(el) {
      el.innerHTML = hud('basketball', '<span>Còn: <b class="bl">10</b> bóng</span>') + '<canvas class="cv" width="480" height="340"></canvas><p class="msg">Kéo từ bất kỳ đâu rồi thả: kéo càng xa ném càng mạnh.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 340, G = 900; let b, hoop, score, left, aim, over, scored, wait = 0;
      function newHoop() { hoop = { x: 330 + GV.rnd(90), y: 100 + GV.rnd(110) }; }
      function ball() { b = { x: 70, y: 280, vx: 0, vy: 0, fly: false, prevY: 280 }; scored = false; aim = null; }
      function reset() { score = 0; left = 10; over = false; newHoop(); ball(); $(el, '.sc').textContent = 0; $(el, '.bl').textContent = 10; $(el, '.msg').textContent = 'Kéo từ bất kỳ đâu rồi thả: kéo càng xa ném càng mạnh.'; }
      function next() { left--; $(el, '.bl').textContent = left; if (left <= 0) { over = true; $(el, '.msg').textContent = `Hết bóng! Bạn ghi ${score} điểm.`; if (GV.setBest('basketball', score)) $(el, '.bs').textContent = score; } else { newHoop(); ball(); } }
      function step(dt) {
        if (b.fly) {
          b.prevY = b.y; b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          const rim = [{ x: hoop.x - 28, y: hoop.y }, { x: hoop.x + 28, y: hoop.y }];
          rim.forEach(p => { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if (d < 15 && d > 0) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; b.vx *= .8; b.vy *= .8; } b.x = p.x + nx * 15; b.y = p.y + ny * 15; GV.beep(260, 40); } });
          if (b.x > hoop.x + 44 && b.y > hoop.y - 60 && b.y < hoop.y + 30) { b.x = hoop.x + 44; b.vx = -Math.abs(b.vx) * .5; GV.beep(240, 40); }
          if (!scored && b.prevY < hoop.y && b.y >= hoop.y && b.x > hoop.x - 26 && b.x < hoop.x + 26 && b.vy > 0) { scored = true; score += 2 + (Math.abs(b.x - hoop.x) < 8 ? 1 : 0); $(el, '.sc').textContent = score; $(el, '.msg').textContent = Math.abs(b.x - hoop.x) < 8 ? 'SWISH!!! +3' : 'Vào rổ! +2'; GV.beep(880, 120); }
          if (b.y > H + 30 || b.x < -30 || b.x > W + 30 || b.y > 310 && b.vy > 0 && !scored && b.x > 0) { if (!scored) $(el, '.msg').textContent = 'Trượt!'; b.fly = false; wait = .7; }
          if (scored && b.y > hoop.y + 60) { b.fly = false; wait = .5; }
        } else if (wait > 0 && !over) { wait -= dt; if (wait <= 0) next(); }
        c.fillStyle = BG; c.fillRect(0, 0, W, H); c.fillStyle = '#5D4037'; c.fillRect(0, 312, W, 28);
        c.fillStyle = '#ECEFF1'; c.fillRect(hoop.x + 44, hoop.y - 60, 8, 90); c.strokeStyle = '#FF7043'; c.lineWidth = 5; c.beginPath(); c.moveTo(hoop.x - 28, hoop.y); c.lineTo(hoop.x + 28, hoop.y); c.stroke();
        c.strokeStyle = '#ffffff88'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(hoop.x - 28 + i * 11.2, hoop.y); c.lineTo(hoop.x - 16 + i * 6.4, hoop.y + 34); c.stroke(); }
        if (aim && !b.fly) { c.setLineDash([6, 6]); c.strokeStyle = '#D0BCFF'; c.beginPath(); let x = b.x, y = b.y, vx = (aim.sx - aim.cx) * 3.2, vy = (aim.sy - aim.cy) * 3.2; c.moveTo(x, y); for (let t = 0; t < 1.2; t += .05) { vy += G * .05; x += vx * .05; y += vy * .05; c.lineTo(x, y); } c.stroke(); c.setLineDash([]); }
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏀', b.x, b.y);
      }
      drag(cv, (s, p, k) => { if (over || b.fly || wait > 0) return; if (k === 'end') { const vx = (s.x - p.x) * 3.2, vy = (s.y - p.y) * 3.2; aim = null; if (Math.hypot(vx, vy) > 60) { b.vx = vx; b.vy = vy; b.fly = true; $(el, '.msg').textContent = ''; GV.beep(420, 40); } } else aim = { sx: s.x, sy: s.y, cx: p.x, cy: p.y }; });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return stop;
    }
  });

  /* ---------- BIDA ---------- */
  GV.register({
    id: 'billiards', type: 'game', cat: 'Thể thao', name: 'Bida lỗ', icon: '🎱', desc: 'Kéo lùi rồi thả để đánh bi trắng, đưa hết bi màu xuống lỗ càng ít cú càng tốt.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Cú đánh: <b class="sc">0</b></span><span>Còn: <b class="lf">6</b> bi</span><span>Kỷ lục: <b class="bs">${GV.best('billiards') || '-'}</b></span><button class="btn rs">Chơi lại</button></div><canvas class="cv" width="480" height="270"></canvas><p class="msg"></p><p class="hint">Kéo lùi từ bất kỳ đâu rồi thả: hướng và lực đánh ngược chiều kéo. Ít cú nhất = tốt nhất.</p>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 270, M = 18, PK = [[M, M], [W / 2, M - 4], [W - M, M], [M, H - M], [W / 2, H - M + 4], [W - M, H - M]], COL = ['#EF5350', '#FFCA28', '#66BB6A', '#42A5F5', '#AB47BC', '#FF7043'];
      let bs, shots, aim, over, cue;
      function reset() { cue = { x: 120, y: H / 2, vx: 0, vy: 0, r: 9, m: 1, c: '#fff', cue: true }; bs = [cue]; let k = 0; for (let col = 0; col < 3; col++) for (let row = 0; row <= col; row++) bs.push({ x: 330 + col * 17, y: H / 2 + (row - col / 2) * 19, vx: 0, vy: 0, r: 9, m: 1, c: COL[k++ % 6] }); for (let i = 0; i < 3; i++) bs.push({ x: 420, y: 80 + i * 55, vx: 0, vy: 0, r: 9, m: 1, c: COL[(k++) % 6] }); bs = bs.slice(0, 7); shots = 0; over = false; aim = null; $(el, '.sc').textContent = 0; $(el, '.lf').textContent = 6; $(el, '.msg').textContent = ''; }
      const moving = () => bs.some(b => !b.out && (Math.abs(b.vx) > 4 || Math.abs(b.vy) > 4));
      function step(dt) {
        for (let s = 0; s < 3; s++) {
          const h = dt / 3; bs.forEach(b => { if (b.out) return; b.x += b.vx * h; b.y += b.vy * h; const f = Math.max(0, 1 - 0.55 * h); b.vx *= f; b.vy *= f; if (Math.hypot(b.vx, b.vy) < 4) b.vx = b.vy = 0;
            if (b.x < M - 4 + b.r && !PK.some(p => Math.hypot(p[0] - b.x, p[1] - b.y) < 22)) { b.x = M - 4 + b.r; b.vx = Math.abs(b.vx) * .85; } if (b.x > W - M + 4 - b.r && !PK.some(p => Math.hypot(p[0] - b.x, p[1] - b.y) < 22)) { b.x = W - M + 4 - b.r; b.vx = -Math.abs(b.vx) * .85; }
            if (b.y < M - 4 + b.r && !PK.some(p => Math.hypot(p[0] - b.x, p[1] - b.y) < 22)) { b.y = M - 4 + b.r; b.vy = Math.abs(b.vy) * .85; } if (b.y > H - M + 4 - b.r && !PK.some(p => Math.hypot(p[0] - b.x, p[1] - b.y) < 22)) { b.y = H - M + 4 - b.r; b.vy = -Math.abs(b.vy) * .85; }
            if (PK.some(p => Math.hypot(p[0] - b.x, p[1] - b.y) < 15)) { if (b.cue) { b.x = 120; b.y = H / 2; b.vx = b.vy = 0; shots++; $(el, '.sc').textContent = shots; $(el, '.msg').textContent = 'Bi trắng xuống lỗ! +1 cú phạt'; GV.beep(150, 200); } else { b.out = true; GV.beep(600, 90); const lf = bs.filter(x => !x.cue && !x.out).length; $(el, '.lf').textContent = lf; if (!lf) { over = true; $(el, '.msg').textContent = `Xong bàn với ${shots} cú! 🎉`; if (!GV.best('billiards') || shots < GV.best('billiards')) { GV.setBest('billiards', shots, true); $(el, '.bs').textContent = shots; } } } } });
          collide(bs);
        }
        c.fillStyle = '#4E342E'; c.fillRect(0, 0, W, H); c.fillStyle = '#1B5E20'; c.fillRect(M - 6, M - 6, W - 2 * M + 12, H - 2 * M + 12);
        c.fillStyle = '#000'; PK.forEach(p => { c.beginPath(); c.arc(p[0], p[1], 14, 0, 7); c.fill(); });
        bs.forEach(b => { if (b.out) return; c.fillStyle = b.c; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.fillStyle = '#ffffff55'; c.beginPath(); c.arc(b.x - 3, b.y - 3, 2.5, 0, 7); c.fill(); });
        if (aim && !moving()) { const dx = aim.sx - aim.cx, dy = aim.sy - aim.cy, l = Math.hypot(dx, dy) || 1; c.strokeStyle = '#ffffffaa'; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(cue.x, cue.y); c.lineTo(cue.x + dx / l * Math.min(160, l * 2), cue.y + dy / l * Math.min(160, l * 2)); c.stroke(); c.setLineDash([]); }
      }
      drag(cv, (s, p, k) => { if (over || moving()) return; if (k === 'end') { aim = null; const dx = s.x - p.x, dy = s.y - p.y, l = Math.hypot(dx, dy); if (l > 8) { const pw = Math.min(l, 110) * 6; cue.vx = dx / l * pw; cue.vy = dy / l * pw; shots++; $(el, '.sc').textContent = shots; $(el, '.msg').textContent = ''; GV.beep(320, 50); } } else aim = { sx: s.x, sy: s.y, cx: p.x, cy: p.y }; });
      $(el, '.rs').onclick = reset; reset(); return loop(step);
    }
  });

  /* ---------- BOWLING ---------- */
  GV.register({
    id: 'bowling', type: 'game', cat: 'Thể thao', name: 'Bowling', icon: '🎳', desc: '5 lượt, mỗi lượt 2 cú lăn bóng hạ 10 ky. Chạm chọn vị trí rồi kéo lùi và thả để lăn.',
    mount(el) {
      el.innerHTML = hud('bowling', '<span>Lượt: <b class="fr">1</b>/5</span>') + '<canvas class="cv" width="300" height="480" style="max-height:68vh;width:auto"></canvas><p class="msg"></p><p class="hint">Chạm vị trí bắt đầu, kéo xuống rồi thả: kéo lệch sang bên để lăn xiên. Hạ hết 10 ky ngay cú đầu (strike) được +10.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 300, H = 480; let pins, ball, score, frame, roll, aim, over, wait, state, startCount, tmo;
      const rack = () => { const a = []; for (let r = 0; r < 4; r++) for (let k = 0; k <= r; k++) { const x = W / 2 + (k - r / 2) * 26, y = 60 + r * 24; a.push({ x, y, sx: x, sy: y, vx: 0, vy: 0, r: 9, m: 1 }); } return a; };
      function reset() { clearTimeout(tmo); pins = rack(); ball = null; score = 0; frame = 1; roll = 1; over = false; state = 'ready'; aim = null; wait = 0; $(el, '.sc').textContent = 0; $(el, '.fr').textContent = 1; $(el, '.msg').textContent = 'Chạm vị trí bắt đầu, kéo xuống rồi thả.'; }
      function settle() {
        pins.forEach(p => { if (!p.out && Math.hypot(p.x - p.sx, p.y - p.sy) > 14) p.out = true; });
        const standing = pins.filter(p => !p.out).length, hit = startCount - standing; score += hit;
        if (roll === 1 && standing === 0) { score += 10; $(el, '.msg').textContent = 'STRIKE!!! +10 thưởng 🎳'; GV.beep(900, 150); endFrame(); }
        else if (roll === 1) { roll = 2; $(el, '.msg').textContent = `Hạ ${hit} ky, còn ${standing} – lăn tiếp!`; pins = pins.filter(p => !p.out); pins.forEach(p => { p.vx = p.vy = 0; p.sx = p.x; p.sy = p.y; }); ball = null; state = 'ready'; }
        else { $(el, '.msg').textContent = standing === 0 ? 'SPARE! 🎉' : `Hạ thêm ${hit} ky.`; endFrame(); }
        $(el, '.sc').textContent = score;
      }
      function endFrame() {
        state = 'wait'; wait = 1.2;
      }
      function step(dt) {
        if (state === 'wait') { wait -= dt; if (wait <= 0) { if (frame >= 5) { over = true; state = 'over'; $(el, '.msg').textContent = `Kết thúc! Tổng điểm: ${score}`; if (GV.setBest('bowling', score)) $(el, '.bs').textContent = score; } else { frame++; roll = 1; $(el, '.fr').textContent = frame; pins = rack(); ball = null; state = 'ready'; } } }
        if (state === 'roll') {
          ball.t += dt;
          for (let s = 0; s < 3; s++) {
            const h = dt / 3;
            [ball, ...pins].forEach(b => { if (b.out) return; b.x += b.vx * h; b.y += b.vy * h; const f = b === ball ? 1 : Math.max(0, 1 - 1.6 * h); b.vx *= f; b.vy *= f;
              if (b.x < 12 + b.r) { b.x = 12 + b.r; b.vx = Math.abs(b.vx) * .6; } if (b.x > W - 12 - b.r) { b.x = W - 12 - b.r; b.vx = -Math.abs(b.vx) * .6; } if (b.y < 14 + b.r) { b.y = 14 + b.r; b.vy = Math.abs(b.vy) * .35; } });
            collide([ball, ...pins]);
          }
          if (ball.y < 70) { ball.vx *= .9; ball.vy *= .9; }
          const fast = [ball, ...pins].some(b => !b.out && Math.hypot(b.vx, b.vy) > 14);
          if (!fast || ball.t > 7) { state = 'settle'; tmo = setTimeout(() => { if (cv.isConnected) settle(); }, 300); }
        }
        c.fillStyle = '#6D4C41'; c.fillRect(0, 0, W, H); c.fillStyle = '#D7B98A'; c.fillRect(12, 0, W - 24, H); c.fillStyle = '#00000022'; for (let x = 36; x < W - 12; x += 28) c.fillRect(x, 0, 2, H);
        c.fillStyle = '#263238'; c.fillRect(0, 0, 12, H); c.fillRect(W - 12, 0, 12, H);
        pins.forEach(p => { if (p.out) return; c.fillStyle = '#fff'; c.strokeStyle = '#E53935'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); c.stroke(); });
        if (ball) { c.fillStyle = '#1565C0'; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.fillStyle = '#ffffff66'; c.beginPath(); c.arc(ball.x - 4, ball.y - 4, 3, 0, 7); c.fill(); }
        if (aim && state === 'ready') { c.fillStyle = '#1565C0'; c.beginPath(); c.arc(aim.sx, 440, 13, 0, 7); c.fill(); const dx = aim.sx - aim.cx, dy = aim.sy - aim.cy, l = Math.hypot(dx, dy) || 1; c.strokeStyle = '#E53935'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(aim.sx, 440); c.lineTo(aim.sx + dx / l * 180, 440 + dy / l * 180); c.stroke(); c.setLineDash([]); }
      }
      drag(cv, (s, p, k) => {
        if (over || state !== 'ready') return; const sx = Math.max(30, Math.min(W - 30, s.x));
        if (k === 'end') { aim = null; const dx = s.x - p.x, dy = s.y - p.y, l = Math.hypot(dx, dy); if (l < 14 || dy > -4) return; const sp = Math.min(l, 120) * 5.2 + 200; pins.forEach(q => { q.sx = q.x; q.sy = q.y; }); startCount = pins.length; ball = { x: sx, y: 440, vx: dx / l * sp * .5 + (Math.random() - .5) * 14, vy: dy / l * sp, r: 13, m: 4, t: 0 }; state = 'roll'; GV.beep(200, 120); }
        else aim = { sx, sy: s.y, cx: p.x, cy: p.y };
      });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); clearTimeout(tmo); };
    }
  });

  /* ---------- HỨNG LÌ XÌ (Tết) ---------- */
  GV.register({
    id: 'lixi', type: 'game', cat: 'Lễ hội', name: 'Hứng lì xì Tết', icon: '🧧', desc: 'Di chuyển giỏ hứng bao lì xì, vàng và hoa mai – tránh pháo nổ! 45 giây đầu xuân.',
    mount(el) {
      el.innerHTML = hud('lixi', '<span>Còn: <b class="tm">45</b>s</span><span>Mạng: <b class="lv">3</b></span>') + '<canvas class="cv" width="400" height="520" style="max-height:68vh;width:auto"></canvas><p class="msg"></p><p class="hint">Kéo ngón tay / di chuột hoặc dùng ← → để di chuyển giỏ.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 400, H = 520, K = [{ e: '🧧', v: 10, w: 6 }, { e: '💰', v: 30, w: 2 }, { e: '🌼', v: 5, w: 4 }, { e: '🧨', v: -1, w: 3 }];
      let px, items, score, time, lives, over, sp, keys = {};
      function reset() { px = W / 2; items = []; score = 0; time = 45; lives = 3; over = false; sp = 0; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; $(el, '.msg').textContent = ''; }
      function step(dt) {
        if (!over) {
          time -= dt; $(el, '.tm').textContent = Math.max(0, Math.ceil(time)); if (time <= 0) end('Hết giờ! Chúc mừng năm mới 🎊 Điểm: ' + score);
          if (keys.ArrowLeft) px -= 380 * dt; if (keys.ArrowRight) px += 380 * dt; px = Math.max(34, Math.min(W - 34, px));
          sp -= dt; if (sp <= 0) { let r = GV.rnd(15), k = r < 6 ? 0 : r < 8 ? 1 : r < 12 ? 2 : 3; items.push({ x: 24 + GV.rnd(W - 48), y: -20, k, v: 110 + GV.rnd(70) + (45 - time) * 3 }); sp = Math.max(.28, .8 - (45 - time) * .012); }
          items.forEach(i => i.y += i.v * dt);
          items.forEach(i => { if (i.y > H - 78 && i.y < H - 30 && Math.abs(i.x - px) < 44 && !i.got) { i.got = 1; const t = K[i.k]; if (t.v > 0) { score += t.v; GV.beep(700, 50); } else { lives--; $(el, '.lv').textContent = lives; GV.beep(130, 250); if (lives <= 0) end('Pháo nổ mất rồi! Điểm: ' + score); } $(el, '.sc').textContent = score; } });
          items = items.filter(i => !i.got && i.y < H + 30);
        }
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#B71C1C'); g.addColorStop(1, '#7F0000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#FFD54F33'; for (let i = 0; i < 20; i++) c.fillRect((i * 71) % W, (i * 113 + time * 8) % H, 3, 3);
        c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; items.forEach(i => c.fillText(K[i.k].e, i.x, i.y)); c.font = '54px serif'; c.fillText('🧺', px, H - 50);
      }
      function end(m) { over = true; $(el, '.msg').textContent = m; if (GV.setBest('lixi', score)) $(el, '.bs').textContent = score; }
      cv.addEventListener('pointermove', e => { px = pos(cv, e).x; }); cv.addEventListener('pointerdown', e => { px = pos(cv, e).x; });
      const dn = e => { keys[e.key] = 1; if (e.key.startsWith('Arrow')) e.preventDefault(); }, up = e => { keys[e.key] = 0; }; window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
    }
  });

  /* ---------- BẦU CUA TÔM CÁ (Tết) ---------- */
  GV.register({
    id: 'baucua', type: 'game', cat: 'Lễ hội', name: 'Bầu cua tôm cá', icon: '🎲', desc: 'Trò chơi dân gian ngày Tết, chơi vui bằng xu ảo (không dùng tiền thật). Đặt ô, lắc 3 xúc xắc!',
    mount(el) {
      const SY = [['bau', '🥒', 'Bầu'], ['cua', '🦀', 'Cua'], ['tom', '🦐', 'Tôm'], ['ca', '🐟', 'Cá'], ['ga', '🐓', 'Gà'], ['nai', '🦌', 'Nai']];
      el.innerHTML = `<div class="hud"><span>Xu ảo: <b class="sc">1000</b></span><span>Đang cược: <b class="bt">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('baucua') || 1000}</b></span><button class="btn rs">Chơi lại</button></div><div class="row dice" style="font-size:3rem;min-height:1.4em">🎲 🎲 🎲</div><div class="bd" style="grid-template-columns:repeat(3,1fr);width:min(92vw,380px);gap:8px">${SY.map(([k, e, n]) => `<button class="cell" data-k="${k}" style="aspect-ratio:1;flex-direction:column;font-size:2.4rem;position:relative">${e}<small style="font-size:12px">${n}</small><b class="b" style="position:absolute;top:4px;right:8px;font-size:13px;color:var(--warn)"></b></button>`).join('')}</div><div class="row"><label>Mức cược mỗi lần <select class="ch"><option>10</option><option selected>50</option><option>100</option><option>500</option></select></label><button class="btn roll">🎲 Lắc!</button><button class="btn ghost clr">Bỏ cược</button></div><p class="msg">Chạm vào ô để đặt cược. Mỗi xúc xắc trùng ô bạn đặt trả thêm 1 lần tiền cược.</p><p class="hint">Chỉ dùng xu ảo để giải trí – không đổi ra tiền, không khuyến khích cờ bạc.</p>`;
      let coins = 1000, bets = {}, busy = false, tmr;
      const tot = () => Object.values(bets).reduce((a, b) => a + b, 0);
      const draw = () => { $(el, '.sc').textContent = coins; $(el, '.bt').textContent = tot(); el.querySelectorAll('.cell').forEach(b => b.querySelector('.b').textContent = bets[b.dataset.k] ? '🪙' + bets[b.dataset.k] : ''); };
      el.querySelector('.bd').onclick = e => { const b = e.target.closest('[data-k]'); if (!b || busy) return; const v = +$(el, '.ch').value; if (tot() + v > coins) { $(el, '.msg').textContent = 'Không đủ xu để cược thêm.'; return; } bets[b.dataset.k] = (bets[b.dataset.k] || 0) + v; GV.beep(500, 30); draw(); };
      $(el, '.clr').onclick = () => { if (!busy) { bets = {}; draw(); } };
      $(el, '.roll').onclick = () => {
        if (busy) return; if (!tot()) { $(el, '.msg').textContent = 'Hãy đặt cược vào ít nhất một ô!'; return; } busy = true; let n = 0;
        tmr = setInterval(() => { $(el, '.dice').textContent = [0, 1, 2].map(() => SY[GV.rnd(6)][1]).join(' '); GV.beep(300 + n * 20, 30); if (++n > 12) { clearInterval(tmr); fin(); } }, 90);
      };
      function fin() {
        const r = [0, 1, 2].map(() => SY[GV.rnd(6)]); $(el, '.dice').textContent = r.map(x => x[1]).join(' '); let net = 0;
        Object.entries(bets).forEach(([k, b]) => { const m = r.filter(x => x[0] === k).length; net += m ? b * m : -b; }); coins += net; bets = {}; busy = false;
        $(el, '.msg').textContent = net > 0 ? `Trúng lớn! +${net} xu 🎉` : net < 0 ? `Hụt rồi, ${net} xu. Thử lại nhé!` : 'Hoà vốn.'; if (net > 0) GV.beep(880, 150);
        if (coins <= 0) { coins = 500; $(el, '.msg').textContent += ' Bạn được tặng 500 xu ảo mới.'; } if (GV.setBest('baucua', coins)) $(el, '.bs').textContent = coins; draw();
      }
      $(el, '.rs').onclick = () => { clearInterval(tmr); coins = 1000; bets = {}; busy = false; $(el, '.msg').textContent = ''; draw(); }; draw();
      return () => clearInterval(tmr);
    }
  });

  /* ---------- GHÉP TRÁI TIM (Valentine) ---------- */
  GV.register({
    id: 'lovematch', type: 'game', cat: 'Lễ hội', name: 'Ghép đôi Valentine', icon: '💝', desc: 'Lật thẻ tìm các cặp biểu tượng tình yêu giống nhau. Ít lượt lật nhất là tuyệt nhất!',
    mount(el) {
      const E = ['💘', '💌', '🌹', '🍫', '💍', '🧸', '🎁', '💐'];
      el.innerHTML = `<div class="hud"><span>Lượt: <b class="sc">0</b></span><span>Cặp: <b class="pr">0</b>/8</span><span>Kỷ lục: <b class="bs">${GV.best('lovematch') || '-'}</b></span><button class="btn rs">Ván mới</button></div><div class="bd lm" style="grid-template-columns:repeat(4,1fr);width:min(92vw,380px);gap:8px"></div><p class="msg"></p>`;
      let cards, open, moves, pairs, lock; const board = $(el, '.lm');
      function reset() { cards = GV.shuffle([...E, ...E]); open = []; moves = 0; pairs = 0; lock = false; $(el, '.sc').textContent = 0; $(el, '.pr').textContent = 0; $(el, '.msg').textContent = ''; board.innerHTML = cards.map((e, i) => `<button class="cell" data-i="${i}" style="aspect-ratio:1;font-size:2rem;background:linear-gradient(145deg,#ec407a55,#7e57c255)" aria-label="Thẻ úp">❤️</button>`).join(''); }
      board.onclick = e => {
        const b = e.target.closest('[data-i]'); if (!b || lock || b.dataset.on) return; const i = +b.dataset.i; b.textContent = cards[i]; b.dataset.on = 1; b.style.background = 'var(--md-sc-highest)'; open.push(i); GV.beep(500, 30);
        if (open.length === 2) { moves++; $(el, '.sc').textContent = moves; const [a, c] = open; open = [];
          if (cards[a] === cards[c]) { pairs++; $(el, '.pr').textContent = pairs; GV.beep(800, 80); if (pairs === 8) { $(el, '.msg').textContent = `Tình yêu viên mãn! 💕 ${moves} lượt.`; if (!GV.best('lovematch') || moves < GV.best('lovematch')) { GV.setBest('lovematch', moves, true); $(el, '.bs').textContent = moves; } } }
          else { lock = true; setTimeout(() => { [a, c].forEach(k => { const x = board.children[k]; if (!x) return; x.textContent = '❤️'; delete x.dataset.on; x.style.background = 'linear-gradient(145deg,#ec407a55,#7e57c255)'; }); lock = false; }, 800); } }
      };
      $(el, '.rs').onclick = reset; reset();
    }
  });

  /* ---------- ÔNG GIÀ NOEL GIAO QUÀ ---------- */
  GV.register({
    id: 'santa', type: 'game', cat: 'Lễ hội', name: 'Noel giao quà', icon: '🎅', desc: 'Ông già Noel bay qua các ngôi nhà – chạm đúng lúc để thả quà xuống ống khói!',
    mount(el) {
      el.innerHTML = hud('santa', '<span>Trượt: <b class="ms">0</b>/5</span>') + '<canvas class="cv" width="480" height="360"></canvas><p class="msg"></p><p class="hint">Chạm / Space để thả quà. Thả khi quà rơi đúng vào ống khói.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 360, SX = 110; let hs, gifts, score, miss, speed, over, t, spawnX, streak;
      function reset() { hs = []; gifts = []; score = 0; miss = 0; speed = 110; over = false; t = 0; spawnX = 300; streak = 0; for (let i = 0; i < 4; i++) addHouse(); $(el, '.sc').textContent = 0; $(el, '.ms').textContent = 0; $(el, '.msg').textContent = ''; }
      function addHouse() { const w = 70 + GV.rnd(30), h = 60 + GV.rnd(70); hs.push({ x: spawnX, w, h, cx: 15 + GV.rnd(w - 40), done: false }); spawnX += w + 70 + GV.rnd(80); }
      function drop() { if (over || gifts.filter(g => !g.dead).length > 2) return; gifts.push({ x: SX, y: 95, vy: 0 }); GV.beep(500, 30); }
      function step(dt) {
        if (!over) {
          t += dt; speed = 110 + t * 3; hs.forEach(h => h.x -= speed * dt); spawnX -= speed * dt; while (spawnX < W + 120) addHouse(); hs = hs.filter(h => h.x + h.w > -40);
          gifts.forEach(g => { g.vy += 520 * dt; g.y += g.vy * dt; g.x -= speed * dt * .5; const hh = hs.find(h => g.x > h.x && g.x < h.x + h.w && g.y >= H - h.h - 26); if (hh && !g.dead) { g.dead = true; const inC = g.x > hh.x + hh.cx - 3 && g.x < hh.x + hh.cx + 28; if (inC) { streak++; score += 10 + Math.min(streak, 5) * 2; GV.beep(800, 90); hh.done = true; } else miss++; if (!inC) { streak = 0; GV.beep(160, 160); } $(el, '.sc').textContent = score; $(el, '.ms').textContent = miss; if (miss >= 5) { over = true; $(el, '.msg').textContent = 'Hết quà rơi vãi! Điểm: ' + score; if (GV.setBest('santa', score)) $(el, '.bs').textContent = score; } } else if (g.y > H && !g.dead) { g.dead = true; miss++; streak = 0; $(el, '.ms').textContent = miss; if (miss >= 5) { over = true; $(el, '.msg').textContent = 'Hết quà rơi vãi! Điểm: ' + score; if (GV.setBest('santa', score)) $(el, '.bs').textContent = score; } } });
          gifts = gifts.filter(g => !g.dead);
        }
        const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1a3a'); gr.addColorStop(1, '#1b3b6f'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffffcc'; for (let i = 0; i < 40; i++) c.fillRect((i * 97 - t * 20) % W + (i * 97 - t * 20 < 0 ? W : 0), (i * 53 + t * 30) % H, 2, 2);
        c.fillStyle = '#eceff1'; c.fillRect(0, H - 22, W, 22);
        hs.forEach(h => { c.fillStyle = h.done ? '#2E7D32' : '#8D3A3A'; c.fillRect(h.x, H - 22 - h.h, h.w, h.h); c.fillStyle = '#eceff1'; c.beginPath(); c.moveTo(h.x - 6, H - 22 - h.h); c.lineTo(h.x + h.w / 2, H - 22 - h.h - 28); c.lineTo(h.x + h.w + 6, H - 22 - h.h); c.fill(); c.fillStyle = '#4E342E'; c.fillRect(h.x + h.cx, H - 22 - h.h - 32, 24, 30); c.fillStyle = '#FFD54F'; c.fillRect(h.x + 12, H - 22 - h.h + 14, 14, 14); c.fillRect(h.x + h.w - 28, H - 22 - h.h + 14, 14, 14); });
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; gifts.forEach(g => c.fillText('🎁', g.x, g.y)); c.font = '54px serif'; c.fillText('🛷', SX, 70 + Math.sin(t * 3) * 4); c.font = '28px serif'; c.fillText('🦌', SX + 54, 66 + Math.sin(t * 3) * 4);
      }
      cv.addEventListener('pointerdown', drop); const off = GV.keys(e => { if (e.key === ' ') drop(); });
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); off(); };
    }
  });

  /* ---------- HALLOWEEN NHẶT KẸO ---------- */
  GV.register({
    id: 'halloween', type: 'game', cat: 'Lễ hội', name: 'Halloween nhặt kẹo', icon: '🎃', desc: 'Phù thủy nhỏ nhặt kẹo trong đêm Halloween, né những bóng ma đuổi theo – càng lâu càng đông!',
    mount(el) {
      el.innerHTML = hud('halloween', '<span>Mạng: <b class="lv">3</b></span>') + '<canvas class="cv" width="480" height="360"></canvas><p class="msg"></p><p class="hint">Kéo ngón tay / di chuột để di chuyển, hoặc dùng mũi tên / WASD.</p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), W = 480, H = 360; let p, tgt, candy, ghosts, score, lives, inv, over, keys = {}, t;
      function reset() { p = { x: 240, y: 200 }; tgt = null; candy = []; ghosts = [{ x: 40, y: 40, v: 55 }]; score = 0; lives = 3; inv = 0; over = false; t = 0; for (let i = 0; i < 3; i++) addC(); $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; $(el, '.msg').textContent = ''; }
      const addC = () => candy.push({ x: 30 + GV.rnd(W - 60), y: 30 + GV.rnd(H - 60), e: ['🍬', '🍭', '🍫', '🧁'][GV.rnd(4)] });
      function step(dt) {
        if (!over) {
          t += dt; inv -= dt; let dx = 0, dy = 0; if (keys.arrowleft || keys.a) dx -= 1; if (keys.arrowright || keys.d) dx += 1; if (keys.arrowup || keys.w) dy -= 1; if (keys.arrowdown || keys.s) dy += 1;
          if (dx || dy) { tgt = null; const l = Math.hypot(dx, dy); p.x += dx / l * 190 * dt; p.y += dy / l * 190 * dt; } else if (tgt) { const ddx = tgt.x - p.x, ddy = tgt.y - p.y, d = Math.hypot(ddx, ddy); if (d > 4) { p.x += ddx / d * Math.min(200 * dt, d); p.y += ddy / d * Math.min(200 * dt, d); } }
          p.x = Math.max(16, Math.min(W - 16, p.x)); p.y = Math.max(16, Math.min(H - 16, p.y));
          candy = candy.filter(k => { if (Math.hypot(k.x - p.x, k.y - p.y) < 24) { score += 10; $(el, '.sc').textContent = score; GV.beep(760, 50); addC(); if (score % 50 === 0) ghosts.push({ x: GV.rnd(2) ? 20 : W - 20, y: GV.rnd(H), v: 55 + score / 8 }); return false; } return true; });
          ghosts.forEach(g => { const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1; g.x += dx / d * g.v * dt; g.y += dy / d * g.v * dt; if (d < 24 && inv <= 0) { lives--; inv = 1.6; $(el, '.lv').textContent = lives; GV.beep(130, 300); if (lives <= 0) { over = true; $(el, '.msg').textContent = 'Ma bắt mất rồi! Điểm: ' + score; if (GV.setBest('halloween', score)) $(el, '.bs').textContent = score; } } });
        }
        c.fillStyle = '#1a1033'; c.fillRect(0, 0, W, H); c.fillStyle = '#FFB74D22'; c.beginPath(); c.arc(420, 50, 34, 0, 7); c.fill(); c.fillStyle = '#ffffff12'; for (let i = 0; i < 24; i++) c.fillRect((i * 83) % W, (i * 61) % H, 2, 2);
        c.font = '26px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; candy.forEach(k => c.fillText(k.e, k.x, k.y)); ghosts.forEach(g => c.fillText('👻', g.x, g.y)); if (inv <= 0 || Math.floor(inv * 8) % 2) { c.font = '32px serif'; c.fillText('🧙', p.x, p.y); }
      }
      cv.addEventListener('pointerdown', e => { tgt = pos(cv, e); }); cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') tgt = pos(cv, e); });
      const dn = e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return; keys[e.key.toLowerCase()] = 1; if (e.key.startsWith('Arrow')) e.preventDefault(); }, up = e => { keys[e.key.toLowerCase()] = 0; }; window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
      $(el, '.rs').onclick = reset; reset(); const stop = loop(step); return () => { stop(); window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
    }
  });
})();
