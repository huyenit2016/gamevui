// Làng Nông Vui – các khu mở rộng: Chuồng trại, Ngôi nhà, Câu cá, Đua xe, Cờ tỷ phú, Cày xu, Trò chơi, Hàng xóm.
// Đăng ký vào GV.townZones (xem js/games-avatarfarm.js). Mỗi khu: { id, ico, n, lock, mount(host, T) -> hàm dọn dẹp }.
(function () {
  const esc = GV.esc, $ = (el, s) => el.querySelector(s);
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const css = `<style>.tw .cardx{background:var(--md-sc-high,#2b292d);border:1px solid var(--line);border-radius:16px;padding:12px;text-align:center}.tw .gridx{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.tw .bar{height:8px;border-radius:9px;background:var(--md-sc-lowest,#111);overflow:hidden}.tw .bar i{display:block;height:100%;background:var(--ok);transition:width .4s}.tw small{color:var(--mut)}.tw .btn{height:auto;min-height:38px;padding:6px 14px}.tw .chipx{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:12px;border:1px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);font:inherit;font-size:13px;cursor:pointer;margin:3px}.tw .chipx.on{border-color:var(--md-primary,#D0BCFF);background:var(--t-p)}.tw h3{margin:6px 0;font-size:1.05rem}</style>`;
  const wrap = (host, html) => { host.innerHTML = css + '<div class="tw" style="width:100%;text-align:left">' + html + '</div>'; return host.firstElementChild.nextElementSibling; };
  const fmt = n => Math.round(n).toLocaleString('vi-VN');

  /* ============ CHUỒNG TRẠI (gà, vịt, bò, lợn, cừu) ============ */
  const AN = {
    hen: { e: '🐔', n: 'Gà', lv: 1, cost: 40, p: '🥚', pn: 'Trứng gà', price: 8, sec: 45, feed: 3, xp: 2 },
    duck: { e: '🦆', n: 'Vịt', lv: 2, cost: 70, p: '🥚', pn: 'Trứng vịt', price: 13, sec: 70, feed: 5, xp: 3 },
    cow: { e: '🐄', n: 'Bò sữa', lv: 3, cost: 300, p: '🥛', pn: 'Sữa tươi', price: 55, sec: 150, feed: 15, xp: 8 },
    pig: { e: '🐖', n: 'Lợn', lv: 4, cost: 260, p: '🥓', pn: 'Thịt lợn', price: 80, sec: 210, feed: 20, xp: 10 },
    sheep: { e: '🐑', n: 'Cừu', lv: 6, cost: 500, p: '🧶', pn: 'Len cừu', price: 120, sec: 280, feed: 30, xp: 14 }
  };
  GV.townZones.push({
    id: 'barn', ico: '🐔', n: 'Chăn nuôi', lock: false,
    mount(host, T) {
      const S = T.S; const root = wrap(host, '<div class="inv cardx" style="margin-bottom:10px"></div><div class="pens gridx"></div><p class="hint">Mua con giống → cho ăn → chờ sản phẩm → thu hoạch vào kho → bán lấy xu.</p>');
      const penCost = () => 100 * (S.pens.length - 1);
      function draw() {
        const now = Date.now(), inv = Object.entries(S.inv).filter(([, n]) => n > 0);
        const worth = inv.reduce((a, [k, n]) => a + n * (Object.values(AN).find(x => x.p + x.pn === k) || { price: 0 }).price, 0);
        $(root.parentNode, '.inv').innerHTML = inv.length ? `<b>📦 Kho:</b> ${inv.map(([k, n]) => `${k.slice(0, 2)} ×${n}`).join(' · ')} <button class="btn sell" style="margin-left:8px">Bán tất cả (~${fmt(worth * T.bonus())} 🪙)</button>` : '<span class="hint">📦 Kho đang trống – nuôi con giống để có sản phẩm.</span>';
        $(root.parentNode, '.pens').innerHTML = S.pens.map((p, i) => {
          if (!p) return `<div class="cardx"><div style="font-size:1.6rem">➕</div><small>Chuồng trống</small><div style="margin-top:6px">${Object.entries(AN).map(([k, a]) => `<button class="chipx" data-buy="${i}:${k}" ${a.lv > S.lv ? 'disabled style="opacity:.45"' : ''}>${a.lv > S.lv ? '🔒 C' + a.lv : a.e + ' ' + a.cost + '🪙'}</button>`).join('')}</div></div>`;
          const a = AN[p.a], pr = p.fed ? Math.min(1, (now - p.fed) / (a.sec * 1000)) : 0;
          return `<div class="cardx"><div style="font-size:2.4rem">${a.e}</div><b>${a.n}</b><br><small>${a.p} ${a.pn} · ${a.price}🪙</small><div class="bar" style="margin:8px 0"><i style="width:${pr * 100}%"></i></div>${!p.fed ? `<button class="btn" data-feed="${i}">🌾 Cho ăn (${a.feed}🪙)</button>` : pr >= 1 ? `<button class="btn" data-take="${i}">${a.p} Thu hoạch</button>` : `<small>Đang sản xuất… ${Math.ceil(a.sec * (1 - pr))}s</small>`}</div>`;
        }).join('') + (S.pens.length < 8 ? `<div class="cardx"><div style="font-size:1.6rem">🏗️</div><small>Mở thêm chuồng</small><br><button class="btn ghost" data-pen="1">${penCost()} 🪙</button></div>` : '');
      }
      root.parentNode.onclick = e => {
        const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
        if (d.buy) { const [i, k] = d.buy.split(':'), a = AN[k]; if (!T.spend(a.cost)) return T.toast('Không đủ xu.', 'warn'); S.pens[+i] = { a: k, fed: 0 }; GV.beep(600, 60); }
        else if (d.feed) { const p = S.pens[+d.feed], a = AN[p.a]; if (!T.spend(a.feed)) return T.toast('Không đủ xu mua thức ăn.', 'warn'); p.fed = Date.now(); GV.beep(450, 40); }
        else if (d.take) { const p = S.pens[+d.take], a = AN[p.a], key = a.p + a.pn; if (Date.now() - p.fed < a.sec * 1000) return; S.inv[key] = (S.inv[key] || 0) + 1; p.fed = 0; T.addXp(a.xp); GV.beep(750, 60); }
        else if (d.pen) { if (!T.spend(penCost())) return T.toast('Không đủ xu.', 'warn'); S.pens.push(null); }
        else if (b.classList.contains('sell')) { let sum = 0; Object.entries(S.inv).forEach(([k, n]) => { const a = Object.values(AN).find(x => x.p + x.pn === k); if (a) sum += a.price * n; }); sum = Math.round(sum * T.bonus()); S.inv = {}; T.give(sum, 0, `Đã bán sản phẩm: +${fmt(sum)} 🪙`); GV.beep(900, 100); }
        T.save(); T.hud(); draw();
      };
      let dn = false; const pd = () => { dn = true; }, pu = () => { setTimeout(() => dn = false, 50); }; root.parentNode.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);
      draw(); const iv = setInterval(() => { if (!dn) draw(); }, 1000); return () => { clearInterval(iv); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); };
    }
  });

  /* ============ NGÔI NHÀ ============ */
  const HL = [{ n: 'Lều tạm', w: 4, h: 3, cost: 0 }, { n: 'Nhà tranh', w: 5, h: 4, cost: 500 }, { n: 'Nhà gỗ', w: 6, h: 4, cost: 2500 }, { n: 'Nhà gạch', w: 7, h: 5, cost: 10000 }, { n: 'Biệt thự', w: 8, h: 6, cost: 40000 }];
  const FU = { bed: ['🛏️', 'Giường', 120, 8], sofa: ['🛋️', 'Sofa', 100, 6], tv: ['📺', 'TV', 180, 10], plant: ['🪴', 'Cây cảnh', 30, 2], art: ['🖼️', 'Tranh', 60, 4], bear: ['🧸', 'Gấu bông', 40, 3], stove: ['🍳', 'Bếp', 150, 9], bath: ['🚿', 'Phòng tắm', 140, 8], piano: ['🎹', 'Đàn piano', 300, 14], cat: ['🐈', 'Mèo cưng', 90, 7] };
  GV.townZones.push({
    id: 'house', ico: '🏡', n: 'Ngôi nhà', lock: true,
    mount(host, T) {
      const S = T.S, H = S.house; let sel = 'sofa', rm = false, raf = 0, t = 0;
      const root = wrap(host, '<div class="top cardx" style="margin-bottom:8px"></div><canvas class="cv" width="400" height="320" style="width:100%;max-width:440px;background:#3b2f2a"></canvas><div class="pal" style="margin-top:6px"></div><p class="hint">Chọn đồ nội thất rồi chạm vào ô sàn để đặt. Chọn 🧹 Dọn để thu hồi đồ (hoàn 50%). Nhà càng đẹp, thu hoạch càng được cộng xu.</p>');
      const el = root.parentNode, cv = $(el, 'canvas'), c = cv.getContext('2d'), L = () => HL[H.lv];
      const happy = () => { S.happy = H.lv * 20 + H.items.reduce((a, i) => a + FU[i.k][3], 0); return S.happy; };
      function ui() {
        const hp = happy(), nx = HL[H.lv + 1];
        $(el, '.top').innerHTML = `<b>🏡 ${L().n}</b> <small>(${L().w}×${L().h} ô)</small><br><small>Hạnh phúc ${hp} · thưởng thu hoạch <b>+${Math.round((T.bonus() - 1) * 100)}%</b></small><div class="bar" style="margin:6px 0"><i style="width:${Math.min(100, hp / 1.6)}%"></i></div>${nx ? `<button class="btn up">⬆ Nâng lên ${nx.n} (${fmt(nx.cost)} 🪙)</button>` : '<small>Đã là biệt thự tối đa 🎉</small>'}`;
        $(el, '.pal').innerHTML = Object.entries(FU).map(([k, f]) => `<button class="chipx${sel === k && !rm ? ' on' : ''}" data-f="${k}">${f[0]} ${f[1]} <small>${f[2]}🪙</small></button>`).join('') + `<button class="chipx${rm ? ' on' : ''}" data-f="_rm">🧹 Dọn</button>`;
      }
      function draw() {
        t += .016; const w = L().w, h = L().h, S2 = Math.min(56, 380 / w, 280 / h), ox = (400 - w * S2) / 2, oy = 28 + (280 - h * S2) / 2;
        c.fillStyle = '#7CB342'; c.fillRect(0, 0, 400, 320); c.fillStyle = '#8D6E63'; c.fillRect(ox - 10, oy - 22, w * S2 + 20, h * S2 + 32);
        c.fillStyle = '#EFEBE9'; c.fillRect(ox - 4, oy - 16, w * S2 + 8, 16);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { c.fillStyle = (x + y) % 2 ? '#C69C6D' : '#D7B58A'; c.fillRect(ox + x * S2, oy + y * S2, S2, S2); }
        c.font = Math.floor(S2 * .7) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🪟', ox + S2 * .6, oy - 8); if (w > 4) c.fillText('🪟', ox + w * S2 - S2 * .6, oy - 8);
        H.items.forEach(i => c.fillText(FU[i.k][0], ox + (i.x + .5) * S2, oy + (i.y + .5) * S2));
        T.drawAvatar(c, ox + w * S2 / 2, oy + h * S2 - 4, t, false, .62);
        raf = requestAnimationFrame(draw);
      }
      cv.addEventListener('pointerdown', e => {
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 400 / r.width, y = (e.clientY - r.top) * 320 / r.height, w = L().w, h = L().h, S2 = Math.min(56, 380 / w, 280 / h), ox = (400 - w * S2) / 2, oy = 28 + (280 - h * S2) / 2, gx = Math.floor((x - ox) / S2), gy = Math.floor((y - oy) / S2);
        if (gx < 0 || gy < 0 || gx >= w || gy >= h) return; const ex = H.items.findIndex(i => i.x === gx && i.y === gy);
        if (rm) { if (ex >= 0) { const f = FU[H.items[ex].k]; H.items.splice(ex, 1); T.give(Math.floor(f[2] / 2), 0); GV.beep(300, 40); } }
        else if (ex < 0) { const f = FU[sel]; if (!T.spend(f[2])) return T.toast('Không đủ xu mua ' + f[1] + '.', 'warn'); H.items.push({ k: sel, x: gx, y: gy }); GV.beep(560, 50); }
        else T.toast('Ô này đã có đồ. Dùng 🧹 Dọn để thu hồi.');
        happy(); T.save(); ui();
      });
      el.addEventListener('click', e => {
        const f = e.target.closest('[data-f]'); if (f) { if (f.dataset.f === '_rm') rm = !rm; else { sel = f.dataset.f; rm = false; } ui(); return; }
        if (e.target.closest('.up')) { const nx = HL[H.lv + 1]; if (nx && T.spend(nx.cost)) { H.lv++; happy(); T.save(); T.toast('🏡 Nhà đã nâng lên ' + nx.n + '!', 'success'); GV.beep(900, 150); ui(); } else T.toast('Không đủ xu để nâng nhà.', 'warn'); }
      });
      happy(); ui(); raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
    }
  });

  /* ============ CÀY XU (cơ sở kinh doanh tự động) ============ */
  const BZ = [['🥬', 'Sạp rau', 50, .5], ['🥖', 'Tiệm bánh mì', 300, 3], ['🥛', 'Xưởng sữa', 1500, 14], ['🏪', 'Siêu thị', 8000, 70], ['🏭', 'Nhà máy chế biến', 50000, 400]];
  GV.townZones.push({
    id: 'biz', ico: '💰', n: 'Cày xu', lock: true,
    mount(host, T) {
      const S = T.S, B = S.biz; const root = wrap(host, '<div class="cardx pool" style="margin-bottom:10px"></div><div class="list"></div><p class="hint">Mua và nâng cấp cơ sở: chúng tự kiếm xu cả khi bạn thoát web (tối đa 2 giờ). Nhớ quay lại thu xu!</p>');
      const el = root.parentNode, inc = () => BZ.reduce((a, b, i) => a + B.lv[i] * b[3], 0) * T.bonus(), cap = () => inc() * 7200, cost = i => Math.round(BZ[i][2] * Math.pow(1.17, B.lv[i]));
      function catchUp() { const now = Date.now(), dt = Math.min(7200, (now - B.t) / 1000); B.pool = Math.min(cap(), B.pool + inc() * Math.max(0, dt)); B.t = now; }
      function draw() {
        $(el, '.pool').innerHTML = `<div style="font-size:1.8rem">💰 <b>${fmt(B.pool)}</b></div><small>Thu nhập: <b>${inc().toFixed(1)}</b> xu/giây · kho chứa tối đa ${fmt(cap())}</small><br><button class="btn col" ${B.pool < 1 ? 'disabled' : ''}>Thu xu</button>`;
        $(el, '.list').innerHTML = BZ.map((b, i) => `<div class="cardx" style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:6px;text-align:left"><span style="font-size:1.8rem">${b[0]}</span><span style="flex:1"><b>${b[1]}</b> <small>Cấp ${B.lv[i]}</small><br><small>+${(b[3]).toFixed(1)} xu/giây mỗi cấp</small></span><button class="btn ${T.S.coins >= cost(i) ? '' : 'ghost'}" data-b="${i}">${B.lv[i] ? 'Nâng' : 'Mua'} ${fmt(cost(i))}🪙</button></div>`).join('');
      }
      el.addEventListener('click', e => {
        if (e.target.closest('.col')) { catchUp(); const n = Math.floor(B.pool); if (n > 0) { B.pool -= n; T.give(n, 0); GV.beep(850, 80); } T.save(); draw(); return; }
        const b = e.target.closest('[data-b]'); if (!b) return; const i = +b.dataset.b; catchUp(); if (T.spend(cost(i))) { B.lv[i]++; GV.beep(600, 60); T.save(); draw(); } else T.toast('Không đủ xu.', 'warn');
      });
      let dn = false; const pd = () => { dn = true; }, pu = () => { setTimeout(() => dn = false, 50); }; el.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);
      catchUp(); draw(); const iv = setInterval(() => { catchUp(); if (!dn) draw(); }, 1000); return () => { clearInterval(iv); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); catchUp(); T.save(); };
    }
  });

  /* ============ NHÚNG GAME CÓ SẴN + THƯỞNG XU ============ */
  const RATE = { fishing: [.9, 300], racing: [.7, 300], goldminer: [.5, 300], cotyphu: [.12, 600], towerdef: [20, 400], zombie: [.6, 250], airfight: [.4, 300], stickrun: [.5, 250], mathrush: [.6, 250], basketball: [12, 250], bowling: [3, 250], archery: [3, 250], penalty: [30, 250], bomber: [.5, 250] }, FIX = { billiards: 40, lovematch: 40, maze: 30 };
  function reward(T, id, v) {
    const S = T.S, d = today(); if (!S.rw || S.rw.d !== d) S.rw = { d, m: {} };
    let coins = FIX[id] || Math.round(v * (RATE[id] ? RATE[id][0] : .3)) + 3; const cap = RATE[id] ? RATE[id][1] : 150; coins = Math.max(1, Math.min(cap, coins));
    const room = 1500 - (S.rw.m[id] || 0); if (room <= 0) return T.toast('Hôm nay bạn đã nhận đủ thưởng từ trò này. Quay lại ngày mai nhé!', 'info'); coins = Math.min(coins, room); S.rw.m[id] = (S.rw.m[id] || 0) + coins;
    T.give(coins, 0, `🏅 Thưởng từ trò chơi: +${coins} 🪙`); T.addXp(Math.min(20, Math.ceil(coins / 20))); T.save();
  }
  // gắn game vào khung của làng; trả về hàm dọn dẹp
  function embed(box, T, id) {
    const g = GV.items.find(i => i.id === id); if (!g) { box.textContent = 'Không tìm thấy trò chơi.'; return () => {}; }
    box.innerHTML = ''; const inner = document.createElement('div'); inner.className = 'stage'; inner.style.cssText = 'min-height:0;padding:14px 8px'; box.appendChild(inner);
    GV.hooks = GV.hooks || {}; GV.hooks.score = (gid, v) => { if (gid === id) reward(T, id, v); }; let clean = null;
    try { clean = g.mount(inner); } catch (e) { inner.textContent = 'Lỗi khi tải trò chơi.'; }
    return () => { if (GV.hooks) GV.hooks.score = null; try { clean && clean(); } catch (e) {} };
  }
  function launcher(zone, ico, title, desc, gameId) {
    GV.townZones.push({
      id: zone, ico, n: title, lock: true,
      mount(host, T) {
        let clean = null;
        const intro = () => { if (clean) { clean(); clean = null; } wrap(host, `<div class="cardx"><div style="font-size:3rem">${ico}</div><h3>${title}</h3><p class="hint">${desc}</p><button class="btn go">▶ Vào chơi</button><p class="hint">Chơi xong được thưởng 🪙 theo điểm (tối đa theo ngày).</p></div>`); $(host, '.go').onclick = () => { host.innerHTML = '<div style="margin-bottom:6px"><button class="btn ghost bk">↩ Quay lại</button></div><div class="gm"></div>'; $(host, '.bk').onclick = intro; clean = embed($(host, '.gm'), T, gameId); }; };
        intro(); return () => { if (clean) clean(); };
      }
    });
  }
  launcher('fish', '🎣', 'Hồ câu cá', 'Thả cần, kéo cá lớn, tránh giày rách. Mỗi mẻ cá đổi ra xu.', 'fishing');
  launcher('race', '🏎️', 'Đua xe', 'Lái xe qua 3 làn, né xe khác – càng đi xa càng nhiều thưởng.', 'racing');
  launcher('board', '🎲', 'Cờ tỷ phú', 'Đấu cờ tỷ phú với 3 người chơi máy: mua đất, thu tiền thuê, làm giàu!', 'cotyphu');
  GV.townZones.push({
    id: 'games', ico: '🎮', n: 'Trò chơi', lock: true,
    mount(host, T) {
      let clean = null; const SKIP = new Set(['avatarfarm', 'farm', 'bakery', 'fishing', 'racing', 'cotyphu', 'baucua']);
      const list = () => { if (clean) { clean(); clean = null; } const gs = GV.items.filter(i => i.type === 'game' && i.cat !== 'Nhiều người' && !SKIP.has(i.id)); wrap(host, `<p class="hint">Chơi các game có sẵn để kiếm xu cho làng (thưởng theo điểm).</p><div>${gs.map(g => `<button class="chipx" data-g="${g.id}">${g.icon} ${esc(g.name)}</button>`).join('')}</div>`); host.onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; host.onclick = null; host.innerHTML = '<div style="margin-bottom:6px"><button class="btn ghost bk">↩ Danh sách game</button></div><div class="gm"></div>'; $(host, '.bk').onclick = list; clean = embed($(host, '.gm'), T, b.dataset.g); }; };
      list(); return () => { host.onclick = null; if (clean) clean(); };
    }
  });

  /* ============ HÀNG XÓM (xem làng của người khác) ============ */
  const NPC = [['Bác Tư', 12, 'skin3', 'hair_short', 'hc_black', 'top_overall'], ['Cô Lan', 18, 'skin1', 'hair_long', 'hc_brown', 'top_dress'], ['Chú Ba', 7, 'skin2', 'hair_bald', 'hc_black', 'top_tee'], ['Bé Na', 5, 'skin0', 'hair_bun', 'hc_pink', 'top_dress']];
  function npcVillage(i) {
    const n = NPC[i], CR = GV.townLib.CROPS, rnd = k => ((i * 7919 + k * 104729) % 97) / 97;
    return { n: n[0] + ' (NPC)', lv: n[1], npc: true, av: { skin: n[2], hair: n[3], hcol: n[4], top: n[5], tcol: 'tc_yellow', pants: 'pa_brown', hat: i % 2 ? 'hat_straw' : 'hat_none', acc: 'acc_none' }, plots: Array.from({ length: 6 + i * 2 }, (_, k) => rnd(k) > .25 ? [Math.floor(rnd(k + 9) * Math.min(CR.length, 3 + i * 2)), Math.round(rnd(k + 3) * 100)] : 0), pens: ['hen', 'cow', 'pig', 'duck'].slice(0, 1 + i), h: { lv: Math.min(4, 1 + i), happy: 40 + i * 30 }, likes: 3 + i * 5 };
  }
  GV.townPublish = T => {
    const S = T.S; if (!S.share || !S.unlocked) return; const F = GV.fbInfo && GV.fbInfo(); if (!F || !F.cfg()) return;
    const CR = GV.townLib.CROPS, pr = p => { const c = CR.find(x => x.id === p.c); return Math.round(Math.min(1, (Date.now() - p.t) / (c.sec * 1000)) * 100); };
    F.fb().then(({ db, uid, TS }) => db.ref('villages/' + uid + '/info').set({ n: String(S.nick || 'Nông dân').slice(0, 20), lv: S.lv, av: S.av, plots: S.field.slice(0, S.plots).map(p => p ? [Math.max(0, CR.findIndex(x => x.id === p.c)), pr(p)] : 0), pens: S.pens.filter(Boolean).map(p => p.a), h: { lv: S.house.lv, happy: S.happy || 0 }, at: TS })).catch(() => {});
  };
  GV.townZones.push({
    id: 'neighbors', ico: '👀', n: 'Hàng xóm', lock: true,
    mount(host, T) {
      const S = T.S; let raf = 0, dead = false, vis = null, list = [], myUid = '';
      const F = GV.fbInfo && GV.fbInfo(), online = !!(F && F.cfg());
      const root = wrap(host, '<div class="top"></div><div class="body"></div>'), el = root.parentNode;
      function head() {
        $(el, '.top').innerHTML = `<div class="cardx" style="margin-bottom:8px;text-align:left"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="sh" ${S.share ? 'checked' : ''}> Cho hàng xóm xem làng của tôi <small>(tên hiển thị, nhân vật, nông trại, nhà – không có thông tin cá nhân)</small></label>${online ? '' : '<small>⚠ Chưa kết nối Firebase: chỉ xem được hàng xóm NPC.</small>'}</div>`;
        $(el, '.sh').onchange = e => { S.share = e.target.checked; T.save(); if (S.share) GV.townPublish(T); else if (online) F.fb().then(({ db, uid }) => db.ref('villages/' + uid + '/info').remove()).catch(() => {}); };
      }
      async function load() {
        $(el, '.body').innerHTML = '<p class="hint">Đang tìm hàng xóm…</p>'; list = [];
        if (online) { try { const { db, uid } = await F.fb(); myUid = uid; const snap = await db.ref('villages').orderByChild('info/at').limitToLast(40).once('value'), now = Date.now(); snap.forEach(ch => { const v = ch.val(); if (v && v.info && ch.key !== uid && now - (v.info.at || 0) < 7 * 864e5) list.push({ id: ch.key, ...v.info, likes: v.likes || 0 }); }); list.reverse(); } catch (e) { $(el, '.body').innerHTML = '<p class="hint">Không tải được danh sách hàng xóm (' + esc(String(e.message || e).slice(0, 80)) + ').</p>'; } }
        if (dead) return; NPC.forEach((_, i) => list.push(Object.assign(npcVillage(i), { id: 'npc' + i })));
        $(el, '.body').innerHTML = `<div class="gridx">${list.map((v, i) => `<button class="cardx" data-v="${i}" style="cursor:pointer;color:var(--fg);font:inherit"><div style="font-size:1.8rem">${v.npc ? '🧑‍🌾' : '👩‍🌾'}</div><b>${esc(v.n)}</b><br><small>Cấp ${v.lv} · ❤️ ${v.likes || 0}</small></button>`).join('')}</div><p class="hint">Chạm vào một người để ghé thăm nông trại và ngôi nhà của họ.</p>`;
      }
      function view(v) {
        vis = v; const CR = GV.townLib.CROPS;
        $(el, '.body').innerHTML = `<div style="margin-bottom:6px"><button class="btn ghost bk">↩ Danh sách</button> <button class="btn lk">❤️ Thả tim (+5🪙)</button></div><div class="cardx" style="margin-bottom:6px"><b>${esc(v.n)}</b> · Cấp ${v.lv} · ❤️ <span class="lc">${v.likes || 0}</span><br><small>🏡 Mức nhà ${(v.h && v.h.lv) || 0} · Hạnh phúc ${(v.h && v.h.happy) || 0} · Gia súc: ${(v.pens || []).map(a => (AN[a] ? AN[a].e : '🐾')).join(' ') || 'chưa có'}</small></div><canvas class="cv" width="420" height="300" style="width:100%;max-width:440px"></canvas>`;
        const cv = $(el, 'canvas'), c = cv.getContext('2d'); let t = 0;
        const draw = () => { t += .016; c.fillStyle = '#7CB342'; c.fillRect(0, 0, 420, 300); c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏡', 380, 40); c.fillText('🌳', 36, 40);
          (v.plots || []).forEach((p, i) => { const x = 30 + (i % 5) * 72 + 36, y = 70 + Math.floor(i / 5) * 62 + 30; c.fillStyle = '#795548'; c.fillRect(x - 31, y - 27, 62, 54); if (p) { const cr = CR[p[0]] || CR[0], pr = p[1]; c.font = (pr >= 100 ? 32 : pr > 50 ? 24 : 16) + 'px serif'; c.fillText(pr >= 100 ? cr.e : pr > 50 ? '🌿' : '🌱', x, y); } });
          const av = v.av; if (av) GV.townLib.drawAvatar(c, 210, 292, av, t, false, .8); raf = requestAnimationFrame(draw); };
        cancelAnimationFrame(raf); draw();
        $(el, '.bk').onclick = () => { cancelAnimationFrame(raf); load(); };
        $(el, '.lk').onclick = async () => { const k = v.id, d = today(); if (S.liked[k] === d) return T.toast('Hôm nay bạn đã thả tim cho người này rồi.'); S.liked[k] = d; v.likes = (v.likes || 0) + 1; $(el, '.lc').textContent = v.likes; T.give(5, 0, '❤️ Đã thả tim! +5 🪙'); T.save(); if (!v.npc && online) { try { const { db } = await F.fb(); db.ref('villages/' + v.id + '/likes').transaction(n => (n || 0) + 1); } catch (e) {} } };
      }
      el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) view(list[+b.dataset.v]); });
      head(); load(); return () => { dead = true; cancelAnimationFrame(raf); };
    }
  });
})();
