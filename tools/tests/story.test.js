// Story: renderer (an toàn/escape), CMS soạn + xuất bản theo slug, trang công khai story.html, 404 → /story/<slug>.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return fs.readFile(path.join(ROOT, '404.html'), (e2, d2) => r.end(d2)); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8125);
  const URL = 'http://localhost:8125/'; const b = await chromium.launch(), hub = makeHub(), errs = [];
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(name + ': ' + m.text())); p.on('dialog', d => d.accept()); await hub.attach(p, 'anon-' + name); await p.addInitScript({ path: path.join(__dirname, 'mock_shared.js') }); return p; };
  const A = await mk('admin'), G = await mk('guest'), W = await mk('stu');

  // ---- 1. Renderer: escape & lọc ----
  await G.goto(URL + 'story.html'); await G.waitForFunction(() => window.GVStory);
  const r = await G.evaluate(() => {
    const S = GVStory, evil = '<img src=x onerror=alert(1)>';
    const html = S.bodyHtml({ theme: { brand: 'red;}</style><script>x</script>', bar: '' }, blocks: [
      { type: 'text', title: evil, body: 'a **b** *c* [ok](https://a.com/x?y=1&z=2) [bad](javascript:alert(1))' },
      { type: 'image', img: 'javascript:alert(1)', cap: evil }, { type: 'image', img: 'https://ex.com/a b.png', alt: '" onload="x' },
      { type: 'hero', bg: 'url(http://evil)', img: "https://x.com/a')};alert(1);//.png", title: 't' }, { type: 'nope' }, { type: 'cta', btn: 'Go', link: 'javascript:1' }] });
    const d = document.createElement('div'); d.innerHTML = html;
    return { html, imgs: [...d.querySelectorAll('img')].map(i => i.getAttribute('src') + '|' + (i.getAttribute('onerror') || '') + '|' + (i.getAttribute('onload') || '')), links: [...d.querySelectorAll('a')].map(a => a.getAttribute('href')), scripts: d.querySelectorAll('script').length, hero: d.querySelector('.gvs-hero').getAttribute('style'), types: d.querySelectorAll('section,figure').length, theme: S.normalize({ theme: { brand: 'red;}</style>' } }).theme.brand };
  });
  ok('chữ nguy hiểm bị escape (không sinh <img onerror>)', !/<img src=x/i.test(r.html) && r.imgs.every(s => !s.includes('onerror=alert') && !/\|[^|]*onload=x/.test(s)), JSON.stringify(r.imgs));
  ok('link javascript: bị chặn, https giữ', r.links.length === 1 && /^https:\/\/a\.com\/x\?y=1&z=2$/.test(r.links[0]), JSON.stringify(r.links));
  ok('ảnh javascript: không render, ảnh https có khoảng trắng được mã hoá', r.imgs.some(s => s.startsWith('https://ex.com/a%20b.png')) && !r.imgs.some(s => s.startsWith('javascript')), JSON.stringify(r.imgs));
  ok('nền/ảnh hero không thoát khỏi style', !/alert|evil/.test(r.hero.replace(/https:\/\/x\.com[^)]*/, '')), r.hero);
  ok('không có <script> chèn vào, khối lạ bị bỏ, màu xấu về mặc định', r.scripts === 0 && r.theme === '#ff6a00', JSON.stringify([r.scripts, r.theme]));

  // ---- 2. CMS: tạo story mẫu, đặt tên, xuất bản ----
  await A.goto(URL + 'index.html#/cms'); await A.waitForSelector('[data-m=up]'); await A.click('[data-m=up]'); await A.fill('.nm', 'Admin'); await A.fill('.em', 'a@x.com'); await A.fill('.pw', '123456'); await A.fill('.sc', 'S3cretPhrase'); await A.click('.go'); await A.waitForSelector('.tabsx');
  hub.tree.setup = { secret: 'S3cretPhrase' };
  await A.waitForTimeout(400);
  if (!(await A.locator('[data-t=story]').count())) { await A.click('.sb .me'); await A.click('.rr'); await A.waitForTimeout(1500); }
  ok('admin thấy tab Câu chuyện', await A.locator('[data-t=story]').count() === 1);
  await A.click('[data-t=story]'); await A.waitForSelector('.nw'); await A.click('.nw'); await A.waitForSelector('.sty-top');
  ok('story mẫu có 7 khối', await A.locator('.sty-b').count() === 7, await A.locator('.sty-b').count());
  await A.fill('.ti', 'Hành trình 29 năm: Kết nối!'); ok('slug tự sinh từ tiêu đề (bỏ dấu)', await A.inputValue('.sg') === 'hanh-trinh-29-nam-ket-noi', await A.inputValue('.sg'));
  await A.waitForSelector('.pf'); await A.waitForTimeout(800);
  const fr = A.frameLocator('.pf');
  ok('xem thử trong iframe có hero + scrolly', await fr.locator('.gvs-hero h1').count() === 1 && await fr.locator('.gvs-scrolly').count() === 1);
  // sửa tiêu đề khối hero → xem thử cập nhật
  await A.locator('.sty-b').first().click(); await A.waitForTimeout(200);
  await A.locator('.sty-form [data-p=title]').fill('TIÊU ĐỀ MỚI'); await A.waitForTimeout(600);
  ok('sửa khối → xem thử cập nhật ngay', (await fr.locator('.gvs-hero h1').innerText()).trim() === 'TIÊU ĐỀ MỚI');
  // thêm khối ảnh, sắp xếp lên, nhân đôi, xoá
  await A.selectOption('.sty-add', 'image'); await A.waitForTimeout(300); const n8 = await A.locator('.sty-b').count();
  await A.locator('.sty-b.on [data-a=dup]').click(); await A.locator('.sty-b.on [data-a=del]').click(); await A.waitForTimeout(200);
  ok('thêm khối ảnh (8), nhân đôi rồi xoá giữ 8', n8 === 8 && await A.locator('.sty-b').count() === 8, n8);
  // sửa mục trong danh sách của scrolly: thêm bước
  await A.locator('.sty-b', { hasText: 'Cuộn kể chuyện' }).click(); await A.waitForTimeout(200); const steps0 = await A.locator('.sty-it').count(); await A.locator('[data-a=ia]').click(); await A.waitForTimeout(200);
  ok('thêm bước vào khung cuộn', steps0 === 3 && await A.locator('.sty-it').count() === 4, steps0);
  await A.click('.sv'); await A.waitForTimeout(800);
  let metas = Object.entries(hub.tree.stories && hub.tree.stories.meta || {});
  ok('lưu bản nháp: meta + data + slug', metas.length === 1 && metas[0][1].pub === false && hub.tree.stories.slugs['hanh-trinh-29-nam-ket-noi'] === metas[0][0] && typeof hub.tree.stories.data[metas[0][0]] === 'string', JSON.stringify(hub.tree.stories).slice(0, 200));
  const sid = metas[0][0];
  // (quyền đọc bản nháp do database.rules.json kiểm soát – xem rules.test.js; mock này không chạy Rules)
  // xuất bản
  await A.check('.pu'); await A.click('.sv'); await A.waitForTimeout(800);
  ok('xuất bản: pub=true + pubAt', hub.tree.stories.meta[sid].pub === true && !!hub.tree.stories.meta[sid].pubAt);
  ok('nút Mở trang trỏ tới story.html?s=slug', (await A.getAttribute('.vw', 'href')).endsWith('story.html?s=hanh-trinh-29-nam-ket-noi'), await A.getAttribute('.vw', 'href'));

  // ---- 3. Trang công khai ----
  await G.goto(URL + 'story.html?s=hanh-trinh-29-nam-ket-noi'); await G.waitForSelector('.gvs-hero', { timeout: 8000 });
  ok('khách xem trang theo slug: tiêu đề + title tab', (await G.locator('.gvs-hero h1').innerText()).trim() === 'TIÊU ĐỀ MỚI' && (await G.title()).startsWith('Hành trình 29 năm'), await G.title());
  ok('đủ khối (8) + thanh tiến độ', await G.locator('#app > section, #app > figure, #app > blockquote').count() === 8 && await G.locator('.gvs-prog').count() === 1, await G.locator('#app > *').count());
  // cuộn: scrolly đổi nhãn, số đếm chạy
  await G.evaluate(() => document.querySelector('.gvs-scrolly').scrollIntoView()); await G.waitForTimeout(500);
  await G.evaluate(() => { const s = document.querySelectorAll('.gvs-step')[1]; window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight / 2 + s.offsetHeight / 2); }); await G.waitForTimeout(900);
  ok('khung cuộn dính đổi nhãn theo bước', (await G.locator('.gvs-sl').first().innerText()).trim() === '2008', await G.locator('.gvs-sl').first().innerText());
  await G.evaluate(() => document.querySelector('.gvs-stats').scrollIntoView({ block: 'center' })); await G.waitForTimeout(2200);
  ok('số liệu đếm lên tới giá trị đích', (await G.locator('[data-count]').first().innerText()).trim() === '29', await G.locator('[data-count]').first().innerText());
  ok('thanh tiến độ đọc chạy', parseFloat(await G.evaluate(() => document.querySelector('.gvs-prog i').style.width)) > 5);
  // danh sách công khai
  await G.goto(URL + 'story.html'); await G.waitForSelector('.sx-c'); ok('trang danh sách liệt kê story đã xuất bản', await G.locator('.sx-c').count() === 1);
  // slug không tồn tại / sai định dạng
  await G.goto(URL + 'story.html?s=khong-co'); await G.waitForSelector('.sx-msg'); ok('slug không tồn tại → thông báo', /Không tìm thấy/.test(await G.locator('.sx-msg').innerText()));
  await G.goto(URL + 'story.html?s=' + encodeURIComponent('../x')); await G.waitForSelector('.sx-msg'); ok('slug sai định dạng bị từ chối', /không hợp lệ/.test(await G.locator('.sx-msg').innerText()));
  // /story/<slug> qua 404.html
  await G.goto(URL + 'story/hanh-trinh-29-nam-ket-noi'); await G.waitForSelector('.gvs-hero', { timeout: 8000 }); ok('/story/<slug> (404.html) chuyển tới trang story', G.url().includes('story.html?s=hanh-trinh-29-nam-ket-noi'), G.url());

  // ---- 4. Slug trùng, đổi slug, xoá ----
  await A.click('.bk'); await A.waitForSelector('.nw'); await A.click('.ne'); await A.waitForSelector('.sty-top');
  await A.fill('.ti', 'Câu chuyện khác'); await A.fill('.sg', 'hanh-trinh-29-nam-ket-noi'); await A.click('.sv'); await A.waitForTimeout(500);
  ok('trùng slug bị từ chối, không ghi', /đã được story khác dùng/.test(await A.locator('.sty-msg').innerText()) && Object.keys(hub.tree.stories.meta).length === 1, await A.locator('.sty-msg').innerText());
  await A.fill('.sg', 'ab'); await A.click('.sv'); await A.waitForTimeout(300); ok('slug quá ngắn bị từ chối', /tối thiểu 3/.test(await A.locator('.sty-msg').innerText()));
  await A.fill('.sg', 'cau-chuyen-khac'); await A.click('.sv'); await A.waitForTimeout(700); ok('story thứ 2 lưu được', Object.keys(hub.tree.stories.meta).length === 2);
  await A.click('.bk'); await A.waitForSelector('.ll tr'); await A.locator(`[data-e="${sid}"]`).click(); await A.waitForSelector('.sty-top');
  await A.fill('.sg', 'ten-moi'); await A.click('.sv'); await A.waitForTimeout(700);
  ok('đổi slug: slug cũ bị gỡ, slug mới trỏ đúng id', !hub.tree.stories.slugs['hanh-trinh-29-nam-ket-noi'] && hub.tree.stories.slugs['ten-moi'] === sid);
  await A.click('.bk'); await A.waitForSelector('.ll tr'); await A.locator(`[data-x="${sid}"]`).click(); await A.waitForTimeout(700);
  ok('xoá story: meta + data + slug biến mất', !hub.tree.stories.meta[sid] && !hub.tree.stories.data[sid] && !hub.tree.stories.slugs['ten-moi']);

  // ---- 5. Học sinh không thấy tab ----
  await W.goto(URL + 'index.html#/cms'); await W.waitForSelector('[data-m=up]'); await W.click('[data-m=up]'); await W.fill('.nm', 'HS'); await W.fill('.em', 's@x.com'); await W.fill('.pw', '123456'); await W.click('.go'); await W.waitForSelector('.tabsx');
  ok('học sinh không thấy tab Câu chuyện', await W.locator('[data-t=story]').count() === 0);

  console.log(errs.join('\n') || 'không có lỗi JS'); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail || errs.length ? 1 : 0);
})();
