// Trang /claude-learning: trang chủ, bài học (sơ đồ SVG dựng sẵn), mục lục, tìm kiếm, tiến độ, lộ trình, file mẫu, tải offline, an toàn nội dung.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8134);
  const B = 'http://localhost:8134/claude-learning/', b = await chromium.launch(), errs = [], ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(m.text()));
  await p.goto(B); await p.waitForSelector('.hero');
  ok('trang chủ: tiêu đề, 10 thẻ bài, 4 lộ trình mục tiêu', /Claude Code/.test(await p.locator('.hero h1').innerText()) && await p.locator('.card[href^="#/d/0"], .card[href^="#/d/10"]').count() === 10 && await p.locator('.card[href^="#/t/"]').count() === 4, await p.locator('.card').count());
  ok('thanh bên có 10 bài + 3 tài liệu + 4 mục tiêu', await p.locator('.side a[href^="#/d/"]').count() === 13 && await p.locator('.side a[href^="#/t/"]').count() === 4);
  // tự đánh giá
  for (const i of [0, 1, 2, 3]) await p.locator(`.quiz input[data-i="${i}"]`).check(); ok('tự đánh giá: 4/8 → Cấp 2, gợi ý bài Skills', /Cấp 2/.test(await p.locator('#qres').innerText()) && /Skills/.test(await p.locator('#qres').innerText()), await p.locator('#qres').innerText());
  // bài học có sơ đồ
  await p.goto(B + '#/d/04-subagents'); await p.waitForSelector('.md h2'); await p.waitForTimeout(300);
  ok('bài Subagents: có sơ đồ Mermaid dạng SVG dựng sẵn', await p.locator('figure.mmd svg').count() >= 5, await p.locator('figure.mmd svg').count());
  ok('bài học có mục lục bên phải, có nút Chép trong khối mã', await p.locator('#toc a').count() > 10 && await p.locator('.md pre .cp').count() > 5);
  const link = await p.evaluate(() => [...document.querySelectorAll('#md a')].filter(a => a.getAttribute('href').startsWith('#/d/')).length); ok('liên kết nội bộ giữa các bài hoạt động (#/d/…)', link >= 3, link);
  ok('không còn liên kết GitHub, không có <script> trong nội dung', await p.evaluate(() => !document.querySelector('#md a[href*="github"]') && !document.querySelector('#md script, #md [onerror], #md iframe')));
  // đánh dấu hoàn thành + tiến độ
  await p.click('#dn'); await p.waitForTimeout(300); ok('đánh dấu hoàn thành: nút đổi, thanh bên hiện ✓, lưu localStorage', /Đã hoàn thành/.test(await p.locator('#dn').innerText()) && await p.locator('.side a.on .ck').count() === 1 && await p.evaluate(() => JSON.parse(localStorage.getItem('gv_claude_learning')).done['04-subagents'] === true));
  // neo mục
  await p.goto(B + '#/d/roadmap/milestone-2a-tự-động-hóa-skills--hooks'); await p.waitForSelector('.md h2'); await p.waitForTimeout(600); ok('liên kết có neo cuộn tới đúng mục', await p.evaluate(() => { const h = document.getElementById('h-milestone-2a-tự-động-hóa-skills--hooks'); return !!h && Math.abs(h.getBoundingClientRect().top) < 200; }));
  // tìm kiếm
  await p.fill('#q', 'hooks'); await p.waitForSelector('#res.on a'); const rs = await p.locator('#res a').count(); ok('tìm kiếm "hooks" có kết quả', rs >= 3, rs);
  await p.fill('#q', 'ahihi-khong-co'); await p.waitForTimeout(400); ok('tìm không thấy → thông báo', /Không tìm thấy/.test(await p.locator('#res').innerText()));
  await p.fill('#q', 'CLAUDE.md'); await p.waitForSelector('#res.on a'); await p.locator('#res a').first().click(); await p.waitForTimeout(500); ok('bấm kết quả tìm kiếm mở bài', /#\/d\//.test(p.url()), p.url());
  // lộ trình mục tiêu
  for (const t of ['ai', 'mobile', 'web', 'sa']) { await p.goto(B + '#/t/' + t); await p.waitForSelector('.steps'); ok('lộ trình ' + t + ': có các bước và bài thực hành', await p.locator('.step').count() >= 6 && await p.locator('.pr').count() === 3); }
  // file mẫu
  await p.goto(B + '#/x/01-slash-commands'); await p.waitForSelector('.exl a'); const n = await p.locator('.exl a').count(); ok('module 01 có file mẫu', n >= 5, n);
  await p.locator('.exl a').first().click(); await p.waitForSelector('#cx'); ok('xem file mẫu + nút chép/tải', (await p.locator('#cx').innerText()).length > 50 && await p.locator('#cpx').count() === 1 && await p.locator('#dlx').count() === 1);
  // bản offline
  await p.goto(B); await p.waitForSelector('#off'); const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('#off')]); const f = await dl.path(); const html = fs.readFileSync(f, 'utf8');
  ok('tải bản offline: 1 file .html có đủ bài, sơ đồ, bản quyền MIT', /offline\.html$/.test(dl.suggestedFilename()) && (html.match(/<section id="sec-/g) || []).length === 13 && (html.match(/<svg/g) || []).length >= 25 && /MIT License/.test(html) && html.length > 1e6, [html.length, (html.match(/<svg/g) || []).length]);
  // điện thoại
  await p.setViewportSize({ width: 390, height: 800 }); await p.goto(B + '#/d/02-memory'); await p.waitForSelector('.md h2'); const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok('điện thoại: không tràn ngang', ov <= 2, ov);
  await p.click('.menu'); await p.waitForTimeout(300); ok('điện thoại: menu trượt mở được', await p.evaluate(() => document.body.classList.contains('nav')));
  // trang chủ GameVui có mục
  await p.goto('http://localhost:8134/index.html#/tool/claude-learning'); await p.waitForTimeout(500); ok('GameVui có mục Claude How To dẫn sang /claude-learning/', await p.locator('a[href="claude-learning/"]').count() === 1);
  console.log(errs.join('\n') || 'không có lỗi JS'); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail || errs.length ? 1 : 0);
})();
