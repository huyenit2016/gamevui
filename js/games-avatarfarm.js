// Avatar Nông Trại: nhân vật tuỳ biến đi lại trong nông trại, trồng – tưới – thu hoạch, lên cấp, mua đồ thời trang, nhiệm vụ hằng ngày.
// Dữ liệu lưu trong localStorage (khoá gv_avfarm). Cây vẫn lớn khi thoát web vì tính theo mốc thời gian thật.
(function () {
  const $ = (el, s) => el.querySelector(s), esc = GV.esc;
  GV.townZones = GV.townZones || []; // các khu mở rộng (js/town.js đăng ký vào đây)
  const CROPS = [
    { id: 'carrot', e: '🥕', n: 'Cà rốt', lv: 1, cost: 4, gain: 9, sec: 15, xp: 2 },
    { id: 'rice', e: '🌾', n: 'Lúa', lv: 1, cost: 6, gain: 14, sec: 25, xp: 3 },
    { id: 'tomato', e: '🍅', n: 'Cà chua', lv: 2, cost: 10, gain: 26, sec: 45, xp: 5 },
    { id: 'corn', e: '🌽', n: 'Ngô', lv: 3, cost: 15, gain: 40, sec: 70, xp: 7 },
    { id: 'melon', e: '🍉', n: 'Dưa hấu', lv: 4, cost: 25, gain: 70, sec: 120, xp: 12 },
    { id: 'berry', e: '🍓', n: 'Dâu tây', lv: 5, cost: 35, gain: 100, sec: 180, xp: 16 },
    { id: 'pumpkin', e: '🎃', n: 'Bí ngô', lv: 6, cost: 50, gain: 150, sec: 300, xp: 22 },
    { id: 'sunflower', e: '🌻', n: 'Hướng dương', lv: 7, cost: 70, gain: 230, sec: 420, xp: 30 },
    // cây ăn quả: trồng 1 lần, thu hoạch nhiều lần
    { id: 'apple', e: '🍎', n: 'Cây táo', lv: 2, cost: 60, gain: 34, sec: 150, xp: 10, tree: true, yields: 6 },
    { id: 'orange', e: '🍊', n: 'Cây cam', lv: 4, cost: 120, gain: 70, sec: 240, xp: 16, tree: true, yields: 7 },
    { id: 'mango', e: '🥭', n: 'Cây xoài', lv: 6, cost: 220, gain: 130, sec: 360, xp: 26, tree: true, yields: 8 }
  ];
  const CAT = {
    skin: { n: 'Màu da', it: [{ id: 'skin0', v: '#FFE0BD' }, { id: 'skin1', v: '#F1C27D' }, { id: 'skin2', v: '#E0AC69' }, { id: 'skin3', v: '#C68642' }, { id: 'skin4', v: '#8D5524' }] },
    hair: { n: 'Kiểu tóc', it: [{ id: 'hair_short', n: 'Tóc ngắn' }, { id: 'hair_long', n: 'Tóc dài' }, { id: 'hair_bun', n: 'Búi tóc' }, { id: 'hair_spiky', n: 'Tóc nhọn', p: 40 }, { id: 'hair_bald', n: 'Đầu trọc' }] },
    hcol: { n: 'Màu tóc', it: [{ id: 'hc_black', v: '#2b2b2b' }, { id: 'hc_brown', v: '#6D4C41' }, { id: 'hc_blond', v: '#E6C35C', p: 30 }, { id: 'hc_red', v: '#C0392B', p: 30 }, { id: 'hc_pink', v: '#F06292', p: 60, lv: 3 }, { id: 'hc_blue', v: '#42A5F5', g: 2 }] },
    top: { n: 'Trang phục', it: [{ id: 'top_tee', n: 'Áo thun' }, { id: 'top_overall', n: 'Yếm nông dân', p: 60 }, { id: 'top_dress', n: 'Váy', p: 80, lv: 2 }] },
    tcol: { n: 'Màu áo', it: [{ id: 'tc_green', v: '#66BB6A' }, { id: 'tc_white', v: '#ECEFF1' }, { id: 'tc_red', v: '#EF5350', p: 20 }, { id: 'tc_yellow', v: '#FFCA28', p: 20 }, { id: 'tc_purple', v: '#AB47BC', p: 30 }, { id: 'tc_black', v: '#37474F', p: 30 }] },
    pants: { n: 'Quần', it: [{ id: 'pa_blue', v: '#3F51B5' }, { id: 'pa_brown', v: '#795548' }, { id: 'pa_black', v: '#263238', p: 20 }, { id: 'pa_khaki', v: '#BCAAA4', p: 20 }] },
    hat: { n: 'Mũ', it: [{ id: 'hat_none', n: 'Không', e: '' }, { id: 'hat_cap', n: 'Mũ lưỡi trai', e: '🧢', p: 50 }, { id: 'hat_straw', n: 'Nón rơm', e: '👒', p: 80, lv: 2 }, { id: 'hat_top', n: 'Mũ chóp', e: '🎩', p: 150, lv: 4 }, { id: 'hat_crown', n: 'Vương miện', e: '👑', g: 5 }] },
    acc: { n: 'Phụ kiện', it: [{ id: 'acc_none', n: 'Không', e: '' }, { id: 'acc_glass', n: 'Kính râm', e: '🕶️', p: 60 }, { id: 'acc_flower', n: 'Hoa cài tóc', e: '🌼', p: 40 }, { id: 'acc_scarf', n: 'Khăn quàng', e: '🧣', p: 70, lv: 3 }, { id: 'acc_bag', n: 'Ba lô', e: '🎒', p: 90, lv: 2 }] }
  };
  const SLOT = { skin: 'skin', hair: 'hair', hcol: 'hcol', top: 'top', tcol: 'tcol', pants: 'pants', hat: 'hat', acc: 'acc' };
  const find = id => { for (const k in CAT) { const x = CAT[k].it.find(i => i.id === id); if (x) return x; } return null; };
  const isFree = it => !it.p && !it.g;
  const need = l => 15 + l * l * 10, MAXLV = 30, COLS = 5, ROWS = 4, CS = 72, X0 = 30, Y0 = 62;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const UNLOCK = 1800; // 30 phút chơi để mở khoá cả làng
  const fresh = () => ({ v: 1, coins: 30, gems: 12, xp: 0, lv: 1, plots: 6, field: Array(COLS * ROWS).fill(null), owned: [], av: { skin: 'skin1', hair: 'hair_short', hcol: 'hc_brown', top: 'top_tee', tcol: 'tc_green', pants: 'pa_blue', hat: 'hat_none', acc: 'acc_none' }, day: '', streak: 0, last: '', q: null, tot: { h: 0, c: 0 } });
  // bổ sung trường mới cho dữ liệu cũ
  function migrate(S) { S.play = S.play || 0; S.unlocked = !!S.unlocked; S.inv = S.inv || {}; S.pens = S.pens || [null, null]; S.house = S.house || { lv: 0, items: [] }; S.biz = S.biz || { lv: [0, 0, 0, 0, 0], pool: 0, t: Date.now() }; S.nick = S.nick || 'Nông dân'; S.rw = S.rw || {}; S.liked = S.liked || {}; S.happy = S.happy || 0; return S; }
  GV.townLib = { CROPS, CAT, find, need, drawAvatar };

  // vẽ nhân vật (dùng cho cả nông trại lẫn khung xem trước)
  function drawAvatar(c, x, y, av, t, walking, s, dir) {
    if (GV.chibi) { const q = id => (find(av[id]) || {}).v; return GV.chibi.char(c, x, y, { skin: q('skin'), hair: av.hair, hcol: q('hcol'), top: av.top, tcol: q('tcol'), pants: q('pants'), hat: av.hat, acc: av.acc }, t, walking, s, dir == null ? 1 : dir); }
    const g = id => find(av[id]) || {}, skin = g('skin').v, hair = av.hair, hc = g('hcol').v, tc = g('tcol').v, pc = g('pants').v, top = av.top;
    const sw = walking ? Math.sin(t * 14) : 0, bob = walking ? Math.abs(Math.sin(t * 14)) * 2 : Math.sin(t * 2) * .6;
    c.save(); c.translate(x, y); c.scale(s * (dir < 0 ? -1 : 1), s);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, 16, 5, 0, 0, 7); c.fill();
    if (av.acc === 'acc_bag') { c.fillStyle = '#8D6E63'; c.fillRect(-18, -46 - bob, 9, 20); }
    if (hair === 'hair_long') { c.fillStyle = hc; c.beginPath(); c.roundRect ? c.roundRect(-14, -66 - bob, 28, 34, 10) : c.rect(-14, -66 - bob, 28, 34); c.fill(); }
    c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = pc; c.beginPath(); c.moveTo(-5, -22 - bob); c.lineTo(-5 + sw * 5, -3); c.moveTo(5, -22 - bob); c.lineTo(5 - sw * 5, -3); c.stroke();
    c.fillStyle = '#4E342E'; c.beginPath(); c.ellipse(-5 + sw * 5, -1, 5, 3, 0, 0, 7); c.ellipse(5 - sw * 5, -1, 5, 3, 0, 0, 7); c.fill();
    c.strokeStyle = skin; c.lineWidth = 5; c.beginPath(); c.moveTo(-12, -44 - bob); c.lineTo(-15 - sw * 4, -30 - bob); c.moveTo(12, -44 - bob); c.lineTo(15 + sw * 4, -30 - bob); c.stroke();
    c.fillStyle = tc; c.beginPath();
    if (top === 'top_dress') { c.moveTo(-10, -48 - bob); c.lineTo(10, -48 - bob); c.lineTo(17, -20 - bob); c.lineTo(-17, -20 - bob); } else { c.rect(-11, -48 - bob, 22, 28); }
    c.fill();
    if (top === 'top_overall') { c.fillStyle = pc; c.fillRect(-9, -36 - bob, 18, 16); c.fillRect(-9, -48 - bob, 4, 14); c.fillRect(5, -48 - bob, 4, 14); }
    if (av.acc === 'acc_scarf') { c.fillStyle = '#E53935'; c.fillRect(-10, -52 - bob, 20, 6); c.fillRect(4, -50 - bob, 5, 14); }
    c.fillStyle = skin; c.beginPath(); c.arc(0, -58 - bob, 12, 0, 7); c.fill();
    c.fillStyle = hc;
    if (hair === 'hair_short') { c.beginPath(); c.arc(0, -61 - bob, 12.5, Math.PI, 0); c.fill(); c.fillRect(-12.5, -61 - bob, 25, 4); }
    else if (hair === 'hair_long') { c.beginPath(); c.arc(0, -61 - bob, 12.5, Math.PI, 0); c.fill(); c.fillRect(-12.5, -61 - bob, 5, 20); c.fillRect(7.5, -61 - bob, 5, 20); }
    else if (hair === 'hair_bun') { c.beginPath(); c.arc(0, -61 - bob, 12.5, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, -75 - bob, 6, 0, 7); c.fill(); }
    else if (hair === 'hair_spiky') { c.beginPath(); c.moveTo(-12, -62 - bob); [-12, -6, 0, 6, 12].forEach((px, i) => { c.lineTo(px, -62 - bob); c.lineTo(px + 3, -76 - bob + (i % 2) * 4); }); c.lineTo(12.5, -62 - bob); c.closePath(); c.fill(); }
    c.fillStyle = '#212121'; c.beginPath(); c.arc(-4.5, -58 - bob, 1.6, 0, 7); c.arc(4.5, -58 - bob, 1.6, 0, 7); c.fill(); c.strokeStyle = '#8D3B3B'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -54 - bob, 4, .2, Math.PI - .2); c.stroke();
    c.font = '16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (av.acc === 'acc_glass') { c.font = '18px serif'; c.fillText('🕶️', 0, -58 - bob); }
    if (av.acc === 'acc_flower') { c.font = '12px serif'; c.fillText('🌼', 9, -68 - bob); }
    const hat = g('hat').e; if (hat) { c.font = '26px serif'; c.fillText(hat, 0, -72 - bob); }
    c.restore();
  }

  GV.register({
    id: 'avatarfarm', type: 'game', cat: 'Mô phỏng', name: 'Làng Nông Vui', icon: '👩‍🌾', desc: 'Chuyên trang nông trại: trồng rau, cây ăn quả, nuôi gà bò lợn. Chơi 30 phút mở khoá xây nhà, câu cá, đua xe, cờ tỷ phú, cày xu và đi thăm hàng xóm!',
    mount(el) {
      let S = migrate((() => { const d = GV.store.get('avfarm', null); return d && d.v === 1 ? d : fresh(); })()), zoneClean = null, T = null;
      const save = () => GV.store.set('avfarm', S); let tab = 'farm', sel = 'carrot', avx = X0 + CS * 2.5, avy = Y0 + CS * 4 + 4, tx = avx, ty = avy, pend = -1, fx = [], t = 0, dead = false, parts = [], DPR = 1, face = 1, mark = null, hov = -1, life = null, step = 0;
      el.innerHTML = `<style>.af .tb{display:flex;gap:6px;overflow-x:auto;max-width:100%;padding:2px;scrollbar-width:none}.af .tb::-webkit-scrollbar{display:none}.af .tb button{flex:0 0 auto;white-space:nowrap;padding:0 14px}.af .tb button.lk{opacity:.55}.af .tb button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-parts)}.af .crop{height:auto;min-height:66px;border-radius:14px;min-width:78px;display:flex;flex-direction:column;align-items:center;gap:0;padding:6px 8px;line-height:1.25}.af .crop small{color:var(--mut);font-size:11px}.af .crop.lock{opacity:.45}.af .xp{height:8px;border-radius:9px;background:var(--md-sc-lowest,#111);overflow:hidden;min-width:90px}.af .xp i{display:block;height:100%;background:var(--ok);transition:width .3s}.af .it{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:12px;border:1px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);font:inherit;font-size:13px;cursor:pointer;margin:3px;position:relative}.af .it.eq{border-color:var(--md-primary,#D0BCFF);background:var(--t-p)}.af .it .sw{width:18px;height:18px;border-radius:50%;border:1px solid #fff4}.af .it.lk{opacity:.5}.af .q{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;background:var(--md-sc-high,#2b292d);margin-bottom:6px;text-align:left}</style><div class="tool af" style="max-width:520px;align-items:center"><div class="hud"><span>🪙 <b class="co">0</b></span><span>💎 <b class="gm">0</b></span><span>Cấp <b class="lv">1</b></span><div class="xp"><i></i></div><span class="hint xt"></span></div><div class="tb"></div><div class="pane"></div><p class="msg"></p></div>`;
      const pane = $(el, '.pane'); let cv = null, c = null, pv = null, pc = null;
      const cur = () => Math.min(MAXLV, S.lv), prog = p => { const cr = CROPS.find(x => x.id === p.c); return Math.min(1, (Date.now() - p.t) / (cr.sec * 1000)); };
      const toast = (m, ty) => { if (GV.toast) GV.toast(m, { type: ty || 'info', ttl: 2800 }); else $(el, '.msg').textContent = m; };
      function hudUpdate() { $(el, '.co').textContent = S.coins; $(el, '.gm').textContent = S.gems; $(el, '.lv').textContent = S.lv; const n = need(S.lv); $(el, '.xp i').style.width = (S.lv >= MAXLV ? 100 : Math.min(100, S.xp / n * 100)) + '%'; $(el, '.xt').textContent = S.lv >= MAXLV ? 'MAX' : `${S.xp}/${n} XP`; el.querySelectorAll('.tb [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); }
      function addXp(n) { S.xp += n; while (S.lv < MAXLV && S.xp >= need(S.lv)) { S.xp -= need(S.lv); S.lv++; S.gems += 2; burst(avx, avy - 50, 28, ['#FFD54F', '#F48FB1', '#81D4FA', '#A5D6A7'], { v: 150, t: 1.3, up: 90, g: 120, sq: 1 }); toast(`🎉 Lên cấp ${S.lv}! +2 💎` + (CROPS.find(x => x.lv === S.lv) ? ` · Mở khoá ${CROPS.find(x => x.lv === S.lv).n}` : ''), 'success'); GV.beep(900, 150); } }
      function ensureDay() {
        const d = today(); if (S.day !== d) { const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); S.streak = S.day === ys ? Math.min(30, S.streak + 1) : 1; S.day = d; const b = 20 + 10 * Math.min(S.streak, 7); S.coins += b; setTimeout(() => !dead && toast(`📅 Điểm danh ngày ${S.streak}: +${b} 🪙`, 'success'), 400);
          S.q = { day: d, list: [{ id: 'harvest', n: 'Thu hoạch cây', need: 5 + Math.floor(S.lv / 2), have: 0, rew: { c: 40 } }, { id: 'plant', n: 'Gieo hạt', need: 6, have: 0, rew: { c: 25 } }, { id: 'earn', n: 'Kiếm xu từ thu hoạch', need: 100 + 25 * S.lv, have: 0, rew: { g: 1 } }] }; save(); }
      }
      const quest = (id, n) => { if (!S.q) return; const q = S.q.list.find(x => x.id === id); if (q && !q.done) q.have = Math.min(q.need, q.have + n); };
      function perform(i) {
        const p = S.field[i];
        if (!p) { const cr = CROPS.find(x => x.id === sel); if (cr.lv > S.lv) return toast(`Cần cấp ${cr.lv} để trồng ${cr.n}.`, 'warn'); if (S.coins < cr.cost) return toast('Không đủ xu mua hạt giống.', 'warn'); S.coins -= cr.cost; S.field[i] = { c: sel, t: Date.now(), w: 0 }; burst(slotPos(i).x, slotPos(i).y, 12, ['#8D6E63', '#6D4C41', '#A1887F'], { v: 60, t: .6 }); quest('plant', 1); text(i, '-' + cr.cost + '🪙', '#EF9A9A'); GV.beep(500, 40); }
        else if (prog(p) >= 1) { const cr = CROPS.find(x => x.id === p.c), gn = Math.round(cr.gain * T.bonus()); S.coins += gn; quest('harvest', 1); quest('earn', gn); S.tot.h++; S.tot.c += gn; if (cr.tree && (p.h = (p.h || 0) + 1) < cr.yields) { p.t = Date.now(); p.w = 0; } else S.field[i] = null; addXp(cr.xp); burst(slotPos(i).x, slotPos(i).y - 10, 16, ['#FFD54F', '#FFF176', '#FFB300', '#fff'], { v: 110, t: 1, up: 80, g: 220, sq: 1 }); text(i, '+' + gn + '🪙  +' + cr.xp + 'XP', '#A5D6A7'); GV.beep(800, 80); }
        else if (!p.w) { const cr = CROPS.find(x => x.id === p.c); p.w = 1; p.t -= cr.sec * 1000 * .2; addXp(1); burst(slotPos(i).x, slotPos(i).y - 24, 14, ['#4FC3F7', '#81D4FA', '#B3E5FC'], { v: 50, t: .7, up: -20, g: 260 }); text(i, '💧 -20% thời gian', '#81D4FA'); GV.beep(420, 40); }
        else toast('Cây đang lớn, đã tưới rồi. Chờ thêm chút nhé!');
        save(); hudUpdate();
      }
      const slotPos = i => ({ x: X0 + (i % COLS) * CS + CS / 2, y: Y0 + Math.floor(i / COLS) * CS + CS / 2 });
      const text = (i, s, col) => { const p = slotPos(i); fx.push({ x: p.x, y: p.y - 16, s, col, t: 1.1 }); };
      const burst = (x, y, n, cols, o) => { o = o || {}; for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (o.v || 70) * (.4 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 40), g: o.g == null ? 160 : o.g, t: (o.t || .8) * (.6 + Math.random() * .6), m: 0, r: (o.r || 3) * (.6 + Math.random() * .8), col: cols[k % cols.length], sq: o.sq }); } };
      function buyPlot() { const cost = 40 * (S.plots - 4); if (S.coins < cost) return toast(`Cần ${cost} 🪙 để mở thêm ô đất.`, 'warn'); S.coins -= cost; S.plots++; burst(slotPos(S.plots - 1).x, slotPos(S.plots - 1).y, 18, ['#fff', '#C5E1A5', '#FFF59D'], { v: 90, t: .9 }); save(); hudUpdate(); GV.beep(700, 80); toast('Đã mở thêm 1 ô đất!', 'success'); }
      /* ---- tab nông trại ---- */
      function drawFarm() {
        DPR = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1))); pane.innerHTML = `<canvas class="cv" width="${420 * DPR}" height="${(Y0 + CS * ROWS + 30) * DPR}" style="width:100%;max-width:440px"></canvas><div class="row cp" style="margin-top:8px"></div><p class="hint">Chọn hạt giống ở dưới, chạm một ô đất để nhân vật chạy tới. Ô trống: gieo · cây đang lớn: tưới (rút 20% thời gian) · cây chín: thu hoạch.</p>`;
        cv = $(pane, 'canvas'); c = cv.getContext('2d'); cropBar();
        cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 420 / r.width, y = (e.clientY - r.top) * (cv.height / DPR) / r.height, col = Math.floor((x - X0) / CS), row = Math.floor((y - Y0) / CS);
          if (col >= 0 && col < COLS && row >= 0 && row < ROWS) { const i = row * COLS + col; if (i === S.plots) { buyPlot(); return; } if (i > S.plots) return toast('Hãy mở khoá các ô đất phía trước trước nhé.'); const p = slotPos(i); tx = p.x; ty = p.y + 30; pend = i; mark = { x: p.x, y: p.y, t: 0 }; } else { tx = Math.max(24, Math.min(396, x)); ty = Math.max(Y0 - 10, Math.min(Y0 + CS * ROWS + 8, y)); pend = -1; mark = { x: tx, y: ty, t: 0 }; } });
        cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 420 / r.width, y = (e.clientY - r.top) * (cv.height / DPR) / r.height, col = Math.floor((x - X0) / CS), row = Math.floor((y - Y0) / CS); hov = col >= 0 && col < COLS && row >= 0 && row < ROWS ? row * COLS + col : -1; });
        cv.addEventListener('pointerleave', () => { hov = -1; });
      }
      function cropBar() { const b = $(pane, '.cp'); if (!b) return; b.innerHTML = CROPS.map(cr => `<button class="btn ghost crop${cr.lv > S.lv ? ' lock' : ''}" data-c="${cr.id}" style="${sel === cr.id ? 'outline:2px solid var(--md-primary,#D0BCFF)' : ''}"><span style="font-size:22px">${cr.lv > S.lv ? '🔒' : cr.e}</span><b style="font-size:12px">${cr.n}</b><small>${cr.lv > S.lv ? 'Cấp ' + cr.lv : cr.cost + '→' + cr.gain + ' · ' + (cr.sec >= 60 ? Math.round(cr.sec / 60) + 'p' : cr.sec + 's')}</small></button>`).join(''); b.onclick = e => { const x = e.target.closest('[data-c]'); if (!x) return; const cr = CROPS.find(k => k.id === x.dataset.c); if (cr.lv > S.lv) return toast(`Đạt cấp ${cr.lv} để mở khoá ${cr.n}.`, 'warn'); sel = cr.id; cropBar(); }; }
      function render(dt) {
        t += dt; if (tab !== 'farm' || !c) return;
        const dx = tx - avx, dy = ty - avy, d = Math.hypot(dx, dy), walking = d > 3;
        if (walking) { const s = Math.min(d, 190 * dt); avx += dx / d * s; avy += dy / d * s; if (Math.abs(dx) > 2) face = dx < 0 ? -1 : 1; step -= dt; if (step <= 0) { step = .12; burst(avx - face * 6, avy, 2, ['#D7CCC8', '#BCAAA4'], { v: 22, t: .5, up: 14, g: -10, r: 2.4 }); } } else if (pend >= 0) { const i = pend; pend = -1; perform(i); }
        if (!life) life = { birds: [{ x: -30, y: 18, v: 38 }, { x: -200, y: 38, v: 30 }], bf: [0, 1, 2].map(k => ({ x: 80 + k * 120, y: 140 + k * 60, p: k * 2 })), hens: [{ x: 120, y: Y0 + CS * ROWS + 12, dx: 1, w: 0 }, { x: 300, y: Y0 + CS * ROWS + 16, dx: -1, w: 0 }] };
        c.setTransform(DPR, 0, 0, DPR, 0, 0); const W = 420, H = cv.height / DPR, hr = new Date().getHours() + new Date().getMinutes() / 60;
        const day = Math.max(0, Math.min(1, (Math.cos((hr - 13) / 24 * 6.283) + .35) / 1.2)); // 1 = giữa ngày, 0 = đêm
        const g = c.createLinearGradient(0, 0, 0, H); const sk1 = hr >= 5 && hr < 7 || hr >= 17 && hr < 19 ? ['#FFB38A', '#FFE0B2'] : day > .45 ? ['#6EC6FF', '#B3E5FC'] : ['#1A237E', '#3949AB'];
        g.addColorStop(0, sk1[0]); g.addColorStop(.17, sk1[1]); g.addColorStop(.18, '#7CB342'); g.addColorStop(1, '#558B2F'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        if (day < .45) { c.fillStyle = '#fff'; for (let k = 0; k < 14; k++) { c.globalAlpha = .4 + .5 * Math.abs(Math.sin(t * 2 + k)); c.fillRect((k * 53) % 420, (k * 29) % 56, 1.6, 1.6); } c.globalAlpha = 1; c.font = '22px serif'; c.fillText('🌙', 340, 22); } else { c.font = '24px serif'; c.save(); c.translate(36, 20); c.rotate(t * .15); c.fillText('☀️', 0, 0); c.restore(); }
        c.font = '30px serif'; c.globalAlpha = day < .45 ? .55 : 1; c.fillText('☁️', 70 + Math.sin(t * .2) * 12 + (t * 3 % 460) * 0, 22); c.fillText('☁️', ((t * 5 + 250) % 520) - 50, 30); c.globalAlpha = 1;
        // cỏ lay động nền
        c.strokeStyle = 'rgba(46,92,20,.55)'; c.lineWidth = 1.6; for (let k = 0; k < 26; k++) { const gx = (k * 71) % 410 + 5, gy = 80 + (k * 37) % (H - 90); if (gx > X0 - 2 && gx < X0 + COLS * CS + 2 && gy > Y0 - 2 && gy < Y0 + ROWS * CS) continue; const sw = Math.sin(t * 2 + k) * 2.5; c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + sw, gy - 5, gx + sw * 1.6, gy - 9); c.moveTo(gx + 3, gy); c.quadraticCurveTo(gx + 3 + sw, gy - 4, gx + 3 + sw * 1.4, gy - 7); c.stroke(); }
        GV.chibi.house(c, 374, 70, .95, day < .45); GV.chibi.bigTree(c, 36, 72, .68, Math.sin(t * 1.3) * .03); GV.chibi.fence(c, 70, 66, 240);
        // khói ống khói
        for (let k = 0; k < 3; k++) { const ph = (t * .5 + k / 3) % 1; c.globalAlpha = (1 - ph) * .45; c.fillStyle = day < .45 ? '#ddd' : '#fff'; c.beginPath(); c.arc(386 + ph * 10 + Math.sin(ph * 6 + k) * 3, 34 - ph * 26, 3 + ph * 5, 0, 7); c.fill(); } c.globalAlpha = 1;
        // chim bay
        life.birds.forEach(b => { b.x += b.v * dt; if (b.x > 450) { b.x = -40 - Math.random() * 160; b.y = 12 + Math.random() * 40; } const fl = Math.sin(t * 12 + b.y); c.strokeStyle = day < .45 ? '#CFD8DC' : '#37474F'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(b.x - 6, b.y - fl * 3); c.quadraticCurveTo(b.x - 3, b.y - 4 + fl * 2, b.x, b.y); c.quadraticCurveTo(b.x + 3, b.y - 4 + fl * 2, b.x + 6, b.y - fl * 3); c.stroke(); });
        const ripeAny = [];
        for (let i = 0; i < COLS * ROWS; i++) {
          const p = slotPos(i), x = p.x - 31, y = p.y - 29, st = S.field[i];
          if (i >= S.plots) { GV.chibi.locked(c, x, y, 62, 58); c.font = '20px serif'; c.fillStyle = '#fff'; c.fillText(i === S.plots ? '🔓' : '🔒', p.x, p.y - 6 + (i === S.plots ? Math.sin(t * 3) * 2 : 0)); if (i === S.plots) { c.font = 'bold 12px Roboto,sans-serif'; c.fillText(40 * (S.plots - 4) + '🪙', p.x, p.y + 14); } continue; }
          GV.chibi.soil(c, x, y, 62, 58, st && st.w, hov === i, t);
          if (st) {
            const pr = prog(st), cr = CROPS.find(k => k.id === st.c); c.textAlign = 'center'; c.textBaseline = 'middle';
            const stg = pr >= 1 ? 3 : pr > .5 ? 2 : pr > .12 ? 1 : 0;
            GV.chibi.crop(c, cr.id, stg, p.x, p.y + 16, t, Math.sin(t * 2.2 + i * 1.7) * (stg >= 3 ? .05 : .08), 1);
            if (pr >= 1) { ripeAny.push(i); c.font = '14px serif'; c.fillStyle = '#000'; c.fillText('✨', p.x + 22, p.y - 22 + Math.sin(t * 4 + i) * 2); { const gr = c.createRadialGradient(p.x, p.y - 6, 2, p.x, p.y - 6, 30); gr.addColorStop(0, 'rgba(255,240,130,' + (.35 + .15 * Math.sin(t * 4 + i)).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,240,130,0)'); c.fillStyle = gr; c.fillRect(p.x - 32, p.y - 40, 64, 64); } if (Math.random() < dt * 1.2) burst(p.x + (Math.random() - .5) * 30, p.y - 10, 1, ['#FFF59D', '#fff'], { v: 12, t: .9, up: 20, g: -20, r: 2 }); }
            else { c.fillStyle = '#0006'; c.beginPath(); c.roundRect ? c.roundRect(x + 6, y + 47, 50, 6, 3) : c.rect(x + 6, y + 47, 50, 6); c.fill(); c.fillStyle = st.w ? '#4FC3F7' : '#9CCC65'; c.beginPath(); c.roundRect ? c.roundRect(x + 6, y + 47, Math.max(6, 50 * pr), 6, 3) : c.rect(x + 6, y + 47, 50 * pr, 6); c.fill(); }
            if (st.w && pr < 1) { c.font = '12px serif'; c.fillText('💧', x + 8, y + 10 + Math.sin(t * 3 + i) * 1.5); }
          }
        }
        // bướm
        life.bf.forEach(b => { b.p += dt; const bx = b.x + Math.sin(b.p * .9) * 70 + Math.sin(b.p * 2.3) * 14, by = b.y + Math.cos(b.p * .7) * 30, w = Math.abs(Math.sin(t * 18 + b.p)); c.save(); c.translate(bx, by); c.scale(.3 + w * .7, 1); c.font = '14px serif'; c.fillText(b.p % 3 < 1.5 ? '🦋' : '🐝', 0, 0); c.restore(); });
        // gà đi lang thang
        life.hens.forEach(h => { h.w -= dt; if (h.w <= 0) { h.w = 1.5 + Math.random() * 3; h.dx = [-1, 0, 1][GV.rnd(3)]; } h.x = Math.max(30, Math.min(390, h.x + h.dx * 22 * dt)); c.save(); c.translate(h.x, h.y + (h.dx ? Math.abs(Math.sin(t * 10)) * -2 : 0)); if (h.dx > 0) c.scale(-1, 1); c.font = '20px serif'; c.fillText('🐔', 0, 0); c.restore(); });
        // vòng đánh dấu chạm
        if (mark) { mark.t += dt; if (mark.t > .7) mark = null; else { c.strokeStyle = 'rgba(255,255,255,' + (1 - mark.t / .7) + ')'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(mark.x, mark.y + 28, 8 + mark.t * 34, 3 + mark.t * 12, 0, 0, 7); c.stroke(); } }
        // hạt
        parts.forEach(q => { q.t -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }); parts = parts.filter(q => q.t > 0); if (parts.length > 220) parts.splice(0, parts.length - 220);
        parts.forEach(q => { c.globalAlpha = Math.min(1, q.t * 2.5); c.fillStyle = q.col; if (q.sq) { c.save(); c.translate(q.x, q.y); c.rotate(q.t * 8); c.fillRect(-q.r, -q.r, q.r * 2, q.r * 2); c.restore(); } else { c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); } }); c.globalAlpha = 1;
        drawAvatar(c, avx, avy, S.av, t, walking, 1, face);
        // bong bóng gợi ý khi rảnh
        if (!walking && pend < 0 && ripeAny.length && Math.sin(t * 1.4) > -.2) { const bx = Math.max(52, Math.min(368, avx)), by = avy - 96 + Math.sin(t * 3) * 2; c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(bx - 30, by - 14, 60, 24, 10) : c.rect(bx - 30, by - 14, 60, 24); c.fill(); c.beginPath(); c.moveTo(bx - 4, by + 9); c.lineTo(bx, by + 16); c.lineTo(bx + 4, by + 9); c.fill(); c.fillStyle = '#333'; c.font = 'bold 11px Roboto,sans-serif'; c.fillText('Chín rồi! ' + ripeAny.length, bx, by - 2); }
        fx.forEach(f => { f.t -= dt; f.y -= 22 * dt; }); fx = fx.filter(f => f.t > 0); c.font = 'bold 13px Roboto,sans-serif'; fx.forEach(f => { c.globalAlpha = Math.min(1, f.t * 2); c.fillStyle = '#000'; c.fillText(f.s, f.x + 1, f.y + 1); c.fillStyle = f.col; c.fillText(f.s, f.x, f.y); }); c.globalAlpha = 1;
        // phủ màu ngày/đêm
        if (day < .6) { c.fillStyle = 'rgba(10,20,70,' + ((.6 - day) * .75).toFixed(2) + ')'; c.fillRect(0, 0, W, H); }
        else if (hr >= 17 && hr < 19) { c.fillStyle = 'rgba(255,120,40,.12)'; c.fillRect(0, 0, W, H); }
      }
      /* ---- tab nhân vật ---- */
      function drawAvatarTab() {
        pane.innerHTML = `<div class="row" style="align-items:flex-start;gap:14px"><canvas class="cv" width="150" height="210" style="width:150px;background:radial-gradient(circle at 50% 30%,var(--t-p),transparent 70%),var(--md-sc-high,#2b292d)"></canvas><div class="col" style="flex:1;min-width:220px;max-width:none"><label>Tên hiển thị (hàng xóm sẽ thấy)<input class="nk" maxlength="20" value="${esc(S.nick)}" style="width:100%"></label><button class="btn ghost rnd">🎲 Phối ngẫu nhiên (đồ đã có)</button></div></div><div class="opts" style="text-align:left;margin-top:8px"></div><p class="hint">Chạm món đã có để mặc · món có giá để mua (🪙 xu, 💎 kim cương) · 🔒 cần đạt cấp.</p>`;
        pv = $(pane, 'canvas'); pc = pv.getContext('2d'); opts();
        $(pane, '.nk').oninput = e => { S.nick = e.target.value.trim().slice(0, 20) || 'Nông dân'; save(); };
        $(pane, '.rnd').onclick = () => { Object.keys(CAT).forEach(k => { const own = CAT[k].it.filter(i => isFree(i) || S.owned.includes(i.id)); S.av[SLOT[k]] = own[GV.rnd(own.length)].id; }); save(); opts(); };
      }
      function opts() {
        $(pane, '.opts').innerHTML = Object.entries(CAT).map(([k, grp]) => `<div style="margin:6px 0"><b style="font-size:13px;color:var(--mut)">${grp.n}</b><div>${grp.it.map(it => { const own = isFree(it) || S.owned.includes(it.id), eq = S.av[SLOT[k]] === it.id, lock = it.lv && it.lv > S.lv && !own; return `<button class="it${eq ? ' eq' : ''}${lock ? ' lk' : ''}" data-i="${it.id}" data-k="${k}">${it.v ? `<span class="sw" style="background:${it.v}"></span>` : ''}${it.e ? `<span>${it.e}</span>` : ''}${it.n ? `<span>${it.n}</span>` : ''}${own ? (eq ? '✓' : '') : lock ? `<small>🔒 C${it.lv}</small>` : `<small>${it.p ? it.p + '🪙' : it.g + '💎'}</small>`}</button>`; }).join('')}</div></div>`).join('');
      }
      function onItem(e) {
        const b = e.target.closest('[data-i]'); if (!b) return; const it = find(b.dataset.i), k = b.dataset.k; if (!it) return; const own = isFree(it) || S.owned.includes(it.id);
        if (!own) { if (it.lv && it.lv > S.lv) return toast(`Cần đạt cấp ${it.lv} để mua.`, 'warn'); if (it.p) { if (S.coins < it.p) return toast('Không đủ xu.', 'warn'); S.coins -= it.p; } else { if (S.gems < it.g) return toast('Không đủ kim cương.', 'warn'); S.gems -= it.g; } S.owned.push(it.id); toast('Đã mua ' + (it.n || 'món đồ') + '!', 'success'); GV.beep(800, 80); }
        S.av[SLOT[k]] = it.id; save(); hudUpdate(); opts();
      }
      /* ---- tab nhiệm vụ ---- */
      function drawQuests() {
        ensureDay(); const q = S.q;
        pane.innerHTML = `<div class="hint">🔥 Chuỗi điểm danh: <b>${S.streak}</b> ngày · Đã thu hoạch <b>${S.tot.h}</b> lần · Tổng xu kiếm được <b>${S.tot.c}</b></div><div style="margin-top:8px">${q.list.map((x, i) => `<div class="q"><span><b>${x.n}</b> ${x.have}/${x.need}<br><small style="color:var(--mut)">Thưởng: ${x.rew.c ? x.rew.c + ' 🪙' : ''}${x.rew.g ? x.rew.g + ' 💎' : ''}</small></span>${x.done ? '<span class="tag ok">Đã nhận ✓</span>' : `<button class="btn ${x.have >= x.need ? '' : 'ghost'}" data-q="${i}" ${x.have >= x.need ? '' : 'disabled'}>Nhận</button>`}</div>`).join('')}</div><p class="hint">Nhiệm vụ làm mới mỗi ngày.</p>`;
        pane.onclick = e => { const b = e.target.closest('[data-q]'); if (!b) return; const x = S.q.list[+b.dataset.q]; if (!x || x.done || x.have < x.need) return; x.done = true; S.coins += x.rew.c || 0; S.gems += x.rew.g || 0; save(); hudUpdate(); GV.beep(900, 100); drawQuests(); };
      }
      /* ---- khung tab + các khu mở rộng (js/town.js) ---- */
      const ZN = () => GV.townZones || [];
      const tabsDef = () => { const z = id => ZN().find(x => x.id === id); const base = [['farm', '🌾 Nông trại'], ['barn'], ['avatar', '👕 Nhân vật'], ['quest', '🎯 Nhiệm vụ']]; const out = base.map(([id, n]) => id === 'barn' ? (z('barn') ? { id, n: z('barn').ico + ' ' + z('barn').n } : null) : { id, n }).filter(Boolean); ZN().filter(x => x.lock).forEach(x => out.push({ id: x.id, n: x.ico + ' ' + x.n, lk: !S.unlocked })); return out; };
      function buildTabs() { el.querySelector('.tb').innerHTML = tabsDef().map(x => `<button class="btn ghost${x.lk ? ' lk' : ''}" data-t="${x.id}">${x.lk ? '🔒 ' : ''}${x.n}</button>`).join(''); hudUpdate(); }
      function lockedPanel() {
        const left = Math.max(0, UNLOCK - S.play), m = Math.ceil(left / 60);
        pane.innerHTML = `<div class="res" style="text-align:center;line-height:1.7"><div style="font-size:2.4rem">🔒</div><b>Khu này sẽ mở sau khi bạn chơi đủ 30 phút</b><br><span class="hint">Còn khoảng <b>${m}</b> phút · Mở khoá: ${ZN().filter(x => x.lock).map(x => x.ico + ' ' + x.n).join(' · ')}</span><div class="xp" style="margin:10px auto;max-width:260px"><i style="width:${Math.min(100, S.play / UNLOCK * 100)}%"></i></div><button class="btn ghost ue">⚡ Mở sớm (10 💎)</button></div>`;
        $(pane, '.ue').onclick = () => { if (S.gems < 10) return toast('Chưa đủ 10 💎. Lên cấp hoặc làm nhiệm vụ để nhận thêm.', 'warn'); S.gems -= 10; S.play = UNLOCK; unlockNow(); show(tab); };
      }
      function unlockNow() { if (S.unlocked) return; S.unlocked = true; save(); buildTabs(); toast('🎉 Làng đã mở rộng! Xây nhà, câu cá, đua xe, cờ tỷ phú, cày xu và đi thăm hàng xóm đang chờ bạn.', 'success'); GV.beep(900, 200); }
      function show(tb) {
        if (typeof zoneClean === 'function') { try { zoneClean(); } catch (e) {} } zoneClean = null; tab = tb; pane.onclick = null; hudUpdate();
        if (tb === 'farm') drawFarm(); else if (tb === 'avatar') { drawAvatarTab(); pane.onclick = onItem; } else if (tb === 'quest') drawQuests();
        else { const z = ZN().find(x => x.id === tb); if (!z) return drawFarm(); if (z.lock && !S.unlocked) return lockedPanel(); pane.innerHTML = ''; zoneClean = z.mount(pane, T) || null; }
      }
      T = { get S() { return S; }, save, toast, hud: hudUpdate, addXp, CROPS, bonus: () => 1 + Math.min(.25, (S.happy || 0) / 400), drawAvatar: (c2, x, y, tt, w, sc) => drawAvatar(c2, x, y, S.av, tt, w, sc), show, esc,
        give(coins, gems, label) { S.coins += coins || 0; S.gems += gems || 0; save(); hudUpdate(); if (label) toast(label, 'success'); },
        spend(coins, gems) { if (S.coins < (coins || 0) || S.gems < (gems || 0)) return false; S.coins -= coins || 0; S.gems -= gems || 0; save(); hudUpdate(); return true; } };
      GV.townT = T; // tay cầm gỡ lỗi/kiểm thử
      el.querySelector('.tb').onclick = e => { const b = e.target.closest('[data-t]'); if (b) show(b.dataset.t); };
      ensureDay(); save(); buildTabs(); show('farm');
      let last = performance.now(), raf = 0; const lp = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; render(dt); if (tab === 'avatar' && pc) { pc.clearRect(0, 0, 150, 210); drawAvatar(pc, 75, 190, S.av, t += 0, false, 2.1); } raf = requestAnimationFrame(lp); }; raf = requestAnimationFrame(lp);
      const tick = setInterval(hudUpdate, 4000);
      // chia sẻ làng cho hàng xóm (chỉ khi người chơi bật)
      const pub = setInterval(() => { try { GV.townPublish && GV.townPublish(T); } catch (e) {} }, 60000);
      // đếm thời gian chơi thật (chỉ khi tab đang mở) để mở khoá làng sau 30 phút
      let ps = 0; const pt = setInterval(() => { if (document.hidden) return; S.play++; ps++; if (!S.unlocked && S.play >= UNLOCK) unlockNow(); if (ps % 10 === 0) save(); if (!S.unlocked && tab !== 'farm' && ZN().some(x => x.id === tab && x.lock) && ps % 30 === 0) show(tab); }, 1000);
      return () => { dead = true; cancelAnimationFrame(raf); clearInterval(tick); clearInterval(pt); clearInterval(pub); if (typeof zoneClean === 'function') { try { zoneClean(); } catch (e) {} } save(); };
    }
  });
})();
