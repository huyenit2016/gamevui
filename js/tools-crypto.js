// AI-Agent phân tích thị trường crypto: lấy giá công khai Binance, tính chỉ báo kỹ thuật ngay trên máy, chấm điểm quét coin,
// gợi ý điểm vào/chốt lời/cắt lỗ/đòn bẫy theo ATR + quản trị rủi ro; tuỳ chọn nhờ AI (khoá của người dùng) viết nhận định. Chỉ mang tính tham khảo.
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com'];
  const TFS = { '15m': '15 phút', '1h': '1 giờ', '4h': '4 giờ', '1d': '1 ngày' };
  const STABLE = /^(USDC|FDUSD|TUSD|USDP|DAI|BUSD|EUR|GBP|TRY|BRL|UST|USDE|XUSD|AEUR|EURI|USD1)$/;

  /* ---------- chỉ báo ---------- */
  const sma = (a, n) => a.map((_, i) => i + 1 < n ? null : a.slice(i + 1 - n, i + 1).reduce((s, x) => s + x, 0) / n);
  function ema(a, n) { const k = 2 / (n + 1), o = []; let p = null; a.forEach((x, i) => { if (i + 1 < n) { o.push(null); return; } p = p == null ? a.slice(0, n).reduce((s, y) => s + y, 0) / n : x * k + p * (1 - k); o.push(p); }); return o; }
  function rsi(c, n = 14) {
    const o = c.map(() => null); if (c.length <= n) return o; let g = 0, l = 0;
    for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; d >= 0 ? g += d : l -= d; } g /= n; l /= n; o[n] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    return o;
  }
  function macd(c) { const f = ema(c, 12), s = ema(c, 26), m = c.map((_, i) => f[i] != null && s[i] != null ? f[i] - s[i] : null), idx = m.findIndex(x => x != null); const sig = m.map(() => null); if (idx >= 0) { const e = ema(m.slice(idx), 9); e.forEach((x, i) => { sig[idx + i] = x; }); } return { m, sig, h: m.map((x, i) => x != null && sig[i] != null ? x - sig[i] : null) }; }
  function bb(c, n = 20, k = 2) { const mid = sma(c, n); return mid.map((m, i) => { if (m == null) return null; const w = c.slice(i + 1 - n, i + 1), sd = Math.sqrt(w.reduce((s, x) => s + (x - m) * (x - m), 0) / n); return { m, u: m + k * sd, l: m - k * sd }; }); }
  function atr(k, n = 14) {
    const o = k.map(() => null); if (k.length <= n) return o; const tr = k.map((x, i) => i === 0 ? x.h - x.l : Math.max(x.h - x.l, Math.abs(x.h - k[i - 1].c), Math.abs(x.l - k[i - 1].c)));
    let p = tr.slice(1, n + 1).reduce((s, x) => s + x, 0) / n; o[n] = p; for (let i = n + 1; i < k.length; i++) { p = (p * (n - 1) + tr[i]) / n; o[i] = p; } return o;
  }
  // đỉnh/đáy xoay (swing) để làm kháng cự/hỗ trợ
  function swings(k, w = 4) { const hi = [], lo = []; for (let i = w; i < k.length - w; i++) { let h = true, l = true; for (let j = i - w; j <= i + w; j++) { if (k[j].h > k[i].h) h = false; if (k[j].l < k[i].l) l = false; } if (h) hi.push({ i, p: k[i].h }); if (l) lo.push({ i, p: k[i].l }); } return { hi, lo }; }

  /* ---------- phân tích 1 coin ---------- */
  function analyze(k, opt = {}) {
    if (!k || k.length < 60) return null;
    const c = k.map(x => x.c), n = c.length - 1, px = c[n];
    const e20 = ema(c, 20), e50 = ema(c, 50), e200 = c.length >= 200 ? ema(c, 200) : c.map(() => null), R = rsi(c), M = macd(c), B = bb(c), A = atr(k), S = swings(k);
    const vol = k.map(x => x.v), vAvg = sma(vol, 20)[n - 1] || vol[n], vr = vol[n] / (vAvg || 1);
    const atrv = A[n] || px * 0.01, atrPct = atrv / px * 100;
    const sup = S.lo.map(x => x.p).filter(p => p < px).sort((a, b) => b - a), res = S.hi.map(x => x.p).filter(p => p > px).sort((a, b) => a - b);
    const why = []; let sc = 0; const add = (v, t) => { sc += v; why.push({ v, t }); };
    // xu hướng
    if (e50[n] != null) { if (px > e50[n]) add(10, 'Giá nằm trên EMA50'); else add(-10, 'Giá nằm dưới EMA50'); }
    if (e20[n] != null && e50[n] != null) { if (e20[n] > e50[n]) add(10, 'EMA20 cắt lên trên EMA50 (xu hướng tăng ngắn hạn)'); else add(-10, 'EMA20 nằm dưới EMA50 (xu hướng giảm ngắn hạn)'); }
    if (e200[n] != null) { if (px > e200[n]) add(10, 'Giá trên EMA200 (nền xu hướng dài hạn tăng)'); else add(-10, 'Giá dưới EMA200 (nền xu hướng dài hạn giảm)'); }
    // động lượng
    const h = M.h[n], hp = M.h[n - 1];
    if (h != null && hp != null) { if (h > 0 && h >= hp) add(15, 'MACD dương và histogram đang mở rộng'); else if (h > 0) add(6, 'MACD dương nhưng đang suy yếu'); else if (h < 0 && h <= hp) add(-15, 'MACD âm và histogram đang mở rộng'); else add(-6, 'MACD âm nhưng đang hồi'); }
    const r = R[n];
    if (r != null) { if (r >= 80) add(-12, `RSI ${r.toFixed(0)}: quá mua mạnh, dễ điều chỉnh`); else if (r >= 55) add(10, `RSI ${r.toFixed(0)}: lực mua chiếm ưu thế`); else if (r <= 20) add(12, `RSI ${r.toFixed(0)}: quá bán mạnh, dễ hồi kỹ thuật`); else if (r <= 45) add(-10, `RSI ${r.toFixed(0)}: lực bán chiếm ưu thế`); else add(0, `RSI ${r.toFixed(0)}: trung tính`); }
    const b = B[n];
    if (b) { const pos = (px - b.l) / ((b.u - b.l) || 1); if (pos > 1) add(-6, 'Giá vượt dải Bollinger trên (căng, dễ rút chân)'); else if (pos < 0) add(6, 'Giá thủng dải Bollinger dưới (có thể hồi)'); else if (pos > 0.5) add(5, 'Giá ở nửa trên dải Bollinger'); else add(-5, 'Giá ở nửa dưới dải Bollinger'); }
    // khối lượng xác nhận hướng nến
    const up = k[n].c >= k[n].o; if (vr > 1.5) add(up ? 10 : -10, `Khối lượng gấp ${vr.toFixed(1)} lần trung bình, nến ${up ? 'xanh' : 'đỏ'} xác nhận`);
    sc = Math.max(-100, Math.min(100, Math.round(sc * 100 / 77)));
    const side = sc >= 35 ? 'LONG' : sc <= -35 ? 'SHORT' : 'CHỜ';
    const dir = sc >= 0 ? 1 : -1; // vẫn tính kế hoạch tham khảo theo hướng nghiêng
    // kế hoạch lệnh
    const entry = px, buf = 0.2 * atrv;
    let sl = dir > 0 ? Math.min(px - 1.5 * atrv, (sup[0] != null ? sup[0] - buf : Infinity)) : Math.max(px + 1.5 * atrv, (res[0] != null ? res[0] + buf : -Infinity));
    if (dir > 0 && sl > px - 1.0 * atrv) sl = px - 1.0 * atrv; if (dir < 0 && sl < px + 1.0 * atrv) sl = px + 1.0 * atrv;
    const risk = Math.abs(entry - sl), tp = [1.5, 2.5, 4].map(m => entry + dir * risk * m);
    const slPct = risk / entry * 100;
    const cap = +opt.capital || 1000, rp = +opt.riskPct || 1, riskUsd = cap * rp / 100, notional = riskUsd / (slPct / 100);
    const levNeed = Math.max(1, Math.ceil(notional / cap)), levSafe = Math.max(1, Math.floor(66 / slPct)), levAuto = Math.min(levNeed, levSafe, 20), lev = +opt.lev > 0 ? Math.round(+opt.lev) : levAuto;
    // đòn bẫy người dùng tự chọn: khối lượng bị giới hạn bởi vốn × đòn bẫy → lỗ thực tế khi chạm SL có thể nhỏ hơn mức rủi ro đặt ra
    const notionalUsed = Math.min(notional, cap * lev), liq = entry * (1 - dir * (0.9 / lev));
    const nearRes = dir > 0 ? res[0] : sup[0];
    return {
      px, side, score: sc, dir, why, rsi: r, macdH: h, atr: atrv, atrPct, volRatio: vr,
      ema20: e20[n], ema50: e50[n], ema200: e200[n], bb: b, sup: sup.slice(0, 3), res: res.slice(0, 3),
      plan: { entry, sl, tp, slPct, rr: [1.5, 2.5, 4], lev, levAuto, manual: +opt.lev > 0, levSafe, levNeed, notional: notionalUsed, margin: notionalUsed / lev, riskUsd, loss: notionalUsed * slPct / 100, liq, liqFirst: dir > 0 ? liq >= sl : liq <= sl, nearLevel: nearRes },
      series: { e20, e50, e200, B }
    };
  }

  /* ---------- dữ liệu ---------- */
  async function jget(path) {
    let err;
    for (const h of HOSTS) { try { const r = await fetch(h + path); if (r.ok) return await r.json(); err = new Error('HTTP ' + r.status); } catch (e) { err = e; } }
    throw err || new Error('Không tải được dữ liệu');
  }
  // r[6] = giờ đóng nến: bỏ nến đang chạy dở (chưa đóng) để chỉ báo không đổi liên tục; vào lệnh tính theo giá nến đã đóng gần nhất
const klines = async (sym, tf, lim = 250) => (await jget(`/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${lim}`)).filter(r => !r[6] || +r[6] < Date.now()).map(r => ({ t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] }));
  async function topPairs(n) {
    const all = await jget('/api/v3/ticker/24hr');
    return all.filter(t => /USDT$/.test(t.symbol) && !/(UP|DOWN|BULL|BEAR)USDT$/.test(t.symbol) && !STABLE.test(t.symbol.replace(/USDT$/, ''))).sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, n)
      .map(t => ({ sym: t.symbol, base: t.symbol.replace(/USDT$/, ''), price: +t.lastPrice, chg: +t.priceChangePercent, qv: +t.quoteVolume }));
  }
  const fmt = p => p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 1 }) : p >= 1 ? p.toFixed(3) : p >= 0.01 ? p.toFixed(5) : p.toPrecision(4);
  const money = v => v >= 1e9 ? (v / 1e9).toFixed(1) + ' tỷ$' : v >= 1e6 ? (v / 1e6).toFixed(0) + ' tr$' : Math.round(v) + '$';

  /* ---------- biểu đồ nến ---------- */
  function draw(cv, k, a) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = (cv.parentNode && cv.parentNode.clientWidth - 24) || 640, H = W < 500 ? 230 : 300; cv.width = W * dpr; cv.height = H * dpr;
    // CSS toàn cục khi đang chơi trên mobile ép canvas width:auto → đặt kích thước cố định với !important
    cv.style.setProperty('width', W + 'px', 'important'); cv.style.setProperty('height', H + 'px', 'important'); cv.style.setProperty('max-height', 'none', 'important'); cv.style.setProperty('max-width', '100%', 'important'); const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const N = Math.min(80, k.length), off = k.length - N, d = k.slice(off); let lo = Math.min(...d.map(x => x.l)), hi = Math.max(...d.map(x => x.h));
    if (a) [a.plan.sl, a.plan.tp[2]].forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); const pad = (hi - lo) * 0.05; lo -= pad; hi += pad;
    const X = i => 8 + (i + 0.5) * (W - 70) / N, Y = v => H - 8 - (v - lo) / (hi - lo) * (H - 16), cw = Math.max(2, (W - 70) / N * 0.62);
    g.fillStyle = 'rgba(128,128,128,.06)'; g.fillRect(0, 0, W, H);
    d.forEach((x, i) => { const up = x.c >= x.o; g.strokeStyle = g.fillStyle = up ? '#2ecc71' : '#ef5350'; g.beginPath(); g.moveTo(X(i), Y(x.h)); g.lineTo(X(i), Y(x.l)); g.stroke(); const y1 = Y(Math.max(x.o, x.c)), y2 = Y(Math.min(x.o, x.c)); g.fillRect(X(i) - cw / 2, y1, cw, Math.max(1, y2 - y1)); });
    if (a) {
      const line = (arr, col) => { g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); let st = false; arr.slice(off).forEach((v, i) => { if (v == null) return; st ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)); st = true; }); g.stroke(); g.lineWidth = 1; };
      line(a.series.e20, '#4fc3f7'); line(a.series.e50, '#ffb74d'); line(a.series.e200, '#ba68c8');
      const hl = (v, col, t) => { g.strokeStyle = col; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, Y(v)); g.lineTo(W - 62, Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = col; g.font = '11px sans-serif'; g.fillText(t, W - 60, Y(v) + 4); };
      hl(a.plan.entry, '#90a4ae', 'Vào'); hl(a.plan.sl, '#ef5350', 'SL'); a.plan.tp.forEach((v, i) => hl(v, '#2ecc71', 'TP' + (i + 1)));
    }
  }

  /* ---------- giao diện ---------- */
  GV.register({
    id: 'crypto-agent', type: 'tool', cat: 'Tính toán', name: 'AI-Agent phân tích crypto', icon: '📈', desc: 'Quét top coin Binance, phân tích kỹ thuật (EMA, RSI, MACD, Bollinger, ATR), gợi ý điểm vào, chốt lời, cắt lỗ và đòn bẫy theo quản trị rủi ro. Chỉ tham khảo.',
    mount(el) {
      const S = Object.assign({ tf: '4h', capital: 1000, riskPct: 1, n: 30, sel: 'BTCUSDT' }, GV.store.get('cryptoagent', {}));
      let rows = [], cur = null, curK = null, busy = false, dead = false;
      el.innerHTML = `<style>
.cx{width:100%;max-width:980px;min-width:0;margin:0 auto;text-align:left;box-sizing:border-box}.cx *{min-width:0}.cxg>*{min-width:0}.cx h2{margin:.2em 0}.cxw{background:rgba(255,183,77,.12);border:1px solid rgba(255,183,77,.4);border-radius:12px;padding:10px 12px;font-size:.85rem;margin:8px 0}
.cxbar{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:10px 0}.cxbar label{display:flex;flex-direction:column;font-size:.78rem;gap:2px}.cxbar input,.cxbar select{padding:6px 8px;width:96px;font-size:16px}/* ≥16px để iOS không tự phóng to/cuộn trang khi chạm ô nhập */
.cxg{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:14px}@media(max-width:760px){.cxg{grid-template-columns:1fr}}
.cxbox{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px}.cxlist{max-height:430px;overflow:auto}
.cxr{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:7px 6px;border-bottom:1px solid var(--line);cursor:pointer;border-radius:8px}.cxr:hover,.cxr.on{background:rgba(120,120,255,.12)}
.cxs{font-weight:700;padding:2px 8px;border-radius:999px;font-size:.78rem}.cxs.L{background:rgba(46,204,113,.2);color:#2ecc71}.cxs.S{background:rgba(239,83,80,.2);color:#ef5350}.cxs.W{background:rgba(150,150,150,.2)}
.cxk{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:8px 0}.cxk div{background:rgba(128,128,128,.1);border-radius:10px;padding:8px}.cxk small{display:block;opacity:.7;font-size:.72rem}.cxk b{font-size:1rem}.cxk select{width:100%;font-size:16px;font-weight:700;padding:2px 4px;margin-top:2px}
.cxup{color:#2ecc71}.cxdn{color:#ef5350}.cxwhy li{margin:3px 0;font-size:.86rem}.cxlog{white-space:pre-wrap;font-size:.74rem;max-height:320px;overflow:auto;background:rgba(128,128,128,.1);border-radius:10px;padding:8px;word-break:break-word}.cxai{white-space:pre-wrap;font-size:.9rem;line-height:1.5}.cx canvas{width:100%;height:300px;display:block;border-radius:10px}
.cxtop{display:flex;align-items:center;justify-content:space-between;gap:8px}.cxtop h2{font-size:1.1rem;margin:0}.cxmsg{margin:2px 0;font-size:.74rem}.cxset{margin:6px 0}.cxset summary{cursor:pointer;font-size:.85rem;opacity:.85;padding:4px 0}
.cxpick{display:flex;gap:6px;margin:6px 0}.cxpick input{flex:1;padding:7px 10px;font-size:16px;text-transform:uppercase}.cxpick input::placeholder{text-transform:none}
.cxtb{display:flex;gap:4px;margin:8px 0;border-bottom:1px solid var(--line)}.cxtb button{flex:1;background:none;border:0;border-bottom:2px solid transparent;color:inherit;padding:8px 2px;font:inherit;font-size:.85rem;cursor:pointer;opacity:.7}.cxtb button.on{opacity:1;border-color:var(--acc,#8b8bff);font-weight:700}
.cxp{display:none}.cxp.on{display:block}
@media(max-width:760px){
.cx{padding:0}.cxbar{margin:4px 0;gap:6px}.cxbar label{flex:1;min-width:70px}.cxbar input,.cxbar select{width:100%;padding:5px 6px}
.cxg{gap:8px}.cxbox{padding:8px 8px;border-radius:12px}.cxlisth{display:none}
.cxlist{max-height:none;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding-bottom:4px;-webkit-overflow-scrolling:touch}
.cxr{display:flex;flex:none;flex-direction:column;align-items:center;gap:1px;border:1px solid var(--line);border-bottom:1px solid var(--line);padding:5px 9px;min-width:64px;border-radius:10px}.cxr .cxinfo{display:none}.cxr .cxs{font-size:.66rem;padding:1px 6px}.cxr.on{border-color:var(--acc,#8b8bff)}
.cxk{grid-template-columns:repeat(3,1fr);gap:6px}.cxk div{padding:6px}.cxk b{font-size:.92rem}.cxk small{font-size:.66rem}
.cxdet h3{font-size:1rem}.cx canvas{height:230px}}

</style><div class="cx"><div class="cxtop"><h2>📈 AI-Agent crypto</h2><button class="btn scan">🔍 Quét</button></div>
<div class="cxpick"><input class="cs" list="cxdl" placeholder="Nhập coin: BTC, PEPE, SOL…" autocapitalize="characters" autocomplete="off" spellcheck="false"><datalist id="cxdl"></datalist><button class="btn cgo">Phân tích</button></div>
<details class="cxset" ${innerWidth > 760 ? 'open' : ''}><summary class="cxsum"></summary><div class="cxbar"><label>Khung nến<select class="tf">${Object.keys(TFS).map(t => `<option value="${t}" ${t === S.tf ? 'selected' : ''}>${TFS[t]}</option>`).join('')}</select></label>
<label>Số coin<select class="nn">${[15, 30, 50].map(t => `<option ${t === S.n ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
<label>Vốn (USDT)<input class="cap" type="number" min="10" value="${S.capital}"></label><label>Rủi ro/lệnh (%)<input class="rk" type="number" min="0.1" max="10" step="0.1" value="${S.riskPct}"></label></div></details><div class="cxmsg hint" role="status"></div>
<div class="cxg"><div class="cxbox"><div class="cxlisth"><b>Xếp hạng cơ hội</b> <span class="hint">(điểm −100…+100)</span></div><div class="cxlist"></div></div><div class="cxbox cxdet"><div class="hint">Bấm "Quét thị trường" rồi chọn 1 coin để xem kế hoạch lệnh chi tiết.</div></div></div></div>`;
      const msg = t => { if (!dead) $(el, '.cxmsg').textContent = t || ''; };
      const sideCls = s => s === 'LONG' ? 'L' : s === 'SHORT' ? 'S' : 'W';
      const save = () => GV.store.set('cryptoagent', S);
      function readOpts() { S.tf = $(el, '.tf').value; S.n = +$(el, '.nn').value; S.capital = Math.max(10, +$(el, '.cap').value || 1000); S.riskPct = Math.min(10, Math.max(0.1, +$(el, '.rk').value || 1)); save(); sum(); }
      const sum = () => { $(el, '.cxsum').textContent = `⚙️ ${TFS[S.tf]} · ${S.n} coin · vốn ${S.capital}$ · rủi ro ${S.riskPct}%`; };
      function renderList() {
        const L = $(el, '.cxlist'), dl = $(el, '#cxdl'); if (dl) dl.innerHTML = rows.map(r => `<option value="${esc(r.base)}">`).join(''); if (!rows.length) { L.innerHTML = ''; return; }
        L.innerHTML = rows.map(r => `<div class="cxr ${r.sym === S.sel ? 'on' : ''}" data-s="${esc(r.sym)}"><div><b>${esc(r.base)}</b> <span class="hint cxinfo">${fmt(r.price)} · ${r.chg >= 0 ? '+' : ''}${r.chg.toFixed(1)}% · ${money(r.qv)}</span></div><span class="cxs ${sideCls(r.a.side)}">${r.a.side}</span><b class="${r.a.score >= 0 ? 'cxup' : 'cxdn'}">${r.a.score > 0 ? '+' : ''}${r.a.score}</b></div>`).join('');
      }
      function renderDet() {
        const D = $(el, '.cxdet'), a = cur; if (!a) return; const p = a.plan, base = S.sel.replace(/USDT$/, ''), long = a.dir > 0;
        D.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">${esc(base)}/USDT · ${TFS[S.tf]}</h3><span class="cxs ${sideCls(a.side)}" style="font-size:.95rem">${a.side} · ${a.score > 0 ? '+' : ''}${a.score}</span></div>
<div class="cxtb"><button data-p="plan" class="on">Kế hoạch</button><button data-p="chart">Biểu đồ</button><button data-p="why">Lý do</button><button data-p="ai">AI · Log</button></div>
<div class="cxp on" data-p="plan">${a.side === 'CHỜ' ? `<div class="cxw">Chưa đủ rõ (|điểm| &lt; 35) → <b>nên chờ</b>. Kế hoạch dưới chỉ để tham khảo (${long ? 'LONG' : 'SHORT'}).</div>` : ''}
<div class="cxk"><div><small>Giá hiện tại</small><b>${fmt(a.px)}</b></div><div><small>Vào (${long ? 'Long' : 'Short'})</small><b>${fmt(p.entry)}</b></div><div><small>Cắt lỗ −${p.slPct.toFixed(2)}%</small><b class="cxdn">${fmt(p.sl)}</b></div>
${p.tp.map((v, i) => `<div><small>TP${i + 1} (1:${p.rr[i]})</small><b class="cxup">${fmt(v)}</b></div>`).join('')}
<div><small>Đòn bẫy${p.manual ? ' (tự chọn)' : ' gợi ý'}</small><select class="lvsel"><option value="0">Tự động · ${p.levAuto}x</option>${[1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125].map(v => `<option value="${v}" ${p.manual && v === p.lev ? 'selected' : ''}>${v}x</option>`).join('')}</select></div><div><small>Khối lượng</small><b>${money(p.notional)}</b></div><div><small>Ký quỹ</small><b>${p.margin.toFixed(1)}$</b></div><div><small>Lỗ nếu chạm SL</small><b class="cxdn">−${p.loss.toFixed(1)}$</b></div><div><small>Thanh lý ~</small><b>${fmt(p.liq)}</b></div></div>
${p.liqFirst ? `<div class="cxw" style="background:rgba(239,83,80,.14);border-color:rgba(239,83,80,.5)">⚠️ Với ${p.lev}x, giá thanh lý (${fmt(p.liq)}) đến <b>trước</b> điểm cắt lỗ → bị thanh lý mất ký quỹ trước khi SL kịp chạy. Hãy giảm đòn bẫy (an toàn ≤ ${p.levSafe}x).</div>` : p.manual && p.lev > p.levSafe ? `<div class="cxw">Đòn bẫy ${p.lev}x cao hơn mức an toàn ${p.levSafe}x: giá thanh lý khá sát SL.</div>` : ''}
<div class="hint">Gợi ý tự động = min(cần theo rủi ro ${S.riskPct}%: ${p.levNeed}x · an toàn: ${p.levSafe}x · trần 20x). SL sau hỗ trợ/kháng cự gần nhất hoặc 1,5×ATR (ATR ${a.atrPct.toFixed(2)}%).</div></div>
<div class="cxp" data-p="chart"><canvas></canvas><div class="hint">Đường: <span style="color:#4fc3f7">EMA20</span> · <span style="color:#ffb74d">EMA50</span> · <span style="color:#ba68c8">EMA200</span></div></div>
<div class="cxp" data-p="why"><ul class="cxwhy" style="margin:4px 0">${a.why.map(w => `<li class="${w.v > 0 ? 'cxup' : w.v < 0 ? 'cxdn' : ''}">${w.v > 0 ? '▲' : w.v < 0 ? '▼' : '•'} ${esc(w.t)} <span class="hint">(${w.v > 0 ? '+' : ''}${w.v})</span></li>`).join('')}</ul>
<div class="hint">Kháng cự gần: ${a.res.length ? a.res.map(fmt).join(' · ') : '—'} | Hỗ trợ gần: ${a.sup.length ? a.sup.map(fmt).join(' · ') : '—'} | RSI ${a.rsi != null ? a.rsi.toFixed(0) : '—'} · Vol ${a.volRatio.toFixed(1)}×</div></div>
<div class="cxp" data-p="ai"><div><button class="btn ai">🤖 Nhờ AI viết nhận định</button></div><div class="cxai box" style="display:none"></div>
<div style="margin-top:8px"><button class="btn ghost lg2">🧪 Ghi log kiểm tra chỉ báo</button></div><div class="cxlogbox" style="display:none"><pre class="cxlog"></pre><button class="btn ghost lgcp">📋 Sao chép</button> <button class="btn ghost lgdl">⬇️ Tải .txt</button></div>
<div class="cxaicfg">${GV.learn && GV.learn.ai ? GV.learn.ai.panelHTML() : ''}</div><div class="hint" style="margin-top:6px">Công cụ giáo dục, không phải lời khuyên đầu tư.</div></div>`;
        D.querySelectorAll('.cxtb button').forEach(b => { b.onclick = () => { D.querySelectorAll('.cxtb button,.cxp').forEach(x => x.classList.toggle('on', x.dataset.p === b.dataset.p)); if (b.dataset.p === 'chart') draw($(D, 'canvas'), curK, a); }; });
        $(D, '.lvsel').onchange = e => { S.lev = +e.target.value; save(); cur = analyze(curK, S); renderDet(); };
        if (GV.learn && GV.learn.ai && GV.learn.ai.bindPanel) GV.learn.ai.bindPanel($(D, '.cxaicfg'));
        $(D, '.ai').onclick = askAI; $(D, '.lg2').onclick = showLog;
      }
      // Log để đối chiếu: nến đầu vào (đã đóng), giá trị từng chỉ báo, từng điều kiện chấm điểm, kế hoạch lệnh
      function buildLog() {
        const a = cur, k = curK, T = GV.cryptoT, c = k.map(x => x.c), n = k.length - 1, f = (v, d = 6) => v == null ? '—' : (+v).toFixed(d), pad = x => String(x).padStart(2, '0');
        const dt = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
        const e = T.ema(c, 20), m = T.macd(c), r = T.rsi(c), A = T.atr(k), B = T.bb(c);
        const L = [`LOG KIỂM TRA CHỈ BÁO – ${S.sel} – khung ${S.tf} – tạo lúc ${new Date().toLocaleString('vi-VN')}`, `Số nến đã đóng: ${k.length} · nến cuối: ${dt(k[n].t)} (giờ máy bạn)`, '', '== 5 NẾN CUỐI (đối chiếu O/H/L/C/Vol với biểu đồ sàn) =='];
        k.slice(-5).forEach(x => L.push(`${dt(x.t)}  O ${f(x.o, 4)}  H ${f(x.h, 4)}  L ${f(x.l, 4)}  C ${f(x.c, 4)}  V ${f(x.v, 2)}`));
        L.push('', '== CHỈ BÁO TẠI NẾN CUỐI (TradingView mặc định: RMA cho RSI/ATR, EMA 12-26-9, BB 20 ±2) ==',
          `EMA20 ${f(a.ema20)} | EMA50 ${f(a.ema50)} | EMA200 ${f(a.ema200)}`, `RSI14 ${f(a.rsi, 2)} (nến trước: ${f(r[n - 1], 2)})`,
          `MACD ${f(m.m[n])} | Signal ${f(m.sig[n])} | Hist ${f(m.h[n])} (nến trước: ${f(m.h[n - 1])})`, `Bollinger20: trên ${f(a.bb && a.bb.u)} | giữa ${f(a.bb && a.bb.m)} | dưới ${f(a.bb && a.bb.l)}`,
          `ATR14 ${f(a.atr)} = ${f(a.atrPct, 3)}% giá | Khối lượng / TB20 = ${f(a.volRatio, 2)}`, `Hỗ trợ gần: ${a.sup.map(x => f(x, 4)).join(', ') || '—'} | Kháng cự gần: ${a.res.map(x => f(x, 4)).join(', ') || '—'}`);
        L.push('', '== CHẤM ĐIỂM (cộng/trừ từng điều kiện) ==');
        a.why.forEach(w => L.push(`${w.v >= 0 ? '+' : ''}${w.v}\t${w.t}`));
        L.push(`Tổng thô → quy đổi: ${a.score} → ${a.side}`, '', '== KẾ HOẠCH LỆNH ==', `Vào ${f(a.plan.entry, 4)} | SL ${f(a.plan.sl, 4)} (${f(a.plan.slPct, 2)}%) | TP ${a.plan.tp.map(x => f(x, 4)).join(' / ')}`,
          `Vốn ${S.capital} · rủi ro ${S.riskPct}% = ${f(a.plan.riskUsd, 2)} USDT · đòn bẫy cần ${a.plan.levNeed}x / an toàn ${a.plan.levSafe}x → dùng ${a.plan.lev}x`);
        // tự kiểm: các phép thử có đáp án biết trước
        const up = Array.from({ length: 60 }, (_, i) => 100 + i), flat = Array(60).fill(50), tests = [['RSI chuỗi tăng đều = 100', T.rsi(up)[59] === 100], ['RSI chuỗi phẳng ≈ 100 hoặc 50 (không NaN)', isFinite(T.rsi(flat)[59])], ['EMA chuỗi phẳng = giá trị đó', Math.abs(T.ema(flat, 20)[59] - 50) < 1e-9], ['Bollinger chuỗi phẳng: trên = dưới', Math.abs(T.bb(flat)[59].u - T.bb(flat)[59].l) < 1e-9]];
        L.push('', '== TỰ KIỂM (đáp án biết trước) ==', ...tests.map(t => (t[1] ? 'ĐẠT  ' : 'LỖI  ') + t[0]));
        return L.join('\n');
      }
      function showLog() { const box = $(el, '.cxlogbox'), txt = buildLog(); box.style.display = 'block'; $(el, '.cxlog').textContent = txt; console.log('[crypto-agent]\n' + txt); box.scrollIntoView && box.scrollIntoView({ block: 'nearest' });
        $(el, '.lgcp').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => GV.toast && GV.toast('Đã sao chép log'), () => { const r = document.createRange(); r.selectNodeContents($(el, '.cxlog')); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); GV.toast && GV.toast('Đã chọn log, hãy nhấn Copy'); }); };
        $(el, '.lgdl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = `log-${S.sel}-${S.tf}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }; }
      async function askAI() {
        const out = $(el, '.cxai'), a = cur, p = a.plan; out.style.display = 'block';
        if (!GV.learn || !GV.learn.ai || !GV.learn.ai.ready()) { out.textContent = 'Chưa có khoá AI. Mở "⚙️ Cài đặt AI" bên dưới, dán khoá rồi bấm lại.'; return; }
        out.textContent = 'AI đang phân tích…';
        const data = { coin: S.sel, khung: S.tf, gia: a.px, diem: a.score, tinHieu: a.side, rsi: a.rsi, macdHist: a.macdH, ema20: a.ema20, ema50: a.ema50, ema200: a.ema200, atrPct: a.atrPct, volRatio: a.volRatio, hoTro: a.sup, khangCu: a.res, keHoach: { vao: p.entry, sl: p.sl, tp: p.tp, donBay: p.lev, slPct: p.slPct }, lyDo: a.why.map(w => w.t) };
        try {
          out.textContent = await GV.learn.ai.chat([{ role: 'user', content: 'Dữ liệu kỹ thuật (JSON):\n' + JSON.stringify(data) }], { maxTokens: 1500, system: 'Bạn là chuyên gia phân tích kỹ thuật crypto, trả lời tiếng Việt, ngắn gọn (tối đa ~250 từ): 1) bức tranh xu hướng, 2) kịch bản vào lệnh và điều kiện xác nhận/huỷ kịch bản, 3) quản trị vốn & đòn bẫy hợp lý, 4) rủi ro chính. Chỉ dựa trên dữ liệu được cung cấp, không bịa tin tức, không hứa chắc thắng. Kết thúc bằng một câu nhắc đây không phải lời khuyên đầu tư.' });
        } catch (e) { out.textContent = 'Lỗi AI: ' + e.message; }
      }
      // Phân tích 1 coin do người dùng tự chọn (không cần quét cả thị trường)
      async function analyzeOne() {
        const inp = $(el, '.cs'); let sym = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!sym) { msg('Nhập mã coin, ví dụ BTC hoặc PEPE.'); return; }
        if (!/USDT$/.test(sym)) sym += 'USDT'; if (sym.length < 5) { msg('Mã coin chưa hợp lệ.'); return; }
        readOpts(); msg('Đang tải ' + sym + '…'); $(el, '.cgo').disabled = true;
        try {
          const k = await klines(sym, S.tf), a = analyze(k, S); if (!a) throw new Error('quá ít nến để phân tích');
          let t = {}; try { t = await jget('/api/v3/ticker/24hr?symbol=' + sym); } catch (e) { /* không có thống kê 24h cũng được */ }
          const base = sym.replace(/USDT$/, ''), row = { sym, base, price: +t.lastPrice || k[k.length - 1].c, chg: +t.priceChangePercent || 0, qv: +t.quoteVolume || 0, a, k };
          rows = rows.filter(x => x.sym !== sym); rows.unshift(row); renderList(); msg('Đã phân tích ' + base + ' (' + TFS[S.tf] + ')'); await pick(sym);
        } catch (e) { msg('Không phân tích được ' + sym + ': ' + (/HTTP 400/.test(e.message) ? 'Binance không có cặp này' : e.message)); }
        if (!dead) $(el, '.cgo').disabled = false;
      }
      async function pick(sym) {
        S.sel = sym; save(); renderList(); const r = rows.find(x => x.sym === sym);
        try { curK = r && r.k ? r.k : await klines(sym, S.tf); cur = analyze(curK, S); renderDet(); } catch (e) { msg('Lỗi tải ' + sym + ': ' + e.message); }
      }
      async function scan() {
        if (busy) return; busy = true; readOpts(); rows = []; renderList(); $(el, '.scan').disabled = true;
        try {
          msg('Đang lấy danh sách coin thanh khoản cao…'); const pairs = await topPairs(S.n); let done = 0, q = pairs.slice();
          const worker = async () => { while (q.length && !dead) { const t = q.shift(); try { const k = await klines(t.sym, S.tf); const a = analyze(k, S); if (a) rows.push(Object.assign(t, { a, k })); } catch (e) { /* bỏ qua coin lỗi */ } msg(`Đang phân tích ${++done}/${pairs.length}…`); } };
          await Promise.all([worker(), worker(), worker(), worker(), worker()]);
          if (dead) return; rows.sort((x, y) => Math.abs(y.a.score) - Math.abs(x.a.score)); renderList();
          msg(rows.length ? `Xong ${rows.length} coin · điểm tuyệt đối cao = cơ hội rõ hơn` : 'Không phân tích được coin nào.');
          if (rows.length) await pick(rows[0].sym);
        } catch (e) { msg('Không tải được dữ liệu từ Binance: ' + e.message + ' (mạng/vùng có thể bị chặn).'); }
        busy = false; if (!dead) $(el, '.scan').disabled = false;
      }
      // iOS có thể đẩy cả trang lên khi mở bàn phím → để lại khoảng trống dưới đáy; trả trang về vị trí cũ
      const home = () => setTimeout(() => { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }, 60);
      el.querySelectorAll('.cxbar input,.cxbar select').forEach(i => i.addEventListener('blur', home));
      sum(); $(el, '.cgo').onclick = analyzeOne; $(el, '.cs').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeOne(); });
      $(el, '.scan').onclick = () => { home(); scan(); };
      $(el, '.cxlist').onclick = e => { const r = e.target.closest('.cxr'); if (r) pick(r.dataset.s); };
      const rs = () => { if (cur && $(el, '.cxp[data-p=chart].on')) draw($(el, '.cxdet canvas'), curK, cur); }; window.addEventListener('resize', rs);
      return () => { dead = true; window.removeEventListener('resize', rs); };
    }
  });
  GV.cryptoT = { analyze, ema, rsi, macd, bb, atr, swings };
})();
