// Tích Đức Online: lịch âm, gõ mõ, cảnh giới, cửa hàng, quẻ, hồ cá, lưu trạng thái.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8132); // qua http: ảnh nền không làm canvas bị 'tainted' như file://
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(m.text())); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8132/index.html#/game/tichduc'); await p.waitForSelector('.td canvas'); await p.waitForTimeout(500);
  const L = await p.evaluate(() => [[29, 1, 2025], [17, 2, 2026], [10, 10, 2021], [14, 10, 2026]].map(a => { const l = GV.tdT.lunar(...a); return [l.d, l.m, l.y].join('/'); }));
  ok('lịch âm đúng (Tết 2025, Tết 2026, 5/9/2021, 5/9/2026)', JSON.stringify(L) === '["1/1/2025","1/1/2026","5/9/2021","5/9/2026"]', JSON.stringify(L));
  ok('hiện ngày âm + can chi + hoàng đạo', /\(Âm\)/.test(await p.locator('.tdd').innerText()) && /đạo/.test(await p.locator('.tdd').innerText()));
  const base = await p.evaluate(() => GV.tdT.D.m), mul = await p.evaluate(() => 1 + GV.tdT.D.mal) * (await p.evaluate(() => GV.tdT.today.special ? 2 : 1));
  await p.mouse.click(640, 400); await p.waitForTimeout(100); const m1 = await p.evaluate(() => GV.tdT.D.m);
  ok('chạm vào mõ → +x mỗi nhịp, tăng lần gõ', m1 - base === mul && await p.evaluate(() => GV.tdT.D.taps) === 1, [base, m1, mul]);
  await p.keyboard.press('Space'); ok('phím Space gõ mõ', await p.evaluate(() => GV.tdT.D.taps) === 2);
  const px = await p.evaluate(() => { const c = document.querySelector('.td canvas'), g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 400) if (d[i] > 90) n++; return n; });
  ok('canvas có vẽ cảnh (có ảnh nền chùa)', px > 60 && await p.evaluate(() => GV.tdT && true), px);
  // thăng cảnh giới
  await p.evaluate(() => { GV.tdT.D.tot = 95; GV.tdT.D.m = 95; }); for (let i = 0; i < 4; i++) await p.keyboard.press('Space'); await p.waitForTimeout(1200);
  ok('đủ 100 công đức → Định tâm', (await p.locator('.tdp .rl').innerText()).trim() === 'Định tâm', await p.locator('.tdp .rl').innerText());
  // cửa hàng
  await p.evaluate(() => { GV.tdT.D.m = 500; }); await p.click('[data-m=shop]'); await p.waitForSelector('[data-b=mal]'); await p.click('[data-b=mal]'); await p.waitForTimeout(200);
  ok('mua dùi mõ: cấp 2, trừ công đức, KHÔNG tụt cảnh giới', await p.evaluate(() => GV.tdT.D.mal === 2 && GV.tdT.D.m < 500 && GV.tdT.D.top >= 1));
  await p.click('[data-b=inc]'); ok('mua nén hương', await p.evaluate(() => GV.tdT.D.inc === 1));
  await p.click('[data-x]'); await p.evaluate(() => { GV.tdT.D.m = 1000; }); await p.click('[data-m=shop]'); await p.click('[data-s="1"]'); ok('mua + dùng nền Chùa sen', await p.evaluate(() => GV.tdT.D.skin === 1 && GV.tdT.D.own.includes(1)));
  // quẻ
  await p.click('[data-x]'); await p.click('[data-m=que]'); await p.waitForSelector('.dr'); const before = await p.evaluate(() => GV.tdT.D.m); await p.click('.dr'); await p.waitForTimeout(200);
  ok('rút quẻ: có lời quẻ, thưởng 30, chỉ 1 lần/ngày', await p.locator('.que b').count() === 1 && (await p.evaluate(() => GV.tdT.D.m)) - before >= 30 && await p.locator('.dr').isDisabled());
  // hồ cá
  await p.click('[data-x]'); await p.evaluate(() => { GV.tdT.D.m = 500; }); await p.click('[data-m=pond]'); await p.waitForSelector('[data-f]'); await p.click('[data-f]'); ok('thả cá', await p.evaluate(() => GV.tdT.D.fish === 1));
  await p.waitForTimeout(500); ok('hồ cá có vẽ', await p.evaluate(() => { const c = document.querySelector('.pond'), d = c.getContext('2d').getImageData(0, 0, 400, 200).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] > 120) n++; return n; }) > 10);
  await p.click('[data-x]');
  // toàn màn hình trên máy tính + nhạc thiền
  const bb = await p.evaluate(() => { const r = document.querySelector('.td').getBoundingClientRect(); return [r.x, r.y, Math.round(r.width), Math.round(r.height), innerWidth, innerHeight]; });
  ok('máy tính: trò chơi phủ kín màn hình', bb[0] === 0 && bb[1] === 0 && bb[2] === bb[4] && bb[3] === bb[5], JSON.stringify(bb));
  await p.click('.mu'); await p.waitForTimeout(6500);
  ok('bật nhạc thiền: AudioContext chạy, không lỗi, nút sáng', await p.evaluate(() => GV._ac && GV._ac.state === 'running') && await p.locator('.mu.on').count() === 1, await p.evaluate(() => GV._ac && GV._ac.state));
  await p.click('.mu'); ok('tắt nhạc', await p.locator('.mu.on').count() === 0);
  // thỉnh chuông + tên + lưu
  const m2 = await p.evaluate(() => GV.tdT.D.m); await p.click('.tdbell'); ok('thỉnh chuông thưởng công đức', (await p.evaluate(() => GV.tdT.D.m)) > m2);
  await p.click('[data-m=me]'); await p.fill('.nm', 'Minh'); await p.click('[data-x]');
  await p.goto('http://localhost:8132/index.html#/'); await p.waitForTimeout(300); await p.goto('http://localhost:8132/index.html#/game/tichduc'); await p.waitForSelector('.td canvas'); await p.waitForTimeout(300);
  ok('lưu trạng thái sau khi mở lại', await p.evaluate(() => GV.tdT.D.mal === 2 && GV.tdT.D.name === 'Minh' && GV.tdT.D.fish === 1 && GV.tdT.D.taps >= 6));
  // đặt lại
  await p.click('[data-m=me]'); await p.click('.rs'); ok('đặt lại tiến trình', await p.evaluate(() => GV.tdT.D.tot === 0 && GV.tdT.D.mal === 1));
  console.log(errs.join('\n') || 'không có lỗi JS'); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail || errs.length ? 1 : 0);
})();
