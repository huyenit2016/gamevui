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
      .tl .c.pick{outline:3px dashed var(--acc2);outline-offset:2px}.tl.arr .hand .c{cursor:grab}.tl .arrhint .pbtn{padding:2px 10px;margin:0 3px}.tl .hand{display:flex;flex-wrap:wrap;justify-content:center;margin:8px 0}.tl .table{min-height:80px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap}`,
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
      const p = Object.assign({}, c.pub, { passed: c.pub.passed || [], log: c.pub.log || [] }), hand = c.priv.hand || [], n = c.names, myTurn = p.turn === c.me, ui = c.ui;
      ui.sel = (ui.sel || []).filter(x => hand.includes(x)); if (!myTurn) ui.sel = [];
      // thứ tự bài do người chơi tự xếp (chỉ là cách hiển thị, không ảnh hưởng luật)
      const order = () => { const o = (ui.order || []).filter(id => hand.includes(id)); hand.forEach(id => { if (!o.includes(id)) o.push(id); }); ui.order = o; return o; };
      if (ui.pick != null && !hand.includes(ui.pick)) ui.pick = null;
      const card = (id, cls = '', extra = '') => `<div class="c ${red(id) ? 'r' : ''} ${cls}" data-id="${id}" ${extra}><span>${RN[rk(id)]}</span><span>${SU[su(id)]}</span></div>`;
      const handHTML = () => order().map(id => card(id, (ui.sel.includes(id) ? 'sel ' : '') + (ui.pick === id ? 'pick' : ''), ui.arr ? 'draggable="true"' : '')).join('');
      const others = p.order.filter(i => i !== c.me).map(i => `<span class="seat ${p.turn === i ? 'turn' : ''}">${GV.esc(n[i] || p.names[i])}: <b>${p.counts[i]}</b> lá${p.passed.includes(i) ? ' · bỏ lượt' : ''}</span>`).join(' ');
      const tr = p.trick;
      let msg;
      if (p.over) msg = p.over.winner === c.me ? '🎉 Bạn về nhất!' : '🏆 ' + GV.esc(n[p.over.winner] || '') + ' về nhất!';
      else msg = myTurn ? (tr ? 'Đến lượt bạn – đánh cao hơn hoặc bỏ lượt' : 'Bạn dẫn lượt – đánh bất kỳ bộ hợp lệ' + (p.first ? ` (phải có ${label(p.low)})` : '')) : 'Lượt của ' + GV.esc(n[p.turn] || '');
      box.innerHTML = `<div class="tl ${ui.arr ? 'arr' : ''}"><div class="row" style="margin-bottom:6px">${others}</div>
        <div class="table">${tr ? tr.cards.map(id => card(id)).join('') : '<span class="hint">Bàn trống</span>'}</div>
        <div class="hint" style="text-align:center">${tr ? GV.esc(n[tr.by] || '') + ' · ' + typeName(tr) : ''}</div>
        <div class="msg">${msg}</div>
        ${p.over ? `<div class="hint" style="text-align:center">Xếp hạng theo số lá còn lại: ${p.over.ranks.map(r => GV.esc(n[r.id] || '') + ' (' + r.n + ')').join(' · ')}</div>` : ''}
        ${hand.length ? `<div class="row" style="margin-top:8px"><button class="pbtn" data-a="sortr">↕ Tăng dần</button><button class="pbtn" data-a="sorts">♠ Theo chất</button><button class="pbtn" data-a="sortg">🧩 Gom bộ</button><button class="pbtn ${ui.arr ? 'sel' : ''}" data-a="arr">✋ Tự xếp${ui.arr ? ' (bật)' : ''}</button></div>
        <div class="hint arrhint" style="text-align:center" ${ui.arr ? '' : 'hidden'}>Chạm lá muốn dời, rồi chạm lá đích (hoặc dùng ◀ ▶). Trên máy tính có thể kéo thả.
          <span class="mv" ${ui.pick != null ? '' : 'hidden'}><button class="pbtn" data-a="mvl">◀</button><button class="pbtn" data-a="mvr">▶</button></span></div>` : ''}
        <div class="hand">${handHTML()}</div>
        ${!p.over ? `<div class="row"><button class="pbtn sel" data-a="play" ${myTurn ? '' : 'disabled'}>Đánh (${ui.sel.length})</button><button class="pbtn" data-a="pass" ${myTurn && tr ? '' : 'disabled'}>Bỏ lượt</button><button class="pbtn" data-a="clr">Bỏ chọn</button></div>` : ''}
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      const paintHand = () => {
        box.querySelector('.hand').innerHTML = handHTML();
        const pl = box.querySelector('[data-a=play]'); if (pl) pl.textContent = `Đánh (${ui.sel.length})`;
        const mv = box.querySelector('.mv'); if (mv) mv.hidden = ui.pick == null;
      };
      const move = (id, target) => { // dời lá `id` tới vị trí của lá `target`
        const o = order(), from = o.indexOf(id), to = o.indexOf(target); if (from < 0 || to < 0 || from === to) return;
        o.splice(from, 1); o.splice(to, 0, id); ui.order = o; ui.pick = null; paintHand();
      };
      const step = d => { const o = order(), i = o.indexOf(ui.pick); const j = i + d; if (i < 0 || j < 0 || j >= o.length) return; o.splice(i, 1); o.splice(j, 0, ui.pick); ui.order = o; paintHand(); };
      box.onclick = e => {
        const cd = e.target.closest('.hand [data-id]'), ac = e.target.closest('[data-a]');
        if (cd) {
          const id = +cd.dataset.id;
          if (ui.arr) { if (ui.pick == null) ui.pick = id; else if (ui.pick === id) ui.pick = null; else move(ui.pick, id); return paintHand(); }
          if (p.over) return;
          const i = ui.sel.indexOf(id); i >= 0 ? ui.sel.splice(i, 1) : ui.sel.push(id); cd.classList.toggle('sel'); box.querySelector('[data-a=play]').textContent = `Đánh (${ui.sel.length})`; return;
        }
        if (!ac) return;
        const k = ac.dataset.a;
        if (k === 'sortr') { ui.order = sortIds(hand); ui.pick = null; return paintHand(); }
        if (k === 'sorts') { ui.order = hand.slice().sort((x, y) => su(x) - su(y) || x - y); ui.pick = null; return paintHand(); }
        if (k === 'sortg') { // gom các lá cùng hạng lại gần nhau: nhóm nhiều lá trước (tứ quý, sám, đôi), lá lẻ sau
          const by = {}; hand.forEach(id => (by[rk(id)] = by[rk(id)] || []).push(id));
          ui.order = Object.values(by).sort((x, y) => y.length - x.length || rk(x[0]) - rk(y[0])).flat(); ui.pick = null; return paintHand();
        }
        if (k === 'arr') { ui.arr = !ui.arr; ui.pick = null; box.querySelector('.tl').classList.toggle('arr', ui.arr); ac.classList.toggle('sel', ui.arr); ac.textContent = '✋ Tự xếp' + (ui.arr ? ' (bật)' : ''); box.querySelector('.arrhint').hidden = !ui.arr; return paintHand(); }
        if (k === 'mvl') return step(-1);
        if (k === 'mvr') return step(1);
        if (p.over) return;
        if (k === 'clr') { ui.sel = []; return paintHand(); }
        if (!myTurn) return c.toast('Chưa tới lượt bạn.');
        if (k === 'pass') return c.send({ t: 'pass' });
        if (!ui.sel.length) return c.toast('Hãy chọn bài để đánh.');
        c.send({ t: 'play', cards: ui.sel }); ui.sel = [];
      };
      // kéo thả (máy tính)
      box.ondragstart = e => { const cd = e.target.closest('.hand [data-id]'); if (cd && ui.arr) { e.dataTransfer.setData('text/plain', cd.dataset.id); e.dataTransfer.effectAllowed = 'move'; } };
      box.ondragover = e => { if (ui.arr && e.target.closest('.hand [data-id]')) e.preventDefault(); };
      box.ondrop = e => { const cd = e.target.closest('.hand [data-id]'); if (!cd || !ui.arr) return; e.preventDefault(); const id = +e.dataTransfer.getData('text/plain'); if (!isNaN(id)) move(id, +cd.dataset.id); };
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
