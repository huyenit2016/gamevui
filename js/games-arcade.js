// Game arcade: Rắn săn mồi, Xếp hình, Phá gạch, Chim bay
(function () {
  const hud = (id) => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id)}</b></span><button class="btn rs">Chơi lại</button></div>`;

  /* ---------- SNAKE ---------- */
  GV.register({
    id: 'snake', type: 'game', cat: 'Arcade', name: 'Rắn săn mồi', icon: '🐍', desc: 'Ăn mồi, lớn nhanh, đừng cắn đuôi!',
    mount(el) {
      el.innerHTML = hud('snake') + '<canvas class="cv" width="400" height="400"></canvas><p class="msg"></p><p class="hint">Mũi tên / WASD hoặc vuốt màn hình. Space để tạm dừng.</p>';
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), N = 20, S = 20;
      const sc = el.querySelector('.sc'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg');
      let snake, dir, nd, food, score, timer, over, paused;
      function place() { do { food = { x: GV.rnd(N), y: GV.rnd(N) }; } while (snake.some(p => p.x === food.x && p.y === food.y)); }
      function reset() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = nd = { x: 1, y: 0 }; score = 0; over = false; paused = false;
        sc.textContent = 0; msg.textContent = ''; place(); clearInterval(timer); timer = setInterval(step, 110); draw();
      }
      function step() {
        if (over || paused) return;
        dir = nd;
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(p => p.x === h.x && p.y === h.y)) {
          over = true; msg.textContent = 'Game over! Điểm: ' + score;
          if (GV.setBest('snake', score)) bs.textContent = score;
          GV.beep(150, 300); return;
        }
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) { score++; sc.textContent = score; GV.beep(660, 60); place(); } else snake.pop();
        draw();
      }
      function draw() {
        c.fillStyle = '#0a0d1c'; c.fillRect(0, 0, 400, 400);
        c.fillStyle = '#ff5c6c'; c.beginPath(); c.arc(food.x * S + 10, food.y * S + 10, 8, 0, 7); c.fill();
        snake.forEach((p, i) => { c.fillStyle = i ? '#3ddc97' : '#9dffcf'; c.fillRect(p.x * S + 1, p.y * S + 1, S - 2, S - 2); });
      }
      function turn(d) {
        const m = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[d];
        if (m && !(m[0] === -dir.x && m[1] === -dir.y)) nd = { x: m[0], y: m[1] };
      }
      const off = GV.keys(e => {
        const k = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' }[e.key];
        if (k) turn(k); else if (e.key === ' ') paused = !paused;
      });
      GV.swipe(cv, turn);
      el.querySelector('.rs').onclick = reset;
      reset();
      return () => { clearInterval(timer); off(); };
    }
  });

  /* ---------- TETRIS ---------- */
  GV.register({
    id: 'tetris', type: 'game', cat: 'Arcade', name: 'Xếp hình', icon: '🧱', desc: 'Tetris kinh điển.',
    mount(el) {
      el.innerHTML = hud('tetris') + `<div>Hàng: <b class="ln">0</b></div><canvas class="cv" width="240" height="480" style="max-height:60vh;width:auto"></canvas><p class="msg"></p>
      <div class="row"><button class="btn ghost" data-k="left">◀</button><button class="btn ghost" data-k="rot">⟳</button><button class="btn ghost" data-k="right">▶</button><button class="btn ghost" data-k="down">▼</button><button class="btn ghost" data-k="drop">⤓</button></div>
      <p class="hint">← → di chuyển, ↑ xoay, ↓ rơi nhanh, Space thả.</p>`;
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), W = 10, H = 20, S = 24;
      const sc = el.querySelector('.sc'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg'), ln = el.querySelector('.ln');
      const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]];
      const COL = ['#4dd0e1', '#ffd166', '#b388ff', '#6c8cff', '#ff9f43', '#3ddc97', '#ff5c6c'];
      let g, p, score, lines, timer, over;
      const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
      const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < W && y + j < H && (y + j < 0 || !g[y + j][x + i]))));
      function spawn() {
        const t = GV.rnd(7); p = { m: SH[t].map(r => r.slice()), c: COL[t], x: 3, y: 0 };
        if (!fits(p.m, p.x, p.y)) { over = true; msg.textContent = 'Game over!'; clearInterval(timer); if (GV.setBest('tetris', score)) bs.textContent = score; }
      }
      function reset() {
        g = Array.from({ length: H }, () => Array(W).fill(0)); score = 0; lines = 0; over = false; sc.textContent = 0; ln.textContent = 0; msg.textContent = '';
        spawn(); clearInterval(timer); timer = setInterval(() => move(0, 1), 500); draw();
      }
      function lock() {
        p.m.forEach((r, j) => r.forEach((v, i) => { if (v && p.y + j >= 0) g[p.y + j][p.x + i] = p.c; }));
        let n = 0;
        for (let y = H - 1; y >= 0; y--) if (g[y].every(v => v)) { g.splice(y, 1); g.unshift(Array(W).fill(0)); n++; y++; }
        if (n) { score += [0, 100, 300, 500, 800][n]; lines += n; sc.textContent = score; ln.textContent = lines; GV.beep(520, 80); }
        spawn();
      }
      function move(dx, dy) {
        if (over) return;
        if (fits(p.m, p.x + dx, p.y + dy)) { p.x += dx; p.y += dy; } else if (dy) lock();
        draw();
      }
      function act(k) {
        if (over) return;
        if (k === 'left') move(-1, 0); else if (k === 'right') move(1, 0); else if (k === 'down') move(0, 1);
        else if (k === 'rot') { const r = rot(p.m); for (const d of [0, -1, 1, -2, 2]) if (fits(r, p.x + d, p.y)) { p.m = r; p.x += d; break; } draw(); }
        else if (k === 'drop') { while (fits(p.m, p.x, p.y + 1)) p.y++; lock(); draw(); }
      }
      function draw() {
        c.fillStyle = '#0a0d1c'; c.fillRect(0, 0, 240, 480);
        g.forEach((r, y) => r.forEach((v, x) => { if (v) { c.fillStyle = v; c.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); } }));
        if (!over) { c.fillStyle = p.c; p.m.forEach((r, j) => r.forEach((v, i) => { if (v) c.fillRect((p.x + i) * S + 1, (p.y + j) * S + 1, S - 2, S - 2); })); }
      }
      const off = GV.keys(e => { const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', ' ': 'drop' }[e.key]; if (k) act(k); });
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => act(b.dataset.k));
      GV.swipe(cv, d => act(d === 'up' ? 'rot' : d));
      el.querySelector('.rs').onclick = reset;
      reset();
      return () => { clearInterval(timer); off(); };
    }
  });

  /* ---------- BREAKOUT ---------- */
  GV.register({
    id: 'breakout', type: 'game', cat: 'Arcade', name: 'Phá gạch', icon: '🏓', desc: 'Điều khiển vợt, phá hết gạch.',
    mount(el) {
      el.innerHTML = hud('breakout') + '<div>Mạng: <b class="lv">3</b></div><canvas class="cv" width="480" height="360"></canvas><p class="msg">Nhấn/chạm để bắt đầu</p><p class="hint">Di chuột hoặc kéo ngón tay để di chuyển vợt; ← → cũng được.</p>';
      const cv = el.querySelector('canvas'), c = cv.getContext('2d');
      const sc = el.querySelector('.sc'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg'), lv = el.querySelector('.lv');
      let px, ball, bricks, score, lives, run, raf, keyDir = 0;
      function reset() {
        px = 200; score = 0; lives = 3; run = false; sc.textContent = 0; lv.textContent = 3; msg.textContent = 'Nhấn/chạm để bắt đầu';
        bricks = []; for (let r = 0; r < 6; r++) for (let i = 0; i < 10; i++) bricks.push({ x: i * 48 + 2, y: r * 20 + 30, on: true, c: ['#ff5c6c', '#ff9f43', '#ffd166', '#3ddc97', '#6c8cff', '#b388ff'][r] });
        serve();
      }
      function serve() { ball = { x: 240, y: 300, vx: (Math.random() < .5 ? -1 : 1) * 3, vy: -4 }; run = false; }
      function loop() {
        px = Math.max(40, Math.min(440, px + keyDir * 7));
        if (run) {
          ball.x += ball.vx; ball.y += ball.vy;
          if (ball.x < 6 || ball.x > 474) ball.vx *= -1;
          if (ball.y < 6) ball.vy *= -1;
          if (ball.y > 340 && ball.y < 352 && Math.abs(ball.x - px) < 46 && ball.vy > 0) { ball.vy = -Math.abs(ball.vy); ball.vx = (ball.x - px) / 8; GV.beep(300, 40); }
          if (ball.y > 370) { lives--; lv.textContent = lives; if (lives <= 0) { end('Thua rồi! Điểm: ' + score); } else serve(); }
          for (const b of bricks) if (b.on && ball.x > b.x && ball.x < b.x + 44 && ball.y > b.y && ball.y < b.y + 16) {
            b.on = false; ball.vy *= -1; score += 10; sc.textContent = score; GV.beep(700, 30);
            if (!bricks.some(q => q.on)) end('Chiến thắng! Điểm: ' + score);
            break;
          }
        }
        c.fillStyle = '#0a0d1c'; c.fillRect(0, 0, 480, 360);
        bricks.forEach(b => { if (b.on) { c.fillStyle = b.c; c.fillRect(b.x, b.y, 44, 16); } });
        c.fillStyle = '#eef0ff'; c.fillRect(px - 40, 345, 80, 10);
        c.beginPath(); c.arc(ball.x, ball.y, 6, 0, 7); c.fill();
        raf = requestAnimationFrame(loop);
      }
      function end(t) { run = false; msg.textContent = t; if (GV.setBest('breakout', score)) bs.textContent = score; ball = { x: 240, y: 500, vx: 0, vy: 0 }; }
      function setX(clientX) { const r = cv.getBoundingClientRect(); px = Math.max(40, Math.min(440, (clientX - r.left) * 480 / r.width)); }
      cv.addEventListener('mousemove', e => setX(e.clientX));
      cv.addEventListener('touchmove', e => setX(e.touches[0].clientX), { passive: true });
      cv.addEventListener('click', () => { if (!run && lives > 0 && bricks.some(b => b.on)) { run = true; msg.textContent = ''; } });
      cv.addEventListener('touchstart', e => { setX(e.touches[0].clientX); if (!run && lives > 0 && bricks.some(b => b.on)) { run = true; msg.textContent = ''; } }, { passive: true });
      const off = GV.keys(e => { if (e.key === 'ArrowLeft') keyDir = -1; else if (e.key === 'ArrowRight') keyDir = 1; else if (e.key === ' ' && !run && lives > 0) { run = true; msg.textContent = ''; } });
      const up = () => keyDir = 0; window.addEventListener('keyup', up);
      el.querySelector('.rs').onclick = reset;
      reset(); loop();
      return () => { cancelAnimationFrame(raf); off(); window.removeEventListener('keyup', up); };
    }
  });

  /* ---------- FLAPPY ---------- */
  GV.register({
    id: 'flappy', type: 'game', cat: 'Arcade', name: 'Chim bay', icon: '🐤', desc: 'Chạm để vỗ cánh, tránh ống.',
    mount(el) {
      el.innerHTML = hud('flappy') + '<canvas class="cv" width="320" height="480" style="max-height:65vh;width:auto"></canvas><p class="msg">Chạm / Space để bắt đầu</p>';
      const cv = el.querySelector('canvas'), c = cv.getContext('2d');
      const sc = el.querySelector('.sc'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg');
      let y, vy, pipes, score, state, raf, t;
      function reset() { y = 220; vy = 0; pipes = []; score = 0; t = 0; state = 'ready'; sc.textContent = 0; msg.textContent = 'Chạm / Space để bắt đầu'; }
      function flap() {
        if (state === 'ready') { state = 'play'; msg.textContent = ''; }
        if (state === 'play') { vy = -6.2; GV.beep(500, 40); } else if (state === 'dead' && t > 30) reset();
      }
      function die() { state = 'dead'; t = 0; msg.textContent = 'Va chạm! Điểm ' + score + ' – chạm để chơi lại'; if (GV.setBest('flappy', score)) bs.textContent = score; GV.beep(150, 250); }
      function loop() {
        t++;
        if (state === 'play') {
          vy += .38; y += vy;
          if (t % 90 === 1) pipes.push({ x: 330, gap: 90 + GV.rnd(200), ok: false });
          pipes.forEach(p => p.x -= 2.4);
          pipes = pipes.filter(p => p.x > -60);
          for (const p of pipes) {
            if (60 + 12 > p.x && 60 - 12 < p.x + 50 && (y - 12 < p.gap || y + 12 > p.gap + 130)) die();
            if (!p.ok && p.x + 50 < 60) { p.ok = true; score++; sc.textContent = score; }
          }
          if (y > 470 || y < 0) die();
        } else if (state === 'ready') y = 220 + Math.sin(t / 10) * 8;
        c.fillStyle = '#4dc3ff'; c.fillRect(0, 0, 320, 480);
        c.fillStyle = '#3ddc97'; pipes.forEach(p => { c.fillRect(p.x, 0, 50, p.gap); c.fillRect(p.x, p.gap + 130, 50, 480); });
        c.fillStyle = '#ffd166'; c.beginPath(); c.arc(60, y, 12, 0, 7); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.arc(65, y - 3, 2.5, 0, 7); c.fill();
        raf = requestAnimationFrame(loop);
      }
      cv.addEventListener('mousedown', flap);
      cv.addEventListener('touchstart', e => { e.preventDefault(); flap(); }, { passive: false });
      const off = GV.keys(e => { if (e.key === ' ' || e.key === 'ArrowUp') flap(); });
      el.querySelector('.rs').onclick = reset;
      reset(); loop();
      return () => { cancelAnimationFrame(raf); off(); };
    }
  });
})();
