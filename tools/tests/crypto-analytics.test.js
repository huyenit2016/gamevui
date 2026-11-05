// Test trang Crypto Analytics (app/crypto-analytics) với Binance giả: REST qua page.route, WebSocket qua page.routeWebSocket.
// Chạy: NODE_PATH=$(npm root -g) node tools/tests/crypto-analytics.test.js
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8155);
let ok = 0, bad = 0; const t = (c, m) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + m); };

// ---- dữ liệu giả, ổn định theo seed ----
const BASE = { BTCUSDT: 65000, ETHUSDT: 3200, SOLUSDT: 150, BNBUSDT: 580, XRPUSDT: .6, DOGEUSDT: .15, NEARUSDT: 6, AVAXUSDT: 35, LINKUSDT: 15, SUIUSDT: 1.2, ADAUSDT: .45, WIFUSDT: 2.5, PEPEUSDT: .00001 };
const MS = { '1m': 6e4, '5m': 3e5, '15m': 9e5, '30m': 18e5, '1h': 36e5, '4h': 144e5, '1d': 864e5 };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function klines(sym, iv, n) { const step = MS[iv], end = Math.floor(Date.now() / step) * step; let p = BASE[sym] || 10; const out = [];
  for (let i = n - 1; i >= 0; i--) { const o = p, c = o * (1 + (rnd() - .5) * .01), h = Math.max(o, c) * (1 + rnd() * .004), l = Math.min(o, c) * (1 - rnd() * .004), v = 100 + rnd() * 50; out.push([end - i * step, '' + o, '' + h, '' + l, '' + c, '' + v, end - i * step + step - 1, '' + v * c, 100, '0', '0', '0']); p = c; }
  const k = BASE[sym] / out[out.length - 1][4]; return out.map(r => [r[0], '' + r[1] * k, '' + r[2] * k, '' + r[3] * k, '' + r[4] * k, r[5], r[6], '' + r[7] * k, ...r.slice(8)]); }
function oiHist(sym, per, n) { const step = MS[per], end = Math.floor(Date.now() / step) * step; let oi = 1e5; return Array.from({ length: n }, (_, i) => { oi *= 1 + (rnd() - .4) * .01; return { symbol: sym, timestamp: end - (n - 1 - i) * step, sumOpenInterest: '' + oi, sumOpenInterestValue: '' + oi * BASE[sym] }; }); }
async function mockBinance(page) {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.route('https://fapi.binance.com/**', r => {
    const u = new URL(r.request().url()), q = Object.fromEntries(u.searchParams), s = q.symbol; let body;
    if (u.pathname === '/fapi/v1/ticker/24hr') body = Object.keys(BASE).map(k => ({ symbol: k, priceChangePercent: '' + ((rnd() - .5) * 8).toFixed(2), quoteVolume: '' + 1e9 * rnd(), lastPrice: '' + BASE[k] }));
    else if (u.pathname === '/fapi/v1/premiumIndex') body = Object.keys(BASE).map(k => ({ symbol: k, markPrice: '' + BASE[k], lastFundingRate: '0.0001', nextFundingTime: Date.now() + 3e6 }));
    else if (u.pathname === '/fapi/v1/openInterest') body = { symbol: s, openInterest: '' + (1e5 * (1 + rnd() * .02)), time: Date.now() };
    else if (u.pathname === '/futures/data/openInterestHist') body = oiHist(s, q.period, Math.min(+q.limit || 30, 500));
    else if (u.pathname === '/fapi/v1/klines') body = klines(s, q.interval, Math.min(+q.limit || 500, 1500));
    else if (u.pathname === '/fapi/v1/fundingRate') body = Array.from({ length: 30 }, (_, i) => ({ symbol: s, fundingTime: Date.now() - (29 - i) * 288e5, fundingRate: '' + ((rnd() - .45) * .0004) }));
    else return r.fulfill({ status: 404, body: '{}' });
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
  await page.routeWebSocket(/fstream\.binance\.com/, ws => {
    const url = ws.url();
    const iv = setInterval(() => {
      if (url.includes('markPrice')) ws.send(JSON.stringify(Object.keys(BASE).map(k => ({ e: 'markPriceUpdate', s: k, p: '' + BASE[k] * (1 + (rnd() - .5) * .001), r: '0.00012', T: Date.now() + 3e6 }))));
      else { const k = rnd() < .6 ? 'BTCUSDT' : 'ETHUSDT', side = rnd() < .5 ? 'SELL' : 'BUY', px = BASE[k] * (1 + (rnd() - .5) * .004); ws.send(JSON.stringify({ e: 'forceOrder', E: Date.now(), o: { s: k, S: side, q: '0.5', p: '' + px, ap: '' + px, z: '0.5', T: Date.now() } })); }
    }, 400);
    ws.onClose(() => clearInterval(iv));
  });
}

(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 1366, height: 900 }, { width: 390, height: 844, isMobile: true, hasTouch: true }]) {
    console.log('— khung', vp.width + 'x' + vp.height);
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await mockBinance(p);
    await p.goto('http://localhost:8155/app/crypto-analytics/');
    await p.waitForFunction(() => window.CAT && window.Plotly, null, { timeout: 20000 });
    await p.waitForTimeout(3500);
    t(/Binance WS live/.test(await p.textContent('#stt')), 'trạng thái: ' + await p.textContent('#stt'));
    const n1 = await p.evaluate(() => CAT.S.liqSeen); await p.waitForTimeout(1500); const n2 = await p.evaluate(() => CAT.S.liqSeen);
    t(n2 > n1 && n1 > 0, `số thanh lý đã ghi tăng dần (${n1} → ${n2})`);
    t(await p.$$eval('#kpis .kpi', a => a.length) === 7, 'đủ 7 ô KPI');
    t(/6[45],\d{3}/.test(await p.textContent('#kpis')), 'KPI có giá BTC');
    await p.waitForFunction(() => document.querySelector('#hm .main-svg'), null, { timeout: 15000 });
    // 8 khung heatmap
    for (const w of ['15m', '1h', '4h', '6h', '12h', '24h', '3d', '7d']) {
      await p.click(`#winBtns [data-w="${w}"]`);
      await p.waitForFunction(w => window.CAT.S.hm && CAT.S.hm.window === w, w, { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(300);
      const info = await p.evaluate(() => { const d = document.getElementById('hm').data || []; return { types: d.map(x => x.type + (x.mode || '')), nz: d[0] && d[0].z ? d[0].z.length : 0, nt: d[0] && d[0].x ? d[0].x.length : 0 }; });
      t(info.types.join() === 'heatmap,scatterlines,scattermarkers,scattermarkers' && info.nz === 140 && info.nt > 0, `heatmap ${w}: 140 bin × ${info.nt} nến, có đường giá + dấu ✕`);
    }
    t(/ΔOI/.test(await p.textContent('#hmNote')), 'ghi chú heatmap nói rõ mô hình dựa trên ΔOI');
    const w0 = await p.evaluate(() => document.getElementById('hm').clientWidth); t(w0 >= vp.width - 70, `heatmap rộng gần hết màn hình (${w0}px / ${vp.width}px)`);
    await p.click('#hmCard .fsb'); await p.waitForTimeout(900);
    const fs = await p.evaluate(() => { const c = document.getElementById('hmCard').getBoundingClientRect(), h = document.getElementById('hm').getBoundingClientRect(); return [document.getElementById('hmCard').classList.contains('fs'), Math.round(c.width), Math.round(c.height), Math.round(h.height)]; });
    t(fs[0] && fs[1] >= vp.width - 2 && fs[3] > vp.height * .6, 'heatmap toàn màn hình ' + fs); if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/ca-fs-${vp.width}.png` });
    await p.click('#hmCard .fsb'); await p.waitForTimeout(500); t(!(await p.evaluate(() => document.getElementById('hmCard').classList.contains('fs'))), 'thoát toàn màn hình');
    // thẻ gợi ý
    await p.waitForSelector('.ftab tbody tr', { timeout: 15000 });
    t(await p.$$eval('.ftab tbody tr', a => a.length) === 6, 'thẻ gợi ý có đủ 6 yếu tố');
    t(/Nghiêng LONG|Nghiêng SHORT|Trung tính/.test(await p.textContent('#bias')), 'thẻ gợi ý có nhãn: ' + (await p.textContent('.blabel')).trim());
    const red = await p.evaluate(() => { const li = document.querySelector('.lv li'); return li ? getComputedStyle(li).color + '|' + getComputedStyle(li).fontWeight : document.querySelector('.lv').textContent; });
    t(/rgb\(255, 59, 48\)\|(700|800)/.test(red) || /trên mọi mức/.test(red), 'vùng tham chiếu phía trên giá: chữ đỏ in đậm (' + red + ')');
    t(/không phải điểm đặt lệnh/.test(await p.textContent('#bias')) && /Chưa được backtest/.test(await p.textContent('#bias')), 'có ghi chú không phải khuyến nghị');
    t((await p.$$eval('#read li', a => a.length)) >= 3, 'thẻ Đọc tín hiệu có diễn giải');
    t(await p.$$eval('#liqTbl tr', a => a.length) > 0 && /Long|Short/.test(await p.textContent('#liqTbl')), 'bảng thanh lý gần nhất có dữ liệu');
    t(await p.$$eval('#watch tr', a => a.length) === 12, 'watchlist 12 coin mặc định');
    if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/ca-map-${vp.width}.png`, fullPage: true });
    // tab biểu đồ
    await p.click('.tab[data-page="chart"]');
    await p.waitForFunction(() => (document.getElementById('chart').data || []).length >= 8, null, { timeout: 15000 }).catch(() => {});
    let tr = await p.evaluate(() => (document.getElementById('chart').data || []).map(x => x.yaxis));
    t(['y', 'y2', 'y3', 'y4', 'y5'].every(a => tr.includes(a)), 'biểu đồ đủ 5 ô (giá, volume, OI, funding, RSI)');
    t(await p.evaluate(() => (document.getElementById('chart').layout.shapes || []).some(s => s.line && s.line.color === '#ff3b30')), 'biểu đồ có đường đỏ tham chiếu');
    await p.click('#chCard .fsb'); await p.waitForTimeout(1200); const cf = await p.evaluate(() => [document.getElementById('chCard').classList.contains('fs'), Math.round(document.getElementById('chart').getBoundingClientRect().height)]);
    t(cf[0] && cf[1] > vp.height * .6, 'biểu đồ toàn màn hình ' + cf); if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/ca-chfs-${vp.width}.png` }); await p.keyboard.press('Escape'); await p.waitForTimeout(400); t(await p.evaluate(() => !document.getElementById('chCard').classList.contains('fs') && !document.fullscreenElement), 'Esc thoát toàn màn hình biểu đồ');
    await p.click('#intBtns [data-i="15m"]'); await p.waitForTimeout(800);
    t(await p.evaluate(() => CAT.S.int === '15m' && JSON.parse(localStorage.getItem('gv_crypto_analytics')).int === '15m'), 'đổi khung 15M và nhớ trong localStorage');
    await p.check('#bbChk'); await p.waitForTimeout(800);
    t(await p.evaluate(() => (document.getElementById('chart').data || []).some(x => x.name === 'BB trên')), 'bật Bollinger 20');
    await p.check('#tvChk'); await p.waitForTimeout(1200);
    t(/Không tải được TradingView/.test(await p.textContent('#tvNote')), 'TradingView bị chặn thì báo nhẹ nhàng');
    await p.uncheck('#tvChk');
    if (process.env.SHOT_DIR) await p.screenshot({ path: `${process.env.SHOT_DIR}/ca-chart-${vp.width}.png`, fullPage: true });
    // thêm coin + chọn coin
    await p.click('.tab[data-page="map"]');
    await p.fill('#addi', 'pepe'); await p.click('#addf button'); await p.waitForTimeout(1500);
    t(await p.evaluate(() => CAT.S.watch.includes('PEPEUSDT') && CAT.S.sym === 'PEPEUSDT'), 'thêm coin PEPE (tự thêm đuôi USDT) và chọn');
    p.once('dialog', d => d.dismiss()); await p.fill('#addi', 'khongco'); await p.click('#addf button'); await p.waitForTimeout(500);
    t(!(await p.evaluate(() => CAT.S.watch.includes('KHONGCOUSDT'))), 'coin không tồn tại bị từ chối');
    await p.click('#watch tr[data-s="ETHUSDT"]'); await p.waitForTimeout(1500);
    t(await p.evaluate(() => CAT.S.sym === 'ETHUSDT') && (await p.inputValue('#sym')) === 'ETHUSDT', 'bấm dòng watchlist chọn ETH');
    // mô hình: kiểm tra trực tiếp quy tắc xoá mức đã bị quét
    const model = await p.evaluate(() => { const k = []; let t = 0; for (let i = 0; i < 30; i++) k.push([t += 6e4, 100, 100.2, 99.8, 100, 1, t + 59999, 1e6]); const oi = k.map((c, i) => [c[6] - 1, 1e6 + i * 1e5]); const h = CAT.buildHeatmap(k, oi, 100, ['1m', 10, 30, '5m', .3]);
      const lvls = h.prices.filter((p, i) => h.long_now[i] > 0); return { oi: h.oi_based, minLong: Math.min(...lvls), maxLong: Math.max(...lvls), short: h.prices.filter((p, i) => h.short_now[i] > 0).every(p => p > 100.2), cols: h.times.length }; });
    t(model.oi && model.maxLong < 99.8 && model.short && model.cols === 10, 'mô hình: mức Long dưới đáy nến, Short trên đỉnh nến, chỉ trả N nến cuối ' + JSON.stringify(model));
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); t(ov <= 1, 'không cuộn ngang trang (' + ov + 'px)');
    t(errs.length === 0, 'không lỗi JS ' + errs.join(' / '));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`\n${ok} đạt, ${bad} lỗi`); process.exit(bad ? 1 : 0);
})();
