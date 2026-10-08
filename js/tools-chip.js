// Thiết kế mạch số (chip logic): vẽ sơ đồ cổng, mô phỏng xung nhịp, giản đồ sóng, bảng chân trị, rút gọn Quine–McCluskey, biểu thức → mạch, xuất Verilog.
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const GATES = { AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 ^ (a & b), NOR: (a, b) => 1 ^ (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 ^ (a ^ b) };
  const TYPES = { IN: { i: 0, o: 1, w: 58, h: 34 }, CLK: { i: 0, o: 1, w: 58, h: 34 }, OUT: { i: 1, o: 0, w: 58, h: 34 }, NOT: { i: 1, o: 1, w: 64, h: 36 }, DFF: { i: 2, o: 2, w: 80, h: 66 } };
  Object.keys(GATES).forEach(g => { TYPES[g] = { i: 2, o: 1, w: 74, h: 46 }; });
  const PAL = ['IN', 'CLK', 'OUT', 'NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'DFF'];
  const WW = 820, WH = 440;

  /* ---------- biểu thức → cây → mạch ---------- */
  function parseExprs(src) {
    const lines = String(src).split(/[\n;]+/).map(s => s.trim()).filter(Boolean), out = [];
    lines.forEach((ln, idx) => {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(ln); const name = m ? m[1] : (lines.length === 1 ? 'F' : 'F' + (idx + 1)), body = m ? m[2] : ln;
      const tk = body.match(/[A-Za-z_][A-Za-z0-9_]*|[!~'()&*|+^]|\S/g) || []; let p = 0;
      const peek = () => tk[p], next = () => tk[p++];
      const prim = () => { const t = next(); if (t === '(') { const e = orE(); if (next() !== ')') throw new Error('Thiếu dấu ")"'); return post(e); } if (t === '!' || t === '~') return { t: 'not', a: prim() }; if (t && /^[A-Za-z_]/.test(t)) return post({ t: 'var', n: t }); throw new Error('Không hiểu: ' + (t || 'hết biểu thức')); };
      const post = e => { while (peek() === "'") { next(); e = { t: 'not', a: e }; } return e; };
      const andE = () => { let l = prim(); while (peek() === '&' || peek() === '*') { next(); l = { t: 'and', a: l, b: prim() }; } return l; };
      const xorE = () => { let l = andE(); while (peek() === '^') { next(); l = { t: 'xor', a: l, b: andE() }; } return l; };
      const orE = () => { let l = xorE(); while (peek() === '|' || peek() === '+') { next(); l = { t: 'or', a: l, b: xorE() }; } return l; };
      const ast = orE(); if (p < tk.length) throw new Error('Thừa ký tự: ' + tk[p]); out.push({ name, ast });
    });
    if (!out.length) throw new Error('Chưa nhập biểu thức.');
    return out;
  }
  function circuitFromExprs(eqs) {
    const nodes = [], wires = [], vars = {}, defs = {}, cache = {}; let id = 1; const depthOf = new Map(), cols = {};
    const add = (t, label, depth) => { const n = { id: id++, t, l: label || '', x: 0, y: 0, v: 0 }; nodes.push(n); depthOf.set(n.id, depth); return n; };
    const build = ast => {
      if (ast.t === 'var') { if (defs[ast.n]) return defs[ast.n]; if (!vars[ast.n]) vars[ast.n] = add('IN', ast.n, 0); return vars[ast.n]; }
      const key = JSON.stringify(ast); if (cache[key]) return cache[key];
      const kids = ast.t === 'not' ? [build(ast.a)] : [build(ast.a), build(ast.b)], d = 1 + Math.max(...kids.map(k => depthOf.get(k.id)));
      const g = add(ast.t === 'not' ? 'NOT' : ast.t.toUpperCase(), '', d); kids.forEach((k, i) => wires.push({ a: k.id, ao: 0, b: g.id, bi: i })); return cache[key] = g;
    };
    eqs.forEach(e => { const g = build(e.ast); defs[e.name] = g; });
    const maxD = Math.max(...[...depthOf.values()], 0);
    eqs.forEach(e => { const g = defs[e.name], o = add('OUT', e.name, maxD + 1); wires.push({ a: g.id, ao: 0, b: o.id, bi: 0 }); });
    nodes.forEach(n => { const d = depthOf.get(n.id); cols[d] = (cols[d] || 0); n.x = 24 + d * 128; n.y = 24 + cols[d] * 62; cols[d]++; });
    return { nodes, wires };
  }

  /* ---------- Quine–McCluskey ---------- */
  function qm(nv, mins) {
    if (!mins.length) return null; if (mins.length === (1 << nv)) return [];
    let terms = mins.map(m => ({ b: m.toString(2).padStart(nv, '0'), m: [m] })), primes = [];
    for (;;) {
      const used = new Set(), nxt = new Map();
      for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) { let diff = -1, ok = true; for (let k = 0; k < nv; k++) if (terms[i].b[k] !== terms[j].b[k]) { if (terms[i].b[k] === '-' || terms[j].b[k] === '-' || diff >= 0) { ok = false; break; } diff = k; } if (ok && diff >= 0) { const b = terms[i].b.slice(0, diff) + '-' + terms[i].b.slice(diff + 1); used.add(i); used.add(j); if (!nxt.has(b)) nxt.set(b, { b, m: [...new Set(terms[i].m.concat(terms[j].m))] }); } }
      terms.forEach((t, i) => { if (!used.has(i) && !primes.some(p => p.b === t.b)) primes.push(t); }); if (!nxt.size) break; terms = [...nxt.values()];
    }
    const cover = new Set(), pick = []; // thiết yếu rồi tham lam
    mins.forEach(m => { const c = primes.filter(p => p.m.includes(m)); if (c.length === 1 && !pick.includes(c[0])) { pick.push(c[0]); c[0].m.forEach(x => cover.add(x)); } });
    let rest = mins.filter(m => !cover.has(m)); while (rest.length) { let best = null, bs = -1; primes.forEach(p => { const s = p.m.filter(x => rest.includes(x)).length; if (s > bs) { bs = s; best = p; } }); pick.push(best); rest = rest.filter(m => !best.m.includes(m)); }
    return pick.map(p => p.b);
  }
  const sopText = (imps, names) => imps === null ? '0' : !imps.length ? '1' : imps.map(b => [...b].map((ch, i) => ch === '-' ? null : (ch === '1' ? names[i] : '!' + names[i])).filter(Boolean).join('&')).join(' | ');

  GV.register({
    id: 'chipdesign', type: 'tool', cat: 'Học tập', name: 'Thiết kế mạch số (chip)', icon: '🔌', desc: 'Vẽ sơ đồ cổng logic, mô phỏng xung nhịp, xem giản đồ sóng, bảng chân trị, rút gọn biểu thức và xuất mã Verilog – bước đầu của thiết kế vi mạch.',
    mount(el) {
      let C = { nodes: [], wires: [] }, uid = 1, tool = 'move', zoom = .8, sel = null, drag = null, wire = null, run = 0, hz = 2, tab = 'wave', hist = [], dead = false, over = false;
      const saved = GV.store.get('chipdesign', null); if (saved && saved.nodes) { C = saved; uid = Math.max(0, ...C.nodes.map(n => n.id)) + 1; }
      const save = () => GV.store.set('chipdesign', C);
      el.innerHTML = `<style>.cp{max-width:900px;width:100%}.cp>*{width:100%;box-sizing:border-box}.cp .tl{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;align-items:center;margin:4px 0}.cp .tl .btn{height:32px;padding:0 9px;font-size:13px;flex:none}.cp .tl .on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.cp select{height:32px;min-height:0;padding:0 8px;font-size:13px;width:auto;min-width:0}.cp .pal2{display:flex;gap:5px;overflow-x:auto;padding:2px;justify-content:flex-start;scrollbar-width:none}.cp .pal2 .btn{flex:none;height:32px;padding:0 10px;font-size:12px;font-weight:700}.cp .cv2{height:min(42dvh,430px);overflow:auto;border-radius:12px;background:#0f1a22;border:1px solid var(--line);touch-action:none}.cp svg text{font:700 12px Roboto,sans-serif;fill:#cfe6ff;pointer-events:none;user-select:none}.cp .gp{fill:#16324a;stroke:#7cc4ff;stroke-width:2}.cp .gp.sel{stroke:#ffeb3b}.cp .pin{fill:#0f1a22;stroke:#7cc4ff;stroke-width:2;cursor:crosshair}.cp .pin.on{fill:#4cff8a}.cp .w{fill:none;stroke:#4a6a85;stroke-width:3}.cp .w.on{stroke:#4cff8a}.cp .w.sel{stroke:#ffeb3b}.cp .wh{fill:none;stroke:transparent;stroke-width:14;cursor:pointer}.cp .pn{border:1px solid var(--line);border-radius:12px;padding:8px;min-height:90px;max-height:34dvh;overflow:auto;text-align:left}.cp pre{white-space:pre-wrap;font-size:12px;margin:0}.cp table{border-collapse:collapse;font-size:13px}.cp td,.cp th{border:1px solid var(--line);padding:2px 8px;text-align:center}.cp td.h{background:rgba(76,255,138,.18);font-weight:700}.cp textarea{width:100%;box-sizing:border-box;min-height:70px;font:13px monospace;padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--inp,#1c1b1f);color:var(--fg)}.cp canvas{width:100%;display:block}.cp .info{font-size:12px;min-height:1.3em}</style>
<div class="cp tool"><div class="pal2">${PAL.map(t => `<button class="btn ghost" data-add="${t}">${t}</button>`).join('')}</div>
<div class="tl"><button class="btn ghost on" data-tool="move">↔ Chọn/kéo</button><button class="btn ghost" data-tool="del">🗑 Xoá</button><button class="btn ghost zm" data-z="-1">🔍−</button><button class="btn ghost zm" data-z="1">🔍+</button><button class="btn ghost clr">🧹 Làm mới</button><select class="ex"><option value="">📚 Ví dụ…</option><option value="half">Bán cộng</option><option value="full">Toàn cộng</option><option value="mux">Mux 2→1</option><option value="cmp">So sánh 1 bit</option><option value="sr">Chốt SR (NOR)</option><option value="cnt">Bộ đếm 2 bit</option></select></div>
<div class="tl"><button class="btn runb">▶ Chạy xung</button><button class="btn ghost step">⏭ 1 xung</button><select class="hz"><option value="1">1 Hz</option><option value="2" selected>2 Hz</option><option value="5">5 Hz</option></select><span class="hint info"></span></div>
<div class="cv2"><svg class="sv" xmlns="http://www.w3.org/2000/svg"></svg></div>
<div class="tl tabs"><button class="btn ghost on" data-tab="wave">📈 Sóng</button><button class="btn ghost" data-tab="tt">📋 Chân trị</button><button class="btn ghost" data-tab="ex">✍️ Biểu thức</button><button class="btn ghost" data-tab="vl">📄 Verilog</button><button class="btn ghost" data-tab="sv">💾 Lưu/Mã</button></div>
<div class="pn"></div></div>`;
      const svg = $(el, '.sv'), panel = $(el, '.pn'), info = t => $(el, '.info').textContent = t || '';
      const byId = id => C.nodes.find(n => n.id === id), T = n => TYPES[n.t];
      const inPin = (n, i) => ({ x: n.x, y: n.y + (i + 1) * T(n).h / (T(n).i + 1) }), outPin = (n, j) => ({ x: n.x + T(n).w, y: n.y + (j + 1) * T(n).h / (T(n).o + 1) });
      const wireIn = (n, i) => C.wires.find(w => w.b === n.id && w.bi === i);

      /* ---------- mô phỏng ---------- */
      let vals = new Map();
      const outs = (n, iv) => { const t = n.t; if (t === 'IN' || t === 'CLK') return [n.v | 0]; if (t === 'NOT') return [1 ^ iv(0)]; if (t === 'DFF') return [n.q | 0, 1 ^ (n.q | 0)]; if (t === 'OUT') return [iv(0)]; return [GATES[t](iv(0), iv(1))]; };
      function settle() {
        const iv = n => i => { const w = wireIn(n, i); if (!w) return 0; const a = vals.get(w.a); return a ? a[w.ao] | 0 : 0; };
        C.nodes.forEach(n => { if (!vals.has(n.id)) vals.set(n.id, outs(n, () => 0)); }); [...vals.keys()].forEach(k => { if (!byId(k)) vals.delete(k); });
        let k = 0, ch = true; while (ch && k++ < 80) { ch = false; C.nodes.forEach(n => { const o = outs(n, iv(n)), p = vals.get(n.id); if (!p || o.some((v, i) => v !== p[i])) { vals.set(n.id, o); ch = true; } }); }
        over = ch; return iv;
      }
      function simulate() { // ổn định → bắt cạnh lên xung nhịp → lặp
        for (let r = 0; r < 6; r++) { const iv = settle(); let latched = false; const upd = []; C.nodes.filter(n => n.t === 'DFF').forEach(n => { const clk = iv(n)(1), d = iv(n)(0); if (clk === 1 && !n.pc) upd.push([n, d]); n.pc = clk; }); upd.forEach(([n, d]) => { n.q = d; latched = true; }); if (!latched) break; }
        info(over ? '⚠️ Mạch dao động/không ổn định (vòng phản hồi)' : '');
      }
      const val = (n, j = 0) => (vals.get(n.id) || [0, 0])[j] | 0;
      const inVal = (n, i) => { const w = wireIn(n, i); return w ? val(byId(w.a), w.ao) : 0; };
      const sigs = () => C.nodes.filter(n => ['IN', 'CLK', 'OUT'].includes(n.t) || n.t === 'DFF').sort((a, b) => a.x - b.x || a.y - b.y).map(n => ({ n, name: n.l || (n.t + n.id) + (n.t === 'DFF' ? '.Q' : ''), get v() { return n.t === 'OUT' ? inVal(n, 0) : val(n, 0); } }));
      function record() { hist.push(sigs().map(s => s.v)); if (hist.length > 48) hist.shift(); }

      /* ---------- vẽ ---------- */
      const gpath = (t, w, h) => { const b = ['NAND', 'NOR', 'XNOR'].includes(t), bw = b ? w - 10 : w, ty = b ? t.slice(1) : t;
        if (ty === 'AND' || ty === 'NAND') return `M0 0 H${bw * .55} A${bw * .45} ${h / 2} 0 0 1 ${bw * .55} ${h} H0 Z`;
        if (ty === 'NOT') return `M0 0 L${w - 10} ${h / 2} L0 ${h} Z`;
        return `M0 0 Q${bw * .55} 0 ${bw} ${h / 2} Q${bw * .55} ${h} 0 ${h} Q${bw * .28} ${h / 2} 0 0 Z`; };
      function render() {
        const z = zoom; svg.setAttribute('width', WW * z); svg.setAttribute('height', WH * z); svg.setAttribute('viewBox', `0 0 ${WW} ${WH}`);
        let h = '';
        for (let x = 0; x < WW; x += 40) h += `<line x1="${x}" y1="0" x2="${x}" y2="${WH}" stroke="#ffffff10"/>`; for (let y = 0; y < WH; y += 40) h += `<line x1="0" y1="${y}" x2="${WW}" y2="${y}" stroke="#ffffff10"/>`;
        const wpath = (a, b) => { const dx = Math.max(30, Math.abs(b.x - a.x) / 2); return `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`; };
        C.wires.forEach((w, i) => { const a = byId(w.a), b = byId(w.b); if (!a || !b) return; const d = wpath(outPin(a, w.ao), inPin(b, w.bi)); h += `<path class="w ${val(a, w.ao) ? 'on' : ''} ${sel === 'w' + i ? 'sel' : ''}" d="${d}"/><path class="wh" data-w="${i}" d="${d}"/>`; });
        if (wire) h += `<path class="w" stroke-dasharray="6 4" d="${wpath(wire.from, wire.to)}"/>`;
        C.nodes.forEach(n => {
          const t = T(n), cl = 'gp' + (sel === n.id ? ' sel' : ''); h += `<g transform="translate(${n.x} ${n.y})" data-n="${n.id}">`;
          if (n.t === 'IN' || n.t === 'CLK') h += `<rect class="${cl}" width="${t.w}" height="${t.h}" rx="${n.t === 'CLK' ? 4 : 17}" style="fill:${val(n) ? '#1d6b3a' : '#16324a'}"/><text x="${t.w / 2 - 6}" y="${t.h / 2 + 4}" text-anchor="middle">${esc(n.t === 'CLK' ? 'CLK' : n.l)} = ${val(n)}</text>`;
          else if (n.t === 'OUT') h += `<rect class="${cl}" width="${t.w}" height="${t.h}" rx="17" style="fill:${inVal(n, 0) ? '#1d6b3a' : '#16324a'}"/><circle cx="${t.w - 14}" cy="${t.h / 2}" r="6" fill="${inVal(n, 0) ? '#4cff8a' : '#2a4157'}"/><text x="${(t.w - 10) / 2 + 2}" y="${t.h / 2 + 4}" text-anchor="middle">${esc(n.l)}</text>`;
          else if (n.t === 'DFF') h += `<rect class="${cl}" width="${t.w}" height="${t.h}" rx="6"/><text x="${t.w / 2}" y="${t.h / 2 + 4}" text-anchor="middle">D-FF</text><text x="8" y="${t.h / 3 + 4}">D</text><text x="8" y="${t.h * 2 / 3 + 4}">&gt;</text><text x="${t.w - 16}" y="${t.h / 3 + 4}">Q</text><text x="${t.w - 22}" y="${t.h * 2 / 3 + 4}">Q̄</text>`;
          else { h += `<path class="${cl}" d="${gpath(n.t, t.w, t.h)}"/>`; if (n.t === 'XOR' || n.t === 'XNOR') h += `<path d="M-7 0 Q${t.w * .2} ${t.h / 2} -7 ${t.h}" fill="none" stroke="#7cc4ff" stroke-width="2"/>`; if (n.t === 'NOT' || ['NAND', 'NOR', 'XNOR'].includes(n.t)) h += `<circle cx="${t.w - 5}" cy="${t.h / 2}" r="5" class="gp"/>`; h += `<text x="${(t.w - 8) / 2}" y="${t.h / 2 + 4}" text-anchor="middle" style="font-size:10px">${n.t === 'NOT' ? '' : n.t}</text>`; }
          h += '</g>';
          for (let i = 0; i < t.i; i++) { const p = inPin(n, i); h += `<circle class="pin ${inVal(n, i) ? 'on' : ''}" cx="${p.x}" cy="${p.y}" r="6" data-in="${n.id}:${i}"/>`; }
          for (let j = 0; j < t.o; j++) { const p = outPin(n, j); h += `<circle class="pin ${val(n, j) ? 'on' : ''}" cx="${p.x}" cy="${p.y}" r="6" data-out="${n.id}:${j}"/>`; }
        });
        svg.innerHTML = h; save();
      }
      const world = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM().inverse(), q = pt.matrixTransform(m); return { x: q.x, y: q.y }; };
      /* ---------- thao tác ---------- */
      function addNode(t, x, y, label) {
        const n = { id: uid++, t, x: x == null ? 30 + (C.nodes.length % 7) * 20 + (t === 'IN' ? 0 : 150) : x, y: y == null ? 30 + (C.nodes.length % 6) * 58 : y, l: label || (t === 'IN' ? String.fromCharCode(65 + C.nodes.filter(k => k.t === 'IN').length % 26) : t === 'OUT' ? 'Y' + (C.nodes.filter(k => k.t === 'OUT').length || '') : ''), v: 0, q: 0, pc: 0 };
        C.nodes.push(n); return n;
      }
      const link = (a, ao, b, bi) => { C.wires = C.wires.filter(w => !(w.b === b.id && w.bi === bi)); C.wires.push({ a: a.id, ao, b: b.id, bi }); };
      function refresh() { simulate(); render(); showPanel(); }
      svg.addEventListener('pointerdown', e => {
        const t = e.target, wp = world(e);
        if (t.dataset.out) { const [id, j] = t.dataset.out.split(':').map(Number); wire = { from: outPin(byId(id), j), to: wp, a: id, ao: j }; svg.setPointerCapture(e.pointerId); e.preventDefault(); return; }
        if (t.dataset.w != null) { if (tool === 'del') { C.wires.splice(+t.dataset.w, 1); sel = null; refresh(); } else { sel = 'w' + t.dataset.w; render(); } return; }
        const g = t.closest('[data-n]'); if (g) { const n = byId(+g.dataset.n); if (tool === 'del') { C.nodes = C.nodes.filter(k => k !== n); C.wires = C.wires.filter(w => w.a !== n.id && w.b !== n.id); vals.delete(n.id); sel = null; refresh(); return; } sel = n.id; drag = { n, dx: wp.x - n.x, dy: wp.y - n.y, moved: 0 }; svg.setPointerCapture(e.pointerId); e.preventDefault(); render(); return; }
        sel = null; render();
      });
      svg.addEventListener('pointermove', e => {
        const wp = world(e); if (wire) { wire.to = wp; render(); return; }
        if (drag) { drag.moved += 1; drag.n.x = Math.max(0, Math.min(WW - 60, Math.round((wp.x - drag.dx) / 10) * 10)); drag.n.y = Math.max(0, Math.min(WH - 40, Math.round((wp.y - drag.dy) / 10) * 10)); render(); }
      });
      const up = e => {
        if (wire) { const wp = world(e); let best = null, bd = 18; C.nodes.forEach(n => { for (let i = 0; i < T(n).i; i++) { const p = inPin(n, i), d = Math.hypot(p.x - wp.x, p.y - wp.y); if (d < bd && n.id !== wire.a) { bd = d; best = [n, i]; } } }); if (best) link(byId(wire.a), wire.ao, best[0], best[1]); wire = null; refresh(); return; }
        if (drag) { const d = drag; drag = null; if (d.moved < 3 && d.n.t === 'IN') { d.n.v ^= 1; record(); } else if (d.moved < 3 && d.n.t === 'CLK') { d.n.v ^= 1; record(); } refresh(); }
      };
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', () => { wire = null; drag = null; render(); });
      const delKey = e => { if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (typeof sel === 'string') C.wires.splice(+sel.slice(1), 1); else { C.nodes = C.nodes.filter(k => k.id !== sel); C.wires = C.wires.filter(w => w.a !== sel && w.b !== sel); } sel = null; refresh(); } };
      window.addEventListener('keydown', delKey);

      /* ---------- bảng chân trị, biểu thức, Verilog ---------- */
      const isComb = () => !C.nodes.some(n => n.t === 'DFF' || n.t === 'CLK');
      function truth() {
        const ins = C.nodes.filter(n => n.t === 'IN').sort((a, b) => a.l.localeCompare(b.l)), outsN = C.nodes.filter(n => n.t === 'OUT').sort((a, b) => a.l.localeCompare(b.l));
        if (!isComb()) return { err: 'Bảng chân trị chỉ dùng cho mạch tổ hợp (không có D-FF/CLK).' }; if (!ins.length || !outsN.length) return { err: 'Cần ít nhất 1 ngõ vào (IN) và 1 ngõ ra (OUT).' }; if (ins.length > 6) return { err: 'Tối đa 6 ngõ vào.' };
        const save0 = ins.map(n => n.v), rows = [], N = ins.length;
        for (let m = 0; m < (1 << N); m++) { ins.forEach((n, i) => { n.v = (m >> (N - 1 - i)) & 1; }); vals = new Map(); settle(); rows.push({ m, o: outsN.map(o => inVal(o, 0)) }); }
        ins.forEach((n, i) => { n.v = save0[i]; }); vals = new Map(); simulate();
        return { ins, outs: outsN, rows, N };
      }
      function ttHTML() {
        const t = truth(); if (t.err) return `<p class="hint">${esc(t.err)}</p>`;
        const names = t.ins.map(n => n.l);
        let h = `<table><tr>${names.map(n => `<th>${esc(n)}</th>`).join('')}${t.outs.map(o => `<th class="h">${esc(o.l)}</th>`).join('')}</tr>` + t.rows.map(r => `<tr>${names.map((_, i) => `<td>${(r.m >> (t.N - 1 - i)) & 1}</td>`).join('')}${r.o.map(v => `<td class="${v ? 'h' : ''}">${v}</td>`).join('')}</tr>`).join('') + '</table>';
        h += '<p><b>Biểu thức rút gọn (Quine–McCluskey):</b></p><pre>' + t.outs.map((o, k) => { const mins = t.rows.filter(r => r.o[k]).map(r => r.m); return esc(o.l + ' = ' + sopText(qm(t.N, mins), names)); }).join('\n') + '</pre><p class="hint">Dán biểu thức vào tab “Biểu thức” để vẽ lại mạch tối giản.</p>';
        return h;
      }
      const ident = (s, used) => { let b = String(s || 'x').replace(/[^A-Za-z0-9_]/g, '_'); if (!/^[A-Za-z_]/.test(b)) b = 'n' + b; let r = b, k = 1; while (used.has(r)) r = b + '_' + k++; used.add(r); return r; };
      function verilog(tb) {
        const used = new Set(['clk', 'module', 'input', 'output', 'wire', 'reg', 'assign']), nm = new Map();
        const hasClk = C.nodes.some(n => n.t === 'CLK'); if (hasClk) nm.set('clk', 'clk');
        C.nodes.forEach(n => { if (n.t === 'IN') nm.set(n.id + ':0', ident(n.l, used)); else if (n.t === 'CLK') nm.set(n.id + ':0', 'clk'); else if (n.t === 'OUT') nm.set('o' + n.id, ident(n.l, used)); else if (n.t === 'DFF') { nm.set(n.id + ':0', ident('q' + n.id, used)); } else nm.set(n.id + ':0', ident('w' + n.id, used)); });
        const src = (n, i) => { const w = wireIn(n, i); return w ? (w.ao === 1 ? '~' : '') + nm.get(w.a + ':0') : "1'b0"; };
        const ins = C.nodes.filter(n => n.t === 'IN').map(n => nm.get(n.id + ':0')), os = C.nodes.filter(n => n.t === 'OUT').map(n => nm.get('o' + n.id));
        const ports = (hasClk ? ['input clk'] : []).concat(ins.map(x => 'input ' + x), os.map(x => 'output ' + x));
        let v = `// Tạo bởi GameVui – Thiết kế mạch số\nmodule chip(${ports.join(', ')});\n`;
        C.nodes.filter(n => n.t === 'DFF').forEach(n => { v += `  reg ${nm.get(n.id + ':0')} = 1'b0;\n`; });
        C.nodes.filter(n => GATES[n.t] || n.t === 'NOT').forEach(n => { v += `  wire ${nm.get(n.id + ':0')};\n`; });
        C.nodes.forEach(n => { const o = nm.get(n.id + ':0'); if (n.t === 'NOT') v += `  assign ${o} = ~${src(n, 0)};\n`; else if (GATES[n.t]) { const a = src(n, 0), b = src(n, 1), op = { AND: `${a} & ${b}`, OR: `${a} | ${b}`, NAND: `~(${a} & ${b})`, NOR: `~(${a} | ${b})`, XOR: `${a} ^ ${b}`, XNOR: `~(${a} ^ ${b})` }[n.t]; v += `  assign ${o} = ${op};\n`; } });
        C.nodes.filter(n => n.t === 'DFF').forEach(n => { v += `  always @(posedge ${src(n, 1).replace('~', '') === "1'b0" ? 'clk' : src(n, 1)}) ${nm.get(n.id + ':0')} <= ${src(n, 0)};\n`; });
        C.nodes.filter(n => n.t === 'OUT').forEach(n => { v += `  assign ${nm.get('o' + n.id)} = ${src(n, 0)};\n`; });
        v += 'endmodule\n';
        if (!tb) return v;
        let t = `\`timescale 1ns/1ps\nmodule chip_tb;\n`; ins.forEach(x => { t += `  reg ${x};\n`; }); if (hasClk) t += '  reg clk = 0;\n'; os.forEach(x => { t += `  wire ${x};\n`; });
        t += `  chip dut(${(hasClk ? ['.clk(clk)'] : []).concat(ins.concat(os).map(x => `.${x}(${x})`)).join(', ')});\n`;
        if (hasClk) t += '  always #5 clk = ~clk;\n';
        t += '  initial begin\n    $dumpfile("chip.vcd"); $dumpvars(0, chip_tb);\n';
        if (isComb() && ins.length && ins.length <= 6) { t += `    integer i;\n    for (i = 0; i < ${1 << ins.length}; i = i + 1) begin\n      {${ins.join(', ')}} = i[${ins.length - 1}:0];\n      #10 $display("%b -> ${os.map(x => x + '=%b').join(' ')}", {${ins.join(', ')}}, ${os.join(', ')});\n    end\n`; } else { ins.forEach(x => { t += `    ${x} = 0;\n`; }); t += '    #200;\n'; }
        return t + '    $finish;\n  end\nendmodule\n';
      }
      function wave() {
        const S = sigs(); if (!S.length) return '<p class="hint">Thêm IN/OUT để xem giản đồ sóng. Bấm vào ngõ vào hoặc chạy xung để ghi mẫu.</p>';
        return `<canvas class="wv" width="640" height="${Math.max(60, S.length * 26 + 14)}"></canvas>`;
      }
      function drawWave() {
        const cv = $(panel, '.wv'); if (!cv) return; const S = sigs(), g = cv.getContext('2d'), W = cv.width, H = cv.height, L = 70, step = (W - L - 6) / 48;
        g.clearRect(0, 0, W, H); g.font = '12px Roboto,sans-serif'; g.textBaseline = 'middle';
        S.forEach((s, i) => { const y = 14 + i * 26; g.fillStyle = '#9ec9ee'; g.fillText(s.name, 4, y + 7); g.strokeStyle = '#4cff8a'; g.lineWidth = 2; g.beginPath(); hist.forEach((row, k) => { const v = row[i], x = L + k * step, yy = v ? y : y + 16; if (k === 0) g.moveTo(x, yy); else { const pv = hist[k - 1][i] ? y : y + 16; g.lineTo(x, pv); g.lineTo(x, yy); } g.lineTo(x + step, yy); }); g.stroke(); g.strokeStyle = '#ffffff12'; g.beginPath(); g.moveTo(L, y + 8); g.lineTo(W - 4, y + 8); g.stroke(); });
      }
      function showPanel() {
        if (tab === 'wave') { panel.innerHTML = wave(); drawWave(); }
        else if (tab === 'tt') panel.innerHTML = ttHTML();
        else if (tab === 'vl') { panel.innerHTML = `<div class="tl"><button class="btn ghost" data-v="0">Module</button><button class="btn ghost" data-v="1">Testbench</button><button class="btn ghost cpv">📋 Sao chép</button></div><pre class="vo">${esc(verilog(false))}</pre><p class="hint">Chạy thử: <code>iverilog -o sim chip.v chip_tb.v &amp;&amp; vvp sim</code> hoặc tổng hợp với Yosys.</p>`; }
        else if (tab === 'sv') panel.innerHTML = `<div class="tl"><button class="btn ghost cps">📋 Sao chép mã mạch</button><button class="btn ghost ldc">📥 Nhập mã</button><button class="btn ghost png">📷 Lưu ảnh sơ đồ</button></div><p class="hint">Mạch tự lưu trên máy bạn. Mã mạch dùng để gửi cho bạn bè hoặc giáo viên.</p>`;
        else if (tab === 'ex') { if (!$(panel, '.ei')) panel.innerHTML = `<p class="hint">Mỗi dòng một phương trình. Toán tử: <b>!</b> NOT · <b>&amp;</b> AND · <b>^</b> XOR · <b>|</b> OR · ngoặc ( ). Ví dụ:</p><textarea class="ei" spellcheck="false">X = A ^ B\nS = X ^ Cin\nCout = A&B | X&Cin</textarea><div class="tl"><button class="btn mk">⚡ Tạo mạch</button></div>`; }
      }
      const bytes = () => btoa(unescape(encodeURIComponent(JSON.stringify(C))));
      function fromCode(t) { const o = JSON.parse(decodeURIComponent(escape(atob(String(t).trim())))); if (!o || !Array.isArray(o.nodes) || !Array.isArray(o.wires) || o.nodes.length > 200 || !o.nodes.every(n => TYPES[n.t])) throw new Error('bad'); return { nodes: o.nodes.map(n => ({ id: +n.id, t: n.t, x: +n.x || 0, y: +n.y || 0, l: String(n.l || '').slice(0, 12), v: n.v ? 1 : 0, q: n.q ? 1 : 0, pc: 0 })), wires: o.wires.filter(w => w && Number.isFinite(+w.a) && Number.isFinite(+w.b)).map(w => ({ a: +w.a, ao: +w.ao | 0, b: +w.b, bi: +w.bi | 0 })) }; }
      function setCircuit(c) { clearInterval(run); run = 0; $(el, '.runb').textContent = '▶ Chạy xung'; C = c; uid = Math.max(0, ...C.nodes.map(n => n.id)) + 1; vals = new Map(); hist = []; sel = null; record(); refresh(); }
      const EXAMPLES = {
        half: () => circuitFromExprs(parseExprs('S = A ^ B\nC = A & B')), full: () => circuitFromExprs(parseExprs('X = A ^ B\nS = X ^ Cin\nCout = A&B | X&Cin')),
        mux: () => circuitFromExprs(parseExprs('Y = !S&A | S&B')), cmp: () => circuitFromExprs(parseExprs('GT = A&!B\nEQ = !(A^B)\nLT = !A&B')),
        sr: () => { const k = { nodes: [], wires: [] }, bk = C; C = k; uid = 1; const S = addNode('IN', 20, 40, 'S'), R = addNode('IN', 20, 230, 'R'), n1 = addNode('NOR', 260, 40), n2 = addNode('NOR', 260, 230), Q = addNode('OUT', 520, 40, 'Q'), Qn = addNode('OUT', 520, 230, 'Qn'); link(R, 0, n1, 0); link(n2, 0, n1, 1); link(S, 0, n2, 1); link(n1, 0, n2, 0); link(n1, 0, Q, 0); link(n2, 0, Qn, 0); C = bk; return k; },
        cnt: () => { const k = { nodes: [], wires: [] }, bk = C; C = k; uid = 1; const ck = addNode('CLK', 20, 150), inv = addNode('NOT', 150, 40), f0 = addNode('DFF', 270, 40), x = addNode('XOR', 150, 250), f1 = addNode('DFF', 270, 250), o0 = addNode('OUT', 420, 40, 'Q0'), o1 = addNode('OUT', 420, 250, 'Q1'); link(f0, 0, inv, 0); link(inv, 0, f0, 0); link(ck, 0, f0, 1); link(ck, 0, f1, 1); link(f0, 0, x, 0); link(f1, 0, x, 1); link(x, 0, f1, 0); link(f0, 0, o0, 0); link(f1, 0, o1, 0); C = bk; return k; }
      };
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.add) { const n = addNode(b.dataset.add); sel = n.id; refresh(); }
        else if (b.dataset.tool) { tool = b.dataset.tool; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); }
        else if (b.dataset.z) { zoom = Math.max(.4, Math.min(1.6, zoom + (+b.dataset.z) * .15)); render(); }
        else if (b.dataset.tab) { tab = b.dataset.tab; el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); showPanel(); }
        else if (b.classList.contains('clr')) { if (!C.nodes.length || confirm('Xoá toàn bộ sơ đồ?')) setCircuit({ nodes: [], wires: [] }); }
        else if (b.classList.contains('runb')) { if (run) { clearInterval(run); run = 0; b.textContent = '▶ Chạy xung'; } else { const clk = () => { const c = C.nodes.find(n => n.t === 'CLK'); if (c) { c.v ^= 1; record(); refresh(); } }; if (!C.nodes.some(n => n.t === 'CLK')) return info('Thêm một khối CLK để chạy xung nhịp.'); run = setInterval(clk, 500 / hz); b.textContent = '⏸ Dừng'; } }
        else if (b.classList.contains('step')) { const c = C.nodes.find(n => n.t === 'CLK'); if (!c) return info('Thêm một khối CLK trước.'); c.v = 1; refresh(); record(); c.v = 0; refresh(); record(); showPanel(); }
        else if (b.classList.contains('mk')) { try { setCircuit(circuitFromExprs(parseExprs($(panel, '.ei').value))); info('Đã tạo mạch từ biểu thức.'); tab = 'wave'; el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x.dataset.tab === 'wave')); showPanel(); } catch (er) { info('⚠️ ' + er.message); } }
        else if (b.dataset.v != null) { $(panel, '.vo').textContent = verilog(b.dataset.v === '1'); }
        else if (b.classList.contains('cpv')) { navigator.clipboard && navigator.clipboard.writeText($(panel, '.vo').textContent).then(() => info('Đã sao chép.')).catch(() => {}); }
        else if (b.classList.contains('cps')) { const c = bytes(); (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => info('Đã sao chép mã mạch.')).catch(() => window.prompt('Mã mạch:', c)); }
        else if (b.classList.contains('ldc')) { const t = window.prompt('Dán mã mạch:'); if (t) { try { setCircuit(fromCode(t)); info('Đã nhập mạch.'); } catch (er) { info('⚠️ Mã không hợp lệ.'); } } }
        else if (b.classList.contains('png')) { const s = new XMLSerializer().serializeToString(svg), img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); cv.width = WW * 2; cv.height = WH * 2; const g = cv.getContext('2d'); g.fillStyle = '#0f1a22'; g.fillRect(0, 0, cv.width, cv.height); g.scale(2, 2); g.drawImage(img, 0, 0, WW, WH); cv.toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'so-do-mach.png'; a.click(); }); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.replace('<svg', '<svg style="font-family:Roboto,sans-serif"')); }
      });
      $(el, '.ex').onchange = e => { const k = e.target.value; e.target.value = ''; if (k) setCircuit(EXAMPLES[k]()); };
      $(el, '.hz').onchange = e => { hz = +e.target.value; if (run) { clearInterval(run); $(el, '.runb').click(); $(el, '.runb').click(); } };
      if (!C.nodes.length) C = EXAMPLES.half(); uid = Math.max(0, ...C.nodes.map(n => n.id)) + 1; record(); refresh();
      GV.chipT = { get C() { return C; }, parseExprs, circuitFromExprs, qm, sopText, truth, verilog, simulate, settle, setCircuit, fromCode, bytes, val, get hist() { return hist; } };
      return () => { dead = true; clearInterval(run); window.removeEventListener('keydown', delKey); };
    }
  });
})();
