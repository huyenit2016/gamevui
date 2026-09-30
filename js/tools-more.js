// Tiện ích nhóm bạn: Chia tiền, Chia đội, Bảng điểm chơi bài
(function () {
  const $ = (el, s) => el.querySelector(s);
  const money = n => Math.round(n).toLocaleString('vi-VN') + 'đ';

  GV.register({
    id: 'splitbill', type: 'tool', cat: 'Đời sống', name: 'Chia tiền nhóm', icon: '💸', desc: 'Ai trả gì, ai nợ ai: tính ra số lần chuyển khoản ít nhất.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><input class="nm" placeholder="Tên thành viên" style="flex:1"><button class="btn addp">Thêm</button></div><div class="ppl row"></div>
      <hr style="width:100%;border-color:var(--line)"><label>Khoản chi</label>
      <div class="row"><input class="ex" placeholder="Nội dung (ăn tối…)" style="flex:1;min-width:120px"><input class="am" type="number" placeholder="Số tiền" style="width:120px"></div>
      <div class="row"><label>Người trả <select class="pay"></select></label></div><div class="row chk"></div><div class="row"><button class="btn adde">Thêm khoản chi</button></div>
      <div class="exl"></div><button class="btn calc">🧮 Tính chia tiền</button><div class="res out" hidden></div><button class="btn ghost clr">Xoá tất cả</button></div>`;
      let st = GV.store.get('split', { p: [], e: [] });
      const save = () => GV.store.set('split', st);
      function draw() {
        $(el, '.ppl').innerHTML = st.p.map((n, i) => `<span class="seat" style="background:var(--inp);border:1px solid var(--line);border-radius:99px;padding:3px 12px">${GV.esc(n)} <a href="#" data-rp="${i}" style="color:var(--bad)">✕</a></span>`).join('') || '<span class="hint">Thêm thành viên trước.</span>';
        $(el, '.pay').innerHTML = st.p.map((n, i) => `<option value="${i}">${GV.esc(n)}</option>`).join('');
        $(el, '.chk').innerHTML = st.p.length ? 'Chia cho: ' + st.p.map((n, i) => `<label><input type="checkbox" data-w="${i}" checked> ${GV.esc(n)}</label>`).join(' ') : '';
        $(el, '.exl').innerHTML = st.e.length ? '<table class="list">' + st.e.map((x, i) => `<tr><td>${GV.esc(x.t || 'Khoản ' + (i + 1))}</td><td>${GV.esc(st.p[x.by] || '?')} trả</td><td><b>${money(x.a)}</b></td><td>${x.w.length}/${st.p.length} người</td><td><a href="#" data-re="${i}" style="color:var(--bad)">✕</a></td></tr>`).join('') + '</table>' : '';
      }
      el.onclick = e => {
        const a = e.target.closest('a'); if (!a) return; e.preventDefault();
        if (a.dataset.rp !== undefined) { const i = +a.dataset.rp; st.p.splice(i, 1); st.e = st.e.filter(x => x.by !== i).map(x => ({ ...x, by: x.by > i ? x.by - 1 : x.by, w: x.w.filter(w => w !== i).map(w => w > i ? w - 1 : w) })); }
        if (a.dataset.re !== undefined) st.e.splice(+a.dataset.re, 1);
        save(); draw();
      };
      $(el, '.addp').onclick = () => { const v = $(el, '.nm').value.trim(); if (v) { st.p.push(v); $(el, '.nm').value = ''; save(); draw(); } };
      $(el, '.adde').onclick = () => {
        const a = +$(el, '.am').value, w = [...el.querySelectorAll('[data-w]')].filter(c => c.checked).map(c => +c.dataset.w);
        if (!(a > 0) || !w.length || !st.p.length) return; st.e.push({ t: $(el, '.ex').value.trim(), a, by: +$(el, '.pay').value, w }); $(el, '.ex').value = $(el, '.am').value = ''; save(); draw();
      };
      $(el, '.calc').onclick = () => {
        const bal = st.p.map(() => 0);
        st.e.forEach(x => { bal[x.by] += x.a; x.w.forEach(i => bal[i] -= x.a / x.w.length); });
        const deb = [], cre = []; bal.forEach((b, i) => { if (b < -1) deb.push([i, -b]); else if (b > 1) cre.push([i, b]); });
        deb.sort((a, b) => b[1] - a[1]); cre.sort((a, b) => b[1] - a[1]); const tx = [];
        while (deb.length && cre.length) { const m = Math.min(deb[0][1], cre[0][1]); tx.push(`${st.p[deb[0][0]]} → ${st.p[cre[0][0]]}: <b>${money(m)}</b>`); deb[0][1] -= m; cre[0][1] -= m; if (deb[0][1] < 1) deb.shift(); if (cre[0][1] < 1) cre.shift(); }
        const tot = st.e.reduce((s, x) => s + x.a, 0); const o = $(el, '.out'); o.hidden = false;
        o.innerHTML = `Tổng chi: <b>${money(tot)}</b><br>` + (tx.length ? 'Cần chuyển khoản:<br>' + tx.join('<br>') : 'Không ai nợ ai 🎉');
      };
      $(el, '.clr').onclick = () => { if (confirm('Xoá hết thành viên và khoản chi?')) { st = { p: [], e: [] }; save(); draw(); $(el, '.out').hidden = true; } };
      draw();
    }
  });

  GV.register({
    id: 'teams', type: 'tool', cat: 'Đời sống', name: 'Chia đội ngẫu nhiên', icon: '👥', desc: 'Dán danh sách tên, chia thành các đội đều nhau.',
    mount(el) {
      el.innerHTML = `<div class="tool"><textarea class="t" placeholder="Mỗi dòng một tên…" style="min-height:140px"></textarea><div class="row"><label>Số đội <input type="number" class="n" value="2" min="2" max="20" style="width:80px"></label><button class="btn go">🎲 Chia đội</button></div><div class="out"></div></div>`;
      const t = $(el, '.t'); t.value = GV.store.get('teams', 'An\nBình\nChi\nDũng\nEm\nPhúc');
      $(el, '.go').onclick = () => {
        GV.store.set('teams', t.value);
        const names = GV.shuffle(t.value.split('\n').map(s => s.trim()).filter(Boolean)), n = Math.max(2, Math.min(20, +$(el, '.n').value || 2)), teams = Array.from({ length: n }, () => []);
        names.forEach((x, i) => teams[i % n].push(x));
        $(el, '.out').innerHTML = teams.map((tm, i) => `<div class="res" style="margin-bottom:8px"><b>Đội ${i + 1}</b> (${tm.length}): ${tm.map(GV.esc).join(', ') || '—'}</div>`).join('');
      };
    }
  });

  GV.register({
    id: 'scoreboard', type: 'tool', cat: 'Đời sống', name: 'Bảng điểm chơi bài', icon: '🏅', desc: 'Ghi điểm từng ván cho Tiến lên, Phỏm, Uno…',
    mount(el) {
      el.innerHTML = `<div class="tool" style="max-width:720px"><div class="row"><input class="nm" placeholder="Tên người chơi" style="flex:1"><button class="btn addp">Thêm</button><button class="btn ghost rs">Ván mới (xoá điểm)</button></div><div class="tbl" style="overflow:auto"></div><div class="row"><button class="btn addr">➕ Thêm ván</button></div></div>`;
      let st = GV.store.get('score', { p: ['A', 'B', 'C', 'D'], r: [] });
      const save = () => GV.store.set('score', st);
      function draw() {
        const tot = st.p.map((_, i) => st.r.reduce((s, r) => s + (+r[i] || 0), 0)), mx = Math.max(...tot);
        $(el, '.tbl').innerHTML = `<table class="list"><tr><th>Ván</th>${st.p.map((n, i) => `<th>${GV.esc(n)} <a href="#" data-rp="${i}" style="color:var(--bad)">✕</a></th>`).join('')}</tr>
          ${st.r.map((r, ri) => `<tr><td>${ri + 1} <a href="#" data-rr="${ri}" style="color:var(--bad)">✕</a></td>${st.p.map((_, i) => `<td><input type="number" data-r="${ri}" data-c="${i}" value="${r[i] ?? ''}" style="width:70px"></td>`).join('')}</tr>`).join('')}
          <tr><th>Tổng</th>${tot.map(t => `<th style="color:${t === mx && mx > 0 ? 'var(--ok)' : 'inherit'}">${t}${t === mx && mx > 0 ? ' 🏆' : ''}</th>`).join('')}</tr></table>`;
      }
      el.onclick = e => {
        const a = e.target.closest('a'); if (!a) return; e.preventDefault();
        if (a.dataset.rp !== undefined) { const i = +a.dataset.rp; st.p.splice(i, 1); st.r.forEach(r => r.splice(i, 1)); }
        if (a.dataset.rr !== undefined) st.r.splice(+a.dataset.rr, 1);
        save(); draw();
      };
      el.oninput = e => { const r = e.target.dataset.r; if (r === undefined) return; st.r[+r][+e.target.dataset.c] = e.target.value === '' ? '' : +e.target.value; save(); const f = e.target; const cells = el.querySelectorAll('tr:last-child th'); const tot = st.p.map((_, i) => st.r.reduce((s, x) => s + (+x[i] || 0), 0)), mx = Math.max(...tot); cells.forEach((c, i) => { if (i) { c.textContent = tot[i - 1] + (tot[i - 1] === mx && mx > 0 ? ' 🏆' : ''); c.style.color = tot[i - 1] === mx && mx > 0 ? 'var(--ok)' : 'inherit'; } }); };
      $(el, '.addp').onclick = () => { const v = $(el, '.nm').value.trim(); if (v) { st.p.push(v); st.r.forEach(r => r.push('')); $(el, '.nm').value = ''; save(); draw(); } };
      $(el, '.addr').onclick = () => { st.r.push(st.p.map(() => '')); save(); draw(); };
      $(el, '.rs').onclick = () => { if (confirm('Xoá toàn bộ điểm?')) { st.r = []; save(); draw(); } };
      draw();
    }
  });
})();
