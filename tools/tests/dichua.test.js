// Đi Chùa Online (app/dichuaonline): bàn thờ, lời nguyện realtime, đếm, lịch từ cấu hình, quà TikTok → tên + avatar + lời nguyện tự tạo, chế độ LIVE.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8181);
  const URL = 'http://localhost:8181/app/dichuaonline/'; const b = await chromium.launch(), hub = makeHub(), errs = [];
  const mk = async (name, w) => { const ctx = await b.newContext({ viewport: { width: w || 1300, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(name + ': ' + m.text())); await hub.attach(p, 'anon-' + name); await p.addInitScript({ path: path.join(__dirname, 'mock_shared.js') }); return p; };
  hub.tree.dichua = { config: { tiktokUser: '@chuaonline', quote: 'Tâm bình thì thế giới bình.', schedule: [{ t: '04:00', h: 'Thiền sáng', s: 'Ngồi thiền' }, { t: '19:30', h: 'Tụng kinh tối', s: '' }] } };
  const A = await mk('a'), B = await mk('b');
  await A.goto(URL); await A.waitForSelector('.scene'); await A.waitForTimeout(900);
  ok('trang tải, tiêu đề + chánh điện', /Đi Chùa Online/.test(await A.title()) && await A.locator('.buddha').count() === 1);
  ok('lịch + lời trích lấy từ cấu hình', /Thiền sáng/.test(await A.locator('#schedule').innerText()) && /Tâm bình/.test(await A.locator('#quote').innerText()));
  ok('liên kết LIVE theo @tên TikTok', (await A.locator('#openLive').getAttribute('href')) === 'https://www.tiktok.com/@chuaonline/live');
  const f0 = await A.locator('#vase i').count();
  await A.click('[data-a=flower]'); await A.waitForTimeout(600); ok('dâng hoa: thêm hoa + đếm', await A.locator('#vase i').count() === f0 + 1 && /1 đóa sen/.test(await A.locator('#statLine').innerText()));
  await A.click('[data-a=incense]'); await A.waitForTimeout(600); ok('thắp nhang: có nén nhang cháy', await A.locator('.stick:not(.out)').count() === 1 && /1 nén nhang/.test(await A.locator('#statLine').innerText()));
  await A.click('[data-a=bell]'); await A.waitForTimeout(600); ok('thỉnh chuông được đếm', /1 hồi chuông/.test(await A.locator('#statLine').innerText()));
  await A.click('[data-a=music]'); await A.waitForTimeout(300); ok('nhạc thiền bật', await A.locator('#btnMusic.on').count() === 1);
  await A.click('[data-a=music]');
  await B.goto(URL); await B.waitForSelector('.scene'); await B.waitForTimeout(900);
  ok('hiện diện: 2 người', /2 người/.test(await A.locator('#onlineTag').innerText()), await A.locator('#onlineTag').innerText());
  await B.fill('#person', 'Liên'); await B.fill('#wish', 'Con xin cầu bình an <b>cho mọi người</b>'); await B.click('#prayerForm button'); await A.waitForTimeout(900);
  const w = await A.locator('#wishes').innerText(); ok('lời nguyện realtime sang người khác + escape HTML', /Liên/.test(w) && /cầu bình an <b>/.test(w) && await A.locator('#wishes b b').count() === 0, w);
  // quà TikTok → hiện tên + avatar + lời nguyện lành tự tạo
  await A.evaluate(() => DCO.gift({ u: 'Minh Anh', id: 'minhanh', av: 'https://p16.tiktokcdn.com/x.jpg', g: 'Rose', n: 5, d: 5 }));
  await A.waitForSelector('#giftPop:not([hidden])'); const t = await A.locator('#giftPop').innerText();
  ok('quà: hiện tên + tên quà + số lượng', /Minh Anh/.test(t) && /Rose/.test(t) && /5/.test(t), t);
  ok('quà: lời nguyện lành chứa tên người tặng', /Minh Anh/.test(await A.locator('#gpText').innerText()) && /(Phật|Bồ Tát)/.test(await A.locator('#gpText').innerText()));
  ok('quà: avatar https dùng được, http bị loại', (await A.locator('#gpAv').getAttribute('src')).startsWith('https://p16.tiktokcdn.com') && await A.evaluate(() => DCO.gift({ u: 'X', g: 'Rose', av: 'javascript:alert(1)' }).av === ''));
  ok('bảng công đức ghi người tặng', /Minh Anh/.test(await A.locator('#donorList').innerText()));
  ok('lời nguyện khác nhau theo người/quà', await A.evaluate(() => new Set(Array.from({ length: 12 }, () => DCO.blessing({ u: 'An', g: 'Hoa', n: 1, d: 100, at: Date.now() }))).size > 3));
  // quà đẩy qua Firebase (relay) → trang khác thấy
  await B.evaluate(async () => { const f = await GV.fbInfo().fb(); await f.db.ref('dichua/gifts').push({ u: 'Quốc Bảo', g: 'Galaxy', n: 1, d: 1000, at: Date.now(), av: '' }); });
  await A.waitForFunction(() => /Quốc Bảo/.test(document.querySelector('#donorList').innerText), null, { timeout: 15000 }).catch(() => {}); ok('quà qua Firebase (relay) hiện ở trang khác (xếp hàng sau quà trước)', /Quốc Bảo/.test(await A.locator('#donorList').innerText()));
  ok('liên kết TikTok chỉ nhận tiktok.com', await A.evaluate(() => DCO.parseTikTok('https://tiktok.com.evil.com/x') === '' && DCO.parseTikTok('https://www.tiktok.com/@a/live') !== ''));
  // chế độ LIVE
  const L = await mk('live', 1280); await L.goto(URL + '?live=1'); await L.waitForSelector('.scene'); await L.waitForTimeout(700);
  ok('LIVE: ẩn tiêu đề/form, cảnh phủ kín màn hình', !(await L.locator('header.top').isVisible()) && !(await L.locator('#prayerForm').isVisible()) && (await L.locator('#scene').boundingBox()).width >= 1270);
  const M = await mk('m', 390); await M.goto(URL); await M.waitForSelector('.scene'); await M.waitForTimeout(600);
  ok('mobile 390px không tràn ngang', await M.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok('không lỗi JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
