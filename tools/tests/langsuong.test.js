// Ma Sói · Lời Nguyền Làng Sương online: 2 người thật + 3 bot chơi hết một ván qua Firebase giả (hub.js), kiểm tra giao diện các pha.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8141);
  const URL = 'http://localhost:8141/index.html'; const b = await chromium.launch(), hub = makeHub(), errs = [];
  const mk = async (name, w) => { const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('dialog', d => d.accept()); await hub.attach(p, 'u-' + name); await p.addInitScript({ path: path.join(__dirname, 'mock_shared.js') }); return p; };
  const H = await mk('host', 1280), G = await mk('guest', 390);
  // nhận diện vai/tiện ích độc lập
  await H.goto(URL + '#/game/langsuong'); await H.waitForSelector('.mk');
  const rc = await H.evaluate(() => [5, 8, 12, 16].map(n => { const r = GV.lsT.rolesFor(n, { shuffle: a => a }); return [n, r.filter(x => x === 'wolf').length, r.length, r.includes('seer'), r.includes('witch')]; }));
  ok('chia vai đúng số người và số Sói (5→1, 8→2, 12→3, 16→4)', JSON.stringify(rc.map(x => x[1])) === '[1,2,3,4]' && rc.every(x => x[0] === x[2] && x[3]), JSON.stringify(rc));
  ok('chân dung SVG khác nhau theo người', await H.evaluate(() => GV.lsT.face('a') !== GV.lsT.face('b') && /<svg/.test(GV.lsT.face('a'))));
  await H.fill('.nm', 'Chủ'); await H.fill('.rn', 'Làng thử'); await H.click('.mk'); await H.waitForSelector('.addbot');
  const code = (await H.locator('.code').innerText()).trim(); ok('tạo phòng có mã 4 số', /^\d{4}$/.test(code), code);
  await G.goto(URL + '#/game/langsuong/' + code); await G.waitForSelector('.nm'); await G.fill('.nm', 'Khách'); await G.click('.jn'); await G.waitForSelector('.seats');
  for (let i = 0; i < 3; i++) { await H.click('.addbot'); await H.waitForTimeout(150); }
  await H.waitForTimeout(400); ok('sảnh có 5 chỗ (2 người + 3 bot)', (await H.locator('.seat').count()) === 5, await H.locator('.seat').count());
  await H.click('.start'); await H.waitForSelector('.ls', { timeout: 8000 }); await G.waitForSelector('.ls', { timeout: 8000 });
  ok('vào pha Nhận vai: thẻ vai + 5 chân dung', /Nhận vai/.test(await H.locator('.lsst .on').innerText()) && await G.locator('.lsp').count() === 5 && await G.locator('[data-a=seen]').count() === 1);
  ok('giao diện có tên làng, câu dẫn, bộ đếm', await H.locator('.ls h3').count() === 1 && /Còn sống/.test(await H.locator('.lsc').innerText()));
  const roles = []; for (const P of [H, G]) roles.push(await P.locator('.lsact b').first().innerText());
  ok('mỗi người thấy vai của mình', roles.every(r => /Bạn là/.test(r)), roles.join(' | '));
  // vòng chơi tự động: mỗi trang bấm hành động đang được yêu cầu
  const seenPhases = new Set(); let end = null; const t0 = Date.now();
  const step = async P => {
    const ph = await P.evaluate(() => { const o = document.querySelector('.lsst .on'); return o ? o.textContent : ''; }); if (ph) seenPhases.add(ph.replace(/\d+/, '').trim());
    if (await P.locator('.lsend').count()) return (await P.locator('.lsend').innerText());
    const a = P.locator('.lsact [data-a=seen], .lsact [data-a=ready], .lsact [data-a=witch-skip]');
    if (await a.count()) { await a.first().click().catch(() => {}); return null; }
    const can = P.locator('.lsp.can'); if (await can.count() && await P.locator('.lsact').count()) { await can.last().click().catch(() => {}); return null; }
    const any = P.locator('.lsact [data-a]'); if (await any.count()) await any.first().click().catch(() => {});
    return null;
  };
  while (!end && Date.now() - t0 < 240000) { end = (await step(H)) || (await step(G)); await H.waitForTimeout(500); }
  ok('ván kết thúc có phe thắng', !!end && /chiến thắng/.test(end), end);
  ok('đã đi qua các pha Đêm / Bình minh / Hội đồng / Bỏ phiếu', ['Đêm', 'Bình minh', 'Hội đồng', 'Bỏ phiếu'].every(x => [...seenPhases].some(s => s.startsWith(x))), [...seenPhases].join(','));
  await G.click('.lstb [data-tab=book]'); const lg = await G.locator('.lslog').innerText();
  ok('sổ tay ghi lại diễn biến (bình minh, phiếu)', /Bình minh/.test(lg) && /⚖️|treo/.test(lg), lg.slice(0, 200));
  await G.click('.lstb [data-tab=me]'); ok('tab Vai của tôi hiển thị vai', await G.locator('.lsrole h4').count() === 1);
  await G.click('.lstb [data-tab=rules]'); ok('tab Luật có 6 vai', await G.locator('.lsrl > div').count() === 6);
  await G.click('.lstb [data-tab=board]'); ok('hết ván lộ vai mọi người trên thẻ', /(Ma Sói|Dân làng|Tiên tri)/.test(await G.locator('.lsgr').innerText()));
  ok('lịch sử ván được lưu', !!Object.keys((hub.tree.mprooms[code] || {}).history || {}).length);
  const ov = await G.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok('mobile 390px không tràn ngang', ov);
  ok('không lỗi JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
