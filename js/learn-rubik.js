// Học Rubik 3x3: khối 3D xoay được, xáo trộn, bộ giải từng lớp (phương pháp người mới) và chế độ dạy từng bước.
(function () {
  const FACES = 'URFDLB', NV = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };
  // màu theo chỉ số mặt: U vàng · R đỏ · F xanh lá · D trắng · L cam · B xanh dương
  const COL = ['#FDD835', '#E53935', '#43A047', '#F5F5F5', '#FB8C00', '#1E63D6'];
  const RING = ['F', 'R', 'B', 'L'], C = l => FACES.indexOf(l);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const key = (p, n) => p.join(',') + '|' + n.join(',');
  const rotAxis = (v, n, th) => { const c = Math.cos(th), s = Math.sin(th), k = crs(n, v), d = dot(n, v) * (1 - c); return [v[0] * c + k[0] * s + n[0] * d, v[1] * c + k[1] * s + n[1] * d, v[2] * c + k[2] * s + n[2] * d]; };
  const cw = (v, n) => { const k = crs(n, v), d = dot(n, v); return [-k[0] + n[0] * d, -k[1] + n[1] * d, -k[2] + n[2] * d]; }; // xoay 90° thuận chiều kim đồng hồ nhìn từ ngoài

  const ST = [], IDX = {};
  for (let f = 0; f < 6; f++) { const n = NV[FACES[f]]; for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) if (dot([x, y, z], n) === 1) { IDX[key([x, y, z], n)] = ST.length; ST.push({ p: [x, y, z], n, f }); } }
  const PERM = {}; // PERM['R'] ... newState[perm[i]] = old[i]
  FACES.split('').forEach(L => {
    const n = NV[L], p1 = ST.map((s, i) => dot(s.p, n) === 1 ? IDX[key(cw(s.p, n), cw(s.n, n))] : i);
    const p2 = p1.map(j => p1[j]), p3 = p2.map(j => p1[j]);
    PERM[L] = p1; PERM[L + '2'] = p2; PERM[L + "'"] = p3;
  });
  const MOVES = Object.keys(PERM);
  const solvedState = () => ST.map(s => s.f);
  const applyP = (st, P) => { const o = st.slice(); for (let i = 0; i < 54; i++) o[P[i]] = st[i]; return o; };
  const isSolved = st => st.every((c, i) => c === ST[i].f);
  const inv = m => m.length === 1 ? m + "'" : m[1] === "'" ? m[0] : m;
  const amt = m => m.length === 1 ? 1 : m[1] === '2' ? 2 : 3;
  const simplify = arr => { const o = []; for (const m of arr) { const l = m[0]; if (o.length && o[o.length - 1][0] === l) { const a = (amt(o.pop()) + amt(m)) % 4; if (a) o.push(l + ['', '', '2', "'"][a]); } else o.push(m); } return o; };
  const scramble = (n = 20) => { const o = []; let last = ''; while (o.length < n) { const l = FACES[Math.floor(Math.random() * 6)]; if (l === last) continue; last = l; o.push(l + ['', "'", '2'][Math.floor(Math.random() * 3)]); } return o; };

  // ---- bộ giải từng lớp ----
  const homeIdx = cols => { const sum = cols.reduce((a, c) => add(a, NV[FACES[c]]), [0, 0, 0]); return cols.map(c => IDX[key(sum, NV[FACES[c]])]); };
  const pieceCube = (st, cols) => { // trả về chỉ số các sticker hiện tại của mảnh có các màu cols (theo thứ tự cols)
    const n = cols.length;
    for (let i = 0; i < 54; i++) {
      if (st[i] !== cols[0]) continue; const p = ST[i].p; if (p.filter(v => v).length !== n) continue;
      const ss = [0, 1, 2].filter(a => p[a]).map(a => { const nn = [0, 0, 0]; nn[a] = p[a]; return IDX[key(p, nn)]; });
      const res = cols.map(c => ss.find(s => st[s] === c)); if (res.every(v => v !== undefined) && new Set(res).size === n) return res;
    }
    throw new Error('piece');
  };
  const pieceDone = (st, cols) => { const h = homeIdx(cols); return h.every((s, k) => st[s] === cols[k]); };
  function bfs(st, pieces) { // tìm chuỗi nước đi ngắn nhất đưa các mảnh đã theo dõi về đúng chỗ
    const cur = [].concat(...pieces.map(c => pieceCube(st, c))), goal = [].concat(...pieces.map(c => homeIdx(c)));
    const enc = a => a.reduce((k, v) => k * 54 + v, 0), gk = enc(goal), sk = enc(cur);
    if (gk === sk) return [];
    const par = new Map([[sk, null]]); let fr = [[cur, sk]];
    while (fr.length) {
      const nx = [];
      for (const [pos, k] of fr) for (const m of MOVES) {
        const P = PERM[m], np = pos.map(x => P[x]), nk = enc(np); if (par.has(nk)) continue; par.set(nk, [k, m]);
        if (nk === gk) { const out = []; let c = nk; while (par.get(c)) { const [pk, mm] = par.get(c); out.push(mm); c = pk; } return out.reverse(); }
        nx.push([np, nk]);
      }
      fr = nx;
    }
    throw new Error('bfs');
  }

  const STAGE_INFO = [
    { n: 'Dấu cộng trắng', d: 'Đặt 4 viên cạnh có màu trắng xuống tầng dưới, mỗi viên khớp màu với tâm mặt bên cạnh nó (tạo thành dấu cộng trắng).' },
    { n: 'Góc trắng – tầng 1', d: 'Đưa 4 viên góc có màu trắng vào đúng chỗ ở tầng dưới. Lật góc lên tầng trên, xoay tầng trên đến ngay trên ô cần vào rồi lặp “R U R′ U′” cho đến khi góc vào đúng chỗ.' },
    { n: 'Cạnh tầng giữa – tầng 2', d: 'Đưa 4 viên cạnh không có màu vàng vào tầng giữa. Xoay tầng trên cho màu bên hông khớp tâm, rồi dùng công thức chèn sang phải hoặc sang trái.' },
    { n: 'Dấu cộng vàng', d: 'Làm các cạnh vàng ở mặt trên thành dấu cộng bằng công thức “F R U R′ U′ F′” (chấm → chữ L → đường thẳng → dấu cộng).' },
    { n: 'Xếp cạnh vàng', d: 'Xoay tầng trên cho các cạnh vàng khớp màu với tâm bên hông. Nếu chưa khớp hết, dùng “R U R′ U R U2 R′ U” để hoán đổi.' },
    { n: 'Đặt góc vàng', d: 'Đưa 4 góc vàng về đúng vị trí (chưa cần đúng hướng) bằng công thức “U R U′ L′ U R′ U′ L”.' },
    { n: 'Xoay góc vàng', d: 'Giữ góc cần xoay ở phía trước-phải-trên, lặp “R′ D′ R D” đến khi mặt vàng hướng lên, rồi xoay tầng trên sang góc kế tiếp. Xong là hoàn thành!' }
  ];

  function solve(start) {
    let st = start.slice(), out = [], stages = [];
    const mv = m => { st = applyP(st, PERM[m]); out.push(m); };
    const alg = (s, i) => s.split(' ').forEach(t => { const l = t[0], map = { F: RING[i % 4], R: RING[(i + 1) % 4], B: RING[(i + 2) % 4], L: RING[(i + 3) % 4] }; mv((map[l] || l) + t.slice(1)); });
    const stage = fn => { out = []; fn(); const m = simplify(out); stages.push(m); };
    const D = C('D'), U = C('U');
    const ringCol = i => C(RING[i % 4]);
    const xzSlot = p => { for (let i = 0; i < 4; i++) { const s = add(NV[RING[i]], NV[RING[(i + 1) % 4]]); if (s[0] === p[0] && s[2] === p[2]) return i; } return -1; };
    const posOf = s => ST[s].p;

    stage(() => { // 1. dấu cộng trắng
      const done = [];
      for (let i = 0; i < 4; i++) { done.push([D, ringCol(i)]); const ms = bfs(st, done); ms.forEach(mv); }
    });
    stage(() => { // 2. góc trắng
      const ALG_C = "R U R' U'";
      for (let i = 0; i < 4; i++) {
        const cs = [D, ringCol(i), ringCol(i + 1)];
        for (let g = 0; g < 12 && !pieceDone(st, cs); g++) {
          const p = posOf(pieceCube(st, cs)[0]);
          if (p[1] === -1) { alg("R U R'", xzSlot(p)); continue; }
          let k = 0; while (xzSlot(posOf(pieceCube(st, cs)[0])) !== i && k++ < 4) mv('U');
          for (let r = 0; r < 6 && !pieceDone(st, cs); r++) alg(ALG_C, i);
        }
      }
    });
    stage(() => { // 3. cạnh tầng giữa
      for (let i = 0; i < 4; i++) {
        const cs = [ringCol(i), ringCol(i + 1)];
        for (let g = 0; g < 8 && !pieceDone(st, cs); g++) {
          const e = pieceCube(st, cs), p = posOf(e[0]);
          if (p[1] === 0) { alg("U R U' R' U' F' U F", xzSlot(add(p, [0, 0, 0]))); continue; }
          const sideIdx = ST[e[0]].n[1] === 1 ? e[1] : e[0], top = sideIdx === e[0] ? e[1] : e[0];
          const sideCol = st[sideIdx], topCol = st[top], fl = FACES[sideCol];
          let k = 0; while (ST[pieceCube(st, cs).find(s => st[s] === sideCol)].n.join() !== NV[fl].join() && k++ < 4) mv('U');
          const ki = RING.indexOf(fl), other = FACES[topCol];
          if (RING[(ki + 1) % 4] === other) alg("U R U' R' U' F' U F", ki); else alg("U' L' U L U F U' F'", ki);
        }
      }
    });
    const uEdge = i => IDX[key(add(NV[RING[i % 4]], NV.U), NV.U)];
    stage(() => { // 4. dấu cộng vàng
      for (let g = 0; g < 8; g++) {
        const fl = [0, 1, 2, 3].map(i => st[uEdge(i)] === U), n = fl.filter(x => x).length;
        if (n === 4) break;
        if (n === 0) { alg("F R U R' U' F'", 0); continue; }
        let r = 0;
        if (n === 2) {
          const adj = [0, 1, 2, 3].find(i => fl[i] && fl[(i + 1) % 4]);
          if (adj !== undefined) r = (adj + 2) % 4; else { const op = fl[0] ? 0 : 1; r = (op + 3) % 4; }
        }
        alg("F R U R' U' F'", r);
      }
    });
    stage(() => { // 5. xếp cạnh vàng
      const match = i => st[IDX[key(add(NV[RING[i % 4]], NV.U), NV[RING[i % 4]])]] === ringCol(i);
      for (let g = 0; g < 10; g++) {
        let best = 0, bs = -1; for (let u = 0; u < 4; u++) { const sc = [0, 1, 2, 3].filter(i => { let s = st; for (let k = 0; k < u; k++) s = applyP(s, PERM.U); return s[IDX[key(add(NV[RING[i]], NV.U), NV[RING[i]])]] === ringCol(i); }).length; if (sc > bs) { bs = sc; best = u; } }
        for (let k = 0; k < best; k++) mv('U');
        const m = [0, 1, 2, 3].filter(match);
        if (m.length === 4) break;
        alg("R U R' U R U2 R' U", m.length ? (m[0] + 2) % 4 : 0);
      }
    });
    const cornerSet = i => { const p = add(add(NV[RING[i % 4]], NV[RING[(i + 1) % 4]]), NV.U); return [NV[RING[i % 4]], NV[RING[(i + 1) % 4]], NV.U].map(n => st[IDX[key(p, n)]]); };
    stage(() => { // 6. đặt góc vàng
      for (let g = 0; g < 8; g++) {
        const ok = [0, 1, 2, 3].map(i => { const s = cornerSet(i).slice().sort().join(), w = [ringCol(i), ringCol(i + 1), U].sort().join(); return s === w; });
        if (ok.every(x => x)) break;
        const f = ok.indexOf(true); alg("U R U' L' U R' U' L", f < 0 ? 0 : f);
      }
    });
    stage(() => { // 7. xoay góc vàng
      const urf = () => st[IDX[key(add(add(NV.R, NV.F), NV.U), NV.U)]];
      for (let rep = 0; rep < 4; rep++) { for (let g = 0; g < 6 && urf() !== U; g++) alg("R' D' R D", 0); mv('U'); }
      for (let k = 0; k < 4 && !isSolved(st); k++) mv('U');
    });
    if (!isSolved(st)) throw new Error('Không giải được');
    return stages.map((m, i) => ({ n: STAGE_INFO[i].n, d: STAGE_INFO[i].d, moves: m }));
  }

  GV.rubik = { solvedState, applyP, PERM, MOVES, solve, scramble, isSolved, inv, ST, IDX };

  // ---- giao diện ----
  const NAMES = { U: 'Trên', D: 'Dưới', L: 'Trái', R: 'Phải', F: 'Trước', B: 'Sau' };
  const mvText = m => `Xoay mặt ${NAMES[m[0]]} (${m[0]}) ` + (m.length === 1 ? '1/4 vòng theo chiều kim đồng hồ' : m[1] === "'" ? '1/4 vòng ngược chiều kim đồng hồ' : 'nửa vòng (180°)');

  GV.register({
    id: 'rubik', type: 'tool', cat: 'Học tập', name: 'Học giải Rubik 3D', icon: '🧊', desc: 'Khối Rubik 3×3 xoay 3D, bộ giải tự động và hướng dẫn trực quan từng bước (phương pháp từng lớp).',
    mount(el) {
      const $ = s => el.querySelector(s);
      el.innerHTML = `<style>.rb canvas{position:sticky;top:0;z-index:2;touch-action:none;cursor:grab;border-radius:16px;background:radial-gradient(circle at 50% 40%,var(--t-p),transparent 70%),var(--md-sc-high,#2b292d)}.rb .mvb{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.rb .mvb button{min-width:40px;height:34px;padding:0 8px;font-weight:700}body.ingame .rb canvas{max-height:36dvh!important}.rb .st{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}.rb .st i{width:26px;height:6px;border-radius:4px;background:var(--line)}.rb .st i.on{background:var(--ok)}.rb .st i.cur{background:var(--md-primary,#D0BCFF)}.rb .mc{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}.rb .mc b{padding:3px 8px;border-radius:8px;background:var(--md-sc-high,#2b292d);font-size:14px}.rb .mc b.dn{opacity:.4}.rb .mc b.cu{background:var(--t-p);outline:2px solid var(--md-primary,#D0BCFF)}.rb .box{text-align:left;padding:8px 12px;border-radius:12px;background:var(--md-sc-high,#2b292d);width:100%;box-sizing:border-box}.rb details{font-size:13px;color:var(--mut);width:100%}</style>
<div class="tool rb" style="max-width:520px;align-items:center"><canvas class="cv" width="360" height="360" style="width:100%;max-width:360px"></canvas>
<div class="mvb"><button class="btn ghost" data-m="U">U</button><button class="btn ghost" data-m="D">D</button><button class="btn ghost" data-m="L">L</button><button class="btn ghost" data-m="R">R</button><button class="btn ghost" data-m="F">F</button><button class="btn ghost" data-m="B">B</button><button class="btn ghost pr" title="Xoay ngược chiều">′ ngược</button></div>
<div class="row"><button class="btn ghost sc">🔀 Xáo trộn</button><button class="btn ghost rs">↺ Đặt lại</button><button class="btn sv">💡 Giải &amp; dạy</button></div>
<div class="plan" style="display:none;width:100%"><div class="st"></div><div class="box"><b class="pt"></b><div class="hint pd"></div><div class="mc" style="margin-top:6px;justify-content:flex-start"></div><div class="hint mt"></div></div>
<div class="row"><button class="btn ghost bk">⏮ Lùi</button><button class="btn nx">▶ Bước tiếp</button><button class="btn ghost au">⏯ Tự chạy</button></div></div>
<p class="msg"></p><details><summary>Ký hiệu &amp; cách xem</summary>Mỗi chữ là một mặt: U trên · D dưới · L trái · R phải · F trước · B sau. Chữ đứng một mình = xoay 1/4 vòng theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó; thêm ′ = ngược chiều; thêm 2 = nửa vòng. Kéo trên khối để xoay góc nhìn.</details></div>`;
      const cv = $('canvas'), g = cv.getContext('2d'), R = GV.rubik;
      let col = R.solvedState(), yaw = -0.6, pit = 0.5, anim = null, queue = [], plan = null, flat = [], pos = 0, auto = false, prime = false, dead = false, last = performance.now(), raf = 0;
      const msg = t => $('.msg').textContent = t || '';
      const busy = () => !!anim || queue.length > 0;
      const push = (m, done, dur) => queue.push({ m, done, dur: dur || .28 });
      function pump() { if (anim || !queue.length) return; const q = queue.shift(); anim = { m: q.m, t: 0, dur: q.dur, done: q.done, L: q.m[0], k: q.m.length === 1 ? 1 : q.m[1] === '2' ? 2 : -1 }; }
      const view = v => { const c1 = Math.cos(yaw), s1 = Math.sin(yaw), x1 = v[0] * c1 + v[2] * s1, z1 = -v[0] * s1 + v[2] * c1, c2 = Math.cos(pit), s2 = Math.sin(pit); return [x1, v[1] * c2 - z1 * s2, v[1] * s2 + z1 * c2]; };
      const tang = n => { const a = [0, 1, 2].filter(i => !n[i]); return a.map(i => { const v = [0, 0, 0]; v[i] = 1; return v; }); };
      function draw() {
        const polys = [], th = anim ? -Math.PI / 2 * anim.k * Math.min(1, anim.t) : 0, an = anim ? NV[anim.L] : null;
        const pushQ = (c, n, h, color, bias, cp) => {
          const [t1, t2] = tang(n), lay = an && dot(cp, an) === 1; // viên khối nằm trong lớp đang xoay
          const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { let v = [c[0] + t1[0] * a * h + t2[0] * b * h, c[1] + t1[1] * a * h + t2[1] * b * h, c[2] + t1[2] * a * h + t2[2] * b * h]; if (lay) v = rotAxis(v, an, th); return view(v); });
          let nn = n, cc = c; if (lay) { nn = rotAxis(n, an, th); cc = rotAxis(c, an, th); } nn = view(nn); cc = view(cc);
          if (nn[0] * -cc[0] + nn[1] * -cc[1] + nn[2] * (8 - cc[2]) <= 0) return;
          polys.push({ pts, color, d: 8 - cc[2] + bias });
        };
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) FACES.split('').forEach(L => { const n = NV[L]; pushQ(add([x, y, z], [n[0] * .5, n[1] * .5, n[2] * .5]), n, .5, '#16161c', 0, [x, y, z]); });
        ST.forEach((s, i) => { pushQ(add(s.p, [s.n[0] * .5, s.n[1] * .5, s.n[2] * .5]), s.n, .43, COL[col[i]], -.05, s.p); });
        polys.sort((a, b) => b.d - a.d);
        g.clearRect(0, 0, 360, 360); g.lineJoin = 'round';
        for (const p of polys) { g.beginPath(); p.pts.forEach((v, i) => { const d = 8 - v[2], sx = 180 + 330 * v[0] / d, sy = 180 - 330 * v[1] / d; i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); }); g.closePath(); g.fillStyle = p.color; g.fill(); if (p.color !== '#16161c') { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); } }
      }
      function tick(now) {
        if (dead) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
        pump(); if (anim) { anim.t += dt / anim.dur; if (anim.t >= 1) { col = R.applyP(col, R.PERM[anim.m]); const cb = anim.done; anim = null; if (cb) cb(); pump(); } }
        if (auto && !busy()) { if (pos < flat.length) next(); else { auto = false; ui(); } }
        draw(); raf = requestAnimationFrame(tick);
      }
      // kéo để xoay góc nhìn
      let drag = null; cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => { if (!drag) return; yaw += (e.clientX - drag[0]) * .012; pit = Math.max(-1.4, Math.min(1.4, pit + (e.clientY - drag[1]) * .012)); drag = [e.clientX, e.clientY]; });
      cv.addEventListener('pointerup', () => { drag = null; }); cv.addEventListener('pointercancel', () => { drag = null; });
      const reset = () => { plan = null; flat = []; pos = 0; auto = false; queue = []; anim = null; ui(); };
      function ui() {
        $('.plan').style.display = plan ? '' : 'none'; if (!plan) return;
        const si = pos < flat.length ? flat[pos].si : plan.length - 1, fin = pos >= flat.length;
        $('.st').innerHTML = plan.map((s, i) => `<i class="${i < si || fin ? 'on' : i === si ? 'cur' : ''}" title="${GV.esc(s.n)}"></i>`).join('');
        const s = plan[si]; $('.pt').textContent = fin ? '🎉 Hoàn thành! Khối Rubik đã được giải.' : `Bước ${si + 1}/${plan.length}: ${s.n}`; $('.pd').textContent = fin ? 'Bấm “Xáo trộn” để thử lại hoặc tự xoay rồi bấm “Giải & dạy”.' : s.d;
        const base = flat.findIndex(f => f.si === si);
        const cur = Math.max(0, pos - base); $('.mc').innerHTML = s.moves.length ? (cur > 2 ? '<span class="hint">…</span>' : '') + s.moves.map((m, i) => i < cur - 2 || i > cur + 8 ? '' : `<b class="${base + i < pos ? 'dn' : base + i === pos ? 'cu' : ''}">${m.replace("'", '′')}</b>`).join('') + (cur + 8 < s.moves.length - 1 ? '<span class="hint">…</span>' : '') : '<span class="hint">Bước này đã đúng sẵn – bỏ qua.</span>';
        $('.mt').textContent = fin ? '' : (flat[pos] ? mvText(flat[pos].m) : '');
        $('.au').textContent = auto ? '⏸ Dừng' : '⏯ Tự chạy'; $('.nx').disabled = fin; $('.bk').disabled = pos === 0;
      }
      function next() { if (busy() || !plan || pos >= flat.length) return; const f = flat[pos]; push(f.m, () => { pos++; ui(); }, auto ? .16 : .45); }
      function back() { if (busy() || !plan || pos === 0) return; auto = false; const f = flat[pos - 1]; push(R.inv(f.m), () => { pos--; ui(); }, .35); }
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m) { if (plan) reset(); push(b.dataset.m + (prime ? "'" : '')); return; }
        if (b.classList.contains('pr')) { prime = !prime; b.style.outline = prime ? '2px solid var(--md-primary,#D0BCFF)' : ''; el.querySelectorAll('[data-m]').forEach(x => x.textContent = x.dataset.m + (prime ? '′' : '')); return; }
        if (b.classList.contains('sc')) { reset(); msg(''); R.scramble(20).forEach(m => push(m, null, .1)); return; }
        if (b.classList.contains('rs')) { reset(); col = R.solvedState(); msg(''); return; }
        if (b.classList.contains('sv')) {
          if (busy()) return; if (R.isSolved(col)) return msg('Khối đã được giải sẵn. Bấm “Xáo trộn” trước nhé!');
          try { plan = R.solve(col); } catch (err) { plan = null; return msg('Không giải được: ' + err.message); }
          flat = []; plan.forEach((s, si) => s.moves.forEach(m => flat.push({ si, m }))); pos = 0; auto = false; msg(`Lời giải gồm ${flat.length} nước, chia 7 bước.`); ui(); return;
        }
        if (b.classList.contains('nx')) { auto = false; next(); return; }
        if (b.classList.contains('bk')) { back(); return; }
        if (b.classList.contains('au')) { auto = !auto; ui(); }
      });
      GV.rubikT = { get col() { return col; }, get plan() { return plan; }, get pos() { return pos; }, busy };
      raf = requestAnimationFrame(tick);
      return () => { dead = true; cancelAnimationFrame(raf); };
    }
  });
})();
