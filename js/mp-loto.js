// Lô tô online (nhiều người) trên khung phòng chung: chủ phòng gọi số (tay/tự động), người chơi tự dò và bấm KINH.
(function () {
  const pad = n => String(n).padStart(2, '0');
  const log = (S, t) => { S.log.push(t); if (S.log.length > 30) S.log.shift(); };
  const claimed = (S, id, idx, row) => S.winners.some(w => w.id === id && w.idx === idx && w.row === row);

  function doDraw(S, api) {
    if (S.called.length >= 90) { S.over = { reason: 'hết 90 số' }; log(S, 'Đã gọi hết 90 số.'); return; }
    const used = new Set(S.called), rest = []; for (let n = 1; n <= 90; n++) if (!used.has(n)) rest.push(n);
    S.called.push(rest[api.rnd(rest.length)]); S.nextAt = Date.now() + S.speed;
    if (S.called.length >= 90) { S.over = { reason: 'hết 90 số' }; log(S, 'Đã gọi hết 90 số.'); }
  }

  GV.mp.define({
    id: 'lotoonline', name: 'Lô tô online', icon: '🌐', desc: 'Lô tô nhiều người: chủ phòng gọi số, bạn tự dò và bấm KINH!', min: 2, max: 20,
    opts: [{ k: 'k', label: 'Số vé của bạn (1–16):', values: Array.from({ length: 16 }, (_, i) => i + 1), def: 4 }],
    css: GV.lotoCSS + `.lo .code{font-size:2rem}.lo .kmsg{font-weight:700;font-size:13px;min-height:1.3em}.lo .wn{font-size:13px;margin-top:6px}`,
    init(seats, api) {
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), host: api.host, tk: {}, called: [], winners: [], auto: false, speed: 4000, nextAt: 0, stop: true, over: null, log: [] };
      seats.forEach(s => { const k = Math.max(1, Math.min(16, +((s.opts || {}).k) || 4)); S.tk[s.id] = GV.lotoMakeTickets(k); });
      log(S, 'Ván mới bắt đầu – chủ phòng bấm "Gọi số"!'); return S;
    },
    reduce(S, id, a, api) {
      if (S.over) return 'Ván đã kết thúc.';
      const isHost = id === S.host;
      if (a.t === 'draw') { if (!isHost) return 'Chỉ chủ phòng được gọi số.'; doDraw(S, api); return; }
      if (a.t === 'auto') {
        if (!isHost) return 'Chỉ chủ phòng được chỉnh.';
        S.auto = !!a.on; if ([2500, 4000, 6000].includes(+a.speed)) S.speed = +a.speed; if (a.stop !== undefined) S.stop = !!a.stop;
        if (S.auto) S.nextAt = Date.now() + S.speed; return;
      }
      if (a.t === 'end') { if (!isHost) return 'Chỉ chủ phòng được kết thúc ván.'; S.over = { reason: 'chủ phòng kết thúc' }; S.auto = false; log(S, 'Chủ phòng kết thúc ván.'); return; }
      if (a.t === 'kinh') {
        const tk = S.tk[id]; if (!tk) return 'Bạn không có vé trong ván này.';
        const cs = new Set(S.called); let ok = 0, err = null;
        for (const c of (a.claims || []).slice(0, 16)) {
          const t = tk[+c.idx], row = t && t[+c.row]; if (!row) { err = 'Vé không hợp lệ.'; continue; }
          if (claimed(S, id, +c.idx, +c.row)) continue;
          if (!row.filter(Boolean).every(n => cs.has(n))) { err = 'Hàng có số CHƯA được gọi – bạn dò nhầm!'; continue; }
          S.winners.push({ id, name: S.names[id], idx: +c.idx, row: +c.row, n: S.called.length, seq: S.winners.length + 1 }); ok++;
          log(S, `🎉 ${S.names[id]} KINH với vé #${pad(+c.idx + 1)}!`);
        }
        if (ok && S.stop && S.auto) { S.auto = false; log(S, '⏸ Tự động tạm dừng vì có người kinh.'); }
        return ok ? undefined : err;
      }
    },
    tick(S, now, api) { if (S.over || !S.auto || now < S.nextAt) return false; doDraw(S, api); return true; },
    pub(S) { return { called: S.called, winners: S.winners, auto: S.auto, speed: S.speed, stop: S.stop, nextAt: S.auto ? S.nextAt : 0, over: S.over, counts: Object.fromEntries(Object.keys(S.tk).map(i => [i, S.tk[i].length])), names: S.names, log: S.log.slice(-8), turn: null }; },
    priv(S, id) { return { tk: S.tk[id] || null }; },
    bot(S, id) {
      if (S.over || !S.tk[id] || !S.called.length) return null; const cs = new Set(S.called);
      const tks = S.tk[id];
      for (let i = 0; i < tks.length; i++) for (let r = 0; r < 9; r++) if (!claimed(S, id, i, r) && tks[i][r].filter(Boolean).every(n => cs.has(n))) return { t: 'kinh', claims: [{ idx: i, row: r }] };
      return null;
    },
    summary(S) {
      const who = [...new Set(S.winners.map(w => w.name))];
      return { title: `${S.called.length} số · ${who.length ? '🏆 ' + who.join(', ') : 'không ai kinh'}`, lines: S.winners.map(w => `🏆 ${w.name} – vé #${pad(w.idx + 1)} (sau ${w.n} số)`) };
    },
    render(box, c) {
      const p = Object.assign({}, c.pub, { called: c.pub.called || [], winners: c.pub.winners || [], log: c.pub.log || [], counts: c.pub.counts || {} }), ui = c.ui;
      const tks = c.priv.tk || [], called = p.called, cs = new Set(called), me = c.me;
      const mkey = `lo_marks_${c.code}_${c.round}`;
      if (ui.mk !== mkey) { ui.mk = mkey; ui.marks = new Set(GV.store.get(mkey, [])); ui.seen = undefined; ui.len = undefined; }
      const won = new Set(p.winners.filter(w => w.id === me).map(w => w.idx));
      if (ui.seen === undefined) ui.seen = p.winners.length;
      const lang = GV.store.get('lo_lang', 'vi');
      // số mới: bíp + đọc
      if (ui.len !== undefined && called.length > ui.len) { const n = called[called.length - 1]; GV.beep(400 + n * 4, 90); GV.lotoSpeak(n, GV.store.get('lo_lang', 'vi')); }
      ui.len = called.length;
      const last = called.length ? called[called.length - 1] : null, nm = id => GV.esc(c.names[id] || p.names[id] || '?');
      const newW = p.winners.filter(w => w.seq > ui.seen);
      const hostUI = c.isHost && !p.over ? `<div class="row"><button class="btn draw">🎲 Gọi số</button><button class="btn ghost auto">${p.auto ? '⏸ Dừng tự động' : '▶ Tự động'}</button></div>
        <div class="row" style="margin-top:6px"><label>Tốc độ <select class="sp">${[[6000, 'Chậm (6s)'], [4000, 'Vừa (4s)'], [2500, 'Nhanh (2.5s)']].map(([v, n]) => `<option value="${v}" ${v === p.speed ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <div class="row"><label><input type="checkbox" class="stopk" ${p.stop ? 'checked' : ''}> Dừng tự động khi có người kinh</label></div>
        <div class="row"><button class="btn bad endg" style="padding:5px 12px">⏹ Kết thúc ván</button></div>
        ${p.auto ? `<div class="hint">Số tiếp theo sau <b data-dl="${p.nextAt}"></b></div>` : ''}` : '';
      box.innerHTML = `<div class="l16 lo"><aside class="side">
        <section class="pn cur"><div class="lb">SỐ VỪA GỌI</div><div class="no">${last ? pad(last) : '--'}</div><div class="st">Đã gọi <b>${called.length}/90</b> số</div>
          ${hostUI}
          <div class="row" style="margin-top:8px"><label>🔊 <select class="lg">${[['vi', 'Tiếng Việt'], ['en', 'English'], ['ja', '日本語'], ['off', 'Tắt']].map(([v, n]) => `<option value="${v}" ${v === lang ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></section>
        <section class="pn"><b>🏆 Kinh ván này</b><div class="wn">${p.winners.length ? p.winners.map(w => `🏆 <b>${nm(w.id)}</b> – vé #${pad(w.idx + 1)} (sau ${w.n} số)`).join('<br>') : 'Chưa có ai.'}</div></section>
        <section class="pn"><b>📜 Số đã gọi</b><div class="hist">${called.slice().reverse().slice(0, 30).map((n, i) => `<span class="${i ? '' : 'lt'}">${pad(n)}</span>`).join('') || '<span class="hint">Chưa gọi số nào</span>'}</div></section>
        <section class="pn"><b>🔢 Bảng 1–90</b><div class="pool">${Array.from({ length: 90 }, (_, i) => `<span class="${cs.has(i + 1) ? 'on' : ''}">${i + 1}</span>`).join('')}</div></section>
      </aside><section>
        <div class="head"><h3>🎫 Vé của bạn${tks.length ? ` (${tks.length})` : ''}</h3>${tks.length && !p.over ? '<button class="btn ok kinh">🎉 KINH!</button>' : ''}</div>
        <div class="kmsg"></div>${tks.length ? '<div class="hint">Nghe số nào có trên vé thì bấm vào ô để dò. Đủ 5 số một hàng thì bấm KINH!</div>' : '<div class="hint">Bạn vào muộn nên chỉ xem ván này.</div>'}
        ${p.over ? `<div class="msg">Ván đã kết thúc (${GV.esc(p.over.reason || '')}). Chủ phòng bấm "Ván mới" để chơi tiếp.</div>` : ''}
        <div class="tks">${tks.length ? GV.lotoTicketsHTML(tks, cs, won, ui.marks) : ''}</div></section>
        ${newW.length ? `<div class="modal show"><div class="mc"><div class="big">🎉 KINH!</div><h3>${newW.map(w => nm(w.id) + ' – vé #' + pad(w.idx + 1)).join('<br>')}</h3><button class="btn ok closem">Tiếp tục</button></div></div>` : ''}
      </div>`;
      if (newW.length) GV.beep(880, 350);
      const q = s => box.querySelector(s);
      if (q('.closem')) q('.closem').onclick = () => { ui.seen = p.winners.length; q('.modal').remove(); };
      if (q('.draw')) q('.draw').onclick = () => { GV.lotoUnlock(); c.send({ t: 'draw' }); };
      if (q('.auto')) q('.auto').onclick = () => { GV.lotoUnlock(); c.send({ t: 'auto', on: !p.auto, speed: +q('.sp').value, stop: q('.stopk').checked }); };
      if (q('.sp')) q('.sp').onchange = () => c.send({ t: 'auto', on: p.auto, speed: +q('.sp').value, stop: q('.stopk').checked });
      if (q('.stopk')) q('.stopk').onchange = () => c.send({ t: 'auto', on: p.auto, speed: p.speed, stop: q('.stopk').checked });
      if (q('.endg')) q('.endg').onclick = () => { if (confirm('Kết thúc ván này?')) c.send({ t: 'end' }); };
      q('.lg').onchange = e => { GV.store.set('lo_lang', e.target.value); GV.lotoUnlock(); GV.lotoSpeak(88, e.target.value); };
      // tự dò: đổi màu ngay tại ô (không vẽ lại cả danh sách vé → không bị giật khi cuộn)
      q('.tks').onclick = e => {
        const cell = e.target.closest('.n'); if (!cell || p.over) return;
        const key = cell.dataset.t + ':' + cell.dataset.n; ui.marks.has(key) ? ui.marks.delete(key) : ui.marks.add(key);
        cell.classList.toggle('c', ui.marks.has(key)); GV.store.set(mkey, [...ui.marks]);
      };
      if (q('.kinh')) q('.kinh').onclick = () => {
        const msg = q('.kmsg'); const claims = []; let wrong = false, partial = false;
        tks.forEach((t, i) => t.forEach((row, r) => {
          const nums = row.filter(Boolean), m = nums.filter(n => ui.marks.has(i + ':' + n)).length;
          if (m === nums.length) { if (nums.every(n => cs.has(n))) claims.push({ idx: i, row: r }); else wrong = true; } else if (m >= 4) partial = true;
        }));
        if (!claims.length) { msg.style.color = 'var(--bad)'; msg.textContent = wrong ? '❌ Trong hàng có số CHƯA được gọi – bạn dò nhầm!' : partial ? '❌ Còn thiếu số ở hàng gần đủ.' : '❌ Chưa có hàng nào đủ 5 số đã dò.'; GV.beep(200, 200); return; }
        msg.style.color = 'var(--ok)'; msg.textContent = '✅ Đã báo kinh!'; c.send({ t: 'kinh', claims });
      };
    }
  });
})();
