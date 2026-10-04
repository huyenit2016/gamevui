// Xây Khối 3D: sandbox xây dựng bằng khối (voxel) 12×12×10, xoay/phóng to 3D, đặt – xoá – tô – chọn màu, cắt tầng, hoàn tác, mẫu có sẵn, lưu/chia sẻ, xuất ảnh.
(function () {
  const N = 12, H = 10, W = 360, HT = 330, CAM = 27;
  const MATS = [null,
    ['Cỏ', '#63c04b'], ['Đất', '#8a5a3c'], ['Đá', '#9aa0a8'], ['Gỗ', '#c58a4a'], ['Gạch', '#c0504d'], ['Cát', '#ecd9a0'], ['Tuyết', '#f1f6ff'],
    ['Nước', '#3f9bff', .55], ['Kính', '#bfe9ff', .35], ['Lá', '#2f8f43'], ['Đỏ', '#e53935'], ['Cam', '#fb8c00'], ['Vàng', '#fdd835'],
    ['Lục', '#43a047'], ['Lam', '#1e88e5'], ['Tím', '#8e24aa'], ['Hồng', '#f06292'], ['Đen', '#2b2b30'], ['Trắng', '#fafafa'], ['Nâu', '#6d4c41']
  ];
  const SHAPES = [['Khối', [0, 1, 0, 1, 0, 1]], ['Nửa', [0, 1, 0, .5, 0, 1]], ['Cột', [.25, .75, 0, 1, .25, .75]], ['Tấm', [0, 1, 0, 1, .38, .62]]];
  const CUSTOM0 = 21, CUSTOM_MAX = 8;
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const QUAD = [[[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]];
  const SHADE = [.82, .7, 1, .5, .88, .62];
  const idx = (x, y, z) => (y * N + z) * N + x;
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const hash = i => { let x = (i * 2654435761) >>> 0; x ^= x >>> 15; return (x % 1000) / 1000; };

  // ---- mẫu ----
  const TPL = {
    house() { const g = new Uint8Array(N * N * H), s = (x, y, z, m) => { g[idx(x, y, z)] = m; };
      for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) s(x, 0, z, 1);
      for (let x = 3; x <= 8; x++) for (let z = 3; z <= 8; z++) for (let y = 1; y <= 4; y++) { const edge = x === 3 || x === 8 || z === 3 || z === 8; if (edge) s(x, y, z, y === 1 || (x % 5 === 3 && z % 5 === 3) ? 4 : 5); }
      for (let x = 3; x <= 8; x++) for (let z = 3; z <= 8; z++) s(x, 0, z, 4);
      [4, 7].forEach(x => { s(x, 3, 3, 9); s(x, 2, 3, 9); }); [4, 7].forEach(z => { s(3, 3, z, 9); s(8, 3, z, 9); });
      s(5, 1, 3, 0); s(5, 2, 3, 0); s(6, 1, 3, 0); s(6, 2, 3, 0);
      for (let l = 0; l < 3; l++) for (let x = 2 + l; x <= 9 - l; x++) for (let z = 2 + l; z <= 9 - l; z++) if (x === 2 + l || x === 9 - l || z === 2 + l || z === 9 - l || l === 2) s(x, 5 + l, z, 11);
      for (let i = 0; i < 3; i++) { s(1, 1 + i, 1, 4); s(1, 1 + i, 10, 4); } s(1, 4, 1, 10); s(1, 4, 10, 10); return g; },
    tree() { const g = new Uint8Array(N * N * H); for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) g[idx(x, 0, z)] = 1;
      for (let y = 1; y <= 4; y++) g[idx(6, y, 6)] = 4;
      for (let y = 4; y <= 7; y++) for (let x = 3; x <= 9; x++) for (let z = 3; z <= 9; z++) { const d = Math.abs(x - 6) + Math.abs(z - 6) + Math.abs(y - 5.5) * 1.3; if (d < 5.2 && !(x === 6 && z === 6 && y < 5)) g[idx(x, y, z)] = 10; } return g; },
    pyramid() { const g = new Uint8Array(N * N * H); for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) g[idx(x, 0, z)] = 6;
      for (let y = 1; y <= 5; y++) { const o = y; for (let x = o; x < N - o; x++) for (let z = o; z < N - o; z++) g[idx(x, y, z)] = y % 2 ? 6 : 13; } return g; },
    terrain() { const g = new Uint8Array(N * N * H), ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6];
      for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
        const h = Math.round(2.2 + Math.sin(x * .55 + ph[0]) * 1.4 + Math.cos(z * .5 + ph[1]) * 1.3 + Math.sin((x + z) * .35 + ph[2]) * .9), t = Math.max(1, Math.min(H - 2, h));
        for (let y = 0; y < t; y++) g[idx(x, y, z)] = y === t - 1 ? (t <= 2 ? 6 : t >= 5 ? 7 : 1) : (t >= 5 && y > 2 ? 3 : 2);
        for (let y = t; y < 2; y++) g[idx(x, y, z)] = 8;
      }
      for (let k = 0; k < 4; k++) { const x = 1 + Math.floor(Math.random() * (N - 2)), z = 1 + Math.floor(Math.random() * (N - 2)); let y = 0; while (y < H - 5 && g[idx(x, y, z)]) y++; if (y > 2 && y < H - 5 && g[idx(x, y - 1, z)] === 1) { for (let i = 0; i < 3; i++) g[idx(x, y + i, z)] = 4; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 2; dy <= 3; dy++) if (!g[idx(x + dx, y + dy, z + dz)] && x + dx >= 0 && x + dx < N && z + dz >= 0 && z + dz < N) g[idx(x + dx, y + dy, z + dz)] = 10; } }
      return g; }
  };
  // ---- mã hoá lưu/chia sẻ (RLE → base64) ----
  const encR = g => { const o = []; let i = 0; while (i < g.length) { let j = i; while (j < g.length && g[j] === g[i] && j - i < 255) j++; o.push(g[i], j - i); i = j; } return btoa(String.fromCharCode.apply(null, o)); };
  const decR = (s, lim) => { const b = atob(String(s).trim()), g = new Uint8Array(N * N * H); let p = 0; for (let i = 0; i + 1 < b.length; i += 2) { const m = b.charCodeAt(i), c = b.charCodeAt(i + 1); if (m >= lim) throw new Error('bad'); for (let k = 0; k < c && p < g.length; k++) g[p++] = m; } if (p !== g.length) throw new Error('bad'); return g; };

  const enc = (g, sh, cu) => encR(g) + '.' + encR(sh) + '.' + cu.map(h => h.slice(1)).join(',');
  const dec = s => { const [a, b, c] = String(s).trim().split('.'); const cu = c ? c.split(',').filter(h => /^[0-9a-fA-F]{6}$/.test(h)).slice(0, CUSTOM_MAX).map(h => '#' + h.toLowerCase()) : []; return { g: decR(a, CUSTOM0 + CUSTOM_MAX), sh: b ? decR(b, SHAPES.length) : new Uint8Array(N * N * H), cu }; };

  GV.register({
    id: 'blocks', type: 'game', cat: 'Mô phỏng', name: 'Xây Khối 3D', icon: '🧱', desc: 'Sandbox xây dựng bằng khối 3D: đặt, xoá, tô màu, xoay – phóng to, cắt tầng, mẫu có sẵn, lưu và chia sẻ công trình.',
    mount(el) {
      const $ = s => el.querySelector(s);
      let g = new Uint8Array(N * N * H), sh = new Uint8Array(N * N * H), cust = [], shp = 0, sel = 1, tool = 'place', yaw = -.7, pit = .6, zoom = 1, layer = H - 1, dirty = true, undo = [], redo = [], faces = [], polys = [], hover = null, raf = 0, dead = false, saveT = 0;
      const DPR = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1)));
      const applyCust = () => { MATS.length = CUSTOM0; for (let i = MATS.length; i < CUSTOM0; i++) MATS[i] = ['', '#888']; cust.forEach((h, i) => { MATS[CUSTOM0 + i] = ['Màu riêng ' + (i + 1), h]; }); };
      try { const sv = GV.store.get('blocks', null); if (sv && sv.cur) { const d = dec(sv.cur); g = d.g; sh = d.sh; cust = d.cu; } else g = TPL.house(); } catch (e) { g = TPL.house(); sh = new Uint8Array(N * N * H); cust = []; }
      applyCust();
      el.innerHTML = `<style>.bl canvas{touch-action:none;cursor:crosshair;border-radius:16px;background:linear-gradient(#bfe6ff,#eaf7ff 60%,#d9f0c2)}.bl .pal{display:flex;gap:6px;overflow-x:auto;max-width:100%;padding:4px;scrollbar-width:none}.bl .pal::-webkit-scrollbar{display:none}.bl .sw{flex:0 0 auto;width:34px;height:34px;border-radius:10px;border:3px solid transparent;cursor:pointer;box-shadow:inset 0 0 0 2px #0003}.bl .sw.on{border-color:var(--md-primary,#D0BCFF);transform:scale(1.12)}.bl .tl{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.bl .tl button{height:32px;padding:0 9px;font-size:13px}body.ingame .bl canvas{max-height:38dvh!important}.bl .tl{gap:4px}.bl{gap:6px!important}.bl .tl button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.bl label{font-size:13px;display:flex;align-items:center;gap:6px}.bl input[type=range]{width:120px}.bl select{min-width:0}</style>
<div class="tool bl" style="max-width:560px;align-items:center"><canvas class="cv" width="${W * DPR}" height="${HT * DPR}" style="width:100%;max-width:${W}px"></canvas>
<div class="tl tools"><button class="btn ghost on" data-tool="place">➕ Đặt</button><button class="btn ghost" data-tool="erase">🧽 Xoá</button><button class="btn ghost" data-tool="paint">🎨 Tô</button><button class="btn ghost" data-tool="pick">💧 Lấy màu</button><button class="btn ghost un">↩</button><button class="btn ghost re">↪</button></div>
<div class="pal"></div>
<div class="tl"><span class="hint">Hình khối:</span>${SHAPES.map((x, i) => `<button class="btn ghost${i ? '' : ' on'}" data-shp="${i}">${['▇', '▄', '▮', '▬'][i]} ${x[0]}</button>`).join('')}<input type="color" class="cc" value="#ff7043" title="Chọn màu riêng" style="width:38px;height:32px;padding:0;border:0;background:none"><button class="btn ghost addc">＋ Màu riêng</button><button class="btn ghost delc">🗑</button></div>
<div class="tl"><label>Tầng <input type="range" class="ly" min="0" max="${H - 1}" value="${H - 1}"><b class="lyv"></b></label><button class="btn ghost zm" data-z="-1">➖</button><button class="btn ghost zm" data-z="1">➕</button><button class="btn ghost rot" title="Xoay 90°">⟳</button></div>
<div class="tl"><select class="tp"><option value="">📐 Mẫu có sẵn…</option><option value="house">🏠 Ngôi nhà</option><option value="tree">🌳 Cái cây</option><option value="pyramid">🔺 Kim tự tháp</option><option value="terrain">⛰️ Địa hình ngẫu nhiên</option><option value="clear">🗑 Nền trống</option></select><button class="btn ghost sv">💾 Lưu</button><button class="btn ghost ld">📂 Mở</button><button class="btn ghost sh">🔗 Mã</button><button class="btn ghost png">📷 Ảnh</button></div>
<p class="hint info" style="min-height:1.4em"></p></div>`;
      const cv = $('canvas'), c = cv.getContext('2d'), info = t => $('.info').textContent = t || '';
      // ---- bảng màu ----
      const renderPal = () => { $('.pal').innerHTML = MATS.slice(1).map((m, i) => `<div class="sw${i + 1 === sel ? ' on' : ''}" data-m="${i + 1}" title="${m[0]}" style="background:${m[1]};${m[2] ? 'opacity:' + (.5 + m[2]) : ''}"></div>`).join(''); };
      renderPal();
      // ---- dựng mặt ----
      const occ = (x, y, z) => x < 0 || x >= N || z < 0 || z >= N || y < 0 || y > layer ? 0 : g[idx(x, y, z)];
      const trans = m => m && MATS[m][2];
      function rebuild() {
        faces = [];
        for (let y = 0; y <= layer; y++) for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
          const i = idx(x, y, z), m = g[i]; if (!m) continue; const mat = MATS[m], rgb = hexRGB(mat[1]), jit = .94 + hash(i) * .12, shp = sh[i], ext = SHAPES[shp][1];
          for (let d = 0; d < 6; d++) {
            const nx = x + DIRS[d][0], ny = y + DIRS[d][1], nz = z + DIRS[d][2], nb = occ(nx, ny, nz), nfull = nb && !sh[idx(nx, ny, nz)];
            if (shp === 0 && nb && nfull && (!trans(nb) || nb === m)) continue;
            const k = SHADE[d] * jit, rgbs = rgb.map(v => Math.min(255, Math.round(v * k))).join(','), col = mat[2] ? `rgba(${rgbs},${mat[2]})` : `rgb(${rgbs})`;
            faces.push({ x, y, z, d, col, tr: !!mat[2], ext });
          }
        }
        dirty = true;
      }
      const view = (x, y, z) => { x -= N / 2; z -= N / 2; y -= 2.5; const c1 = Math.cos(yaw), s1 = Math.sin(yaw), x1 = x * c1 + z * s1, z1 = -x * s1 + z * c1, c2 = Math.cos(pit), s2 = Math.sin(pit); return [x1, y * c2 - z1 * s2, y * s2 + z1 * c2]; };
      const proj = v => { const d = CAM - v[2], f = 560 * zoom / 1; return [W / 2 + f * v[0] / d, HT * .56 - f * v[1] / d, d]; };
      const nview = n => { const c1 = Math.cos(yaw), s1 = Math.sin(yaw), x1 = n[0] * c1 + n[2] * s1, z1 = -n[0] * s1 + n[2] * c1, c2 = Math.cos(pit), s2 = Math.sin(pit); return [x1, n[1] * c2 - z1 * s2, n[1] * s2 + z1 * c2]; };
      function draw() {
        c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, HT);
        const P = [];
        // mặt đất
        for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
          if (g[idx(x, 0, z)] && layer >= 0) continue; // đã có khối (hiện mặt trên)
          const pts = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => proj(view(x + a, 0, z + b)));
          P.push({ pts, col: (x + z) % 2 ? '#a8d98c' : '#b9e49e', d: Math.max.apply(null, pts.map(p => p[2])) + 1.5, ground: [x, z] });
        }
        faces.forEach(f => {
          const e = f.ext, cx = (e[0] + e[1]) / 2 + DIRS[f.d][0] * (e[1] - e[0]) / 2, cy = (e[2] + e[3]) / 2 + DIRS[f.d][1] * (e[3] - e[2]) / 2, cz = (e[4] + e[5]) / 2 + DIRS[f.d][2] * (e[5] - e[4]) / 2, n = nview(DIRS[f.d]), cc = view(f.x + cx, f.y + cy, f.z + cz);
          if (n[0] * -cc[0] + n[1] * -cc[1] + n[2] * (CAM - cc[2]) <= 0) return;
          const pts = QUAD[f.d].map(q => proj(view(f.x + e[q[0] ? 1 : 0], f.y + e[q[1] ? 3 : 2], f.z + e[q[2] ? 5 : 4])));
          P.push({ pts, col: f.col, d: CAM - cc[2] + 0, f, tr: f.tr });
        });
        P.sort((a, b) => b.d - a.d); polys = P;
        // bóng nền
        c.lineJoin = 'round';
        for (const p of P) { c.beginPath(); p.pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = p.col; c.fill(); c.strokeStyle = p.ground ? 'rgba(0,0,0,.06)' : 'rgba(0,0,0,.28)'; c.lineWidth = p.ground ? 1 : .8; c.stroke(); }
        if (hover) { const t = hover.cell; if (t) outline(t[0], t[1], t[2], tool === 'place' ? '#ffeb3b' : tool === 'erase' ? '#ff5252' : '#40c4ff'); }
      }
      function outline(x, y, z, col) {
        const q = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]].map(v => proj(view(x + v[0], y + v[1], z + v[2])));
        c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => { c.moveTo(q[a][0], q[a][1]); c.lineTo(q[b][0], q[b][1]); }); c.stroke();
      }
      const inside = (p, x, y) => { let s = 0, n = p.length; for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n], cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (cr > 0) s++; else if (cr < 0) s--; } return Math.abs(s) === n; };
      // trả về {cell:[x,y,z] ô sẽ đặt, hit:[x,y,z] khối bị trúng | null}
      function pickAt(px, py) {
        for (let i = polys.length - 1; i >= 0; i--) {
          const p = polys[i]; if (!inside(p.pts, px, py)) continue;
          if (p.ground) return { cell: [p.ground[0], 0, p.ground[1]], hit: null };
          const f = p.f, nx = f.x + DIRS[f.d][0], ny = f.y + DIRS[f.d][1], nz = f.z + DIRS[f.d][2], ok = nx >= 0 && nx < N && nz >= 0 && nz < N && ny >= 0 && ny <= layer;
          return { cell: ok ? [nx, ny, nz] : null, hit: [f.x, f.y, f.z] };
        }
        return null;
      }
      const set = (list) => { // list: [[i,mat,shape]]
        const ch = []; list.forEach(([i, v, w]) => { w = w || 0; if (g[i] !== v || sh[i] !== w) { ch.push([i, g[i], v, sh[i], w]); g[i] = v; sh[i] = w; } });
        if (!ch.length) return; undo.push(ch); if (undo.length > 200) undo.shift(); redo = []; persist(); rebuild();
      };
      const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { const s = GV.store.get('blocks', {}) || {}; s.cur = enc(g, sh, cust); GV.store.set('blocks', s); }, 400); };
      function act(px, py) {
        const r = pickAt(px, py); if (!r) return;
        if (tool === 'place') { if (!r.cell) return info('Ngoài vùng xây.'); const [x, y, z] = r.cell; if (g[idx(x, y, z)]) return; set([[idx(x, y, z), sel, shp]]); GV.beep && GV.beep(500 + y * 40, 30); }
        else if (tool === 'erase') { if (!r.hit) return; set([[idx(r.hit[0], r.hit[1], r.hit[2]), 0]]); GV.beep && GV.beep(260, 30); }
        else if (tool === 'paint') { if (!r.hit) return; set([[idx(r.hit[0], r.hit[1], r.hit[2]), sel, sh[idx(r.hit[0], r.hit[1], r.hit[2])]]]); }
        else if (tool === 'pick') { if (!r.hit) return; const hi = idx(r.hit[0], r.hit[1], r.hit[2]), m = g[hi]; if (m) { setSel(m); setShape(sh[hi]); } }
      }
      function setSel(m) { sel = m; el.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', +s.dataset.m === sel)); info(MATS[sel][0]); }
      function loadDec(d) { cust = d.cu; applyCust(); if (sel >= MATS.length) sel = 1; renderPal(); set(Array.from(d.g, (m, i) => [i, m, d.sh[i]])); }
      function setShape(k) { shp = k; el.querySelectorAll('[data-shp]').forEach(x => x.classList.toggle('on', +x.dataset.shp === k)); }
      // ---- chạm / kéo / zoom ----
      const ptr = new Map(); let moved = 0, startPt = null, pinch0 = 0, z0 = 1;
      const loc = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * HT / r.height]; };
      cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); if (ptr.size === 1) { moved = 0; startPt = loc(e); } if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = zoom; moved = 99; } });
      cv.addEventListener('pointermove', e => {
        if (!ptr.has(e.pointerId)) { const [x, y] = loc(e), r = pickAt(x, y); hover = r && (tool === 'place' ? r.cell : r.hit) ? { cell: tool === 'place' ? r.cell : r.hit } : null; dirty = true; return; }
        const o = ptr.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1]; ptr.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptr.size === 2) { const [a, b] = [...ptr.values()]; zoom = Math.max(.5, Math.min(2.2, z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pinch0 || 1))); dirty = true; return; }
        moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { yaw += dx * .01; pit = Math.max(.05, Math.min(1.5, pit + dy * .01)); dirty = true; hover = null; }
      });
      const up = e => { const was = ptr.size; ptr.delete(e.pointerId); if (was === 1 && moved <= 6 && startPt) act(startPt[0], startPt[1]); if (!ptr.size) startPt = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => ptr.delete(e.pointerId)); cv.addEventListener('pointerleave', () => { hover = null; dirty = true; });
      cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.5, Math.min(2.2, zoom * (e.deltaY < 0 ? 1.1 : .9))); dirty = true; }, { passive: false });
      // ---- nút ----
      const ly = $('.ly'), lyv = $('.lyv'); const lyUpd = () => { lyv.textContent = layer + 1 + '/' + H; };
      ly.oninput = () => { layer = +ly.value; lyUpd(); rebuild(); }; lyUpd();
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-tool]'), sw = e.target.closest('.sw'), b = e.target.closest('button');
        if (t) { tool = t.dataset.tool; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === t)); hover = null; info({ place: 'Chạm vào mặt khối hoặc nền để đặt khối.', erase: 'Chạm khối để xoá.', paint: 'Chạm khối để đổi sang màu đang chọn.', pick: 'Chạm khối để lấy màu.' }[tool]); return; }
        if (sw) { setSel(+sw.dataset.m); if (tool === 'erase' || tool === 'pick') { tool = 'place'; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x.dataset.tool === 'place')); } return; }
        if (!b) return;
        if (b.dataset.shp) { setShape(+b.dataset.shp); if (tool !== 'place') { tool = 'place'; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x.dataset.tool === 'place')); } info('Hình khối: ' + SHAPES[shp][0]); return; }
        if (b.classList.contains('addc')) { if (cust.length >= CUSTOM_MAX) return info('Tối đa ' + CUSTOM_MAX + ' màu riêng – bấm 🗑 để xoá màu cuối.'); cust.push($('.cc').value); applyCust(); renderPal(); setSel(CUSTOM0 + cust.length - 1); persist(); return; }
        if (b.classList.contains('delc')) { if (!cust.length) return; const id = CUSTOM0 + cust.length - 1; if (g.some(v => v === id) && !confirm('Màu này đang được dùng, xoá sẽ làm khối biến mất. Tiếp tục?')) return; const l = []; g.forEach((v, i) => { if (v === id) l.push([i, 0, 0]); }); cust.pop(); if (l.length) set(l); applyCust(); if (sel >= MATS.length) sel = 1; renderPal(); setSel(sel); persist(); return; }
        if (b.classList.contains('un')) { const ch = undo.pop(); if (!ch) return; ch.forEach(([i, o, , os]) => { g[i] = o; sh[i] = os; }); redo.push(ch); persist(); rebuild(); }
        else if (b.classList.contains('re')) { const ch = redo.pop(); if (!ch) return; ch.forEach(([i, , n, , ns]) => { g[i] = n; sh[i] = ns; }); undo.push(ch); persist(); rebuild(); }
        else if (b.classList.contains('zm')) { zoom = Math.max(.5, Math.min(2.2, zoom * (+b.dataset.z > 0 ? 1.15 : .87))); dirty = true; }
        else if (b.classList.contains('rot')) { yaw += Math.PI / 2; dirty = true; }
        else if (b.classList.contains('sv')) { const s = GV.store.get('blocks', {}) || {}; s.slot = enc(g, sh, cust); GV.store.set('blocks', s); info('💾 Đã lưu công trình vào ô lưu.'); }
        else if (b.classList.contains('ld')) { const s = GV.store.get('blocks', {}) || {}; if (!s.slot) return info('Chưa có công trình đã lưu.'); try { loadDec(dec(s.slot)); info('📂 Đã mở công trình đã lưu.'); } catch (er) { info('Dữ liệu lưu bị lỗi.'); } }
        else if (b.classList.contains('sh')) {
          const code = enc(g, sh, cust); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => info('🔗 Đã sao chép mã công trình – gửi cho bạn bè để họ nhập.')).catch(() => {});
          const inp = window.prompt('Mã công trình (sao chép để chia sẻ, hoặc dán mã của bạn bè rồi bấm OK để mở):', code);
          if (inp && inp.trim() && inp.trim() !== code) { try { loadDec(dec(inp)); info('Đã mở công trình từ mã.'); } catch (er) { info('⚠️ Mã không hợp lệ.'); } }
        }
        else if (b.classList.contains('png')) { cv.toBlob(bl => { if (!bl) return; const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'cong-trinh-3d.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }); }
      });
      $('.tp').onchange = e => { const v = e.target.value; e.target.value = ''; if (!v) return; const n = v === 'clear' ? new Uint8Array(N * N * H).map((_, i) => i < N * N ? 1 : 0) : TPL[v](); set(Array.from(n, (m, i) => [i, m, 0])); };
      function loop() { if (dead) return; if (dirty) { dirty = false; draw(); } raf = requestAnimationFrame(loop); }
      rebuild(); info('Kéo để xoay · chụm hai ngón để phóng to · chạm để đặt khối.'); loop();
      GV.blocksT = { get g() { return g; }, get sh() { return sh; }, rebuild, get tool() { return tool; }, polys: () => polys, pick: pickAt, act, N, H };
      return () => { dead = true; cancelAnimationFrame(raf); clearTimeout(saveT); };
    }
  });
})();
