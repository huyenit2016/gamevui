// Game bổ sung: Xếp số 15, Connect 4, Gõ phím nhanh, Khủng long chạy, Đoán chữ
(function () {
  /* ---------- 15 PUZZLE ---------- */
  GV.register({
    id: 'puzzle15', type: 'game', cat: 'Trí tuệ', name: 'Xếp số 15', icon: '🔟', desc: 'Trượt các ô để xếp số từ 1 đến 15.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Lượt: <b class="mv">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('puzzle15') || '-'}</b></span><button class="btn rs">Trộn lại</button></div>
      <div class="bd" style="grid-template-columns:repeat(4,1fr);width:min(100%,340px)"></div><p class="msg"></p>`;
      const bd = el.querySelector('.bd'), msg = el.querySelector('.msg');
      let t, moves, done;
      const solvable = a => { let inv = 0; const f = a.filter(x => x); for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (f[i] > f[j]) inv++; return (inv + Math.floor(a.indexOf(0) / 4)) % 2 === 1; };
      function reset() {
        do { t = GV.shuffle([...Array(16).keys()]); } while (!solvable(t) || t.every((v, i) => v === (i + 1) % 16));
        moves = 0; done = false; msg.textContent = ''; el.querySelector('.mv').textContent = 0; draw();
      }
      function draw() { bd.innerHTML = t.map((v, i) => `<div class="cell ${v ? '' : 'dis'}" data-i="${i}" style="${v ? '' : 'visibility:hidden'};font-size:1.6rem;background:#3b4a8c">${v || ''}</div>`).join(''); }
      bd.onclick = e => {
        const i = e.target.dataset.i; if (i === undefined || done) return;
        const z = t.indexOf(0), r = i / 4 | 0, c = i % 4, zr = z / 4 | 0, zc = z % 4;
        if (r !== zr && c !== zc) return;
        const step = r === zr ? (c < zc ? -1 : 1) : (r < zr ? -4 : 4); // hướng từ ô trống tới ô bấm
        let p = z; const dir = (+i - z) > 0 ? Math.abs(step) : -Math.abs(step);
        while (p !== +i) { t[p] = t[p + dir]; p += dir; } t[+i] = 0;
        moves++; el.querySelector('.mv').textContent = moves; draw();
        if (t.every((v, k) => v === (k + 1) % 16)) { done = true; msg.textContent = `🎉 Xong sau ${moves} lượt!`; if (GV.setBest('puzzle15', moves, true)) el.querySelector('.bs').textContent = moves; }
      };
      el.querySelector('.rs').onclick = reset; reset();
    }
  });

  /* ---------- CONNECT 4 ---------- */
  GV.register({
    id: 'connect4', type: 'game', cat: 'Bàn cờ', name: 'Connect 4', icon: '🔴', desc: 'Xếp 4 quân liên tiếp trước máy.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Thắng: <b class="w">0</b></span><span>Thua: <b class="l">0</b></span><button class="btn rs">Ván mới</button></div>
      <div class="bd" style="grid-template-columns:repeat(7,1fr);width:min(100%,420px);background:#2643b3;padding:8px;border-radius:12px;gap:6px"></div><p class="msg"></p>`;
      const bd = el.querySelector('.bd'), msg = el.querySelector('.msg'), R = 6, C = 7, st = GV.store.get('c4', { w: 0, l: 0 });
      let g, over, busy, tm;
      const fresh = () => Array.from({ length: R }, () => Array(C).fill(0));
      const drop = (b, c, p) => { for (let r = R - 1; r >= 0; r--) if (!b[r][c]) { b[r][c] = p; return r; } return -1; };
      function four(b, p) {
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          let k = 0; for (; k < 4; k++) { const y = r + dr * k, x = c + dc * k; if (y < 0 || y >= R || x < 0 || x >= C || b[y][x] !== p) break; } if (k === 4) return true;
        } return false;
      }
      function score(b) {
        let s = 0; for (let r = 0; r < R; r++) b[r][3] === 2 && (s += 3), b[r][3] === 1 && (s -= 3);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          let a = 0, h = 0, ok = true;
          for (let k = 0; k < 4; k++) { const y = r + dr * k, x = c + dc * k; if (y < 0 || y >= R || x < 0 || x >= C) { ok = false; break; } b[y][x] === 2 ? a++ : b[y][x] === 1 && h++; }
          if (ok && !(a && h)) s += a === 3 ? 5 : a === 2 ? 2 : 0, s -= h === 3 ? 6 : h === 2 ? 2 : 0;
        } return s;
      }
      function mm(b, d, al, be, p) {
        if (four(b, 2)) return 1e5 + d; if (four(b, 1)) return -1e5 - d;
        const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => !b[0][c]); if (!cols.length) return 0; if (!d) return score(b);
        let best = p === 2 ? -Infinity : Infinity;
        for (const c of cols) {
          const r = drop(b, c, p), v = mm(b, d - 1, al, be, p === 2 ? 1 : 2); b[r][c] = 0;
          if (p === 2) { best = Math.max(best, v); al = Math.max(al, v); } else { best = Math.min(best, v); be = Math.min(be, v); }
          if (al >= be) break;
        } return best;
      }
      function ai() {
        let best = -Infinity, mv = 3;
        for (const c of [3, 2, 4, 1, 5, 0, 6]) if (!g[0][c]) { const r = drop(g, c, 2), v = mm(g, 5, -Infinity, Infinity, 1) + Math.random(); g[r][c] = 0; if (v > best) { best = v; mv = c; } }
        return mv;
      }
      function draw() {
        bd.innerHTML = g.flat().map((v, i) => `<div data-c="${i % C}" style="aspect-ratio:1;border-radius:50%;cursor:pointer;background:${v === 1 ? '#ffd166' : v === 2 ? '#ff5c6c' : '#0f1222'}"></div>`).join('');
      }
      function finish() {
        if (four(g, 1)) { over = true; st.w++; msg.textContent = '🎉 Bạn thắng!'; } else if (four(g, 2)) { over = true; st.l++; msg.textContent = '🤖 Máy thắng!'; }
        else if (g[0].every(v => v)) { over = true; msg.textContent = 'Hòa!'; }
        if (over) { GV.store.set('c4', st); el.querySelector('.w').textContent = st.w; el.querySelector('.l').textContent = st.l; } return over;
      }
      bd.onclick = e => {
        const c = e.target.dataset.c; if (c === undefined || over || busy || drop(g, +c, 1) < 0) return;
        draw(); if (finish()) return; busy = true; msg.textContent = 'Máy đang nghĩ…';
        tm = setTimeout(() => { drop(g, ai(), 2); busy = false; msg.textContent = ''; draw(); finish(); }, 250);
      };
      function reset() { clearTimeout(tm); g = fresh(); over = busy = false; msg.textContent = 'Bạn là 🟡, đi trước'; el.querySelector('.w').textContent = st.w; el.querySelector('.l').textContent = st.l; draw(); }
      el.querySelector('.rs').onclick = reset; reset();
      return () => clearTimeout(tm);
    }
  });

  /* ---------- TYPING ---------- */
  GV.register({
    id: 'typing', type: 'game', cat: 'Phản xạ', name: 'Gõ phím nhanh', icon: '⌨️', desc: 'Đo tốc độ gõ (từ/phút) trong 30 giây.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Còn: <b class="t">30</b>s</span><span>WPM: <b class="wpm">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('typing')}</b></span><button class="btn rs">Bắt đầu lại</button></div>
      <div class="res txt" style="font-size:1.25rem;line-height:1.8;width:100%;max-width:640px"></div><input class="in" placeholder="Bắt đầu gõ để tính giờ…" style="width:100%;max-width:640px" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"><p class="msg"></p>`;
      const W = 'the quick brown fox jumps over lazy dog and runs across green field while birds sing in tall trees under bright blue sky we build simple games for fun every day practice makes typing faster and better keep your eyes on the screen relax your hands and type with rhythm small steps lead to great results never stop learning new things because curiosity opens many doors'.split(' ');
      const $ = s => el.querySelector(s); let words, idx, ok, typed, tm, left, running;
      function reset() {
        clearInterval(tm); words = GV.shuffle(W.slice()).concat(GV.shuffle(W.slice())); idx = ok = typed = 0; left = 30; running = false;
        $('.t').textContent = 30; $('.wpm').textContent = 0; $('.msg').textContent = ''; $('.in').value = ''; $('.in').disabled = false; show(); $('.in').focus();
      }
      function show() { $('.txt').innerHTML = words.slice(idx, idx + 24).map((w, i) => i ? GV.esc(w) : `<b style="background:#4a5fc4;border-radius:4px;padding:0 3px">${GV.esc(w)}</b>`).join(' '); }
      function end() {
        clearInterval(tm); running = false; $('.in').disabled = true;
        const wpm = ok * 2; $('.msg').textContent = `Kết quả: ${wpm} WPM · đúng ${ok}/${typed} từ`;
        if (GV.setBest('typing', wpm)) $('.bs').textContent = wpm;
      }
      $('.in').oninput = e => {
        if (!running) { running = true; tm = setInterval(() => { $('.t').textContent = --left; if (left <= 0) end(); }, 1000); }
        const v = e.target.value;
        if (/\s$/.test(v)) { typed++; if (v.trim() === words[idx]) ok++; idx++; e.target.value = ''; $('.wpm').textContent = Math.round(ok * 60 / Math.max(1, 30 - left)); show(); }
      };
      $('.rs').onclick = reset; reset();
      return () => clearInterval(tm);
    }
  });

  /* ---------- DINO RUNNER ---------- */
  GV.register({
    id: 'runner', type: 'game', cat: 'Arcade', name: 'Khủng long chạy', icon: '🦖', desc: 'Nhảy qua xương rồng, chạy càng xa càng tốt.',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best('runner')}</b></span></div><canvas class="cv" width="600" height="200"></canvas><p class="msg">Space / chạm để nhảy</p>`;
      const cv = el.querySelector('canvas'), c = cv.getContext('2d'), msg = el.querySelector('.msg');
      let y, vy, obs, score, speed, state, raf, f;
      function reset() { y = 0; vy = 0; obs = []; score = 0; speed = 6; state = 'ready'; f = 0; msg.textContent = 'Space / chạm để nhảy'; }
      function jump() {
        if (state === 'ready') { state = 'play'; msg.textContent = ''; }
        if (state === 'play' && y === 0) { vy = 12.5; GV.beep(500, 40); }
        else if (state === 'dead' && f > 30) reset();
      }
      function loop() {
        f++;
        if (state === 'play') {
          y += vy; vy -= .75; if (y <= 0) { y = 0; vy = 0; }
          score += speed / 20; speed = 6 + score / 150;
          if (!obs.length || obs[obs.length - 1].x < 600 - (200 + GV.rnd(250))) obs.push({ x: 620, w: 16 + GV.rnd(20), h: 26 + GV.rnd(28) });
          obs.forEach(o => o.x -= speed); obs = obs.filter(o => o.x > -50);
          for (const o of obs) if (o.x < 70 && o.x + o.w > 40 && y < o.h - 4) {
            state = 'dead'; f = 0; msg.textContent = 'Game over! Space / chạm để chơi lại';
            if (GV.setBest('runner', Math.floor(score))) el.querySelector('.bs').textContent = Math.floor(score); GV.beep(150, 250);
          }
          el.querySelector('.sc').textContent = Math.floor(score);
        }
        c.fillStyle = '#0a0d1c'; c.fillRect(0, 0, 600, 200); c.fillStyle = '#5b6494'; c.fillRect(0, 170, 600, 2);
        c.fillStyle = '#3ddc97'; obs.forEach(o => c.fillRect(o.x, 170 - o.h, o.w, o.h));
        c.font = '34px serif'; c.textBaseline = 'alphabetic'; c.fillText('🦖', 32, 172 - y);
        raf = requestAnimationFrame(loop);
      }
      cv.addEventListener('mousedown', jump);
      cv.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
      const off = GV.keys(e => { if (e.key === ' ' || e.key === 'ArrowUp') jump(); });
      reset(); loop();
      return () => { cancelAnimationFrame(raf); off(); };
    }
  });

  /* ---------- HANGMAN ---------- */
  GV.register({
    id: 'hangman', type: 'game', cat: 'Trí tuệ', name: 'Đoán chữ', icon: '🔠', desc: 'Đoán từ tiếng Anh từng chữ cái (Hangman).',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Sai: <b class="wr">0</b>/7</span><span>Chuỗi thắng: <b class="st">0</b></span><button class="btn rs">Từ mới</button></div>
      <div class="big res word" style="letter-spacing:.3em;font-family:monospace"></div><div class="hint hi"></div><div style="font-size:3rem" class="fig"></div><div class="row kb" style="max-width:420px"></div><p class="msg"></p>`;
      const L = [['ELEPHANT', 'Động vật'], ['GIRAFFE', 'Động vật'], ['DOLPHIN', 'Động vật'], ['PENGUIN', 'Động vật'], ['KANGAROO', 'Động vật'], ['COMPUTER', 'Công nghệ'], ['KEYBOARD', 'Công nghệ'], ['INTERNET', 'Công nghệ'], ['BROWSER', 'Công nghệ'], ['JAVASCRIPT', 'Lập trình'], ['ALGORITHM', 'Lập trình'], ['DATABASE', 'Lập trình'], ['VIETNAM', 'Quốc gia'], ['JAPAN', 'Quốc gia'], ['BRAZIL', 'Quốc gia'], ['AUSTRALIA', 'Quốc gia'], ['BANANA', 'Trái cây'], ['PINEAPPLE', 'Trái cây'], ['STRAWBERRY', 'Trái cây'], ['GUITAR', 'Nhạc cụ'], ['PIANO', 'Nhạc cụ'], ['VIOLIN', 'Nhạc cụ'], ['MOUNTAIN', 'Thiên nhiên'], ['RAINBOW', 'Thiên nhiên'], ['VOLCANO', 'Thiên nhiên']];
      const FIG = ['😀', '🙂', '😐', '😟', '😨', '😱', '😵', '💀'];
      const $ = s => el.querySelector(s); let w, hint, got, wrong, streak = 0;
      $('.kb').innerHTML = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(k => `<button class="btn ghost" data-k="${k}" style="min-width:36px;padding:8px 0">${k}</button>`).join('');
      function reset() {
        [w, hint] = L[GV.rnd(L.length)]; got = new Set(); wrong = 0; $('.msg').textContent = ''; $('.hi').textContent = 'Gợi ý: ' + hint;
        $('.kb').querySelectorAll('button').forEach(b => b.disabled = false); draw();
      }
      function draw() {
        $('.word').textContent = [...w].map(ch => got.has(ch) ? ch : '_').join(' '); $('.wr').textContent = wrong; $('.st').textContent = streak; $('.fig').textContent = FIG[wrong];
      }
      $('.kb').onclick = e => {
        const k = e.target.dataset.k; if (!k || e.target.disabled || wrong >= 7) return;
        e.target.disabled = true;
        if (w.includes(k)) got.add(k); else wrong++;
        draw();
        if ([...w].every(ch => got.has(ch))) { streak++; $('.st').textContent = streak; $('.msg').textContent = '🎉 Chính xác!'; $('.kb').querySelectorAll('button').forEach(b => b.disabled = true); }
        else if (wrong >= 7) { streak = 0; $('.st').textContent = 0; $('.msg').textContent = 'Thua rồi! Từ đúng là ' + w; $('.word').textContent = [...w].join(' '); $('.kb').querySelectorAll('button').forEach(b => b.disabled = true); }
      };
      $('.rs').onclick = reset; reset();
    }
  });
})();
