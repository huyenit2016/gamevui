// Game mới (trí tuệ & mô phỏng): Toán nhanh, Mê cung, Ăn kẹo, Tô màu theo số, Nông trại, Làm bánh
(function () {
  const $ = (el, s) => el.querySelector(s);
  const hud = (id, extra = '') => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id)}</b></span>${extra}<button class="btn rs">Chơi lại</button></div>`;
  const BTN = 'style="min-width:64px;min-height:48px;font-size:18px"';

  /* ---------- TOÁN NHANH ---------- */
  GV.register({
    id: 'mathrush', type: 'game', cat: 'Toán học', name: 'Toán nhanh', icon: '🧮', desc: 'Tính nhẩm trong 60 giây – càng đúng liên tiếp càng nhiều điểm. Phép tính khó dần.',
    mount(el) {
      el.innerHTML = hud('mathrush', '<span>Còn: <b class="tm">60</b>s</span><span>Chuỗi: <b class="st">0</b></span>') + `<div class="big q" style="min-height:1.3em;font-size:2.6rem">…</div><div class="row opts" style="max-width:420px"></div><p class="msg"></p><p class="hint">Chọn đáp án đúng (hoặc bấm phím 1-4). Sai bị trừ 3 giây.</p>`;
      let score, time, streak, ans, tmr, over, lvl;
      function q() {
        const L = Math.min(4, 1 + Math.floor(score / 80)); lvl = L; let a, b, op, r;
        const ops = L === 1 ? ['+', '-'] : L === 2 ? ['+', '-', '×'] : ['+', '-', '×', '×'];
        op = ops[GV.rnd(ops.length)]; const M = [0, 10, 25, 60, 99][L];
        a = 2 + GV.rnd(M); b = 2 + GV.rnd(op === '×' ? Math.min(12, M) : M);
        if (op === '-' && b > a) [a, b] = [b, a]; r = op === '+' ? a + b : op === '-' ? a - b : a * b;
        const set = new Set([r]); while (set.size < 4) { const d = r + (GV.rnd(2) ? 1 : -1) * (1 + GV.rnd(Math.max(4, Math.round(r * .2)))); if (d >= 0) set.add(d); }
        const arr = GV.shuffle([...set]); ans = arr.indexOf(r);
        $(el, '.q').textContent = `${a} ${op} ${b} = ?`; $(el, '.opts').innerHTML = arr.map((v, i) => `<button class="btn ghost" data-i="${i}" ${BTN}>${v}</button>`).join('');
      }
      function pick(i) {
        if (over) return;
        if (i === ans) { streak++; score += 10 + Math.min(streak, 10) * 2 + lvl * 2; GV.beep(700, 60); } else { streak = 0; time -= 3; GV.beep(180, 120); $(el, '.q').style.color = 'var(--bad)'; setTimeout(() => { const e = $(el, '.q'); if (e) e.style.color = ''; }, 250); }
        $(el, '.sc').textContent = score; $(el, '.st').textContent = streak; q();
      }
      function reset() {
        clearInterval(tmr); score = 0; time = 60; streak = 0; over = false; $(el, '.msg').textContent = ''; $(el, '.sc').textContent = 0; $(el, '.st').textContent = 0; q();
        tmr = setInterval(() => { time--; $(el, '.tm').textContent = Math.max(0, time); if (time <= 0) { over = true; clearInterval(tmr); $(el, '.opts').innerHTML = ''; $(el, '.msg').textContent = 'Hết giờ! Điểm: ' + score; if (GV.setBest('mathrush', score)) $(el, '.bs').textContent = score; } }, 1000);
      }
      $(el, '.opts').onclick = e => { const b = e.target.closest('[data-i]'); if (b) pick(+b.dataset.i); };
      const off = GV.keys(e => { if ('1234'.includes(e.key) && e.key) pick(+e.key - 1); }); $(el, '.rs').onclick = reset; reset();
      return () => { clearInterval(tmr); off(); };
    }
  });

  /* ---------- MÊ CUNG ---------- */
  GV.register({
    id: 'maze', type: 'game', cat: 'Trí tuệ', name: 'Mê cung', icon: '🧭', desc: 'Tìm đường từ góc trái tới ô cờ. Mỗi màn mê cung lớn hơn và có đồng hồ bấm giờ.',
    mount(el) {
      el.innerHTML = hud('maze', '<span>Màn: <b class="lv">1</b></span><span>Thời gian: <b class="tm">0</b>s</span>') + '<canvas class="cv" width="420" height="420"></canvas><div class="dpad"><span></span><button class="btn ghost" data-d="up">↑</button><span></span><button class="btn ghost" data-d="left">←</button><button class="btn ghost" data-d="down">↓</button><button class="btn ghost" data-d="right">→</button></div><p class="msg"></p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'); let n, g, px, py, lv, t0, tmr, done, cs;
      function gen() {
        n = Math.min(24, 6 + lv * 2); cs = 420 / n; g = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ r: 1, d: 1, v: 0 })));
        const st = [[0, 0]]; g[0][0].v = 1;
        while (st.length) { const [x, y] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !g[b][a].v);
          if (!nb.length) { st.pop(); continue; } const [a, b, dx, dy] = nb[GV.rnd(nb.length)]; g[b][a].v = 1;
          if (dx === 1) g[y][x].r = 0; else if (dx === -1) g[b][a].r = 0; else if (dy === 1) g[y][x].d = 0; else g[b][a].d = 0; st.push([a, b]); }
        px = py = 0; done = false; t0 = Date.now(); $(el, '.lv').textContent = lv; $(el, '.msg').textContent = ''; draw();
      }
      function draw() {
        c.fillStyle = '#0D0F14'; c.fillRect(0, 0, 420, 420); c.strokeStyle = '#CAC4D0'; c.lineWidth = 2; c.beginPath();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (g[y][x].r) { c.moveTo((x + 1) * cs, y * cs); c.lineTo((x + 1) * cs, (y + 1) * cs); } if (g[y][x].d) { c.moveTo(x * cs, (y + 1) * cs); c.lineTo((x + 1) * cs, (y + 1) * cs); } }
        c.moveTo(0, 0); c.lineTo(0, 420); c.moveTo(0, 0); c.lineTo(420, 0); c.stroke();
        c.font = cs * .75 + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏁', (n - .5) * cs, (n - .5) * cs + 1); c.fillText('🐭', (px + .5) * cs, (py + .5) * cs + 1);
      }
      function mv(dx, dy) {
        if (done) return; const cell = g[py][px];
        if ((dx === 1 && cell.r) || (dx === -1 && (px === 0 || g[py][px - 1].r)) || (dy === 1 && cell.d) || (dy === -1 && (py === 0 || g[py - 1][px].d))) return;
        px += dx; py += dy; GV.beep(400, 20); draw();
        if (px === n - 1 && py === n - 1) { done = true; const s = (Date.now() - t0) / 1000; $(el, '.msg').textContent = `Thoát rồi! ${s.toFixed(1)}s – sang màn ${lv + 1}…`; $(el, '.sc').textContent = lv; if (GV.setBest('maze', lv)) $(el, '.bs').textContent = lv; lv++; setTimeout(() => { if (cv.isConnected) gen(); }, 1100); }
      }
      const dir = d => { const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]; if (m) mv(m[0], m[1]); };
      const off = GV.keys(e => { const d = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[e.key]; if (d) dir(d); });
      GV.swipe(cv, dir); el.querySelector('.dpad').onclick = e => { const b = e.target.closest('[data-d]'); if (b) dir(b.dataset.d); };
      function reset() { lv = 1; $(el, '.sc').textContent = 0; gen(); }
      tmr = setInterval(() => { if (!done) $(el, '.tm').textContent = Math.floor((Date.now() - t0) / 1000); }, 500);
      $(el, '.rs').onclick = reset; reset();
      return () => { clearInterval(tmr); off(); };
    }
  });

  /* ---------- ĂN KẸO (kiểu Pac-Man) ---------- */
  const MAP = ['###############', '#o...........o#', '#.###.###.###.#', '#.............#', '#.##.#####.##.#', '#....#...#....#', '####.# G #.####', '#....#   #....#', '#.##.#####.##.#', '#......P......#', '#.###.###.###.#', '#o..#.....#..o#', '###.#.#.#.#.###', '#.....#.#.....#', '###############'];
  GV.register({
    id: 'candyman', type: 'game', cat: 'Arcade', name: 'Ăn kẹo', icon: '🍬', desc: 'Ăn hết kẹo trong mê cung, né ma! Ăn kẹo lớn để phản công trong vài giây.',
    mount(el) {
      el.innerHTML = hud('candyman', '<span>Mạng: <b class="lv">3</b></span>') + '<canvas class="cv" width="420" height="420"></canvas><div class="dpad"><span></span><button class="btn ghost" data-d="up">↑</button><span></span><button class="btn ghost" data-d="left">←</button><button class="btn ghost" data-d="down">↓</button><button class="btn ghost" data-d="right">→</button></div><p class="msg"></p>';
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), N = 15, S = 28; let grid, p, gh, dir, nd, score, lives, tmr, power, over, left;
      const wall = (x, y) => y < 0 || y >= N || x < 0 || x >= N || grid[y][x] === '#';
      function spawn() { p = { x: 7, y: 9 }; dir = nd = { x: 0, y: 0 }; gh = [{ x: 6, y: 6, c: '#EF5350', h: { x: 1, y: 0 } }, { x: 7, y: 6, c: '#42A5F5', h: { x: -1, y: 0 } }, { x: 8, y: 6, c: '#FF80AB', h: { x: 0, y: 1 } }]; }
      function reset() { grid = MAP.map(r => r.split('').map(ch => (ch === 'P' || ch === 'G' ? ' ' : ch))); left = grid.flat().filter(ch => ch === '.' || ch === 'o').length; score = 0; lives = 3; power = 0; over = false; $(el, '.msg').textContent = ''; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; spawn(); clearInterval(tmr); tmr = setInterval(step, 150); draw(); }
      function hit(g) { if (power > 0) { score += 50; g.x = 7; g.y = 6; $(el, '.sc').textContent = score; GV.beep(900, 80); } else { lives--; $(el, '.lv').textContent = lives; GV.beep(130, 300); if (lives <= 0) { over = true; $(el, '.msg').textContent = 'Hết mạng! Điểm: ' + score; if (GV.setBest('candyman', score)) $(el, '.bs').textContent = score; } else spawn(); } }
      function step() {
        if (over) return;
        if (nd.x || nd.y) { if (!wall(p.x + nd.x, p.y + nd.y)) dir = nd; }
        if (!wall(p.x + dir.x, p.y + dir.y)) { p.x += dir.x; p.y += dir.y; }
        const ch = grid[p.y][p.x];
        if (ch === '.' || ch === 'o') { grid[p.y][p.x] = ' '; left--; score += ch === 'o' ? 20 : 5; if (ch === 'o') power = 30; $(el, '.sc').textContent = score; }
        if (power > 0) power--;
        for (const g of gh) {
          if (g.x === p.x && g.y === p.y) { hit(g); if (over) break; continue; }
          const opts = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].filter(d => !wall(g.x + d.x, g.y + d.y) && !(d.x === -g.h.x && d.y === -g.h.y));
          if (opts.length) { opts.sort((a, b) => (Math.abs(g.x + a.x - p.x) + Math.abs(g.y + a.y - p.y)) - (Math.abs(g.x + b.x - p.x) + Math.abs(g.y + b.y - p.y))); g.h = GV.rnd(100) < (power > 0 ? 0 : 65) ? opts[0] : (power > 0 ? opts[opts.length - 1] : opts[GV.rnd(opts.length)]); } else g.h = { x: -g.h.x, y: -g.h.y };
          g.x += g.h.x; g.y += g.h.y; if (g.x === p.x && g.y === p.y) { hit(g); if (over) break; }
        }
        if (left <= 0 && !over) { over = true; score += 200; $(el, '.sc').textContent = score; $(el, '.msg').textContent = 'Ăn hết kẹo! 🎉 Điểm: ' + score; if (GV.setBest('candyman', score)) $(el, '.bs').textContent = score; }
        draw();
      }
      function draw() {
        c.fillStyle = '#0D0F14'; c.fillRect(0, 0, 420, 420); c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const ch = grid[y][x]; if (ch === '#') { c.fillStyle = '#3F3B8C'; c.fillRect(x * S + 2, y * S + 2, S - 4, S - 4); } else if (ch === '.') { c.fillStyle = '#FFE0B2'; c.beginPath(); c.arc(x * S + 14, y * S + 14, 3, 0, 7); c.fill(); } else if (ch === 'o') { c.font = '18px serif'; c.fillText('🍭', x * S + 14, y * S + 15); } }
        c.font = '22px serif'; c.fillText(power > 0 && power % 4 < 2 ? '😋' : '😀', p.x * S + 14, p.y * S + 15);
        gh.forEach(g => { c.globalAlpha = power > 0 ? .55 : 1; c.fillText(power > 0 ? '😱' : '👻', g.x * S + 14, g.y * S + 15); c.globalAlpha = 1; if (!power) { c.fillStyle = g.c; c.fillRect(g.x * S + 6, g.y * S + 24, 16, 3); } });
      }
      const dr = d => { nd = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[d] || nd; };
      const off = GV.keys(e => { const d = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[e.key]; if (d) dr(d); });
      GV.swipe(cv, dr); el.querySelector('.dpad').onclick = e => { const b = e.target.closest('[data-d]'); if (b) dr(b.dataset.d); };
      $(el, '.rs').onclick = reset; reset();
      return () => { clearInterval(tmr); off(); };
    }
  });

  /* ---------- TÔ MÀU THEO SỐ ---------- */
  const ART = [
    { n: 'Trái tim', pal: { 1: '#E53935', 2: '#FFCDD2' }, g: ['..11..11..', '.12211221.', '1222222221', '1222222221', '.12222221.', '..122221..', '...1221...', '....11....', '..........', '..........'] },
    { n: 'Ngôi sao', pal: { 1: '#F9A825', 2: '#FFF59D', 3: '#FB8C00' }, g: ['....11....', '....11....', '...1221...', '1111221111', '.12222221.', '..122221..', '..122221..', '.1221.1221', '.11....11.', '..........'] },
    { n: 'Ngôi nhà', pal: { 1: '#8D6E63', 2: '#EF5350', 3: '#FFE0B2', 4: '#64B5F6', 5: '#5D4037' }, g: ['....22....', '...2222...', '..222222..', '.22222222.', '2222222222', '.33333333.', '.34433553.', '.34433553.', '.33333553.', '.11111111.'] },
    { n: 'Bông hoa', pal: { 1: '#EC407A', 2: '#FFEB3B', 3: '#43A047', 4: '#F8BBD0' }, g: ['..44..44..', '.41144114.', '.41122114.', '..412214..', '.41144114.', '..44..44..', '.....3....', '..3..3....', '...3.3..3.', '....33.3..'] }
  ];
  GV.register({
    id: 'colornum', type: 'game', cat: 'Sáng tạo', name: 'Tô màu theo số', icon: '🎨', desc: 'Chọn màu theo số rồi chạm vào các ô cùng số để hoàn thành bức tranh pixel.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Tranh: <b class="nm"></b></span><span>Hoàn thành: <b class="pc">0</b>%</span><button class="btn ghost nx">Tranh khác</button><button class="btn rs">Làm lại</button></div><div class="bd cn" style="grid-template-columns:repeat(10,1fr);width:min(88vw,380px);gap:2px"></div><div class="row pal"></div><p class="msg"></p><p class="hint">Chọn một màu ở dưới, bấm vào ô có cùng số. Ô sai sẽ rung nhẹ.</p>`;
      let idx = GV.rnd(ART.length), sel = 1, filled, total;
      const board = $(el, '.cn'), pal = $(el, '.pal');
      function load() {
        const a = ART[idx]; filled = new Set(); total = a.g.join('').replace(/\./g, '').length; $(el, '.nm').textContent = a.n; $(el, '.pc').textContent = 0; $(el, '.msg').textContent = '';
        board.innerHTML = a.g.map((row, y) => [...row.padEnd(10, '.')].map((ch, x) => ch === '.' ? '<span></span>' : `<button class="cell" data-p="${y * 10 + x}" data-c="${ch}" style="font-size:12px;aspect-ratio:1;padding:0">${ch}</button>`).join('')).join('');
        pal.innerHTML = Object.entries(a.pal).map(([k, col]) => `<button class="btn ghost" data-k="${k}" style="min-width:52px;min-height:44px;border-left:14px solid ${col}">${k}</button>`).join(''); sel = +Object.keys(a.pal)[0]; mark();
      }
      const mark = () => $$(pal, 'button').forEach(b => b.style.outline = +b.dataset.k === sel ? '2px solid var(--md-primary)' : '');
      const $$ = (r, s) => [...r.querySelectorAll(s)];
      board.onclick = e => {
        const b = e.target.closest('[data-p]'); if (!b || b.dataset.done) return;
        if (+b.dataset.c === sel) { b.dataset.done = 1; b.style.background = ART[idx].pal[sel]; b.style.color = 'transparent'; filled.add(b.dataset.p); GV.beep(600, 30); const pc = Math.round(filled.size / total * 100); $(el, '.pc').textContent = pc; if (filled.size === total) { $(el, '.msg').textContent = 'Hoàn thành bức tranh ' + ART[idx].n + '! 🎉'; GV.beep(900, 200); } }
        else { b.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], 200); GV.beep(180, 60); }
      };
      pal.onclick = e => { const b = e.target.closest('[data-k]'); if (b) { sel = +b.dataset.k; mark(); } };
      $(el, '.nx').onclick = () => { idx = (idx + 1) % ART.length; load(); }; $(el, '.rs').onclick = load; load();
    }
  });

  /* ---------- NÔNG TRẠI ---------- */
  const CROPS = { lua: { n: 'Lúa', e: '🌾', cost: 5, gain: 12, sec: 10 }, ca: { n: 'Cà chua', e: '🍅', cost: 15, gain: 42, sec: 30 }, dua: { n: 'Dưa hấu', e: '🍉', cost: 40, gain: 130, sec: 90 }, bap: { n: 'Bắp ngô', e: '🌽', cost: 100, gain: 360, sec: 240 } };
  GV.register({
    id: 'farm', type: 'game', cat: 'Mô phỏng', name: 'Nông trại vui', icon: '🧑‍🌾', desc: 'Gieo hạt, chờ lớn, thu hoạch kiếm xu và mở rộng nông trại. Cây vẫn lớn khi bạn thoát web!',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Xu: <b class="co">20</b></span><span>Ô đất: <b class="np">4</b></span><button class="btn ghost buy"></button><button class="btn ghost rs">Chơi lại từ đầu</button></div><div class="row crops"></div><div class="bd fm" style="grid-template-columns:repeat(4,1fr);width:min(92vw,420px);gap:8px"></div><p class="msg"></p><p class="hint">Chọn hạt giống rồi chạm ô đất trống để gieo. Cây chín (✨) thì chạm để thu hoạch.</p>`;
      let S = GV.store.get('farm', null) || { coins: 20, plots: Array(4).fill(null) }, sel = 'lua', tmr;
      const save = () => GV.store.set('farm', S), board = $(el, '.fm');
      const need = () => 60 * (S.plots.length - 3);
      function draw() {
        const now = Date.now(); $(el, '.co').textContent = S.coins; $(el, '.np').textContent = S.plots.length;
        $(el, '.buy').textContent = S.plots.length >= 16 ? 'Đã tối đa' : `Mua ô đất (${need()} xu)`; $(el, '.buy').disabled = S.plots.length >= 16 || S.coins < need();
        $(el, '.crops').innerHTML = Object.entries(CROPS).map(([k, c]) => `<button class="btn ${sel === k ? '' : 'ghost'}" data-k="${k}" ${S.coins < c.cost && sel !== k ? 'style="opacity:.6"' : ''}>${c.e} ${c.n} · ${c.cost}🪙 → ${c.gain}🪙 · ${c.sec}s</button>`).join('');
        board.style.gridTemplateColumns = `repeat(${S.plots.length > 9 ? 4 : 3},1fr)`;
        board.innerHTML = S.plots.map((pl, i) => { if (!pl) return `<button class="cell" data-i="${i}" style="background:#5D4037;font-size:28px;aspect-ratio:1" aria-label="Ô đất trống">＋</button>`; const c = CROPS[pl.c], r = (now - pl.t) / 1000 / c.sec, ripe = r >= 1; return `<button class="cell" data-i="${i}" style="background:${ripe ? '#33691E' : '#4E342E'};font-size:34px;aspect-ratio:1;position:relative">${ripe ? c.e + '✨' : r > .5 ? '🌿' : '🌱'}<small style="position:absolute;bottom:3px;font-size:11px;color:#fff">${ripe ? 'Thu hoạch' : Math.ceil(c.sec * (1 - r)) + 's'}</small></button>`; }).join('');
      }
      board.onclick = e => {
        const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i, pl = S.plots[i];
        if (!pl) { const c = CROPS[sel]; if (S.coins < c.cost) { $(el, '.msg').textContent = 'Không đủ xu để mua hạt giống.'; GV.beep(180, 80); return; } S.coins -= c.cost; S.plots[i] = { c: sel, t: Date.now() }; $(el, '.msg').textContent = ''; GV.beep(500, 40); }
        else { const c = CROPS[pl.c]; if (Date.now() - pl.t >= c.sec * 1000) { S.coins += c.gain; S.plots[i] = null; GV.beep(800, 80); $(el, '.msg').textContent = `+${c.gain} xu từ ${c.n}!`; GV.setBest('farm', S.coins); } }
        save(); draw();
      };
      $(el, '.crops').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { sel = b.dataset.k; draw(); } };
      $(el, '.buy').onclick = () => { if (S.coins >= need() && S.plots.length < 16) { S.coins -= need(); S.plots.push(null); save(); draw(); } };
      $(el, '.rs').onclick = () => { if (confirm('Xoá nông trại hiện tại và chơi lại từ đầu?')) { S = { coins: 20, plots: Array(4).fill(null) }; save(); draw(); } };
      draw(); tmr = setInterval(draw, 1000);
      return () => clearInterval(tmr);
    }
  });

  /* ---------- LÀM BÁNH ---------- */
  const ING = { egg: '🥚', flour: '🌾', milk: '🥛', straw: '🍓', choco: '🍫', cherry: '🍒' };
  GV.register({
    id: 'bakery', type: 'game', cat: 'Mô phỏng', name: 'Tiệm bánh', icon: '🧁', desc: 'Khách gọi bánh với các nguyên liệu theo thứ tự – bấm đúng thứ tự trước khi khách hết kiên nhẫn!',
    mount(el) {
      el.innerHTML = hud('bakery', '<span>Mạng: <b class="lv">3</b></span>') + `<div class="res" style="min-width:min(88vw,360px);text-align:center"><div style="font-size:2.4rem" class="cust">🙂</div><div class="want" style="font-size:2rem;letter-spacing:.3rem"></div><div class="meter" style="height:8px;border-radius:9px;background:var(--md-sc-lowest);overflow:hidden;margin-top:8px"><i class="pat" style="display:block;height:100%;width:100%;background:var(--ok)"></i></div></div><div class="cake" style="font-size:2rem;min-height:2.6em;display:flex;flex-direction:column-reverse;align-items:center"></div><div class="row ing">${Object.entries(ING).map(([k, e]) => `<button class="btn ghost" data-k="${k}" style="font-size:1.8rem;min-width:60px;min-height:56px" aria-label="${k}">${e}</button>`).join('')}</div><p class="msg"></p><p class="hint">Làm theo đúng thứ tự từ trái sang phải. Bấm sai sẽ phải làm lại cái bánh đó.</p>`;
      let order, step_, score, lives, pat, maxp, tmr, over;
      function newCust() { const n = 3 + Math.min(3, Math.floor(score / 80)); order = Array.from({ length: n }, () => Object.keys(ING)[GV.rnd(6)]); step_ = 0; maxp = Math.max(7, 16 - Math.floor(score / 40)) ; pat = maxp; $(el, '.want').textContent = order.map(k => ING[k]).join(' '); $(el, '.cake').innerHTML = ''; $(el, '.cust').textContent = ['🙂', '😋', '🧑‍🍳', '👵', '🧒'][GV.rnd(5)]; }
      function reset() { clearInterval(tmr); score = 0; lives = 3; over = false; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; $(el, '.msg').textContent = ''; newCust(); tmr = setInterval(tick, 200); }
      function lose() { lives--; $(el, '.lv').textContent = lives; GV.beep(150, 250); if (lives <= 0) { over = true; clearInterval(tmr); $(el, '.msg').textContent = 'Hết kiên nhẫn rồi! Điểm: ' + score; if (GV.setBest('bakery', score)) $(el, '.bs').textContent = score; } else newCust(); }
      function tick() { if (over) return; pat -= .2; const p = $(el, '.pat'); p.style.width = Math.max(0, pat / maxp * 100) + '%'; p.style.background = pat / maxp < .3 ? 'var(--bad)' : 'var(--ok)'; if (pat <= 0) { $(el, '.msg').textContent = 'Khách bỏ đi 😢'; lose(); } }
      $(el, '.ing').onclick = e => {
        const b = e.target.closest('[data-k]'); if (!b || over) return; const k = b.dataset.k;
        if (k === order[step_]) { step_++; $(el, '.cake').insertAdjacentHTML('beforeend', `<span style="line-height:.9">${ING[k]}</span>`); GV.beep(500 + step_ * 80, 40); if (step_ === order.length) { score += 10 + order.length * 5 + Math.round(pat * 2); $(el, '.sc').textContent = score; $(el, '.msg').textContent = 'Bánh xong! 🎉'; GV.beep(900, 120); newCust(); } }
        else { $(el, '.msg').textContent = 'Sai nguyên liệu! Làm lại cái bánh.'; step_ = 0; pat -= 1.5; $(el, '.cake').innerHTML = ''; GV.beep(160, 150); }
      };
      $(el, '.rs').onclick = reset; reset();
      return () => clearInterval(tmr);
    }
  });
})();
