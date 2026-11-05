/* Crypto Analytics – bản đồ thanh lý Futures (Binance USDT-M), chạy hoàn toàn trên trình duyệt.
 * Trang tĩnh nên KHÔNG có máy chủ FastAPI như bản gốc: các phần feeds.py / heatmap.py / main.py được viết lại bằng JS,
 * gọi thẳng REST + WebSocket công khai của Binance. Dữ liệu thanh lý chỉ ghi từ lúc mở trang.
 * THỰC  = giá mark, funding, OI, ticker 24h, nến, lệnh thanh lý đã xảy ra.
 * ƯỚC TÍNH = heatmap thanh lý tương lai (mô hình suy diễn, xem mục 3).
 * Mọi gợi ý chỉ để học tập, không phải khuyến nghị mua/bán hay điểm vào lệnh. */
(function () {
'use strict';
const API = 'https://fapi.binance.com';
const WS_PATHS = ['wss://fstream.binance.com/market/ws/', 'wss://fstream.binance.com/ws/']; // đường mới trước, đường cũ dự phòng
const DEFAULT_WATCH = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'NEAR', 'AVAX', 'LINK', 'SUI', 'ADA', 'WIF'].map(s => s + 'USDT');
const LS = 'gv_crypto_analytics';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
const saved = load();
const persist = () => { try { localStorage.setItem(LS, JSON.stringify({ watch: S.watch, sym: S.sym, win: S.win, int: S.int, bb: S.bb })); } catch (e) {} };

/* ===== 1. TRẠNG THÁI ===== */
const S = {
  watch: Array.isArray(saved.watch) && saved.watch.length ? saved.watch.slice(0, 30) : DEFAULT_WATCH.slice(),
  sym: saved.sym || 'BTCUSDT', win: saved.win || '24h', int: saved.int || '1h', bb: !!saved.bb, page: 'map',
  mark: {}, tick: {}, oi: {}, liq: {}, last: { mark: 0, liq: 0 }, recSince: Date.now(), liqSeen: 0, err: '', req: 0,
  hm: null, k1h: null, oi1h: null
};
if (!S.watch.includes(S.sym)) S.sym = S.watch[0];

/* ===== 2. NGUỒN DỮ LIỆU BINANCE (thay cho feeds.py) ===== */
async function fx(path, ms = 12000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(API + path, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); S.err = ''; return await r.json(); }
  catch (e) { S.err = 'Không gọi được Binance (' + (e.name === 'AbortError' ? 'quá thời gian' : e.message) + ')'; throw e; }
  finally { clearTimeout(t); }
}
const price = s => (S.mark[s] && S.mark[s].price) || (S.tick[s] && S.tick[s].last) || 0;

// WebSocket tự nối lại (backoff 1→30 s). Nếu bắt tay xong mà im lặng thì thử đường dẫn còn lại.
function openWS(stream, onmsg) {
  let ws, backoff = 1000, pi = 0, got = false, timer = 0, silent = 0, stopped = false;
  const connect = () => {
    try { ws = new WebSocket(WS_PATHS[pi] + stream); } catch (e) { timer = setTimeout(connect, backoff); return; }
    clearTimeout(silent); silent = setTimeout(() => { if (!got) { pi = (pi + 1) % WS_PATHS.length; try { ws.close(); } catch (e) {} } }, 12000);
    ws.onmessage = e => { got = true; backoff = 1000; try { onmsg(JSON.parse(e.data)); } catch (er) {} };
    ws.onclose = () => { clearTimeout(silent); if (stopped) return; timer = setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 30000); };
    ws.onerror = () => {};
  };
  connect();
  return { close() { stopped = true; clearTimeout(timer); clearTimeout(silent); try { ws.close(); } catch (e) {} }, get open() { return ws && ws.readyState === 1; } };
}
function onMark(arr) {
  if (!Array.isArray(arr)) return; S.last.mark = Date.now();
  for (const m of arr) if (m.s && m.s.endsWith('USDT')) S.mark[m.s] = { price: +m.p, funding: +m.r, next: +m.T };
}
function onForce(msg) {
  const o = msg && msg.o; if (!o || !o.s) return; S.last.liq = Date.now();
  const p = +o.ap || +o.p, q = +o.z || +o.q; if (!p || !q) return;
  const L = S.liq[o.s] || (S.liq[o.s] = []);
  L.push({ t: +o.T || Date.now(), side: o.S === 'SELL' ? 'long' : 'short', price: p, qty: q, usd: p * q }); // SELL = Long bị thanh lý
  if (L.length > 20000) L.splice(0, L.length - 20000);
  S.liqSeen++;
}
let wsMark, wsLiq;
function startWS() { wsMark = openWS('!markPrice@arr@1s', onMark); wsLiq = openWS('!forceOrder@arr', onForce); }
function reconnect() { wsMark && wsMark.close(); wsLiq && wsLiq.close(); startWS(); }
const wsOk = () => Date.now() - Math.max(S.last.mark, S.last.liq) < 15000;

async function pollTicker() { try { const a = await fx('/fapi/v1/ticker/24hr'); for (const t of a) S.tick[t.symbol] = { chg: +t.priceChangePercent, qv: +t.quoteVolume, last: +t.lastPrice }; } catch (e) {} }
async function pollPremium() { // dự phòng khi WS mark im lặng > 5 s
  if (Date.now() - S.last.mark < 5000) return;
  try { const a = await fx('/fapi/v1/premiumIndex'); for (const m of a) if (m.symbol.endsWith('USDT')) S.mark[m.symbol] = { price: +m.markPrice, funding: +m.lastFundingRate, next: +m.nextFundingTime }; } catch (e) {}
}
async function seedOI(s) { // lấy 1 giờ OI lịch sử để tính ΔOI 1h ngay khi mở trang
  try { const a = await fx(`/futures/data/openInterestHist?symbol=${s}&period=5m&limit=13`); S.oi[s] = a.map(x => [+x.timestamp, +x.sumOpenInterestValue, +x.sumOpenInterest]).concat(S.oi[s] || []).sort((x, y) => x[0] - y[0]); } catch (e) {}
}
async function pollOI() {
  await Promise.all(S.watch.map(async s => {
    try { const r = await fx('/fapi/v1/openInterest?symbol=' + s); const coin = +r.openInterest, h = S.oi[s] || (S.oi[s] = []); h.push([Date.now(), coin * price(s), coin]); if (h.length > 2000) h.splice(0, h.length - 2000); } catch (e) {}
  }));
}
function oiNow(s) { const h = S.oi[s]; return h && h.length ? h[h.length - 1] : null; }
function oiChange(s, ms) { // tính theo số coin để trung lập với giá
  const h = S.oi[s]; if (!h || h.length < 2) return null; const now = h[h.length - 1]; let ref = null;
  for (let i = h.length - 1; i >= 0; i--) if (h[i][0] <= now[0] - ms) { ref = h[i]; break; }
  if (!ref) ref = h[0]; if (!ref[2] || now[0] - ref[0] < ms * .5) return null; return (now[2] / ref[2] - 1) * 100;
}
function liqSum(s, ms) { const L = S.liq[s] || [], t0 = Date.now() - ms; let long = 0, short = 0; for (let i = L.length - 1; i >= 0 && L[i].t >= t0; i--) L[i].side === 'long' ? long += L[i].usd : short += L[i].usd; return { long, short }; }
function liqBuckets(s, minutes = 240, bucket = 5) {
  const L = S.liq[s] || [], step = bucket * 60000, end = Math.ceil(Date.now() / step) * step, start = end - minutes * 60000, n = minutes / bucket;
  const t = [], long = new Array(n).fill(0), short = new Array(n).fill(0);
  for (let i = 0; i < n; i++) t.push(new Date(start + i * step));
  for (const x of L) if (x.t >= start) { const i = Math.min(n - 1, Math.floor((x.t - start) / step)); x.side === 'long' ? long[i] += x.usd : short[i] += x.usd; }
  return { t, long, short };
}

/* ===== 3. MÔ HÌNH HEATMAP ƯỚC TÍNH (thay cho heatmap.py) =====
 * ĐÂY LÀ MÔ HÌNH, KHÔNG PHẢI ĐO LƯỜNG. Giả định: vị thế mới = phần OI tăng thêm (hoặc 3% volume nếu thiếu OI);
 * giá vào = (H+L+C)/3; nến xanh 65% Long, nến đỏ 35% Long; đòn bẩy 5/10/25/50/100x theo tỷ lệ 15/30/25/20/10%; MMR 0,5%.
 * Mức Long bị xoá khi giá xuống chạm, mức Short bị xoá khi giá lên chạm. Chạy "khởi động" trên nhiều nến hơn số nến hiển thị. */
const WINDOWS = { '15m': ['1m', 15, 720, '5m', .03], '1h': ['1m', 60, 720, '5m', .04], '4h': ['1m', 240, 960, '5m', .06], '6h': ['1m', 360, 1080, '5m', .07], '12h': ['5m', 144, 500, '5m', .10], '24h': ['5m', 288, 500, '5m', .12], '3d': ['15m', 288, 500, '15m', .18], '7d': ['30m', 336, 500, '30m', .25] };
const LEV = [[5, .15], [10, .30], [25, .25], [50, .20], [100, .10]], MMR = .005, BINS = 140;
const hmCache = {};
function buildHeatmap(k, oiH, cur, cfg) {
  const [, show, , , span] = cfg, lo = cur * (1 - span), hi = cur * (1 + span), bw = (hi - lo) / BINS;
  const prices = Array.from({ length: BINS }, (_, i) => lo + (i + .5) * bw);
  const binOf = p => { const i = Math.floor((p - lo) / bw); return i >= 0 && i < BINS ? i : -1; };
  // OI theo từng nến: giá trị OI gần nhất có thời điểm ≤ thời điểm đóng nến
  const oiAt = []; let j = 0, oiBased = oiH && oiH.length > 3;
  if (oiBased) for (const c of k) { while (j + 1 < oiH.length && oiH[j + 1][0] <= c[6]) j++; oiAt.push(oiH[j][0] <= c[6] ? oiH[j][1] : null); }
  const long = new Float64Array(BINS), short = new Float64Array(BINS), first = Math.max(0, k.length - show);
  const z = Array.from({ length: BINS }, () => []), times = [], o = [], h = [], l = [], c = [];
  for (let i = 0; i < k.length; i++) {
    const [t, O, H, Lw, C, , , qv] = k[i];
    for (let b = 0; b < BINS; b++) { if (prices[b] >= Lw) long[b] = 0; if (prices[b] <= H) short[b] = 0; } // đã bị quét
    let pos; if (oiBased) { const a = oiAt[i], p = i ? oiAt[i - 1] : null; pos = a != null && p != null ? Math.max(a - p, 0) : 0; } else pos = qv * .03;
    if (pos > 0) { const entry = (H + Lw + C) / 3, ls = C >= O ? .65 : .35;
      for (const [L, w] of LEV) { const bl = binOf(entry * (1 - 1 / L + MMR)), bs = binOf(entry * (1 + 1 / L - MMR)); if (bl >= 0) long[bl] += pos * ls * w; if (bs >= 0) short[bs] += pos * (1 - ls) * w; } }
    if (i >= first) { times.push(new Date(t)); o.push(O); h.push(H); l.push(Lw); c.push(C); for (let b = 0; b < BINS; b++) z[b].push((long[b] + short[b]) / 1e6); }
  }
  let max = 0; for (const r of z) for (const v of r) if (v > max) max = v;
  return { times, prices, z, open: o, high: h, low: l, close: c, long_now: Array.from(long, v => v / 1e6), short_now: Array.from(short, v => v / 1e6), price: cur, oi_based: oiBased, max };
}
async function heatmap(s, win) {
  const key = s + win, cfg = WINDOWS[win], ttl = cfg[0] === '1m' ? 15000 : 60000;
  if (hmCache[key] && Date.now() - hmCache[key].at < ttl) return hmCache[key].v;
  const [iv, , n, per] = cfg;
  const [kr, oir] = await Promise.all([fx(`/fapi/v1/klines?symbol=${s}&interval=${iv}&limit=${n}`), fx(`/futures/data/openInterestHist?symbol=${s}&period=${per}&limit=500`).catch(() => [])]);
  const k = kr.map(x => [+x[0], +x[1], +x[2], +x[3], +x[4], +x[5], +x[6], +x[7]]);
  const oiH = oir.map(x => [+x.timestamp, +x.sumOpenInterestValue]).sort((a, b) => a[0] - b[0]);
  const v = buildHeatmap(k, oiH, price(s) || k[k.length - 1][4], cfg); v.symbol = s; v.window = win;
  hmCache[key] = { at: Date.now(), v }; return v;
}

/* ===== 4. CHỈ BÁO ===== */
function ema(a, n) { const k = 2 / (n + 1), out = []; let e = null; a.forEach((v, i) => { e = e == null ? v : v * k + e * (1 - k); out.push(i >= n - 1 ? e : null); }); return out; }
function rsi(a, n = 14) { const out = new Array(a.length).fill(null); let g = 0, l = 0; for (let i = 1; i < a.length; i++) { const d = a[i] - a[i - 1]; if (i <= n) { g += Math.max(d, 0); l += Math.max(-d, 0); if (i === n) { g /= n; l /= n; out[i] = 100 - 100 / (1 + g / (l || 1e-12)); } } else { g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; out[i] = 100 - 100 / (1 + g / (l || 1e-12)); } } return out; }
function boll(a, n = 20, m = 2) { const up = [], mid = [], dn = []; for (let i = 0; i < a.length; i++) { if (i < n - 1) { up.push(null); mid.push(null); dn.push(null); continue; } const w = a.slice(i - n + 1, i + 1), mu = w.reduce((x, y) => x + y) / n, sd = Math.sqrt(w.reduce((x, y) => x + (y - mu) ** 2, 0) / n); mid.push(mu); up.push(mu + m * sd); dn.push(mu - m * sd); } return { up, mid, dn }; }
const last = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]; return null; };

/* ===== 5. ĐỊNH DẠNG ===== */
const fUsd = v => v == null || isNaN(v) ? '–' : (Math.abs(v) >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : Math.abs(v) >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : Math.abs(v) >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + v.toFixed(0));
const fP = p => !p ? '–' : p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 1 }) : p >= 1 ? p.toFixed(p >= 100 ? 2 : 4) : p.toPrecision(4);
const fPct = (v, d = 2) => v == null || isNaN(v) ? '–' : (v > 0 ? '+' : '') + v.toFixed(d) + '%';
const cls = v => v > 0 ? 'up' : v < 0 ? 'down' : '';
const short = s => s.replace(/USDT$/, '');
const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/* ===== 6. GIAO DIỆN: trạng thái, KPI, watchlist, thanh lý ===== */
function renderStatus() {
  const ok = wsOk(); $('dot').className = ok ? 'ok' : 'bad';
  $('stt').textContent = ok ? `Binance WS live · ${S.liqSeen.toLocaleString('vi-VN')} thanh lý đã ghi` : (S.err || 'Mất kết nối Binance');
  $('recon').hidden = ok;
}
function fillSymbols() { const sel = $('sym'); sel.innerHTML = S.watch.map(s => `<option value="${s}"${s === S.sym ? ' selected' : ''}>${short(s)}</option>`).join(''); }
function renderKPI() {
  const s = S.sym, m = S.mark[s] || {}, t = S.tick[s] || {}, oi = oiNow(s), d1 = oiChange(s, 3600e3), lq = liqSum(s, 3600e3);
  const k = [['Giá mark', fP(m.price || t.last), ''], ['% 24h', fPct(t.chg), cls(t.chg)], ['Funding', m.funding != null ? fPct(m.funding * 100, 4) : '–', cls(-(m.funding || 0))], ['Open Interest', oi ? fUsd(oi[1]) : '–', ''], ['ΔOI 1h', fPct(d1), cls(d1)], ['Long bị thanh lý 1h', fUsd(lq.long), 'down'], ['Short bị thanh lý 1h', fUsd(lq.short), 'up']];
  $('kpis').innerHTML = k.map(([a, b, c]) => `<div class="kpi"><small>${a} · <span class="mut">${short(s)}</span></small><b class="${c}">${b}</b></div>`).join('');
}
function renderWatch() {
  $('watch').innerHTML = S.watch.map(s => { const m = S.mark[s] || {}, t = S.tick[s] || {}, oi = oiNow(s), d = oiChange(s, 3600e3), lq = liqSum(s, 3600e3);
    return `<tr data-s="${s}" class="${s === S.sym ? 'sel' : ''}"><td><b>${short(s)}</b></td><td>${fP(m.price || t.last)}</td><td class="${cls(t.chg)}">${fPct(t.chg)}</td><td class="${cls(-(m.funding || 0))}">${m.funding != null ? fPct(m.funding * 100, 4) : '–'}</td><td>${oi ? fUsd(oi[1]) : '–'}</td><td class="${cls(d)}">${fPct(d)}</td><td><span class="down">${fUsd(lq.long)}</span> / <span class="up">${fUsd(lq.short)}</span></td></tr>`; }).join('');
}
const dark = (h, extra = {}) => Object.assign({ paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#c9d2e3', size: 11 }, margin: { l: 56, r: 12, t: 8, b: 30 }, height: h, showlegend: false, hovermode: 'x unified' }, extra);
const PCFG = { displaylogo: false, responsive: true, scrollZoom: false, displayModeBar: innerWidth > 820 ? 'hover' : false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] };
const plotH = el => el.clientHeight || 300;
function renderLiq() {
  const s = S.sym, b = liqBuckets(s), L = (S.liq[s] || []).slice(-50).reverse();
  $('liqTbl').innerHTML = L.length ? L.map(x => `<tr><td>${hhmm(x.t)}</td><td class="${x.side === 'long' ? 'down' : 'up'}">${x.side === 'long' ? 'Long' : 'Short'}</td><td>${fP(x.price)}</td><td>${fUsd(x.usd)}</td></tr>`).join('') : `<tr><td colspan="4" class="mut">Chưa ghi nhận lệnh thanh lý ${short(s)} nào từ ${hhmm(S.recSince)}.</td></tr>`;
  const tl = b.long.reduce((x, y) => x + y, 0), ts = b.short.reduce((x, y) => x + y, 0);
  $('liqNote').textContent = `Tổng 4 giờ (từ lúc mở trang ${hhmm(S.recSince)}): Long ${fUsd(tl)} · Short ${fUsd(ts)}.`;
  if (!window.Plotly || S.page !== 'map') return;
  Plotly.react('liqBars', [{ type: 'bar', x: b.t, y: b.long.map(v => -v), marker: { color: '#ea3943' }, name: 'Long bị thanh lý', hovertemplate: '%{y:$,.0f}' }, { type: 'bar', x: b.t, y: b.short, marker: { color: '#16c784' }, name: 'Short bị thanh lý', hovertemplate: '%{y:$,.0f}' }],
    dark(plotH($('liqBars')), { barmode: 'relative', yaxis: { gridcolor: '#243048', tickprefix: '$' }, xaxis: { gridcolor: '#1a2233' } }), PCFG);
}

/* ===== 7. GỢI Ý THIÊN HƯỚNG + VÙNG THAM CHIẾU (quy tắc cơ học, học tập) ===== */
let levels = { above: [], below: null };
function clusters(arr, prices, above, cur, n) { // các cụm mạnh nhất (cực đại cục bộ) phía trên/dưới giá
  const c = []; for (let i = 1; i < arr.length - 1; i++) { const p = prices[i]; if ((above ? p > cur : p < cur) && arr[i] > 0 && arr[i] >= arr[i - 1] && arr[i] >= arr[i + 1]) c.push([p, arr[i]]); }
  return c.sort((a, b) => b[1] - a[1]).slice(0, n);
}
function computeBias() {
  const s = S.sym, k = S.k1h; if (!k || k.length < 60) return null;
  const C = k.map(x => x[4]), cur = price(s) || C[C.length - 1], e20 = last(ema(C, 20)), e50 = last(ema(C, 50)), r = last(rsi(C)), bb = boll(C), f = ((S.mark[s] || {}).funding || 0) * 100;
  const F = [];
  // 1. xu hướng EMA
  let v = cur > e20 && e20 > e50 ? 1 : cur < e20 && e20 < e50 ? -1 : (cur > e50 ? .3 : -.3);
  F.push(['Xu hướng EMA20/50 (1h)', v, 2, `Giá ${fP(cur)} · EMA20 ${fP(e20)} · EMA50 ${fP(e50)}`]);
  // 2. RSI
  v = r > 70 ? -.5 : r < 30 ? .5 : r >= 55 ? .5 : r <= 45 && r >= 30 ? -.5 : 0;
  F.push(['RSI14 (1h)', v, 1, `RSI ${r.toFixed(1)}${r > 70 ? ' – quá mua' : r < 30 ? ' – quá bán' : ''}`]);
  // 3. OI + giá 4h
  const p4 = (cur / C[C.length - 5] - 1) * 100, oh = S.oi1h, o4 = oh && oh.length >= 5 ? (oh[oh.length - 1] / oh[oh.length - 5] - 1) * 100 : null;
  v = o4 == null ? 0 : o4 > 1 ? Math.sign(p4) : o4 < -1 ? .3 * Math.sign(p4) : 0;
  F.push(['OI + giá 4h', v, 1.5, o4 == null ? 'Chưa có OI 4h' : `OI ${fPct(o4)} · giá ${fPct(p4)}${o4 > 1 ? ' (dòng tiền mới theo hướng giá)' : o4 < -1 ? ' (đóng vị thế)' : ''}`]);
  // 4. funding (ngược đám đông)
  v = f > .05 ? -1 : f > .02 ? -.5 : f < -.03 ? 1 : f < -.01 ? .5 : 0;
  F.push(['Funding (ngược đám đông)', v, 1, `Funding ${f.toFixed(4)}%`]);
  // 5. heatmap
  const hm = S.hm && S.hm.symbol === s ? S.hm : null; let up = 0, dn = 0;
  if (hm) hm.prices.forEach((p, i) => { const w = hm.long_now[i] + hm.short_now[i]; p > cur ? up += w : dn += w; });
  v = !hm ? 0 : up > dn * 1.3 ? .5 : -.5;
  F.push(['Heatmap ước tính', v, 1, hm ? `Trên giá ${fUsd(up * 1e6)} · dưới giá ${fUsd(dn * 1e6)}` : 'Chưa có heatmap']);
  // 6. thanh lý thật 1h
  const lq = liqSum(s, 3600e3), tot = lq.long + lq.short;
  v = tot < 2e4 ? 0 : lq.long >= lq.short * 2 ? .3 : lq.short >= lq.long * 2 ? -.3 : 0;
  F.push(['Thanh lý thật 1h', v, .5, tot < 2e4 ? `${fUsd(tot)} – quá nhỏ để kết luận` : `Long ${fUsd(lq.long)} · Short ${fUsd(lq.short)}`]);
  const W = F.reduce((a, x) => a + x[2], 0), score = Math.round(F.reduce((a, x) => a + x[1] * x[2], 0) / W * 100);
  // vùng tham chiếu phía trên giá
  const H = k.map(x => x[2]), above = [];
  const add = (name, p) => { if (p && p > cur) above.push([name, p]); };
  add('Đỉnh 24h (1h)', Math.max(...H.slice(-24))); add('Đỉnh 7 ngày (1h)', Math.max(...H.slice(-168))); add('Bollinger trên (1h)', last(bb.up)); add('EMA50 (1h)', e50);
  let below = null;
  if (hm) { clusters(hm.short_now, hm.prices, true, cur, 2).forEach(([p, w], i) => add(`Cụm thanh lý Short ước tính #${i + 1} (${fUsd(w * 1e6)})`, p)); const lb = clusters(hm.long_now, hm.prices, false, cur, 1)[0]; if (lb) below = [lb[0], lb[1]]; }
  above.sort((a, b) => a[1] - b[1]);
  levels = { above, below };
  return { score, F, cur, above, below };
}
function renderBias() {
  const b = computeBias(); if (!b) return;
  const lab = b.score >= 35 ? ['Nghiêng LONG', 'up'] : b.score <= -35 ? ['Nghiêng SHORT', 'down'] : ['Trung tính / chờ xác nhận', 'mut'];
  const pro = b.F.filter(f => f[1] * Math.sign(b.score || 1) > 0).length, con = b.F.filter(f => f[1] * Math.sign(b.score || 1) < 0).length;
  $('bias').innerHTML = `<div class="bias"><div>
    <p class="blabel ${lab[1]}">${lab[0]} <span class="mut" style="font-size:14px">(${b.score > 0 ? '+' : ''}${b.score})</span></p>
    <div class="gauge"><i style="left:${(b.score + 100) / 2}%"></i></div><div class="gl"><span>-100 SHORT</span><span>0</span><span>LONG +100</span></div>
    <p class="mut" style="margin:8px 0">${pro} yếu tố ủng hộ · ${con} yếu tố ngược chiều (${short(S.sym)}, nến 1h)</p>
    <div class="tbl"><table class="ftab"><thead><tr><th>Yếu tố</th><th>Chi tiết</th><th>Điểm</th><th>Trọng số</th></tr></thead><tbody>${b.F.map(f => `<tr><td>${f[0]}</td><td class="mut">${esc(f[3])}</td><td class="${cls(f[1])}">${f[1] > 0 ? '+' : ''}${f[1]}</td><td>${f[2]}</td></tr>`).join('')}</tbody></table></div>
  </div><div class="lv"><h3>Vùng tham chiếu phía trên giá ${fP(b.cur)}</h3>${b.above.length ? `<ul>${b.above.map(([n, p]) => `<li>${fP(p)} — ${esc(n)} (${fPct((p / b.cur - 1) * 100)})</li>`).join('')}</ul>` : '<p class="mut">Giá đang trên mọi mức tham chiếu.</p>'}
    <p class="disc">Các mức tính tự động để tham khảo, không phải điểm đặt lệnh bán được khuyến nghị.${b.below ? `<br>Phía dưới: cụm thanh lý Long ước tính mạnh nhất ở ${fP(b.below[0])} (${fUsd(b.below[1] * 1e6)}).` : ''}</p></div></div>
    <p class="disc">Chưa được backtest, không phải lời khuyên đầu tư hay tín hiệu vào lệnh.</p>`;
}
const refShapes = (x0, x1) => { const sh = [], an = []; levels.above.forEach(([n, p]) => { sh.push({ type: 'line', xref: 'x', yref: 'y', x0, x1, y0: p, y1: p, line: { color: '#ff3b30', width: 1.4, dash: 'dash' } }); an.push({ x: x1, y: p, xref: 'x', yref: 'y', text: `<b>${fP(p)} ${esc(n.replace(/ \(.*\)$/, ''))}</b>`, showarrow: false, xanchor: 'right', yanchor: 'bottom', font: { color: '#ff3b30', size: 10 } }); }); return { sh, an }; };

/* ===== 8. ĐỌC TÍN HIỆU (học tập) ===== */
function renderRead() {
  const s = S.sym, m = S.mark[s] || {}, t = S.tick[s] || {}, f = (m.funding || 0) * 100, d1 = oiChange(s, 3600e3), lq = liqSum(s, 3600e3), out = [];
  out.push(f > .03 ? `Funding ${f.toFixed(4)}% khá dương: phe Long đang trả phí, thị trường nghiêng về mua – dễ bị “rũ Long” nếu giá giảm.` : f < -.01 ? `Funding ${f.toFixed(4)}% âm: phe Short trả phí, nhiều người bán khống – có thể xảy ra “ép Short” khi giá tăng.` : `Funding ${f.toFixed(4)}% gần trung tính: chưa có phe nào quá đông.`);
  if (d1 != null && t.chg != null) out.push(d1 > 1 ? (t.chg > 0 ? `Giá tăng và OI tăng ${fPct(d1)} trong 1h: tiền mới vào theo chiều tăng.` : `Giá giảm và OI tăng ${fPct(d1)} trong 1h: vị thế mới mở theo chiều giảm (nhiều lệnh Short).`) : d1 < -1 ? `OI giảm ${fPct(d1)} trong 1h: vị thế đang được đóng/thanh lý, xu hướng có thể yếu đi.` : `OI thay đổi nhỏ (${fPct(d1)}) trong 1h.`);
  else out.push('Đang gom dữ liệu OI để so sánh 1 giờ.');
  const tot = lq.long + lq.short; out.push(tot < 2e4 ? `Thanh lý ghi nhận 1h: ${fUsd(tot)} – quá nhỏ để kết luận.` : lq.long > lq.short ? `Thanh lý 1h nghiêng về Long (${fUsd(lq.long)} so với ${fUsd(lq.short)}): phe mua vừa bị quét.` : `Thanh lý 1h nghiêng về Short (${fUsd(lq.short)} so với ${fUsd(lq.long)}): phe bán vừa bị quét.`);
  const hm = S.hm && S.hm.symbol === s ? S.hm : null;
  if (hm) { const cur = hm.price; let up = 0, dn = 0; hm.prices.forEach((p, i) => { const w = hm.long_now[i] + hm.short_now[i]; p > cur ? up += w : dn += w; }); out.push(`Heatmap ước tính (${hm.window}): mức thanh lý còn mở phía trên ${fUsd(up * 1e6)}, phía dưới ${fUsd(dn * 1e6)}. Giá thường “hút” về vùng dày – nhưng đây là mô hình, không chắc chắn.`); }
  $('read').innerHTML = out.map(x => `<li>${esc(x)}</li>`).join('');
}

/* ===== 9. HEATMAP (Plotly) ===== */
let hmTok = 0;
async function renderHeatmap(force) {
  const s = S.sym, w = S.win, tok = ++hmTok;
  try {
    const hm = await heatmap(s, w); if (tok !== hmTok || s !== S.sym) return; const fresh = S.hm !== hm; S.hm = hm; if (fresh && S.k1h) { renderBias(); renderRead(); }
    $('hmNote').textContent = `Mô hình dựa trên ${hm.oi_based ? 'phần OI tăng thêm (ΔOI)' : '3% volume giao dịch (thiếu OI lịch sử)'} · ${hm.times.length} nến ${WINDOWS[w][0]} · đòn bẩy 5–100x, MMR 0,5% · đơn vị: triệu USD. Dấu ✕ đỏ = Long bị thanh lý thật, ✕ xanh = Short bị thanh lý thật.`;
    if (!window.Plotly || S.page !== 'map') return;
    const t0 = +hm.times[0], L = (S.liq[s] || []).filter(x => x.t >= t0), x1 = hm.times[hm.times.length - 1], ref = refShapes(hm.times[0], x1);
    const tr = [{ type: 'heatmap', x: hm.times, y: hm.prices, z: hm.z, colorscale: 'Viridis', zmin: 0, zmax: (hm.max || 1) * .6, colorbar: { title: { text: 'triệu $', side: 'right' }, thickness: 10, len: .9 }, hovertemplate: '%{y:.4~f}<br>%{z:.2f} triệu $<extra></extra>' },
      { type: 'scatter', mode: 'lines', x: hm.times, y: hm.close, line: { color: '#fff', width: 1.6 }, hovertemplate: 'Giá %{y}<extra></extra>' },
      { type: 'scatter', mode: 'markers', x: L.filter(x => x.side === 'long').map(x => new Date(x.t)), y: L.filter(x => x.side === 'long').map(x => x.price), marker: { symbol: 'x', color: '#ff4d4f', size: 8 }, hovertemplate: 'Long bị thanh lý %{y}<extra></extra>' },
      { type: 'scatter', mode: 'markers', x: L.filter(x => x.side === 'short').map(x => new Date(x.t)), y: L.filter(x => x.side === 'short').map(x => x.price), marker: { symbol: 'x', color: '#16c784', size: 8 }, hovertemplate: 'Short bị thanh lý %{y}<extra></extra>' }];
    Plotly.react('hm', tr, dark(plotH($('hm')), { hovermode: 'closest', margin: { l: 64, r: 8, t: 8, b: 30 }, xaxis: { gridcolor: '#1a2233' }, yaxis: { gridcolor: '#1a2233', range: [hm.prices[0], hm.prices[hm.prices.length - 1]] }, shapes: ref.sh, annotations: ref.an }), PCFG);
  } catch (e) { if (tok === hmTok) $('hmNote').innerHTML = `<span class="err">Không tải được dữ liệu heatmap: ${esc(e.message)}</span>`; }
}

/* ===== 10. BIỂU ĐỒ 5 Ô (Plotly) ===== */
const OI_PER = { '1m': '5m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };
const kCache = {}; let chTok = 0;
async function klinesFull(s, iv) {
  const key = s + iv; if (kCache[key] && Date.now() - kCache[key].at < 10000) return kCache[key].v;
  const [k, oi, fr] = await Promise.all([fx(`/fapi/v1/klines?symbol=${s}&interval=${iv}&limit=300`), fx(`/futures/data/openInterestHist?symbol=${s}&period=${OI_PER[iv]}&limit=500`).catch(() => []), fx(`/fapi/v1/fundingRate?symbol=${s}&limit=200`).catch(() => [])]);
  const v = { t: k.map(x => new Date(+x[0])), o: k.map(x => +x[1]), h: k.map(x => +x[2]), l: k.map(x => +x[3]), c: k.map(x => +x[4]), v: k.map(x => +x[7]), oi: oi.map(x => [new Date(+x.timestamp), +x.sumOpenInterestValue]), funding: fr.map(x => [new Date(+x.fundingTime), +x.fundingRate * 100]) };
  kCache[key] = { at: Date.now(), v }; return v;
}
async function renderChart() {
  if (S.page !== 'chart' || $('tvChk').checked) return;
  const s = S.sym, iv = S.int, tok = ++chTok;
  try {
    const d = await klinesFull(s, iv); if (tok !== chTok || s !== S.sym || !window.Plotly) return;
    const t0 = +d.t[0], x1 = d.t[d.t.length - 1], L = (S.liq[s] || []).filter(x => x.t >= t0), e20 = ema(d.c, 20), e50 = ema(d.c, 50), r = rsi(d.c), ref = refShapes(d.t[0], x1);
    const fr = d.funding.filter(x => +x[0] >= t0 - 8 * 3600e3), oi = d.oi.filter(x => +x[0] >= t0);
    const tr = [{ type: 'candlestick', x: d.t, open: d.o, high: d.h, low: d.l, close: d.c, increasing: { line: { color: '#16c784' } }, decreasing: { line: { color: '#ea3943' } }, name: short(s), yaxis: 'y' },
      { type: 'scatter', mode: 'lines', x: d.t, y: e20, line: { color: '#f0b90b', width: 1.2 }, name: 'EMA20', yaxis: 'y' },
      { type: 'scatter', mode: 'lines', x: d.t, y: e50, line: { color: '#5b8def', width: 1.2 }, name: 'EMA50', yaxis: 'y' },
      { type: 'scatter', mode: 'markers', x: L.map(x => new Date(x.t)), y: L.map(x => x.price), marker: { symbol: 'x', size: 8, color: L.map(x => x.side === 'long' ? '#ff4d4f' : '#16c784') }, name: 'Thanh lý', yaxis: 'y' },
      { type: 'bar', x: d.t, y: d.v, marker: { color: d.c.map((c, i) => c >= d.o[i] ? 'rgba(22,199,132,.6)' : 'rgba(234,57,67,.6)') }, name: 'Volume', yaxis: 'y2' },
      { type: 'scatter', mode: 'lines', x: oi.map(x => x[0]), y: oi.map(x => x[1]), line: { color: '#c58af9', width: 1.4 }, name: 'OI ($)', yaxis: 'y3' },
      { type: 'bar', x: fr.map(x => x[0]), y: fr.map(x => x[1]), marker: { color: fr.map(x => x[1] >= 0 ? '#16c784' : '#ea3943') }, name: 'Funding %', yaxis: 'y4' },
      { type: 'scatter', mode: 'lines', x: d.t, y: r, line: { color: '#4cc9f0', width: 1.2 }, name: 'RSI14', yaxis: 'y5' }];
    if (S.bb) { const b = boll(d.c); tr.push({ type: 'scatter', mode: 'lines', x: d.t, y: b.up, line: { color: 'rgba(200,200,200,.5)', width: 1, dash: 'dot' }, name: 'BB trên', yaxis: 'y' }, { type: 'scatter', mode: 'lines', x: d.t, y: b.dn, line: { color: 'rgba(200,200,200,.5)', width: 1, dash: 'dot' }, name: 'BB dưới', yaxis: 'y' }); }
    const ax = (dom, title) => ({ domain: dom, gridcolor: '#1a2233', title: { text: title, font: { size: 10 } }, fixedrange: true });
    const shapes = ref.sh.concat([30, 70].map(v => ({ type: 'line', xref: 'x', yref: 'y5', x0: d.t[0], x1, y0: v, y1: v, line: { color: '#555', width: 1, dash: 'dot' } })));
    Plotly.react('chart', tr, dark(plotH($('chart')), { margin: { l: 58, r: 10, t: 6, b: 28 }, xaxis: { rangeslider: { visible: false }, gridcolor: '#1a2233', anchor: 'y5' },
      yaxis: ax([.47, 1], 'Giá'), yaxis2: ax([.36, .45], 'Vol'), yaxis3: ax([.25, .34], 'OI'), yaxis4: ax([.13, .23], 'Fund %'), yaxis5: Object.assign(ax([0, .11], 'RSI'), { range: [0, 100] }), shapes, annotations: ref.an }), PCFG);
  } catch (e) { if (tok === chTok) $('chart').innerHTML = `<p class="err">Không tải được biểu đồ: ${esc(e.message)}</p>`; }
}
function tradingView() { // tải tv.js khi cần; bị chặn thì báo nhẹ
  const box = $('tvBox'), on = $('tvChk').checked; box.hidden = !on; $('chart').hidden = on; if (!on) { renderChart(); return; }
  const mk = () => { try { $('tvw').innerHTML = ''; new window.TradingView.widget({ container_id: 'tvw', symbol: `BINANCE:${S.sym}.P`, interval: { '1m': '1', '5m': '5', '15m': '15', '1h': '60', '4h': '240', '1d': 'D' }[S.int], theme: 'dark', timezone: 'Asia/Ho_Chi_Minh', locale: 'vi_VN', autosize: true }); $('tvNote').textContent = 'Biểu đồ TradingView (dịch vụ bên ngoài).'; } catch (e) { $('tvNote').textContent = 'Không mở được TradingView.'; } };
  if (window.TradingView) return mk();
  const sc = document.createElement('script'); sc.src = 'https://s3.tradingview.com/tv.js'; sc.onload = mk; sc.onerror = () => { $('tvNote').innerHTML = '<span class="err">Không tải được TradingView (mạng có thể chặn). Bỏ chọn để dùng biểu đồ Plotly.</span>'; }; document.head.appendChild(sc);
}

/* ===== 11. NẾN 1H CHO PHẦN GỢI Ý ===== */
let bTok = 0;
async function loadBias() {
  const s = S.sym, tok = ++bTok;
  try { const [k, o] = await Promise.all([fx(`/fapi/v1/klines?symbol=${s}&interval=1h&limit=200`), fx(`/futures/data/openInterestHist?symbol=${s}&period=1h&limit=6`).catch(() => [])]);
    if (tok !== bTok || s !== S.sym) return; S.k1h = k.map(x => [+x[0], +x[1], +x[2], +x[3], +x[4]]); S.oi1h = o.map(x => +x.sumOpenInterest);
    renderBias(); if (S.page === 'chart') renderChart(); else renderHeatmap(); }
  catch (e) { if (tok === bTok) $('bias').innerHTML = `<p class="err">Không tải được nến 1h: ${esc(e.message)}</p>`; }
}

/* ===== 12. ĐIỀU KHIỂN ===== */
function selectSym(s) { if (!S.watch.includes(s)) return; S.sym = s; S.req++; S.hm = null; S.k1h = null; persist(); fillSymbols(); renderKPI(); renderWatch(); renderLiq(); renderRead(); $('bias').innerHTML = '<p class="mut">Đang tải nến 1h…</p>'; loadBias(); renderHeatmap(); renderChart(); if ($('tvChk').checked) tradingView(); }
function setPage(p) { S.page = p; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.page === p)); $('pg-map').hidden = p !== 'map'; $('pg-chart').hidden = p !== 'chart'; if (p === 'map') { renderHeatmap(); renderLiq(); } else { renderChart(); } setTimeout(() => window.Plotly && document.querySelectorAll('.js-plotly-plot').forEach(el => el.offsetParent && Plotly.Plots.resize(el)), 50); }
function segs() {
  $('winBtns').innerHTML = Object.keys(WINDOWS).map(w => `<button type="button" data-w="${w}" class="${w === S.win ? 'on' : ''}">${w}</button>`).join('');
  $('intBtns').innerHTML = Object.keys(OI_PER).map(i => `<button type="button" data-i="${i}" class="${i === S.int ? 'on' : ''}">${i.toUpperCase()}</button>`).join('');
}
$('winBtns').addEventListener('click', e => { const w = e.target.dataset.w; if (!w) return; S.win = w; persist(); segs(); renderHeatmap(); });
$('intBtns').addEventListener('click', e => { const i = e.target.dataset.i; if (!i) return; S.int = i; persist(); segs(); renderChart(); if ($('tvChk').checked) tradingView(); });
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));
$('sym').addEventListener('change', e => selectSym(e.target.value));
$('watch').addEventListener('click', e => { const tr = e.target.closest('tr[data-s]'); if (tr) selectSym(tr.dataset.s); });
$('bbChk').checked = S.bb; $('bbChk').addEventListener('change', e => { S.bb = e.target.checked; persist(); renderChart(); });
$('tvChk').addEventListener('change', tradingView);
$('recon').addEventListener('click', () => { reconnect(); $('stt').textContent = 'Đang kết nối lại…'; setTimeout(renderStatus, 4000); });
$('addf').addEventListener('submit', async e => {
  e.preventDefault(); let s = $('addi').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!s) return; if (!s.endsWith('USDT')) s += 'USDT';
  if (S.watch.includes(s)) { selectSym(s); $('addi').value = ''; return; }
  if (S.watch.length >= 30) return alert('Watchlist tối đa 30 coin.');
  if (!Object.keys(S.tick).length) await pollTicker();
  if (!S.tick[s]) return alert(`Không tìm thấy ${s} trên Binance USDT-M Futures.`);
  S.watch.push(s); $('addi').value = ''; persist(); await seedOI(s); selectSym(s);
});
// nút ⛶ toàn màn hình cho heatmap / biểu đồ
const resizePlots = () => setTimeout(() => window.Plotly && document.querySelectorAll('.js-plotly-plot').forEach(el => el.offsetParent && Plotly.Plots.resize(el)), 80);
function setFs(card, on) {
  card.classList.toggle('fs', on); document.body.classList.toggle('fsOn', on);
  const b = card.querySelector('.fsb'); b.textContent = on ? '✕' : '⛶'; b.title = on ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  if (on) { if (card.id === 'hmCard') renderHeatmap(); else renderChart(); } resizePlots();
}
document.querySelectorAll('.fsb').forEach(b => b.addEventListener('click', async () => {
  const card = $(b.dataset.fs), on = !card.classList.contains('fs');
  if (on) { setFs(card, true); try { if (card.requestFullscreen) await card.requestFullscreen(); else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen(); } catch (e) {} }
  else { if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (e) {} } setFs(card, false); }
}));
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.querySelectorAll('.card.fs').forEach(c => setFs(c, false)); else resizePlots(); });
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); document.querySelectorAll('.card.fs').forEach(c => setFs(c, false)); });
window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => window.Plotly && document.querySelectorAll('.js-plotly-plot').forEach(el => el.offsetParent && Plotly.Plots.resize(el)), 200); });

/* ===== 13. KHỞI ĐỘNG + CHU KỲ LÀM MỚI ===== */
fillSymbols(); segs(); renderStatus(); renderKPI(); renderWatch(); renderLiq(); renderRead();
startWS();
(async () => {
  await Promise.all([pollTicker(), pollPremium()]);
  S.last.mark = S.last.mark || 0; renderKPI(); renderWatch();
  await Promise.all(S.watch.map(seedOI)); await pollOI(); renderKPI(); renderWatch();
  loadBias(); renderHeatmap();
})();
setInterval(renderStatus, 5000);
setInterval(() => { renderKPI(); renderWatch(); renderRead(); }, 3000);
setTimeout(renderStatus, 1500); // cập nhật sớm lần đầu, sau đó 5 giây/lần
setInterval(() => { if (S.page === 'map') renderLiq(); }, 5000);
setInterval(() => { pollOI(); pollPremium(); }, 10000);
setInterval(pollTicker, 30000);
setInterval(loadBias, 60000);
setInterval(() => { if (S.page === 'map') renderHeatmap(); }, 15000); // heatmap tự lấy cache 15 s (nến 1m) hoặc 60 s (khung khác)
setInterval(() => { if (S.page === 'chart') renderChart(); }, 15000);
window.CAT = { S, buildHeatmap, computeBias, heatmap, ema, rsi, boll, onForce, onMark, liqSum, selectSym, setPage, levels: () => levels }; // tay cầm kiểm thử
})();
