// Lập trình khối lệnh (kéo thả, kiểu Scratch – mã nguồn tự viết): sân khấu + nhân vật, khối lệnh, chạy bằng trình thông dịch từng khung hình.
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const KEYS = ['space', 'right', 'left', 'up', 'down', 'a', 'd', 'w', 's'];
  const VARS = ['a', 'b', 'điểm'];
  const CONDS = [['edge', 'chạm cạnh sân khấu'], ['space', 'phím cách đang nhấn'], ['left', 'phím ← đang nhấn'], ['right', 'phím → đang nhấn'], ['a>10', 'biến a > 10'], ['rand', 'ngẫu nhiên 50%']];
  const SPR = { cat: ['🐱', '😺', '😸'], dog: ['🐶', '🐕', '🦮'], rocket: ['🚀', '🛸', '🌟'], robot: ['🤖', '👾', '🎮'], fish: ['🐟', '🐠', '🐡'] };
  const SPN = { cat: '🐱 Mèo', dog: '🐶 Chó', rocket: '🚀 Tên lửa', robot: '🤖 Rô-bốt', fish: '🐟 Cá' };
  const BGS = { sky: ['#bfe9ff', '#eaf7ff'], night: ['#1b1f4b', '#3d3b7a'], grass: ['#a8e063', '#56ab2f'], sand: ['#fff1c1', '#f6d365'], white: ['#ffffff', '#f1f1f1'] };
  const BGN = { sky: 'Bầu trời', night: 'Ban đêm', grass: 'Đồng cỏ', sand: 'Sa mạc', white: 'Trắng' };
  const COL = { ctl: '#FFAB19', mot: '#4C97FF', look: '#9966FF', var: '#FF8C1A', snd: '#CF63CF' };
  const CATN = { ctl: 'Điều khiển', mot: 'Chuyển động', look: 'Hiển thị', var: 'Biến', snd: 'Âm thanh' };
  // ins: [tên, kiểu, mặc định/lựa chọn]
  const DEF = {
    flag: { cat: 'ctl', hat: 1, txt: 'Khi bấm 🏴 cờ xanh' },
    key: { cat: 'ctl', hat: 1, txt: 'Khi bấm phím {k}', ins: { k: ['sel', KEYS.map(k => [k, k]), 'space'] } },
    wait: { cat: 'ctl', txt: 'Chờ {n} giây', ins: { n: ['num', 1] } },
    repeat: { cat: 'ctl', c: 1, txt: 'Lặp {n} lần', ins: { n: ['num', 10] } },
    forever: { cat: 'ctl', c: 1, cap: 1, txt: 'Lặp mãi mãi' },
    if: { cat: 'ctl', c: 1, txt: 'Nếu {c} thì', ins: { c: ['sel', CONDS, 'edge'] } },
    move: { cat: 'mot', txt: 'Đi {n} bước', ins: { n: ['num', 10] } },
    turnR: { cat: 'mot', txt: 'Quay phải ↻ {n} độ', ins: { n: ['num', 15] } },
    turnL: { cat: 'mot', txt: 'Quay trái ↺ {n} độ', ins: { n: ['num', 15] } },
    goto: { cat: 'mot', txt: 'Đi tới x: {x} y: {y}', ins: { x: ['num', 0], y: ['num', 0] } },
    chx: { cat: 'mot', txt: 'Thay đổi x thêm {n}', ins: { n: ['num', 10] } },
    chy: { cat: 'mot', txt: 'Thay đổi y thêm {n}', ins: { n: ['num', 10] } },
    point: { cat: 'mot', txt: 'Hướng {n}°', ins: { n: ['num', 90] } },
    grand: { cat: 'mot', txt: 'Đi tới vị trí ngẫu nhiên' },
    bounce: { cat: 'mot', txt: 'Nảy lại nếu chạm cạnh' },
    say: { cat: 'look', txt: 'Nói {t} trong {s} giây', ins: { t: ['txt', 'Xin chào!'], s: ['num', 2] } },
    sayf: { cat: 'look', txt: 'Nói {t}', ins: { t: ['txt', 'Hmm...'] } },
    next: { cat: 'look', txt: 'Đổi sang hình kế tiếp' },
    size: { cat: 'look', txt: 'Đặt cỡ {n}%', ins: { n: ['num', 100] } },
    chsize: { cat: 'look', txt: 'Thay đổi cỡ thêm {n}', ins: { n: ['num', 10] } },
    show: { cat: 'look', txt: 'Hiện' },
    hide: { cat: 'look', txt: 'Ẩn' },
    setv: { cat: 'var', txt: 'Đặt {v} = {n}', ins: { v: ['sel', VARS.map(v => [v, v]), 'a'], n: ['num', 0] } },
    chv: { cat: 'var', txt: 'Thay đổi {v} thêm {n}', ins: { v: ['sel', VARS.map(v => [v, v]), 'a'], n: ['num', 1] } },
    sayv: { cat: 'var', txt: 'Nói giá trị của {v}', ins: { v: ['sel', VARS.map(v => [v, v]), 'a'] } },
    beep: { cat: 'snd', txt: 'Phát âm thanh nốt {n}', ins: { n: ['num', 60] } }
  };
  const ORDER = { ctl: ['flag', 'key', 'wait', 'repeat', 'forever', 'if'], mot: ['move', 'turnR', 'turnL', 'goto', 'chx', 'chy', 'point', 'grand', 'bounce'], look: ['say', 'sayf', 'next', 'size', 'chsize', 'show', 'hide'], var: ['setv', 'chv', 'sayv'], snd: ['beep'] };
  let UID = 1; const nb = (t, a, c) => { const d = DEF[t], o = { id: UID++, t, a: {}, c: d.c ? (c || []) : undefined }; Object.entries(d.ins || {}).forEach(([k, s]) => { o.a[k] = s[0] === 'sel' ? s[2] : s[1]; }); if (a) Object.assign(o.a, a); return o; };
  const B = nb;
  const EX = {
    square: { n: 'Mèo đi hình vuông', d: 'Lặp 4 lần: đi 100 bước rồi quay phải 90°.', sp: 'cat', build: () => [[B('flag'), B('goto', { x: -50, y: -50 }), B('point', { n: 90 }), B('repeat', { n: 4 }, [B('move', { n: 100 }), B('turnL', { n: 90 })])]] },
    bounce: { n: 'Nảy khắp sân khấu', d: 'Lặp mãi: đi 6 bước và nảy lại khi chạm cạnh.', sp: 'fish', build: () => [[B('flag'), B('point', { n: 60 }), B('forever', {}, [B('move', { n: 6 }), B('bounce')])]] },
    hello: { n: 'Chào bạn', d: 'Nhân vật nói hai câu liên tiếp.', sp: 'cat', build: () => [[B('flag'), B('say', { t: 'Xin chào!', s: 2 }), B('say', { t: 'Mình là mèo con!', s: 2 })]] },
    count: { n: 'Đếm số', d: 'Dùng biến "điểm": tăng thêm 1 mỗi lần và nói ra.', sp: 'robot', build: () => [[B('flag'), B('setv', { v: 'điểm', n: 0 }), B('repeat', { n: 10 }, [B('chv', { v: 'điểm', n: 1 }), B('sayv', { v: 'điểm' }), B('wait', { n: 0.4 })])]] },
    keys: { n: 'Điều khiển bằng phím', d: 'Bấm phím mũi tên để di chuyển nhân vật.', sp: 'rocket', build: () => [[B('key', { k: 'right' }), B('chx', { n: 20 })], [B('key', { k: 'left' }), B('chx', { n: -20 })], [B('key', { k: 'up' }), B('chy', { n: 20 })], [B('key', { k: 'down' }), B('chy', { n: -20 })]] },
    dance: { n: 'Nhảy múa', d: 'Quay tròn, đổi hình liên tục và phình to.', sp: 'dog', build: () => [[B('flag'), B('forever', {}, [B('turnR', { n: 20 }), B('next'), B('chsize', { n: 5 }), B('wait', { n: 0.1 })])]] }
  };

  GV.register({
    id: 'blockcode', type: 'tool', cat: 'Học tập', name: 'Lập trình khối lệnh', icon: '🧩', desc: 'Kéo thả khối lệnh để làm hoạt hình và trò chơi nhỏ: di chuyển, nói, lặp, điều kiện, biến. Có ví dụ, lưu và chia sẻ dự án.',
    mount(el) {
      const saved = GV.store.get('blockcode', null) || {};
      let scripts = [], spr = saved.spr || 'cat', bg = saved.bg || 'sky', turbo = false, threads = [], tab = 'ctl', dead = false, raf = 0, ids = new Map(), slots = {}, drag = null, keysDown = {}, ctlLast = 0;
      const S0 = () => ({ x: 0, y: 0, dir: 90, size: 100, show: true, say: '', ci: 0, vars: { a: 0, b: 0, 'điểm': 0 } });
      let sp = S0();
      const revive = list => list.map(b => { const o = Object.assign(nb(b.t), { a: Object.assign({}, b.a) }); if (b.c) o.c = revive(b.c); return o; });
      try { if (saved.scripts) scripts = saved.scripts.map(revive); } catch (e) { scripts = []; }
      if (!scripts.length) { scripts = EX.square.build(); spr = EX.square.sp; }
      const persist = () => GV.store.set('blockcode', { scripts: JSON.parse(JSON.stringify(scripts)), spr, bg });
      el.innerHTML = `<style>.bc{max-width:640px;width:100%}.bc>*{width:100%;box-sizing:border-box}.bc select,.bc .tb2 select{height:34px;min-height:0;padding:0 8px;font-size:13px;width:auto;min-width:0;max-width:46%}.bc .tb2 .btn{flex:none}.bc .pal,.bc .cats{justify-content:flex-start}.bc .tb2{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center}.bc .tb2 .btn{height:34px;padding:0 10px;font-size:13px}.bc canvas{width:100%;max-width:min(100%,320px);border-radius:12px;display:block;margin:6px auto;touch-action:none;background:#fff}.bc .cats{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:2px}.bc .cats button{flex:0 0 auto;border:0;border-radius:14px;padding:5px 10px;color:#fff;font-weight:700;font-size:12px;opacity:.55;cursor:pointer}.bc .cats button.on{opacity:1;outline:2px solid #fff6}.bc .pal{display:flex;gap:6px;overflow-x:auto;padding:6px 4px;min-height:54px;background:var(--md-sc-high,#2b292d);border-radius:12px;align-items:flex-start}.bc .ws{min-height:150px;max-height:36dvh;overflow:auto;background:var(--md-sc-low,#211f23);border:2px dashed var(--line);border-radius:12px;padding:8px;margin-top:6px}.bc .scr{background:#0002;border-radius:10px;padding:6px;margin-bottom:8px;display:inline-block;min-width:60%;vertical-align:top}.bc .bk{border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:5px 8px;margin:1px 0;line-height:1.7;white-space:nowrap;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;box-shadow:inset 0 -2px 0 #0003}.bc .bk.hat{border-radius:16px 16px 8px 8px;padding-top:9px}.bc .cin{margin:4px 0 0 10px;padding-left:6px;border-left:6px solid #0003;min-height:12px}.bc .bk.c{padding-bottom:0}.bc .cend{height:10px;margin:0 -8px;background:#0003;border-radius:0 0 8px 8px}.bc .in{width:3.6em;border:0;border-radius:10px;padding:1px 5px;text-align:center;font:inherit;font-weight:700;color:#333;background:#fff}.bc select.in{width:auto;max-width:9em}.bc input.in[type=text]{width:6.5em}.bc .slot{height:6px;border-radius:3px;margin:0}.bc .slot.hot{height:12px;background:#ffeb3b}.bc .dghost{position:fixed;z-index:999;pointer-events:none;opacity:.92;transform:rotate(-2deg);filter:drop-shadow(0 6px 8px #0006)}.bc .pal.trash{outline:3px dashed #ef5350}.bc .pal .bk{flex:0 0 auto}.bc .running{outline:2px solid #4caf50}body.ingame .bc canvas{max-height:26dvh!important;margin:2px auto}body.ingame .bc .ws{max-height:none;min-height:140px}</style>
<div class="bc tool" style="align-items:center"><div class="tb2"><button class="btn go">🏴 Chạy</button><button class="btn ghost bstp">⏹ Dừng</button><button class="btn ghost btrb" title="Chạy nhanh">⚡</button><select class="ex"><option value="">📚 Ví dụ…</option>${Object.entries(EX).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select><select class="spr">${Object.entries(SPN).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><select class="bgs">${Object.entries(BGN).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
<canvas width="480" height="360"></canvas><div class="hint exd" style="text-align:center;min-height:1.3em"></div>
<div class="cats">${Object.keys(CATN).map(k => `<button data-cat="${k}" style="background:${COL[k]}">${CATN[k]}</button>`).join('')}</div><div class="pal"></div>
<div class="ws"></div><div class="tb2" style="margin-top:6px"><button class="btn ghost clr">🗑 Xoá hết</button><button class="btn ghost sv">💾 Lưu mã</button><button class="btn ghost ld">📥 Nhập mã</button><button class="btn ghost png">📷 Ảnh sân khấu</button></div><p class="hint">Chạm khối trong bảng màu để thêm · kéo khối vào vùng làm việc · kéo khối ra bảng màu để xoá · chạm một khối trong chương trình để chạy riêng đoạn đó.</p></div>`;
      const cvs = $(el, 'canvas'), g = cvs.getContext('2d'), ws = $(el, '.ws'), pal = $(el, '.pal');
      $(el, '.spr').value = spr; $(el, '.bgs').value = bg;

      /* ---------- vẽ khối ---------- */
      const regSlot = (L, i) => { const id = 's' + Object.keys(slots).length; slots[id] = { L, i }; return `<div class="slot" data-sid="${id}"></div>`; };
      function inputHTML(b, k, spec) {
        const v = b.a[k];
        if (spec[0] === 'sel') return `<select class="in" data-bid="${b.id}" data-k="${k}">${spec[1].map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(v) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
        return `<input class="in" type="${spec[0] === 'num' ? 'number' : 'text'}" data-bid="${b.id}" data-k="${k}" value="${esc(v)}">`;
      }
      function blockHTML(b, withSlots) {
        const d = DEF[b.t]; ids.set(b.id, b);
        const label = d.txt.replace(/\{(\w+)\}/g, (_, k) => inputHTML(b, k, d.ins[k]));
        let h = `<div class="bk ${d.hat ? 'hat' : ''} ${d.c ? 'c' : ''}" data-id="${b.id}" style="background:${COL[d.cat]}">${label}`;
        if (d.c) h += `<div class="cin">${withSlots ? regSlot(b.c, 0) : ''}${listHTML(b.c, withSlots, true)}</div><div class="cend"></div>`;
        return h + '</div>';
      }
      function listHTML(L, withSlots, inner) {
        let h = ''; if (withSlots && !inner && L.length && !DEF[L[0].t].hat) h += regSlot(L, 0);
        L.forEach((b, i) => { h += blockHTML(b, withSlots); if (withSlots && !DEF[b.t].cap) h += regSlot(L, i + 1); });
        return h;
      }
      function renderWS() {
        slots = {};
        ws.innerHTML = scripts.map((L, si) => `<div class="scr" data-si="${si}">${listHTML(L, true, false)}</div>`).join('') || '<p class="hint">Kéo khối lệnh vào đây 👆</p>';
        persist();
      }
      function renderPal() {
        pal.innerHTML = ORDER[tab].map(t => blockHTML(nb(t), false)).join('');
        el.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === tab));
      }
      pal.dataset.pal = 1;
      /* ---------- chỉnh giá trị ---------- */
      el.addEventListener('input', e => { const t = e.target; if (!t.dataset || !t.dataset.bid) return; const b = ids.get(+t.dataset.bid); if (b) { b.a[t.dataset.k] = t.type === 'number' ? (parseFloat(t.value) || 0) : t.value; persist(); } });
      el.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.bid) { const b = ids.get(+t.dataset.bid); if (b) { b.a[t.dataset.k] = t.value; persist(); } } });

      /* ---------- kéo thả ---------- */
      const findList = (L0, id) => { for (let i = 0; i < L0.length; i++) { if (L0[i].id === id) return [L0, i]; if (L0[i].c) { const r = findList(L0[i].c, id); if (r) return r; } } return null; };
      const clone = b => { const o = nb(b.t, b.a); if (b.c) o.c = b.c.map(clone); return o; };
      el.addEventListener('pointerdown', e => {
        const bk = e.target.closest('.bk'); if (!bk || e.target.closest('input,select') || drag) return;
        const inPal = !!bk.closest('.pal'), id = +bk.dataset.id; drag = { id, inPal, x0: e.clientX, y0: e.clientY, started: false, chain: null, ghost: null, bk };
        e.preventDefault();
      });
      window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; renderWS(); });
      function startDrag(e) {
        const d = drag; d.started = true;
        if (d.inPal) { const t = ids.get(d.id); d.chain = [clone(t)]; }
        else { let hit = null; scripts.forEach((L, si) => { if (hit) return; const r = findList(L, d.id); if (r) hit = { L, r, si }; }); if (!hit) { drag = null; return; } const [L, i] = hit.r; d.chain = L.splice(i); if (L === scripts[hit.si] && !L.length) scripts.splice(hit.si, 1); }
        const gh = document.createElement('div'); gh.className = 'bc dghost'; gh.innerHTML = d.chain.map(b => blockHTML(b, false)).join(''); document.body.appendChild(gh); d.ghost = gh; renderWS();
      }
      function onMove(e) {
        if (!drag) return;
        if (!drag.started) { if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 7) return; startDrag(e); if (!drag) return; }
        const gh = drag.ghost; gh.style.left = e.clientX - 20 + 'px'; gh.style.top = e.clientY - 12 + 'px';
        const pr = pal.getBoundingClientRect(), overPal = e.clientY >= pr.top - 4 && e.clientY <= pr.bottom + 4 && e.clientX >= pr.left && e.clientX <= pr.right; pal.classList.toggle('trash', overPal);
        let best = null, bd = 44; el.querySelectorAll('.slot').forEach(s => { s.classList.remove('hot'); const r = s.getBoundingClientRect(), d = Math.hypot(e.clientX - 20 - r.left, e.clientY - 12 - r.top); if (d < bd) { bd = d; best = s; } });
        drag.slot = overPal ? null : best; if (best && !overPal && !DEF[drag.chain[0].t].hat) best.classList.add('hot');
        drag.overPal = overPal;
        if (ws.scrollHeight > ws.clientHeight) { const wr = ws.getBoundingClientRect(); if (e.clientY > wr.bottom - 20) ws.scrollTop += 8; else if (e.clientY < wr.top + 20) ws.scrollTop -= 8; }
      }
      function onUp(e) {
        const d = drag; if (!d) return; drag = null;
        if (!d.started) { // chạm
          if (d.inPal) { const t = ids.get(d.id), b = clone(t), last = scripts[scripts.length - 1]; if (DEF[b.t].hat || !last || DEF[last[last.length - 1].t].cap) scripts.push([b]); else last.push(b); renderWS(); ws.scrollTop = ws.scrollHeight; }
          else { const r = scripts.find(L => findList(L, d.id)); if (r) runOne(r); }
          return;
        }
        d.ghost.remove(); pal.classList.remove('trash');
        if (d.overPal) { GV.beep && GV.beep(220, 40); }
        else if (DEF[d.chain[0].t].hat || !d.slot) {
          const wr = ws.getBoundingClientRect(); if (e.clientY >= wr.top - 30 && e.clientY <= wr.bottom + 30) scripts.push(d.chain); else if (!d.inPal) scripts.push(d.chain);
        } else { const s = slots[d.slot.dataset.sid]; if (s) { s.L.splice(s.i, 0, ...d.chain); } else scripts.push(d.chain); }
        renderWS();
      }

      /* ---------- trình thông dịch ---------- */
      const num = v => parseFloat(v) || 0;
      function cond(c) {
        if (c === 'edge') return touching(); if (c === 'space') return !!keysDown.space; if (c === 'left') return !!keysDown.left; if (c === 'right') return !!keysDown.right;
        if (c === 'a>10') return sp.vars.a > 10; return Math.random() < .5;
      }
      const half = () => 24 * sp.size / 100 + 2;
      const touching = () => Math.abs(sp.x) >= 240 - half() || Math.abs(sp.y) >= 180 - half();
      const clamp = () => { const h = half(); sp.x = Math.max(-240 + h, Math.min(240 - h, sp.x)); sp.y = Math.max(-180 + h, Math.min(180 - h, sp.y)); };
      function* run(list) { for (const b of list) yield* step(b); }
      function* step(b) {
        const a = b.a;
        switch (b.t) {
          case 'wait': { const t0 = performance.now(), ms = num(a.n) * 1000; while (performance.now() - t0 < ms) yield; return; }
          case 'repeat': { const n = Math.min(10000, Math.max(0, Math.floor(num(a.n)))); for (let i = 0; i < n; i++) { yield* run(b.c); yield; } return; }
          case 'forever': for (;;) { yield* run(b.c); yield; }
          case 'if': if (cond(a.c)) yield* run(b.c); break;
          case 'move': { const r = (90 - sp.dir) * Math.PI / 180; sp.x += Math.cos(r) * num(a.n); sp.y += Math.sin(r) * num(a.n); clamp(); break; }
          case 'turnR': sp.dir = (sp.dir + num(a.n)) % 360; break;
          case 'turnL': sp.dir = (sp.dir - num(a.n) + 360) % 360; break;
          case 'goto': sp.x = num(a.x); sp.y = num(a.y); clamp(); break;
          case 'chx': sp.x += num(a.n); clamp(); break;
          case 'chy': sp.y += num(a.n); clamp(); break;
          case 'point': sp.dir = num(a.n); break;
          case 'grand': sp.x = (Math.random() * 2 - 1) * (240 - half()); sp.y = (Math.random() * 2 - 1) * (180 - half()); break;
          case 'bounce': { const h = half(); let hit = false; if (sp.x >= 240 - h || sp.x <= -240 + h) { sp.dir = (360 - sp.dir) % 360; hit = true; } if (sp.y >= 180 - h || sp.y <= -180 + h) { sp.dir = (180 - sp.dir + 360) % 360; hit = true; } if (hit) clamp(); break; }
          case 'say': { sp.say = String(a.t); const t0 = performance.now(), ms = num(a.s) * 1000; while (performance.now() - t0 < ms) yield; sp.say = ''; return; }
          case 'sayf': sp.say = String(a.t); break;
          case 'next': sp.ci = (sp.ci + 1) % SPR[spr].length; break;
          case 'size': sp.size = Math.max(5, Math.min(400, num(a.n))); break;
          case 'chsize': sp.size = Math.max(5, Math.min(400, sp.size + num(a.n))); break;
          case 'show': sp.show = true; break;
          case 'hide': sp.show = false; break;
          case 'setv': sp.vars[a.v] = num(a.n); break;
          case 'chv': sp.vars[a.v] = (sp.vars[a.v] || 0) + num(a.n); break;
          case 'sayv': sp.say = String(Math.round((sp.vars[a.v] || 0) * 100) / 100); break;
          case 'beep': GV.beep && GV.beep(Math.max(100, Math.min(2000, 440 * Math.pow(2, (num(a.n) - 69) / 12))), 120); break;
        }
        yield;
      }
      function runOne(L) { const body = DEF[L[0].t].hat ? L.slice(1) : L; threads.push({ it: run(body), L }); }
      function flag() { stopAll(); sp = S0(); scripts.forEach(L => { if (L[0] && L[0].t === 'flag') runOne(L); }); updBtn(); }
      function stopAll() { threads = []; sp.say = ''; }
      const updBtn = () => $(el, '.go').classList.toggle('running', threads.length > 0);
      function frame() {
        if (dead) return;
        const k = turbo ? 8 : 1; for (let n = 0; n < k; n++) threads = threads.filter(t => { try { return !t.it.next().done; } catch (er) { return false; } });
        draw(); raf = requestAnimationFrame(frame);
      }
      function draw() {
        const W = 480, H = 360, c1 = BGS[bg], gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1[0]); gr.addColorStop(1, c1[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1; for (let x = 0; x <= W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        if (sp.show) {
          g.save(); g.translate(240 + sp.x, 180 - sp.y); g.rotate((sp.dir - 90) * Math.PI / 180); const fs = 48 * sp.size / 100; g.font = fs + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(SPR[spr][sp.ci % SPR[spr].length], 0, 0); g.restore();
          if (sp.say) { g.font = '700 18px Roboto,sans-serif'; const w = Math.min(300, g.measureText(sp.say).width + 24), bx = Math.max(6, Math.min(W - w - 6, 240 + sp.x - w / 2)), by = Math.max(6, 180 - sp.y - 24 * sp.size / 100 - 46); g.fillStyle = '#fff'; g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(bx, by, w, 34, 14) : g.rect(bx, by, w, 34); g.fill(); g.stroke(); g.fillStyle = '#222'; g.textAlign = 'center'; g.fillText(sp.say.slice(0, 28), bx + w / 2, by + 18); }
        }
        g.fillStyle = 'rgba(0,0,0,.55)'; g.font = '700 14px Roboto,sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(`x: ${Math.round(sp.x)}  y: ${Math.round(sp.y)}  hướng: ${Math.round(sp.dir)}°`, 8, H - 8);
        const vs = Object.entries(sp.vars).filter(([, v]) => v); g.textAlign = 'right'; vs.forEach(([k, v], i) => g.fillText(`${k} = ${Math.round(v * 100) / 100}`, W - 8, 20 + i * 18));
        updBtn();
      }
      const kd = e => { const m = { ' ': 'space', ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' }, k = m[e.key] || e.key.toLowerCase(); if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (['space', 'right', 'left', 'up', 'down'].includes(k)) e.preventDefault(); if (keysDown[k]) return; keysDown[k] = true; scripts.forEach(L => { if (L[0] && L[0].t === 'key' && L[0].a.k === k && !threads.some(t => t.L === L)) runOne(L); }); };
      const ku = e => { const m = { ' ': 'space', ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' }; keysDown[m[e.key] || e.key.toLowerCase()] = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

      /* ---------- nút ---------- */
      const enc = () => btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, spr, bg, s: scripts }))));
      const dec = t => { const o = JSON.parse(decodeURIComponent(escape(atob(String(t).trim())))); if (!o || !Array.isArray(o.s)) throw new Error('bad'); const ok = l => l.every(b => DEF[b.t] && (!b.c || ok(b.c))); if (!o.s.every(ok)) throw new Error('bad'); return o; };
      const loadObj = o => { stopAll(); scripts = o.s.map(revive); if (SPR[o.spr]) { spr = o.spr; $(el, '.spr').value = spr; } if (BGS[o.bg]) { bg = o.bg; $(el, '.bgs').value = bg; } sp = S0(); renderWS(); };
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.cat) { tab = b.dataset.cat; renderPal(); return; }
        if (b.classList.contains('go')) flag(); else if (b.classList.contains('bstp')) stopAll();
        else if (b.classList.contains('btrb')) { turbo = !turbo; b.classList.toggle('on', turbo); b.style.outline = turbo ? '2px solid var(--md-primary,#D0BCFF)' : ''; }
        else if (b.classList.contains('clr')) { if (!scripts.length || confirm('Xoá toàn bộ chương trình?')) { stopAll(); scripts = []; renderWS(); } }
        else if (b.classList.contains('sv')) { const code = enc(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => $(el, '.exd').textContent = '📋 Đã sao chép mã dự án – gửi cho bạn bè để họ nhập.').catch(() => window.prompt('Sao chép mã dự án:', code)); }
        else if (b.classList.contains('ld')) { const t = window.prompt('Dán mã dự án:'); if (t) { try { loadObj(dec(t)); $(el, '.exd').textContent = 'Đã nhập dự án.'; } catch (er) { $(el, '.exd').textContent = '⚠️ Mã không hợp lệ.'; } } }
        else if (b.classList.contains('png')) cvs.toBlob(bl => { if (!bl) return; const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'san-khau.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      });
      $(el, '.ex').onchange = e => { const x = EX[e.target.value]; e.target.value = ''; if (!x) return; stopAll(); scripts = x.build(); spr = x.sp; $(el, '.spr').value = spr; sp = S0(); renderWS(); $(el, '.exd').textContent = '💡 ' + x.d + ' Bấm 🏴 Chạy (hoặc dùng phím với ví dụ phím).'; };
      $(el, '.spr').onchange = e => { spr = e.target.value; sp.ci = 0; persist(); }; $(el, '.bgs').onchange = e => { bg = e.target.value; persist(); };
      renderWS(); renderPal(); raf = requestAnimationFrame(frame);
      GV.bcT = { get sp() { return sp; }, get scripts() { return scripts; }, get threads() { return threads.length; }, load: k => { const x = EX[k]; stopAll(); scripts = x.build(); spr = x.sp; sp = S0(); renderWS(); }, enc, dec, flag };
      return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); if (drag && drag.ghost) drag.ghost.remove(); };
    }
  });
})();
