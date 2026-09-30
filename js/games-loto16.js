// Lô tô Việt Nam – bộ 16 vé (chuyển từ bản HTML độc lập sang khung GameVui)
(function () {
  const pad = n => String(n).padStart(2, '0');
  // Vé 9x9: mỗi hàng 5 số + 4 ô trống, cột 1 = 1-9, cột 2 = 10-19 ... cột 9 = 80-90 (0 = ô trống).
  // Hai vé cùng màu tạo thành một cặp chia đôi trọn bộ 1..90, nên không trùng số với nhau.
  const colPool = c => { const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9; return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i); };
  function buildTicket(counts, nums) {
    const need = counts.slice(), rows = [];
    for (let r = 0; r < 9; r++) {
      const cols = GV.shuffle([...Array(9).keys()]).sort((x, y) => need[y] - need[x]).slice(0, 5);
      cols.forEach(c => need[c]--); rows.push(new Set(cols));
    }
    const t = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let c = 0; c < 9; c++) { const v = nums[c].slice().sort((x, y) => x - y); let k = 0; for (let r = 0; r < 9; r++) if (rows[r].has(c)) t[r][c] = v[k++]; }
    return t;
  }
  function makePair() {
    // Cột 1 chỉ có 9 số, cột 9 có 11 số => một vé lấy 4 số ở cột 1 và 6 số ở cột 9, vé kia 5 và 5.
    let ca = [4, 5, 5, 5, 5, 5, 5, 5, 6], cb = Array(9).fill(5);
    if (Math.random() < .5) [ca, cb] = [cb, ca];
    const na = [], nb = [];
    for (let c = 0; c < 9; c++) { const p = GV.shuffle(colPool(c)); na.push(p.slice(0, ca[c])); nb.push(p.slice(ca[c])); }
    return [buildTicket(ca, na), buildTicket(cb, nb)];
  }
  // 16 vé = 8 cặp; vé 2j và 2j+1 cùng màu nên không trùng số.
  // k vé (1..16): ghép theo cặp cùng màu nằm cạnh nhau (vé 2j và 2j+1); k lẻ thì vé cuối chỉ có một mình một màu.
  function makeTickets(k = 16) { k = Math.max(1, Math.min(16, k | 0)); const out = []; for (let i = 0; i < Math.ceil(k / 2); i++) out.push(...makePair()); return out.slice(0, k); }
  const COLORS = ['#f4a9a9', '#f8c391', '#f6de86', '#cde595', '#96d8b0', '#a3cdf3', '#cbb0e8', '#f4aed2']; // pastel nhẹ

  // Vẽ danh sách vé (dùng chung cho bản chơi một máy và bản online)
  function ticketsHTML(tickets, called, won, marked) {
    // marked = Set('ticket:số') -> chế độ tự dò (người chơi tự bấm); không có -> tự tô theo số đã gọi
    return tickets.map((t, i) => {
      const blocks = [0, 3, 6].map(g => `<div class="blk">${t.slice(g, g + 3).map(row => {
        const isOn = n => marked ? marked.has(i + ':' + n) : called.has(n);
        const full = !marked && row.filter(n => n && isOn(n)).length === 4; // chế độ tự dò: không gợi ý
        return row.map(n => n ? `<div class="n ${isOn(n) ? 'c' : ''} ${full && !isOn(n) ? 'rw' : ''}" data-t="${i}" data-n="${n}">${n}</div>` : '<div></div>').join('');
      }).join('')}</div>`).join('');
      return `<div class="tk ${won && won.has(i) ? 'win' : ''}" style="--tc:${COLORS[(i >> 1) % COLORS.length]}"><div class="tt"><span>TRÒ CHƠI GIẢI TRÍ · VÉ ${pad(i + 1)}</span><span>LÔ TÔ</span></div>${blocks}<div class="tf"><span>9 hàng × 5 số · cùng màu không trùng số</span><span>Việt Nam</span></div></div>`;
    }).join('');
  }

  // Đọc số: vi / en / ja (giọng của thiết bị)
  const LANG = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP' };
  function speak(n, lang) {
    if (!LANG[lang] || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(String(n)); u.lang = LANG[lang]; u.rate = .9;
      const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  // iOS chỉ cho đọc sau khi người dùng đã chạm: gọi hàm này trong sự kiện bấm nút
  function unlockSpeech() { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
  GV.lotoSpeak = speak; GV.lotoUnlock = unlockSpeech;

  const CSS = `
  .l16{width:100%;display:grid;grid-template-columns:270px 1fr;gap:16px;align-items:start;--red:#d62828;--gold:#f5c542}
  .l16 .pn{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:14px}
  .l16 .cur{text-align:center;border:2px solid var(--gold)}
  .l16 .cur .lb{font-size:12px;font-weight:800;color:var(--mut);letter-spacing:.05em}
  .l16 .cur .no{font-size:64px;line-height:1;font-weight:900;color:#ff5c6c;margin:8px 0}
  .l16 .side{display:flex;flex-direction:column;gap:12px}
  .l16 .hist,.l16 .pool{display:grid;gap:4px;margin-top:8px}
  .l16 .hist{grid-template-columns:repeat(6,1fr)}.l16 .pool{grid-template-columns:repeat(10,1fr)}
  .l16 .hist span,.l16 .pool span{display:flex;align-items:center;justify-content:center;border-radius:6px;height:28px;font-weight:800;font-size:12px;background:var(--inp);border:1px solid var(--line)}
  .l16 .hist span.lt{background:var(--red);color:#fff;border-color:var(--red)}
  .l16 .pool span.on{background:#e53935;color:#fff;border-color:#e53935}
  .l16 .st{margin-top:10px;font-size:13px;color:var(--mut)}
  .l16 .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap}
  .l16 .head h3{margin:0}
  .l16 .vb button{padding:5px 10px;border:1px solid var(--line);background:var(--card2);color:var(--fg);border-radius:8px;cursor:pointer;margin-left:4px}
  .l16 .vb button.on{background:var(--acc);color:#fff}
  .l16 .tks{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .l16 .tk{--tc:#f4a9a9;--td:color-mix(in srgb,var(--tc) 55%,#4a3030);container-type:inline-size;background:#fff;color:#111;border:3px solid var(--td);border-radius:8px;padding:6px}
  .l16 .tk.win{box-shadow:0 0 0 4px #86efac,0 6px 20px #16a34a66;outline:3px solid #16a34a}
  .l16 .tt{display:flex;justify-content:space-between;color:var(--td);font-size:clamp(9px,3.4cqw,13px);font-weight:900;letter-spacing:.03em;padding:0 2px 4px}
  .l16 .blk{display:grid;grid-template-columns:repeat(9,1fr);border-top:2px solid var(--td);border-left:2px solid var(--td)}
  .l16 .blk+.blk{margin-top:2.2cqw}
  .l16 .blk div{aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;border-right:2px solid var(--td);border-bottom:2px solid var(--td);font-size:6.2cqw;font-weight:900;font-family:Impact,"Arial Narrow",Arial,sans-serif;background:var(--tc);cursor:default;user-select:none}
  .l16 .blk div.n{background:#fff;color:#111;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  .l16 .blk div.n.c{background:#111;color:#fff;border-radius:30%;box-shadow:inset 0 0 0 2px #fff}
  .l16 .blk div.n.rw{box-shadow:inset 0 0 0 3px #ff9f43}
  .l16 .tf{display:flex;justify-content:space-between;margin-top:4px;font-size:clamp(8px,2.8cqw,11px);color:var(--td);font-weight:700}
  .l16 .modal{position:fixed;inset:0;background:#000a;display:none;align-items:center;justify-content:center;z-index:50}
  .l16 .modal.show{display:flex}
  .l16 .mc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px;text-align:center;min-width:280px;max-width:90vw}
  .l16 .mc .big{color:var(--ok);font-size:3rem}
  @media(max-width:1000px){.l16{grid-template-columns:1fr}}
  @media(max-width:520px){.l16 .tks{grid-template-columns:1fr}}
  @media print{
    body *{visibility:hidden}
    .l16 .tks,.l16 .tks *{visibility:visible}
    .l16 .tks{position:absolute;left:0;top:0;width:100%;grid-template-columns:repeat(2,1fr)!important;gap:8px}
    .l16 .tk{break-inside:avoid;box-shadow:none!important}
  }`;

  GV.lotoCSS = CSS; GV.lotoTicketsHTML = ticketsHTML; GV.lotoMakeTickets = makeTickets;

  GV.register({
    id: 'loto16', type: 'game', cat: 'Gia đình', name: 'Lô tô 16 vé', icon: '🎤', desc: 'Bộ 16 vé, gọi số ngẫu nhiên, có thể in vé.',
    mount(el) {
      el.innerHTML = `<style>${CSS}</style>
      <div class="l16">
        <aside class="side">
          <section class="pn cur"><div class="lb">SỐ VỪA GỌI</div><div class="no">--</div>
            <div class="row"><button class="btn draw">🎲 Gọi số tiếp</button><button class="btn ghost auto">▶ Tự động</button></div>
            <div class="row" style="margin-top:8px"><label>Tốc độ <select class="sp"><option value="4000">Chậm</option><option value="2500" selected>Vừa</option><option value="1200">Nhanh</option></select></label><label><input type="checkbox" class="say"> 🔊 Đọc số</label></div>
            <div class="st">Sẵn sàng bắt đầu ván mới.</div></section>
          <section class="pn"><b>📜 Lịch sử gọi số</b><div class="hist"></div></section>
          <section class="pn"><b>🔢 Bảng số 1–90</b><div class="pool"></div></section>
        </aside>
        <section>
          <div class="head"><h3>🎫 Bộ vé 16 tờ</h3>
            <div><span class="vb">Cột: ${[1, 2, 3, 4].map(n => `<button data-n="${n}" class="${n === 2 ? 'on' : ''}">${n}</button>`).join('')}</span>
            <button class="btn ghost print" style="padding:5px 10px">🖨️ In vé</button><button class="btn ghost rs" style="padding:5px 10px">🔄 Ván mới</button></div></div>
          <div class="tks"></div>
        </section>
        <div class="modal"><div class="mc"><div class="big">🎉 KINH!</div><h3 class="wt"></h3><button class="btn ok close">Tiếp tục chơi</button></div></div>
      </div>`;
      const $ = s => el.querySelector(s);
      let called, hist, tickets, won, timer, auto;

      function say(n) {
        if (!$('.say').checked || !window.speechSynthesis) return;
        try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(n)); u.lang = 'vi-VN'; u.rate = .9; speechSynthesis.speak(u); } catch (e) {}
      }
      function renderTickets() { $('.tks').innerHTML = ticketsHTML(tickets, called, won); }
      function renderSide() {
        $('.hist').innerHTML = hist.slice(0, 24).map((n, i) => `<span class="${i ? '' : 'lt'}">${pad(n)}</span>`).join('');
        $('.pool').innerHTML = Array.from({ length: 90 }, (_, i) => `<span class="${called.has(i + 1) ? 'on' : ''}">${i + 1}</span>`).join('');
        $('.no').textContent = hist.length ? pad(hist[0]) : '--';
        $('.st').innerHTML = hist.length ? `Đã gọi <b>${called.size}/90</b> số${won.size ? ` · 🏆 ${won.size} vé đã kinh` : ''}` : 'Sẵn sàng bắt đầu ván mới.';
      }
      function check() {
        const fresh = [];
        tickets.forEach((t, i) => { if (!won.has(i) && t.some(row => row.filter(Boolean).every(n => called.has(n)))) { won.add(i); fresh.push(i + 1); } });
        if (fresh.length) {
          $('.wt').textContent = 'Vé ' + fresh.map(n => '#' + pad(n)).join(', ') + ' đã hoàn thành một hàng!';
          $('.modal').classList.add('show'); stopAuto(); GV.beep(880, 400);
        }
      }
      function draw() {
        if (called.size >= 90) { stopAuto(); $('.st').textContent = 'Đã gọi hết 90 số!'; return; }
        let n; do { n = 1 + GV.rnd(90); } while (called.has(n));
        called.add(n); hist.unshift(n); GV.beep(400 + n * 4, 90); say(n);
        check(); renderTickets(); renderSide();
      }
      function stopAuto() { clearInterval(timer); auto = false; $('.auto').textContent = '▶ Tự động'; }
      function startAuto() { clearInterval(timer); auto = true; $('.auto').textContent = '⏸ Dừng'; timer = setInterval(draw, +$('.sp').value); }
      function newGame() {
        stopAuto(); called = new Set(); hist = []; won = new Set(); tickets = makeTickets();
        $('.modal').classList.remove('show'); renderTickets(); renderSide();
      }
      $('.draw').onclick = draw;
      $('.auto').onclick = () => auto ? stopAuto() : (draw(), $('.modal').classList.contains('show') || startAuto());
      $('.sp').onchange = () => auto && startAuto();
      $('.rs').onclick = newGame;
      $('.close').onclick = () => $('.modal').classList.remove('show');
      $('.print').onclick = () => window.print();
      el.querySelector('.vb').onclick = e => { const n = e.target.dataset.n; if (n) { $('.tks').style.gridTemplateColumns = `repeat(${n},1fr)`; el.querySelectorAll('.vb button').forEach(b => b.classList.toggle('on', b === e.target)); } };
      newGame();
      return () => { clearInterval(timer); try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
