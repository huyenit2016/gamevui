// Cờ tướng online (2 người, hoặc đấu với máy). Đỏ đi trước. Có đủ luật: tượng bị cản mắt, mã bị cản chân, pháo nhảy, tốt qua sông, tướng đối mặt, chiếu/hết cờ.
(function () {
  const INIT = 'rnbakabnr' + '.........' + '.c.....c.' + 'p.p.p.p.p' + '.........' + '.........' + 'P.P.P.P.P' + '.C.....C.' + '.........' + 'RNBAKABNR';
  const GL = { K: '帥', A: '仕', B: '相', R: '俥', N: '傌', C: '炮', P: '兵', k: '將', a: '士', b: '象', r: '車', n: '馬', c: '砲', p: '卒' };
  const VAL = { k: 10000, a: 20, b: 20, n: 40, r: 90, c: 45, p: 10 };
  const sideOf = ch => ch === '.' ? null : (ch < 'a' ? 'r' : 'b'); // chữ hoa = Đỏ, chữ thường = Đen
  const opp = s => s === 'r' ? 'b' : 'r';

  // Sinh nước đi "giả hợp lệ" (chưa kiểm tra bị chiếu) của quân ở ô i. b là mảng 90 ký tự.
  function genPiece(b, i, out) {
    const ch = b[i], s = sideOf(ch), t = ch.toLowerCase(), r = (i / 9) | 0, c = i % 9;
    const push = (rr, cc) => { if (rr < 0 || rr > 9 || cc < 0 || cc > 8) return; const j = rr * 9 + cc; if (sideOf(b[j]) !== s) out.push(j); };
    const palace = (rr, cc) => cc >= 3 && cc <= 5 && (s === 'b' ? rr <= 2 : rr >= 7);
    if (t === 'k') { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (palace(r + dr, c + dc)) push(r + dr, c + dc); }
    else if (t === 'a') { for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) if (palace(r + dr, c + dc)) push(r + dr, c + dc); }
    else if (t === 'b') {
      for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
        const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 9 || cc < 0 || cc > 8) continue;
        if (s === 'b' ? rr > 4 : rr < 5) continue; // không qua sông
        if (b[(r + dr / 2) * 9 + c + dc / 2] !== '.') continue; // bị cản mắt
        push(rr, cc);
      }
    } else if (t === 'n') {
      for (const [dr, dc] of [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]]) {
        const lr = Math.abs(dr) === 2 ? r + dr / 2 : r, lc = Math.abs(dr) === 2 ? c : c + dc / 2;
        if (b[lr * 9 + lc] !== '.') continue; // bị cản chân
        push(r + dr, c + dc);
      }
    } else if (t === 'r') {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr <= 9 && cc >= 0 && cc <= 8) { const j = rr * 9 + cc; if (b[j] === '.') out.push(j); else { if (sideOf(b[j]) !== s) out.push(j); break; } rr += dr; cc += dc; }
      }
    } else if (t === 'c') {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let rr = r + dr, cc = c + dc, screen = false;
        while (rr >= 0 && rr <= 9 && cc >= 0 && cc <= 8) {
          const j = rr * 9 + cc;
          if (!screen) { if (b[j] === '.') out.push(j); else screen = true; }
          else if (b[j] !== '.') { if (sideOf(b[j]) !== s) out.push(j); break; }
          rr += dr; cc += dc;
        }
      }
    } else if (t === 'p') {
      const f = s === 'r' ? -1 : 1, crossed = s === 'r' ? r <= 4 : r >= 5;
      push(r + f, c); if (crossed) { push(r, c - 1); push(r, c + 1); }
    }
  }
  function kingPos(b, s) { const k = s === 'r' ? 'K' : 'k'; return b.indexOf(k); }
  function facing(b) { // hai tướng đối mặt không có quân chắn
    const a = b.indexOf('K'), d = b.indexOf('k'); if (a < 0 || d < 0 || a % 9 !== d % 9) return false;
    for (let j = d + 9; j < a; j += 9) if (b[j] !== '.') return false; return true;
  }
  function inCheck(b, s) {
    const k = kingPos(b, s); if (k < 0) return true; if (facing(b)) return true;
    const e = opp(s), out = [];
    for (let i = 0; i < 90; i++) if (sideOf(b[i]) === e) { out.length = 0; genPiece(b, i, out); if (out.includes(k)) return true; }
    return false;
  }
  // Tất cả nước đi hợp lệ của phe s: mảng [từ, đến]
  function legal(b, s) {
    const res = [], tmp = [];
    for (let i = 0; i < 90; i++) if (sideOf(b[i]) === s) {
      tmp.length = 0; genPiece(b, i, tmp);
      for (const j of tmp) { const cap = b[j]; b[j] = b[i]; b[i] = '.'; const bad = inCheck(b, s); b[i] = b[j]; b[j] = cap; if (!bad) res.push([i, j]); }
    }
    return res;
  }

  /* ---------- Máy đấu (alpha-beta, nhìn trước vài nước) ---------- */
  function evalBoard(b) { // điểm theo góc nhìn của Đỏ
    let sc = 0;
    for (let i = 0; i < 90; i++) {
      const ch = b[i]; if (ch === '.') continue; const t = ch.toLowerCase(), s = sideOf(ch), r = (i / 9) | 0, c = i % 9;
      let v = VAL[t];
      if (t === 'p') { const adv = s === 'r' ? 9 - r : r; v += adv > 4 ? 10 + (adv - 5) * 4 : 0; }
      if (t === 'n' || t === 'c') v += 4 - Math.abs(c - 4); // ưu tiên gần trung tâm
      if (t === 'r') v += (r >= 2 && r <= 7 ? 0 : 0);
      sc += s === 'r' ? v : -v;
    }
    return sc;
  }
  function search(b, depth, alpha, beta, s) {
    if (depth === 0) return (s === 'r' ? 1 : -1) * evalBoard(b);
    const moves = [], tmp = [];
    for (let i = 0; i < 90; i++) if (sideOf(b[i]) === s) { tmp.length = 0; genPiece(b, i, tmp); for (const j of tmp) moves.push([i, j, b[j] === '.' ? 0 : VAL[b[j].toLowerCase()]]); }
    moves.sort((x, y) => y[2] - x[2]);
    let best = -99999;
    for (const [i, j, cap] of moves) {
      if (cap >= 10000) return 10000 + depth; // ăn được tướng
      const old = b[j]; b[j] = b[i]; b[i] = '.';
      const sc = -search(b, depth - 1, -beta, -alpha, opp(s));
      b[i] = b[j]; b[j] = old;
      if (sc > best) best = sc; if (best > alpha) alpha = best; if (alpha >= beta) break;
    }
    return best;
  }
  function pickMove(bs, s, depth) {
    const b = bs.split(''), moves = legal(b, s); if (!moves.length) return null;
    let best = -Infinity, pool = [];
    moves.sort((x, y) => (b[y[1]] === '.' ? 0 : 1) - (b[x[1]] === '.' ? 0 : 1));
    for (const [i, j] of moves) {
      const old = b[j]; b[j] = b[i]; b[i] = '.';
      let sc = -search(b, depth - 1, -100000, 100000, opp(s));
      if (inCheck(b, opp(s))) sc += 3; // thích chiếu tướng một chút
      b[i] = b[j]; b[j] = old;
      if (sc > best + 1) { best = sc; pool = [[i, j]]; } else if (sc >= best - 1) { pool.push([i, j]); if (sc > best) best = sc; }
    }
    return pool[GV.rnd(pool.length)];
  }

  const name = (s, S) => (s === 'r' ? 'Đỏ' : 'Đen') + ' (' + S.names[S.players[s]] + ')';
  const log = (S, t) => { S.log.push(t); if (S.log.length > 20) S.log.shift(); };
  const sq = i => 'abcdefghi'[i % 9] + (10 - ((i / 9) | 0));

  GV.mp.define({
    id: 'cotuong', name: 'Cờ tướng online', icon: '♟️', desc: 'Cờ tướng 2 người qua mạng hoặc đấu với máy. Đỏ đi trước.', min: 2, max: 2,
    css: `.ct svg{width:100%;max-width:440px;display:block;margin:0 auto;touch-action:manipulation;user-select:none}.ct .hit{cursor:pointer}`,
    init(seats, api) {
      const sh = api.shuffle(seats.slice());
      const S = { board: INIT, turn: 'r', players: { r: sh[0].id, b: sh[1].id }, names: Object.fromEntries(seats.map(s => [s.id, s.name])), last: null, check: false, moveN: 0, log: [], over: null, depth: 4 };
      log(S, `${name('r', S)} đi trước.`); return S;
    },
    reduce(S, id, a) {
      if (S.over) return 'Ván đã kết thúc.';
      const mine = S.players.r === id ? 'r' : S.players.b === id ? 'b' : null; if (!mine) return 'Bạn không ở trong ván.';
      if (a.t === 'resign') { S.over = { winner: opp(mine), reason: 'đầu hàng' }; log(S, `${name(mine, S)} xin thua.`); return; }
      if (a.t === 'draw') { return; }
      if (a.t !== 'move') return;
      if (S.turn !== mine) return 'Chưa tới lượt bạn.';
      const b = S.board.split(''), from = +a.from, to = +a.to;
      if (!(from >= 0 && from < 90 && to >= 0 && to < 90) || sideOf(b[from]) !== mine) return 'Hãy chọn quân của bạn.';
      if (!legal(b, mine).some(m => m[0] === from && m[1] === to)) return 'Nước đi không hợp lệ (có thể bị chiếu hoặc sai luật).';
      const cap = b[to]; b[to] = b[from]; b[from] = '.';
      S.board = b.join(''); S.last = [from, to]; S.moveN++; S.turn = opp(mine);
      log(S, `${name(mine, S)}: ${GL[b[to]]} ${sq(from)}→${sq(to)}${cap !== '.' ? ' ăn ' + GL[cap] : ''}`);
      S.check = inCheck(b, S.turn);
      if (!legal(b, S.turn).length) { S.over = { winner: mine, reason: S.check ? 'chiếu bí' : 'hết nước đi' }; log(S, `🏆 ${name(mine, S)} thắng (${S.over.reason})!`); }
      else if (S.moveN >= 300) { S.over = { winner: null, reason: 'quá 300 nước – hòa' }; log(S, 'Ván hòa (quá 300 nước).'); }
      else if (S.check) log(S, '⚠️ Chiếu tướng!');
    },
    pub(S) { return { board: S.board, turn: S.over ? null : S.turn, players: S.players, names: S.names, last: S.last, check: S.check, moveN: S.moveN, log: S.log.slice(-8), over: S.over }; },
    priv() { return {}; },
    bot(S, id) {
      if (S.over) return null; const mine = S.players.r === id ? 'r' : S.players.b === id ? 'b' : null; if (!mine || S.turn !== mine) return null;
      const t0 = Date.now(), m = pickMove(S.board, mine, S.depth || 4);
      if (Date.now() - t0 > 900 && S.depth > 3) S.depth = 3; // máy yếu: giảm độ sâu để không bị đơ
      return m ? { t: 'move', from: m[0], to: m[1] } : { t: 'resign' };
    },
    render(box, c) {
      const p = c.pub, me = c.me, myColor = p.players.r === me ? 'r' : p.players.b === me ? 'b' : null, ui = c.ui;
      const flip = myColor === 'b', myTurn = p.turn === myColor, b = p.board.split('');
      const n = c.names, who = s => GV.esc(n[p.players[s]] || '?');
      const M = 30, G = 46, X = cc => M + (flip ? 8 - cc : cc) * G, Y = rr => M + (flip ? 9 - rr : rr) * G;
      const W = M * 2 + 8 * G, Hh = M * 2 + 9 * G;
      function paint() {
        if (ui.sel != null && (!myTurn || sideOf(b[ui.sel]) !== myColor)) ui.sel = null;
        const dests = ui.sel != null ? legal(b.slice(), myColor).filter(m => m[0] === ui.sel).map(m => m[1]) : [];
        ui.dests = dests;
        let g = `<rect x="0" y="0" width="${W}" height="${Hh}" rx="10" fill="#e8c98a"/><g stroke="#5a3b12" stroke-width="1.6" fill="none">`;
        for (let r = 0; r < 10; r++) g += `<line x1="${M}" y1="${M + r * G}" x2="${M + 8 * G}" y2="${M + r * G}"/>`;
        for (let cc = 0; cc < 9; cc++) { if (cc === 0 || cc === 8) g += `<line x1="${M + cc * G}" y1="${M}" x2="${M + cc * G}" y2="${M + 9 * G}"/>`; else g += `<line x1="${M + cc * G}" y1="${M}" x2="${M + cc * G}" y2="${M + 4 * G}"/><line x1="${M + cc * G}" y1="${M + 5 * G}" x2="${M + cc * G}" y2="${M + 9 * G}"/>`; }
        for (const r0 of [0, 7]) g += `<line x1="${M + 3 * G}" y1="${M + r0 * G}" x2="${M + 5 * G}" y2="${M + (r0 + 2) * G}"/><line x1="${M + 5 * G}" y1="${M + r0 * G}" x2="${M + 3 * G}" y2="${M + (r0 + 2) * G}"/>`;
        g += `</g><text x="${W / 2}" y="${M + 4.65 * G}" text-anchor="middle" font-size="20" fill="#5a3b12" opacity=".75" letter-spacing="10">楚河　漢界</text>`;
        if (p.last) p.last.forEach(i => { g += `<rect x="${X(i % 9) - G / 2 + 2}" y="${Y((i / 9) | 0) - G / 2 + 2}" width="${G - 4}" height="${G - 4}" fill="#3ddc97" opacity=".3" rx="6"/>`; });
        for (let i = 0; i < 90; i++) {
          const ch = b[i]; if (ch === '.') continue; const x = X(i % 9), y = Y((i / 9) | 0), red = sideOf(ch) === 'r', col = red ? '#c4161c' : '#111';
          const kingChk = p.check && ch === (p.turn === 'r' ? 'K' : 'k');
          g += `<g><circle cx="${x}" cy="${y}" r="20" fill="#fdf1d6" stroke="${ui.sel === i ? '#3b82f6' : kingChk ? '#ff0033' : col}" stroke-width="${ui.sel === i || kingChk ? 4 : 2}"/><circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${col}" stroke-width="1"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="21" font-weight="700" fill="${col}">${GL[ch]}</text></g>`;
        }
        dests.forEach(j => { g += `<circle cx="${X(j % 9)}" cy="${Y((j / 9) | 0)}" r="${b[j] === '.' ? 7 : 22}" fill="${b[j] === '.' ? '#3b82f6' : 'none'}" stroke="#3b82f6" stroke-width="3" opacity=".75"/>`; });
        for (let i = 0; i < 90; i++) g += `<rect class="hit" data-i="${i}" x="${X(i % 9) - G / 2}" y="${Y((i / 9) | 0) - G / 2}" width="${G}" height="${G}" fill="transparent"/>`;
        box.querySelector('svg').innerHTML = g;
      }
      let msg;
      if (p.over) msg = p.over.winner ? (p.over.winner === myColor ? '🎉 Bạn thắng!' : '🏆 ' + (p.over.winner === 'r' ? 'Đỏ' : 'Đen') + ' thắng') + ' (' + p.over.reason + ')' : 'Hòa – ' + p.over.reason;
      else msg = (myTurn ? 'Đến lượt bạn' : 'Lượt của ' + (p.turn === 'r' ? 'Đỏ' : 'Đen') + ' (' + who(p.turn) + ')') + (p.check ? ' – ⚠️ CHIẾU TƯỚNG!' : '');
      box.innerHTML = `<div class="ct"><div class="row"><span class="seat ${p.turn === 'b' ? 'turn' : ''}">⚫ Đen: ${who('b')}</span><span class="seat ${p.turn === 'r' ? 'turn' : ''}">🔴 Đỏ: ${who('r')}</span></div>
        <svg viewBox="0 0 ${W} ${Hh}"></svg><div class="msg">${msg}</div>
        ${myColor && !p.over ? '<div class="row"><button class="pbtn" data-a="resign">🏳️ Xin thua</button></div>' : ''}
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      paint();
      box.onclick = e => {
        if (e.target.closest('[data-a=resign]')) { if (confirm('Bạn chắc chắn xin thua?')) c.send({ t: 'resign' }); return; }
        const h = e.target.closest('.hit'); if (!h || p.over || !myColor) return;
        if (!myTurn) return c.toast('Chưa tới lượt bạn.');
        const i = +h.dataset.i;
        if (ui.sel != null && (ui.dests || []).includes(i)) { c.send({ t: 'move', from: ui.sel, to: i }); ui.sel = null; paint(); return; }
        ui.sel = sideOf(b[i]) === myColor && i !== ui.sel ? i : null; paint();
      };
    }
  });

  GV.mp.ct = { legal, initBoard: INIT, pickMove, sideOf };
})();
