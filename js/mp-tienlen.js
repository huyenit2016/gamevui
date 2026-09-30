// Tiến lên miền Nam online (2–4 người, có bot). Bao gồm: đơn, đôi, sám, tứ quý, sảnh, đôi thông và chặt heo.
(function () {
  const RN = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'], SU = ['♠', '♣', '♦', '♥'];
  const rk = id => id >> 2, su = id => id & 3, label = id => RN[rk(id)] + SU[su(id)];
  const red = id => su(id) >= 2;

  // Phân loại một bộ bài (mảng id đã sắp tăng dần). Trả về {type,len,key} hoặc null.
  function classify(ids) {
    const n = ids.length; if (!n) return null;
    const r = ids.map(rk), key = ids[n - 1];
    if (n === 1) return { type: 'single', len: 1, key };
    if (r.every(x => x === r[0])) return n <= 4 ? { type: ['', '', 'pair', 'triple', 'quad'][n], len: n, key } : null;
    if (r.includes(12)) return null; // heo không vào sảnh / đôi thông
    if (n >= 3 && r.every((x, i) => i === 0 || x === r[i - 1] + 1)) return { type: 'seq', len: n, key };
    if (n >= 6 && n % 2 === 0) {
      let ok = true; for (let i = 0; i < n; i += 2) { if (r[i] !== r[i + 1]) ok = false; if (i && r[i] !== r[i - 2] + 1) ok = false; }
      if (ok) return { type: 'dt', len: n / 2, key };
    }
    return null;
  }
  // cur có đánh được trên prev (bao gồm các kiểu chặt) không
  function beats(prev, cur) {
    if (!prev) return true;
    if (prev.type === cur.type && prev.len === cur.len) return cur.key > prev.key;
    const heo1 = prev.type === 'single' && rk(prev.key) === 12, heo2 = prev.type === 'pair' && rk(prev.key) === 12;
    if (heo1 && (cur.type === 'quad' || cur.type === 'dt')) return true;
    if (heo2 && (cur.type === 'quad' || (cur.type === 'dt' && cur.len >= 4))) return true;
    if (prev.type === 'quad' && cur.type === 'dt' && cur.len >= 4) return true;
    if (prev.type === 'dt' && prev.len === 3 && (cur.type === 'quad' || (cur.type === 'dt' && cur.len >= 4))) return true;
    return false;
  }
  const typeName = t => ({ single: 'lẻ', pair: 'đôi', triple: 'sám', quad: 'tứ quý', seq: 'sảnh', dt: 'đôi thông' }[t.type] + (t.type === 'seq' || t.type === 'dt' ? ' ' + t.len : ''));
  const sortIds = a => a.slice().sort((x, y) => x - y);
  const log = (S, t) => { S.log.push(t); if (S.log.length > 30) S.log.shift(); };

  // Các bộ bot có thể đánh (đại diện: lá nhỏ nhất của mỗi hạng)
  function candidates(hand) {
    const by = {}; hand.forEach(id => (by[rk(id)] = by[rk(id)] || []).push(id));
    const out = [], ranks = Object.keys(by).map(Number).sort((a, b) => a - b);
    ranks.forEach(r => {
      const g = by[r];
      g.forEach(id => out.push([id]));
      for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) out.push([g[i], g[j]]);
      if (g.length >= 3) out.push(g.slice(0, 3));
      if (g.length === 4) out.push(g.slice());
    });
    for (let s = 0; s < 11; s++) { // sảnh
      let seq = []; for (let r = s; r < 12 && by[r]; r++) { seq.push(by[r][0]); if (seq.length >= 3) out.push(seq.slice()); }
    }
    for (let s = 0; s < 11; s++) { // đôi thông
      let dt = []; for (let r = s; r < 12 && by[r] && by[r].length >= 2; r++) { dt.push(by[r][0], by[r][1]); if (dt.length >= 6) out.push(dt.slice()); }
    }
    return out.map(sortIds);
  }

  GV.mp.define({
    id: 'tienlen', name: 'Tiến lên miền Nam', icon: '🎴', desc: 'Bài Tiến lên online 2–4 người (có bot), đủ chặt heo.', min: 2, max: 4,
    css: `.tl .c{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:46px;height:68px;border-radius:8px;background:#fff;color:#111;font-weight:800;font-size:16px;margin:2px;border:2px solid #ccc;box-shadow:0 1px 4px #0005;user-select:none}
      .tl .c.r{color:#d11}.tl .hand .c{cursor:pointer;transition:transform .1s}.tl .hand .c.sel{transform:translateY(-14px);border-color:var(--acc);box-shadow:0 4px 10px #6c8cff88}
      .tl .hand{display:flex;flex-wrap:wrap;justify-content:center;margin:8px 0}.tl .table{min-height:80px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap}`,
    init(seats, api) {
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), hands: {}, turn: 0, trick: null, passed: [], first: true, log: [], over: null };
      const d = api.shuffle([...Array(52).keys()]); S.order.forEach((id, i) => S.hands[id] = sortIds(d.slice(i * 13, i * 13 + 13)));
      let low = 99, who = 0; S.order.forEach((id, i) => { const m = Math.min(...S.hands[id]); if (m < low) { low = m; who = i; } });
      S.turn = who; S.low = low; log(S, `${S.names[S.order[who]]} đi trước (có ${label(low)}).`); return S;
    },
    reduce(S, id, a) {
      if (S.over) return 'Ván đã kết thúc.';
      if (S.order[S.turn] !== id) return 'Chưa tới lượt bạn.';
      const n = S.names[id], hand = S.hands[id];
      if (a.t === 'pass') {
        if (!S.trick) return 'Bạn đang dẫn lượt nên phải đánh bài.';
        S.passed.push(id); log(S, `${n} bỏ lượt.`); advance(S); return;
      }
      if (a.t !== 'play') return;
      const cards = sortIds([...new Set((a.cards || []).map(Number))]);
      if (!cards.length || !cards.every(c => hand.includes(c))) return 'Bài chọn không hợp lệ.';
      const cl = classify(cards); if (!cl) return 'Bộ bài không hợp lệ.';
      if (S.first && !cards.includes(S.low)) return `Nước đầu phải có ${label(S.low)}.`;
      if (S.trick && !beats(S.trick, cl)) return 'Không đánh/chặt được bộ trên bàn.';
      S.hands[id] = hand.filter(c => !cards.includes(c));
      S.trick = Object.assign({ cards, by: id }, cl); S.first = false;
      log(S, `${n} đánh ${typeName(cl)}: ${cards.map(label).join(' ')}`);
      if (!S.hands[id].length) {
        const left = S.order.map(i => ({ id: i, n: S.hands[i].length })).sort((x, y) => x.n - y.n);
        S.over = { winner: id, ranks: left }; log(S, `🏆 ${n} về nhất!`); return;
      }
      advance(S);
    },
    pub(S) { return { order: S.order, names: S.names, counts: Object.fromEntries(S.order.map(i => [i, S.hands[i].length])), turn: S.over ? null : S.order[S.turn], trick: S.trick, passed: S.passed, first: S.first, low: S.low, log: S.log.slice(-8), over: S.over, hands: S.over ? S.hands : null }; },
    priv(S, id) { return { hand: S.hands[id] || [] }; },
    bot(S, id) {
      if (S.over || S.order[S.turn] !== id) return null;
      const hand = S.hands[id], cand = candidates(hand).map(c => Object.assign({ cards: c }, classify(c))).filter(x => x.type);
      let ok = cand.filter(x => (!S.first || x.cards.includes(S.low)) && beats(S.trick, x));
      if (!ok.length) return S.trick ? { t: 'pass' } : { t: 'play', cards: [hand[0]] };
      if (S.trick) { // chỉ chặt khi cần: ưu tiên bộ cùng loại nhỏ nhất
        const same = ok.filter(x => x.type === S.trick.type && x.len === S.trick.len);
        if (same.length) ok = same; else if (hand.length > 5 && Math.random() < .5) return { t: 'pass' };
        ok.sort((x, y) => x.key - y.key); return { t: 'play', cards: ok[0].cards };
      }
      ok.sort((x, y) => (y.cards.length - x.cards.length) || (x.key - y.key)); // dẫn lượt: xả bộ dài, nhỏ nhất
      const big = ok.filter(x => x.type !== 'quad' && !(x.type === 'single' && rk(x.key) === 12)); const pick = (big.length ? big : ok)[0];
      return { t: 'play', cards: pick.cards };
    },
    render(box, c) {
      const p = c.pub, hand = c.priv.hand || [], n = c.names, myTurn = p.turn === c.me, ui = c.ui;
      ui.sel = (ui.sel || []).filter(x => hand.includes(x)); if (!myTurn) ui.sel = [];
      const card = (id, cls = '') => `<div class="c ${red(id) ? 'r' : ''} ${cls}" data-id="${id}"><span>${RN[rk(id)]}</span><span>${SU[su(id)]}</span></div>`;
      const others = p.order.filter(i => i !== c.me).map(i => `<span class="seat ${p.turn === i ? 'turn' : ''}">${GV.esc(n[i] || p.names[i])}: <b>${p.counts[i]}</b> lá${p.passed.includes(i) ? ' · bỏ lượt' : ''}</span>`).join(' ');
      const tr = p.trick;
      let msg;
      if (p.over) msg = p.over.winner === c.me ? '🎉 Bạn về nhất!' : '🏆 ' + GV.esc(n[p.over.winner] || '') + ' về nhất!';
      else msg = myTurn ? (tr ? 'Đến lượt bạn – đánh cao hơn hoặc bỏ lượt' : 'Bạn dẫn lượt – đánh bất kỳ bộ hợp lệ' + (p.first ? ` (phải có ${label(p.low)})` : '')) : 'Lượt của ' + GV.esc(n[p.turn] || '');
      box.innerHTML = `<div class="tl"><div class="row" style="margin-bottom:6px">${others}</div>
        <div class="table">${tr ? tr.cards.map(id => card(id)).join('') : '<span class="hint">Bàn trống</span>'}</div>
        <div class="hint" style="text-align:center">${tr ? GV.esc(n[tr.by] || '') + ' · ' + typeName(tr) : ''}</div>
        <div class="msg">${msg}</div>
        ${p.over ? `<div class="hint" style="text-align:center">Xếp hạng theo số lá còn lại: ${p.over.ranks.map(r => GV.esc(n[r.id] || '') + ' (' + r.n + ')').join(' · ')}</div>` : ''}
        <div class="hand">${hand.map(id => card(id, ui.sel.includes(id) ? 'sel' : '')).join('')}</div>
        ${!p.over ? `<div class="row"><button class="pbtn sel" data-a="play" ${myTurn ? '' : 'disabled'}>Đánh (${ui.sel.length})</button><button class="pbtn" data-a="pass" ${myTurn && tr ? '' : 'disabled'}>Bỏ lượt</button><button class="pbtn" data-a="clr">Bỏ chọn</button></div>` : ''}
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      box.onclick = e => {
        if (p.over) return;
        const cd = e.target.closest('.hand [data-id]'), ac = e.target.closest('[data-a]');
        if (cd) { const id = +cd.dataset.id, i = ui.sel.indexOf(id); i >= 0 ? ui.sel.splice(i, 1) : ui.sel.push(id); cd.classList.toggle('sel'); box.querySelector('[data-a=play]').textContent = `Đánh (${ui.sel.length})`; return; }
        if (!ac) return;
        if (ac.dataset.a === 'clr') { ui.sel = []; box.querySelectorAll('.hand .sel').forEach(x => x.classList.remove('sel')); box.querySelector('[data-a=play]').textContent = 'Đánh (0)'; return; }
        if (!myTurn) return c.toast('Chưa tới lượt bạn.');
        if (ac.dataset.a === 'pass') return c.send({ t: 'pass' });
        if (!ui.sel.length) return c.toast('Hãy chọn bài để đánh.');
        c.send({ t: 'play', cards: ui.sel }); ui.sel = [];
      };
    }
  });

  function advance(S) {
    const n = S.order.length;
    for (let k = 1; k <= n; k++) {
      const idx = (S.turn + k) % n, id = S.order[idx];
      if (S.trick && id === S.trick.by) { S.trick = null; S.passed = []; S.turn = idx; log(S, `${S.names[id]} thắng vòng, được dẫn lượt.`); return; }
      if (!S.passed.includes(id)) { S.turn = idx; return; }
    }
  }
})();
