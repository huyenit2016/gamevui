// Game trí tuệ: 2048, Lật hình, Dò mìn, Sudoku
(function () {
  /* ---------- 2048 ---------- */
  GV.register({
    id: '2048', type: 'game', cat: 'Trí tuệ', name: '2048', icon: '🔢', desc: 'Gộp các ô số bằng nhau để đạt 2048.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('2048')}</b></span><button class="btn rs">Ván mới</button></div>
      <div class="bd" style="grid-template-columns:repeat(4,1fr);width:min(100%,380px);background:#0a0d1c;padding:6px;border-radius:12px"></div><p class="msg"></p><p class="hint">Mũi tên / WASD hoặc vuốt.</p>`;
      const bd = el.querySelector('.bd'), sc = el.querySelector('.sc'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg');
      const COL = { 0: '#232a4d', 2: '#3b4a8c', 4: '#4a5fc4', 8: '#e08a2e', 16: '#e5701f', 32: '#e5522f', 64: '#e53a2f', 128: '#d4b73a', 256: '#d4b12a', 512: '#d4aa1a', 1024: '#d4a30a', 2048: '#3ddc97' };
      let g, score, won;
      function add() { const e = []; g.forEach((r, y) => r.forEach((v, x) => !v && e.push([y, x]))); if (e.length) { const [y, x] = e[GV.rnd(e.length)]; g[y][x] = Math.random() < .9 ? 2 : 4; } }
      function reset() { g = Array.from({ length: 4 }, () => Array(4).fill(0)); score = 0; won = false; add(); add(); msg.textContent = ''; draw(); }
      function draw() {
        bd.innerHTML = g.flat().map(v => `<div class="cell dis" style="background:${COL[v] || '#3ddc97'};font-size:${v > 999 ? 20 : 28}px">${v || ''}</div>`).join('');
        sc.textContent = score; if (GV.setBest('2048', score)) bs.textContent = score;
      }
      function slide(row) {
        const a = row.filter(v => v); for (let i = 0; i < a.length - 1; i++) if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a.splice(i + 1, 1); }
        while (a.length < 4) a.push(0); return a;
      }
      function move(d) {
        const before = JSON.stringify(g);
        const rows = d === 'left' || d === 'right';
        for (let i = 0; i < 4; i++) {
          let line = rows ? g[i].slice() : g.map(r => r[i]);
          const rev = d === 'right' || d === 'down';
          if (rev) line.reverse();
          line = slide(line);
          if (rev) line.reverse();
          rows ? g[i] = line : line.forEach((v, y) => g[y][i] = v);
        }
        if (JSON.stringify(g) === before) return;
        add(); draw();
        if (!won && g.flat().includes(2048)) { won = true; msg.textContent = '🎉 Bạn đã đạt 2048! Tiếp tục nào.'; }
        else if (!canMove()) msg.textContent = 'Hết nước đi!';
      }
      function canMove() {
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!g[y][x] || (x < 3 && g[y][x] === g[y][x + 1]) || (y < 3 && g[y][x] === g[y + 1][x])) return true;
        return false;
      }
      const off = GV.keys(e => { const d = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' }[e.key]; if (d) move(d); });
      GV.swipe(bd, move);
      el.querySelector('.rs').onclick = reset;
      reset();
      return off;
    }
  });

  /* ---------- MEMORY ---------- */
  GV.register({
    id: 'memory', type: 'game', cat: 'Trí tuệ', name: 'Lật hình', icon: '🃏', desc: 'Tìm các cặp hình giống nhau.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Lượt: <b class="mv">0</b></span><span>Kỷ lục (ít lượt): <b class="bs">${GV.best('memory') || '-'}</b></span><button class="btn rs">Ván mới</button></div>
      <div class="bd" style="grid-template-columns:repeat(4,1fr);width:min(100%,380px)"></div><p class="msg"></p>`;
      const bd = el.querySelector('.bd'), mv = el.querySelector('.mv'), bs = el.querySelector('.bs'), msg = el.querySelector('.msg');
      const E = ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐙'];
      let cards, open, moves, lock, done, tm;
      function reset() {
        cards = GV.shuffle([...E, ...E].map((e, i) => ({ e, up: false, ok: false }))); open = []; moves = 0; lock = false; done = 0; mv.textContent = 0; msg.textContent = ''; draw();
      }
      function draw() {
        bd.innerHTML = cards.map((c, i) => `<div class="cell" data-i="${i}" style="${c.up || c.ok ? 'background:#3b4a8c' : ''}">${c.up || c.ok ? c.e : '❔'}</div>`).join('');
      }
      bd.onclick = e => {
        const i = e.target.dataset.i; if (i === undefined || lock) return;
        const c = cards[i]; if (c.up || c.ok) return;
        c.up = true; open.push(c); draw();
        if (open.length === 2) {
          moves++; mv.textContent = moves; lock = true;
          if (open[0].e === open[1].e) { open.forEach(x => x.ok = true); done++; open = []; lock = false; draw(); GV.beep(700, 60); if (done === 8) { msg.textContent = `🎉 Hoàn thành sau ${moves} lượt!`; if (GV.setBest('memory', moves, true)) bs.textContent = moves; } }
          else tm = setTimeout(() => { open.forEach(x => x.up = false); open = []; lock = false; draw(); }, 700);
        }
      };
      el.querySelector('.rs').onclick = reset;
      reset();
      return () => clearTimeout(tm);
    }
  });

  /* ---------- MINESWEEPER ---------- */
  GV.register({
    id: 'minesweeper', type: 'game', cat: 'Trí tuệ', name: 'Dò mìn', icon: '💣', desc: 'Mở ô an toàn, tránh mìn.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Mìn còn: <b class="mn">0</b></span><span>Thời gian: <b class="tm">0</b>s</span>
      <select class="lvl"><option value="9,9,10">Dễ 9×9</option><option value="12,12,25">Vừa 12×12</option><option value="16,16,40">Khó 16×16</option></select>
      <button class="btn ghost fl">⛏ Đào</button><button class="btn rs">Mới</button></div>
      <div class="bd" style="width:min(100%,480px)"></div><p class="msg"></p><p class="hint">Nhấn chuột phải (hoặc nút ⛏/🚩) để cắm cờ.</p>`;
      const bd = el.querySelector('.bd'), mn = el.querySelector('.mn'), tmE = el.querySelector('.tm'), msg = el.querySelector('.msg'), lvl = el.querySelector('.lvl'), fl = el.querySelector('.fl');
      let W, H, M, g, over, started, flagMode = false, timer, secs, opened;
      const COL = ['', '#6c8cff', '#3ddc97', '#ff5c6c', '#b388ff', '#ff9f43', '#4dd0e1', '#fff', '#999'];
      function reset() {
        [W, H, M] = lvl.value.split(',').map(Number); clearInterval(timer); secs = 0; tmE.textContent = 0; over = false; started = false; opened = 0; msg.textContent = '';
        g = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ m: false, o: false, f: false, n: 0 })));
        bd.style.gridTemplateColumns = `repeat(${W},1fr)`; bd.style.gap = '2px'; draw();
      }
      const nb = (x, y) => { const r = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && g[y + j] && g[y + j][x + i]) r.push([x + i, y + j]); return r; };
      function plant(sx, sy) {
        let n = 0; while (n < M) { const x = GV.rnd(W), y = GV.rnd(H); if (!g[y][x].m && !(Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1)) { g[y][x].m = true; n++; } }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y][x].n = nb(x, y).filter(([a, b]) => g[b][a].m).length;
        timer = setInterval(() => tmE.textContent = ++secs, 1000);
      }
      function openCell(x, y) {
        const c = g[y][x]; if (c.o || c.f) return; c.o = true; opened++;
        if (!c.m && !c.n) nb(x, y).forEach(([a, b]) => openCell(a, b));
      }
      function draw() {
        mn.textContent = M - g.flat().filter(c => c.f).length;
        bd.innerHTML = g.map((r, y) => r.map((c, x) => {
          let s = '', st = '';
          if (c.o) { st = 'background:#12162e;cursor:default'; s = c.m ? '💥' : c.n ? `<span style="color:${COL[c.n]}">${c.n}</span>` : ''; }
          else if (c.f) s = '🚩'; else if (over && c.m) s = '💣';
          return `<div class="cell" data-x="${x}" data-y="${y}" style="${st};font-size:clamp(11px,3vw,18px);border-radius:4px">${s}</div>`;
        }).join('')).join('');
      }
      function end(win) {
        over = true; clearInterval(timer); draw();
        msg.textContent = win ? `🎉 Thắng! ${secs}s` : '💥 Bùm! Bạn thua.';
        if (win && lvl.value === '9,9,10') GV.setBest('minesweeper', secs, true);
      }
      function click(x, y, flag) {
        if (over) return; const c = g[y][x];
        if (flag) { if (!c.o) { c.f = !c.f; draw(); } return; }
        if (c.f || c.o) return;
        if (!started) { started = true; plant(x, y); }
        if (c.m) { c.o = true; g.flat().forEach(q => { if (q.m) q.o = true; }); return end(false); }
        openCell(x, y); draw();
        if (opened === W * H - M) end(true);
      }
      bd.onclick = e => { const t = e.target.closest('[data-x]'); if (t) click(+t.dataset.x, +t.dataset.y, flagMode); };
      bd.oncontextmenu = e => { const t = e.target.closest('[data-x]'); if (t) { e.preventDefault(); click(+t.dataset.x, +t.dataset.y, true); } };
      fl.onclick = () => { flagMode = !flagMode; fl.textContent = flagMode ? '🚩 Cắm cờ' : '⛏ Đào'; };
      lvl.onchange = reset; el.querySelector('.rs').onclick = reset;
      reset();
      return () => clearInterval(timer);
    }
  });

  /* ---------- SUDOKU ---------- */
  GV.register({
    id: 'sudoku', type: 'game', cat: 'Trí tuệ', name: 'Sudoku', icon: '🧩', desc: 'Điền số 1-9 vào lưới 9×9.',
    mount(el) {
      el.innerHTML = `<div class="hud"><select class="df"><option value="36">Dễ</option><option value="46" selected>Vừa</option><option value="54">Khó</option></select><button class="btn rs">Ván mới</button><button class="btn ghost ck">Kiểm tra</button></div>
      <div class="bd sd" style="grid-template-columns:repeat(9,1fr);width:min(100%,450px);gap:0;border:2px solid #6c8cff"></div>
      <div class="row pad"></div><p class="msg"></p>`;
      const bd = el.querySelector('.bd'), msg = el.querySelector('.msg'), pad = el.querySelector('.pad');
      let sol, puz, cur, sel = -1, bad = new Set();
      function gen() {
        const g = Array(81).fill(0);
        const ok = (i, v) => { const r = (i / 9) | 0, c = i % 9; for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false; const br = r - r % 3, bc = c - c % 3; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (g[(br + a) * 9 + bc + b] === v) return false; return true; };
        (function fill(i) {
          if (i === 81) return true;
          for (const v of GV.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (ok(i, v)) { g[i] = v; if (fill(i + 1)) return true; g[i] = 0; }
          return false;
        })(0);
        return g;
      }
      function reset() {
        sol = gen(); puz = sol.slice(); GV.shuffle([...Array(81).keys()]).slice(0, +el.querySelector('.df').value).forEach(i => puz[i] = 0);
        cur = puz.slice(); sel = -1; bad = new Set(); msg.textContent = ''; draw();
      }
      function draw() {
        const sv = sel >= 0 ? cur[sel] : 0;
        bd.innerHTML = cur.map((v, i) => {
          const r = (i / 9) | 0, c = i % 9, given = puz[i];
          const bg = i === sel ? '#4a5fc4' : (sv && v === sv) ? '#34407a' : bad.has(i) ? '#7a2f3a' : '#1a1f3a';
          return `<div class="cell" data-i="${i}" style="border-radius:0;background:${bg};border:1px solid #ffffff14;${c % 3 === 2 && c < 8 ? 'border-right:2px solid #6c8cff;' : ''}${r % 3 === 2 && r < 8 ? 'border-bottom:2px solid #6c8cff;' : ''}color:${given ? '#eef0ff' : '#6cc6ff'};font-size:clamp(14px,4.5vw,24px)">${v || ''}</div>`;
        }).join('');
      }
      function put(v) {
        if (sel < 0 || puz[sel]) return; cur[sel] = v; bad.delete(sel); draw();
        if (cur.every((x, i) => x === sol[i])) msg.textContent = '🎉 Chúc mừng! Bạn đã giải xong.';
      }
      pad.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫'].map(n => `<button class="btn ghost" data-n="${n}" style="min-width:40px">${n}</button>`).join('');
      pad.onclick = e => { const n = e.target.dataset.n; if (n) put(n === '⌫' ? 0 : +n); };
      bd.onclick = e => { const i = e.target.dataset.i; if (i !== undefined) { sel = +i; draw(); } };
      el.querySelector('.ck').onclick = () => {
        bad = new Set(); cur.forEach((v, i) => { if (v && v !== sol[i]) bad.add(i); });
        msg.textContent = bad.size ? `Có ${bad.size} ô sai (tô đỏ).` : 'Chưa thấy lỗi nào, tiếp tục nhé!'; draw();
      };
      const off = GV.keys(e => {
        if (e.key >= '1' && e.key <= '9') put(+e.key); else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') put(0);
        else if (sel >= 0) { const m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key]; if (m && sel + m >= 0 && sel + m < 81) { sel += m; draw(); } }
      }, true);
      el.querySelector('.rs').onclick = reset; el.querySelector('.df').onchange = reset;
      reset();
      return off;
    }
  });
})();
