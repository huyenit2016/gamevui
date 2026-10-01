// Avatar Nông Trại: nhân vật tuỳ biến đi lại trong nông trại, trồng – tưới – thu hoạch, lên cấp, mua đồ thời trang, nhiệm vụ hằng ngày.
// Dữ liệu lưu trong localStorage (khoá gv_avfarm). Cây vẫn lớn khi thoát web vì tính theo mốc thời gian thật.
(function () {
  const $ = (el, s) => el.querySelector(s), esc = GV.esc;
  const CROPS = [
    { id: 'carrot', e: '🥕', n: 'Cà rốt', lv: 1, cost: 4, gain: 9, sec: 15, xp: 2 },
    { id: 'rice', e: '🌾', n: 'Lúa', lv: 1, cost: 6, gain: 14, sec: 25, xp: 3 },
    { id: 'tomato', e: '🍅', n: 'Cà chua', lv: 2, cost: 10, gain: 26, sec: 45, xp: 5 },
    { id: 'corn', e: '🌽', n: 'Ngô', lv: 3, cost: 15, gain: 40, sec: 70, xp: 7 },
    { id: 'melon', e: '🍉', n: 'Dưa hấu', lv: 4, cost: 25, gain: 70, sec: 120, xp: 12 },
    { id: 'berry', e: '🍓', n: 'Dâu tây', lv: 5, cost: 35, gain: 100, sec: 180, xp: 16 },
    { id: 'pumpkin', e: '🎃', n: 'Bí ngô', lv: 6, cost: 50, gain: 150, sec: 300, xp: 22 },
    { id: 'sunflower', e: '🌻', n: 'Hướng dương', lv: 7, cost: 70, gain: 230, sec: 420, xp: 30 }
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
  const fresh = () => ({ v: 1, coins: 30, gems: 0, xp: 0, lv: 1, plots: 6, field: Array(COLS * ROWS).fill(null), owned: [], av: { skin: 'skin1', hair: 'hair_short', hcol: 'hc_brown', top: 'top_tee', tcol: 'tc_green', pants: 'pa_blue', hat: 'hat_none', acc: 'acc_none' }, day: '', streak: 0, last: '', q: null, tot: { h: 0, c: 0 } });

  // vẽ nhân vật (dùng cho cả nông trại lẫn khung xem trước)
  function drawAvatar(c, x, y, av, t, walking, s) {
    const g = id => find(av[id]) || {}, skin = g('skin').v, hair = av.hair, hc = g('hcol').v, tc = g('tcol').v, pc = g('pants').v, top = av.top;
    const sw = walking ? Math.sin(t * 14) : 0, bob = walking ? Math.abs(Math.sin(t * 14)) * 2 : Math.sin(t * 2) * .6;
    c.save(); c.translate(x, y); c.scale(s, s);
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
    id: 'avatarfarm', type: 'game', cat: 'Mô phỏng', name: 'Avatar nông trại', icon: '👩‍🌾', desc: 'Tạo nhân vật của bạn, chạm đất để nhân vật chạy tới trồng – tưới – thu hoạch. Lên cấp, mở cây mới, mua đồ thời trang và làm nhiệm vụ mỗi ngày!',
    mount(el) {
      let S = (() => { const d = GV.store.get('avfarm', null); return d && d.v === 1 ? d : fresh(); })();
      const save = () => GV.store.set('avfarm', S); let tab = 'farm', sel = 'carrot', avx = X0 + CS * 2.5, avy = Y0 + CS * 4 + 4, tx = avx, ty = avy, pend = -1, fx = [], t = 0, dead = false;
      el.innerHTML = `<style>.af .tb{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.af .tb button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}.af .crop{height:auto;min-height:66px;border-radius:14px;min-width:78px;display:flex;flex-direction:column;align-items:center;gap:0;padding:6px 8px;line-height:1.25}.af .crop small{color:var(--mut);font-size:11px}.af .crop.lock{opacity:.45}.af .xp{height:8px;border-radius:9px;background:var(--md-sc-lowest,#111);overflow:hidden;min-width:90px}.af .xp i{display:block;height:100%;background:var(--ok);transition:width .3s}.af .it{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:12px;border:1px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);font:inherit;font-size:13px;cursor:pointer;margin:3px;position:relative}.af .it.eq{border-color:var(--md-primary,#D0BCFF);background:var(--t-p)}.af .it .sw{width:18px;height:18px;border-radius:50%;border:1px solid #fff4}.af .it.lk{opacity:.5}.af .q{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;background:var(--md-sc-high,#2b292d);margin-bottom:6px;text-align:left}</style><div class="tool af" style="max-width:480px;align-items:center"><div class="hud"><span>🪙 <b class="co">0</b></span><span>💎 <b class="gm">0</b></span><span>Cấp <b class="lv">1</b></span><div class="xp"><i></i></div><span class="hint xt"></span></div><div class="tb"><button class="btn ghost" data-t="farm">🌾 Nông trại</button><button class="btn ghost" data-t="avatar">👕 Nhân vật</button><button class="btn ghost" data-t="quest">🎯 Nhiệm vụ</button></div><div class="pane"></div><p class="msg"></p></div>`;
      const pane = $(el, '.pane'); let cv = null, c = null, pv = null, pc = null;
      const cur = () => Math.min(MAXLV, S.lv), prog = p => { const cr = CROPS.find(x => x.id === p.c); return Math.min(1, (Date.now() - p.t) / (cr.sec * 1000)); };
      const toast = (m, ty) => { if (GV.toast) GV.toast(m, { type: ty || 'info', ttl: 2800 }); else $(el, '.msg').textContent = m; };
      function hudUpdate() { $(el, '.co').textContent = S.coins; $(el, '.gm').textContent = S.gems; $(el, '.lv').textContent = S.lv; const n = need(S.lv); $(el, '.xp i').style.width = (S.lv >= MAXLV ? 100 : Math.min(100, S.xp / n * 100)) + '%'; $(el, '.xt').textContent = S.lv >= MAXLV ? 'MAX' : `${S.xp}/${n} XP`; el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); }
      function addXp(n) { S.xp += n; while (S.lv < MAXLV && S.xp >= need(S.lv)) { S.xp -= need(S.lv); S.lv++; S.gems += 2; toast(`🎉 Lên cấp ${S.lv}! +2 💎` + (CROPS.find(x => x.lv === S.lv) ? ` · Mở khoá ${CROPS.find(x => x.lv === S.lv).n}` : ''), 'success'); GV.beep(900, 150); } }
      function ensureDay() {
        const d = today(); if (S.day !== d) { const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); S.streak = S.day === ys ? Math.min(30, S.streak + 1) : 1; S.day = d; const b = 20 + 10 * Math.min(S.streak, 7); S.coins += b; setTimeout(() => !dead && toast(`📅 Điểm danh ngày ${S.streak}: +${b} 🪙`, 'success'), 400);
          S.q = { day: d, list: [{ id: 'harvest', n: 'Thu hoạch cây', need: 5 + Math.floor(S.lv / 2), have: 0, rew: { c: 40 } }, { id: 'plant', n: 'Gieo hạt', need: 6, have: 0, rew: { c: 25 } }, { id: 'earn', n: 'Kiếm xu từ thu hoạch', need: 100 + 25 * S.lv, have: 0, rew: { g: 1 } }] }; save(); }
      }
      const quest = (id, n) => { if (!S.q) return; const q = S.q.list.find(x => x.id === id); if (q && !q.done) q.have = Math.min(q.need, q.have + n); };
      function perform(i) {
        const p = S.field[i];
        if (!p) { const cr = CROPS.find(x => x.id === sel); if (cr.lv > S.lv) return toast(`Cần cấp ${cr.lv} để trồng ${cr.n}.`, 'warn'); if (S.coins < cr.cost) return toast('Không đủ xu mua hạt giống.', 'warn'); S.coins -= cr.cost; S.field[i] = { c: sel, t: Date.now(), w: 0 }; quest('plant', 1); text(i, '-' + cr.cost + '🪙', '#EF9A9A'); GV.beep(500, 40); }
        else if (prog(p) >= 1) { const cr = CROPS.find(x => x.id === p.c); S.coins += cr.gain; quest('harvest', 1); quest('earn', cr.gain); S.tot.h++; S.tot.c += cr.gain; S.field[i] = null; addXp(cr.xp); text(i, '+' + cr.gain + '🪙  +' + cr.xp + 'XP', '#A5D6A7'); GV.beep(800, 80); }
        else if (!p.w) { const cr = CROPS.find(x => x.id === p.c); p.w = 1; p.t -= cr.sec * 1000 * .2; addXp(1); text(i, '💧 -20% thời gian', '#81D4FA'); GV.beep(420, 40); }
        else toast('Cây đang lớn, đã tưới rồi. Chờ thêm chút nhé!');
        save(); hudUpdate();
      }
      const slotPos = i => ({ x: X0 + (i % COLS) * CS + CS / 2, y: Y0 + Math.floor(i / COLS) * CS + CS / 2 });
      const text = (i, s, col) => { const p = slotPos(i); fx.push({ x: p.x, y: p.y - 16, s, col, t: 1.1 }); };
      function buyPlot() { const cost = 40 * (S.plots - 4); if (S.coins < cost) return toast(`Cần ${cost} 🪙 để mở thêm ô đất.`, 'warn'); S.coins -= cost; S.plots++; save(); hudUpdate(); GV.beep(700, 80); toast('Đã mở thêm 1 ô đất!', 'success'); }
      /* ---- tab nông trại ---- */
      function drawFarm() {
        pane.innerHTML = `<canvas class="cv" width="420" height="${Y0 + CS * ROWS + 30}" style="width:100%;max-width:440px"></canvas><div class="row cp" style="margin-top:8px"></div><p class="hint">Chọn hạt giống ở dưới, chạm một ô đất để nhân vật chạy tới. Ô trống: gieo · cây đang lớn: tưới (rút 20% thời gian) · cây chín: thu hoạch.</p>`;
        cv = $(pane, 'canvas'); c = cv.getContext('2d'); cropBar();
        cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height, col = Math.floor((x - X0) / CS), row = Math.floor((y - Y0) / CS);
          if (col >= 0 && col < COLS && row >= 0 && row < ROWS) { const i = row * COLS + col; if (i === S.plots) { buyPlot(); return; } if (i > S.plots) return toast('Hãy mở khoá các ô đất phía trước trước nhé.'); const p = slotPos(i); tx = p.x; ty = p.y + 30; pend = i; } else { tx = Math.max(24, Math.min(396, x)); ty = Math.max(Y0 - 10, Math.min(Y0 + CS * ROWS + 8, y)); pend = -1; } });
      }
      function cropBar() { const b = $(pane, '.cp'); if (!b) return; b.innerHTML = CROPS.map(cr => `<button class="btn ghost crop${cr.lv > S.lv ? ' lock' : ''}" data-c="${cr.id}" style="${sel === cr.id ? 'outline:2px solid var(--md-primary,#D0BCFF)' : ''}"><span style="font-size:22px">${cr.lv > S.lv ? '🔒' : cr.e}</span><b style="font-size:12px">${cr.n}</b><small>${cr.lv > S.lv ? 'Cấp ' + cr.lv : cr.cost + '→' + cr.gain + ' · ' + (cr.sec >= 60 ? Math.round(cr.sec / 60) + 'p' : cr.sec + 's')}</small></button>`).join(''); b.onclick = e => { const x = e.target.closest('[data-c]'); if (!x) return; const cr = CROPS.find(k => k.id === x.dataset.c); if (cr.lv > S.lv) return toast(`Đạt cấp ${cr.lv} để mở khoá ${cr.n}.`, 'warn'); sel = cr.id; cropBar(); }; }
      function render(dt) {
        t += dt; if (tab !== 'farm' || !c) return;
        const dx = tx - avx, dy = ty - avy, d = Math.hypot(dx, dy), walking = d > 3;
        if (walking) { const s = Math.min(d, 190 * dt); avx += dx / d * s; avy += dy / d * s; } else if (pend >= 0) { const i = pend; pend = -1; perform(i); }
        const W = 420, H = cv.height, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#87CEEB'); g.addColorStop(.17, '#B3E5FC'); g.addColorStop(.18, '#7CB342'); g.addColorStop(1, '#558B2F'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☁️', 70 + Math.sin(t * .2) * 12, 22); c.fillText('☁️', 300 - Math.sin(t * .15) * 14, 30); c.fillText('🏡', 380, 52); c.fillText('🌳', 38, 50);
        for (let i = 0; i < COLS * ROWS; i++) {
          const p = slotPos(i), x = p.x - 31, y = p.y - 29, st = S.field[i];
          if (i >= S.plots) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y, 62, 58); c.font = '20px serif'; c.fillStyle = '#fff'; c.fillText(i === S.plots ? '🔓' : '🔒', p.x, p.y - 6); if (i === S.plots) { c.font = 'bold 12px Roboto,sans-serif'; c.fillText(40 * (S.plots - 4) + '🪙', p.x, p.y + 14); } continue; }
          c.fillStyle = st && st.w ? '#4E342E' : '#795548'; c.beginPath(); c.roundRect ? c.roundRect(x, y, 62, 58, 8) : c.rect(x, y, 62, 58); c.fill(); c.strokeStyle = '#5D4037'; c.lineWidth = 2; c.stroke();
          if (st) { const pr = prog(st), cr = CROPS.find(k => k.id === st.c); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = (pr >= 1 ? 34 : pr > .5 ? 26 : 18) + 'px serif'; c.fillText(pr >= 1 ? cr.e : pr > .5 ? '🌿' : '🌱', p.x, p.y - 2 + (pr >= 1 ? Math.sin(t * 5 + i) * 2 : 0)); if (pr >= 1) { c.font = '14px serif'; c.fillText('✨', p.x + 20, p.y - 18 + Math.sin(t * 4 + i) * 2); } else { c.fillStyle = '#0006'; c.fillRect(x + 6, y + 49, 50, 5); c.fillStyle = st.w ? '#4FC3F7' : '#9CCC65'; c.fillRect(x + 6, y + 49, 50 * pr, 5); } if (st.w && pr < 1) { c.font = '12px serif'; c.fillText('💧', x + 8, y + 10); } }
        }
        fx.forEach(f => { f.t -= dt; f.y -= 22 * dt; }); fx = fx.filter(f => f.t > 0); c.font = 'bold 13px Roboto,sans-serif'; fx.forEach(f => { c.globalAlpha = Math.min(1, f.t * 2); c.fillStyle = '#000'; c.fillText(f.s, f.x + 1, f.y + 1); c.fillStyle = f.col; c.fillText(f.s, f.x, f.y); }); c.globalAlpha = 1;
        drawAvatar(c, avx, avy, S.av, t, walking, 1);
      }
      /* ---- tab nhân vật ---- */
      function drawAvatarTab() {
        pane.innerHTML = `<div class="row" style="align-items:flex-start;gap:14px"><canvas class="cv" width="150" height="210" style="width:150px;background:radial-gradient(circle at 50% 30%,var(--t-p),transparent 70%),var(--md-sc-high,#2b292d)"></canvas><div class="col" style="flex:1;min-width:220px;max-width:none"><button class="btn ghost rnd">🎲 Phối ngẫu nhiên (đồ đã có)</button></div></div><div class="opts" style="text-align:left;margin-top:8px"></div><p class="hint">Chạm món đã có để mặc · món có giá để mua (🪙 xu, 💎 kim cương) · 🔒 cần đạt cấp.</p>`;
        pv = $(pane, 'canvas'); pc = pv.getContext('2d'); opts();
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
      function show(tb) { tab = tb; pane.onclick = null; hudUpdate(); if (tb === 'farm') drawFarm(); else if (tb === 'avatar') { drawAvatarTab(); pane.onclick = onItem; } else drawQuests(); }
      el.querySelector('.tb').onclick = e => { const b = e.target.closest('[data-t]'); if (b) show(b.dataset.t); };
      ensureDay(); save(); show('farm');
      let last = performance.now(), raf = 0; const lp = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; render(dt); if (tab === 'avatar' && pc) { pc.clearRect(0, 0, 150, 210); drawAvatar(pc, 75, 190, S.av, t += 0, false, 2.1); } raf = requestAnimationFrame(lp); }; raf = requestAnimationFrame(lp);
      const tick = setInterval(hudUpdate, 4000);
      return () => { dead = true; cancelAnimationFrame(raf); clearInterval(tick); save(); };
    }
  });
})();
