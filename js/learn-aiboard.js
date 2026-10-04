// Bảng đen AI: bảng vẽ phấn + AI soạn bài lên bảng (viết dần, vẽ hình, có lời giảng đọc to), giải bài từ ảnh bảng, bài mẫu dùng không cần khoá AI.
(function () {
  const L = GV.learn, $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const BW = 640, BH = 400, MX = 28;
  const BOARDS = { green: ['#1f4a3a', '#16392d', 'Bảng xanh'], black: ['#26282b', '#1b1d1f', 'Bảng đen'], white: ['#fbfbf8', '#eceae2', 'Bảng trắng'] };
  const CH = { white: ['#f5f5ef', '#1f2430'], yellow: ['#ffe66d', '#b8860b'], pink: ['#ff9ecb', '#c2185b'], blue: ['#8fd3ff', '#0b6fb5'], green: ['#a8f0a0', '#2e7d32'], orange: ['#ffb86b', '#e65100'] };
  const LIB = {
    pytago: { n: 'Định lý Pytago', b: [{ t: 'h', x: 'Định lý Pytago', c: 'yellow' }, { t: 'p', x: 'Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.', say: 'Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.' }, { t: 'tri', a: 'a', b: 'b', c: 'c' }, { t: 'f', x: 'c² = a² + b²', c: 'pink' }, { t: 'step', x: 'Ví dụ: a = 3, b = 4', c: 'blue' }, { t: 'step', x: 'c² = 9 + 16 = 25  ⇒  c = 5', c: 'green' }] },
    bac2: { n: 'Giải phương trình bậc hai', b: [{ t: 'h', x: 'Phương trình bậc hai', c: 'yellow' }, { t: 'f', x: 'ax² + bx + c = 0  (a ≠ 0)', c: 'white' }, { t: 'li', x: 'Δ = b² − 4ac' }, { t: 'li', x: 'Δ < 0: vô nghiệm' }, { t: 'li', x: 'Δ = 0: nghiệm kép x = −b / 2a' }, { t: 'li', x: 'Δ > 0: x = (−b ± √Δ) / 2a' }, { t: 'step', x: 'Ví dụ: x² − 5x + 6 = 0', c: 'blue' }, { t: 'step', x: 'Δ = 25 − 24 = 1  ⇒  x = (5 ± 1)/2', c: 'green' }, { t: 'f', x: 'x = 3  hoặc  x = 2', c: 'pink' }] },
    parabol: { n: 'Đồ thị hàm số bậc hai', b: [{ t: 'h', x: 'Hàm số y = x² − 4x + 3', c: 'yellow' }, { t: 'plot', f: 'x^2-4*x+3', xr: [-1, 5], lab: 'y = x² − 4x + 3' }, { t: 'li', x: 'Đỉnh I(2; −1), trục đối xứng x = 2' }, { t: 'li', x: 'Cắt Ox tại x = 1 và x = 3' }, { t: 'li', x: 'Cắt Oy tại (0; 3)' }] },
    cuuchuong: { n: 'Bảng nhân 7', b: [{ t: 'h', x: 'Bảng nhân 7', c: 'yellow' }, { t: 'tbl', rows: [['7 × 1', '7'], ['7 × 2', '14'], ['7 × 3', '21'], ['7 × 4', '28'], ['7 × 5', '35']] }, { t: 'p', x: 'Mẹo: 7 × 5 = 35 vì 7 × 10 = 70 và 70 chia 2 = 35.', c: 'green' }] },
    hcn: { n: 'Chu vi, diện tích hình chữ nhật', b: [{ t: 'h', x: 'Hình chữ nhật', c: 'yellow' }, { t: 'rect', w: 'chiều dài a', h: 'rộng b' }, { t: 'f', x: 'P = 2 × (a + b)', c: 'pink' }, { t: 'f', x: 'S = a × b', c: 'blue' }, { t: 'step', x: 'Ví dụ a = 8 cm, b = 5 cm: P = 26 cm, S = 40 cm²', c: 'green' }] },
    tron: { n: 'Đường tròn', b: [{ t: 'h', x: 'Đường tròn', c: 'yellow' }, { t: 'circ', r: 'R' }, { t: 'f', x: 'C = 2πR', c: 'pink' }, { t: 'f', x: 'S = πR²', c: 'blue' }, { t: 'p', x: 'Với R = 3 cm: C ≈ 18,85 cm; S ≈ 28,27 cm².', c: 'green' }] }
  };
  const SYS = `Bạn là giáo viên giỏi, soạn nội dung để viết lên bảng đen. CHỈ trả về MỘT đối tượng JSON hợp lệ (không giải thích ngoài JSON) dạng:
{"title":"...","blocks":[ ... ]}
Mỗi khối là một trong:
{"t":"h","x":"tiêu đề","c":"yellow"}  | {"t":"p","x":"đoạn văn","say":"lời giảng"} | {"t":"li","x":"ý gạch đầu dòng"} | {"t":"step","x":"bước giải","c":"blue"} | {"t":"f","x":"công thức","c":"pink"}
{"t":"tri","a":"3","b":"4","c":"5"} (tam giác vuông) | {"t":"rect","w":"a","h":"b"} | {"t":"circ","r":"R"} | {"t":"plot","f":"x^2-4*x+3","xr":[-1,5],"lab":"y = x² − 4x + 3"} (đồ thị, f dùng x, + - * / ^ ( ), sin cos sqrt abs) | {"t":"tbl","rows":[["a","b"],["c","d"]]}
Màu c: white, yellow, pink, blue, green, orange. Quy tắc: tiếng Việt, ký hiệu toán bằng Unicode (x², √, π, ≤, ≥, ∈, ⇒), mỗi dòng ngắn (dưới 60 ký tự), tối đa 16 khối, có thể thêm "say" để đọc to. Chỉ dùng hình khi giúp minh hoạ. Nội dung phải chính xác.`;

  const FNS = /\b(sin|cos|tan|sqrt|abs|log|exp|pi)\b/g;
  const safeF = f => { // trả về hàm số an toàn hoặc null
    const s = String(f || '').toLowerCase().replace(/\s+/g, ''); if (!s || s.length > 60) return null;
    if (!/^[0-9x+\-*/().,^]*$/.test(s.replace(FNS, ''))) return null;
    const j = s.replace(/\^/g, '**').replace(FNS, m => m === 'pi' ? 'Math.PI' : 'Math.' + m);
    try { const fn = new Function('x', '"use strict";return (' + j + ')'); const v = fn(1); return typeof v === 'number' ? fn : null; } catch (e) { return null; }
  };
  const clean = (x, n = 120) => String(x == null ? '' : x).replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
  function parseBoard(text) {
    const a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a < 0 || b <= a) throw new Error('AI không trả về bài hợp lệ.');
    const o = JSON.parse(text.slice(a, b + 1)); if (!o || !Array.isArray(o.blocks)) throw new Error('Thiếu danh sách khối.');
    const KINDS = ['h', 'p', 'li', 'step', 'f', 'tri', 'rect', 'circ', 'plot', 'tbl'], bl = [];
    o.blocks.slice(0, 18).forEach(k => { if (!k || !KINDS.includes(k.t)) return; const r = { t: k.t, c: CH[k.c] ? k.c : (k.t === 'h' ? 'yellow' : 'white'), say: clean(k.say, 300) };
      if (['h', 'p', 'li', 'step', 'f'].includes(k.t)) r.x = clean(k.x, 220); if (k.t === 'tri') { r.a = clean(k.a, 8); r.b = clean(k.b, 8); r.c2 = clean(k.c && !CH[k.c] ? k.c : '', 8) || clean(k.cc || '', 8); }
      if (k.t === 'rect') { r.w = clean(k.w, 20); r.h = clean(k.h, 20); } if (k.t === 'circ') r.r = clean(k.r, 10);
      if (k.t === 'plot') { r.f = clean(k.f, 60); r.lab = clean(k.lab, 40); r.xr = Array.isArray(k.xr) && k.xr.length === 2 ? [+k.xr[0] || -5, +k.xr[1] || 5] : [-5, 5]; if (!(r.xr[1] > r.xr[0])) r.xr = [-5, 5]; if (!safeF(r.f)) return; }
      if (k.t === 'tbl') { r.rows = (Array.isArray(k.rows) ? k.rows : []).slice(0, 8).map(rw => (Array.isArray(rw) ? rw : []).slice(0, 5).map(c => clean(c, 14))); if (!r.rows.length) return; }
      bl.push(r); });
    if (o.title && !bl.some(k => k.t === 'h')) bl.unshift({ t: 'h', c: 'yellow', x: clean(o.title, 80), say: '' });
    if (!bl.length) throw new Error('Bài trống.');
    return bl;
  }

  GV.register({
    id: 'aiboard', type: 'tool', cat: 'Học tập', name: 'Bảng đen AI', icon: '🧑‍🏫', desc: 'Bảng đen cho dạy học: viết phấn tay, nhờ AI soạn bài lên bảng (viết dần, vẽ hình, đọc to lời giảng) và giải bài từ ảnh bảng.',
    mount(el) {
      const S = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1)));
      const st = Object.assign({ board: 'green', grid: 'none', color: 'white', size: 3, narr: true }, GV.store.get('aiboard', {}));
      let tool = 'pen', pages = [{ ink: null, undo: [], redo: [] }], pi = 0, dead = false, drawing = null, playing = null, skip = false, busy = false;
      el.innerHTML = `<style>.ab{max-width:720px;width:100%}.ab canvas{display:block}.ab .stg{position:relative;width:100%;max-width:min(100%,720px);margin:0 auto;aspect-ratio:${BW}/${BH};border-radius:14px;overflow:hidden;box-shadow:0 0 0 6px #b98b50,0 6px 0 6px #8a6636;touch-action:none}.ab .stg canvas{position:absolute;inset:0;width:100%!important;height:100%!important;max-height:none!important}.ab .tl{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-top:10px;align-items:center}.ab .tl .btn{height:34px;padding:0 10px;font-size:13px;flex:none}.ab .tl .on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.ab .cl{width:26px;height:26px;border-radius:50%;border:3px solid transparent;cursor:pointer;flex:none}.ab .cl.on{border-color:var(--md-primary,#D0BCFF);transform:scale(1.15)}.ab select,.ab input[type=text]{height:34px;min-height:0;font-size:13px;min-width:0;padding:0 8px;line-height:32px}.ab .ai{width:100%;margin-top:10px;text-align:left}.ab .ai textarea{width:100%;box-sizing:border-box;min-height:54px;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--inp,#1c1b1f);color:var(--fg)}.ab .msg3{min-height:1.4em;font-size:13px}</style>
<div class="ab tool" style="align-items:center">
<div class="stg"><canvas class="bg"></canvas><canvas class="ink" style="cursor:crosshair"></canvas></div>
<div class="tl tools"><button class="btn ghost on" data-tool="pen">✏️ Phấn</button><button class="btn ghost" data-tool="line">📏 Thẳng</button><button class="btn ghost" data-tool="text">🔤 Chữ</button><button class="btn ghost" data-tool="erase">🧽 Tẩy</button><button class="btn ghost un">↩</button><button class="btn ghost re">↪</button><button class="btn ghost clr">🗑</button></div>
<div class="tl cols">${Object.keys(CH).map(k => `<span class="cl" data-col="${k}"></span>`).join('')}<select class="sz"><option value="2">Nét mảnh</option><option value="3">Vừa</option><option value="6">Đậm</option></select><select class="bd">${Object.entries(BOARDS).map(([k, v]) => `<option value="${k}">${v[2]}</option>`).join('')}</select><select class="gr"><option value="none">Trơn</option><option value="lines">Dòng kẻ</option><option value="grid">Ô vuông</option><option value="axes">Trục toạ độ</option></select></div>
<div class="tl pg"><button class="btn ghost pv">‹</button><b class="pn">1/1</b><button class="btn ghost nx">›</button><button class="btn ghost np">＋ Trang</button><button class="btn ghost png">📷 Lưu ảnh</button></div>
<div class="ai"><details class="box" open><summary>🧑‍🏫 Nhờ AI soạn bài lên bảng</summary>${L.ai.panelHTML()}
<div class="tl" style="justify-content:flex-start"><select class="lv"><option>Tiểu học</option><option>THCS</option><option selected>THPT</option></select><select class="sub"><option>Toán</option><option>Vật lí</option><option>Hoá học</option><option>Tiếng Anh</option><option>Tin học</option><option>Khác</option></select></div>
<textarea class="q" placeholder="Ví dụ: Giải thích định lý Pytago kèm ví dụ · Cách giải phương trình bậc hai · Tính chất đồ thị hàm số y = x² − 4x + 3"></textarea>
<div class="tl" style="justify-content:flex-start"><button class="btn gen">✨ Soạn bài</button><button class="btn ghost solve">🧠 Giải bài trên bảng</button><button class="btn ghost mic">🎤</button><label style="font-size:13px"><input type="checkbox" class="narr"> 🔊 Đọc lời giảng</label><button class="btn ghost skipb" style="display:none">⏭ Bỏ qua</button></div>
<div class="tl" style="justify-content:flex-start"><span class="hint">Bài mẫu (không cần khoá AI):</span><select class="lib"><option value="">Chọn bài mẫu…</option>${Object.entries(LIB).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></div>
<div class="msg3 hint"></div></details></div></div>`;
      const bgc = $(el, '.bg'), ink = $(el, '.ink'); [bgc, ink].forEach(c => { c.width = BW * S; c.height = BH * S; });
      const bg = bgc.getContext('2d'), c = ink.getContext('2d', { willReadFrequently: true }); c.scale(S, S); bg.scale(S, S);
      const msg = t => $(el, '.msg3').textContent = t || '', onWhite = () => st.board === 'white';
      const col = k => CH[k] ? CH[k][onWhite() ? 1 : 0] : CH.white[onWhite() ? 1 : 0];
      const save = () => GV.store.set('aiboard', st);

      /* ---- nền bảng ---- */
      function drawBg() {
        const b = BOARDS[st.board], g = bg.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, b[0]); g.addColorStop(1, b[1]); bg.fillStyle = g; bg.fillRect(0, 0, BW, BH);
        bg.strokeStyle = onWhite() ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.13)'; bg.lineWidth = 1;
        if (st.grid === 'lines') for (let y = 40; y < BH; y += 34) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(BW, y); bg.stroke(); }
        if (st.grid === 'grid' || st.grid === 'axes') { for (let x = 0; x <= BW; x += 32) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, BH); bg.stroke(); } for (let y = 0; y <= BH; y += 32) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(BW, y); bg.stroke(); } }
        if (st.grid === 'axes') { bg.strokeStyle = onWhite() ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.65)'; bg.lineWidth = 2; bg.beginPath(); bg.moveTo(0, BH / 2); bg.lineTo(BW, BH / 2); bg.moveTo(BW / 2, 0); bg.lineTo(BW / 2, BH); bg.stroke(); }
        if (!onWhite()) { bg.fillStyle = 'rgba(255,255,255,.04)'; bg.fillRect(0, BH - 14, BW, 14); }
      }
      /* ---- bản sao để hoàn tác ---- */
      const P = () => pages[pi];
      const hasInk = () => c.getImageData(0, 0, ink.width, ink.height).data.some((v, i) => i % 4 === 3 && v);
      const snap = () => { const p = P(); p.undo.push(c.getImageData(0, 0, ink.width, ink.height)); if (p.undo.length > 14) p.undo.shift(); p.redo = []; };
      const restore = d => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ink.width, ink.height); if (d) c.putImageData(d, 0, 0); c.restore(); };
      function undo() { const p = P(); if (p.undo.length < 2) return; p.redo.push(p.undo.pop()); restore(p.undo[p.undo.length - 1]); }
      function redo() { const p = P(); const d = p.redo.pop(); if (!d) return; p.undo.push(d); restore(d); }
      const blank = () => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ink.width, ink.height); c.restore(); };
      function gotoPage(i) { const p = P(); p.ink = c.getImageData(0, 0, ink.width, ink.height); pi = Math.max(0, Math.min(pages.length - 1, i)); const q = P(); restore(q.ink); $(el, '.pn').textContent = pi + 1 + '/' + pages.length; }
      function addPage() { const p = P(); p.ink = c.getImageData(0, 0, ink.width, ink.height); pages.push({ ink: null, undo: [], redo: [] }); pi = pages.length - 1; blank(); snap(); $(el, '.pn').textContent = pi + 1 + '/' + pages.length; }

      /* ---- vẽ phấn ---- */
      const pos = e => { const r = ink.getBoundingClientRect(); return [(e.clientX - r.left) * BW / r.width, (e.clientY - r.top) * BH / r.height]; };
      function stroke(a, b, w, color, erase) {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        if (erase) { c.globalCompositeOperation = 'destination-out'; c.lineWidth = w * 6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        else { c.strokeStyle = color; c.lineWidth = w; c.shadowColor = color; c.shadowBlur = onWhite() ? 0 : 2; c.globalAlpha = .93; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalAlpha = .35; c.lineWidth = w * .5; c.beginPath(); c.moveTo(a[0] + .7, a[1] - .5); c.lineTo(b[0] + .7, b[1] - .5); c.stroke(); }
        c.restore();
      }
      ink.addEventListener('pointerdown', e => {
        if (playing) return; const p = pos(e);
        if (tool === 'text') { const t = window.prompt('Nhập chữ cần viết lên bảng:'); if (t) { c.save(); c.font = '26px "Patrick Hand",sans-serif'; c.fillStyle = col(st.color); c.textBaseline = 'middle'; c.fillText(t.slice(0, 80), p[0], p[1]); c.restore(); snap(); } return; }
        ink.setPointerCapture(e.pointerId); drawing = { last: p, start: p, snapBase: tool === 'line' ? c.getImageData(0, 0, ink.width, ink.height) : null };
        if (tool === 'pen' || tool === 'erase') stroke(p, [p[0] + .01, p[1]], +st.size, col(st.color), tool === 'erase');
      });
      ink.addEventListener('pointermove', e => {
        if (!drawing) return; const p = pos(e);
        if (tool === 'line') { restore(drawing.snapBase); stroke(drawing.start, p, +st.size, col(st.color), false); }
        else { stroke(drawing.last, p, +st.size, col(st.color), tool === 'erase'); drawing.last = p; }
      });
      const endDraw = () => { if (drawing) { drawing = null; snap(); } };
      ink.addEventListener('pointerup', endDraw); ink.addEventListener('pointercancel', endDraw);

      /* ---- dàn trang + viết dần ---- */
      function wrap(text, font, maxW) {
        c.font = font; const words = String(text).split(' '), out = []; let cur = '';
        words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out;
      }
      function layout(blocks) { // → danh sách trang, mỗi trang là danh sách thao tác đã có toạ độ
        const pgs = [[]]; let y = 22; const W = BW - MX * 2;
        const put = (op, h) => { if (y + h > BH - 14 && pgs[pgs.length - 1].length) { pgs.push([]); y = 22; } op.y = y; op.h = h; pgs[pgs.length - 1].push(op); y += h + 6; };
        blocks.forEach(b => {
          const say = b.say || '';
          if (b.t === 'h') { const f = '34px "Patrick Hand",sans-serif', ls = wrap(b.x, f, W); put({ k: 'text', ls, font: f, c: b.c, x: MX, lh: 40, say, ul: true }, ls.length * 40 + 6); }
          else if (b.t === 'p' || b.t === 'li' || b.t === 'step') { const f = '25px "Patrick Hand",sans-serif', pre = b.t === 'li' ? '• ' : '', ls = wrap(pre + b.x, f, W - (b.t === 'li' ? 8 : 0)); put({ k: 'text', ls, font: f, c: b.c, x: MX + (b.t === 'li' ? 8 : 0), lh: 28, say }, ls.length * 28); }
          else if (b.t === 'f') { const f = '32px "Patrick Hand",sans-serif'; c.font = f; const w = Math.min(W, c.measureText(b.x).width + 36); put({ k: 'text', ls: [b.x], font: f, c: b.c, x: BW / 2 - w / 2 + 18, lh: 44, box: [BW / 2 - w / 2, w], say }, 52); }
          else if (b.t === 'tri') put({ k: 'tri', b, c: 'white', say }, 112);
          else if (b.t === 'rect') put({ k: 'rect', b, c: 'white', say }, 110);
          else if (b.t === 'circ') put({ k: 'circ', b, c: 'white', say }, 124);
          else if (b.t === 'plot') put({ k: 'plot', b, c: 'white', say }, 168);
          else if (b.t === 'tbl') put({ k: 'tbl', b, c: 'white', say }, b.rows.length * 32 + 4);
        });
        return pgs;
      }
      function drawOp(op, prog) {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const colr = col(op.c); c.strokeStyle = colr; c.fillStyle = colr; c.lineWidth = 2.4; c.shadowColor = colr; c.shadowBlur = onWhite() ? 0 : 2;
        if (op.k === 'text') {
          c.font = op.font; c.textBaseline = 'middle'; let left = Math.ceil(op.ls.join('').length * prog);
          if (op.box) { c.save(); c.globalAlpha = Math.min(1, prog * 2); c.strokeStyle = col('yellow'); c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(op.box[0], op.y - 2, op.box[1], op.h - 4, 12) : c.rect(op.box[0], op.y - 2, op.box[1], op.h - 4); c.stroke(); c.restore(); }
          op.ls.forEach((ln, i) => { const t = ln.slice(0, Math.max(0, left)); left -= ln.length; if (t) c.fillText(t, op.x, op.y + op.lh * (i + .5) + (op.box ? 4 : 0)); });
          if (op.ul && prog > .8) { c.globalAlpha = .7; c.beginPath(); c.moveTo(MX, op.y + op.h - 4); c.lineTo(MX + Math.min(BW - MX * 2, 260) * Math.min(1, (prog - .8) * 5), op.y + op.h - 4); c.stroke(); }
        } else {
          c.beginPath(); c.rect(0, op.y - 10, MX + (BW - MX * 2) * prog, op.h + 20); c.clip(); c.font = '22px "Patrick Hand",sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center'; const y0 = op.y + 6, cx = BW / 2, b = op.b;
          if (op.k === 'tri') { const w = 140, h = 88, x0 = cx - w / 2, yb = y0 + h; c.beginPath(); c.moveTo(x0, yb); c.lineTo(x0 + w, yb); c.lineTo(x0, yb - h); c.closePath(); c.stroke(); c.strokeRect(x0, yb - 12, 12, 12); c.fillText(b.a, x0 - 16, yb - h / 2); c.fillText(b.b, x0 + w / 2, yb + 14); c.fillText(b.c2 || 'c', x0 + w / 2 + 16, yb - h / 2 - 8); }
          else if (op.k === 'rect') { const w = 170, h = 80, x0 = cx - w / 2; c.strokeRect(x0, y0, w, h); c.fillText(b.w, cx, y0 + h + 16); c.save(); c.textAlign = 'left'; c.fillText(b.h, x0 + w + 8, y0 + h / 2); c.restore(); }
          else if (op.k === 'circ') { const r = 50; c.beginPath(); c.arc(cx, y0 + r, r, 0, 7); c.stroke(); c.beginPath(); c.moveTo(cx, y0 + r); c.lineTo(cx + r, y0 + r); c.stroke(); c.beginPath(); c.arc(cx, y0 + r, 3, 0, 7); c.fill(); c.fillText(b.r, cx + r / 2, y0 + r - 12); }
          else if (op.k === 'plot') {
            const fn = safeF(b.f), w = 250, h = 140, x0 = cx - w / 2, ys = []; const [xa, xb] = b.xr; for (let i = 0; i <= 80; i++) { const x = xa + (xb - xa) * i / 80; let y = NaN; try { y = fn(x); } catch (e) {} ys.push([x, y]); }
            const fin = ys.filter(p => isFinite(p[1])).map(p => p[1]); if (fin.length) { let ya = Math.min(...fin), yb = Math.max(...fin); if (ya > 0) ya = 0; if (yb < 0) yb = 0; if (yb - ya < 1e-6) yb = ya + 1; const pad = (yb - ya) * .12; ya -= pad; yb += pad;
              const X = x => x0 + (x - xa) / (xb - xa) * w, Y = y => y0 + h - (y - ya) / (yb - ya) * h; c.save(); c.globalAlpha = .6; c.lineWidth = 1.6; c.beginPath(); if (xa < 0 && xb > 0) { c.moveTo(X(0), y0); c.lineTo(X(0), y0 + h); } if (ya < 0 && yb > 0) { c.moveTo(x0, Y(0)); c.lineTo(x0 + w, Y(0)); } c.stroke(); c.restore();
              c.lineWidth = 3; c.strokeStyle = col('pink'); c.beginPath(); let started = false; ys.forEach(([x, y]) => { if (!isFinite(y)) { started = false; return; } const px = X(x), py = Math.max(y0 - 4, Math.min(y0 + h + 4, Y(y))); started ? c.lineTo(px, py) : c.moveTo(px, py); started = true; }); c.stroke(); }
            if (b.lab) { c.fillStyle = col('yellow'); c.fillText(b.lab, cx, y0 - 2); }
          } else if (op.k === 'tbl') { const cols = Math.max(...b.rows.map(r => r.length)), cw = Math.min(110, (BW - MX * 2) / cols), w = cw * cols, x0 = cx - w / 2; b.rows.forEach((r, i) => { r.forEach((t, j) => { c.strokeRect(x0 + j * cw, op.y + i * 32, cw, 32); c.fillText(t, x0 + j * cw + cw / 2, op.y + i * 32 + 17); }); }); }
        }
        c.restore();
      }
      const dur = op => op.k === 'text' ? Math.max(500, op.ls.join('').length * 32) : 1100;
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      async function play(blocks) {
        if (playing) return; playing = true; skip = false; $(el, '.skipb').style.display = ''; const pgs = layout(blocks); let first = true;
        try {
          for (const ops of pgs) {
            if (!first || hasInk()) addPage(); first = false;
            for (const op of ops) {
              if (dead) return; const text = op.say || (op.k === 'text' ? op.ls.join(' ') : ''), base = c.getImageData(0, 0, ink.width, ink.height), t0 = performance.now(), D = dur(op);
              const spk = $(el, '.narr').checked && text ? L.speakAsync(text, 'vi', .95) : Promise.resolve();
              await new Promise(res => { const f = now => { if (dead) return res(); const p = skip ? 1 : Math.min(1, (now - t0) / D); restore(base); drawOp(op, p); p < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
              if (!skip) await Promise.race([spk, sleep(8000)]); else try { speechSynthesis.cancel(); } catch (e) {}
              snap(); await sleep(skip ? 0 : 120);
            }
          }
        } finally { playing = false; skip = false; $(el, '.skipb').style.display = 'none'; }
      }
      const lessonFromAI = async (fn) => { if (busy) return; busy = true; msg('⏳ AI đang soạn bài…'); try { const txt = await fn(); const bl = parseBoard(txt); msg(''); busy = false; await play(bl); } catch (e) { msg('⚠️ ' + (e.message || e)); } busy = false; };
      L.ai.bindPanel(el, () => msg('Đã lưu cài đặt AI.'));

      /* ---- nút ---- */
      const composite = () => { const t = document.createElement('canvas'); t.width = ink.width; t.height = ink.height; const x = t.getContext('2d'); x.drawImage(bgc, 0, 0); x.drawImage(ink, 0, 0); return t; };
      el.addEventListener('click', e => {
        const b = e.target.closest('button,.cl'); if (!b) return;
        if (b.dataset.tool) { tool = b.dataset.tool; el.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); return; }
        if (b.dataset.col) { st.color = b.dataset.col; save(); paintCols(); return; }
        if (b.classList.contains('un')) undo(); else if (b.classList.contains('re')) redo();
        else if (b.classList.contains('clr')) { if (confirm('Xoá toàn bộ trang này?')) { blank(); snap(); } }
        else if (b.classList.contains('pv')) gotoPage(pi - 1); else if (b.classList.contains('nx')) gotoPage(pi + 1); else if (b.classList.contains('np')) addPage();
        else if (b.classList.contains('png')) composite().toBlob(bl => { if (!bl) return; const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'bang-den-trang-' + (pi + 1) + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
        else if (b.classList.contains('skipb')) skip = true;
        else if (b.classList.contains('gen')) {
          const q = $(el, '.q').value.trim(); if (!q) return msg('Hãy nhập chủ đề cần dạy.');
          if (!L.ai.ready()) return msg('Chưa có khóa AI – hãy nhập khóa ở phần “Cài đặt AI”, hoặc chọn một bài mẫu bên dưới.');
          lessonFromAI(() => L.ai.chat([{ role: 'user', content: `Cấp học: ${$(el, '.lv').value}. Môn: ${$(el, '.sub').value}. Hãy soạn nội dung lên bảng cho chủ đề: ${q}` }], { system: SYS, maxTokens: 3500 }));
        } else if (b.classList.contains('solve')) {
          if (!L.ai.ready()) return msg('Cần khóa AI (Claude, OpenAI hoặc Gemini có hỗ trợ ảnh) để giải bài từ ảnh bảng.');
          const url = composite().toDataURL('image/jpeg', .85);
          lessonFromAI(() => L.ai.vision(url, `Đây là ảnh một bảng${onWhite() ? ' trắng' : ' đen'} có bài tập hoặc hình vẽ do giáo viên viết. ${$(el, '.q').value.trim() ? 'Ghi chú của giáo viên: ' + $(el, '.q').value.trim() + '. ' : ''}Cấp học: ${$(el, '.lv').value}, môn: ${$(el, '.sub').value}. Hãy đọc đề, giải chi tiết từng bước và trình bày lên bảng theo định dạng JSON đã nêu.`, { system: SYS, maxTokens: 3500 }));
        } else if (b.classList.contains('mic')) { if (!L.hasSTT()) return msg('Trình duyệt chưa hỗ trợ nhận giọng nói.'); const ctl = L.listen('vi', { continuous: false, onText: (fin) => { if (fin) $(el, '.q').value += (  $(el, '.q').value ? ' ' : '') + fin; }, onError: m => msg(m), onEnd: () => { b.textContent = '🎤'; } }); if (ctl) b.textContent = '⏹'; }
      });
      $(el, '.lib').onchange = e => { const k = e.target.value; e.target.value = ''; if (k && LIB[k] && !busy) play(parseBoard(JSON.stringify({ blocks: LIB[k].b.map(x => Object.assign({}, x, x.t === 'tri' ? { c2: 'c' } : {})) }))); };
      $(el, '.sz').value = st.size; $(el, '.bd').value = st.board; $(el, '.gr').value = st.grid; $(el, '.narr').checked = !!st.narr;
      $(el, '.sz').onchange = e => { st.size = +e.target.value; save(); }; $(el, '.bd').onchange = e => { st.board = e.target.value; save(); drawBg(); paintCols(); }; $(el, '.gr').onchange = e => { st.grid = e.target.value; save(); drawBg(); }; $(el, '.narr').onchange = e => { st.narr = e.target.checked; save(); };
      function paintCols() { el.querySelectorAll('[data-col]').forEach(s => { s.style.background = CH[s.dataset.col][onWhite() ? 1 : 0]; s.classList.toggle('on', s.dataset.col === st.color); }); }
      drawBg(); paintCols(); snap();
      GV.aibT = { parseBoard, safeF, layout, play, get pages() { return pages.length; }, LIB, ink: () => ink, drawBg };
      return () => { dead = true; try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
