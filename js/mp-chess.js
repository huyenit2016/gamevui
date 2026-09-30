// Cờ vua online (2 người, hoặc đấu với máy). Đủ luật: nhập thành, bắt tốt qua đường, phong cấp, chiếu/chiếu hết/hòa cờ (50 nước, lặp 3 lần, thiếu quân).
(function () {
  const INIT = 'rnbqkbnr' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'RNBQKBNR';
  const GL = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }; // dùng ký tự đặc, tô màu trắng/đen
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const side = ch => ch === '.' ? null : (ch < 'a' ? 'w' : 'b'); // chữ hoa = Trắng
  const opp = s => s === 'w' ? 'b' : 'w';
  const sqName = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
  const N_ = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
  const K_ = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]], BISH = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  function newPos() { return { b: INIT.split(''), t: 'w', c: 'KQkq', ep: -1, hm: 0, fm: 1 }; }
  function fromFEN(f) {
    const [pl, t, c, ep, hm, fm] = f.split(' '), b = [];
    for (const ch of pl) { if (ch === '/') continue; if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push('.'); else b.push(ch); }
    return { b, t, c: c === '-' ? '' : c, ep: ep === '-' ? -1 : 'abcdefgh'.indexOf(ep[0]) + (8 - +ep[1]) * 8, hm: +hm || 0, fm: +fm || 1 };
  }
  // ô sq có bị phe `by` tấn công không
  function attacked(b, sq, by) {
    const r = sq >> 3, c = sq & 7, P = by === 'w' ? 'P' : 'p', Nn = by === 'w' ? 'N' : 'n', Bb = by === 'w' ? 'B' : 'b', Rr = by === 'w' ? 'R' : 'r', Qq = by === 'w' ? 'Q' : 'q', Kk = by === 'w' ? 'K' : 'k';
    const pr = by === 'w' ? r + 1 : r - 1;
    if (pr >= 0 && pr < 8) for (const dc of [-1, 1]) { const cc = c + dc; if (cc >= 0 && cc < 8 && b[pr * 8 + cc] === P) return true; }
    for (const [dr, dc] of N_) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === Nn) return true; }
    for (const [dr, dc] of K_) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === Kk) return true; }
    for (const [dr, dc] of BISH) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const x = b[rr * 8 + cc]; if (x !== '.') { if (x === Bb || x === Qq) return true; break; } rr += dr; cc += dc; } }
    for (const [dr, dc] of ROOK) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const x = b[rr * 8 + cc]; if (x !== '.') { if (x === Rr || x === Qq) return true; break; } rr += dr; cc += dc; } }
    return false;
  }
  const kingSq = (b, s) => b.indexOf(s === 'w' ? 'K' : 'k');
  const inCheck = (pos, s = pos.t) => attacked(pos.b, kingSq(pos.b, s), opp(s));

  // Sinh nước đi giả hợp lệ (chưa loại nước để vua bị chiếu)
  function gen(pos) {
    const b = pos.b, s = pos.t, out = [];
    for (let i = 0; i < 64; i++) {
      const ch = b[i]; if (ch === '.' || side(ch) !== s) continue;
      const t = ch.toLowerCase(), r = i >> 3, c = i & 7;
      if (t === 'p') {
        const dir = s === 'w' ? -1 : 1, start = s === 'w' ? 6 : 1, last = s === 'w' ? 0 : 7, r1 = r + dir;
        const add = (to, extra) => { if ((to >> 3) === last) for (const p of ['q', 'r', 'b', 'n']) out.push({ f: i, t: to, p, ...extra }); else out.push({ f: i, t: to, ...extra }); };
        if (r1 >= 0 && r1 < 8) {
          if (b[r1 * 8 + c] === '.') { add(r1 * 8 + c); if (r === start && b[(r + 2 * dir) * 8 + c] === '.') out.push({ f: i, t: (r + 2 * dir) * 8 + c, dbl: true }); }
          for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7) continue; const to = r1 * 8 + cc; if (b[to] !== '.' && side(b[to]) !== s) add(to); else if (to === pos.ep) out.push({ f: i, t: to, ep: true }); }
        }
      } else if (t === 'n' || t === 'k') {
        for (const [dr, dc] of (t === 'n' ? N_ : K_)) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue; const to = rr * 8 + cc; if (side(b[to]) !== s) out.push({ f: i, t: to }); }
      } else {
        for (const [dr, dc] of (t === 'b' ? BISH : t === 'r' ? ROOK : BISH.concat(ROOK))) {
          let rr = r + dr, cc = c + dc;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const to = rr * 8 + cc; if (b[to] === '.') out.push({ f: i, t: to }); else { if (side(b[to]) !== s) out.push({ f: i, t: to }); break; } rr += dr; cc += dc; }
        }
      }
    }
    // nhập thành
    const home = s === 'w' ? 60 : 4, K = s === 'w' ? 'K' : 'k', R = s === 'w' ? 'R' : 'r', e = opp(s);
    if (b[home] === K && !attacked(b, home, e)) {
      if (pos.c.includes(s === 'w' ? 'K' : 'k') && b[home + 1] === '.' && b[home + 2] === '.' && b[home + 3] === R && !attacked(b, home + 1, e) && !attacked(b, home + 2, e)) out.push({ f: home, t: home + 2, cs: 'K' });
      if (pos.c.includes(s === 'w' ? 'Q' : 'q') && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && b[home - 4] === R && !attacked(b, home - 1, e) && !attacked(b, home - 2, e)) out.push({ f: home, t: home - 2, cs: 'Q' });
    }
    return out;
  }
  function make(pos, m) {
    const b = pos.b.slice(), ch = b[m.f], s = pos.t, t = ch.toLowerCase(), cap = b[m.t];
    b[m.t] = m.p ? (s === 'w' ? m.p.toUpperCase() : m.p) : ch; b[m.f] = '.';
    if (m.ep) b[m.t + (s === 'w' ? 8 : -8)] = '.';
    if (m.cs === 'K') { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = '.'; } else if (m.cs === 'Q') { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = '.'; }
    let c = pos.c;
    if (t === 'k') c = c.replace(s === 'w' ? /[KQ]/g : /[kq]/g, '');
    for (const sq of [m.f, m.t]) { if (sq === 63) c = c.replace('K', ''); else if (sq === 56) c = c.replace('Q', ''); else if (sq === 7) c = c.replace('k', ''); else if (sq === 0) c = c.replace('q', ''); }
    return { b, t: opp(s), c, ep: m.dbl ? (m.f + m.t) / 2 : -1, hm: (t === 'p' || cap !== '.') ? 0 : pos.hm + 1, fm: pos.fm + (s === 'b' ? 1 : 0) };
  }
  function legal(pos) {
    const s = pos.t, out = [];
    for (const m of gen(pos)) { const n = make(pos, m); if (!attacked(n.b, kingSq(n.b, s), opp(s))) out.push(m); }
    return out;
  }
  function insufficient(b) {
    const ps = b.filter(x => x !== '.' && x.toLowerCase() !== 'k');
    if (!ps.length) return true;
    if (ps.length === 1 && 'nb'.includes(ps[0].toLowerCase())) return true;
    return false;
  }
  const posKey = p => p.b.join('') + p.t + p.c + (p.ep >= 0 ? p.ep : '-');

  /* ---------- Máy đấu ---------- */
  const PST_P = [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0];
  function evalPos(b) { // điểm theo góc nhìn Trắng
    let sc = 0;
    for (let i = 0; i < 64; i++) {
      const ch = b[i]; if (ch === '.') continue; const t = ch.toLowerCase(), w = ch < 'a', r = i >> 3, c = i & 7;
      let v = VAL[t] === 20000 ? 0 : VAL[t];
      if (t === 'p') v += w ? PST_P[i] : PST_P[(7 - r) * 8 + c];
      else if (t === 'n' || t === 'b') { const d = Math.abs(3.5 - r) + Math.abs(3.5 - c); v += Math.round(20 - d * 5); }
      else if (t === 'q') v += 0;
      sc += w ? v : -v;
    }
    return sc;
  }
  function search(pos, depth, alpha, beta) {
    if (depth === 0) return (pos.t === 'w' ? 1 : -1) * evalPos(pos.b);
    const moves = gen(pos); let best = -99999;
    moves.forEach(m => { m.o = pos.b[m.t] === '.' ? 0 : VAL[pos.b[m.t].toLowerCase()] - VAL[pos.b[m.f].toLowerCase()] / 100; });
    moves.sort((x, y) => y.o - x.o);
    for (const m of moves) {
      if (pos.b[m.t].toLowerCase() === 'k') return 20000 + depth; // ăn được vua
      const sc = -search(make(pos, m), depth - 1, -beta, -alpha);
      if (sc > best) best = sc; if (best > alpha) alpha = best; if (alpha >= beta) break;
    }
    return best;
  }
  function pickMove(pos, depth) {
    const ms = legal(pos); if (!ms.length) return null;
    ms.forEach(m => { m.o = pos.b[m.t] === '.' ? 0 : VAL[pos.b[m.t].toLowerCase()]; }); ms.sort((x, y) => y.o - x.o);
    let best = -Infinity, pool = [];
    for (const m of ms) {
      const n = make(pos, m); let sc = -search(n, depth - 1, -100000, 100000);
      if (inCheck(n, n.t)) sc += 8;
      if (sc > best + 2) { best = sc; pool = [m]; } else if (sc >= best - 2) { pool.push(m); if (sc > best) best = sc; }
    }
    return pool[GV.rnd(pool.length)];
  }

  /* ---------- Trạng thái ván ---------- */
  const PN = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
  const log = (S, t) => { S.log.push(t); if (S.log.length > 24) S.log.shift(); };
  const pname = (s, S) => (s === 'w' ? 'Trắng' : 'Đen') + ' (' + S.names[S.players[s]] + ')';
  const toPos = S => ({ b: S.b.split(''), t: S.t, c: S.c, ep: S.ep, hm: S.hm, fm: S.fm });
  const setPos = (S, p) => { S.b = p.b.join(''); S.t = p.t; S.c = p.c; S.ep = p.ep; S.hm = p.hm; S.fm = p.fm; };

  GV.mp.define({
    id: 'chess', name: 'Cờ vua online', icon: '♞', desc: 'Cờ vua 2 người qua mạng hoặc đấu với máy. Đủ luật nhập thành, bắt tốt qua đường, phong cấp.', min: 2, max: 2,
    css: `.ch svg{width:100%;max-width:440px;display:block;margin:0 auto;touch-action:manipulation;user-select:none}.ch .hit{cursor:pointer}.ch .cap{font-size:13px}`,
    init(seats, api) {
      const sh = api.shuffle(seats.slice()), p = newPos();
      const S = { b: p.b.join(''), t: 'w', c: p.c, ep: -1, hm: 0, fm: 1, players: { w: sh[0].id, b: sh[1].id }, names: Object.fromEntries(seats.map(s => [s.id, s.name])), last: null, check: false, log: [], over: null, reps: {}, depth: 3 };
      S.reps[posKey(p)] = 1; log(S, `${pname('w', S)} đi trước.`); return S;
    },
    reduce(S, id, a) {
      if (S.over) return 'Ván đã kết thúc.';
      const mine = S.players.w === id ? 'w' : S.players.b === id ? 'b' : null; if (!mine) return 'Bạn không ở trong ván.';
      if (a.t === 'resign') { S.over = { winner: opp(mine), reason: 'đầu hàng' }; log(S, `${pname(mine, S)} xin thua.`); return; }
      if (a.t !== 'move') return;
      if (S.t !== mine) return 'Chưa tới lượt bạn.';
      const pos = toPos(S), want = a.p || null, m = legal(pos).find(x => x.f === +a.f && x.t === +a.to && (x.p ? x.p === (want || 'q') : true));
      if (!m) return 'Nước đi không hợp lệ.';
      const pc = pos.b[m.f], cap = pos.b[m.t] !== '.' || m.ep, np = make(pos, m);
      const txt = m.cs ? (m.cs === 'K' ? 'O-O' : 'O-O-O') : `${PN[pc.toLowerCase()]}${sqName(m.f)}${cap ? 'x' : '-'}${sqName(m.t)}${m.p ? '=' + m.p.toUpperCase() : ''}`;
      setPos(S, np); S.last = [m.f, m.t];
      const key = posKey(np); S.reps[key] = (S.reps[key] || 0) + 1;
      const chk = inCheck(np), moves = legal(np); S.check = chk;
      log(S, `${pname(mine, S)}: ${txt}${chk ? '+' : ''}`);
      if (!moves.length) { if (chk) { S.over = { winner: mine, reason: 'chiếu hết' }; log(S, `🏆 ${pname(mine, S)} thắng (chiếu hết)!`); } else { S.over = { winner: null, reason: 'hết nước đi (pat) – hòa' }; log(S, 'Hòa (pat).'); } }
      else if (S.reps[key] >= 3) { S.over = { winner: null, reason: 'lặp lại thế cờ 3 lần – hòa' }; log(S, 'Hòa (lặp thế cờ).'); }
      else if (np.hm >= 100) { S.over = { winner: null, reason: 'quá 50 nước không ăn quân/đi tốt – hòa' }; log(S, 'Hòa (luật 50 nước).'); }
      else if (insufficient(np.b)) { S.over = { winner: null, reason: 'không đủ quân chiếu hết – hòa' }; log(S, 'Hòa (thiếu quân).'); }
      else if (chk) log(S, '⚠️ Chiếu!');
    },
    pub(S) { return { b: S.b, t: S.over ? null : S.t, c: S.c || '-', ep: S.ep, hm: S.hm, fm: S.fm, players: S.players, names: S.names, last: S.last, check: S.check, log: S.log.slice(-8), over: S.over }; },
    summary(S) { const o = S.over; return { title: o.winner ? '🏆 ' + pname(o.winner, S) + ' thắng' : 'Hòa', lines: [o.reason, 'Nước thứ ' + S.fm] }; },
    priv() { return {}; },
    bot(S, id) {
      if (S.over) return null; const mine = S.players.w === id ? 'w' : S.players.b === id ? 'b' : null; if (!mine || S.t !== mine) return null;
      const t0 = Date.now(), m = pickMove(toPos(S), S.depth || 3);
      if (Date.now() - t0 > 1200 && S.depth > 2) S.depth--;
      return m ? { t: 'move', f: m.f, to: m.t, p: m.p || null } : { t: 'resign' };
    },
    render(box, c) {
      const p = c.pub, me = c.me, col = p.players.w === me ? 'w' : p.players.b === me ? 'b' : null, ui = c.ui;
      const flip = col === 'b', myTurn = p.t === col, pos = { b: p.b.split(''), t: p.t || col || 'w', c: p.c === '-' ? '' : p.c, ep: p.ep, hm: p.hm, fm: p.fm };
      const n = c.names, who = s => GV.esc(n[p.players[s]] || '?');
      const M = 20, G = 50, X = cc => M + (flip ? 7 - cc : cc) * G, Y = rr => M + (flip ? 7 - rr : rr) * G, W = M * 2 + 8 * G;
      const cnt = { w: {}, b: {} }; pos.b.forEach(x => { if (x !== '.') { const s = side(x); cnt[s][x.toLowerCase()] = (cnt[s][x.toLowerCase()] || 0) + 1; } });
      const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
      const lost = s => Object.keys(start).map(k => GL[k].repeat(Math.max(0, start[k] - (cnt[s][k] || 0)))).join('');
      const matv = s => Object.keys(start).reduce((a, k) => a + (cnt[s][k] || 0) * VAL[k], 0);
      function paint() {
        if (ui.sel != null && (!myTurn || side(pos.b[ui.sel]) !== col)) ui.sel = null;
        ui.moves = ui.sel != null && myTurn ? legal(pos).filter(m => m.f === ui.sel) : [];
        let g = '';
        for (let i = 0; i < 64; i++) { const r = i >> 3, cc = i & 7; g += `<rect x="${X(cc)}" y="${Y(r)}" width="${G}" height="${G}" fill="${(r + cc) % 2 ? '#b58863' : '#f0d9b5'}"/>`; }
        if (p.last) p.last.forEach(i => { g += `<rect x="${X(i & 7)}" y="${Y(i >> 3)}" width="${G}" height="${G}" fill="#3ddc97" opacity=".4"/>`; });
        const ks = p.check ? kingSq(pos.b, p.t) : -1;
        if (ks >= 0) g += `<rect x="${X(ks & 7)}" y="${Y(ks >> 3)}" width="${G}" height="${G}" fill="#ff2d55" opacity=".55"/>`;
        if (ui.sel != null) g += `<rect x="${X(ui.sel & 7)}" y="${Y(ui.sel >> 3)}" width="${G}" height="${G}" fill="#3b82f6" opacity=".5"/>`;
        for (let i = 0; i < 64; i++) {
          const ch = pos.b[i]; if (ch === '.') continue; const w = ch < 'a';
          g += `<text x="${X(i & 7) + G / 2}" y="${Y(i >> 3) + G * .76}" text-anchor="middle" font-size="${G * .82}" fill="${w ? '#fff' : '#1a1a1a'}" stroke="${w ? '#1a1a1a' : '#fff'}" stroke-width="${w ? 1.4 : .6}" paint-order="stroke">${GL[ch.toLowerCase()]}&#xFE0E;</text>`;
        }
        [...new Set(ui.moves.map(m => m.t))].forEach(j => { const occ = pos.b[j] !== '.' || (j === pos.ep && pos.b[ui.sel].toLowerCase() === 'p'); g += occ ? `<circle cx="${X(j & 7) + G / 2}" cy="${Y(j >> 3) + G / 2}" r="${G * .44}" fill="none" stroke="#3b82f6" stroke-width="4" opacity=".85"/>` : `<circle cx="${X(j & 7) + G / 2}" cy="${Y(j >> 3) + G / 2}" r="8" fill="#3b82f6" opacity=".8"/>`; });
        for (let k = 0; k < 8; k++) { g += `<text x="${X(k) + G / 2}" y="${W - 5}" text-anchor="middle" font-size="12" fill="#7a5c3a">${'abcdefgh'[k]}</text><text x="6" y="${Y(k) + G / 2 + 4}" font-size="12" fill="#7a5c3a">${8 - k}</text>`; }
        for (let i = 0; i < 64; i++) g += `<rect class="hit" data-i="${i}" x="${X(i & 7)}" y="${Y(i >> 3)}" width="${G}" height="${G}" fill="transparent"/>`;
        box.querySelector('svg').innerHTML = g;
        const pr = box.querySelector('.promo'); pr.hidden = !ui.promo;
      }
      let msg;
      if (p.over) msg = p.over.winner ? (p.over.winner === col ? '🎉 Bạn thắng!' : '🏆 ' + (p.over.winner === 'w' ? 'Trắng' : 'Đen') + ' thắng') + ' (' + p.over.reason + ')' : 'Hòa – ' + p.over.reason;
      else msg = (myTurn ? 'Đến lượt bạn' : 'Lượt của ' + (p.t === 'w' ? 'Trắng' : 'Đen') + ' (' + who(p.t) + ')') + (p.check ? ' – ⚠️ CHIẾU!' : '');
      const adv = matv('w') - matv('b');
      box.innerHTML = `<div class="ch"><div class="row"><span class="seat ${p.t === 'b' ? 'turn' : ''}">⚫ Đen: ${who('b')}</span><span class="seat ${p.t === 'w' ? 'turn' : ''}">⚪ Trắng: ${who('w')}</span></div>
        <div class="cap hint" style="text-align:center">Đã ăn – Trắng mất: ${lost('w') || '—'} · Đen mất: ${lost('b') || '—'}${adv ? ` · ${adv > 0 ? 'Trắng' : 'Đen'} hơn ${Math.round(Math.abs(adv) / 100)} điểm` : ''}</div>
        <svg viewBox="0 0 ${W} ${W}"></svg>
        <div class="row promo" hidden><b>Phong thành:</b>${['q', 'r', 'b', 'n'].map(k => `<button class="pbtn" data-p="${k}">${GL[k]}&#xFE0E;</button>`).join('')}<button class="pbtn" data-p="x">Huỷ</button></div>
        <div class="msg">${msg}</div>
        ${col && !p.over ? '<div class="row"><button class="pbtn" data-a="resign">🏳️ Xin thua</button></div>' : ''}
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      ui.promo = ui.promo && myTurn ? ui.promo : null; paint();
      box.onclick = e => {
        if (e.target.closest('[data-a=resign]')) { if (confirm('Bạn chắc chắn xin thua?')) c.send({ t: 'resign' }); return; }
        const pb = e.target.closest('[data-p]');
        if (pb && ui.promo) { const pk = pb.dataset.p; const mv = ui.promo; ui.promo = null; if (pk !== 'x') c.send({ t: 'move', f: mv.f, to: mv.t, p: pk }); ui.sel = null; return paint(); }
        const h = e.target.closest('.hit'); if (!h || p.over || !col || ui.promo) return;
        if (!myTurn) return c.toast('Chưa tới lượt bạn.');
        const i = +h.dataset.i, mv = (ui.moves || []).filter(m => m.t === i);
        if (ui.sel != null && mv.length) {
          if (mv[0].p) { ui.promo = { f: ui.sel, t: i }; return paint(); }
          c.send({ t: 'move', f: ui.sel, to: i }); ui.sel = null; return paint();
        }
        ui.sel = side(pos.b[i]) === col && i !== ui.sel ? i : null; paint();
      };
    }
  });

  GV.mp.chess = { newPos, fromFEN, legal, make, pickMove, inCheck };
})();
