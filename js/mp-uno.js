// Uno online (2–8 người, có bot). Luật: đánh cùng màu/số/ký hiệu; +2, +4, cấm lượt, đảo chiều; nhớ hô UNO khi còn 1 lá.
(function () {
  const COLORS = ['R', 'Y', 'G', 'B'], CN = { R: 'Đỏ', Y: 'Vàng', G: 'Xanh lá', B: 'Xanh dương' };
  const HEX = { R: '#e5484d', Y: '#f2b700', G: '#2fb36b', B: '#3b82f6', W: '#2a2a3a' };
  const col = c => c[0], val = c => c.slice(1);
  const sym = c => { const v = val(c); return c[0] === 'W' ? (v === '4' ? '+4' : '★') : v === 's' ? '⊘' : v === 'r' ? '⇄' : v === '+' ? '+2' : v; };

  function newDeck(api) {
    const d = [];
    for (const c of COLORS) { d.push(c + '0'); for (const v of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 's', 'r', '+']) d.push(c + v, c + v); }
    for (let i = 0; i < 4; i++) d.push('W', 'W4');
    return api.shuffle(d);
  }
  const log = (S, t) => { S.log.push(t); if (S.log.length > 30) S.log.shift(); };
  const top = S => S.discard[S.discard.length - 1];
  function draw(S, id, n, api) {
    for (let i = 0; i < n; i++) {
      if (!S.deck.length) { const keep = S.discard.pop(); S.deck = api.shuffle(S.discard); S.discard = [keep]; if (!S.deck.length) return; }
      S.hands[id].push(S.deck.pop());
    }
  }
  const nextIdx = (S, k) => ((S.turn + S.dir * k) % S.order.length + S.order.length) % S.order.length;
  function canPlay(S, c) {
    if (col(c) === 'W') return true;
    const t = top(S); return col(c) === S.color || (col(t) !== 'W' && val(c) === val(t));
  }

  GV.mp.define({
    id: 'uno', name: 'Uno online', icon: '🃏', desc: 'Bài Uno nhiều người (có bot). Hết bài trước là thắng!', min: 2, max: 8,
    css: `.uno .card{display:inline-flex;align-items:center;justify-content:center;width:54px;height:80px;border-radius:10px;border:3px solid #fff;color:#fff;font-weight:900;font-size:22px;margin:3px;box-shadow:0 2px 6px #0006;user-select:none;cursor:default}
      .uno .hand .card{cursor:pointer;transition:transform .12s}.uno .hand .card.ok:hover{transform:translateY(-8px)}.uno .hand .card.no{opacity:.45}
      .uno .hand{display:flex;flex-wrap:wrap;justify-content:center}.uno .mid{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap}
      .uno .back{background:#222;border-color:#e5484d}.uno .dot{display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin:0 4px}`,
    init(seats, api) {
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), hands: {}, deck: newDeck(api), discard: [], turn: 0, dir: 1, color: 'R', drew: false, log: [], over: null };
      S.order.forEach(id => { S.hands[id] = []; draw(S, id, 7, api); });
      let i = S.deck.findIndex(c => /^[RYGB]\d$/.test(c)); const first = S.deck.splice(i, 1)[0];
      S.discard.push(first); S.color = col(first); S.turn = api.rnd(S.order.length);
      log(S, 'Ván mới bắt đầu!'); return S;
    },
    reduce(S, id, a, api) {
      if (S.over) return 'Ván đã kết thúc.';
      if (S.order[S.turn] !== id) return 'Chưa tới lượt bạn.';
      const n = S.names[id], hand = S.hands[id];
      if (a.t === 'draw') {
        if (S.drew) return 'Bạn đã bốc rồi – hãy đánh hoặc bỏ lượt.';
        draw(S, id, 1, api); S.drew = true; log(S, `${n} bốc 1 lá.`); return;
      }
      if (a.t === 'pass') {
        if (!S.drew) return 'Phải bốc bài trước khi bỏ lượt.';
        S.drew = false; S.turn = nextIdx(S, 1); return;
      }
      if (a.t !== 'play') return;
      const c = hand[a.i]; if (!c) return 'Lá bài không hợp lệ.';
      if (!canPlay(S, c)) return 'Lá này không đánh được.';
      if (col(c) === 'W' && !COLORS.includes(a.color)) return 'Hãy chọn màu.';
      hand.splice(a.i, 1); S.discard.push(c); S.color = col(c) === 'W' ? a.color : col(c);
      log(S, `${n} đánh ${sym(c)}${col(c) === 'W' ? ' → ' + CN[S.color] : ' ' + CN[col(c)]}.`);
      if (hand.length === 1 && !a.uno) { draw(S, id, 2, api); log(S, `${n} quên hô UNO – phạt bốc 2!`); }
      else if (hand.length === 1) log(S, `${n}: UNO!`);
      S.drew = false;
      if (!hand.length) { S.over = { winner: id }; log(S, `🏆 ${n} thắng!`); return; }
      const v = val(c), n1 = S.order[nextIdx(S, 1)];
      if (v === 's') S.turn = nextIdx(S, 2);
      else if (v === 'r') { S.dir *= -1; S.turn = nextIdx(S, S.order.length === 2 ? 2 : 1); }
      else if (v === '+') { draw(S, n1, 2, api); log(S, `${S.names[n1]} bốc 2, mất lượt.`); S.turn = nextIdx(S, 2); }
      else if (c === 'W4') { draw(S, n1, 4, api); log(S, `${S.names[n1]} bốc 4, mất lượt.`); S.turn = nextIdx(S, 2); }
      else S.turn = nextIdx(S, 1);
    },
    pub(S) { return { order: S.order, names: S.names, counts: Object.fromEntries(S.order.map(i => [i, S.hands[i].length])), top: top(S), color: S.color, turn: S.over ? null : S.order[S.turn], dir: S.dir, deckN: S.deck.length, drew: S.drew, log: S.log.slice(-8), over: S.over }; },
    summary(S) { return { title: '🏆 ' + S.names[S.over.winner], lines: S.order.map(i => `${S.names[i]}: còn ${S.hands[i].length} lá`) }; },
    priv(S, id) { return { hand: S.hands[id] || [] }; },
    bot(S, id) {
      if (S.over || S.order[S.turn] !== id) return null;
      const hand = S.hands[id], ok = hand.map((c, i) => canPlay(S, c) ? i : -1).filter(i => i >= 0);
      if (!ok.length) return S.drew ? { t: 'pass' } : { t: 'draw' };
      const nw = ok.filter(i => col(hand[i]) !== 'W'), pool = nw.length ? nw : ok, i = pool[GV.rnd(pool.length)];
      const cnt = {}; hand.forEach(c => { if (col(c) !== 'W') cnt[col(c)] = (cnt[col(c)] || 0) + 1; });
      const best = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0] || COLORS[GV.rnd(4)];
      return { t: 'play', i, color: best, uno: true };
    },
    render(box, c) {
      const p = Object.assign({}, c.pub, { log: c.pub.log || [], counts: c.pub.counts || {} }), hand = c.priv.hand || [], myTurn = p.turn === c.me, n = c.names;
      const ui = c.ui; if (ui.pend != null && (!myTurn || !hand[ui.pend])) ui.pend = null;
      const others = p.order.filter(i => i !== c.me).map(i => `<span class="seat ${p.turn === i ? 'turn' : ''}">${GV.esc(n[i] || p.names[i])}: <b>${p.counts[i]}</b> 🂠</span>`).join(' ');
      const t = p.top, tcol = col(t) === 'W' ? p.color : col(t);
      box.innerHTML = `<div class="uno"><div class="row" style="margin-bottom:8px">${others}</div>
        <div class="mid"><div><div class="hint">Bộ bài (${p.deckN})</div><button class="card back" data-act="draw" style="${myTurn && !p.drew ? 'cursor:pointer' : 'opacity:.6'}">UNO</button></div>
        <div><div class="hint">Lá trên cùng</div><div class="card" style="background:${HEX[col(t)]}">${sym(t)}</div></div>
        <div><div class="hint">Màu hiện tại</div><b><span class="dot" style="background:${HEX[tcol]}"></span>${CN[tcol]}</b> ${p.dir > 0 ? '↻' : '↺'}</div></div>
        <div class="msg">${p.over ? (p.over.winner === c.me ? '🎉 Bạn thắng!' : '🏆 ' + GV.esc(n[p.over.winner] || '') + ' thắng!') : myTurn ? (p.drew ? 'Đánh một lá hoặc bỏ lượt' : 'Đến lượt bạn!') : 'Lượt của ' + GV.esc(n[p.turn] || '')}</div>
        ${ui.pend != null ? `<div class="row"><span>Chọn màu:</span>${COLORS.map(k => `<button class="pbtn" data-col="${k}" style="background:${HEX[k]};color:#fff">${CN[k]}</button>`).join('')}</div>` : ''}
        ${myTurn && !p.over && hand.length === 2 && !ui.uno ? '<div class="msg" style="color:var(--bad)">⚠️ Sắp còn 1 lá – bấm “UNO!” trước khi đánh, nếu không sẽ bị phạt bốc 2.</div>' : ''}<div class="row" style="margin:6px 0">${myTurn && !p.over ? `<button class="pbtn ${ui.uno ? 'sel' : ''}" data-act="uno">📢 UNO! ${ui.uno ? '(bật)' : ''}</button>${p.drew ? '<button class="pbtn" data-act="pass">Bỏ lượt</button>' : ''}` : ''}</div>
        <div class="hand">${hand.map((k, i) => `<div class="card ${myTurn && canPlayC(p, k) ? 'ok' : 'no'}" data-i="${i}" style="background:${HEX[col(k)]}">${sym(k)}</div>`).join('')}</div>
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      box.onclick = e => {
        if (p.over) return;
        const cd = e.target.closest('[data-i]'), ac = e.target.closest('[data-act]'), cl = e.target.closest('[data-col]');
        if (cl && ui.pend != null) { c.send({ t: 'play', i: ui.pend, color: cl.dataset.col, uno: !!ui.uno }); ui.pend = null; ui.uno = false; return; }
        if (ac) {
          if (ac.dataset.act === 'uno') { ui.uno = !ui.uno; return ac.classList.toggle('sel', ui.uno); }
          if (!myTurn) return c.toast('Chưa tới lượt bạn.');
          return c.send({ t: ac.dataset.act });
        }
        if (cd) {
          if (!myTurn) return c.toast('Chưa tới lượt bạn.');
          const i = +cd.dataset.i, k = hand[i];
          if (!canPlayC(p, k)) return c.toast('Lá này không đánh được.');
          if (col(k) === 'W') { ui.pend = i; return renderAgain(); }
          c.send({ t: 'play', i, uno: !!ui.uno }); ui.uno = false;
        }
      };
      function renderAgain() { // vẽ lại để hiện bảng chọn màu
        const row = box.querySelector('.msg'); if (!row) return;
        row.insertAdjacentHTML('afterend', `<div class="row"><span>Chọn màu:</span>${COLORS.map(k => `<button class="pbtn" data-col="${k}" style="background:${HEX[k]};color:#fff">${CN[k]}</button>`).join('')}</div>`);
      }
    }
  });
  function canPlayC(p, k) { const t = p.top; return col(k) === 'W' || col(k) === p.color || (col(t) !== 'W' && val(k) === val(t)); }
})();
