// Phiêu lưu Tiếng Anh 10: đọc đề, link giao bài, chơi trọn vòng (đường + trùm), tim/xu/sao, chứng chỉ, mã hoàn thành.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8136);
  const U = 'http://localhost:8136/index.html', b = await chromium.launch(), errs = [], ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(m.text())); p.on('dialog', d => d.accept());
  await p.goto(U + '#/game/english10'); await p.waitForSelector('.e10 .set');
  // ---- ngân hàng câu hỏi
  const bank = await p.evaluate(() => { const S = GV.eng10.SETS; let bad = 0; S.forEach(s => s.q.forEach(q => { if (new Set(q.slice(1, 5)).size !== 4 || q.length !== 6) bad++; })); return { sets: S.length, qs: S.reduce((a, s) => a + s.q.length, 0), bad }; });
  ok('ngân hàng: ≥ 20 bộ đề, ≥ 200 câu, mỗi câu 4 đáp án khác nhau', bank.sets >= 20 && bank.qs >= 200 && bank.bad === 0, JSON.stringify(bank));
  ok('thư viện hiển thị các bộ đề và bộ lọc', await p.locator('.set').count() === bank.sets && await p.locator('.chips button').count() >= 4);
  // ---- đọc đề
  const pr = await p.evaluate(() => { const T = GV.e10T, a = T.parseSet('Q: Hello ___\nA) a\nB) b\nC) c\nD) d\nANS: C\nGiải thích: vì sao\n\nCâu 2: Two?\nA. x\nB. y*\nC. z'), c = T.parseSet('Câu hỏi,A,B,C,D,Đáp án,Giải thích\n"Hi, ___",a,b,c,d,B,gt\nSecond,x,y,z,w,w'), j = T.parseSet('[{"q":"Q?","a":["a","b","c"],"c":"b"}]'), e = T.parseSet('Q: thiếu đáp án\nA) a\nB) b'); return { a: a.q.map(q => [q.s, q.r, q.w.length, q.e]), ae: a.errs, c: c.q.map(q => [q.s, q.r]), ce: c.errs, j: j.q.map(q => q.r), e: e.errs }; });
  ok('đọc đề dạng khối (Q/A/ANS, dấu * đánh dấu đáp án)', JSON.stringify(pr.a) === '[["Hello ___","c",3,"vì sao"],["Two?","y",2,""]]' && !pr.ae.length, JSON.stringify(pr));
  ok('đọc đề dạng CSV (có dòng tiêu đề, ngoặc kép, đáp án là chữ)', JSON.stringify(pr.c) === '[["Hi, ___","b"],["Second","w"]]', JSON.stringify(pr.c));
  ok('đọc đề JSON; báo lỗi khi thiếu đáp án đúng', JSON.stringify(pr.j) === '["b"]' && pr.e.length === 1 && /đáp án/.test(pr.e[0]), JSON.stringify(pr.e));
  const rt = await p.evaluate(async () => { const T = GV.e10T, s = { id: 'x', t: 'Đề thử', q: T.parseSet('Q: a ___?\nA) 1\nB) 2\nC) 3\nD) 4\nANS: D').q }; const enc = await T.encodeSet(s), dec = await T.decodeSet(enc); return [enc[0], dec.t, dec.q[0].r, dec.q[0].w.length, dec.custom]; });
  ok('mã hoá/giải mã link đề riêng (nén)', rt[0] === 'z' && rt[1] === 'Đề thử' && rt[2] === '4' && rt[3] === 3 && rt[4] === true, JSON.stringify(rt));
  // ---- chơi 1 bộ đề: đúng hết
  await p.fill('#nm', 'An'); await p.locator('.set').first().click();
  await p.waitForSelector('.qcard .op'); ok('vào game: có bản đồ, thanh tiến độ 10 đoạn, tim, xu, sao', await p.locator('.map > svg').count() === 1 && await p.locator('.seg i').count() === 10 && await p.locator('#hearts svg').count() === 3 && await p.locator('#coins').count() === 1);
  const solve = async (wrongIdx = []) => { let k = 0, sawBoss = false, sawMap = false; for (let i = 0; i < 10; i++) { await p.waitForSelector('.op:not([disabled])', { timeout: 8000 }); if (await p.locator('.arena').count()) sawBoss = true; if (await p.locator('.map').count()) sawMap = true; const r = await p.evaluate(() => GV.e10T.G.qs[GV.e10T.G.i].r), texts = await p.locator('.op span').allInnerTexts(); const wrong = wrongIdx.includes(i), idx = texts.findIndex(t => wrong ? t !== r : t === r); await p.locator('.op').nth(idx).click(); await p.waitForTimeout(wrong ? 2750 : 1250); if (await p.locator('.modal [data-rt]').count()) return { sawBoss, sawMap, over: true }; } return { sawBoss, sawMap }; };
  let r1 = await solve(); ok('chơi đủ 10 câu: có cả chặng đường và đấu trùm', r1.sawBoss && r1.sawMap, JSON.stringify(r1));
  await p.waitForSelector('.eres h2', { timeout: 10000 });
  const res = await p.evaluate(() => ({ h: document.querySelector('.eres h2').innerText, st: [...document.querySelectorAll('.stats b')].map(x => x.innerText), mono: [...document.querySelectorAll('.mono')].map(x => x.innerText) }));
  ok('kết quả 10/10, 100+ xu, quái vật đã hạ = 5, có 2 mã', res.st[0] === '10/10' && +res.st[2] >= 100 && res.st[4] === '5' && res.mono.length === 2 && /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(res.mono[0]) && /^[0-9A-F]{4}-[0-9A-F]{4}$/.test(res.mono[1]), JSON.stringify(res));
  const vf = await p.evaluate(m => GV.e10T.finCode(m[0], 'An', 10, 10) === m[1], res.mono); ok('mã hoàn thành khớp với tên + điểm (kiểm tra được)', vf);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dc')]); const buf = fs.readFileSync(await dl.path()); ok('tải chứng chỉ PNG', /\.png$/.test(dl.suggestedFilename()) && buf.slice(1, 4).toString() === 'PNG' && buf.length > 20000, buf.length);
  ok('đã lưu điểm cao nhất của bộ đề', await p.evaluate(() => Object.values(GV.e10T.ST.best).includes(10)));
  // ---- sai → mất tim, sai 3 lần → hết tim
  await p.click('#pa'); await p.waitForSelector('.op:not([disabled])'); const hb = await p.evaluate(() => GV.e10T.G.hearts);
  const r2 = await solve([0, 1, 2]); ok('sai 3 câu liên tiếp → hết tim, hiện chơi lại', hb === 3 && r2.over === true, JSON.stringify(r2));
  ok('hết tim có nút Chơi lại và Về thư viện', await p.locator('[data-rt]').count() === 1 && await p.locator('[data-hm]').count() === 1);
  await p.click('[data-hm]'); await p.waitForSelector('.set');
  // ---- thầy cô tạo đề riêng + link
  await p.click('.e10 [data-t]'); await p.click('[data-tb=mk]'); await p.fill('#mt', 'Kiểm tra 15 phút'); await p.fill('#mx', 'Q: Yesterday, I ___ to school.\nA) walked\nB) walk\nC) walks\nD) walking\nANS: A\n\nQ: She ___ every day.\nA) study\nB) studies\nC) studying\nD) studied\nANS: B\n\nQ: He is taller ___ me.\nA) than\nB) that\nC) as\nD) then\nANS: A');
  ok('xem trước: đọc được 3 câu', /3 câu/.test(await p.locator('#pv').innerText()));
  await p.click('#mk'); await p.waitForSelector('#out .link'); const url = (await p.locator('#out .link').innerText()).trim(); ok('tạo link giao bài (#/game/english10/c/…)', /#\/game\/english10\/c\/z/.test(url) && url.length < 1500, url.length);
  const p2 = await (await b.newContext({ viewport: { width: 390, height: 780 } })).newPage(); p2.on('pageerror', e => errs.push('p2 ' + e.message)); await p2.goto(url.replace(/^.*#/, U + '#')); 
  await p2.waitForSelector('#an', { timeout: 8000 }); ok('học sinh mở link: hỏi tên rồi vào game (không cần tài khoản)', true); await p2.fill('#an', 'Bình'); await p2.click('#go'); await p2.waitForSelector('.op', { timeout: 8000 });
  ok('link đề riêng: đúng 3 câu, đề của thầy cô', await p2.evaluate(() => GV.e10T.G.n === 3 && GV.e10T.G.set.t === 'Kiểm tra 15 phút' && GV.e10T.G.stages.length === 1), await p2.evaluate(() => JSON.stringify(GV.e10T.G.stages)));
  // link hỏng
  await p2.goto(U + '#/game/english10/c/zXXXX'); await p2.waitForSelector('.set', { timeout: 8000 }); ok('link hỏng: về thư viện, không lỗi', true);
  // ---- đề dài: bản đồ cuộn cửa sổ 12 nút
  await p2.evaluate(() => { const qs = Array.from({ length: 30 }, (_, i) => ['Q' + i + ' ___', 'a', 'b', 'c', 'd', '']); GV.e10T.start({ id: 'big', t: 'Dài', q: qs.map(a => ({ s: a[0], r: 'a', w: ['b', 'c', 'd'], e: '' })), custom: true }); }); await p2.waitForSelector('.map'); ok('đề 30 câu: bản đồ chỉ vẽ ≤ 12 nút', await p2.locator('.map g[transform] ellipse').count() <= 12 * 3 + 2);
  // ---- giao diện kiểm tra mã
  await p.click('.e10 [data-b]'); await p.waitForSelector('.set'); await p.click('.e10 [data-t]'); await p.click('[data-tb=vf]');
  await p.fill('#vn', 'An'); await p.fill('#va', res.mono[0]); await p.fill('#vs', '10'); await p.fill('#vq', '10'); await p.fill('#vc', res.mono[1]); await p.click('#vb'); ok('thầy cô kiểm tra mã: hợp lệ', /Mã khớp/.test(await p.locator('#vr').innerText()));
  await p.fill('#vs', '9'); await p.click('#vb'); ok('đổi điểm → mã không khớp', /KHÔNG khớp/.test(await p.locator('#vr').innerText()));
  console.log(errs.join('\n') || 'không có lỗi JS'); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail || errs.length ? 1 : 0);
})();
