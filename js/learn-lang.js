// Học ngoại ngữ (Anh / Nhật / Hàn / Trung): flashcard lặp lại ngắt quãng, đề kiểm tra tự động, tạo khoá học từ tệp.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const day = 864e5, GAP = [0, 1, 3, 7, 14];

  /* ---------- Kho khoá học ---------- */
  const store = {
    custom: () => GV.store.get('learn_courses', []),
    saveAll: a => GV.store.set('learn_courses', a),
    all() { return Object.values(L.BUILTIN).concat(this.custom()); },
    byLang(l) { return this.all().filter(c => c.lang === l); },
    find(id) { return this.all().find(c => c.id === id); },
    add(c) { const a = this.custom(); a.push(c); this.saveAll(a); },
    remove(id) { this.saveAll(this.custom().filter(c => c.id !== id)); GV.store.set('lp_' + id, null); }
  };
  L.courses = store;
  const flat = c => c.units.flatMap((u, ui) => u.items.map(it => Object.assign({ ui }, it)));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
  L.norm = norm;

  /* ---------- Sinh đề tự động ---------- */
  const TYPES = { mcT: 'Xem từ → chọn nghĩa', mcM: 'Xem nghĩa → chọn từ', type: 'Xem nghĩa → gõ từ', listen: 'Nghe → chọn từ' };
  function makeQuestions(items, pool, n, types) {
    const qs = [], src = GV.shuffle(items.slice());
    const uniq = (arr, f, exclude) => { const seen = new Set([exclude]); const out = []; GV.shuffle(arr.slice()).forEach(x => { const v = f(x); if (v && !seen.has(v)) { seen.add(v); out.push(v); } }); return out; };
    for (let i = 0; i < n; i++) {
      const it = src[i % src.length]; let type = types[i % types.length];
      const dM = uniq(pool, x => x.m, it.m), dT = uniq(pool, x => x.t, it.t);
      if ((type === 'mcT' && dM.length < 1) || ((type === 'mcM' || type === 'listen') && dT.length < 1)) type = 'type';
      const q = { type, it };
      if (type === 'mcT') { q.prompt = it.t; q.sub = it.r; q.opts = GV.shuffle([it.m, ...dM.slice(0, 3)]); q.ans = it.m; }
      else if (type === 'mcM') { q.prompt = it.m; q.opts = GV.shuffle([it.t, ...dT.slice(0, 3)]); q.ans = it.t; }
      else if (type === 'listen') { q.prompt = '🔊'; q.opts = GV.shuffle([it.t, ...dT.slice(0, 3)]); q.ans = it.t; }
      else { q.prompt = it.m; q.ans = it.t; }
      qs.push(q);
    }
    return qs;
  }
  const checkTyped = (q, a) => { const x = norm(a); return !!x && (x === norm(q.it.t) || (q.it.r && x === norm(q.it.r))); };
  function examText(course, qs) {
    let t = `ĐỀ KIỂM TRA – ${course.name}\nHọ tên: ............................  Ngày: ..........\n\n`;
    qs.forEach((q, i) => {
      t += `Câu ${i + 1}. ` + ({ mcT: `Nghĩa của "${q.it.t}"${q.it.r ? ' (' + q.it.r + ')' : ''} là:`, mcM: `Từ nào có nghĩa "${q.it.m}"?`, listen: 'Nghe giáo viên đọc và chọn từ đúng:', type: `Viết từ có nghĩa "${q.it.m}": ..............................` }[q.type]) + '\n';
      if (q.opts) q.opts.forEach((o, k) => { t += `   ${'ABCD'[k]}. ${o}\n`; });
      t += '\n';
    });
    t += '--- ĐÁP ÁN ---\n' + qs.map((q, i) => `Câu ${i + 1}: ${q.opts ? 'ABCD'[q.opts.indexOf(q.ans)] + '. ' : ''}${q.ans}${q.it.r ? ' (' + q.it.r + ')' : ''}`).join('\n') + '\n';
    return t;
  }

  /* ---------- Giao diện học một khoá ---------- */
  L.study = function (root, course, onBack) {
    const lang = course.lang, items0 = flat(course);
    let unit = -1, mode = 'cards';
    const progKey = 'lp_' + course.id, prog = () => GV.store.get(progKey, {});
    const cur = () => unit < 0 ? items0 : items0.filter(i => i.ui === unit);
    let session = null;
    function head() {
      root.innerHTML = `<div class="tool" style="max-width:720px">
        <div class="row" style="justify-content:space-between"><b>${L.LANGS[lang].flag} ${esc(course.name)}</b>${onBack ? '<button class="btn ghost back" style="padding:5px 12px">← Đổi khoá</button>' : ''}</div>
        <div class="row"><select class="un"><option value="-1">Tất cả bài (${items0.length} từ)</option>${course.units.map((u, i) => `<option value="${i}" ${i === unit ? 'selected' : ''}>${esc(u.title)} (${u.items.length})</option>`).join('')}</select></div>
        <div class="row tabs2">${[['cards', '🃏 Flashcard'], ['test', '📝 Kiểm tra'], ['list', '📖 Danh sách từ']].map(([k, n]) => `<button class="pbtn ${mode === k ? 'sel' : ''}" data-m="${k}">${n}</button>`).join('')}</div>
        <div class="body"></div></div>`;
      $(root, '.un').value = unit;
      $(root, '.un').onchange = e => { unit = +e.target.value; render(); };
      root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; session = null; head(); render(); });
      if (onBack) $(root, '.back').onclick = onBack;
    }
    const body = () => $(root, '.body');

    function render() { ({ cards, test, list })[mode](); }

    /* --- Flashcard --- */
    function cards() {
      const p = prog(), now = Date.now();
      if (!session || session.kind !== 'cards') {
        const due = cur().filter(i => !p[i.t] || p[i.t].d <= now).sort((a, b) => ((p[a.t] || {}).b || 0) - ((p[b.t] || {}).b || 0));
        session = { kind: 'cards', q: GV.shuffle(due), flip: false, rev: false, done: 0 };
      }
      const s = session, it = s.q[0], known = cur().filter(i => p[i.t] && p[i.t].b >= 3).length;
      if (!it) { body().innerHTML = `<div class="msg">🎉 Đã ôn xong các thẻ đến hạn hôm nay!</div><div class="hint">Đã thuộc kỹ: ${known}/${cur().length} từ. Quay lại ngày mai để ôn tiếp theo lịch lặp lại ngắt quãng.</div><div class="row"><button class="btn again">Ôn lại tất cả</button></div>`; $(root, '.again').onclick = () => { GV.store.set(progKey, null); session = null; render(); }; return; }
      const front = s.rev ? it.m : it.t, back = s.rev ? it.t : it.m;
      body().innerHTML = `<div class="hint">Còn ${s.q.length} thẻ · đã thuộc kỹ ${known}/${cur().length}</div>
        <div class="fc" style="background:var(--inp);border:1px solid var(--line);border-radius:18px;min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:18px;cursor:pointer;text-align:center">
          <div style="font-size:2.3rem;font-weight:800">${esc(front)}</div>
          ${!s.rev && it.r ? `<div class="hint" style="font-size:16px">${esc(it.r)}</div>` : ''}
          ${s.flip ? `<hr style="width:60%;border-color:var(--line)"><div style="font-size:1.4rem;color:var(--ok);font-weight:700">${esc(back)}</div>${s.rev && it.r ? `<div class="hint">${esc(it.r)}</div>` : ''}${it.e ? `<div class="hint">${esc(it.e)}</div>` : ''}` : '<div class="hint">Chạm để xem đáp án</div>'}
        </div>
        <div class="row"><button class="pbtn sp">🔊 Nghe</button><button class="pbtn rv">⇄ Đảo chiều</button></div>
        ${s.flip ? '<div class="row"><button class="btn bad no">✗ Chưa nhớ</button><button class="btn ok yes">✓ Nhớ rồi</button></div>' : ''}`;
      $(root, '.fc').onclick = () => { s.flip = true; L.unlock(); L.speak(it.t, lang); render(); };
      $(root, '.sp').onclick = () => { L.unlock(); L.speak(it.t, lang); };
      $(root, '.rv').onclick = () => { s.rev = !s.rev; s.flip = false; render(); };
      const rate = good => { const pr = prog(), e = pr[it.t] || { b: 0 }; e.b = good ? Math.min(4, e.b + 1) : 0; e.d = Date.now() + (good ? GAP[e.b] * day : 0); pr[it.t] = e; GV.store.set(progKey, pr); s.q.shift(); if (!good) s.q.push(it); s.flip = false; render(); };
      if (s.flip) { $(root, '.yes').onclick = () => rate(true); $(root, '.no').onclick = () => rate(false); }
    }

    /* --- Kiểm tra --- */
    function test() {
      const pool = items0, items = cur();
      if (items.length < 1) { body().innerHTML = '<div class="msg">Bài này chưa có từ nào.</div>'; return; }
      if (!session || session.kind !== 'test') {
        body().innerHTML = `<div class="col" style="max-width:none"><label>Số câu <select class="nq">${[5, 10, 20, 30].filter(n => n <= Math.max(5, items.length * 2)).map(n => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <div>${Object.entries(TYPES).map(([k, n]) => `<label style="display:block"><input type="checkbox" class="ty" value="${k}" checked> ${n}</label>`).join('')}</div>
          <div class="row"><button class="btn go">▶ Bắt đầu kiểm tra</button><button class="btn ghost ex">⬇️ Tải đề thi (.txt)</button></div>
          <div class="hint">Đề được sinh tự động từ ${items.length} từ của ${unit < 0 ? 'cả khoá' : 'bài đã chọn'}; đáp án nhiễu lấy từ các từ khác trong khoá.</div>${histHTML()}</div>`;
        const opts = () => ({ n: +$(root, '.nq').value, types: [...root.querySelectorAll('.ty:checked')].map(x => x.value) });
        $(root, '.go').onclick = () => { const o = opts(); if (!o.types.length) return; session = { kind: 'test', qs: makeQuestions(items, pool, o.n, o.types), i: 0, ok: 0, wrong: [] }; render(); };
        $(root, '.ex').onclick = () => { const o = opts(); if (!o.types.length) return; L.download(`de-thi-${course.name}.txt`, examText(course, makeQuestions(items, pool, o.n, o.types))); };
        return;
      }
      const s = session;
      if (s.i >= s.qs.length) return result();
      const q = s.qs[s.i];
      body().innerHTML = `<div class="hint">Câu ${s.i + 1}/${s.qs.length} · đúng ${s.ok}</div><div style="height:6px;background:var(--inp);border-radius:9px"><div style="height:6px;width:${s.i / s.qs.length * 100}%;background:var(--grad);border-radius:9px"></div></div>
        <div class="hint">${TYPES[q.type]}</div>
        <div style="font-size:2rem;font-weight:800;text-align:center;margin:8px 0">${esc(q.prompt)}</div>${q.sub ? `<div class="hint" style="text-align:center">${esc(q.sub)}</div>` : ''}
        ${q.type === 'listen' ? '<div class="row"><button class="pbtn pl">🔊 Nghe lại</button></div>' : ''}
        ${q.opts ? `<div class="col" style="max-width:none">${q.opts.map((o, k) => `<button class="pbtn opt" data-o="${k}" style="text-align:left">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}</div>`
          : '<div class="row"><input class="ti" placeholder="Gõ đáp án…" style="flex:1" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn sub">Trả lời</button></div>'}
        <div class="fb"></div>`;
      if (q.type === 'listen') { L.unlock(); L.speak(q.it.t, lang); $(root, '.pl').onclick = () => L.speak(q.it.t, lang); }
      let answered = false;
      const fin = good => {
        if (answered) return; answered = true; good ? s.ok++ : s.wrong.push(q.it);
        if (q.type !== 'type') root.querySelectorAll('.opt').forEach(b => { const right = q.opts[+b.dataset.o] === q.ans; b.disabled = true; if (right) b.style.outline = '2px solid var(--ok)'; });
        $(root, '.fb').innerHTML = `<div class="msg" style="color:var(--${good ? 'ok' : 'bad'})">${good ? '✅ Chính xác!' : '❌ Chưa đúng'}</div><div class="hint" style="text-align:center">${esc(q.it.t)}${q.it.r ? ' (' + esc(q.it.r) + ')' : ''} = ${esc(q.it.m)}</div><div class="row"><button class="btn nx">Câu tiếp ▶</button></div>`;
        L.speak(q.it.t, lang); $(root, '.nx').onclick = () => { s.i++; render(); }; $(root, '.nx').focus();
      };
      if (q.opts) root.querySelectorAll('.opt').forEach(b => b.onclick = () => { const good = q.opts[+b.dataset.o] === q.ans; if (!good) b.style.outline = '2px solid var(--bad)'; fin(good); });
      else { const go = () => fin(checkTyped(q, $(root, '.ti').value)); $(root, '.sub').onclick = go; $(root, '.ti').onkeydown = e => { if (e.key === 'Enter') go(); }; $(root, '.ti').focus(); }
    }
    function result() {
      const s = session, pct = Math.round(s.ok / s.qs.length * 100);
      if (L.library) L.library.saveResult(course.name, s.ok, s.qs.length);
      const h = GV.store.get('learn_hist', []); h.unshift({ c: course.name, ok: s.ok, n: s.qs.length, at: Date.now() }); GV.store.set('learn_hist', h.slice(0, 30));
      body().innerHTML = `<div class="big" style="color:var(--${pct >= 80 ? 'ok' : pct >= 50 ? 'acc' : 'bad'})">${pct}%</div><div class="msg">${s.ok}/${s.qs.length} câu đúng ${pct >= 80 ? '🎉 Xuất sắc!' : pct >= 50 ? '👍 Khá tốt' : '💪 Cố lên, ôn thêm nhé'}</div>
        ${s.wrong.length ? `<div class="box" style="text-align:left"><b>Cần ôn lại:</b><br>${s.wrong.map(w => `${esc(w.t)}${w.r ? ' (' + esc(w.r) + ')' : ''} = ${esc(w.m)}`).join('<br>')}</div>` : ''}
        <div class="row">${s.wrong.length ? '<button class="btn rw">🔁 Làm lại câu sai</button>' : ''}<button class="btn ghost nw">Bài kiểm tra mới</button></div>`;
      if (s.wrong.length) $(root, '.rw').onclick = () => { session = { kind: 'test', qs: makeQuestions(s.wrong, items0, s.wrong.length, ['mcT', 'mcM', 'type']), i: 0, ok: 0, wrong: [] }; render(); };
      $(root, '.nw').onclick = () => { session = null; render(); };
    }
    function histHTML() {
      const h = GV.store.get('learn_hist', []).filter(x => x.c === course.name).slice(0, 5);
      return h.length ? `<div class="hint" style="text-align:left">Lần gần đây: ${h.map(x => `${x.ok}/${x.n} (${new Date(x.at).toLocaleDateString('vi-VN')})`).join(' · ')}</div>` : '';
    }

    /* --- Danh sách --- */
    function list() {
      body().innerHTML = `<table class="list">${course.units.map((u, ui) => (unit < 0 || unit === ui) ? `<tr><th colspan="3">${esc(u.title)}</th></tr>` + u.items.map((it, k) => `<tr><td><b>${esc(it.t)}</b> <a href="#" data-s="${ui}:${k}">🔊</a></td><td class="hint">${esc(it.r || '')}</td><td>${esc(it.m)}</td></tr>`).join('') : '').join('')}</table>`;
      body().onclick = e => { const a = e.target.closest('[data-s]'); if (!a) return; e.preventDefault(); L.unlock(); const [u, k] = a.dataset.s.split(':'); L.speak(course.units[u].items[k].t, lang); };
    }
    head(); render();
  };

  /* ---------- Công cụ: Học ngoại ngữ ---------- */
  GV.register({
    id: 'lang', type: 'tool', cat: 'Học tập', name: 'Học ngoại ngữ', icon: '🌏', desc: 'Anh · Nhật · Hàn · Trung: flashcard, kiểm tra tự động, nghe đọc.',
    mount(el) {
      let sel = GV.store.get('learn_lang', 'en');
      function home() {
        const cs = store.byLang(sel);
        el.innerHTML = `<div class="tool" style="max-width:720px"><div class="row">${['en', 'ja', 'ko', 'zh'].map(k => `<button class="pbtn ${k === sel ? 'sel' : ''}" data-l="${k}" style="font-size:16px">${L.LANGS[k].flag} ${L.LANGS[k].name}</button>`).join('')}</div>
          <div class="col" style="max-width:none">${cs.map(c => `<div class="box row" style="justify-content:space-between;text-align:left"><span><b>${esc(c.name)}</b><br><span class="hint">${c.units.length} bài · ${flat(c).length} từ${c.id.startsWith('b-') ? ' · có sẵn' : ' · của bạn'}</span></span><button class="btn" data-c="${c.id}" style="padding:6px 16px">Học ▶</button></div>`).join('') || '<div class="hint">Chưa có khoá nào.</div>'}</div>
          <div class="box lib" style="text-align:left"><b>📥 Thư viện cộng đồng</b> <span class="hint">(khoá do giáo viên / cộng tác viên đăng)</span><div class="ll hint">Đang tải…</div></div>
          <a class="btn ghost" href="#/tool/coursemaker">➕ Tạo khoá học riêng từ tệp (CSV / JSON)</a>
          <div class="hint">Mẹo: học 10 phút mỗi ngày hiệu quả hơn học dồn. Thẻ "Chưa nhớ" sẽ quay lại ngay, thẻ "Nhớ rồi" sẽ hiện lại sau 1 → 3 → 7 → 14 ngày.</div></div>`;
        el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { sel = b.dataset.l; GV.store.set('learn_lang', sel); home(); });
        el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => L.study(el, store.find(b.dataset.c), home));
        libBlock();
      }
      function libBlock() {
        const box = el.querySelector('.ll'); if (!box || !L.library || !GV.fbInfo().cfg()) { if (box) box.textContent = 'Thư viện cần kết nối Firebase.'; return; }
        Promise.all([L.library.list(sel).catch(() => null), L.library.assigned().catch(() => [])]).then(([list, asg]) => {
          if (!box.isConnected) return;
          if (list === null) { box.textContent = 'Không tải được thư viện.'; return; }
          const have = new Set(store.custom().map(c => c.lib));
          const asgHtml = asg.length ? `<div class="hint" style="margin-top:6px">📌 <b>Bài được giao cho bạn</b></div>` + asg.map(a => `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:4px 0"><span>${esc(a.name || a.cid)} <span class="hint">· GV ${esc(a.byName || '')}</span></span><button class="pbtn" data-imp="${esc(a.cid)}">${have.has(a.cid) ? 'Mở' : 'Nhận bài'}</button></div>`).join('') : '';
          box.innerHTML = asgHtml + (list.length ? list.slice(0, 15).map(m => `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:4px 0"><span>${esc(m.name)} <span class="hint">· ${m.n || '?'} từ · ${esc(m.byName || '')}</span></span><button class="pbtn" data-imp="${m.id}">${have.has(m.id) ? 'Mở' : 'Nhập'}</button></div>`).join('') : '<div class="hint">Chưa có khoá nào cho ngôn ngữ này.</div>');
          box.onclick = async e => { const b = e.target.closest('[data-imp]'); if (!b) return; b.disabled = true; try { const c = await L.library.importToLocal(b.dataset.imp); L.study(el, c, home); } catch (x) { b.disabled = false; GV.toast && GV.toast(x.message, { type: 'error' }); } };
        });
      }
      home();
    }
  });

  /* ---------- Công cụ: Tạo khoá học & đề thi ---------- */
  const ALIAS = { t: ['term', 'word', 'front', 'question', 'từ', 'tu', 'tuvung', 'từ vựng', 'cau', 'câu', 'vocabulary', 't'], r: ['reading', 'pron', 'pronunciation', 'romaji', 'pinyin', 'phonetic', 'cách đọc', 'cach doc', 'phiên âm', 'phien am', 'r', 'romanization'], m: ['meaning', 'definition', 'back', 'answer', 'nghĩa', 'nghia', 'vi', 'dịch', 'dich', 'translation', 'đáp án', 'm'], e: ['example', 'ví dụ', 'vi du', 'sentence', 'e'], unit: ['unit', 'lesson', 'chapter', 'bài', 'bai', 'chủ đề', 'chu de', 'topic', 'nhóm', 'group'] };
  const keyOf = h => { const x = String(h || '').trim().toLowerCase(); return Object.keys(ALIAS).find(k => ALIAS[k].includes(x)); };
  function buildCourse(rows, name, lang) { // rows: [{unit,t,r,m,e}]
    const units = []; const map = {};
    rows.forEach(r => { const u = (r.unit || 'Bài 1').trim() || 'Bài 1'; if (!map[u]) { map[u] = { title: u, items: [] }; units.push(map[u]); } map[u].items.push({ t: String(r.t).trim(), r: String(r.r || '').trim(), m: String(r.m).trim(), e: String(r.e || '').trim() }); });
    return { id: 'c' + Date.now().toString(36), lang, name, units };
  }
  function parseImport(text) {
    const tx = text.replace(/^﻿/, '').trim(); if (!tx) return { rows: [], err: 'Chưa có nội dung.' };
    if (tx[0] === '{' || tx[0] === '[') { // JSON
      let j; try { j = JSON.parse(tx); } catch (e) { return { rows: [], err: 'JSON không hợp lệ: ' + e.message }; }
      const out = [], pick = (o, k) => { for (const a of [k, ...ALIAS[k]]) if (o[a] != null && o[a] !== '') return o[a]; };
      const push = (o, unit) => { const t = pick(o, 't'), m = pick(o, 'm'); if (t && m) out.push({ unit: pick(o, 'unit') || unit, t, r: pick(o, 'r') || '', m, e: pick(o, 'e') || '' }); };
      if (Array.isArray(j)) j.forEach(o => push(o, ''));
      else (j.units || []).forEach(u => (u.items || u.words || []).forEach(o => push(o, u.title || u.name || '')));
      return { rows: out, name: j.name, lang: j.lang, err: out.length ? null : 'Không tìm thấy mục từ nào (cần có từ và nghĩa).' };
    }
    let t2 = tx; const l0 = tx.split(/\r?\n/)[0];
    if (!/[,;\t|]/.test(l0)) t2 = tx.split(/\r?\n/).map(l => l.replace(/\s+[-–=:]\s+/, '\t')).join('\n'); // "hello - xin chào"
    const grid = L.parseCSV(t2); if (!grid.length) return { rows: [], err: 'Không đọc được dữ liệu.' };
    const hdr = grid[0].map(keyOf), hasH = hdr.includes('t') && hdr.includes('m');
    let cols = hasH ? hdr : (grid[0].length === 2 ? ['t', 'm'] : ['t', 'r', 'm', 'e', 'unit']);
    const out = []; grid.slice(hasH ? 1 : 0).forEach(r => { const o = {}; cols.forEach((k, i) => { if (k && r[i] != null) o[k] = r[i]; }); if (o.t && o.m) out.push(o); });
    return { rows: out, err: out.length ? null : 'Không tìm thấy dòng hợp lệ (cần ít nhất cột từ và nghĩa).' };
  }
  const TEMPLATE = 'unit,term,reading,meaning,example\nChào hỏi,こんにちは,konnichiwa,Xin chào,\nChào hỏi,ありがとう,arigatou,Cảm ơn,ありがとうございます\nSố đếm,一,ichi,một,\n';

  GV.register({
    id: 'coursemaker', type: 'tool', cat: 'Học tập', name: 'Tạo khoá học & đề thi', icon: '🛠️', desc: 'Nạp file CSV/JSON → có ngay khoá học, flashcard và đề kiểm tra tự động.',
    mount(el) {
      let preview = null;
      function home(msg) {
        const cs = store.custom();
        el.innerHTML = `<div class="tool" style="max-width:760px">
          <div class="box" style="text-align:left"><b>1. Nạp dữ liệu</b>
            <div class="hint">Mỗi dòng: <code>bài, từ, cách đọc, nghĩa, ví dụ</code> (chỉ cần cột <b>từ</b> và <b>nghĩa</b>). File CSV/TSV/TXT hoặc JSON. Lưu Excel sang CSV (UTF-8) rồi nạp vào.</div>
            <div class="row" style="justify-content:flex-start;margin-top:8px"><input type="file" class="fi" accept=".csv,.tsv,.txt,.json,text/*,application/json"><button class="btn ghost tp" style="padding:5px 12px">⬇️ File mẫu</button></div>
            <textarea class="ta" placeholder="…hoặc dán thẳng nội dung vào đây. Ví dụ:&#10;hello, xin chào&#10;goodbye - tạm biệt" style="min-height:110px;margin-top:8px"></textarea>
            <div class="row" style="justify-content:flex-start"><input class="nm" placeholder="Tên khoá học" style="flex:1;min-width:140px"><select class="lg">${['en', 'ja', 'ko', 'zh'].map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select><button class="btn pv">Xem trước</button></div></div>
          <div class="pvbox"></div><div class="msg">${msg || ''}</div>
          <div class="box" style="text-align:left"><b>Khoá học của tôi (${cs.length})</b>${cs.map(c => `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:6px 0"><span>${L.LANGS[c.lang].flag} <b>${esc(c.name)}</b> <span class="hint">${c.units.length} bài · ${flat(c).length} từ</span></span><span class="row"><button class="pbtn" data-s="${c.id}">📖 Học / Thi</button><button class="pbtn" data-u="${c.id}">📤 Đăng</button><button class="pbtn" data-j="${c.id}">JSON</button><button class="pbtn" data-v="${c.id}">CSV</button><button class="pbtn" data-d="${c.id}">🗑</button></span></div>`).join('') || '<div class="hint">Chưa có khoá nào.</div>'}</div></div>`;
        $(el, '.tp').onclick = () => L.download('mau-khoa-hoc.csv', TEMPLATE, 'text/csv;charset=utf-8');
        $(el, '.fi').onchange = async e => { const f = e.target.files[0]; if (!f) return; $(el, '.ta').value = await L.readFile(f); if (!$(el, '.nm').value) $(el, '.nm').value = f.name.replace(/\.[^.]+$/, ''); doPreview(); };
        $(el, '.pv').onclick = doPreview;
        el.onclick = e => {
          const b = e.target.closest('button[data-s],button[data-j],button[data-v],button[data-d],button[data-u]'); if (!b) return;
          const id = b.dataset.s || b.dataset.j || b.dataset.v || b.dataset.d || b.dataset.u, c = store.find(id); if (!c) return;
          if (b.dataset.u) { L.library.publish(c).then(() => GV.toast && GV.toast('Đã đăng "' + c.name + '" lên thư viện cộng đồng!', { type: 'success' })).catch(x => GV.toast && GV.toast(x.message, { type: 'error' })); }
          else if (b.dataset.s) L.study(el, c, () => home());
          else if (b.dataset.j) L.download(c.name + '.json', JSON.stringify({ name: c.name, lang: c.lang, units: c.units }, null, 1), 'application/json');
          else if (b.dataset.v) L.download(c.name + '.csv', 'unit,term,reading,meaning,example\n' + c.units.flatMap(u => u.items.map(i => [u.title, i.t, i.r, i.m, i.e].map(L.csvEsc).join(','))).join('\n'), 'text/csv;charset=utf-8');
          else if (confirm('Xoá khoá "' + c.name + '"?')) { store.remove(id); home('Đã xoá.'); }
        };
      }
      function doPreview() {
        const r = parseImport($(el, '.ta').value), box = $(el, '.pvbox');
        if (r.err) { preview = null; box.innerHTML = `<div class="msg" style="color:var(--bad)">${esc(r.err)}</div>`; return; }
        if (r.name && !$(el, '.nm').value) $(el, '.nm').value = r.name; if (r.lang && L.LANGS[r.lang]) $(el, '.lg').value = r.lang;
        const name = $(el, '.nm').value.trim() || 'Khoá học mới'; preview = buildCourse(r.rows, name, $(el, '.lg').value);
        const n = flat(preview).length;
        box.innerHTML = `<div class="box" style="text-align:left"><b>✅ Đọc được ${n} từ trong ${preview.units.length} bài</b> (${preview.units.map(u => esc(u.title) + ': ' + u.items.length).join(' · ')})
          <table class="list">${flat(preview).slice(0, 6).map(i => `<tr><td><b>${esc(i.t)}</b></td><td class="hint">${esc(i.r)}</td><td>${esc(i.m)}</td></tr>`).join('')}</table>${n > 6 ? '<div class="hint">…</div>' : ''}
          <div class="row"><button class="btn ok sv">💾 Lưu khoá học &amp; tạo đề thi tự động</button></div></div>`;
        $(el, '.sv').onclick = () => { preview.name = $(el, '.nm').value.trim() || name; preview.lang = $(el, '.lg').value; store.add(preview); const c = preview; preview = null; L.study(el, c, () => home()); };
      }
      home();
    }
  });
  L.parseImport = parseImport; L.buildCourse = buildCourse; L.flat = flat; L.TEMPLATE = TEMPLATE;
})();
