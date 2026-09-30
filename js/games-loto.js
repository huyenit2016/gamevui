// Lô tô Việt Nam: vé 9 hàng x 9 cột, mỗi hàng 5 số. Đủ 5 số trên một hàng thì "Kinh!"
(function () {
  const pool = c => { const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9; return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i); };
  // Sinh một vé: 9 hàng, mỗi hàng đúng 5 ô có số; mỗi cột đúng 5 số, sắp tăng dần từ trên xuống.
  function makeTicket() {
    const need = Array(9).fill(5), rows = [];
    for (let r = 0; r < 9; r++) {
      const cols = GV.shuffle([...Array(9).keys()]).sort((a, b) => need[b] - need[a]).slice(0, 5);
      cols.forEach(c => need[c]--); rows.push(new Set(cols));
    }
    const t = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let c = 0; c < 9; c++) {
      const nums = GV.shuffle(pool(c)).slice(0, 5).sort((a, b) => a - b); let k = 0;
      for (let r = 0; r < 9; r++) if (rows[r].has(c)) t[r][c] = nums[k++];
    }
    return t;
  }
  GV.lotoTicket = makeTicket;
  const rowNums = (t, r) => t[r].filter(Boolean);

  GV.register({
    id: 'loto', type: 'game', cat: 'Gia đình', name: 'Lô tô', icon: '🎱', desc: 'Lô tô truyền thống: dò số, đủ hàng thì kinh!',
    mount(el) {
      el.innerHTML = `<div class="hud"><span>Đã hô: <b class="n">0</b>/90</span><span>Thắng: <b class="w">${GV.store.get('loto_w', 0)}</b></span><span>Thua: <b class="l">${GV.store.get('loto_l', 0)}</b></span></div>
      <div class="row"><div class="big res cur" style="font-size:3.6rem;min-width:130px;color:var(--acc2)">--</div><div class="hint hist" style="max-width:300px;text-align:left">Số đã hô sẽ hiện ở đây.</div></div>
      <div class="row"><button class="btn go">▶ Bắt đầu</button><button class="btn ok kinh" disabled>🎉 KINH!</button><button class="btn ghost rs">Ván mới</button></div>
      <div class="row"><label>Tốc độ <select class="sp"><option value="4000">Chậm</option><option value="2500" selected>Vừa</option><option value="1200">Nhanh</option></select></label>
      <label><input type="checkbox" class="auto"> Tự động dò</label><label><input type="checkbox" class="say"> 🔊 Đọc số</label></div>
      <p class="msg">Bấm vào số trên vé khi nghe hô. Đủ 5 số một hàng thì bấm KINH!</p>
      <div class="ticket" style="display:grid;grid-template-columns:repeat(9,1fr);gap:3px;width:min(100%,440px)"></div>
      <div class="hint bots"></div>`;
      const $ = s => el.querySelector(s), tk = $('.ticket');
      const COLS = ['#ffe0e0', '#ffeacc', '#fff6c2', '#e2f7c9', '#d2f5e3', '#d0f0fa', '#dbe3ff', '#eadbff', '#ffd9ef'];
      const BOTS = ['Bot An', 'Bot Bình', 'Bot Chi'];
      let me, bots, deck, called, marked, timer, running, over;

      function newGame() {
        clearInterval(timer); running = false; over = false;
        me = makeTicket(); bots = BOTS.map(n => ({ n, t: makeTicket() }));
        deck = GV.shuffle(Array.from({ length: 90 }, (_, i) => i + 1)); called = new Set(); marked = new Set();
        $('.n').textContent = 0; $('.cur').textContent = '--'; $('.hist').textContent = 'Số đã hô sẽ hiện ở đây.';
        $('.go').textContent = '▶ Bắt đầu'; $('.go').disabled = false; $('.kinh').disabled = false; $('.msg').textContent = 'Bấm vào số trên vé khi nghe hô. Đủ 5 số một hàng thì bấm KINH!';
        draw(); botInfo();
      }
      const rowState = r => { const ns = rowNums(me, r); return { total: ns.length, called: ns.filter(x => called.has(x)).length, marked: ns.filter(x => marked.has(x)).length }; };
      function draw() {
        tk.innerHTML = me.map((row, r) => {
          const st = rowState(r), wait = st.called === 4 && st.marked >= 3;
          return row.map((v, c) => v
            ? `<div data-v="${v}" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;font-weight:800;font-size:clamp(11px,3.4vw,18px);user-select:none;background:${marked.has(v) ? '#ff5c6c' : COLS[c]};color:${marked.has(v) ? '#fff' : '#222'};${st.called === 4 && !marked.has(v) && !called.has(v) ? 'box-shadow:inset 0 0 0 2px #ff9f43' : ''}">${v}</div>`
            : `<div style="aspect-ratio:1;border-radius:6px;background:var(--card2);opacity:.5"></div>`).join('');
        }).join('');
      }
      function botInfo() {
        $('.bots').innerHTML = bots.map(b => {
          let best = 5; for (let r = 0; r < 9; r++) best = Math.min(best, 5 - rowNums(b.t, r).filter(x => called.has(x)).length);
          return `${b.n}: ${best === 0 ? '🏆 KINH!' : 'còn ' + best + ' số'}`;
        }).join(' · ');
      }
      function say(n) {
        if (!$('.say').checked || !window.speechSynthesis) return;
        try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(n)); u.lang = 'vi-VN'; u.rate = .9; speechSynthesis.speak(u); } catch (e) {}
      }
      function draw1() {
        if (over) return;
        if (!deck.length) { end(null); return; }
        const n = deck.pop(); called.add(n);
        $('.n').textContent = called.size; $('.cur').textContent = n; GV.beep(400 + n * 4, 90); say(n);
        $('.hist').textContent = 'Vừa hô: ' + [...called].slice(-12, -1).reverse().join(', ');
        if ($('.auto').checked) for (let r = 0; r < 9; r++) rowNums(me, r).forEach(x => { if (x === n) marked.add(x); });
        draw(); botInfo();
        const b = bots.find(b => [...Array(9).keys()].some(r => rowNums(b.t, r).every(x => called.has(x))));
        if (b) end(b);
      }
      function end(bot) {
        over = true; running = false; clearInterval(timer); $('.go').disabled = true; $('.kinh').disabled = true;
        if (bot === 'me') { GV.store.set('loto_w', GV.store.get('loto_w', 0) + 1); $('.w').textContent = GV.store.get('loto_w', 0); $('.msg').textContent = '🎉 KINH! Bạn thắng!'; GV.beep(880, 400); }
        else if (bot) { GV.store.set('loto_l', GV.store.get('loto_l', 0) + 1); $('.l').textContent = GV.store.get('loto_l', 0); $('.msg').textContent = `😢 ${bot.n} đã kinh trước! Bạn thua.`; GV.beep(150, 400); }
        else $('.msg').textContent = 'Hết số, ván hòa.';
      }
      function run() {
        clearInterval(timer); running = true; $('.go').textContent = '⏸ Tạm dừng'; timer = setInterval(draw1, +$('.sp').value);
      }
      $('.go').onclick = () => {
        if (over) return;
        if (running) { clearInterval(timer); running = false; $('.go').textContent = '▶ Tiếp tục'; } else { draw1(); if (!over) run(); }
      };
      $('.sp').onchange = () => running && run();
      tk.onclick = e => {
        const v = +e.target.dataset.v; if (!v || over) return;
        marked.has(v) ? marked.delete(v) : marked.add(v); draw();
      };
      $('.kinh').onclick = () => {
        if (over) return;
        const win = [...Array(9).keys()].some(r => rowNums(me, r).every(x => called.has(x) && marked.has(x)));
        if (win) end('me'); else { $('.msg').textContent = '❌ Chưa đủ 5 số đã hô trên một hàng (nhớ bấm dò số)!'; GV.beep(200, 200); }
      };
      $('.rs').onclick = newGame;
      newGame();
      return () => { clearInterval(timer); try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
