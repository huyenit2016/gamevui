// Cờ Tỷ Phú Việt Nam: 4 người (bạn + 3 máy), 28 ô, mua đất danh thắng, thu tiền thuê, thẻ cơ hội, 12 vòng. Chơi bằng tiền ảo.
(function () {
  const $ = (el, s) => el.querySelector(s), fmt = n => Math.round(n).toLocaleString('vi-VN');
  const P = (n, price, rent, g, e) => ({ t: 'p', n, price, rent, g, e });
  const CELLS = [
    { t: 's', n: 'Xuất phát', e: '🚩' }, P('Phố cổ Hà Nội', 60, 6, 1, '🏮'), { t: 'c', n: 'Cơ hội', e: '❓' }, P('Chợ Bến Thành', 60, 6, 1, '🛍️'), { t: 'x', n: 'Thuế', e: '💸', amt: 100 }, P('Hồ Gươm', 100, 10, 2, '🐢'), P('Cầu Rồng', 100, 10, 2, '🐉'), { t: 'j', n: 'Thăm tù', e: '🚔' },
    P('Vịnh Hạ Long', 140, 14, 3, '⛵'), { t: 'c', n: 'Cơ hội', e: '❓' }, P('Hội An', 140, 14, 3, '🏮'), P('Đà Lạt', 160, 16, 3, '🌸'), P('Nha Trang', 180, 18, 4, '🏖️'), P('Đại Nội Huế', 180, 18, 4, '🏯'),
    { t: 'f', n: 'Lễ hội', e: '🎉' }, P('Sa Pa', 200, 20, 5, '⛰️'), { t: 'c', n: 'Cơ hội', e: '❓' }, P('Phú Quốc', 220, 22, 5, '🌴'), P('Cần Thơ', 240, 24, 6, '🛶'), P('Mũi Né', 240, 24, 6, '🏜️'), { t: 'x', n: 'Phí', e: '🧾', amt: 80 }, { t: 'g', n: 'Vào tù', e: '⛓️' },
    P('Đà Nẵng', 260, 26, 7, '🌉'), { t: 'c', n: 'Cơ hội', e: '❓' }, P('TP. Hồ Chí Minh', 300, 30, 7, '🏙️'), P('Thủ đô Hà Nội', 320, 34, 8, '🏛️'), P('Côn Đảo', 340, 36, 8, '🏝️'), P('Tràng An', 360, 40, 8, '🗻')
  ];
  const XY = i => i < 8 ? [7 - i, 7] : i < 14 ? [0, 7 - (i - 7)] : i < 22 ? [i - 14, 0] : [7, i - 21];
  const COL = ['#EF5350', '#42A5F5', '#66BB6A', '#FFCA28'], NAMES = ['Bạn', 'Pháp sư Mai', 'Lữ khách Vy', 'Bác Tư'];
  const CARDS = [['Bạn trúng số độc đắc nhỏ! +150', p => pay(p, -150)], ['Sửa nhà: -80', p => pay(p, 80)], ['Được tặng quà sinh nhật! +60', p => pay(p, -60)], ['Đi taxi quá đà: -50', p => pay(p, 50)], ['Tiến thẳng tới ô Xuất phát (+200)', p => { st.pos[p] = 0; pay(p, -200); }], ['Cổ phiếu tăng giá! +120', p => pay(p, -120)], ['Đóng học phí cho cả nhà: -100', p => pay(p, 100)], ['Bán đồ cũ online: +70', p => pay(p, -70)]];
  let st = null; // trạng thái ván hiện tại (một game tại một thời điểm)
  function pay(p, n) { st.cash[p] -= n; if (n > 0) st.fund += 0; }

  GV.register({
    id: 'cotyphu', type: 'game', cat: 'Bàn cờ', name: 'Cờ tỷ phú Việt Nam', icon: '🎲', desc: 'Đấu cờ tỷ phú với 3 người chơi máy: tung xúc xắc, mua danh thắng Việt Nam, thu tiền thuê và làm giàu sau 12 vòng. Tiền ảo, chơi cho vui!',
    mount(el) {
      el.innerHTML = `<style>.cp{display:grid;grid-template-columns:repeat(8,1fr);gap:3px;width:min(96vw,470px)}.cp .c{position:relative;aspect-ratio:.92;background:var(--md-sc-high,#2b292d);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(8px,2vw,11px);line-height:1.15;text-align:center;padding:2px;overflow:hidden;border:2px solid transparent}.cp .c b{font-size:clamp(14px,4vw,20px)}.cp .c .g{position:absolute;top:0;left:0;right:0;height:5px}.cp .c .tk{position:absolute;bottom:2px;display:flex;gap:2px}.cp .c .tk i{width:8px;height:8px;border-radius:50%;border:1px solid #fff}.cp .mid{grid-column:2/8;grid-row:2/8;background:var(--md-sc-low,#1c1b1f);border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center}.cp .pl{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}.cp .pl span{font-size:11px;padding:2px 8px;border-radius:99px;border:2px solid var(--line);background:var(--md-sc-high,#2b292d)}.cp .pl span.me{border-width:2px}.cp .die{font-size:2.2rem}.cp .lgx{font-size:11px;color:var(--mut);min-height:2.6em}</style><div class="hud"><span>Vòng: <b class="rd">1</b>/12</span><span>Quỹ lễ hội: <b class="fd">0</b></span><button class="btn rs">Ván mới</button></div><div class="cp"></div>`;
      const board = $(el, '.cp'); let tmr = 0, dead = false;
      const log = m => { const l = $(el, '.lgx'); if (l) l.textContent = m; };
      function init() {
        clearTimeout(tmr); st = { pos: [0, 0, 0, 0], cash: [1500, 1500, 1500, 1500], own: Array(28).fill(-1), turn: 0, round: 1, fund: 0, jail: [0, 0, 0, 0], busy: false, done: false };
        board.innerHTML = CELLS.map((c, i) => { const [x, y] = XY(i); return `<div class="c" data-i="${i}" style="grid-column:${x + 1};grid-row:${y + 1}">${c.t === 'p' ? `<span class="g" style="background:hsl(${c.g * 45},70%,55%)"></span>` : ''}<b>${c.e}</b><span>${c.n}</span>${c.t === 'p' ? `<small>${c.price}</small>` : ''}<span class="tk"></span></div>`; }).join('') + `<div class="mid"><div class="pl"></div><div class="die">🎲</div><div class="lgx">Nhấn “Tung xúc xắc” để bắt đầu.</div><div class="row"><button class="btn roll">🎲 Tung xúc xắc</button><button class="btn buy" hidden>Mua</button><button class="btn ghost skip" hidden>Bỏ qua</button></div></div>`;
        draw(); $(el, '.roll').onclick = humanRoll; $(el, '.buy').onclick = () => buyDone(true); $(el, '.skip').onclick = () => buyDone(false);
      }
      const worth = p => st.cash[p] + st.own.reduce((a, o, i) => a + (o === p ? CELLS[i].price : 0), 0);
      function draw() {
        $(el, '.rd').textContent = Math.min(12, st.round); $(el, '.fd').textContent = fmt(st.fund);
        $(el, '.pl').innerHTML = [0, 1, 2, 3].map(p => `<span class="${p === st.turn && !st.done ? 'me' : ''}" style="border-color:${p === st.turn && !st.done ? COL[p] : 'var(--line)'}"><i style="color:${COL[p]}">●</i> ${NAMES[p]} ${fmt(st.cash[p])}đ · ${st.own.filter(o => o === p).length} đất</span>`).join('');
        board.querySelectorAll('.c').forEach((n, i) => { const o = st.own[i]; n.style.borderColor = o >= 0 ? COL[o] : 'transparent'; n.querySelector('.tk').innerHTML = st.pos.map((q, p) => q === i ? `<i style="background:${COL[p]}"></i>` : '').join(''); });
      }
      function advance() {
        if (st.done) return; st.turn = (st.turn + 1) % 4; if (st.turn === 0) { st.round++; if (st.round > 12) return finish(); }
        draw(); st.busy = false; if (st.turn === 0) { log(st.jail[0] ? 'Bạn đang ở tù – nhấn để bỏ lượt.' : 'Đến lượt bạn! Tung xúc xắc.'); $(el, '.roll').disabled = false; } else tmr = setTimeout(() => dead || turnOf(st.turn), 700);
      }
      function humanRoll() { if (st.busy || st.turn !== 0 || st.done) return; $(el, '.roll').disabled = true; turnOf(0); }
      function turnOf(p) {
        st.busy = true;
        if (st.jail[p] > 0) { st.jail[p]--; log(`${NAMES[p]} bị giam, bỏ lượt.`); return void (tmr = setTimeout(() => !dead && advance(), 700)); }
        const d1 = 1 + GV.rnd(6), d2 = 1 + GV.rnd(6), n = d1 + d2; $(el, '.die').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d1 - 1] + ' ' + ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d2 - 1]; GV.beep(400, 60); log(`${NAMES[p]} tung được ${n}.`);
        let k = 0; const stepf = () => { if (dead) return; st.pos[p] = (st.pos[p] + 1) % 28; if (st.pos[p] === 0) { st.cash[p] += 200; } draw(); if (++k < n) tmr = setTimeout(stepf, 130); else land(p); }; tmr = setTimeout(stepf, 300);
      }
      function land(p) {
        const i = st.pos[p], c = CELLS[i];
        if (c.t === 'p') {
          if (st.own[i] < 0) { if (p === 0) { if (st.cash[0] >= c.price) { log(`${c.e} ${c.n}: giá ${c.price}đ. Mua không?`); $(el, '.buy').hidden = $(el, '.skip').hidden = false; $(el, '.roll').hidden = true; return; } log(`Bạn không đủ tiền mua ${c.n}.`); } else if (st.cash[p] >= c.price + 250) { st.cash[p] -= c.price; st.own[i] = p; log(`${NAMES[p]} mua ${c.n} (${c.price}đ).`); } }
          else if (st.own[i] !== p) { const o = st.own[i], same = CELLS.filter((q, j) => q.g === c.g && q.t === 'p'), mono = same.every((q, j) => st.own[CELLS.indexOf(q)] === o), rent = c.rent * (mono ? 2 : 1); st.cash[p] -= rent; st.cash[o] += rent; log(`${NAMES[p]} trả ${rent}đ tiền thuê ${c.n} cho ${NAMES[o]}.`); GV.beep(200, 100); broke(p); }
        } else if (c.t === 'x') { st.cash[p] -= c.amt; st.fund += c.amt; log(`${NAMES[p]} nộp ${c.amt}đ vào quỹ lễ hội.`); broke(p); }
        else if (c.t === 'f') { st.cash[p] += st.fund; if (st.fund) log(`${NAMES[p]} nhận quỹ lễ hội ${fmt(st.fund)}đ! 🎉`); st.fund = 0; }
        else if (c.t === 'g') { st.pos[p] = 7; st.jail[p] = 1; log(`${NAMES[p]} bị đưa vào tù (bỏ 1 lượt).`); }
        else if (c.t === 'c') { const cd = CARDS[GV.rnd(CARDS.length)]; cd[1](p); log(`❓ ${NAMES[p]}: ${cd[0]}`); broke(p); }
        draw(); tmr = setTimeout(() => !dead && advance(), p === 0 ? 900 : 1000);
      }
      function broke(p) { if (st.cash[p] < 0) { st.own = st.own.map(o => o === p ? -1 : o); st.cash[p] = 100; log(`${NAMES[p]} phá sản, trả hết đất cho ngân hàng và được cấp 100đ.`); } }
      function buyDone(yes) { const i = st.pos[0], c = CELLS[i]; if (yes) { st.cash[0] -= c.price; st.own[i] = 0; log(`Bạn mua ${c.n} (${c.price}đ).`); GV.beep(700, 80); } $(el, '.buy').hidden = $(el, '.skip').hidden = true; $(el, '.roll').hidden = false; draw(); tmr = setTimeout(() => !dead && advance(), 700); }
      function finish() {
        st.done = true; const w = [0, 1, 2, 3].map(worth), order = [0, 1, 2, 3].sort((a, b) => w[b] - w[a]), rank = order.indexOf(0) + 1;
        $(el, '.roll').hidden = true; log(`Kết thúc 12 vòng! Tài sản của bạn: ${fmt(w[0])}đ – hạng ${rank}/4 ${rank === 1 ? '🏆 Bạn là tỷ phú!' : ''}`);
        $(el, '.pl').innerHTML = order.map((p, k) => `<span style="border-color:${COL[p]}">#${k + 1} ${NAMES[p]}: ${fmt(w[p])}đ</span>`).join(''); GV.setBest('cotyphu', w[0]);
      }
      $(el, '.rs').onclick = init; init();
      return () => { dead = true; clearTimeout(tmr); };
    }
  });
})();
