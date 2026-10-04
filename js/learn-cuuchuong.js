// Bé học bảng cửu chương: học (có hình + đọc to), luyện thích ứng, thi 10 câu, báo cáo cho phụ huynh. Lưu trên máy (gv_cuuchuong).
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const say = n => { if (n === 100) return 'một trăm'; if (n < 10) return ONES[n]; if (n === 10) return 'mười'; const t = Math.floor(n / 10), o = n % 10; const head = t === 1 ? 'mười' : ONES[t] + ' mươi'; if (o === 0) return head; return head + ' ' + (o === 1 && t > 1 ? 'mốt' : o === 5 ? 'lăm' : ONES[o]); };
  const speakEq = (a, b) => `${say(a)} nhân ${say(b)} bằng ${say(a * b)}`;
  const FRUIT = ['🍎', '🍓', '🍊', '🍌', '🍇', '🍉', '🥕', '⭐'];
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  GV.register({
    id: 'cuuchuong', type: 'game', cat: 'Học tập', name: 'Bé học cửu chương', icon: '✖️', desc: 'Học bảng cửu chương 2–9 vui nhộn: xem hình minh hoạ, nghe đọc, luyện tập thích ứng, thi 10 câu lấy sao và báo cáo cho phụ huynh.',
    mount(el) {
      const D = Object.assign({ f: {}, stars: 0, best: 0, days: {} }, GV.store.get('cuuchuong', {}));
      let tab = 'learn', tbl = 3, q = null, session = null, timer = 0, dead = false, speakOn = true;
      const save = () => GV.store.set('cuuchuong', D);
      const key = (a, b) => a + 'x' + b;
      const today = () => new Date().toISOString().slice(0, 10);
      const mark = (a, b, ok) => { const k = key(Math.min(a, b), Math.max(a, b)), s = D.f[k] || (D.f[k] = { r: 0, w: 0 }); ok ? s.r++ : s.w++; const d = D.days[today()] || (D.days[today()] = { n: 0, ok: 0 }); d.n++; if (ok) d.ok++; save(); };
      el.innerHTML = `<style>.cc{max-width:560px;width:100%;text-align:center;font-family:"Baloo 2",Roboto,sans-serif}.cc .top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}.cc .mas{font-size:2.2rem}.cc .tabs2{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0}.cc .tabs2 button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.cc .nums{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0}.cc .nums button{width:46px;height:46px;border-radius:14px;font-size:20px;font-weight:800}.cc .nums button.on{background:var(--md-primary,#D0BCFF);color:#000}.cc .rows{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.cc .rw{padding:8px 10px;border-radius:12px;background:var(--md-sc-high,#2b292d);border:2px solid transparent;font-size:20px;font-weight:800;cursor:pointer;color:var(--fg);font-family:inherit}.cc .rw.hl{border-color:var(--md-primary,#D0BCFF);background:var(--t-p)}.cc .arr{display:grid;gap:2px;justify-content:center;margin:8px auto;font-size:20px;line-height:1.1}.cc .big2{font-size:2.6rem;font-weight:800;margin:8px 0}.cc .ans{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:10px 0}.cc .ans button{height:62px;font-size:26px;font-weight:800;border-radius:18px}.cc .ans button.ok{background:rgba(34,197,94,.3);border-color:#22c55e}.cc .ans button.bad{background:rgba(239,68,68,.3);border-color:#ef4444}.cc .bar{height:10px;border-radius:6px;background:var(--line);overflow:hidden;margin:6px 0}.cc .bar i{display:block;height:100%;background:var(--ok);width:0}.cc .hm{display:grid;grid-template-columns:30px repeat(10,1fr);gap:3px;font-size:11px}.cc .hm b{padding:5px 0;border-radius:6px;color:#000}.cc .msg2{min-height:1.6em;font-weight:800}</style><div class="cc"><div class="top"><span class="mas">🦉</span><b>Bé học cửu chương</b><span>⭐ <b class="st">0</b></span></div><div class="tabs2"><button class="btn ghost" data-t="learn">📖 Học</button><button class="btn ghost" data-t="practice">✏️ Luyện</button><button class="btn ghost" data-t="exam">🏆 Thi</button><button class="btn ghost" data-t="parent">📊 Phụ huynh</button></div><div class="body"></div></div>`;
      const body = $(el, '.body');
      const hud = () => { $(el, '.st').textContent = D.stars; el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); };
      const spk = t => { if (speakOn && GV.learn && GV.learn.speak) GV.learn.speak(t, 'vi', .9); };
      const numPick = (cur, all) => `<div class="nums">${(all ? [0] : []).concat([2, 3, 4, 5, 6, 7, 8, 9]).map(n => `<button class="btn ghost${n === cur ? ' on' : ''}" data-n="${n}">${n === 0 ? '🎲' : n}</button>`).join('')}</div>`;

      /* ---- HỌC ---- */
      function learn(hl) {
        body.innerHTML = numPick(tbl) + `<div class="rows">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<button class="rw${hl === i ? ' hl' : ''}" data-r="${i}">${tbl} × ${i} = ${tbl * i}</button>`).join('')}</div><div class="arr"></div><div class="row" style="justify-content:center;margin-top:8px"><button class="btn" data-act="all">🔊 Đọc cả bảng</button><button class="btn ghost" data-act="mute">${speakOn ? '🔈 Tiếng: bật' : '🔇 Tiếng: tắt'}</button></div><p class="hint">Chạm vào một phép tính để xem hình và nghe đọc.</p>`;
        if (hl) { const a = $(body, '.arr'); a.style.gridTemplateColumns = `repeat(${tbl},auto)`; const f = FRUIT[tbl % FRUIT.length]; a.innerHTML = Array(hl * tbl).fill(`<span>${f}</span>`).join(''); a.title = `${hl} hàng, mỗi hàng ${tbl}`; }
      }
      let readAll = 0;
      function readTable() { let i = 1; clearInterval(readAll); readAll = setInterval(() => { if (dead || tab !== 'learn') return clearInterval(readAll); learn(i); spk(speakEq(tbl, i)); if (++i > 10) clearInterval(readAll); }, 2600); learn(1); spk(speakEq(tbl, 1)); i = 2; }

      /* ---- CÂU HỎI ---- */
      function pick(tables) { // chọn phép theo trọng số: sai nhiều thì ra nhiều
        const pool = []; tables.forEach(a => { for (let b = 1; b <= 10; b++) { const s = D.f[key(Math.min(a, b), Math.max(a, b))] || { r: 0, w: 0 }; pool.push([a, b, Math.max(.3, 1 + 3 * s.w - .3 * s.r)]); } });
        let tot = pool.reduce((x, p) => x + p[2], 0), r = Math.random() * tot; for (const p of pool) { r -= p[2]; if (r <= 0) return Math.random() < .5 ? [p[0], p[1]] : [p[1], p[0]]; } return [tables[0], 1];
      }
      function makeQ(tables, kinds) {
        const [a, b] = pick(tables), kind = kinds[rnd(kinds.length)], ans = kind === 0 ? a * b : kind === 1 ? b : a, prod = a * b;
        const set = new Set([ans]); const near = kind === 0 ? [a * (b - 1), a * (b + 1), (a + 1) * b, (a - 1) * b, prod + 10, prod - 10, prod + 1, prod - 1] : [ans - 1, ans + 1, ans + 2, ans - 2, ans + 3];
        shuffle(near).forEach(v => { if (v > 0 && set.size < 4) set.add(v); }); let k = 1; while (set.size < 4) set.add(ans + k++);
        const txt = kind === 0 ? `${a} × ${b} = ?` : kind === 1 ? `${a} × ? = ${prod}` : `? × ${b} = ${prod}`;
        return { a, b, txt, ans, opts: shuffle([...set]), kind, t0: Date.now() };
      }
      const ansHTML = () => `<div class="ans">${q.opts.map(o => `<button class="btn ghost" data-o="${o}">${o}</button>`).join('')}</div>`;

      /* ---- LUYỆN ---- */
      function practiceMenu() {
        body.innerHTML = `<p>Chọn bảng cần luyện (🎲 = trộn nhiều bảng):</p>${numPick(0, true).replace('class="btn ghost" data-n="0"', 'class="btn ghost" data-n="0"')}<p class="hint">Trả lời đúng 10 câu để nhận 1 ⭐. Phép hay sai sẽ xuất hiện nhiều hơn.</p>`;
      }
      function practiceStart(n) { session = { tables: n ? [n] : [2, 3, 4, 5, 6, 7, 8, 9], ok: 0, tot: 0, streak: 0, kinds: [0, 0, 0, 1, 2] }; practiceNext(); }
      function practiceNext() { q = makeQ(session.tables, session.kinds); body.innerHTML = `<div class="bar"><i style="width:${session.ok * 10}%"></i></div><div class="hint">Đúng ${session.ok}/10 · chuỗi 🔥 ${session.streak}</div><div class="big2">${q.txt}</div>${ansHTML()}<div class="msg2"></div><button class="btn ghost" data-act="menu">← Chọn bảng khác</button>`; }
      function practiceAnswer(v, btn) {
        const ok = v === q.ans; mark(q.a, q.b, ok); session.tot++;
        body.querySelectorAll('[data-o]').forEach(b => { b.disabled = true; if (+b.dataset.o === q.ans) b.classList.add('ok'); });
        if (ok) { session.ok++; session.streak++; $(body, '.msg2').textContent = ['🎉 Giỏi quá!', '👏 Chính xác!', '🌟 Tuyệt vời!', '💪 Đúng rồi!'][rnd(4)]; GV.beep && GV.beep(800, 80); spk(speakEq(q.a, q.b)); }
        else { btn.classList.add('bad'); session.streak = 0; $(body, '.msg2').textContent = `Chưa đúng. ${q.a} × ${q.b} = ${q.a * q.b}`; GV.beep && GV.beep(220, 120); spk(speakEq(q.a, q.b)); }
        setTimeout(() => { if (dead || tab !== 'practice' || !session) return; if (session.ok >= 10) { D.stars++; save(); hud(); body.innerHTML = `<div class="big2">🌟</div><h3>Hoàn thành! Bé nhận 1 ⭐</h3><p>Làm ${session.tot} câu, đúng ${session.ok}.</p><button class="btn" data-act="again">Luyện tiếp</button> <button class="btn ghost" data-act="menu">Chọn bảng khác</button>`; session = null; } else practiceNext(); }, ok ? 900 : 1700);
      }

      /* ---- THI ---- */
      function examStart() { session = { n: 0, ok: 0, wrong: [], tables: [2, 3, 4, 5, 6, 7, 8, 9], kinds: [0, 0, 1, 2], exam: true }; examNext(); }
      function examNext() {
        clearInterval(timer); if (session.n >= 10) return examEnd();
        q = makeQ(session.tables, session.kinds); session.n++; let left = 12;
        body.innerHTML = `<div class="hint">Câu ${session.n}/10 · Đúng ${session.ok}</div><div class="bar"><i class="tm" style="width:100%"></i></div><div class="big2">${q.txt}</div>${ansHTML()}`;
        timer = setInterval(() => { if (dead || tab !== 'exam') return clearInterval(timer); left -= .25; const t = $(body, '.tm'); if (t) t.style.width = left / 12 * 100 + '%'; if (left <= 0) examAnswer(-1); }, 250);
      }
      function examAnswer(v) { clearInterval(timer); const ok = v === q.ans; mark(q.a, q.b, ok); if (ok) session.ok++; else session.wrong.push(`${q.a} × ${q.b} = ${q.a * q.b}`); examNext(); }
      function examEnd() { const s = session.ok, stars = s >= 9 ? 3 : s >= 7 ? 2 : s >= 5 ? 1 : 0; D.stars += stars; D.best = Math.max(D.best, s); save(); hud(); body.innerHTML = `<div class="big2">${'⭐'.repeat(stars) || '💪'}</div><h3>Điểm: ${s}/10</h3><p class="hint">Kỉ lục: ${D.best}/10</p>${session.wrong.length ? `<p><b>Cần ôn lại:</b><br>${session.wrong.map(esc).join(' · ')}</p>` : '<p>🎉 Không sai câu nào!</p>'}<button class="btn" data-act="exam">Thi lại</button>`; session = null; }
      function examIntro() { body.innerHTML = `<div class="big2">🏆</div><p>10 câu hỏi, mỗi câu 12 giây.<br>9–10 đúng: 3 ⭐ · 7–8: 2 ⭐ · 5–6: 1 ⭐</p><p class="hint">Kỉ lục: ${D.best}/10</p><button class="btn" data-act="exam">Bắt đầu thi</button>`; }

      /* ---- PHỤ HUYNH ---- */
      function parent() {
        const col = s => !s ? ['#9e9e9e', '·'] : (s.r + s.w) < 2 ? ['#ffd54f', '?'] : s.w / (s.r + s.w) > .35 ? ['#ef5350', '✗'] : ['#66bb6a', '✓'];
        let cells = '<span></span>' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(b => `<span>${b}</span>`).join('');
        for (let a = 2; a <= 9; a++) { cells += `<span><b style="background:none;color:inherit">${a}</b></span>`; for (let b = 1; b <= 10; b++) { const s = D.f[key(Math.min(a, b), Math.max(a, b))], c = col(s); cells += `<b style="background:${c[0]}" title="${a}×${b}">${c[1]}</b>`; } }
        const weak = Object.entries(D.f).filter(([, s]) => s.w > 0).sort((x, y) => y[1].w / (y[1].r + y[1].w) - x[1].w / (x[1].r + x[1].w)).slice(0, 6).map(([k, s]) => { const [a, b] = k.split('x'); return `${a}×${b} (sai ${s.w}/${s.r + s.w})`; });
        const t = D.days[today()] || { n: 0, ok: 0 }, days = Object.keys(D.days).length;
        body.innerHTML = `<p>Hôm nay: <b>${t.n}</b> câu, đúng <b>${t.ok}</b> · Đã luyện <b>${days}</b> ngày · ⭐ ${D.stars}</p><div class="hm">${cells}</div><p class="hint">🟢 thuộc · 🟡 chưa đủ dữ liệu · 🔴 hay sai · ⚪ chưa làm</p><p>${weak.length ? '<b>Cần ôn:</b> ' + weak.join(' · ') : 'Chưa có phép nào sai nhiều.'}</p><button class="btn ghost" data-act="reset">🗑 Xoá tiến trình</button>`;
      }

      function go(t) { clearInterval(timer); clearInterval(readAll); tab = t; session = null; hud(); if (t === 'learn') learn(0); else if (t === 'practice') practiceMenu(); else if (t === 'exam') examIntro(); else parent(); }
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) return go(b.dataset.t);
        if (b.dataset.n != null) { const n = +b.dataset.n; if (tab === 'learn') { tbl = n; learn(0); } else practiceStart(n); return; }
        if (b.dataset.r) { learn(+b.dataset.r); spk(speakEq(tbl, +b.dataset.r)); return; }
        if (b.dataset.o != null) return tab === 'exam' ? examAnswer(+b.dataset.o) : practiceAnswer(+b.dataset.o, b);
        const a = b.dataset.act; if (a === 'all') readTable(); else if (a === 'mute') { speakOn = !speakOn; learn(0); } else if (a === 'menu') { session = null; practiceMenu(); } else if (a === 'again') practiceMenu(); else if (a === 'exam') examStart();
        else if (a === 'reset') { if (confirm('Xoá toàn bộ tiến trình luyện tập?')) { D.f = {}; D.stars = 0; D.best = 0; D.days = {}; save(); go('parent'); } }
      });
      go('learn');
      GV.cuuT = { D, say, speakEq, get q() { return q; } };
      return () => { dead = true; clearInterval(timer); clearInterval(readAll); try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
