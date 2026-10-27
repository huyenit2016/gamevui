// 4 công cụ OmniHub: máy tính 3D (bộ phân tích biểu thức), QR (giải mã lại bằng jsQR nếu có), Key Generator, Code Sandbox; kiểm tra thương hiệu OMNIHUB + chuyển EN/VI.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' }[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8148);
  const U = 'http://localhost:8148/index.html'; const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(U); await p.waitForTimeout(500);
  ok('thương hiệu OMNIHUB ở thanh trái + tiêu đề', /OMNIHUB/i.test(await p.locator('.rail .rbrand .lt').innerText()) && /OmniHub/.test(await p.title()) && !/GameVui/.test(await p.content().then(h => h.replace(/gamevui\.github|huyenit2016[^"' ]*gamevui/gi, ''))));
  // máy tính
  const ev = await p.evaluate(() => ['1+2*3', '(1+2)*3', '10/4', '50%', '-5+2', '2*(3+4)-1', '1/0', '2+', '9.5*2', '0.1+0.2'].map(e => { try { return GV.omniT.calc(e); } catch (x) { return 'ERR'; } }));
  ok('bộ tính đúng thứ tự phép toán và báo lỗi', JSON.stringify(ev) === JSON.stringify([7, 9, 2.5, 0.5, -3, 13, 'ERR', 'ERR', 19, 0.3]), JSON.stringify(ev));
  await p.goto(U + '#/tool/omni-calc'); await p.waitForSelector('.om .ck');
  for (const k of ['7', '8', '+', '5', '*', '2', '=']) await p.click(`.ck [data-k="${k}"]`);
  ok('bấm 78+5×2 = 88', (await p.locator('.ds').innerText()) === '88', await p.locator('.ds').innerText());
  await p.keyboard.press('Escape'); await p.keyboard.type('12/4'); await p.keyboard.press('Enter'); ok('bàn phím: 12/4 = 3', (await p.locator('.ds').innerText()) === '3', await p.locator('.ds').innerText());
  await p.click('.ck [data-k="/"]'); await p.click('.ck [data-k="0"]'); await p.click('.ck [data-k="="]'); ok('chia cho 0 → Error', (await p.locator('.ds').innerText()) === 'Error');
  // QR
  await p.goto(U + '#/tool/omni-qr'); await p.waitForSelector('.qc'); await p.fill('.qi', 'Xin chào OmniHub – 2026'); await p.click('.qg'); await p.waitForTimeout(500);
  const px = await p.evaluate(() => { const c = document.querySelector('.qc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height); return { w: c.width, h: c.height, data: Array.from(d.data) }; });
  ok('QR được vẽ (nhiều ô đen)', px.w > 100 && px.data.filter((v, i) => i % 4 === 0 && v < 60).length > 200);
  let jsQR = null; try { jsQR = require('jsqr'); } catch (e) {}
  if (jsQR) { const r = jsQR(new Uint8ClampedArray(px.data), px.w, px.h); ok('giải mã lại QR = nội dung gốc (tiếng Việt)', r && r.data === 'Xin chào OmniHub – 2026', r && r.data); } else console.log('SKIP giải mã QR (không có jsqr)');
  await p.evaluate(() => { document.querySelector('.qi').value = 'x'.repeat(1500); }); await p.selectOption('.qe', 'H'); await p.click('.qg'); await p.waitForTimeout(300); ok('nội dung quá dài → báo lỗi, không văng', /too long|quá dài/.test(await p.locator('.qm').innerText()));
  // Key
  await p.goto(U + '#/tool/omni-keygen'); await p.waitForSelector('.ky');
  const k1 = await p.inputValue('.ky'); ok('khoá mặc định dài 20, đủ 4 loại ký tự', k1.length === 20 && /[A-Z]/.test(k1) && /[a-z]/.test(k1) && /\d/.test(k1) && /[^A-Za-z0-9]/.test(k1), k1);
  await p.fill('.kr', '32'); await p.dispatchEvent('.kr', 'input'); const k2 = await p.inputValue('.ky'); ok('đổi độ dài 32 → khoá mới', k2.length === 32 && k2 !== k1);
  await p.uncheck('.o1'); await p.uncheck('.o2'); await p.uncheck('.o4'); await p.click('.kg'); ok('chỉ chọn số → khoá toàn chữ số', /^\d{32}$/.test(await p.inputValue('.ky')), await p.inputValue('.ky'));
  const ks = await p.evaluate(() => { const s = new Set(); for (let i = 0; i < 200; i++) { document.querySelector('.kg').click(); s.add(document.querySelector('.ky').value); } return s.size; }); ok('200 lần sinh đều khác nhau', ks === 200, ks);
  // Sandbox
  await p.goto(U + '#/tool/omni-sandbox'); await p.waitForSelector('.sc'); await p.waitForTimeout(400);
  const fr = p.frames().find(f => f !== p.mainFrame()); ok('xem trước hiển thị mẫu Hello', fr && /Hello OmniHub 3D/.test(await fr.content()));
  await p.fill('.sc', '<h1 id="x">Xin chào</h1>'); await p.click('.sr'); await p.waitForTimeout(400);
  ok('chạy mã mới trong iframe', (await p.frames().find(f => f !== p.mainFrame()).content()).includes('Xin chào'));
  ok('iframe cách ly (không allow-same-origin)', !/allow-same-origin/.test(await p.getAttribute('.sf', 'sandbox')));
  await p.fill('.sc', '<script>try{document.title="x";parent.document.body.setAttribute("data-hack","1")}catch(e){}</script>'); await p.click('.sr'); await p.waitForTimeout(400);
  ok('mã trong khung không chạm được trang chủ', !(await p.evaluate(() => document.body.hasAttribute('data-hack'))));
  // EN/VI
  await p.goto(U); await p.waitForTimeout(400); const en = await p.locator('.rail .lb').first().innerText(); await p.click('#lang'); await p.waitForTimeout(300);
  ok('chuyển EN → VI đổi chữ thanh trái', en === 'Dashboard' && (await p.locator('.rail .lb').first().innerText()) === 'Trang chủ');
  ok('không lỗi JS', errs.length === 0, errs.join('|'));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
