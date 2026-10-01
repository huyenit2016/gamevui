// Game chữ & sáng tạo: Từ vựng nhanh, Ghép chữ, Vẽ & trang trí, Thời trang, Nhà bếp nhỏ, Giải đố IQ
(function () {
  const $ = (el, s) => el.querySelector(s);
  const hud = (id, extra = '') => `<div class="hud"><span>Điểm: <b class="sc">0</b></span><span>Kỷ lục: <b class="bs">${GV.best(id)}</b></span>${extra}<button class="btn rs">Chơi lại</button></div>`;
  const BIG = 'style="min-height:52px;font-size:17px;min-width:120px"';
  // lấy danh sách từ vựng có sẵn của phần Học tập
  const pool = lang => { const b = GV.learn && GV.learn.BUILTIN && GV.learn.BUILTIN[lang]; return b ? b.units.flatMap(u => u.items).filter(i => i.t && i.m) : []; };

  /* ---------- TỪ VỰNG NHANH ---------- */
  GV.register({
    id: 'vocabquiz', type: 'game', cat: 'Học tập', name: 'Đố từ vựng nhanh', icon: '🔤', desc: 'Chọn nghĩa đúng của từ trong 10 câu liên tiếp – tiếng Anh, Nhật, Hàn, Trung. Có phát âm!',
    mount(el) {
      const L = GV.learn, langs = Object.keys((L && L.BUILTIN) || {}).filter(k => pool(k).length >= 6);
      el.innerHTML = hud('vocabquiz', '<span>Câu: <b class="n">1</b>/10</span>') + `<div class="row"><select class="lg">${langs.map(k => `<option value="${k}">${L.LANGS && L.LANGS[k] ? L.LANGS[k].flag + ' ' + L.LANGS[k].name : k}</option>`).join('')}</select><select class="dr"><option value="0">Từ → nghĩa</option><option value="1">Nghĩa → từ</option></select></div><div class="big q" style="font-size:2rem;min-height:1.4em"></div><div class="row"><button class="btn ghost sp">🔊 Nghe</button></div><div class="col opts"></div><p class="msg"></p>`;
      let qs, i, score, cur, lock, dead = false;
      function build() { const lg = $(el, '.lg').value, P = GV.shuffle(pool(lg).slice()); qs = P.slice(0, 10).map(it => { const o = GV.shuffle([it, ...GV.shuffle(P.filter(x => x !== it)).slice(0, 3)]); return { it, o }; }); i = 0; score = 0; $(el, '.sc').textContent = 0; show(); }
      function show() {
        if (i >= qs.length) { $(el, '.q').textContent = `Hoàn thành! ${score} điểm`; $(el, '.opts').innerHTML = ''; $(el, '.msg').textContent = ''; if (GV.setBest('vocabquiz', score)) $(el, '.bs').textContent = score; return; }
        cur = qs[i]; lock = false; const rev = $(el, '.dr').value === '1'; $(el, '.n').textContent = i + 1; $(el, '.q').textContent = rev ? cur.it.m : cur.it.t + (cur.it.r ? '  ·  ' + cur.it.r : ''); $(el, '.msg').textContent = '';
        $(el, '.opts').innerHTML = cur.o.map((o, k) => `<button class="btn ghost" data-k="${k}" ${BIG}>${GV.esc(rev ? o.t : o.m)}</button>`).join(''); if (!rev) speak();
      }
      const speak = () => { if (L && L.speak && cur) { try { L.speak(cur.it.t, $(el, '.lg').value); } catch (e) {} } };
      $(el, '.opts').onclick = e => { const b = e.target.closest('[data-k]'); if (!b || lock) return; lock = true; const ok = cur.o[+b.dataset.k] === cur.it; if (ok) { score += 10; GV.beep(700, 60); } else GV.beep(180, 120); $(el, '.sc').textContent = score; b.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)'; b.style.color = ok ? 'var(--ok)' : 'var(--bad)'; $(el, '.msg').textContent = ok ? 'Chính xác!' : `Đáp án: ${cur.it.t} = ${cur.it.m}`; setTimeout(() => { if (!dead) { i++; show(); } }, ok ? 600 : 1500); };
      $(el, '.sp').onclick = speak; $(el, '.lg').onchange = $(el, '.dr').onchange = build; $(el, '.rs').onclick = build; build();
      return () => { dead = true; };
    }
  });

  /* ---------- GHÉP CHỮ ---------- */
  GV.register({
    id: 'wordscramble', type: 'game', cat: 'Học tập', name: 'Ghép chữ tiếng Anh', icon: '🔠', desc: 'Sắp xếp các chữ cái xáo trộn thành từ tiếng Anh đúng – có gợi ý nghĩa tiếng Việt.',
    mount(el) {
      el.innerHTML = hud('wordscramble', '<span>Streak: <b class="st">0</b></span>') + `<p class="hint">Gợi ý: <b class="mn"></b></p><div class="row ans" style="min-height:58px;gap:6px"></div><div class="row lt" style="gap:8px"></div><div class="row"><button class="btn ghost bk">⌫ Xoá</button><button class="btn ghost hn">💡 Gợi ý</button><button class="btn ghost sk">Bỏ qua</button></div><p class="msg"></p>`;
      let words, w, picked, score, streak, dead = false;
      const tile = (ch, k) => `<button class="btn ghost" data-k="${k}" style="min-width:48px;min-height:52px;font-size:22px;padding:0 12px;text-transform:uppercase">${ch}</button>`;
      function nextW() { w = words[GV.rnd(words.length)]; const letters = GV.shuffle([...w.t.toLowerCase()].map((ch, k) => ({ ch, k }))); if (letters.map(x => x.ch).join('') === w.t.toLowerCase() && w.t.length > 2) return nextW(); picked = []; w.l = letters; $(el, '.mn').textContent = w.m; $(el, '.msg').textContent = ''; draw(); }
      function draw() { $(el, '.ans').innerHTML = picked.map(i => tile(w.l[i].ch, i)).join('') || '<span class="hint">Chạm các chữ cái bên dưới</span>'; $(el, '.lt').innerHTML = w.l.map((x, i) => picked.includes(i) ? '' : tile(x.ch, i)).join(''); }
      function check() { if (picked.length !== w.l.length) return; const s = picked.map(i => w.l[i].ch).join(''); if (s === w.t.toLowerCase()) { streak++; score += 10 + streak * 2; GV.beep(800, 100); $(el, '.msg').textContent = 'Đúng rồi! 🎉'; try { GV.learn.speak(w.t, 'en'); } catch (e) {} $(el, '.sc').textContent = score; $(el, '.st').textContent = streak; if (GV.setBest('wordscramble', score)) $(el, '.bs').textContent = score; setTimeout(() => !dead && nextW(), 900); } else { streak = 0; $(el, '.st').textContent = 0; $(el, '.msg').textContent = 'Chưa đúng, thử lại nhé.'; GV.beep(180, 120); } }
      $(el, '.lt').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { picked.push(+b.dataset.k); draw(); check(); } };
      $(el, '.ans').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { picked = picked.filter(i => i !== +b.dataset.k); draw(); } };
      $(el, '.bk').onclick = () => { picked.pop(); draw(); }; $(el, '.sk').onclick = () => { streak = 0; $(el, '.st').textContent = 0; nextW(); };
      $(el, '.hn').onclick = () => { $(el, '.msg').textContent = `Từ bắt đầu bằng "${w.t[0].toUpperCase()}" và có ${w.t.length} chữ cái.`; score = Math.max(0, score - 2); $(el, '.sc').textContent = score; };
      function reset() { words = pool('en').filter(i => /^[A-Za-z]{3,9}$/.test(i.t)); if (words.length < 5) words = [{ t: 'apple', m: 'quả táo' }, { t: 'house', m: 'ngôi nhà' }, { t: 'water', m: 'nước' }, { t: 'friend', m: 'bạn bè' }, { t: 'school', m: 'trường học' }]; score = 0; streak = 0; $(el, '.sc').textContent = 0; $(el, '.st').textContent = 0; nextW(); }
      $(el, '.rs').onclick = reset; reset();
      return () => { dead = true; };
    }
  });

  /* ---------- VẼ & TRANG TRÍ ---------- */
  GV.register({
    id: 'freedraw', type: 'game', cat: 'Sáng tạo', name: 'Vẽ & trang trí', icon: '🖌️', desc: 'Vẽ tự do, dán sticker biểu tượng, hoàn tác và lưu bức tranh thành ảnh PNG.',
    mount(el) {
      const COL = ['#111111', '#EF5350', '#FF9800', '#FFEB3B', '#66BB6A', '#42A5F5', '#AB47BC', '#EC407A', '#8D6E63', '#FFFFFF'], ST = ['⭐', '❤️', '🌸', '🦋', '🌈', '☀️', '🐱', '🎈', '🎁', '🏠'];
      el.innerHTML = `<div class="tool" style="max-width:420px;align-items:center"><div class="row pal">${COL.map(c => `<button data-c="${c}" aria-label="Màu ${c}" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--line);background:${c};cursor:pointer"></button>`).join('')}</div><div class="row"><label>Nét <input type="range" class="sz" min="2" max="40" value="6" style="width:110px"></label><button class="btn ghost er">🧽 Tẩy</button><button class="btn ghost un">↩ Hoàn tác</button><button class="btn ghost cl">🗑 Xoá hết</button></div><div class="row st">${ST.map(s => `<button class="btn ghost" data-s="${s}" style="min-width:40px;min-height:40px;padding:0;font-size:20px">${s}</button>`).join('')}</div><canvas class="cv" width="360" height="400" style="background:#fff;touch-action:none;cursor:crosshair"></canvas><div class="row"><button class="btn sv">⬇ Lưu ảnh PNG</button></div><p class="hint">Chọn màu rồi vẽ; chọn sticker rồi chạm lên tranh để dán (chạm lại nét vẽ để quay về bút).</p></div>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'); let col = '#111111', er = false, stamp = null, drawing = false, last = null, hist = [];
      const snap = () => { hist.push(c.getImageData(0, 0, 360, 400)); if (hist.length > 20) hist.shift(); }, clear = () => { c.fillStyle = '#fff'; c.fillRect(0, 0, 360, 400); };
      const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * 360 / r.width, y: (e.clientY - r.top) * 400 / r.height }; };
      el.querySelector('.pal').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { col = b.dataset.c; er = false; stamp = null; el.querySelectorAll('[data-s]').forEach(x => x.style.outline = ''); el.querySelectorAll('[data-c]').forEach(x => x.style.outline = x === b ? '3px solid var(--md-primary)' : ''); $(el, '.er').style.outline = ''; } };
      el.querySelector('.st').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { stamp = b.dataset.s; el.querySelectorAll('[data-s]').forEach(x => x.style.outline = x === b ? '2px solid var(--md-primary)' : ''); } };
      $(el, '.er').onclick = e => { er = !er; stamp = null; e.currentTarget.style.outline = er ? '2px solid var(--md-primary)' : ''; };
      cv.addEventListener('pointerdown', e => { const p = pt(e); snap(); if (stamp) { c.font = (+$(el, '.sz').value * 3 + 24) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(stamp, p.x, p.y); return; } drawing = true; last = p; c.fillStyle = er ? '#fff' : col; c.beginPath(); c.arc(p.x, p.y, +$(el, '.sz').value / 2, 0, 7); c.fill(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
      cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); c.strokeStyle = er ? '#fff' : col; c.lineWidth = +$(el, '.sz').value; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(p.x, p.y); c.stroke(); last = p; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => cv.addEventListener(n, () => { drawing = false; }));
      $(el, '.un').onclick = () => { const h = hist.pop(); if (h) c.putImageData(h, 0, 0); }; $(el, '.cl').onclick = () => { snap(); clear(); };
      $(el, '.sv').onclick = () => { const a = document.createElement('a'); a.download = 'tranh-gamevui.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }; clear();
    }
  });

  /* ---------- THỜI TRANG ---------- */
  GV.register({
    id: 'dressup', type: 'game', cat: 'Sáng tạo', name: 'Thời trang công chúa', icon: '👗', desc: 'Phối đồ cho nhân vật: tóc mũ, khuôn mặt, váy áo, giày và phụ kiện. Chụp ảnh lưu lại bộ trang phục yêu thích!',
    mount(el) {
      const OPT = { 'Mũ / tóc': ['👑', '🎀', '🎩', '🧢', '👒', '🪮', '💐'], 'Khuôn mặt': ['😊', '😎', '🥰', '😇', '🤩', '😜', '🥳'], 'Trang phục': ['👗', '👚', '👘', '🥻', '🧥', '👔', '🩱'], 'Giày dép': ['👠', '👟', '🥿', '🥾', '👢', '🩴'], 'Phụ kiện': ['💍', '🕶️', '🧣', '🎒', '💎', '📿', '—'] }, BGS = ['#F8BBD0', '#B3E5FC', '#C8E6C9', '#FFF9C4', '#D1C4E9', '#FFE0B2'];
      let sel = {}; Object.entries(OPT).forEach(([k, v]) => sel[k] = v[0]); let bg = BGS[0];
      el.innerHTML = `<div class="tool" style="align-items:center;max-width:460px"><div class="dv" style="width:240px;height:330px;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;line-height:1.1;box-shadow:var(--e2,0 2px 8px #0004)"></div><div class="row bgs">${BGS.map(b => `<button data-b="${b}" aria-label="Nền" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--line);background:${b};cursor:pointer"></button>`).join('')}</div>${Object.entries(OPT).map(([k, v]) => `<div class="row" style="gap:6px"><b style="min-width:84px;font-size:13px;color:var(--mut)">${k}</b>${v.map(e => `<button class="btn ghost" data-g="${k}" data-e="${e}" style="min-width:44px;min-height:44px;padding:0;font-size:22px">${e}</button>`).join('')}</div>`).join('')}<div class="row"><button class="btn ghost rn">🎲 Ngẫu nhiên</button><button class="btn sv">📸 Lưu ảnh</button></div></div>`;
      const dv = $(el, '.dv'), draw = () => { dv.style.background = bg; dv.innerHTML = `<div style="font-size:46px">${sel['Mũ / tóc']}</div><div style="font-size:64px;margin-top:-10px">${sel['Khuôn mặt']}</div><div style="font-size:100px;margin-top:-6px">${sel['Trang phục']}</div><div style="font-size:46px">${sel['Giày dép']}</div><div style="font-size:30px;min-height:32px">${sel['Phụ kiện'] === '—' ? '' : sel['Phụ kiện']}</div>`; el.querySelectorAll('[data-e]').forEach(b => b.style.outline = sel[b.dataset.g] === b.dataset.e ? '2px solid var(--md-primary)' : ''); };
      el.onclick = e => { const b = e.target.closest('[data-e]'); if (b) { sel[b.dataset.g] = b.dataset.e; GV.beep(600, 25); draw(); return; } const g = e.target.closest('[data-b]'); if (g) { bg = g.dataset.b; draw(); } };
      $(el, '.rn').onclick = () => { Object.entries(OPT).forEach(([k, v]) => sel[k] = v[GV.rnd(v.length)]); bg = BGS[GV.rnd(BGS.length)]; draw(); };
      $(el, '.sv').onclick = () => { const cv = document.createElement('canvas'); cv.width = 480; cv.height = 660; const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 480, 660); c.textAlign = 'center'; c.textBaseline = 'middle'; [[sel['Mũ / tóc'], 92, 80], [sel['Khuôn mặt'], 128, 170], [sel['Trang phục'], 200, 330], [sel['Giày dép'], 92, 470], [sel['Phụ kiện'] === '—' ? '' : sel['Phụ kiện'], 60, 560]].forEach(([t, s, y]) => { c.font = s + 'px serif'; c.fillText(t, 240, y); }); c.font = '20px sans-serif'; c.fillStyle = '#00000088'; c.fillText('GameVui – Thời trang công chúa', 240, 636); const a = document.createElement('a'); a.download = 'thoi-trang-gamevui.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); };
      draw();
    }
  });

  /* ---------- NHÀ BẾP NHỎ ---------- */
  GV.register({
    id: 'cooking', type: 'game', cat: 'Mô phỏng', name: 'Nhà bếp nhỏ', icon: '🍳', desc: 'Nhiều chảo cùng nấu: chạm lấy món ra đúng lúc vùng xanh (chín tới) – để cháy là mất mạng!',
    mount(el) {
      const DISH = ['🍳', '🥞', '🍗', '🥩', '🍤', '🍕', '🌮'];
      el.innerHTML = hud('cooking', '<span>Mạng: <b class="lv">3</b></span><span>Còn: <b class="tm">60</b>s</span>') + `<div class="row pans" style="gap:12px;align-items:stretch">${[0, 1, 2].map(i => `<button class="pan" data-i="${i}" style="width:min(30vw,130px);min-height:150px;border-radius:18px;border:2px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font:inherit"><span class="d" style="font-size:2.6rem">·</span><span style="width:80%;height:12px;border-radius:9px;background:linear-gradient(90deg,#90A4AE 0 60%,#66BB6A 60% 82%,#EF5350 82%);position:relative;display:block"><i class="mk" style="position:absolute;top:-4px;left:0;width:4px;height:20px;background:#fff;border-radius:3px"></i></span><small class="st" style="color:var(--mut)">Trống</small></button>`).join('')}</div><p class="msg"></p><p class="hint">Chạm chảo khi vạch trắng nằm trong vùng XANH. Lấy sớm ít điểm, để quá vạch đỏ là cháy.</p>`;
      let pans, score, lives, time, over, tmr;
      function reset() { pans = [null, null, null]; score = 0; lives = 3; time = 60; over = false; $(el, '.sc').textContent = 0; $(el, '.lv').textContent = 3; $(el, '.msg').textContent = ''; paint(); }
      function paint() { el.querySelectorAll('.pan').forEach((b, i) => { const p = pans[i]; b.querySelector('.d').textContent = p ? p.e : '·'; b.querySelector('.st').textContent = p ? (p.t < .6 ? 'Đang nấu…' : p.t < .82 ? 'CHÍN TỚI!' : 'Sắp cháy!!') : 'Trống'; b.querySelector('.mk').style.left = p ? Math.min(100, p.t * 100) + '%' : '0'; b.style.borderColor = p && p.t >= .6 && p.t < .82 ? 'var(--ok)' : p && p.t >= .82 ? 'var(--bad)' : 'var(--line)'; }); }
      function tick() { if (over) return; time -= .1; $(el, '.tm').textContent = Math.max(0, Math.ceil(time)); pans.forEach((p, i) => { if (p) { p.t += .1 / p.sec; if (p.t >= 1) { pans[i] = null; lives--; $(el, '.lv').textContent = lives; $(el, '.msg').textContent = '🔥 Cháy mất rồi!'; GV.beep(130, 250); } } else if (Math.random() < .03 + (60 - time) * .0006) pans[i] = { e: DISH[GV.rnd(DISH.length)], t: 0, sec: 3.2 + Math.random() * 2.2 - (60 - time) * .01 }; });
        if (lives <= 0 || time <= 0) { over = true; $(el, '.msg').textContent = (lives <= 0 ? 'Bếp cháy rồi! ' : 'Hết giờ! ') + 'Điểm: ' + score; if (GV.setBest('cooking', score)) $(el, '.bs').textContent = score; } paint(); }
      el.querySelector('.pans').onclick = e => { const b = e.target.closest('.pan'); if (!b || over) return; const i = +b.dataset.i, p = pans[i]; if (!p) return; pans[i] = null; if (p.t >= .6) { const pts = 20 + Math.round((1 - Math.abs(p.t - .71) / .11) * 10); score += pts; $(el, '.msg').textContent = `Ngon tuyệt! +${pts}`; GV.beep(800, 80); } else { score += 3; $(el, '.msg').textContent = 'Hơi sống, +3'; GV.beep(400, 40); } $(el, '.sc').textContent = score; paint(); };
      $(el, '.rs').onclick = () => { clearInterval(tmr); reset(); tmr = setInterval(tick, 100); }; reset(); tmr = setInterval(tick, 100);
      return () => clearInterval(tmr);
    }
  });

  /* ---------- GIẢI ĐỐ IQ ---------- */
  const ODD = [[['🍎', '🍌', '🍇', '🍓'], ['🚗', '🚌', '🚲', '🛵']], [['🐶', '🐱', '🐭', '🐹'], ['🌲', '🌴', '🌵', '🌳']], [['⚽', '🏀', '🏈', '⚾'], ['🎹', '🎸', '🥁', '🎻']], [['☀️', '🌙', '⭐', '☁️'], ['🔴', '🟠', '🟡', '🟢']]];
  GV.register({
    id: 'iqtest', type: 'game', cat: 'Trí tuệ', name: 'Giải đố IQ vui', icon: '🧠', desc: '10 câu tìm quy luật dãy số và tìm vật khác loại – thử sức tư duy logic (chỉ để giải trí).',
    mount(el) {
      el.innerHTML = hud('iqtest', '<span>Câu: <b class="n">1</b>/10</span>') + `<div class="big q" style="font-size:1.8rem;min-height:2.4em;line-height:1.3"></div><div class="row opts" style="max-width:440px"></div><p class="msg"></p><p class="hint">Chỉ số "IQ vui" chỉ mang tính giải trí, không phải bài kiểm tra chuyên môn.</p>`;
      let qs, i, ok, lock, dead = false;
      function series() { const t = GV.rnd(5), a = 1 + GV.rnd(9), d = 2 + GV.rnd(6); let s = []; if (t === 0) for (let k = 0; k < 6; k++) s.push(a + d * k); else if (t === 1) for (let k = 0; k < 6; k++) s.push(a * Math.pow(2, k)); else if (t === 2) for (let k = 1; k <= 6; k++) s.push(k * k + a); else if (t === 3) { s = [a, a + 1]; for (let k = 2; k < 6; k++) s.push(s[k - 1] + s[k - 2]); } else { let v = a; for (let k = 0; k < 6; k++) { s.push(v); v += k % 2 ? -d + 1 : d + 3; } } const ans = s[5]; const o = new Set([ans]); while (o.size < 4) o.add(ans + (GV.rnd(2) ? 1 : -1) * (1 + GV.rnd(9))); return { q: s.slice(0, 5).join(' , ') + ' , ?', a: ans, o: GV.shuffle([...o]) }; }
      function odd() { const [g, h] = ODD[GV.rnd(ODD.length)], [m, x] = GV.rnd(2) ? [g, h] : [h, g], three = GV.shuffle(m.slice()).slice(0, 3), one = x[GV.rnd(4)]; return { q: 'Chọn vật KHÁC LOẠI', a: one, o: GV.shuffle([...three, one]) }; }
      function reset() { qs = Array.from({ length: 10 }, (_, k) => k % 3 === 2 ? odd() : series()); i = 0; ok = 0; $(el, '.sc').textContent = 0; show(); }
      function show() {
        if (i >= qs.length) { const iq = 70 + ok * 6 + (ok === 10 ? 10 : 0); $(el, '.q').textContent = `Đúng ${ok}/10 · IQ vui: ${iq} 🧠`; $(el, '.opts').innerHTML = ''; if (GV.setBest('iqtest', iq)) $(el, '.bs').textContent = iq; $(el, '.sc').textContent = iq; return; }
        const q = qs[i]; lock = false; $(el, '.n').textContent = i + 1; $(el, '.q').textContent = q.q; $(el, '.msg').textContent = ''; $(el, '.opts').innerHTML = q.o.map(v => `<button class="btn ghost" data-v="${GV.esc(String(v))}" style="min-width:84px;min-height:56px;font-size:${typeof v === 'number' ? 20 : 30}px">${GV.esc(String(v))}</button>`).join('');
      }
      $(el, '.opts').onclick = e => { const b = e.target.closest('[data-v]'); if (!b || lock) return; lock = true; const q = qs[i], right = b.dataset.v === String(q.a); if (right) { ok++; GV.beep(700, 60); } else GV.beep(180, 120); b.style.borderColor = right ? 'var(--ok)' : 'var(--bad)'; $(el, '.msg').textContent = right ? 'Chính xác!' : 'Đáp án đúng: ' + q.a; setTimeout(() => { if (!dead) { i++; show(); } }, right ? 500 : 1200); };
      $(el, '.rs').onclick = reset; reset();
      return () => { dead = true; };
    }
  });
})();
