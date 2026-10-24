// AI-Agent phân tích crypto: chỉ báo, kế hoạch lệnh, quét + chọn coin (Binance giả qua route).
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
const kl = (seed, dir) => { let p = 100, out = []; for (let i = 0; i < 250; i++) { p *= 1 + dir * 0.004 + Math.sin(i * 0.7 + seed) * 0.006; out.push([Date.now() + i * 6e4, p * 0.998, p * 1.006, p * 0.993, p, 100 + (i % 7) * 10]); } return out.map(r => r.map(String)); };
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/binance/, r => { const u = r.request().url(), h = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (/ticker\/24hr/.test(u)) return r.fulfill({ headers: h, body: JSON.stringify(['BTC', 'ETH', 'SOL', 'USDC', 'XRP'].map((s, i) => ({ symbol: s + 'USDT', lastPrice: '100', priceChangePercent: '1.5', quoteVolume: String(1e9 - i * 1e7) })).concat([{ symbol: 'BTCUPUSDT', lastPrice: '1', priceChangePercent: '0', quoteVolume: '9e12' }])) });
    const s = /symbol=(\w+)/.exec(u)[1]; return r.fulfill({ headers: h, body: JSON.stringify(kl(s.length, s === 'ETHUSDT' ? -0.004 : 0.004)) }); });
  await p.goto('file://' + ROOT + '/index.html#/tool/crypto-agent'); await p.waitForSelector('.cx');
  const t = await p.evaluate(() => { const T = GV.cryptoT, c = Array.from({ length: 60 }, (_, i) => 100 + i), r = T.rsi(c); return { rsi: r[59], e: T.ema(c, 20)[59] }; });
  ok('RSI chuỗi tăng đều = 100', t.rsi === 100, t.rsi); ok('EMA20 bám dưới giá khi tăng', t.e < 159 && t.e > 140, t.e);
  await p.click('.scan'); await p.waitForSelector('.cxr', { timeout: 8000 }); await p.waitForFunction(() => /Xong/.test(document.querySelector('.cxmsg').textContent));
  const n = await p.locator('.cxr').count(); ok('quét 4 coin, loại stablecoin + token đòn bẩy', n === 4, n);
  ok('có canvas + kế hoạch lệnh', await p.locator('.cxdet canvas').count() === 1 && /Đòn bẫy gợi ý/.test(await p.locator('.cxdet').innerText()));
  const pl = await p.evaluate(() => { const T = GV.cryptoT; const k = Array.from({ length: 250 }, (_, i) => { const c = 100 + i * 0.3 + Math.sin(i) * 2; return { t: i, o: c - .3, h: c + 1, l: c - 1, c, v: 100 }; }); return T.analyze(k, { capital: 1000, riskPct: 1 }); });
  ok('xu hướng tăng → LONG, SL < vào < TP1 < TP2 < TP3', pl.dir === 1 && pl.plan.sl < pl.plan.entry && pl.plan.tp[0] > pl.plan.entry && pl.plan.tp[0] < pl.plan.tp[1] && pl.plan.tp[1] < pl.plan.tp[2], JSON.stringify(pl.plan));
  ok('lỗ tối đa = 1% vốn, đòn bẫy 1..20', Math.abs(pl.plan.riskUsd - 10) < 1e-9 && pl.plan.lev >= 1 && pl.plan.lev <= 20, pl.plan.lev);
  ok('giá thanh lý xa SL hơn (long)', pl.plan.liq < pl.plan.sl || pl.plan.lev === 1, pl.plan.liq + ' vs ' + pl.plan.sl);
  const dn = await p.evaluate(() => { const k = Array.from({ length: 250 }, (_, i) => { const c = 300 - i * 0.3 + Math.sin(i) * 2; return { t: i, o: c + .3, h: c + 1, l: c - 1, c, v: 100 }; }); const a = GV.cryptoT.analyze(k, {}); return { d: a.dir, sl: a.plan.sl, e: a.plan.entry, tp: a.plan.tp[0] }; });
  ok('xu hướng giảm → SHORT, SL > vào > TP', dn.d === -1 && dn.sl > dn.e && dn.tp < dn.e, JSON.stringify(dn));
  await p.click('.cxr >> nth=1'); await p.waitForTimeout(200); ok('chọn coin khác → đổi chi tiết', /\/USDT/.test(await p.locator('.cxdet h3').innerText()));
  await p.click('.ai'); ok('AI chưa có khoá → nhắc nhập khoá', /Chưa có khoá AI/.test(await p.locator('.cxai').innerText()));
  ok('không lỗi JS', errs.length === 0, errs.join('|')); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); process.exit(fail ? 1 : 0);
})();
