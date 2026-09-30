// Game bàn cờ & phản xạ: Tic-tac-toe, Cờ caro, Kéo búa bao, Đoán số, Simon, Đập chuột, Thử phản xạ
(function () {
  /* ---------- TIC TAC TOE (minimax) ---------- */
  GV.register({
    id: 'tictactoe', type: 'game', cat: 'Bàn cờ', name: 'Cờ ca-rô 3×3', icon: '❌', desc: 'Đấu với máy (không thể thắng dễ đâu!).',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Thắng: <b class="w">0</b></span><span>Hòa: <b class="d">0</b></span><span>Thua: <b class="l">0</b></span><button class="btn rs">Ván mới</button></div>
      <div class="bd" style="grid-template-columns:repeat(3,1fr);width:min(100%,300px)"></div><p class="msg"></p><label><input type="checkbox" class="easy"> Chế độ dễ (máy đi ngẫu nhiên)</label>`;
      const bd = el.querySelector('.bd'), msg = el.querySelector('.msg'), easy = el.querySelector('.easy');
      const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      const st = GV.store.get('ttt', { w: 0, d: 0, l: 0 });
      let b, over;
      const win = b => { for (const [x, y, z] of L) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x]; return b.includes('') ? null : 'D'; };
      function mm(b, p) {
        const w = win(b); if (w) return w === 'O' ? 1 : w === 'X' ? -1 : 0;
        let best = p === 'O' ? -2 : 2;
        for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = p; const s = mm(b, p === 'O' ? 'X' : 'O'); b[i] = ''; best = p === 'O' ? Math.max(best, s) : Math.min(best, s); }
        return best;
      }
      function ai() {
        const free = [...b.keys()].filter(i => !b[i]);
        if (easy.checked) return free[GV.rnd(free.length)];
        let bs = -2, mv = [];
        free.forEach(i => { b[i] = 'O'; const s = mm(b, 'X'); b[i] = ''; if (s > bs) { bs = s; mv = [i]; } else if (s === bs) mv.push(i); });
        return mv[GV.rnd(mv.length)];
      }
      function draw() {
        bd.innerHTML = b.map((v, i) => `<div class="cell ${v || over ? 'dis' : ''}" data-i="${i}" style="font-size:2.6rem;color:${v === 'X' ? '#6c8cff' : '#ff6cab'}">${v}</div>`).join('');
        el.querySelector('.w').textContent = st.w; el.querySelector('.d').textContent = st.d; el.querySelector('.l').textContent = st.l;
      }
      function check() {
        const w = win(b); if (!w) return false;
        over = true; if (w === 'X') { st.w++; msg.textContent = '🎉 Bạn thắng!'; } else if (w === 'O') { st.l++; msg.textContent = '🤖 Máy thắng!'; } else { st.d++; msg.textContent = 'Hòa!'; }
        GV.store.set('ttt', st); return true;
      }
      bd.onclick = e => {
        const i = e.target.dataset.i; if (i === undefined || over || b[i]) return;
        b[i] = 'X'; if (!check()) { b[ai()] = 'O'; check(); } draw();
      };
      function reset() { b = Array(9).fill(''); over = false; msg.textContent = ''; draw(); }
      el.querySelector('.rs').onclick = reset; reset();
    }
  });

  /* ---------- CARO 5 ---------- */
  GV.register({
    id: 'caro', type: 'game', cat: 'Bàn cờ', name: 'Cờ caro 5 ô', icon: '⭕', desc: 'Xếp 5 quân liên tiếp trên bàn 15×15 chống lại máy.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span class="msg" style="min-height:0">Bạn đi X trước</span><button class="btn rs">Ván mới</button></div><canvas class="cv" width="450" height="450"></canvas><p class="hint">Chạm vào giao điểm để đặt quân.</p>`;
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), msg = el.querySelector('.msg'), N = 15, S = 30;
      let b, over, last;
      const D = [[1, 0], [0, 1], [1, 1], [1, -1]];
      const at = (x, y) => x < 0 || y < 0 || x >= N || y >= N ? -1 : b[y][x];
      function line(x, y, p) { // returns best run length for p at (x,y) if placed
        let best = 0, open = 0;
        for (const [dx, dy] of D) {
          let n = 1, o = 0;
          for (const s of [1, -1]) { let k = 1; while (at(x + dx * k * s, y + dy * k * s) === p) { n++; k++; } if (at(x + dx * k * s, y + dy * k * s) === 0) o++; }
          if (n > best || (n === best && o > open)) { best = n; open = o; }
        }
        return [best, open];
      }
      const val = ([n, o]) => n >= 5 ? 1e6 : n === 4 ? (o === 2 ? 1e5 : o === 1 ? 5e3 : 0) : n === 3 ? (o === 2 ? 3e3 : o === 1 ? 100 : 0) : n === 2 ? (o === 2 ? 60 : 10) : 1;
      function ai() {
        let bs = -1, mv = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!b[y][x]) {
          let near = false; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (at(x + i, y + j) > 0) near = true;
          if (!near) continue;
          const s = val(line(x, y, 2)) * 1.1 + val(line(x, y, 1)) + Math.random();
          if (s > bs) { bs = s; mv = [[x, y]]; }
        }
        return mv[0] || [7, 7];
      }
      const won = (x, y, p) => line(x, y, p)[0] >= 5;
      function draw() {
        c.fillStyle = '#e9c98c'; c.fillRect(0, 0, 450, 450); c.strokeStyle = '#7a5b2c'; c.lineWidth = 1;
        for (let i = 0; i < N; i++) { c.beginPath(); c.moveTo(15, 15 + i * S); c.lineTo(435, 15 + i * S); c.moveTo(15 + i * S, 15); c.lineTo(15 + i * S, 435); c.stroke(); }
        c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (b[y][x]) {
          c.fillStyle = b[y][x] === 1 ? '#1d3fbf' : '#c2185b'; c.fillText(b[y][x] === 1 ? 'X' : 'O', 15 + x * S, 16 + y * S);
        }
        if (last) { c.strokeStyle = '#0a0'; c.lineWidth = 2; c.strokeRect(last[0] * S + 3, last[1] * S + 3, 24, 24); }
      }
      function reset() { b = Array.from({ length: N }, () => Array(N).fill(0)); over = false; last = null; msg.textContent = 'Bạn đi X trước'; draw(); }
      function click(e) {
        if (over) return;
        const r = cv.getBoundingClientRect(), t = e.changedTouches ? e.changedTouches[0] : e;
        const x = Math.round(((t.clientX - r.left) * 450 / r.width - 15) / S), y = Math.round(((t.clientY - r.top) * 450 / r.height - 15) / S);
        if (at(x, y) !== 0) return;
        b[y][x] = 1; last = [x, y];
        if (won(x, y, 1)) { over = true; msg.textContent = '🎉 Bạn thắng!'; return draw(); }
        const [ax, ay] = ai(); b[ay][ax] = 2; last = [ax, ay];
        if (won(ax, ay, 2)) { over = true; msg.textContent = '🤖 Máy thắng!'; }
        draw();
      }
      cv.addEventListener('click', click);
      el.querySelector('.rs').onclick = reset; reset();
    }
  });

  /* ---------- RPS ---------- */
  GV.register({
    id: 'rps', type: 'game', cat: 'Bàn cờ', name: 'Kéo búa bao', icon: '✊', desc: 'Oẳn tù tì với máy.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Thắng: <b class="w">0</b></span><span>Hòa: <b class="d">0</b></span><span>Thua: <b class="l">0</b></span></div>
      <div class="big res" style="font-size:3.5rem;min-width:260px">❔ vs ❔</div><p class="msg"></p>
      <div class="row">${['✌️ Kéo', '✊ Búa', '🖐 Bao'].map((t, i) => `<button class="btn" data-i="${i}" style="font-size:20px">${t}</button>`).join('')}</div>`;
      const E = ['✌️', '✊', '🖐'], st = { w: 0, d: 0, l: 0 };
      el.onclick = e => {
        const i = e.target.dataset.i; if (i === undefined) return;
        const a = +i, b = GV.rnd(3); // 0=kéo 1=búa 2=bao
        const winA = (a === 1 && b === 0) || (a === 2 && b === 1) || (a === 0 && b === 2);
        const k = a === b ? 'd' : winA ? 'w' : 'l'; st[k]++;
        el.querySelector('.res').textContent = E[a] + ' vs ' + E[b];
        el.querySelector('.msg').textContent = { d: 'Hòa!', w: '🎉 Bạn thắng!', l: '🤖 Máy thắng!' }[k];
        for (const x in st) el.querySelector('.' + x).textContent = st[x];
      };
    }
  });

  /* ---------- GUESS ---------- */
  GV.register({
    id: 'guess', type: 'game', cat: 'Trí tuệ', name: 'Đoán số', icon: '🎯', desc: 'Đoán số bí mật từ 1 đến 100.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Số lần đoán: <b class="n">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('guess') || '-'}</b></span></div>
      <p class="msg">Tôi đang nghĩ một số từ 1 đến 100…</p><div class="row"><input type="number" min="1" max="100" class="in" placeholder="Nhập số"><button class="btn go">Đoán</button><button class="btn ghost rs">Số mới</button></div><p class="hint hist"></p>`;
      let sec, n, hist;
      const $ = s => el.querySelector(s);
      function reset() { sec = 1 + GV.rnd(100); n = 0; hist = []; $('.n').textContent = 0; $('.msg').textContent = 'Tôi đang nghĩ một số từ 1 đến 100…'; $('.hist').textContent = ''; $('.in').value = ''; $('.in').disabled = $('.go').disabled = false; }
      function go() {
        const v = parseInt($('.in').value); if (!(v >= 1 && v <= 100)) { $('.msg').textContent = 'Nhập số từ 1 đến 100'; return; }
        n++; $('.n').textContent = n; hist.push(v); $('.hist').textContent = 'Đã đoán: ' + hist.join(', ');
        if (v === sec) { $('.msg').textContent = `🎉 Chính xác! Bạn đoán ${n} lần.`; $('.in').disabled = $('.go').disabled = true; if (GV.setBest('guess', n, true)) $('.bs').textContent = n; }
        else $('.msg').textContent = v < sec ? '⬆ Lớn hơn!' : '⬇ Nhỏ hơn!';
        $('.in').value = ''; $('.in').focus();
      }
      $('.go').onclick = go; $('.in').onkeydown = e => e.key === 'Enter' && go(); $('.rs').onclick = reset; reset();
    }
  });

  /* ---------- SIMON ---------- */
  GV.register({
    id: 'simon', type: 'game', cat: 'Phản xạ', name: 'Simon nhớ màu', icon: '🎨', desc: 'Nhớ và lặp lại chuỗi màu.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Vòng: <b class="lv">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('simon')}</b></span><button class="btn rs">Bắt đầu</button></div>
      <div class="bd" style="grid-template-columns:1fr 1fr;width:min(100%,300px);gap:8px"></div><p class="msg"></p>`;
      const C = ['#e5484d', '#3ddc97', '#ffd166', '#6c8cff'], F = [261, 330, 392, 523], bd = el.querySelector('.bd'), msg = el.querySelector('.msg');
      let seq = [], pos = 0, busy = true, timers = [];
      bd.innerHTML = C.map((c, i) => `<div class="cell" data-i="${i}" style="background:${c};opacity:.45;aspect-ratio:1.3"></div>`).join('');
      const pads = [...bd.children];
      const flash = (i, ms = 350) => { pads[i].style.opacity = 1; GV.beep(F[i], ms - 50); timers.push(setTimeout(() => pads[i].style.opacity = .45, ms)); };
      function play() {
        busy = true; msg.textContent = 'Xem kỹ…'; pos = 0;
        seq.forEach((s, k) => timers.push(setTimeout(() => flash(s), 600 + k * 650)));
        timers.push(setTimeout(() => { busy = false; msg.textContent = 'Đến lượt bạn!'; }, 600 + seq.length * 650));
      }
      function next() { seq.push(GV.rnd(4)); el.querySelector('.lv').textContent = seq.length; play(); }
      bd.onclick = e => {
        const i = e.target.dataset.i; if (i === undefined || busy) return;
        flash(+i, 200);
        if (+i !== seq[pos]) { msg.textContent = `Sai rồi! Bạn đạt vòng ${seq.length - 1}.`; if (GV.setBest('simon', seq.length - 1)) el.querySelector('.bs').textContent = seq.length - 1; busy = true; seq = []; return; }
        if (++pos === seq.length) { busy = true; timers.push(setTimeout(next, 700)); }
      };
      el.querySelector('.rs').onclick = () => { timers.forEach(clearTimeout); seq = []; next(); };
      return () => timers.forEach(clearTimeout);
    }
  });

  /* ---------- WHACK ---------- */
  GV.register({
    id: 'whack', type: 'game', cat: 'Phản xạ', name: 'Đập chuột chũi', icon: '🐹', desc: 'Đập càng nhiều chuột trong 30 giây.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Còn: <b class="t">30</b>s</span><span>Kỷ lục: <b class="bs">${GV.best('whack')}</b></span><button class="btn rs">Bắt đầu</button></div>
      <div class="bd" style="grid-template-columns:repeat(3,1fr);width:min(100%,330px);gap:10px"></div><p class="msg"></p>`;
      const bd = el.querySelector('.bd'), msg = el.querySelector('.msg');
      bd.innerHTML = Array.from({ length: 9 }, (_, i) => `<div class="cell" data-i="${i}" style="font-size:2.6rem;background:#3a2a1a;border-radius:50%"></div>`).join('');
      const holes = [...bd.children]; let score, left, tick, pop, cur = -1;
      function show() { holes.forEach(h => h.textContent = ''); const i = GV.rnd(9); cur = i; holes[i].textContent = '🐹'; }
      function stop() { clearInterval(tick); clearInterval(pop); holes.forEach(h => h.textContent = ''); cur = -1; }
      el.querySelector('.rs').onclick = () => {
        stop(); score = 0; left = 30; el.querySelector('.sc').textContent = 0; el.querySelector('.t').textContent = 30; msg.textContent = '';
        show(); pop = setInterval(show, 750);
        tick = setInterval(() => {
          el.querySelector('.t').textContent = --left;
          if (left <= 0) { stop(); msg.textContent = `Hết giờ! Bạn đập ${score} con.`; if (GV.setBest('whack', score)) el.querySelector('.bs').textContent = score; }
        }, 1000);
      };
      bd.onclick = e => {
        const i = e.target.dataset.i; if (+i === cur) { score++; el.querySelector('.sc').textContent = score; holes[cur].textContent = '💥'; cur = -1; GV.beep(600, 50); }
      };
      return stop;
    }
  });

  /* ---------- REACTION ---------- */
  GV.register({
    id: 'reaction', type: 'game', cat: 'Phản xạ', name: 'Thử phản xạ', icon: '⚡', desc: 'Bạn bấm nhanh cỡ nào khi màn hình đổi màu xanh?',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Kỷ lục: <b class="bs">${GV.best('reaction') ? GV.best('reaction') + ' ms' : '-'}</b></span></div>
      <div class="pad" style="width:min(100%,480px);height:260px;border-radius:14px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:1.4rem;font-weight:700;cursor:pointer;user-select:none;background:#3b4a8c">Bấm để bắt đầu</div>`;
      const pad = el.querySelector('.pad'); let state = 'idle', t0, tm;
      pad.onclick = () => {
        if (state === 'idle') { state = 'wait'; pad.style.background = '#e5484d'; pad.textContent = 'Chờ màu xanh…'; tm = setTimeout(() => { state = 'go'; pad.style.background = '#3ddc97'; pad.textContent = 'BẤM!'; t0 = performance.now(); }, 1500 + GV.rnd(3000)); }
        else if (state === 'wait') { clearTimeout(tm); state = 'idle'; pad.style.background = '#3b4a8c'; pad.textContent = 'Quá sớm! Bấm để thử lại'; }
        else if (state === 'go') { const ms = Math.round(performance.now() - t0); state = 'idle'; pad.style.background = '#3b4a8c'; pad.textContent = `${ms} ms – bấm để thử lại`; if (GV.setBest('reaction', ms, true)) el.querySelector('.bs').textContent = ms + ' ms'; }
      };
      return () => clearTimeout(tm);
    }
  });
})();
