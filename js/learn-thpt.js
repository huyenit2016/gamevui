// THPT: học các môn theo chương trình GDPT 2018 (tóm tắt lý thuyết + bài tập có lời giải + trắc nghiệm). Dữ liệu từng lớp nằm ở js/thpt-<lớp>.js
(function () {
  const esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const T = GV.thpt = { grades: {}, add(grade, subjects) { T.grades[grade] = subjects; } };
  // định dạng nhẹ: **đậm**, dòng bắt đầu "• " là gạch đầu dòng, khối ``` là mã
  const fmt = t => {
    const out = []; let code = null;
    String(t).split('\n').forEach(l => {
      if (l.trim() === '```') { if (code) { out.push('<pre>' + esc(code.join('\n')) + '</pre>'); code = null; } else code = []; return; }
      if (code) { code.push(l); return; }
      if (!l.trim()) return;
      const x = esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      out.push(l.startsWith('• ') ? '<div class="li">' + x.slice(2) + '</div>' : '<p>' + x + '</p>');
    });
    return out.join('');
  };

  GV.register({
    id: 'thpt', type: 'tool', cat: 'Học tập', name: 'THPT lớp 10', icon: '🏫', desc: 'Toán, Lý, Hoá, Anh văn, Tin học lớp 10 theo chương trình GDPT 2018: tóm tắt bài học, bài tập có lời giải chi tiết và trắc nghiệm.',
    mount(el) {
      const st = Object.assign({ grade: 10, done: {}, quiz: {} }, GV.store.get('thpt', {}));
      let view = { k: 'home' };
      const save = () => GV.store.set('thpt', st);
      const subjects = () => T.grades[st.grade] || [];
      const lessonKey = (s, l) => st.grade + ':' + s.id + ':' + l.id;
      const all = s => [].concat(...s.chapters.map(c => c.lessons));
      el.innerHTML = `<style>.th{max-width:680px;width:100%;text-align:left}.th h3{margin:6px 0}.th .gr{display:flex;gap:6px;justify-content:center;margin-bottom:8px}.th .gr button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.th .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.th .sc{padding:14px 10px;border-radius:16px;background:var(--md-sc-high,#2b292d);border:1px solid var(--line);cursor:pointer;text-align:center;color:var(--fg);font:inherit}.th .sc .e{font-size:2rem}.th .sc b{display:block}.th .pb{height:6px;border-radius:4px;background:var(--line);overflow:hidden;margin-top:8px}.th .pb i{display:block;height:100%;background:var(--ok)}.th .ch{font-weight:700;margin:14px 0 6px;color:var(--mut)}.th .ls{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;margin:4px 0;border-radius:12px;background:var(--md-sc-high,#2b292d);border:1px solid var(--line);color:var(--fg);font:inherit;text-align:left;cursor:pointer}.th .ls.dn{border-color:var(--ok)}.th .body p{margin:6px 0;line-height:1.55}.th .li{margin:3px 0 3px 10px;padding-left:12px;position:relative;line-height:1.5}.th .li:before{content:"•";position:absolute;left:0;color:var(--md-primary,#D0BCFF)}.th pre{background:#0006;border-radius:10px;padding:10px;overflow-x:auto;font-size:13px;line-height:1.45}.th .ex{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin:10px 0;background:var(--md-sc-low,#211f23)}.th .sol{margin-top:8px;padding:8px 10px;border-radius:10px;background:var(--t-ok,rgba(34,197,94,.1));display:none}.th .sol.open{display:block}.th .ans{font-weight:700;color:var(--ok)}.th .opt{display:block;width:100%;text-align:left;margin:6px 0;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);font:inherit;cursor:pointer}.th .opt.ok{border-color:var(--ok);background:rgba(34,197,94,.15)}.th .opt.bad{border-color:var(--bad);background:rgba(239,68,68,.15)}.th .nav{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}</style><div class="th"></div>`;
      const root = $(el, '.th');
      const prog = s => { const L = all(s), d = L.filter(l => st.done[lessonKey(s, l)]).length; return [d, L.length]; };

      function home() {
        const g = Object.keys(T.grades);
        root.innerHTML = `<div class="gr"><button class="btn ghost on">Lớp 10</button><button class="btn ghost" disabled title="Sắp có">Lớp 11 · sắp có</button><button class="btn ghost" disabled title="Sắp có">Lớp 12 · sắp có</button></div>
        <p class="hint" style="text-align:center">Nội dung bám sát chương trình GDPT 2018 (Toán, Vật lí, Hoá học, Tiếng Anh, Tin học). Đây là bản tóm tắt tự biên soạn kèm bài tập mẫu có lời giải – hãy dùng song song với sách giáo khoa của trường bạn.</p>
        <div class="sg">${subjects().map(s => { const [d, n] = prog(s); return `<button class="sc" data-s="${s.id}"><span class="e">${s.icon}</span><b>${esc(s.name)}</b><small class="hint">${d}/${n} bài</small><div class="pb"><i style="width:${n ? d / n * 100 : 0}%"></i></div></button>`; }).join('')}</div>`;
        void g;
      }
      function subj(s) {
        const q = st.quiz[st.grade + ':' + s.id];
        root.innerHTML = `<div class="nav"><button class="btn ghost" data-go="home">← Môn học</button><button class="btn" data-quiz="${s.id}">📝 Trắc nghiệm${q ? ' · tốt nhất ' + q + '/' + s.quiz.length : ''}</button></div><h3>${s.icon} ${esc(s.name)} lớp ${st.grade}</h3>` +
          s.chapters.map(c => `<div class="ch">${esc(c.n)}</div>` + c.lessons.map(l => `<button class="ls${st.done[lessonKey(s, l)] ? ' dn' : ''}" data-l="${s.id}|${l.id}">${st.done[lessonKey(s, l)] ? '✅' : '📖'} <span>${esc(l.n)}</span></button>`).join('')).join('');
      }
      function lesson(s, l) {
        const L = all(s), i = L.indexOf(l), done = st.done[lessonKey(s, l)];
        root.innerHTML = `<div class="nav"><button class="btn ghost" data-s2="${s.id}">← ${esc(s.name)}</button></div><h3>${esc(l.n)}</h3><div class="body">${fmt(l.theory)}</div><h3>✏️ Bài tập có lời giải</h3>
        ${l.ex.map((e, k) => `<div class="ex"><div class="body">${fmt('**Bài ' + (k + 1) + '.** ' + e.q)}</div><button class="btn ghost" data-sol="${k}">👁 Xem lời giải</button><div class="sol" id="sol${k}"><div class="body">${fmt(e.s)}</div><p class="ans">Đáp số: ${esc(e.a)}</p></div></div>`).join('')}
        <div class="nav"><button class="btn${done ? ' ghost' : ''}" data-done="1">${done ? '✅ Đã học xong' : '✔ Đánh dấu đã học'}</button>${i > 0 ? `<button class="btn ghost" data-l="${s.id}|${L[i - 1].id}">← Bài trước</button>` : ''}${i < L.length - 1 ? `<button class="btn ghost" data-l="${s.id}|${L[i + 1].id}">Bài sau →</button>` : ''}</div>`;
        view = { k: 'lesson', s, l };
        root.scrollIntoView && 0;
      }
      function quiz(s, qi, score, picked, QQ) {
        const Q = QQ || s.quiz.map(q => { const o = q.o.map((_, i) => i).sort(() => Math.random() - .5); return { q: q.q, o: o.map(i => q.o[i]), a: o.indexOf(q.a), e: q.e }; });
        if (qi >= Q.length) { const key = st.grade + ':' + s.id; if (!st.quiz[key] || score > st.quiz[key]) st.quiz[key] = score; save(); root.innerHTML = `<h3>Kết quả: ${score}/${Q.length}</h3><p>${score === Q.length ? '🎉 Xuất sắc!' : score >= Q.length * .6 ? '👍 Khá tốt, ôn lại các câu sai nhé.' : '💪 Hãy xem lại lý thuyết rồi làm lại.'}</p><div class="nav"><button class="btn" data-quiz="${s.id}">Làm lại</button><button class="btn ghost" data-s2="${s.id}">← ${esc(s.name)}</button></div>`; return; }
        const q = Q[qi];
        root.innerHTML = `<div class="nav"><button class="btn ghost" data-s2="${s.id}">← Thoát</button><span class="hint">Câu ${qi + 1}/${Q.length} · Điểm ${score}</span></div><div class="body">${fmt(q.q)}</div>${q.o.map((o, k) => `<button class="opt${picked != null ? (k === q.a ? ' ok' : k === picked ? ' bad' : '') : ''}" data-opt="${k}" ${picked != null ? 'disabled' : ''}>${String.fromCharCode(65 + k)}. ${esc(o)}</button>`).join('')}${picked != null ? `<div class="sol open"><div class="body">${fmt(q.e)}</div></div><div class="nav"><button class="btn" data-nextq="1">${qi + 1 < Q.length ? 'Câu tiếp →' : 'Xem kết quả'}</button></div>` : ''}`;
        view = { k: 'quiz', s, qi, score, picked, Q };
      }
      home();
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s) { const s = subjects().find(x => x.id === b.dataset.s); view = { k: 'subj', s }; subj(s); }
        else if (b.dataset.go) { view = { k: 'home' }; home(); }
        else if (b.dataset.s2) { const s = subjects().find(x => x.id === b.dataset.s2); view = { k: 'subj', s }; subj(s); }
        else if (b.dataset.l) { const [sid, lid] = b.dataset.l.split('|'), s = subjects().find(x => x.id === sid); lesson(s, all(s).find(x => x.id === lid)); }
        else if (b.dataset.sol != null) { const d = $(root, '#sol' + b.dataset.sol); d.classList.toggle('open'); b.textContent = d.classList.contains('open') ? '🙈 Ẩn lời giải' : '👁 Xem lời giải'; }
        else if (b.dataset.done) { const k = lessonKey(view.s, view.l); st.done[k] = !st.done[k]; save(); lesson(view.s, view.l); }
        else if (b.dataset.quiz) { const s = subjects().find(x => x.id === b.dataset.quiz); quiz(s, 0, 0, null); }
        else if (b.dataset.opt != null) { const k = +b.dataset.opt, v = view, sc = v.score + (k === v.Q[v.qi].a ? 1 : 0); quiz(v.s, v.qi, sc, k, v.Q); }
        else if (b.dataset.nextq) { quiz(view.s, view.qi + 1, view.score, null, view.Q); }
      });
      GV.thptT = { get st() { return st; } };
      return () => {};
    }
  });
})();
